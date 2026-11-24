'use server'

/**
 * Factura de labor en PDF.
 *
 * Toma las horas del periodo (las mismas que alimentan la pantalla de nomina) y
 * arma una linea por semana. El dibujo vive en src/lib/laborInvoicePdf.ts.
 *
 * Son DOS pasos a proposito: `previewLaborInvoice` arma el PDF y no toca la
 * base, y `saveLaborInvoice` es el que registra. Guardar al generar convertia
 * cada prueba en una factura emitida, y el numero de factura es unico: una
 * prueba fallida dejaba el numero ocupado.
 *
 * El guardado NO recibe los montos desde el navegador: los vuelve a calcular en
 * el servidor con los mismos parametros. Un registro de cobranza no se arma con
 * cifras que viajaron por el cliente.
 */

import { createClient } from '@/utils/supabase/server'
import type { Json } from '@/types/supabase'
import {
  buildLaborInvoicePdf,
  type InvoiceLine,
  type InvoiceParty,
  type InvoiceDetail,
  type DetailDay,
  type DetailExpense,
} from '@/lib/laborInvoicePdf'

export interface InvoiceOptions {
  customerId: string | null
  invoiceNumber: string
  invoiceDate: string
  paymentTerms: string
  projectOrPo: string
  /** Descripcion del reembolso; vacia = sin linea de reembolso. */
  reimbursementLabel: string
  reimbursementAmount: number
  otherOrTax: number
  notes: string
  /** Adjunta la hoja de respaldo dia por dia. */
  includeDetail: boolean
}

/** Lo que se muestra junto al PDF antes de decidir si se guarda. */
export interface InvoiceSummary {
  totalHours: number
  laborSubtotal: number
  reimbursements: number
  otherOrTax: number
  total: number
  weekCount: number
  dayCount: number
  expenseCount: number
}

const round2 = (n: number) => Math.round(n * 100) / 100
const round4 = (n: number) => Math.round(n * 10000) / 10000

function fmt(isoDay: string): string {
  const [y, m, d] = isoDay.split('-').map(Number)
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`
}

function weekEnd(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + 6)
  return dt.toISOString().slice(0, 10)
}

/** Sugiere NQ-<año>-<mesdia>-01 a partir de la fecha de factura. */
export async function suggestInvoiceNumber(invoiceDate: string): Promise<string> {
  const compact = invoiceDate.replace(/-/g, '').slice(0, 8)
  return `NQ-${compact.slice(0, 4)}-${compact.slice(4, 8)}-01`
}

/** Dia local y hora local de un instante, en la zona del trabajador. */
function localParts(iso: string, tz: string): { day: string; time: string } {
  const d = new Date(iso)
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
  return { day, time }
}

interface Built {
  bytes: Uint8Array
  lines: InvoiceLine[]
  detail?: InvoiceDetail
  summary: InvoiceSummary
  invoiceNumber: string
  orgId: string
  /** Las dos partes tal como salieron en el PDF; se guardan para poder reabrirlo igual. */
  parties: { from: InvoiceParty; billTo: InvoiceParty }
}

/**
 * Todo el calculo y el dibujo, sin tocar la base. Lo comparten la vista previa
 * y el guardado, para que no existan dos formas de llegar al total.
 */
async function build(
  from: string,
  to: string,
  options: InvoiceOptions,
): Promise<{ built?: Built; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: memberRows } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('profile_id', user.id)
    .limit(1)

  const membership = memberRows?.[0]
  if (!membership) return { error: 'No organization for the current user.' }
  // Una factura expone tarifas y costo de labor, asi que se limita igual que la nomina.
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    return { error: 'Only owners and admins can issue an invoice.' }
  }

  const orgId = membership.organization_id

  const [{ data: org }, weeksRes, customerRes] = await Promise.all([
    supabase.from('organizations').select('name, address, contact_phone, contact_email').eq('id', orgId).single(),
    supabase.rpc('payroll_summary', { p_organization_id: orgId, p_from: from, p_to: to }),
    options.customerId
      ? supabase.from('customers')
          .select('name, address, contact_name, contact_phone, contact_email')
          .eq('id', options.customerId).maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
  ])

  const weeks = weeksRes.data ?? []
  if (weeks.length === 0) {
    return { error: `No hours recorded between ${fmt(from)} and ${fmt(to)}.` }
  }

  // Una linea por semana, sumando a toda la cuadrilla. La tarifa se muestra solo
  // cuando es la misma para todos; con tarifas distintas un unico numero mentiria.
  //
  // Las horas se acumulan SIN redondear. Redondear cada tramo antes de sumarlo
  // pierde centesimas en cada jornada, y esa perdida siempre cae del lado de
  // quien paga. El redondeo va al final, y solo sobre el dinero.
  const byWeek = new Map<string, { hours: number; labor: number; rates: Set<number> }>()
  for (const w of weeks) {
    const key = String(w.week_start)
    const cur = byWeek.get(key) ?? { hours: 0, labor: 0, rates: new Set<number>() }
    cur.hours += Number(w.total_hours || 0)
    cur.labor += Number(w.total_cost || 0)
    if (w.hourly_rate != null) cur.rates.add(Number(w.hourly_rate))
    byWeek.set(key, cur)
  }

  const lines: InvoiceLine[] = [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, v]) => ({
      description: `${fmt(week)} - ${fmt(weekEnd(week))} - Crew Labor`,
      hours: round4(v.hours),
      rate: v.rates.size === 1 ? [...v.rates][0] : 0,
      labor: round2(v.labor),
      reimbursement: 0,
      lineTotal: round2(v.labor),
    }))

  const weekCount = lines.length
  const totalHours = round4([...byWeek.values()].reduce((s, v) => s + v.hours, 0))
  const laborSubtotal = round2([...byWeek.values()].reduce((s, v) => s + v.labor, 0))

  const reimbursements = round2(options.reimbursementAmount || 0)
  if (reimbursements > 0 && options.reimbursementLabel.trim()) {
    lines.push({
      description: options.reimbursementLabel.trim(),
      hours: 0, rate: 0, labor: 0,
      reimbursement: reimbursements,
      lineTotal: reimbursements,
    })
  }

  const otherOrTax = round2(options.otherOrTax || 0)
  const balanceDue = round2(laborSubtotal + reimbursements + otherOrTax)

  // ---- Anexo -----------------------------------------------------------------
  let detail: InvoiceDetail | undefined
  if (options.includeDetail) {
    const [entriesRes, expensesRes, projectsRes, profilesRes] = await Promise.all([
      supabase.from('time_entries')
        .select('profile_id, project_id, clock_in, clock_out, paused_minutes')
        .eq('organization_id', orgId)
        .not('clock_out', 'is', null)
        .gte('clock_in', `${from}T00:00:00Z`)
        .lte('clock_in', `${to}T23:59:59Z`)
        .order('clock_in'),
      supabase.from('project_expenses')
        .select('spent_on, vendor, description, amount, project_id')
        .eq('organization_id', orgId)
        .eq('billable', true)
        .gte('spent_on', from).lte('spent_on', to)
        .order('spent_on'),
      supabase.from('projects').select('id, name').eq('organization_id', orgId),
      supabase.from('profiles').select('id, full_name, email, time_zone'),
    ])

    const projectName = new Map((projectsRes.data ?? []).map(p => [p.id, p.name as string]))
    const person = new Map(
      (profilesRes.data ?? []).map(p => [
        p.id,
        {
          name: (p.full_name as string | null) || (p.email as string | null) || 'Unknown',
          tz: (p.time_zone as string | null) || 'America/New_York',
        },
      ]),
    )

    const days: DetailDay[] = (entriesRes.data ?? []).map(e => {
      const who = person.get(e.profile_id) ?? { name: 'Unknown', tz: 'America/New_York' }
      const inP = localParts(e.clock_in as string, who.tz)
      const outP = localParts(e.clock_out as string, who.tz)
      const hours =
        (new Date(e.clock_out as string).getTime() - new Date(e.clock_in as string).getTime()) / 3600000
        - Number(e.paused_minutes || 0) / 60
      return {
        date: inP.day,
        employee: who.name,
        project: e.project_id ? (projectName.get(e.project_id) ?? '—') : '—',
        clockIn: inP.time,
        clockOut: outP.time,
        hours: round4(Math.max(hours, 0)),
      }
    })
    // El dia local puede caer fuera del rango cuando el turno cruza medianoche.
    const inRange = days.filter(d => d.date >= from && d.date <= to)

    const expenses: DetailExpense[] = (expensesRes.data ?? []).map(x => ({
      date: x.spent_on as string,
      vendor: (x.vendor as string | null) ?? '',
      description: (x.description as string | null) ?? '',
      project: x.project_id ? (projectName.get(x.project_id) ?? '') : '',
      amount: round2(Number(x.amount || 0)),
    }))

    detail = { days: inRange, expenses }
  }

  // Se corta SOLO por salto de linea. Cortar tambien por coma partia
  // "Acworth, GA 30102" en dos renglones; el dibujante ya envuelve lo que no cabe.
  const splitAddress = (a: string | null | undefined): string[] =>
    (a ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 4)

  const fromParty: InvoiceParty = {
    name: org?.name ?? 'Organization',
    addressLines: splitAddress(org?.address),
    phone: org?.contact_phone ?? null,
    email: org?.contact_email ?? null,
    website: null,
  }

  const customer = customerRes.data
  const billTo: InvoiceParty = customer
    ? {
        name: customer.name,
        addressLines: splitAddress(customer.address),
        phone: customer.contact_phone,
        email: customer.contact_email,
      }
    : { name: 'Customer not selected', addressLines: [] }

  const invoiceNumber = options.invoiceNumber.trim() || 'DRAFT'

  const bytes = await buildLaborInvoicePdf({
    invoiceNumber,
    invoiceDate: options.invoiceDate,
    paymentTerms: options.paymentTerms,
    projectOrPo: options.projectOrPo,
    billTo,
    from: fromParty,
    lines,
    laborSubtotal,
    reimbursements,
    otherOrTax,
    balanceDue,
    notes: options.notes,
    detail,
  })

  return {
    built: {
      bytes,
      lines,
      detail,
      invoiceNumber,
      orgId,
      parties: { from: fromParty, billTo },
      summary: {
        totalHours,
        laborSubtotal,
        reimbursements,
        otherOrTax,
        total: balanceDue,
        weekCount,
        dayCount: detail?.days.length ?? 0,
        expenseCount: detail?.expenses.length ?? 0,
      },
    },
  }
}

/**
 * Arma el PDF para mirarlo. No escribe nada: el numero de factura queda libre
 * hasta que se decida guardar.
 */
export async function previewLaborInvoice(
  from: string,
  to: string,
  options: InvoiceOptions,
): Promise<{ base64?: string; fileName?: string; summary?: InvoiceSummary; alreadyUsed?: boolean; error?: string }> {
  const { built, error } = await build(from, to, options)
  if (error || !built) return { error: error ?? 'Could not build the invoice.' }

  // Avisar ANTES de guardar es la diferencia entre corregir el numero y
  // sobrescribir una factura que ya se envio.
  const supabase = await createClient()
  const { data: clash } = await supabase
    .from('labor_invoices')
    .select('id')
    .eq('organization_id', built.orgId)
    .eq('invoice_number', built.invoiceNumber)
    .maybeSingle()

  const safe = built.invoiceNumber.replace(/[^A-Za-z0-9_-]+/g, '-')
  return {
    base64: Buffer.from(built.bytes).toString('base64'),
    fileName: `${safe}.pdf`,
    summary: built.summary,
    alreadyUsed: Boolean(clash),
  }
}

/**
 * Registra la factura. Vuelve a calcular en el servidor con los mismos
 * parametros en vez de confiar en cifras enviadas por el navegador.
 */
export async function saveLaborInvoice(
  from: string,
  to: string,
  options: InvoiceOptions,
): Promise<{ invoiceId?: string; summary?: InvoiceSummary; error?: string }> {
  const { built, error } = await build(from, to, options)
  if (error || !built) return { error: error ?? 'Could not build the invoice.' }

  const supabase = await createClient()
  const { data: saved, error: saveError } = await supabase
    .from('labor_invoices')
    .upsert({
      organization_id: built.orgId,
      customer_id: options.customerId || null,
      invoice_number: built.invoiceNumber,
      invoice_date: options.invoiceDate,
      period_from: from,
      period_to: to,
      payment_terms: options.paymentTerms,
      project_or_po: options.projectOrPo,
      total_hours: built.summary.totalHours,
      labor_subtotal: built.summary.laborSubtotal,
      reimbursements: built.summary.reimbursements,
      other_or_tax: built.summary.otherOrTax,
      total: built.summary.total,
      notes: options.notes,
      // La columna es jsonb y el tipo generado la expone como Json. El objeto es
      // JSON puro (numeros, strings y arreglos), asi que el cast es seguro.
      detail: {
        lines: built.lines,
        days: built.detail?.days ?? [],
        expenses: built.detail?.expenses ?? [],
        // Quien factura y a quien, congelado: el historial reabre el PDF con esto
        // y no con los datos actuales de la empresa o del cliente.
        parties: built.parties,
      } as unknown as Json,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'organization_id,invoice_number' })
    .select('id')
    .single()

  if (saveError) return { error: saveError.message }
  return { invoiceId: saved?.id, summary: built.summary }
}

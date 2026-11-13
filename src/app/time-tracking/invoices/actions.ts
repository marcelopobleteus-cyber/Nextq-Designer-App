'use server'

/**
 * Historial de facturas de labor.
 *
 * Solo lectura y cambio de estado. Los montos NO se recalculan aqui: la fila
 * guarda la foto del calculo al momento de emitir, y esa es justamente la razon
 * de que el historial sirva como respaldo. Si se recalculara, una correccion de
 * horas de hoy cambiaria el monto de una factura que ya fue pagada.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import {
  buildLaborInvoicePdf,
  type InvoiceLine,
  type InvoiceParty,
  type DetailDay,
  type DetailExpense,
} from '@/lib/laborInvoicePdf'

export type InvoiceStatus = 'issued' | 'sent' | 'paid' | 'void'

export interface LaborInvoiceItem {
  id: string
  invoiceNumber: string
  invoiceDate: string
  periodFrom: string
  periodTo: string
  customerName: string | null
  totalHours: number
  laborSubtotal: number
  reimbursements: number
  otherOrTax: number
  total: number
  status: InvoiceStatus
  paidOn: string | null
  /** Cuantos dias y gastos respaldan la factura, segun la foto guardada. */
  daysCount: number
  expensesCount: number
}

interface DetailShape {
  days?: unknown[]
  expenses?: unknown[]
}

async function context() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, orgId: null as string | null }

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('profile_id', user.id)
    .limit(1)

  const m = data?.[0]
  // El listado expone montos de labor; se limita igual que la nomina. La RLS de
  // labor_invoices ya lo impone, esto solo evita una consulta inutil.
  const allowed = m?.role === 'owner' || m?.role === 'admin'
  return { supabase, orgId: allowed ? (m?.organization_id as string) : null }
}

export async function getLaborInvoices(): Promise<{ invoices: LaborInvoiceItem[]; error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { invoices: [], error: 'Only owners and admins can see invoices.' }

  const { data, error } = await supabase
    .from('labor_invoices')
    .select('id, invoice_number, invoice_date, period_from, period_to, customer_id, total_hours, labor_subtotal, reimbursements, other_or_tax, total, status, paid_on, detail')
    .eq('organization_id', orgId)
    .order('period_from', { ascending: false })

  if (error) return { invoices: [], error: error.message }

  const customerIds = [...new Set((data ?? []).map(r => r.customer_id).filter(Boolean))] as string[]
  const names = new Map<string, string>()
  if (customerIds.length > 0) {
    const { data: cs } = await supabase.from('customers').select('id, name').in('id', customerIds)
    for (const c of cs ?? []) names.set(c.id, c.name)
  }

  const invoices: LaborInvoiceItem[] = (data ?? []).map(r => {
    const d = (r.detail ?? {}) as DetailShape
    return {
      id: r.id,
      invoiceNumber: r.invoice_number,
      invoiceDate: r.invoice_date,
      periodFrom: r.period_from,
      periodTo: r.period_to,
      customerName: r.customer_id ? (names.get(r.customer_id) ?? null) : null,
      totalHours: Number(r.total_hours),
      laborSubtotal: Number(r.labor_subtotal),
      reimbursements: Number(r.reimbursements),
      otherOrTax: Number(r.other_or_tax),
      total: Number(r.total),
      status: r.status as InvoiceStatus,
      paidOn: r.paid_on,
      daysCount: Array.isArray(d.days) ? d.days.length : 0,
      expensesCount: Array.isArray(d.expenses) ? d.expenses.length : 0,
    }
  })

  return { invoices }
}

/**
 * Cambia el estado. `paid` exige fecha y cualquier otro estado la borra: la
 * restriccion de la base ata las dos columnas, asi que mandarlas sueltas falla.
 */
export async function setInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  paidOn: string | null,
): Promise<{ error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { error: 'Only owners and admins can change an invoice.' }

  if (status === 'paid' && !paidOn) return { error: 'Enter the date the payment landed.' }

  const { error } = await supabase
    .from('labor_invoices')
    .update({
      status,
      paid_on: status === 'paid' ? paidOn : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/time-tracking/invoices')
  return {}
}

export async function deleteLaborInvoice(id: string): Promise<{ error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { error: 'Only owners and admins can delete an invoice.' }

  const { error } = await supabase
    .from('labor_invoices')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/time-tracking/invoices')
  return {}
}

/**
 * PDF de una factura ya cerrada.
 *
 * Se dibuja SOLO con la foto guardada al emitir (lineas, dias, gastos y totales
 * de la fila). No consulta la nomina: corregir una hora hoy no puede cambiar lo
 * que se ve de una factura que ya se envio. Lo unico que se lee en vivo son los
 * datos de contacto de la empresa y del cliente, que no son montos.
 */
export async function getClosedInvoicePdf(
  id: string,
): Promise<{ base64?: string; fileName?: string; error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { error: 'Only owners and admins can see invoices.' }

  const { data: row, error } = await supabase
    .from('labor_invoices')
    .select('invoice_number, invoice_date, payment_terms, project_or_po, customer_id, labor_subtotal, reimbursements, other_or_tax, total, notes, detail')
    .eq('id', id)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!row) return { error: 'Invoice not found.' }

  const [{ data: org }, customerRes] = await Promise.all([
    supabase.from('organizations').select('name, address, contact_phone, contact_email').eq('id', orgId).single(),
    row.customer_id
      ? supabase.from('customers')
          .select('name, address, contact_phone, contact_email')
          .eq('id', row.customer_id).maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),
  ])

  const splitAddress = (a: string | null | undefined): string[] =>
    (a ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 4)

  const from: InvoiceParty = {
    name: org?.name ?? 'Organization',
    addressLines: splitAddress(org?.address),
    phone: org?.contact_phone ?? null,
    email: org?.contact_email ?? null,
    website: null,
  }
  const c = customerRes.data
  const billTo: InvoiceParty = c
    ? { name: c.name, addressLines: splitAddress(c.address), phone: c.contact_phone, email: c.contact_email }
    : { name: 'Customer not selected', addressLines: [] }

  const d = (row.detail ?? {}) as { lines?: InvoiceLine[]; days?: DetailDay[]; expenses?: DetailExpense[] }
  const days = Array.isArray(d.days) ? d.days : []
  const expenses = Array.isArray(d.expenses) ? d.expenses : []

  const bytes = await buildLaborInvoicePdf({
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    paymentTerms: row.payment_terms ?? '',
    projectOrPo: row.project_or_po ?? '',
    billTo,
    from,
    lines: Array.isArray(d.lines) ? d.lines : [],
    laborSubtotal: Number(row.labor_subtotal),
    reimbursements: Number(row.reimbursements),
    otherOrTax: Number(row.other_or_tax),
    balanceDue: Number(row.total),
    notes: row.notes ?? '',
    // Sin dias ni gastos guardados = factura emitida sin hoja de respaldo.
    detail: days.length > 0 || expenses.length > 0 ? { days, expenses } : undefined,
  })

  const safe = row.invoice_number.replace(/[^A-Za-z0-9_-]+/g, '-')
  return { base64: Buffer.from(bytes).toString('base64'), fileName: `${safe}.pdf` }
}

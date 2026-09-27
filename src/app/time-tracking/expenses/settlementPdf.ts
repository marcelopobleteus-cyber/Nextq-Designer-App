'use server'

/**
 * Rendicion de gastos del periodo.
 *
 * Separa lo gastado del fondo de efectivo del cliente de lo puesto de bolsillo.
 * Son dos deudas distintas: el fondo se repone y el bolsillo se reembolsa, y
 * mezclarlas en un solo total es exactamente lo que hace imposible cuadrar el
 * efectivo despues.
 *
 * El PDF se arma entero en el servidor: los montos nunca viajan desde el
 * navegador, igual que en la factura de labor.
 */

import { createClient } from '@/utils/supabase/server'
import { CATEGORY_LABEL, type ExpenseCategory } from './categories'
import {
  buildExpenseSettlementPdf,
  type SettlementRow,
  type SettlementAdvance,
} from '@/lib/expenseSettlementPdf'
import { prepareReceiptJpeg } from '@/lib/receiptImage'

const BUCKET = 'expense-receipts'

/**
 * Tope de lo que puede pesar el anexo ya comprimido. La respuesta de un server
 * action en Vercel no pasa de unos 4.5 MB y viaja en base64, que agrega un
 * tercio. Si se pasa, se cortan las hojas que sobran y el informe lo dice, en
 * vez de fallar entero cuando ya esta todo calculado.
 */
const ANNEX_BUDGET = 2_600_000

const round2 = (n: number) => Math.round(n * 100) / 100

const fmt = (isoDay: string) => {
  const [y, m, d] = isoDay.split('-').map(Number)
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`
}

const addressLines = (value: string | null | undefined): string[] =>
  (value ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean)

export interface SettlementSummary {
  totalAdvanced: number
  totalFund: number
  totalOwn: number
  overspend: number
  unspent: number
  totalDue: number
  missingReceipts: number
  /** Hojas de recibo que quedaron adjuntas al informe. */
  receiptsAttached: number
}

/**
 * Devuelve el PDF en base64 para que el cliente lo baje. No escribe nada:
 * una rendicion es una foto del periodo, y se puede volver a sacar las veces
 * que haga falta sin ensuciar la base.
 */
export async function buildSettlementReport(
  from: string,
  to: string,
  customerId?: string | null,
  includeReceipts = false,
): Promise<{ base64?: string; fileName?: string; summary?: SettlementSummary; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: memberRows } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('profile_id', user.id)
    .limit(1)

  const orgId = memberRows?.[0]?.organization_id
  if (!orgId) return { error: 'No organization for the current user.' }

  const [{ data: org }, { data: rows, error }] = await Promise.all([
    supabase.from('organizations').select('name, address').eq('id', orgId).maybeSingle(),
    supabase
      .from('project_expenses')
      .select('id, project_id, spent_on, description, amount, category, vendor, notes, receipt_path, paid_by, advance_id')
      .eq('organization_id', orgId)
      .gte('spent_on', from)
      .lte('spent_on', to)
      .order('spent_on', { ascending: true }),
  ])

  if (error) return { error: error.message }
  if (!rows || rows.length === 0) {
    return { error: `No expenses between ${fmt(from)} and ${fmt(to)}.` }
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('organization_id', orgId)

  const projectName = new Map((projects ?? []).map(p => [p.id, p.name]))

  const toRow = (r: (typeof rows)[number]): SettlementRow => ({
    date: r.spent_on,
    vendor: r.vendor ?? '—',
    detail: r.description,
    project: r.project_id ? (projectName.get(r.project_id) ?? '') : '',
    reference: r.notes ?? '',
    category: CATEGORY_LABEL[r.category as ExpenseCategory] ?? r.category,
    amount: round2(Number(r.amount)),
    hasReceipt: Boolean(r.receipt_path),
  })

  // Lo que no dice explicitamente que salio del efectivo de la empresa se trata
  // como dinero propio. Equivocarse hacia ese lado deja una deuda visible en el
  // informe; equivocarse al reves hace desaparecer plata de alguien.
  const fund = rows.filter(r => r.paid_by === 'company_cash')
  const own = rows.filter(r => r.paid_by !== 'company_cash')

  const fundRows = fund.map(toRow)
  const ownRows = own.map(toRow)

  // Las fotos se bajan, se giran y se reducen una sola vez, despues de armar
  // las filas: el cuerpo del informe no depende de que esto funcione.
  let annexBytes = 0
  let receiptsAttached = 0
  let annexTruncated = false

  if (includeReceipts) {
    // Se recorre en paralelo la fila dibujada y la fila de la base. Buscar la
    // foto por fecha y proveedor fallaria el dia que haya dos cargas iguales
    // en la misma estacion.
    const pairs: [typeof fund[number], SettlementRow][] = [
      ...fund.map((src, i) => [src, fundRows[i]] as [typeof fund[number], SettlementRow]),
      ...own.map((src, i) => [src, ownRows[i]] as [typeof own[number], SettlementRow]),
    ]

    for (const [source, row] of pairs) {
      if (!source.receipt_path) continue
      if (annexBytes >= ANNEX_BUDGET) { annexTruncated = true; continue }

      const { data: blob } = await supabase.storage.from(BUCKET).download(source.receipt_path)
      if (!blob) continue

      const prepared = prepareReceiptJpeg(new Uint8Array(await blob.arrayBuffer()))
      if (!prepared) continue

      if (annexBytes + prepared.bytes.byteLength > ANNEX_BUDGET) { annexTruncated = true; continue }
      annexBytes += prepared.bytes.byteLength
      receiptsAttached++
      row.receiptImage = prepared
    }
  }

  // Entran los anticipos entregados dentro del periodo y ademas aquellos contra
  // los que se gasto en el, aunque se hayan entregado antes.
  const referenced = [...new Set(fund.map(r => r.advance_id).filter(Boolean) as string[])]

  const [{ data: inPeriod }, { data: linked }] = await Promise.all([
    supabase
      .from('cash_advances')
      .select('id, amount, given_on, notes')
      .eq('organization_id', orgId)
      .gte('given_on', from)
      .lte('given_on', to),
    referenced.length > 0
      ? supabase
          .from('cash_advances')
          .select('id, amount, given_on, notes')
          .in('id', referenced)
      : Promise.resolve({ data: [] as { id: string; amount: number; given_on: string; notes: string | null }[] }),
  ])

  const advanceById = new Map<string, SettlementAdvance>()
  for (const a of [...(inPeriod ?? []), ...(linked ?? [])]) {
    advanceById.set(a.id, {
      givenOn: a.given_on,
      amount: round2(Number(a.amount)),
      notes: a.notes ?? '',
    })
  }
  const advances = [...advanceById.values()].sort((a, b) => a.givenOn.localeCompare(b.givenOn))

  const totalAdvanced = round2(advances.reduce((s, a) => s + a.amount, 0))
  const totalFund = round2(fundRows.reduce((s, r) => s + r.amount, 0))
  const totalOwn = round2(ownRows.reduce((s, r) => s + r.amount, 0))
  const overspend = round2(Math.max(0, totalFund - totalAdvanced))
  const unspent = round2(Math.max(0, totalAdvanced - totalFund))
  const totalDue = round2(Math.min(totalFund, totalAdvanced) + overspend + totalOwn)
  const missingReceipts = rows.filter(r => !r.receipt_path).length

  let billTo: { name: string; addressLines: string[] } | null = null
  if (customerId) {
    const { data: customer } = await supabase
      .from('customers')
      .select('name, address')
      .eq('id', customerId)
      .maybeSingle()
    if (customer) billTo = { name: customer.name, addressLines: addressLines(customer.address) }
  }

  // Tres lineas como maximo. El pie de esta hoja compite por espacio con el
  // bloque de liquidacion, y una nota de mas empuja el informe a una segunda
  // hoja para no decir nada nuevo.
  const receiptNote = missingReceipts > 0
    ? `${missingReceipts} of ${rows.length} expenses have no receipt photo attached.`
    : receiptsAttached > 0
      ? `All expenses have their receipt on file; ${receiptsAttached} photos are attached at the end${annexTruncated ? ' (some were left out to keep the file small)' : ''}.`
      : 'All expenses in this period have their receipt on file.'

  const notes = [
    'Every line above is backed by its original receipt. Expenses are charged to the project worked that day.',
    'Section A settles the cash advance; section B is money advanced personally and pending reimbursement.',
    receiptNote,
  ].join('\n')

  const bytes = await buildExpenseSettlementPdf({
    from: { name: org?.name ?? 'Your organization', addressLines: addressLines(org?.address) },
    billTo,
    periodFrom: from,
    periodTo: to,
    issuedOn: new Date().toISOString().slice(0, 10),
    advances,
    fundRows,
    ownRows,
    totalAdvanced,
    totalFund,
    totalOwn,
    overspend,
    unspent,
    totalDue,
    notes,
  })

  return {
    base64: Buffer.from(bytes).toString('base64'),
    fileName: `expense-settlement_${from}_${to}.pdf`,
    summary: {
      totalAdvanced, totalFund, totalOwn, overspend, unspent, totalDue,
      missingReceipts, receiptsAttached,
    },
  }
}

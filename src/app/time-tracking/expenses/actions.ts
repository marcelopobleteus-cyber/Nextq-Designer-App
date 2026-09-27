'use server'

/**
 * Gastos de proyecto: combustible, materiales, peajes, lo que se gaste en obra.
 *
 * Version deliberadamente mas simple que Construction Foreman. CF pide Item Type,
 * Category, Expense Account, Vendor, Cost Code, Ref # y Reason. En las capturas
 * reales la mitad de esos campos queda vacia y el "Expense Account" siempre dice
 * "Uncategorized Asset", asi que aqui quedan solo los que se llenan de verdad:
 * proyecto, fecha, descripcion, monto, categoria, proveedor, facturable y recibo.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
// Las categorias viven en su propio modulo: un archivo 'use server' solo puede
// exportar funciones async, y una constante exportada desde aqui compila pero
// revienta en produccion al invocar el action.
import type { ExpenseCategory, PaidBy } from './categories'

const BUCKET = 'expense-receipts'


export interface ExpenseItem {
  id: string
  projectId: string | null
  projectName: string | null
  profileId: string
  employeeName: string
  spentOn: string
  description: string
  amount: number
  category: ExpenseCategory
  vendor: string | null
  notes: string | null
  billable: boolean
  /** De donde salio la plata. Decide en que seccion cae en la rendicion. */
  paidBy: PaidBy
  receiptPath: string | null
  /** URL firmada, valida una hora. Null si no hay recibo. */
  receiptUrl: string | null
  canEdit: boolean
}

export interface ExpenseInput {
  projectId: string | null
  spentOn: string
  description: string
  amount: number
  category: ExpenseCategory
  vendor: string
  notes: string
  billable: boolean
  paidBy: PaidBy
}

const round2 = (n: number) => Math.round(n * 100) / 100

async function context() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, userId: null, orgId: null, isManager: false }

  const { data } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('profile_id', user.id)
    .limit(1)

  const m = data?.[0]
  return {
    supabase,
    userId: user.id,
    orgId: m?.organization_id ?? null,
    isManager: m?.role === 'owner' || m?.role === 'admin',
  }
}

export async function getExpenses(
  from?: string,
  to?: string,
): Promise<{ expenses: ExpenseItem[]; total: number; billableTotal: number; error?: string }> {
  const { supabase, userId, orgId, isManager } = await context()
  if (!orgId || !userId) return { expenses: [], total: 0, billableTotal: 0, error: 'No organization for the current user.' }

  let q = supabase
    .from('project_expenses')
    .select('id, project_id, profile_id, spent_on, description, amount, category, vendor, notes, billable, paid_by, receipt_path')
    .eq('organization_id', orgId)
    .order('spent_on', { ascending: false })

  if (from) q = q.gte('spent_on', from)
  if (to) q = q.lte('spent_on', to)

  const { data: rows, error } = await q
  if (error) return { expenses: [], total: 0, billableTotal: 0, error: error.message }

  const [{ data: projects }, { data: profiles }] = await Promise.all([
    supabase.from('projects').select('id, name').eq('organization_id', orgId),
    supabase.from('profiles').select('id, full_name, first_name, last_name, email'),
  ])

  const projectName = new Map((projects ?? []).map(p => [p.id, p.name]))
  const personName = new Map((profiles ?? []).map(p => [
    p.id,
    [p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || p.email || 'Unknown',
  ]))

  // Las URLs firmadas se piden en lote; una por fila serian N round-trips.
  const paths = (rows ?? []).map(r => r.receipt_path).filter(Boolean) as string[]
  const signed = new Map<string, string>()
  if (paths.length > 0) {
    const { data: urls } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl)
    }
  }

  const expenses: ExpenseItem[] = (rows ?? []).map(r => ({
    id: r.id,
    projectId: r.project_id,
    projectName: r.project_id ? (projectName.get(r.project_id) ?? null) : null,
    profileId: r.profile_id,
    employeeName: personName.get(r.profile_id) ?? 'Unknown',
    spentOn: r.spent_on,
    description: r.description,
    amount: round2(Number(r.amount)),
    category: r.category as ExpenseCategory,
    vendor: r.vendor,
    notes: r.notes,
    billable: r.billable,
    paidBy: r.paid_by === 'company_cash' ? 'company_cash' : 'employee',
    receiptPath: r.receipt_path,
    receiptUrl: r.receipt_path ? (signed.get(r.receipt_path) ?? null) : null,
    canEdit: isManager || r.profile_id === userId,
  }))

  return {
    expenses,
    total: round2(expenses.reduce((s, e) => s + e.amount, 0)),
    billableTotal: round2(expenses.filter(e => e.billable).reduce((s, e) => s + e.amount, 0)),
  }
}

export async function saveExpense(
  id: string | null,
  input: ExpenseInput,
): Promise<{ id?: string; error?: string }> {
  const { supabase, userId, orgId } = await context()
  if (!orgId || !userId) return { error: 'No organization for the current user.' }
  if (!input.description.trim()) return { error: 'Enter what the expense was for.' }
  if (!Number.isFinite(input.amount) || input.amount <= 0) return { error: 'Enter an amount greater than zero.' }
  if (!input.spentOn) return { error: 'The date is required.' }

  const payload = {
    organization_id: orgId,
    project_id: input.projectId || null,
    spent_on: input.spentOn,
    description: input.description.trim(),
    amount: round2(input.amount),
    category: input.category,
    vendor: input.vendor.trim() || null,
    notes: input.notes.trim() || null,
    billable: input.billable,
    paid_by: input.paidBy,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    // profile_id no se toca al editar: cambiarlo movería el gasto a otra persona.
    const { error } = await supabase.from('project_expenses').update(payload).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/time-tracking/expenses')
    return { id }
  }

  const { data, error } = await supabase
    .from('project_expenses')
    .insert({ ...payload, profile_id: userId })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/time-tracking/expenses')
  return { id: data.id }
}

/**
 * Sube la foto del recibo. Se recibe como base64 porque el formulario vive en un
 * client component y los server actions no aceptan File directamente.
 */
export async function uploadReceipt(
  expenseId: string,
  fileName: string,
  base64: string,
  contentType: string,
): Promise<{ error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { error: 'No organization for the current user.' }

  const buffer = Buffer.from(base64, 'base64')
  if (buffer.byteLength > 8 * 1024 * 1024) {
    return { error: 'The receipt is larger than 8 MB. Take the photo at a lower resolution.' }
  }

  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${orgId}/${expenseId}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true })

  if (upErr) return { error: upErr.message }

  const { error } = await supabase
    .from('project_expenses')
    .update({ receipt_path: path })
    .eq('id', expenseId)

  if (error) return { error: error.message }
  revalidatePath('/time-tracking/expenses')
  return {}
}

export async function deleteExpense(id: string): Promise<{ error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { error: 'No organization for the current user.' }

  const { data: row } = await supabase
    .from('project_expenses')
    .select('receipt_path')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('project_expenses').delete().eq('id', id)
  if (error) return { error: error.message }

  // El archivo se borra despues de la fila: si falla, queda un huerfano en el
  // bucket, que es preferible a una fila que apunta a un recibo inexistente.
  if (row?.receipt_path) {
    await supabase.storage.from(BUCKET).remove([row.receipt_path])
  }

  revalidatePath('/time-tracking/expenses')
  return {}
}

/** Total facturable de un periodo; lo usa la factura para el reembolso. */
export async function getBillableTotal(from: string, to: string): Promise<number> {
  const { supabase, orgId } = await context()
  if (!orgId) return 0

  const { data } = await supabase
    .from('project_expenses')
    .select('amount')
    .eq('organization_id', orgId)
    .eq('billable', true)
    .gte('spent_on', from)
    .lte('spent_on', to)

  return round2((data ?? []).reduce((s, r) => s + round2(Number(r.amount)), 0))
}

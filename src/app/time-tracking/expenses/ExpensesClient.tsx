'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getExpenses, saveExpense, deleteExpense, uploadReceipt,
  type ExpenseItem, type ExpenseInput,
} from './actions'
import { EXPENSE_CATEGORIES, CATEGORY_LABEL, PAID_BY, PAID_BY_LABEL, type ExpenseCategory, type PaidBy } from './categories'
import { buildSettlementReport } from './settlementPdf'

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${m}/${day}/${y}`
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

type Form = {
  projectId: string
  spentOn: string
  description: string
  amount: string
  category: ExpenseCategory
  vendor: string
  notes: string
  billable: boolean
  paidBy: PaidBy
}

const emptyForm = (): Form => ({
  projectId: '', spentOn: iso(new Date()), description: '', amount: '',
  category: 'fuel', vendor: '', notes: '', billable: false, paidBy: 'employee',
})

export default function ExpensesClient({
  projects,
  organizationName,
  customers,
  defaultBillToId,
}: {
  projects: { id: string; name: string }[]
  organizationName: string
  customers: { id: string; name: string }[]
  defaultBillToId: string | null
}) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const [from, setFrom] = useState(iso(monthStart))
  const [to, setTo] = useState(iso(today))
  const [rows, setRows] = useState<ExpenseItem[]>([])
  const [totals, setTotals] = useState({ total: 0, billable: 0 })
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null)

  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ExpenseItem | null>(null)
  const [reporting, setReporting] = useState(false)
  /** A quien se le presenta la rendicion y si lleva las fotos anexas. */
  const [billToId, setBillToId] = useState(defaultBillToId ?? customers[0]?.id ?? '')
  const [attachReceipts, setAttachReceipts] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getExpenses(from, to)
    setRows(res.expenses)
    setTotals({ total: res.total, billable: res.billableTotal })
    setLoading(false)
    if (res.error) setNotice({ text: res.error, kind: 'error' })
  }, [from, to])

  // Diferido a un tick: llamar setState de forma sincrona dentro del efecto
  // encadena renders y lo marca el linter.
  useEffect(() => {
    const id = window.setTimeout(() => { load() }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  const byCategory = useMemo(() => {
    const m = new Map<ExpenseCategory, number>()
    for (const r of rows) m.set(r.category, Math.round(((m.get(r.category) ?? 0) + r.amount) * 100) / 100)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [rows])

  const submit = async () => {
    if (!editing) return
    setBusy(true)

    const input: ExpenseInput = {
      projectId: editing.form.projectId || null,
      spentOn: editing.form.spentOn,
      description: editing.form.description,
      amount: Number(editing.form.amount || 0),
      category: editing.form.category,
      vendor: editing.form.vendor,
      notes: editing.form.notes,
      billable: editing.form.billable,
      paidBy: editing.form.paidBy,
    }

    const res = await saveExpense(editing.id, input)
    if (res.error || !res.id) {
      setBusy(false)
      setNotice({ text: res.error || 'Could not save the expense.', kind: 'error' })
      return
    }

    // El recibo se sube DESPUES de guardar: necesita el id del gasto para
    // nombrar el archivo, y asi un fallo de subida no pierde el gasto.
    if (receipt) {
      const buf = await receipt.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      const up = await uploadReceipt(res.id, receipt.name, b64, receipt.type || 'image/jpeg')
      if (up.error) {
        setBusy(false)
        setNotice({ text: `Expense saved, but the receipt did not upload: ${up.error}`, kind: 'error' })
        setEditing(null); setReceipt(null); load()
        return
      }
    }

    setBusy(false)
    setEditing(null)
    setReceipt(null)
    setNotice({ text: editing.id ? 'Expense updated.' : 'Expense added.', kind: 'ok' })
    load()
  }

  const remove = async () => {
    if (!confirmDelete) return
    setBusy(true)
    const res = await deleteExpense(confirmDelete.id)
    setBusy(false)
    setConfirmDelete(null)
    if (res.error) { setNotice({ text: res.error, kind: 'error' }); return }
    setNotice({ text: 'Expense removed.', kind: 'ok' })
    load()
  }

  const exportCsv = () => {
    if (rows.length === 0) {
      setNotice({ text: `No expenses between ${fmtDate(from)} and ${fmtDate(to)}.`, kind: 'error' })
      return
    }
    const esc = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const head = ['Date', 'Project', 'Description', 'Category', 'Vendor', 'Employee', 'Amount', 'Billable', 'Notes']
    const lines = rows.map(r => [
      r.spentOn, r.projectName ?? '', r.description, CATEGORY_LABEL[r.category],
      r.vendor ?? '', r.employeeName, r.amount.toFixed(2), r.billable ? 'Yes' : 'No', r.notes ?? '',
    ])
    const csv = [head, ...lines].map(l => l.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Rendicion del periodo: separa el fondo de efectivo del dinero propio.
   * El PDF lo arma el servidor y vuelve en base64; aqui solo se reconstituye y
   * se baja, igual que la factura de labor. Nada de montos calculados aqui.
   */
  const settlementPdf = async () => {
    setReporting(true)
    const res = await buildSettlementReport(from, to, billToId || null, attachReceipts)
    setReporting(false)

    if (res.error || !res.base64 || !res.fileName) {
      setNotice({ text: res.error || 'Could not build the report.', kind: 'error' })
      return
    }

    const bin = atob(res.base64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = res.fileName
    a.click()
    URL.revokeObjectURL(url)

    const s = res.summary
    setNotice({
      text: s
        ? `Settlement: ${money(s.totalFund)} from the fund, ${money(s.totalOwn)} out of pocket · ${money(s.totalDue)} due` +
          (s.receiptsAttached > 0 ? ` · ${s.receiptsAttached} receipts attached` : '') +
          (s.missingReceipts > 0 ? ` · ${s.missingReceipts} without a receipt photo` : '')
        : 'Report downloaded.',
      kind: s && s.missingReceipts > 0 ? 'error' : 'ok',
    })
  }

  const card = 'bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl'
  const field = 'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)]'
  const label = 'block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1'
  const th = 'text-left px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]'

  return (
    <div className="w-full h-full px-6 py-4 flex-1 flex flex-col overflow-y-auto bg-[var(--bg)] font-sans space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Expenses</h1>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 max-w-3xl">
            Fuel, materials and anything else spent on a job · {organizationName}. Mark an expense
            <strong> billable</strong> and it becomes a reimbursement line on the invoice for that period.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/time-tracking"
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ← Time entries
          </Link>
          <button type="button" onClick={exportCsv}
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
            Export CSV
          </button>
          <button type="button" onClick={settlementPdf} disabled={reporting}
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-50">
            {reporting ? 'Building…' : 'Settlement PDF'}
          </button>
          <button type="button" onClick={() => { setEditing({ id: null, form: emptyForm() }); setReceipt(null) }}
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer">
            + New expense
          </button>
        </div>
      </div>

      {notice && (
        <div onClick={() => setNotice(null)}
          className={`px-4 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${
            notice.kind === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/25 text-red-400'}`}>
          {notice.text}
        </div>
      )}

      <div className={`${card} p-3 flex flex-wrap items-end gap-3`}>
        <div>
          <label className={label}>From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]" />
        </div>
        <div>
          <label className={label}>To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]" />
        </div>
        {/* Parametros de la rendicion. Viven junto a las fechas y no en el boton
            porque son parte del mismo recorte: periodo, a quien se le presenta,
            y si van las fotos. */}
        <div>
          <label className={label}>Bill to (settlement)</label>
          <select value={billToId} onChange={e => setBillToId(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]">
            <option value="">— No customer —</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] cursor-pointer pb-1.5">
          <input type="checkbox" checked={attachReceipts}
            onChange={e => setAttachReceipts(e.target.checked)} />
          Attach receipt photos
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total spent', value: money(totals.total), tone: '' },
          { label: 'Billable', value: money(totals.billable), tone: 'text-emerald-400' },
          { label: 'Entries', value: String(rows.length), tone: '' },
        ].map(m => (
          <div key={m.label} className={`${card} p-3 h-20 flex flex-col justify-between`}>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{m.label}</span>
            <span className={`text-lg font-black tracking-tight font-mono tabular-nums ${m.tone || 'text-[var(--text-primary)]'}`}>{m.value}</span>
          </div>
        ))}
      </div>

      {byCategory.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {byCategory.map(([cat, amount]) => (
            <span key={cat} className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-bold text-[var(--text-secondary)]">
              {CATEGORY_LABEL[cat]} <span className="font-mono text-[var(--text-primary)]">{money(amount)}</span>
            </span>
          ))}
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <tr>
                <th className={th}>Date</th>
                <th className={th}>Expense</th>
                <th className={th}>Project</th>
                <th className={th}>Category</th>
                <th className={th}>Employee</th>
                <th className={`${th} text-right`}>Amount</th>
                <th className={th}>Receipt</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-medium">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-tertiary)]">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                  No expenses between {fmtDate(from)} and {fmtDate(to)}.
                </td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-3 font-mono">{fmtDate(r.spentOn)}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-sm text-[var(--text-primary)]">{r.description}</div>
                    {r.vendor && <div className="text-[11px] text-[var(--text-tertiary)]">{r.vendor}</div>}
                  </td>
                  <td className="px-4 py-3">{r.projectName ?? <span className="text-[var(--text-tertiary)]">—</span>}</td>
                  <td className="px-4 py-3">
                    {CATEGORY_LABEL[r.category]}
                    {r.billable && <span className="ml-2 px-1.5 py-0.5 rounded border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 text-[9.5px] font-black">BILLABLE</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.employeeName}
                    <span className={`block text-[10px] font-bold ${r.paidBy === 'company_cash' ? 'text-[var(--accent-text)]' : 'text-[var(--text-tertiary)]'}`}>
                      {r.paidBy === 'company_cash' ? 'Company cash' : 'Own money'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">{money(r.amount)}</td>
                  <td className="px-4 py-3">
                    {r.receiptUrl
                      ? <a href={r.receiptUrl} target="_blank" rel="noreferrer" className="font-bold text-[var(--accent-text)] hover:underline">View</a>
                      : <span className="text-[var(--text-tertiary)]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {r.canEdit && (
                      <>
                        <button type="button"
                          onClick={() => {
                            setReceipt(null)
                            setEditing({
                              id: r.id,
                              form: {
                                projectId: r.projectId ?? '', spentOn: r.spentOn, description: r.description,
                                amount: String(r.amount), category: r.category, vendor: r.vendor ?? '',
                                notes: r.notes ?? '', billable: r.billable, paidBy: r.paidBy,
                              },
                            })
                          }}
                          className="text-[11px] font-bold text-[var(--text-secondary)] cursor-pointer">Edit</button>
                        <button type="button" onClick={() => setConfirmDelete(r)}
                          className="ml-3 text-[11px] font-bold text-red-400 cursor-pointer">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-4">
              {editing.id ? 'Edit expense' : 'New expense'}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={label}>Expense</label>
                <input className={field} placeholder="Fuel truck #17"
                  value={editing.form.description}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, description: e.target.value } })} />
              </div>
              <div>
                <label className={label}>Amount (USD)</label>
                <input type="number" step="0.01" className={field} placeholder="0.00"
                  value={editing.form.amount}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, amount: e.target.value } })} />
              </div>
              <div>
                <label className={label}>Date</label>
                <input type="date" className={field} value={editing.form.spentOn}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, spentOn: e.target.value } })} />
              </div>
              <div>
                <label className={label}>Project</label>
                <select className={field} value={editing.form.projectId}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, projectId: e.target.value } })}>
                  <option value="">— No project (overhead) —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Category</label>
                <select className={field} value={editing.form.category}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, category: e.target.value as ExpenseCategory } })}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={label}>Paid with</label>
                <select className={field} value={editing.form.paidBy}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, paidBy: e.target.value as PaidBy } })}>
                  {PAID_BY.map(v => <option key={v} value={v}>{PAID_BY_LABEL[v]}</option>)}
                </select>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Decides whether this settles the cash advance or gets reimbursed to you.
                </p>
              </div>
              <div className="col-span-2">
                <label className={label}>Vendor</label>
                <input className={field} placeholder="Chevron, Home Depot…"
                  value={editing.form.vendor}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, vendor: e.target.value } })} />
              </div>
              <div className="col-span-2">
                <label className={label}>Receipt photo</label>
                <input type="file" accept="image/*,application/pdf" className={field}
                  onChange={e => setReceipt(e.target.files?.[0] ?? null)} />
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Up to 8 MB. Replaces the one on file.</p>
              </div>
              <div className="col-span-2">
                <label className={label}>Notes</label>
                <input className={field} value={editing.form.notes}
                  onChange={e => setEditing({ ...editing, form: { ...editing.form, notes: e.target.value } })} />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)] cursor-pointer">
                  <input type="checkbox" checked={editing.form.billable}
                    onChange={e => setEditing({ ...editing, form: { ...editing.form, billable: e.target.checked } })} />
                  Billable — bill this back to the customer
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setEditing(null)} disabled={busy}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={submit} disabled={busy}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer disabled:opacity-50">
                {busy ? 'Saving…' : 'Save expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-3">Delete expense</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              This removes {confirmDelete.description} for {money(confirmDelete.amount)}
              {confirmDelete.receiptPath && ', along with its receipt'}. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setConfirmDelete(null)} disabled={busy}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={remove} disabled={busy}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-red-600 text-white cursor-pointer disabled:opacity-50">
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

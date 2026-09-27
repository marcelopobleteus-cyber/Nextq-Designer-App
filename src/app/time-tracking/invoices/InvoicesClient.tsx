'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getLaborInvoices,
  setInvoiceStatus,
  deleteLaborInvoice,
  type LaborInvoiceItem,
  type InvoiceStatus,
} from './actions'

const card = 'bg-[var(--surface-1)] border border-[var(--border)] rounded-xl'

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const hrs = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmt(isoDay: string): string {
  const [y, m, d] = isoDay.split('-').map(Number)
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`
}

const STATUS: { value: InvoiceStatus; label: string; className: string }[] = [
  { value: 'issued', label: 'Issued', className: 'bg-[var(--surface-2)] text-[var(--text-secondary)]' },
  { value: 'sent', label: 'Sent', className: 'bg-[var(--accent-soft)] text-[var(--accent-text)]' },
  { value: 'paid', label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
  { value: 'void', label: 'Void', className: 'bg-[var(--surface-3)] text-[var(--text-tertiary)] line-through' },
]

const statusMeta = (s: InvoiceStatus) => STATUS.find(x => x.value === s) ?? STATUS[0]

const todayIso = () => new Date().toISOString().slice(0, 10)

export default function InvoicesClient() {
  const [invoices, setInvoices] = useState<LaborInvoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  /** Factura a la que se le esta pidiendo la fecha de pago. */
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [paidOn, setPaidOn] = useState(todayIso())
  /**
   * Cambio de estado esperando confirmacion.
   *
   * Cambiar el estado de una factura es un hecho administrativo: 'sent' dice
   * que el documento salio a la calle. Un clic de mas no puede afirmar eso, asi
   * que cada transicion se pregunta antes, en la misma fila y sin dialogo del
   * navegador, para que se vea de que factura se trata.
   */
  const [confirming, setConfirming] = useState<{ id: string; next: InvoiceStatus; question: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getLaborInvoices()
    setInvoices(res.invoices)
    setError(res.error ?? null)
    setLoading(false)
  }, [])

  // Diferido a un tick, igual que en la nomina: llamar setState de forma
  // sincrona dentro del efecto encadena renders y el linter lo marca.
  useEffect(() => {
    const id = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  const changeStatus = async (id: string, status: InvoiceStatus, when: string | null) => {
    setBusy(id)
    const res = await setInvoiceStatus(id, status, when)
    setBusy(null)
    if (res.error) { setError(res.error); return }
    setMarkingPaid(null)
    setConfirming(null)
    await load()
  }

  const remove = async (inv: LaborInvoiceItem) => {
    if (!confirm(`Delete invoice ${inv.invoiceNumber}? The PDF you already sent is not affected.`)) return
    setBusy(inv.id)
    const res = await deleteLaborInvoice(inv.id)
    setBusy(null)
    if (res.error) { setError(res.error); return }
    await load()
  }

  const totalOutstanding = invoices
    .filter(i => i.status !== 'paid' && i.status !== 'void')
    .reduce((s, i) => s + i.total, 0)

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-4 font-sans">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight">Labor Invoices</h1>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 max-w-3xl leading-relaxed">
            Every invoice you issue from Payroll is recorded here with the period it covers and a frozen copy
            of the calculation. Correcting hours later never changes an invoice that was already sent.
          </p>
        </div>
        <Link
          href="/time-tracking/payroll"
          className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] whitespace-nowrap"
        >
          ← Payroll
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && invoices.length > 0 && (
        <div className={`${card} p-3 flex items-center gap-6`}>
          <div>
            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Invoices
            </span>
            <span className="text-base font-extrabold text-[var(--text-primary)]">{invoices.length}</span>
          </div>
          <div>
            <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Outstanding
            </span>
            <span className="text-base font-extrabold text-[var(--text-primary)]">{money(totalOutstanding)}</span>
          </div>
        </div>
      )}

      <div className={`${card} overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-[var(--text-secondary)]">No invoices recorded yet.</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
              Generate one from Payroll and it will show up here.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-[var(--surface-2)] text-[var(--text-tertiary)]">
              <tr className="text-[9.5px] font-bold uppercase tracking-wider">
                <th className="text-left px-4 py-2.5">Invoice</th>
                <th className="text-left px-4 py-2.5">Period</th>
                <th className="text-left px-4 py-2.5">Bill to</th>
                <th className="text-right px-4 py-2.5">Hours</th>
                <th className="text-right px-4 py-2.5">Labor</th>
                <th className="text-right px-4 py-2.5">Reimb.</th>
                <th className="text-right px-4 py-2.5">Total</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => {
                const meta = statusMeta(inv.status)
                return (
                  <tr key={inv.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      <span className="font-bold text-[var(--text-primary)]">{inv.invoiceNumber}</span>
                      <span className="block text-[10px] text-[var(--text-tertiary)]">{fmt(inv.invoiceDate)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {/* El enlace lleva la nomina exactamente al rango facturado:
                          es la forma de comprobar de donde salio cada numero. */}
                      <Link
                        href={`/time-tracking/payroll?from=${inv.periodFrom}&to=${inv.periodTo}`}
                        className="font-semibold text-[var(--accent-text)] hover:underline"
                      >
                        {fmt(inv.periodFrom)} – {fmt(inv.periodTo)}
                      </Link>
                      <span className="block text-[10px] text-[var(--text-tertiary)]">
                        {inv.daysCount > 0 ? `${inv.daysCount} days` : 'no detail sheet'}
                        {inv.expensesCount > 0 ? ` · ${inv.expensesCount} expenses` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{inv.customerName ?? '—'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{hrs(inv.totalHours)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(inv.laborSubtotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(inv.reimbursements)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-[var(--text-primary)]">
                      {money(inv.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.className}`}>
                        {meta.label}
                      </span>
                      {inv.paidOn && (
                        <span className="block text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {fmt(inv.paidOn)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {markingPaid === inv.id ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <input
                            type="date"
                            value={paidOn}
                            onChange={e => setPaidOn(e.target.value)}
                            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px]"
                          />
                          <button
                            onClick={() => changeStatus(inv.id, 'paid', paidOn)}
                            disabled={busy === inv.id}
                            className="px-2 py-1 rounded-lg bg-[var(--accent)] text-white text-[11px] font-bold disabled:opacity-50"
                          >
                            Confirm paid
                          </button>
                          <button
                            onClick={() => setMarkingPaid(null)}
                            className="px-2 py-1 text-[11px] font-bold text-[var(--text-secondary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : confirming?.id === inv.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-[11px] font-bold text-[var(--text-primary)]">
                            {confirming.question}
                          </span>
                          <button
                            onClick={() => changeStatus(inv.id, confirming.next, null)}
                            disabled={busy === inv.id}
                            className="px-2 py-1 rounded-lg bg-[var(--accent)] text-white text-[11px] font-bold disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirming(null)}
                            className="px-2 py-1 text-[11px] font-bold text-[var(--text-secondary)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          {inv.status === 'issued' && (
                            <button
                              onClick={() => setConfirming({
                                id: inv.id, next: 'sent',
                                question: `Mark ${inv.invoiceNumber} as sent?`,
                              })}
                              disabled={busy === inv.id}
                              className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                            >
                              Mark sent
                            </button>
                          )}
                          {/* Toda transicion tiene su vuelta atras. Sin esto, un
                              clic equivocado dejaba la factura marcada para
                              siempre y solo se arreglaba en la base. */}
                          {inv.status === 'sent' && (
                            <button
                              onClick={() => setConfirming({
                                id: inv.id, next: 'issued',
                                question: `Put ${inv.invoiceNumber} back to issued?`,
                              })}
                              disabled={busy === inv.id}
                              className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                            >
                              Undo sent
                            </button>
                          )}
                          {inv.status !== 'paid' && inv.status !== 'void' && (
                            <button
                              onClick={() => { setConfirming(null); setMarkingPaid(inv.id); setPaidOn(todayIso()) }}
                              className="text-[11px] font-bold text-emerald-700 hover:underline"
                            >
                              Mark paid
                            </button>
                          )}
                          {inv.status === 'paid' && (
                            <button
                              onClick={() => setConfirming({
                                id: inv.id, next: 'sent',
                                question: `Undo the payment on ${inv.invoiceNumber}?`,
                              })}
                              disabled={busy === inv.id}
                              className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                            >
                              Undo paid
                            </button>
                          )}
                          <button
                            onClick={() => remove(inv)}
                            disabled={busy === inv.id}
                            className="text-[11px] font-bold text-red-600 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)]">
        Click a period to open Payroll filtered to those exact dates and check every figure against the time cards.
      </p>
    </div>
  )
}

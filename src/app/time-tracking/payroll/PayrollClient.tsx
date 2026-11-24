'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getPayrollSummary,
  getPayrollEmployeeDetail,
  type PayrollWeekRow,
  type PayrollDetailRow,
} from './actions'
import { generatePayStatementPdf, generatePayrollReportPdf } from './pdf'
import { previewLaborInvoice, saveLaborInvoice, suggestInvoiceNumber, type InvoiceSummary } from './invoicePdf'
import { getPeriodGaps, type PeriodGap } from './actions'
import { getCustomers, type CustomerItem } from '@/app/customers/actions'
import { getBillableTotal } from '../expenses/actions'
import { periodToInvoice, recentPayPeriods } from '@/lib/payPeriods'

/** Lunes de la semana que contiene `d`. La semana laboral va lunes a domingo. */
function mondayOf(d: Date): Date {
  const out = new Date(d)
  const dow = (out.getDay() + 6) % 7 // 0 = lunes
  out.setDate(out.getDate() - dow)
  out.setHours(0, 0, 0, 0)
  return out
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

/** Etiqueta de una semana a partir de su lunes, en la zona local del navegador. */
function weekLabel(weekStartIso: string): string {
  const [y, m, d] = weekStartIso.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const end = addDays(start, 6)
  const f = (x: Date) =>
    x.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  return `${f(start)} – ${f(end)}`
}

const money = (n: number | null) =>
  n === null ? '—' : n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const hrs = (n: number) => n.toFixed(2)

/** "Mon, Sep 7" a partir de un ISO, sin que la zona del navegador corra el dia. */
const dayLabel = (isoDay: string): string => {
  const [y, m, d] = isoDay.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  })
}

interface PayrollClientProps {
  /** Rango que llega desde el historial de facturas; ausente = las dos ultimas semanas. */
  initialFrom?: string
  initialTo?: string
}

export default function PayrollClient({ initialFrom, initialTo }: PayrollClientProps = {}) {
  const today = new Date()
  const thisMonday = mondayOf(today)

  // Por defecto: el ultimo periodo ya cerrado, que es el que toca facturar.
  const toInvoice = periodToInvoice(today)

  const [from, setFrom] = useState(initialFrom ?? toInvoice.from)
  const [to, setTo] = useState(initialTo ?? toInvoice.to)
  const [rows, setRows] = useState<PayrollWeekRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pdfFor, setPdfFor] = useState<string | null>(null)
  const [reportPdfBusy, setReportPdfBusy] = useState(false)
  // Factura de labor: se arma con las mismas horas del periodo.
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceBusy, setInvoiceBusy] = useState(false)
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [invoice, setInvoice] = useState({
    customerId: '',
    invoiceNumber: '',
    invoiceDate: iso(today),
    paymentTerms: 'Net 14',
    projectOrPo: 'Crew Labor',
    reimbursementLabel: '',
    reimbursementAmount: '',
    otherOrTax: '',
    notes: 'Please remit payment according to the agreed payment terms. Thank you for your business.',
  })
  // El anexo va adjunto por defecto: una factura sin respaldo obliga a quien la
  // recibe a pedirlo por correo, y ese ida y vuelta retrasa el pago.
  const [includeDetail, setIncludeDetail] = useState(true)
  // La factura se mira antes de registrarse. Mientras `preview` tenga valor el
  // modal muestra el PDF; volver a editar lo descarta para no dejar a la vista
  // un documento que ya no corresponde a los campos.
  const [preview, setPreview] = useState<{
    base64: string
    fileName: string
    summary: InvoiceSummary
    alreadyUsed: boolean
  } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  // Dias habiles sin horas. Se separan feriados de ausencias porque son cosas
  // distintas y el hueco se ve igual.
  const [gaps, setGaps] = useState<PeriodGap[]>([])
  const [openEmployee, setOpenEmployee] = useState<string | null>(null)
  const [detail, setDetail] = useState<PayrollDetailRow[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getPayrollSummary(from, to)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      setRows([])
      return
    }
    setRows(res.rows ?? [])
  }, [from, to])

  // Diferido a un tick: llamar setState de forma sincrona dentro del efecto
  // encadena renders (y lo marca el linter). El periodo cambia por interaccion
  // del usuario, asi que un tick no se nota.
  useEffect(() => {
    const id = window.setTimeout(() => { load() }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  // El iframe necesita una URL. Se crea un blob por cada vista previa y se
  // revoca la anterior: dejarlas vivas filtra memoria en cada intento.
  useEffect(() => {
    const id = window.setTimeout(() => {
      getPeriodGaps(from, to).then(res => { setGaps(res.gaps ?? []) })
    }, 0)
    return () => window.clearTimeout(id)
  }, [from, to])

  // El setState va diferido un tick, igual que la carga del periodo: hacerlo de
  // forma sincrona dentro del efecto encadena renders y el linter lo marca.
  useEffect(() => {
    if (!preview) {
      const clear = window.setTimeout(() => { setPreviewUrl(null) }, 0)
      return () => window.clearTimeout(clear)
    }
    const bin = atob(preview.base64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
    const id = window.setTimeout(() => { setPreviewUrl(url) }, 0)
    return () => { window.clearTimeout(id); URL.revokeObjectURL(url) }
  }, [preview])

  /** El servidor devuelve el PDF en base64; aqui solo se reconstituye y baja. */
  const savePdf = (base64: string, fileName: string) => {
    const bin = atob(base64)
    const buf = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadStatement = async (profileId: string) => {
    setPdfFor(profileId)
    const res = await generatePayStatementPdf(profileId, from, to)
    setPdfFor(null)
    if (res.error || !res.base64 || !res.fileName) {
      setError(res.error || 'Could not build the statement.')
      return
    }
    savePdf(res.base64, res.fileName)
  }

  const downloadReport = async () => {
    setReportPdfBusy(true)
    const res = await generatePayrollReportPdf(from, to)
    setReportPdfBusy(false)
    if (res.error || !res.base64 || !res.fileName) {
      setError(res.error || 'Could not build the report.')
      return
    }
    savePdf(res.base64, res.fileName)
  }

  const openInvoice = async () => {
    setInvoiceOpen(true)
    // Los gastos marcados facturables del mismo periodo se proponen como
    // reembolso: es exactamente la linea de combustible que se factura a mano hoy.
    const [list, suggested, billable] = await Promise.all([
      getCustomers(),
      suggestInvoiceNumber(iso(today)),
      getBillableTotal(from, to),
    ])
    setCustomers(list.customers)
    setInvoice(v => ({
      ...v,
      invoiceNumber: v.invoiceNumber || suggested,
      customerId: v.customerId || (list.customers[0]?.id ?? ''),
      reimbursementLabel: v.reimbursementLabel || (billable > 0 ? 'Reimbursable expenses' : ''),
      reimbursementAmount: v.reimbursementAmount || (billable > 0 ? billable.toFixed(2) : ''),
    }))
  }

  /** Los campos que definen la factura, en un solo lugar para no repetirlos. */
  const invoiceOptions = () => ({
    customerId: invoice.customerId || null,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: invoice.invoiceDate,
    paymentTerms: invoice.paymentTerms,
    projectOrPo: invoice.projectOrPo,
    reimbursementLabel: invoice.reimbursementLabel,
    reimbursementAmount: Number(invoice.reimbursementAmount || 0),
    otherOrTax: Number(invoice.otherOrTax || 0),
    notes: invoice.notes,
    includeDetail,
  })

  const buildPreview = async () => {
    setInvoiceBusy(true)
    setSavedId(null)
    const res = await previewLaborInvoice(from, to, invoiceOptions())
    setInvoiceBusy(false)
    if (res.error || !res.base64 || !res.fileName || !res.summary) {
      setError(res.error || 'Could not build the invoice.')
      return
    }
    setError(null)
    setPreview({
      base64: res.base64,
      fileName: res.fileName,
      summary: res.summary,
      alreadyUsed: Boolean(res.alreadyUsed),
    })
  }

  const saveInvoice = async () => {
    setInvoiceBusy(true)
    const res = await saveLaborInvoice(from, to, invoiceOptions())
    setInvoiceBusy(false)
    if (res.error || !res.invoiceId) {
      setError(res.error || 'Could not record the invoice.')
      return
    }
    setError(null)
    setSavedId(res.invoiceId)
  }

  const closeInvoice = () => {
    setInvoiceOpen(false)
    setPreview(null)
    setSavedId(null)
  }


  const openDetail = async (profileId: string) => {
    if (openEmployee === profileId) {
      setOpenEmployee(null)
      return
    }
    setOpenEmployee(profileId)
    setDetailLoading(true)
    const res = await getPayrollEmployeeDetail(profileId, from, to)
    setDetailLoading(false)
    setDetail(res.rows ?? [])
  }

  /** Agrupado por empleado, con sus semanas dentro y el subtotal del periodo. */
  const byEmployee = useMemo(() => {
    const map = new Map<string, { name: string; type: string; rate: number | null; weeks: PayrollWeekRow[] }>()
    for (const r of rows) {
      const cur = map.get(r.profileId) ?? {
        name: r.employeeName,
        type: r.employmentType,
        rate: r.hourlyRate,
        weeks: [],
      }
      cur.weeks.push(r)
      map.set(r.profileId, cur)
    }
    return [...map.entries()].map(([profileId, v]) => ({
      profileId,
      ...v,
      totalHours: v.weeks.reduce((a, w) => a + w.totalHours, 0),
      regularHours: v.weeks.reduce((a, w) => a + w.regularHours, 0),
      overtimeHours: v.weeks.reduce((a, w) => a + w.overtimeHours, 0),
      totalCost: v.weeks.some(w => w.totalCost === null)
        ? null
        : v.weeks.reduce((a, w) => a + (w.totalCost ?? 0), 0),
    }))
  }, [rows])

  const grand = useMemo(
    () => ({
      hours: byEmployee.reduce((a, e) => a + e.totalHours, 0),
      overtime: byEmployee.reduce((a, e) => a + e.overtimeHours, 0),
      cost: byEmployee.some(e => e.totalCost === null)
        ? null
        : byEmployee.reduce((a, e) => a + (e.totalCost ?? 0), 0),
      missingRate: byEmployee.filter(e => e.rate === null).length,
    }),
    [byEmployee]
  )

  const setPeriod = (startMondayOffsetWeeks: number, weeks: number) => {
    const start = addDays(thisMonday, startMondayOffsetWeeks * 7)
    setFrom(iso(start))
    setTo(iso(addDays(start, weeks * 7 - 1)))
  }

  /** Los ultimos periodos (el vigente y 5 anteriores), el mas reciente primero. */
  const payPeriods = useMemo(() => recentPayPeriods(), [])

  /** Export para pasarle el periodo a quien procesa la nomina. */
  const exportCsv = () => {
    const head = ['Employee', 'Type', 'Week (Mon–Sun)', 'Regular h', 'Overtime h', 'Total h', 'Rate', 'Total']
    const lines = rows.map(r =>
      [
        r.employeeName,
        r.employmentType.toUpperCase(),
        `${r.weekStart} to ${iso(addDays(new Date(r.weekStart + 'T00:00:00'), 6))}`,
        hrs(r.regularHours),
        hrs(r.overtimeHours),
        hrs(r.totalHours),
        r.hourlyRate === null ? '' : r.hourlyRate.toFixed(2),
        r.totalCost === null ? '' : r.totalCost.toFixed(2),
      ]
        .map(c => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    )
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll_${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const card = 'bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl'
  const invField = 'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)]'
  const invLabel = 'block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1'
  const th = 'text-left px-4 py-2.5 font-bold text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]'

  return (
    <div className="w-full h-full px-6 py-4 flex-1 flex flex-col overflow-y-auto bg-[var(--bg)] font-sans space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Payroll &amp; Labor</h1>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 max-w-3xl">
            Hours to pay by employee. The work week runs <strong>Monday to Sunday</strong>; overtime is figured
            per week, so a two-week period still pays overtime week by week instead of on the combined total.
            W2 gets 1.5× over 40 h — a 1099 contractor is paid every hour at the same rate.
          </p>
        </div>
        <div className="flex items-center gap-4 whitespace-nowrap">
          <Link
            href="/time-tracking/invoices"
            className="text-[11px] font-bold text-[var(--accent-text)] hover:underline"
          >
            Invoice history →
          </Link>
          <Link
            href="/time-tracking"
            className="text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ← Time entries
          </Link>
        </div>
      </div>

      {/* Periodos de pago listos: un clic y queda el rango correcto */}
      <div className={`${card} p-3`}>
        <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
          Pay periods · Monday to Sunday, every 2 weeks
        </div>
        <div className="flex flex-wrap gap-1.5">
          {payPeriods.map(p => {
            const active = p.from === from && p.to === to
            return (
              <button
                key={p.from}
                type="button"
                onClick={() => { setFrom(p.from); setTo(p.to) }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer ${
                  active
                    ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                {p.label}
                {p.kind === 'toInvoice' && <span className="ml-1.5 font-black">· To invoice</span>}
                {p.kind === 'current' && <span className="ml-1.5 font-semibold opacity-80">· In progress</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Periodo (manual, por si hace falta un rango distinto) */}
      <div className={`${card} p-3 flex flex-wrap items-end gap-3`}>
        <div>
          <label className="block text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]"
          />
        </div>
        <div className="flex gap-1.5">
          {[
            { label: 'This week', fn: () => setPeriod(0, 1) },
            { label: 'Last week', fn: () => setPeriod(-1, 1) },
            { label: 'Last 2 weeks', fn: () => setPeriod(-1, 2) },
            { label: 'Last 4 weeks', fn: () => setPeriod(-3, 4) },
          ].map(b => (
            <button
              key={b.label}
              type="button"
              onClick={b.fn}
              className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer"
            >
              {b.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1.5">
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer disabled:opacity-40"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={downloadReport}
            disabled={rows.length === 0 || reportPdfBusy}
            title="Payroll report for every employee in this period, as PDF"
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer disabled:opacity-40"
          >
            {reportPdfBusy ? 'Building…' : 'Report PDF'}
          </button>
          <button
            type="button"
            onClick={openInvoice}
            disabled={rows.length === 0}
            title="Bill these hours to a customer as an invoice"
            className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer disabled:opacity-40"
          >
            Invoice PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs font-bold text-red-400">
          {error}
        </div>
      )}

      {/* Dias habiles sin horas: feriado federal o ausencia */}
      {gaps.length > 0 && (
        <div className={`${card} p-3`}>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Weekdays with no hours
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {gaps.filter(g => g.holiday).length} federal holiday
              {gaps.filter(g => g.holiday).length === 1 ? '' : 's'} ·{' '}
              {gaps.filter(g => !g.holiday).length} unexplained
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {gaps.map(g => (
              <span
                key={g.day}
                title={g.holiday ?? 'No hours recorded for this weekday'}
                className={`px-2 py-1 rounded-lg text-[10.5px] font-bold border ${
                  g.holiday
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                {dayLabel(g.day)}
                {g.holiday ? ` — ${g.holiday}` : ''}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-2">
            In red, federal holidays: the prime does not work those days. The rest are weekdays with no
            time recorded — either an absence or hours still to be entered.
          </p>
        </div>
      )}

      {/* Totales del periodo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total hours', value: hrs(grand.hours) },
          { label: 'Overtime hours', value: hrs(grand.overtime) },
          { label: 'Employees', value: String(byEmployee.length) },
          { label: 'Total to pay', value: money(grand.cost) },
        ].map(m => (
          <div key={m.label} className={`${card} p-3 h-20 flex flex-col justify-between`}>
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{m.label}</span>
            <span className="text-xl font-black tracking-tight font-mono tabular-nums text-[var(--text-primary)]">{m.value}</span>
          </div>
        ))}
      </div>

      {grand.missingRate > 0 && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] font-bold text-amber-400">
          {grand.missingRate} employee{grand.missingRate > 1 ? 's have' : ' has'} no hourly rate set, so their cost
          is not counted in the total. Set it in Settings → Team → Edit.
        </div>
      )}

      {/* Reporte global */}
      <div className={`${card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--surface-2)] border-b border-[var(--border)]">
              <tr>
                <th className={th}>Employee</th>
                <th className={th}>Type</th>
                <th className={th}>Week (Mon–Sun)</th>
                <th className={`${th} text-right`}>Regular</th>
                <th className={`${th} text-right`}>Overtime</th>
                <th className={`${th} text-right`}>Total h</th>
                <th className={`${th} text-right`}>Rate</th>
                <th className={`${th} text-right`}>To pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-medium">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-tertiary)]">Loading…</td></tr>
              ) : byEmployee.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-tertiary)]">No hours in this period.</td></tr>
              ) : (
                byEmployee.map(emp => (
                  <React.Fragment key={emp.profileId}>
                    {emp.weeks.map((w, i) => (
                      <tr key={w.weekStart} className="hover:bg-[var(--surface-hover)]">
                        <td className="px-4 py-2.5">
                          {i === 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openDetail(emp.profileId)}
                                className="font-bold text-[var(--text-primary)] hover:text-[var(--accent-text)] cursor-pointer text-left"
                              >
                                {emp.name}
                              </button>
                              <button
                                type="button"
                                disabled={pdfFor === emp.profileId}
                                onClick={() => downloadStatement(emp.profileId)}
                                title="Day-by-day statement for this employee: every shift, project and hour behind the totals"
                                className="px-2 py-0.5 text-[10px] font-bold rounded border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)] hover:brightness-95 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                              >
                                {/* Decia solo "PDF" y pasaba por decoracion. Es el documento
                                    con el detalle dia por dia, que es justo lo que se pide
                                    cuando alguien cuestiona una cifra. */}
                                {pdfFor === emp.profileId ? 'Building…' : 'Daily detail PDF'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {i === 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[var(--surface-2)] border border-[var(--border)]">
                              {w.employmentType}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap">{weekLabel(w.weekStart)}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">{hrs(w.regularHours)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono tabular-nums ${w.overtimeHours > 0 ? 'text-amber-400 font-bold' : ''}`}>
                          {hrs(w.overtimeHours)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">{hrs(w.totalHours)}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">{w.hourlyRate === null ? '—' : money(w.hourlyRate)}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">{money(w.totalCost)}</td>
                      </tr>
                    ))}
                    {emp.weeks.length > 1 && (
                      <tr className="bg-[var(--surface-2)]/60">
                        <td className="px-4 py-2 text-[11px] font-bold text-[var(--text-secondary)]" colSpan={3}>
                          {emp.name} — period subtotal
                        </td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{hrs(emp.regularHours)}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums">{hrs(emp.overtimeHours)}</td>
                        <td className="px-4 py-2 text-right font-mono tabular-nums font-black text-[var(--text-primary)]">{hrs(emp.totalHours)}</td>
                        <td />
                        <td className="px-4 py-2 text-right font-mono tabular-nums font-black text-[var(--text-primary)]">{money(emp.totalCost)}</td>
                      </tr>
                    )}
                    {openEmployee === emp.profileId && (
                      <tr>
                        <td colSpan={8} className="px-4 py-3 bg-[var(--surface-2)]/40">
                          {detailLoading ? (
                            <span className="text-[11px] text-[var(--text-tertiary)]">Loading detail…</span>
                          ) : detail.length === 0 ? (
                            <span className="text-[11px] text-[var(--text-tertiary)]">No entries.</span>
                          ) : (
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="text-[var(--text-tertiary)]">
                                  <th className="text-left py-1 font-bold">Day</th>
                                  <th className="text-left py-1 font-bold">Project</th>
                                  <th className="text-left py-1 font-bold">In</th>
                                  <th className="text-left py-1 font-bold">Out</th>
                                  <th className="text-right py-1 font-bold">Break</th>
                                  <th className="text-right py-1 font-bold">Hours</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detail.map(d => (
                                  <tr key={d.entryId} className="border-t border-[var(--border)]/60">
                                    <td className="py-1 font-mono">
                                      {new Date(d.workDay + 'T00:00:00').toLocaleDateString(undefined, {
                                        weekday: 'short', month: 'short', day: 'numeric',
                                      })}
                                    </td>
                                    <td className="py-1">{d.projectName}</td>
                                    <td className="py-1 font-mono">{new Date(d.clockIn).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</td>
                                    <td className="py-1 font-mono">{new Date(d.clockOut).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</td>
                                    <td className="py-1 text-right font-mono">{d.pausedMinutes} min</td>
                                    <td className="py-1 text-right font-mono tabular-nums font-bold text-[var(--text-primary)]">{hrs(d.hours)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
            {byEmployee.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[var(--border)] bg-[var(--surface-2)]">
                  <td className="px-4 py-3 font-black text-[var(--text-primary)]" colSpan={3}>Period total</td>
                  <td />
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-bold">{hrs(grand.overtime)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-black text-[var(--text-primary)]">{hrs(grand.hours)}</td>
                  <td />
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-black text-[var(--text-primary)]">{money(grand.cost)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)] leading-snug">
        Click an employee&apos;s name to see their day-by-day detail. Pick period boundaries on a Monday and a
        Sunday: a period that cuts a week in half counts only the days inside it, so that week&apos;s overtime is
        figured on partial hours.
      </p>

      {invoiceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={closeInvoice}>
          <div
            className={`bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl w-full ${preview ? 'max-w-3xl' : 'max-w-lg'} p-5 max-h-[90vh] overflow-y-auto`}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-sm font-black text-[var(--text-primary)]">Labor invoice</h2>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-1 mb-4">
              {preview
                ? 'Check it before it goes on the record. Nothing has been saved yet.'
                : `One line per week from ${from} to ${to}, using the hours already in this table.`}
            </p>

            {preview ? (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Hours', value: hrs(preview.summary.totalHours) },
                    { label: 'Labor', value: money(preview.summary.laborSubtotal) },
                    { label: 'Reimbursements', value: money(preview.summary.reimbursements) },
                    { label: 'Balance due', value: money(preview.summary.total) },
                  ].map(m => (
                    <div key={m.label} className={`${card} p-2.5`}>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                        {m.label}
                      </span>
                      <span className="text-sm font-extrabold text-[var(--text-primary)]">{m.value}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10.5px] text-[var(--text-secondary)]">
                  {preview.summary.weekCount} week{preview.summary.weekCount === 1 ? '' : 's'}
                  {preview.summary.dayCount > 0
                    ? ` · detail sheet with ${preview.summary.dayCount} days`
                    : ' · no detail sheet'}
                  {preview.summary.expenseCount > 0 ? ` and ${preview.summary.expenseCount} expenses` : ''}
                </p>

                {preview.alreadyUsed && !savedId && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold p-2.5 rounded-lg">
                    Invoice {invoice.invoiceNumber} already exists. Saving will overwrite that record — change
                    the number if this is a different invoice.
                  </div>
                )}

                {savedId && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold p-2.5 rounded-lg flex items-center justify-between gap-3">
                    <span>Recorded as {invoice.invoiceNumber}.</span>
                    <Link href="/time-tracking/invoices" className="underline whitespace-nowrap">
                      Open invoice history
                    </Link>
                  </div>
                )}

                {previewUrl && (
                  <iframe
                    src={previewUrl}
                    title="Invoice preview"
                    className="w-full h-[52vh] rounded-lg border border-[var(--border)] bg-white"
                  />
                )}

                <div className="flex justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreview(null)}
                    disabled={invoiceBusy}
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
                  >
                    ← Back to edit
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => savePdf(preview.base64, preview.fileName)}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer"
                    >
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={savedId ? closeInvoice : saveInvoice}
                      disabled={invoiceBusy}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer disabled:opacity-50"
                    >
                      {savedId ? 'Done' : invoiceBusy ? 'Saving…' : 'Save to history'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={invLabel}>Bill to</label>
                <select
                  className={invField}
                  value={invoice.customerId}
                  onChange={e => setInvoice({ ...invoice, customerId: e.target.value })}
                >
                  <option value="">— Select a customer —</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={invLabel}>Invoice #</label>
                <input className={invField} value={invoice.invoiceNumber} onChange={e => setInvoice({ ...invoice, invoiceNumber: e.target.value })} />
              </div>
              <div>
                <label className={invLabel}>Invoice date</label>
                <input type="date" className={invField} value={invoice.invoiceDate} onChange={e => setInvoice({ ...invoice, invoiceDate: e.target.value })} />
              </div>
              <div>
                <label className={invLabel}>Payment terms</label>
                <select className={invField} value={invoice.paymentTerms} onChange={e => setInvoice({ ...invoice, paymentTerms: e.target.value })}>
                  {['Due on receipt', 'Net 14', 'Net 15', 'Net 30', 'Net 45', 'Net 60'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={invLabel}>Project / PO</label>
                <input className={invField} value={invoice.projectOrPo} onChange={e => setInvoice({ ...invoice, projectOrPo: e.target.value })} />
              </div>
              <div>
                <label className={invLabel}>Reimbursement label</label>
                <input className={invField} placeholder="Fuel Reimbursement" value={invoice.reimbursementLabel} onChange={e => setInvoice({ ...invoice, reimbursementLabel: e.target.value })} />
              </div>
              <div>
                <label className={invLabel}>Reimbursement amount</label>
                <input type="number" step="0.01" className={invField} placeholder="0.00" value={invoice.reimbursementAmount} onChange={e => setInvoice({ ...invoice, reimbursementAmount: e.target.value })} />
              </div>
              <div>
                <label className={invLabel}>Other / Tax</label>
                <input type="number" step="0.01" className={invField} placeholder="0.00" value={invoice.otherOrTax} onChange={e => setInvoice({ ...invoice, otherOrTax: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={invLabel}>Notes / payment instructions</label>
                <textarea rows={3} className={invField} value={invoice.notes} onChange={e => setInvoice({ ...invoice, notes: e.target.value })} />
              </div>
            </div>

            <label className="flex items-start gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDetail}
                onChange={e => setIncludeDetail(e.target.checked)}
                className="mt-0.5 accent-[var(--accent)]"
              />
              <span className="text-[11px] text-[var(--text-secondary)] leading-snug">
                <span className="font-bold text-[var(--text-primary)]">Attach the detail sheet</span> — a second
                page listing every day worked and every expense behind the totals. Uncheck it for a one-page
                invoice.
              </span>
            </label>

            <p className="text-[10px] text-[var(--text-tertiary)] mt-3 leading-snug">
              The reimbursement is pre-filled with the expenses marked billable in this period. Clear the
              amount to leave it off. A reimbursement line only appears when it has both a label and an amount.
            </p>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={closeInvoice} disabled={invoiceBusy}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={buildPreview} disabled={invoiceBusy}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer disabled:opacity-50">
                {invoiceBusy ? 'Building…' : 'Preview invoice'}
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

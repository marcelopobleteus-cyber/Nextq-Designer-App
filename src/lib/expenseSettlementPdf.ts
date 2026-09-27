/**
 * Rendicion de gastos (PDF).
 *
 * Responde una sola pregunta: de lo gastado en el periodo, que salio del fondo
 * de efectivo que entrego el cliente y que salio del bolsillo de la persona.
 * Son dos deudas distintas y se liquidan distinto, asi que van en secciones
 * separadas y nunca sumadas en una sola tabla.
 *
 * Vive fuera del server action, igual que laborInvoicePdf y payStatementPdf:
 * la maquetacion se puede generar y revisar sin levantar la app.
 *
 * Aqui no se calcula nada. Los totales llegan resueltos desde el action para
 * que no existan dos verdades sobre cuanto se debe.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'

/** Un gasto, del fondo o propio. */
export interface SettlementRow {
  /** ISO yyyy-mm-dd */
  date: string
  vendor: string
  /** "Fuel - Truck #17 (12.894 gal @ $3.899)" */
  detail: string
  project: string
  /** Auth, bomba, hora, odometro: lo que permite cruzar contra el recibo. */
  reference: string
  /** "Fuel", "Material"… se muestra en el anexo, donde no cabe el detalle. */
  category: string
  amount: number
  /** false dibuja el aviso de recibo faltante: sin foto la linea no se sostiene. */
  hasReceipt: boolean
  /**
   * La foto del recibo, ya girada y reducida. Presente solo cuando el informe
   * lleva anexo: el cuerpo del informe no cambia por esto, se agregan hojas.
   */
  receiptImage?: { bytes: Uint8Array; width: number; height: number }
}

export interface SettlementAdvance {
  /** ISO yyyy-mm-dd */
  givenOn: string
  amount: number
  notes: string
}

export interface SettlementParty {
  name: string
  addressLines: string[]
}

export interface SettlementInput {
  from: SettlementParty
  billTo: SettlementParty | null
  /** ISO yyyy-mm-dd */
  periodFrom: string
  periodTo: string
  issuedOn: string
  advances: SettlementAdvance[]
  fundRows: SettlementRow[]
  ownRows: SettlementRow[]
  totalAdvanced: number
  totalFund: number
  totalOwn: number
  /** Gastado de mas contra el fondo. Cero cuando el fondo alcanzo. */
  overspend: number
  /** Efectivo del fondo todavia sin gastar. Cero cuando se gasto todo. */
  unspent: number
  totalDue: number
  notes: string
}

const NAVY = rgb(0.11, 0.20, 0.35)
const ORANGE = rgb(1.0, 0.416, 0.075)
const INK = rgb(0.09, 0.11, 0.15)
const MUTED = rgb(0.42, 0.45, 0.5)
const LINE = rgb(0.82, 0.84, 0.88)
const BAND = rgb(0.93, 0.94, 0.96)
const WHITE = rgb(1, 1, 1)
const PALE = rgb(0.85, 0.87, 0.91)
const RED = rgb(0.72, 0.15, 0.15)

const MARGIN = 48
const PAGE_W = 612
const PAGE_H = 792

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function fmtDate(isoDay: string): string {
  const [y, m, d] = isoDay.split('-').map(Number)
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`
}

/** Corta el texto para que nunca invada la columna del monto. */
function fit(font: PDFFont, text: string, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let out = text
  while (out.length > 1 && font.widthOfTextAtSize(`${out}…`, size) > maxWidth) {
    out = out.slice(0, -1)
  }
  return `${out}…`
}

export async function buildExpenseSettlementPdf(input: SettlementInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const reg = await pdf.embedFont(StandardFonts.Helvetica)

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H])
  const right = PAGE_W - MARGIN
  const colVendor = MARGIN + 76
  /** Ancho util de la columna central, dejando aire antes del monto. */
  const textWidth = right - colVendor - 72
  let y = PAGE_H

  const text = (s: string, x: number, size: number, font: PDFFont, color = INK) =>
    page.drawText(s, { x, y, size, font, color })

  const tright = (s: string, x: number, size: number, font: PDFFont, color = INK) =>
    page.drawText(s, { x: x - font.widthOfTextAtSize(s, size), y, size, font, color })

  const rule = (color = LINE, width = 0.4) =>
    page.drawLine({ start: { x: MARGIN, y }, end: { x: right, y }, thickness: width, color })

  /** Salta de hoja cuando lo que viene no cabe. Sin esto las filas se salen. */
  const ensure = (needed: number) => {
    if (y - needed > 46) return
    page = pdf.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN
  }

  // ── Encabezado ─────────────────────────────────────────────────────────────
  y -= 34 + 52
  page.drawRectangle({ x: MARGIN, y, width: right - MARGIN, height: 52, color: NAVY })
  page.drawText(input.from.name.toUpperCase(), {
    x: MARGIN + 16, y: y + 19, size: 17, font: bold, color: WHITE,
  })
  page.drawText('EXPENSE REPORT', {
    x: right - 16 - bold.widthOfTextAtSize('EXPENSE REPORT', 17), y: y + 19,
    size: 17, font: bold, color: WHITE,
  })

  y -= 16
  for (const line of input.from.addressLines) {
    text(line, MARGIN, 8, reg, MUTED)
    y -= 10
  }

  y -= 14
  text('SUBMITTED TO', MARGIN, 8, bold)
  text('PERIOD', MARGIN + 230, 8, bold)
  tright('TOTAL DUE', right, 8, bold)

  y -= 14
  text(input.billTo?.name ?? '—', MARGIN, 10, reg)
  text(`${fmtDate(input.periodFrom)} – ${fmtDate(input.periodTo)}`, MARGIN + 230, 10, reg)
  tright(money(input.totalDue), right, 12, bold, ORANGE)

  y -= 12
  for (const line of (input.billTo?.addressLines ?? []).slice(0, 2)) {
    text(fit(reg, line, 8, 210), MARGIN, 8, reg, MUTED)
    y -= 10
  }

  y -= 12
  rule(LINE, 0.8)

  // ── Tablas ─────────────────────────────────────────────────────────────────
  const header = (title: string, subtitle: string) => {
    ensure(90)
    y -= 20
    text(title, MARGIN, 11, bold, NAVY)
    y -= 12
    text(fit(reg, subtitle, 8, right - MARGIN), MARGIN, 8, reg, MUTED)
    y -= 14
    page.drawRectangle({ x: MARGIN, y: y - 5, width: right - MARGIN, height: 16, color: BAND })
    text('Date', MARGIN + 2, 8, bold)
    text('Vendor / Detail', colVendor, 8, bold)
    tright('Amount', right - 2, 8, bold)
    y -= 18
  }

  const row = (r: SettlementRow) => {
    ensure(46)
    text(fmtDate(r.date), MARGIN, 8.5, reg)
    text(fit(bold, r.vendor, 8.5, textWidth), colVendor, 8.5, bold)
    tright(money(r.amount), right, 9, bold)
    y -= 10
    text(fit(reg, r.detail, 7.5, textWidth), colVendor, 7.5, reg, MUTED)
    y -= 9
    // El aviso de recibo faltante va al final de la misma linea y no en una
    // propia: son cinco palabras que si ocupan renglon empujan el informe a una
    // segunda hoja por algo que se arregla subiendo una foto.
    const mark = r.hasReceipt ? '' : '  ·  NO RECEIPT'
    const markWidth = mark ? bold.widthOfTextAtSize(mark, 7.5) : 0
    const tail = fit(reg, [r.project, r.reference].filter(Boolean).join('  ·  '), 7.5, textWidth - markWidth)
    text(tail, colVendor, 7.5, reg, MUTED)
    if (mark) text(mark, colVendor + reg.widthOfTextAtSize(tail, 7.5), 7.5, bold, RED)
    // La regla va a media altura entre esta fila y la siguiente. Dibujarla
    // pegada al salto la deja cruzando la fecha de la fila de abajo.
    y -= 9
    rule()
    y -= 9
  }

  const amountLine = (label: string, amount: number, font: PDFFont, color = INK) => {
    ensure(24)
    text(label, colVendor, 9, font, color)
    tright(money(amount), right, 9.5, font, color)
    y -= 16
  }

  // ── A. Fondo de efectivo ───────────────────────────────────────────────────
  const advanceText = input.advances.length > 0
    ? `Cash received: ${input.advances.map(a => `${money(a.amount)} on ${fmtDate(a.givenOn)}`).join(', ')}. Spent against that fund:`
    : 'No cash advance on record for this period. Everything below was charged as company cash:'

  header('A.  COMPANY CASH ADVANCE', advanceText)

  if (input.fundRows.length === 0) {
    text('Nothing was spent from the fund in this period.', colVendor, 8.5, reg, MUTED)
    y -= 18
  } else {
    for (const r of input.fundRows) row(r)
  }

  y -= 4
  amountLine('Spent from the fund', input.totalFund, bold)
  y += 4
  amountLine('Advance received', input.totalAdvanced, reg, MUTED)

  if (input.overspend > 0) {
    amountLine('Overspent — paid out of pocket', input.overspend, bold, ORANGE)
  } else if (input.unspent > 0) {
    amountLine('Cash still on hand', input.unspent, bold, NAVY)
  }

  y += 10
  rule(NAVY, 0.8)
  y -= 12
  const fundNote = input.overspend > 0
    ? 'The fund is fully accounted for. Receipts above total more than the cash received.'
    : input.unspent > 0
      ? 'Part of the advance is still unspent and is not being claimed here.'
      : 'The fund is fully accounted for.'
  text(fundNote, MARGIN, 7.5, reg, MUTED)

  // ── B. Dinero propio ───────────────────────────────────────────────────────
  header('B.  PAID PERSONALLY', 'Spent with personal funds, outside the cash advance. Reimbursable.')

  if (input.ownRows.length === 0) {
    text('Nothing was paid out of pocket in this period.', colVendor, 8.5, reg, MUTED)
    y -= 18
  } else {
    for (const r of input.ownRows) row(r)
  }

  y -= 4
  amountLine('Out-of-pocket subtotal', input.totalOwn, bold)

  // ── Liquidacion ────────────────────────────────────────────────────────────
  const settleLines: { label: string; amount: number }[] = []
  const replenish = Math.min(input.totalFund, input.totalAdvanced)
  if (replenish > 0) settleLines.push({ label: 'Replenish cash fund', amount: replenish })
  if (input.overspend > 0) settleLines.push({ label: 'Reimburse overspend on fund', amount: input.overspend })
  if (input.totalOwn > 0) settleLines.push({ label: 'Reimburse out-of-pocket expenses', amount: input.totalOwn })

  const noteLines = input.notes.split('\n').filter(Boolean)

  // Alto real del bloque, no una estimacion: titulo a 22 del borde, una linea
  // cada 15, y 22 de aire bajo el total. Estimarlo de mas deja el titulo de las
  // notas metido dentro del azul, que fue exactamente el primer error aqui.
  const blockHeight = 22 + 18 + settleLines.length * 15 + 16
  const tailHeight = 6 + blockHeight + 30 + noteLines.length * 10

  ensure(tailHeight)
  y -= 6

  const blockTop = y
  page.drawRectangle({
    x: MARGIN, y: blockTop - blockHeight, width: right - MARGIN, height: blockHeight, color: NAVY,
  })

  y = blockTop - 22
  text('SETTLEMENT', MARGIN + 14, 10, bold, WHITE)
  y -= 18
  for (const l of settleLines) {
    text(l.label, MARGIN + 14, 8.5, reg, PALE)
    tright(money(l.amount), right - 14, 9, reg, WHITE)
    y -= 15
  }
  page.drawLine({
    start: { x: MARGIN + 14, y: y + 9 }, end: { x: right - 14, y: y + 9 },
    thickness: 0.6, color: rgb(0.25, 0.35, 0.48),
  })
  text(`TOTAL DUE TO ${input.from.name.toUpperCase()}`, MARGIN + 14, 9, bold, WHITE)
  tright(money(input.totalDue), right - 14, 12, bold, ORANGE)

  // ── Notas ──────────────────────────────────────────────────────────────────
  y = blockTop - blockHeight - 22
  text('Notes', MARGIN, 8.5, bold, NAVY)
  y -= 12
  for (const line of noteLines) {
    text(fit(reg, line, 7.5, right - MARGIN), MARGIN, 7.5, reg, MUTED)
    y -= 10
  }

  // ── Anexo: las fotos de los recibos ────────────────────────────────────────
  //
  // Seis por hoja, en tres columnas. La celda es vertical porque la foto de un
  // recibo tambien lo es: en una grilla de dos columnas la foto quedaria
  // limitada por el alto de la celda y sobraria la mitad del ancho.
  //
  // Cada cuadro lleva solo lo que identifica el gasto en la lista de arriba
  // (proveedor, fecha, categoria y total). El detalle completo ya esta en el
  // cuerpo; repetirlo aqui robaria el espacio de la foto, que es lo unico que
  // esta hoja viene a aportar.
  const annex = [...input.fundRows, ...input.ownRows].filter(r => r.receiptImage)

  const COLS = 3
  const ROWS = 2
  const GAP_X = 14
  const GAP_Y = 16
  const CAPTION = 26
  const cellW = (right - MARGIN - GAP_X * (COLS - 1)) / COLS

  for (let start = 0; start < annex.length; start += COLS * ROWS) {
    page = pdf.addPage([PAGE_W, PAGE_H])
    y = PAGE_H - MARGIN

    page.drawRectangle({ x: MARGIN, y: y - 26, width: right - MARGIN, height: 26, color: NAVY })
    const last = Math.min(start + COLS * ROWS, annex.length)
    page.drawText(`RECEIPTS  ${start + 1}–${last} OF ${annex.length}`, {
      x: MARGIN + 12, y: y - 17.5, size: 8.5, font: bold, color: WHITE,
    })
    const periodLabel = `${fmtDate(input.periodFrom)} – ${fmtDate(input.periodTo)}`
    page.drawText(periodLabel, {
      x: right - 12 - reg.widthOfTextAtSize(periodLabel, 8), y: y - 17.5,
      size: 8, font: reg, color: PALE,
    })

    const gridTop = y - 26 - 14
    const cellH = (gridTop - 56 - GAP_Y * (ROWS - 1)) / ROWS

    for (let i = start; i < last; i++) {
      const r = annex[i]
      const img = r.receiptImage!
      const col = (i - start) % COLS
      const row = Math.floor((i - start) / COLS)
      const x0 = MARGIN + col * (cellW + GAP_X)
      const top = gridTop - row * (cellH + GAP_Y)

      y = top - 8
      text(fit(bold, r.vendor, 7.5, cellW), x0, 7.5, bold)
      y -= 9
      text(fit(reg, `${fmtDate(r.date)}  ·  ${r.category}`, 6.5, cellW - 34), x0, 6.5, reg, MUTED)
      tright(money(r.amount), x0 + cellW, 7.5, bold, ORANGE)

      const boxW = cellW
      const boxH = cellH - CAPTION
      const scale = Math.min(boxW / img.width, boxH / img.height)
      const drawW = img.width * scale
      const drawH = img.height * scale

      const embedded = await pdf.embedJpg(img.bytes)
      page.drawImage(embedded, {
        x: x0 + (boxW - drawW) / 2,
        y: top - CAPTION - drawH,
        width: drawW,
        height: drawH,
      })
    }
  }

  // Pie en todas las hojas: una rendicion suelta sin origen no sirve de nada.
  const pages = pdf.getPages()
  pages.forEach((p, i) => {
    p.drawText(`${input.from.name}  ·  Issued ${fmtDate(input.issuedOn)}`, {
      x: MARGIN, y: 34, size: 7, font: reg, color: MUTED,
    })
    const label = `Page ${i + 1} of ${pages.length}`
    p.drawText(label, {
      x: right - reg.widthOfTextAtSize(label, 7), y: 34, size: 7, font: reg, color: MUTED,
    })
  })

  return pdf.save()
}

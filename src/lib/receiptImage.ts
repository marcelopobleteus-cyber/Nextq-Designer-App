/**
 * Preparacion de las fotos de recibo para el anexo del PDF.
 *
 * Dos problemas que hay que resolver antes de meter una foto de telefono en un
 * PDF que viaja como respuesta de un server action:
 *
 * 1. Tamano. Una foto de un S25 pesa entre 2 y 5 MB. Cinco recibos son 20 MB,
 *    y la respuesta de una funcion serverless no pasa de ~4.5 MB. Hay que bajar
 *    la resolucion; un recibo se lee perfecto a 1400 px de lado mayor.
 *
 * 2. Orientacion. La camara guarda la foto en horizontal y anota en el EXIF
 *    como hay que girarla. pdf-lib no mira el EXIF, asi que sin esto el anexo
 *    sale con todos los recibos acostados.
 *
 * Se usa jpeg-js, que es JavaScript puro: no necesita compilar nada y corre
 * igual en Vercel que en local.
 */

import { decode, encode } from 'jpeg-js'

/** Lado mayor de la imagen que termina en el PDF. */
const MAX_SIDE = 1400
const QUALITY = 58

export interface PreparedImage {
  bytes: Uint8Array
  width: number
  height: number
}

/**
 * Orientacion EXIF de un JPEG. Devuelve 1 cuando no la trae o no se entiende:
 * asumir "derecha" es el unico default que no empeora una foto normal.
 *
 * Se recorren los segmentos APP hasta dar con el APP1 "Exif\0\0", y dentro del
 * IFD0 se busca la etiqueta 0x0112. No se usa una libreria porque es lo unico
 * que hace falta del EXIF entero.
 */
export function exifOrientation(buf: Uint8Array): number {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return 1

  let offset = 2
  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) return 1
    const marker = buf[offset + 1]
    // SOS: a partir de aqui viene la imagen comprimida, ya no hay metadatos.
    if (marker === 0xda) return 1
    const size = (buf[offset + 2] << 8) | buf[offset + 3]
    if (size < 2) return 1

    if (marker === 0xe1) {
      const head = offset + 4
      const isExif =
        buf[head] === 0x45 && buf[head + 1] === 0x78 &&
        buf[head + 2] === 0x69 && buf[head + 3] === 0x66
      if (isExif) {
        const tiff = head + 6
        if (tiff + 8 > buf.length) return 1
        const little = buf[tiff] === 0x49 && buf[tiff + 1] === 0x49
        const u16 = (p: number) => (little ? buf[p] | (buf[p + 1] << 8) : (buf[p] << 8) | buf[p + 1])
        const u32 = (p: number) =>
          little
            ? (buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16) | (buf[p + 3] << 24)) >>> 0
            : ((buf[p] << 24) | (buf[p + 1] << 16) | (buf[p + 2] << 8) | buf[p + 3]) >>> 0

        const ifd0 = tiff + u32(tiff + 4)
        if (ifd0 + 2 > buf.length) return 1
        const count = u16(ifd0)
        for (let i = 0; i < count; i++) {
          const entry = ifd0 + 2 + i * 12
          if (entry + 12 > buf.length) break
          if (u16(entry) === 0x0112) {
            const value = u16(entry + 8)
            return value >= 1 && value <= 8 ? value : 1
          }
        }
      }
    }
    offset += 2 + size
  }
  return 1
}

/** Gira el mapa de pixeles segun la orientacion EXIF. */
function orient(
  src: Uint8Array, w: number, h: number, orientation: number,
): { data: Uint8Array; width: number; height: number } {
  if (orientation === 1) return { data: src, width: w, height: h }

  const quarter = orientation === 6 || orientation === 8
  const width = quarter ? h : w
  const height = quarter ? w : h
  const out = new Uint8Array(width * height * 4)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let nx = x
      let ny = y
      if (orientation === 3) { nx = w - 1 - x; ny = h - 1 - y }
      else if (orientation === 6) { nx = h - 1 - y; ny = x }
      else if (orientation === 8) { nx = y; ny = w - 1 - x }
      const from = (y * w + x) * 4
      const to = (ny * width + nx) * 4
      out[to] = src[from]
      out[to + 1] = src[from + 1]
      out[to + 2] = src[from + 2]
      out[to + 3] = src[from + 3]
    }
  }
  return { data: out, width, height }
}

/**
 * Promedia bloques de NxN en vez de tomar un pixel de cada N. Con texto fino
 * como el de un recibo termico, saltarse pixeles borra trazos completos.
 */
function downscale(
  src: Uint8Array, w: number, h: number, factor: number,
): { data: Uint8Array; width: number; height: number } {
  if (factor <= 1) return { data: src, width: w, height: h }

  const width = Math.max(1, Math.floor(w / factor))
  const height = Math.max(1, Math.floor(h / factor))
  const out = new Uint8Array(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, n = 0
      const y0 = y * factor
      const x0 = x * factor
      for (let dy = 0; dy < factor && y0 + dy < h; dy++) {
        for (let dx = 0; dx < factor && x0 + dx < w; dx++) {
          const p = ((y0 + dy) * w + (x0 + dx)) * 4
          r += src[p]; g += src[p + 1]; b += src[p + 2]; n++
        }
      }
      const q = (y * width + x) * 4
      out[q] = r / n
      out[q + 1] = g / n
      out[q + 2] = b / n
      out[q + 3] = 255
    }
  }
  return { data: out, width, height }
}

/**
 * Deja la foto lista para el PDF: derecha, chica y re-comprimida.
 * Devuelve null si el archivo no se puede decodificar, y en ese caso el anexo
 * simplemente omite esa hoja en vez de reventar el informe entero.
 */
export function prepareReceiptJpeg(input: Uint8Array): PreparedImage | null {
  try {
    const orientation = exifOrientation(input)
    const raw = decode(input, { useTArray: true, formatAsRGBA: true })

    const turned = orient(
      raw.data as unknown as Uint8Array, raw.width, raw.height, orientation,
    )

    const factor = Math.max(1, Math.ceil(Math.max(turned.width, turned.height) / MAX_SIDE))
    const small = downscale(turned.data, turned.width, turned.height, factor)

    const out = encode({ data: small.data, width: small.width, height: small.height }, QUALITY)
    return { bytes: new Uint8Array(out.data), width: small.width, height: small.height }
  } catch {
    return null
  }
}

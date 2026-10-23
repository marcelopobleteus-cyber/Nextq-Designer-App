/**
 * Prepara un archivo del navegador para mandarlo a un server action.
 *
 * Por que existe: una foto de telefono pesa 2–6 MB. Convertida a base64 crece
 * un 33%, y Vercel corta cualquier request de mas de ~4.5 MB antes de que llegue
 * al server action. Ademas, `String.fromCharCode(...bytes)` revienta la pila con
 * archivos de varios MB. Las dos cosas dejaban el boton pegado en "Saving...".
 *
 * Las fotos se reducen a 2000 px de lado mayor y se recomprimen a JPEG: un
 * recibo se sigue leyendo perfecto y queda en ~300–700 KB. createImageBitmap
 * aplica la orientacion EXIF, asi que la foto queda derecha.
 * Los PDF se mandan tal cual, con un tope que si cabe en el request.
 */

const MAX_SIDE = 2000
const JPEG_QUALITY = 0.82
/** Tope del archivo crudo para que el base64 quepa en el limite de Vercel. */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024

export interface PreparedUpload {
  base64: string
  contentType: string
  fileName: string
  bytes: number
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.onerror = () => reject(reader.error || new Error('Could not read the file.'))
    reader.readAsDataURL(blob)
  })
}

async function compressImage(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
  } catch {
    // Formato que el navegador no sabe decodificar (p. ej. HEIC en Chrome).
    return null
  }
}

export async function prepareUpload(file: File): Promise<PreparedUpload> {
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)

  if (isImage) {
    const blob = await compressImage(file)
    if (blob) {
      const base = file.name.replace(/\.[^.]+$/, '') || 'receipt'
      return {
        base64: await blobToBase64(blob),
        contentType: 'image/jpeg',
        fileName: `${base}.jpg`,
        bytes: blob.size,
      }
    }
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `The file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 3 MB — take a screenshot of it or export it smaller.`,
    )
  }

  return {
    base64: await blobToBase64(file),
    contentType: file.type || 'application/octet-stream',
    fileName: file.name,
    bytes: file.size,
  }
}

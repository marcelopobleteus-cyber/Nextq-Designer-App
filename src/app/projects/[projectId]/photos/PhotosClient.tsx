'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  getProjectPhotos, addProjectPhoto, updateProjectPhoto, deleteProjectPhoto,
  type ProjectPhoto,
} from './actions'

/** Lado mayor con el que sube la foto. Un recibo o un poste se leen de sobra. */
const MAX_SIDE = 1600
const QUALITY = 0.72

const card = 'bg-[var(--surface-1)] border border-[var(--border)] rounded-xl'

function fmt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Reduce la foto en el telefono antes de subirla.
 *
 * Esto no es una optimizacion de lujo: en terreno se sube por datos moviles y
 * una foto de un telefono actual pesa varios MB. createImageBitmap con
 * imageOrientation 'from-image' ademas aplica el giro del EXIF, asi que la foto
 * llega derecha sin tener que interpretarlo a mano.
 */
async function shrink(file: File): Promise<{ base64: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
  return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), width, height }
}

/**
 * Posicion actual, o null. Nunca rechaza: una foto sin GPS sigue siendo util y
 * no puede ser motivo para perderla.
 */
function locate(): Promise<GeolocationPosition | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null)
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      p => resolve(p),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  })
}

export default function PhotosClient({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const [photos, setPhotos] = useState<ProjectPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [editing, setEditing] = useState<ProjectPhoto | null>(null)
  const [viewing, setViewing] = useState<ProjectPhoto | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getProjectPhotos(projectId)
    setPhotos(res.photos)
    setLoading(false)
    if (res.error) setNotice({ text: res.error, kind: 'error' })
  }, [projectId])

  // Diferido a un tick: llamar setState de forma sincrona dentro del efecto
  // encadena renders y lo marca el linter.
  useEffect(() => {
    const id = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(id)
  }, [load])

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    // El GPS se pide una sola vez para toda la tanda: son fotos del mismo punto
    // y pedirlo por cada una agrega segundos sin agregar precision.
    const position = await locate()
    const list = Array.from(files)
    let ok = 0

    for (let i = 0; i < list.length; i++) {
      setUploading(`Uploading ${i + 1} of ${list.length}…`)
      try {
        const { base64, width, height } = await shrink(list[i])
        const res = await addProjectPhoto(projectId, {
          base64,
          contentType: 'image/jpeg',
          label,
          notes: '',
          // lastModified es cuando el telefono guardo la foto: si la sacaste
          // hace una hora sin senal, esa es la hora que vale.
          takenAt: new Date(list[i].lastModified || Date.now()).toISOString(),
          latitude: position?.coords.latitude ?? null,
          longitude: position?.coords.longitude ?? null,
          accuracyM: position?.coords.accuracy ?? null,
          width,
          height,
        })
        if (res.error) {
          setNotice({ text: `Photo ${i + 1} did not upload: ${res.error}`, kind: 'error' })
        } else {
          ok++
        }
      } catch {
        setNotice({ text: `Photo ${i + 1} could not be read on this device.`, kind: 'error' })
      }
    }

    setUploading(null)
    if (fileRef.current) fileRef.current.value = ''
    if (ok > 0) {
      setNotice({
        text: `${ok} photo${ok === 1 ? '' : 's'} uploaded${position ? ' with location' : ' — no location available'}.`,
        kind: 'ok',
      })
    }
    await load()
  }

  const saveEdit = async () => {
    if (!editing) return
    const res = await updateProjectPhoto(editing.id, editing.label ?? '', editing.notes ?? '')
    if (res.error) { setNotice({ text: res.error, kind: 'error' }); return }
    setEditing(null)
    await load()
  }

  const remove = async (photo: ProjectPhoto) => {
    if (!confirm('Delete this photo? This cannot be undone.')) return
    const res = await deleteProjectPhoto(photo.id)
    if (res.error) { setNotice({ text: res.error, kind: 'error' }); return }
    setViewing(null)
    await load()
  }

  return (
    <div className="w-full h-full px-4 sm:px-6 py-4 flex-1 flex flex-col overflow-y-auto bg-[var(--bg)] font-sans space-y-4">
      <div>
        <h1 className="text-sm font-black text-[var(--text-primary)] tracking-tight">Field Photos</h1>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 max-w-3xl">
          Photos taken on site for {projectName}. Each one records the date, who took it and where
          your phone was standing.
        </p>
      </div>

      {notice && (
        <div onClick={() => setNotice(null)}
          className={`px-4 py-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${
            notice.kind === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-600'
              : 'bg-red-500/10 border border-red-500/25 text-red-500'}`}>
          {notice.text}
        </div>
      )}

      {/* La etiqueta se escribe ANTES de disparar la camara. En terreno, con
          guantes y sol, escribir despues de cada foto no ocurre. */}
      <div className={`${card} p-3 space-y-3`}>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
            Label for the next photos
          </label>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Pedestrian pole — NE corner"
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={e => onFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={Boolean(uploading)}
          className="w-full py-3.5 rounded-xl bg-[var(--accent)] text-white text-sm font-black cursor-pointer disabled:opacity-50"
        >
          {uploading ?? 'Take or choose photos'}
        </button>
        <p className="text-[10px] text-[var(--text-tertiary)]">
          Photos are resized on your phone before they upload, so this works on cell data.
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--text-secondary)]">Loading…</div>
      ) : photos.length === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <p className="text-xs text-[var(--text-secondary)]">No field photos yet.</p>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            Label what you are about to shoot, then use the button above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map(p => (
            <div key={p.id} className={`${card} overflow-hidden`}>
              <button
                type="button"
                onClick={() => setViewing(p)}
                className="block w-full aspect-square bg-[var(--surface-2)] cursor-pointer"
              >
                {p.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.url} alt={p.label ?? 'Field photo'} className="w-full h-full object-cover" />
                )}
              </button>
              <div className="p-2.5">
                <p className="text-[11px] font-bold text-[var(--text-primary)] truncate">
                  {p.label ?? 'Untitled'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{fmt(p.takenAt)}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">{p.authorName}</p>
                {p.latitude != null && p.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-[var(--accent-text)] hover:underline"
                  >
                    View on map
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {viewing.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewing.url} alt={viewing.label ?? 'Field photo'}
                className="w-full max-h-[70vh] object-contain rounded-xl bg-black" />
            )}
            <div className="mt-3 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-sm font-black text-[var(--text-primary)]">{viewing.label ?? 'Untitled'}</p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {fmt(viewing.takenAt)} · {viewing.authorName}
              </p>
              {viewing.notes && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">{viewing.notes}</p>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setViewing(null)}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer">
                  Close
                </button>
                {viewing.canEdit && (
                  <>
                    <button type="button" onClick={() => { setEditing(viewing); setViewing(null) }}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer">
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(viewing)}
                      className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-red-600 text-white cursor-pointer">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}>
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl w-full max-w-md p-5"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-sm font-black text-[var(--text-primary)] mb-4">Edit photo</h2>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Label
            </label>
            <input
              value={editing.label ?? ''}
              onChange={e => setEditing({ ...editing, label: e.target.value })}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] mb-3"
            />
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              Notes
            </label>
            <textarea
              value={editing.notes ?? ''}
              onChange={e => setEditing({ ...editing, notes: e.target.value })}
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)]"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setEditing(null)}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={saveEdit}
                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-[var(--accent)] text-white cursor-pointer">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

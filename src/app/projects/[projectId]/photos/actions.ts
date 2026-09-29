'use server'

/**
 * Fotos de terreno de un proyecto.
 *
 * El navegador manda la foto ya comprimida y con su GPS. Aqui no se recomprime
 * nada: el telefono es el unico lugar donde la reduccion ahorra algo de verdad,
 * porque lo caro en terreno son los megabytes que suben por datos moviles.
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const BUCKET = 'project-photos'

/** 8 MB ya comprimida. Mas que eso es que la compresion del navegador fallo. */
const MAX_BYTES = 8 * 1024 * 1024

export interface ProjectPhoto {
  id: string
  takenAt: string
  label: string | null
  notes: string | null
  latitude: number | null
  longitude: number | null
  authorName: string
  /** URL firmada, valida una hora. */
  url: string | null
  canEdit: boolean
}

export interface PhotoInput {
  base64: string
  contentType: string
  label: string
  notes: string
  takenAt: string
  latitude: number | null
  longitude: number | null
  accuracyM: number | null
  width: number | null
  height: number | null
}

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

export async function getProjectPhotos(
  projectId: string,
): Promise<{ photos: ProjectPhoto[]; error?: string }> {
  const { supabase, userId, orgId, isManager } = await context()
  if (!orgId || !userId) return { photos: [], error: 'No organization for the current user.' }

  const { data: rows, error } = await supabase
    .from('project_photos')
    .select('id, profile_id, taken_at, label, notes, latitude, longitude, storage_path')
    .eq('project_id', projectId)
    .order('taken_at', { ascending: false })

  if (error) return { photos: [], error: error.message }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, email')

  const personName = new Map((profiles ?? []).map(p => [
    p.id,
    [p.first_name, p.last_name].filter(Boolean).join(' ') || p.full_name || p.email || 'Unknown',
  ]))

  // Las URLs firmadas se piden en lote: una por foto serian N viajes al
  // servidor, y una galeria de terreno puede traer decenas.
  const paths = (rows ?? []).map(r => r.storage_path)
  const signed = new Map<string, string>()
  if (paths.length > 0) {
    const { data: urls } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
    for (const u of urls ?? []) {
      if (u.path && u.signedUrl) signed.set(u.path, u.signedUrl)
    }
  }

  return {
    photos: (rows ?? []).map(r => ({
      id: r.id,
      takenAt: r.taken_at,
      label: r.label,
      notes: r.notes,
      latitude: r.latitude,
      longitude: r.longitude,
      authorName: personName.get(r.profile_id) ?? 'Unknown',
      url: signed.get(r.storage_path) ?? null,
      canEdit: isManager || r.profile_id === userId,
    })),
  }
}

/**
 * Sube una foto. La fila se crea DESPUES del archivo: al reves quedaria una
 * foto listada que al abrirla no existe, que es peor que no tenerla.
 */
export async function addProjectPhoto(
  projectId: string,
  input: PhotoInput,
): Promise<{ id?: string; error?: string }> {
  const { supabase, userId, orgId } = await context()
  if (!orgId || !userId) return { error: 'No organization for the current user.' }

  const buffer = Buffer.from(input.base64, 'base64')
  if (buffer.byteLength > MAX_BYTES) {
    return { error: 'The photo is too large. Try taking it again at a lower resolution.' }
  }

  const id = crypto.randomUUID()
  const ext = input.contentType.includes('png') ? 'png' : 'jpg'
  const path = `${orgId}/${projectId}/${id}.${ext}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: input.contentType, upsert: false })

  if (upErr) return { error: upErr.message }

  const { error } = await supabase.from('project_photos').insert({
    id,
    organization_id: orgId,
    project_id: projectId,
    profile_id: userId,
    taken_at: input.takenAt,
    label: input.label.trim() || null,
    notes: input.notes.trim() || null,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy_m: input.accuracyM,
    storage_path: path,
    width: input.width,
    height: input.height,
  })

  if (error) {
    // La fila fallo: el archivo se va con ella. Un huerfano en el bucket no lo
    // ve nadie y nadie lo limpia.
    await supabase.storage.from(BUCKET).remove([path])
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}/photos`)
  return { id }
}

export async function updateProjectPhoto(
  id: string,
  label: string,
  notes: string,
): Promise<{ error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { error: 'No organization for the current user.' }

  const { error } = await supabase
    .from('project_photos')
    .update({
      label: label.trim() || null,
      notes: notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  return {}
}

export async function deleteProjectPhoto(id: string): Promise<{ error?: string }> {
  const { supabase, orgId } = await context()
  if (!orgId) return { error: 'No organization for the current user.' }

  const { data: row } = await supabase
    .from('project_photos')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('project_photos').delete().eq('id', id)
  if (error) return { error: error.message }

  if (row?.storage_path) {
    await supabase.storage.from(BUCKET).remove([row.storage_path])
  }
  return {}
}

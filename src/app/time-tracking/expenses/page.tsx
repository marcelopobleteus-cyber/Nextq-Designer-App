import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getCachedUser } from '@/utils/supabase/cached'
import { BYPASS_AUTH } from '@/config/auth'
import ExpensesClient from './ExpensesClient'

/**
 * Decodificar y reducir cinco fotos de telefono en JavaScript puro toma varios
 * segundos. El limite por defecto de 10 s dejaria el informe a medias justo
 * cuando lleva el anexo completo.
 */
export const maxDuration = 60

export default async function ExpensesPage() {
  const user = await getCachedUser()
  if (!user && !BYPASS_AUTH) redirect('/login')

  const supabase = await createClient()

  const { data: memberRows } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('profile_id', user!.id)
    .limit(1)

  const orgId = memberRows?.[0]?.organization_id ?? null

  const [{ data: projects }, { data: org }, { data: customers }] = await Promise.all([
    orgId
      ? supabase.from('projects').select('id, name').eq('organization_id', orgId).order('name')
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    orgId
      ? supabase.from('organizations').select('name').eq('id', orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    orgId
      ? supabase.from('customers').select('id, name').eq('organization_id', orgId).order('name')
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ])

  // A quien se le factura la mano de obra es, en la practica, a quien se le
  // rinde el efectivo. Se usa como preseleccion para no obligar a elegirlo cada
  // vez, y el usuario lo puede cambiar.
  const { data: lastInvoice } = orgId
    ? await supabase
        .from('labor_invoices')
        .select('customer_id')
        .eq('organization_id', orgId)
        .not('customer_id', 'is', null)
        .order('invoice_date', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  return (
    <ExpensesClient
      projects={projects ?? []}
      organizationName={org?.name ?? 'Your organization'}
      customers={customers ?? []}
      defaultBillToId={lastInvoice?.customer_id ?? null}
    />
  )
}

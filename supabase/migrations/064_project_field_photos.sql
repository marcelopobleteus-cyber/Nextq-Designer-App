-- Fotos de terreno de un proyecto.  APLICADA EN PRODUCCION el 28/09/2026.
--
-- Una foto sacada en obra es evidencia: vale por la fecha, el lugar y quien la
-- tomo, no solo por la imagen. Por eso el GPS y el autor van en la fila y no
-- confiados al EXIF del archivo, que cualquier reenvio por WhatsApp borra.
--
-- La etiqueta es texto libre a proposito. En terreno no se sabe de antemano
-- como se va a llamar lo que hay que fotografiar, y obligar a elegir de una
-- lista termina con todo cayendo en "Otros".
create table if not exists public.project_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  -- Cuando se saco, no cuando se subio: en terreno sin senal pueden pasar horas.
  taken_at timestamptz not null default now(),
  label text,
  notes text,
  latitude double precision,
  longitude double precision,
  accuracy_m numeric,
  storage_path text not null,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists project_photos_project_idx
  on public.project_photos (project_id, taken_at desc);

alter table public.project_photos enable row level security;

create policy select_project_photos on public.project_photos
  for select to authenticated
  using (organization_id in (
    select m.organization_id from public.organization_members m
    where m.profile_id = auth.uid()
  ));

create policy insert_project_photos on public.project_photos
  for insert to authenticated
  with check (organization_id in (
    select m.organization_id from public.organization_members m
    where m.profile_id = auth.uid()
  ));

-- Editar y borrar: el autor de la foto, o quien administra la organizacion.
-- Una foto de terreno es el respaldo de otra persona, no se toca por estar
-- en el mismo tenant.
create policy update_project_photos on public.project_photos
  for update to authenticated
  using (
    profile_id = auth.uid()
    or organization_id in (
      select m.organization_id from public.organization_members m
      where m.profile_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );

create policy delete_project_photos on public.project_photos
  for delete to authenticated
  using (
    profile_id = auth.uid()
    or organization_id in (
      select m.organization_id from public.organization_members m
      where m.profile_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );

insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', false)
on conflict (id) do nothing;

-- Las cuatro politicas, UPDATE incluida. El bucket de recibos nacio sin ella y
-- el resultado fue que una foto equivocada no se podia reemplazar nunca.
create policy project_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.profile_id = auth.uid()
    )
  );

create policy project_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.profile_id = auth.uid()
    )
  );

create policy project_photos_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.profile_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.profile_id = auth.uid()
    )
  );

create policy project_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'project-photos'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text from public.organization_members m
      where m.profile_id = auth.uid()
    )
  );

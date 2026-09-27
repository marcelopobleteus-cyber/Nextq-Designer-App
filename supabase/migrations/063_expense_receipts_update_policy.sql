-- El bucket de recibos tenia SELECT, INSERT y DELETE, pero no UPDATE.
--
-- Subir la foto se hace con upsert: la primera vez es un INSERT y pasa, pero
-- reemplazarla es un UPDATE sobre el objeto que ya existe, y sin politica la
-- base lo rechaza con "new row violates row-level security policy". El efecto
-- practico era que una foto equivocada quedaba pegada al gasto para siempre.
--
-- Mismo alcance que las otras tres: la carpeta raiz del objeto es el id de la
-- organizacion, y solo sus miembros la tocan.
--
-- APLICADA EN PRODUCCION el 27/09/2026.
create policy expense_receipts_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from organization_members m
      where m.profile_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] in (
      select m.organization_id::text
      from organization_members m
      where m.profile_id = auth.uid()
    )
  );

-- =====================================================================
--  POLLAPP — Estado abrir/ocultar de los BONOS
--  Correr en SQL Editor > Run. Seguro de correr varias veces.
--
--  Qué hace:
--   1. Agrega la columna "status" a los bonos (abierto | oculto).
--   2. OCULTA los bonos de fases futuras que aún no se activan
--      (tarjetas dieciseisavos, alargues octavos, penales cuartos,
--       goles semis, goleador de la final).
--      Quedan visibles solo los ya respondidos (especiales + grupos),
--      que están cerrados por fecha.
--   3. Ajusta la seguridad: los jugadores NO ven los bonos ocultos y
--      no pueden responder bonos ocultos aunque conozcan la API.
-- =====================================================================

alter table bonus_questions add column if not exists status text not null default 'abierto';

update bonus_questions set status = 'oculto'
 where id in ('rojas_r32','alargues_octavos','penales_cuartos','goles_semis','goleador_final');

-- Los jugadores solo ven bonos abiertos (el admin ve todo vía service role)
drop policy if exists bq_select on bonus_questions;
create policy bq_select on bonus_questions for select to authenticated
  using (status = 'abierto');

-- Responder/editar: solo bonos abiertos y antes del deadline
drop policy if exists ba_insert_own on bonus_answers;
create policy ba_insert_own on bonus_answers for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from bonus_questions q
                where q.id = question_id and now() < q.deadline and q.status = 'abierto')
  );

drop policy if exists ba_update_own on bonus_answers;
create policy ba_update_own on bonus_answers for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from bonus_questions q
                where q.id = question_id and now() < q.deadline and q.status = 'abierto')
  );

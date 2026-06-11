-- =====================================================================
--  POLLAPP — "Ver apuestas" + Fixture completo
--  Correr en SQL Editor > Run. Seguro de correr varias veces.
--
--  1. Los partidos se ven TODOS (calendario completo en Fixture), aunque
--     estén "oculto" para apostar. (La página de Apuestas igual muestra solo
--     los que se pueden apostar; el Fixture muestra el calendario entero.)
--  2. Cada jugador puede ver las apuestas de TODOS, pero SOLO de partidos
--     cuyo plazo ya cerró (now >= lock_at). Antes del cierre, cada uno ve solo
--     la suya (anti-copia). Después: se revela todo (el picante 🔥).
-- =====================================================================

-- Partidos: visibles para cualquier logueado (calendario completo)
drop policy if exists matches_select on matches;
create policy matches_select on matches for select to authenticated using (true);

-- Pronósticos: ver los de todos cuando el partido ya cerró su plazo
drop policy if exists pred_select_locked on predictions;
create policy pred_select_locked on predictions for select to authenticated
  using (exists (select 1 from matches m where m.id = match_id and now() >= m.lock_at));

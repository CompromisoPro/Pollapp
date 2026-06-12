-- =====================================================================
--  POLLAPP — Desglose de puntos por jugador para la TABLA (/resultados).
--  Correr en SQL Editor > Run, DESPUÉS de schema.sql. Seguro de re-correr.
--
--  total = Ganador + Diferencia + Exacto + Bonos (modelo incremental de
--  las bases: cada escalón suma 1 punto).
--    - Ganador:    acertó al menos el ganador  -> +1  (points >= 1)
--    - Diferencia: además acertó la diferencia -> +1  (points >= 2)
--    - Exacto:     además el marcador exacto   -> +1  (points  = 3)
--
--  La vista corre con permisos del owner (security_invoker = off; en
--  Supabase el owner saltea RLS), así que agrega los puntos de TODOS los
--  jugadores aunque la RLS de `predictions` limite lo que cada usuario ve
--  por sí mismo. Solo expone agregados por categoría, nunca el marcador
--  individual de cada partido.
-- =====================================================================

create or replace view score_breakdown
with (security_invoker = off) as
with pred_pts as (
  select
    user_id,
    count(*) filter (where points >= 1) as pts_ganador,
    count(*) filter (where points >= 2) as pts_diferencia,
    count(*) filter (where points  = 3) as pts_exacto
  from predictions
  group by user_id
),
bonus_pts as (
  select user_id, coalesce(sum(points), 0) as pts_bonos
  from bonus_answers
  group by user_id
)
select
  pr.id            as user_id,
  pr.full_name,
  pr.paid,
  pr.points_total,
  coalesce(pp.pts_ganador, 0)    as pts_ganador,
  coalesce(pp.pts_diferencia, 0) as pts_diferencia,
  coalesce(pp.pts_exacto, 0)     as pts_exacto,
  coalesce(bp.pts_bonos, 0)      as pts_bonos
from profiles pr
  left join pred_pts  pp on pp.user_id = pr.id
  left join bonus_pts bp on bp.user_id = pr.id
where pr.is_admin = false;

grant select on score_breakdown to authenticated;

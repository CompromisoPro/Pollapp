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
--  IMPORTANTE: points_total se CALCULA EN VIVO acá (suma de las categorías),
--  NO se lee de profiles.points_total. Así la tabla nunca puede mostrar un
--  total desincronizado del cache. Solo cuenta partidos FINALIZADOS y bonos
--  con respuesta oficial — idéntico a "Mis resultados".
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
    p.user_id,
    count(*) filter (where p.points >= 1) as pts_ganador,
    count(*) filter (where p.points >= 2) as pts_diferencia,
    count(*) filter (where p.points  = 3) as pts_exacto
  from predictions p
  join matches m on m.id = p.match_id
  where m.status = 'finalizado'
  group by p.user_id
),
bonus_pts as (
  select ba.user_id, coalesce(sum(ba.points), 0) as pts_bonos
  from bonus_answers ba
  join bonus_questions q on q.id = ba.question_id
  where q.official_answer is not null
  group by ba.user_id
)
select
  pr.id            as user_id,
  pr.full_name,
  pr.paid,
  (coalesce(pp.pts_ganador, 0) + coalesce(pp.pts_diferencia, 0)
    + coalesce(pp.pts_exacto, 0) + coalesce(bp.pts_bonos, 0))::int  as points_total,
  coalesce(pp.pts_ganador, 0)    as pts_ganador,
  coalesce(pp.pts_diferencia, 0) as pts_diferencia,
  coalesce(pp.pts_exacto, 0)     as pts_exacto,
  coalesce(bp.pts_bonos, 0)      as pts_bonos
from profiles pr
  left join pred_pts  pp on pp.user_id = pr.id
  left join bonus_pts bp on bp.user_id = pr.id
where pr.is_admin = false;

grant select on score_breakdown to authenticated;

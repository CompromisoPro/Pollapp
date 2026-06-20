-- =====================================================================
--  POLLAPP — points_total siempre correcto (trigger en la base)
-- =====================================================================
--  PROBLEMA QUE RESUELVE
--  El total de cada jugador (profiles.points_total) lo recalculaba la app
--  con updates en paralelo y SIN chequear errores (recomputeAllTotals).
--  Si una de esas escrituras fallaba, el total quedaba desincronizado:
--  la TABLA (/resultados), el Nav y el panel admin mostraban MENOS puntos
--  que los reales, mientras "Mis resultados" (que suma en vivo) mostraba
--  el valor correcto. Síntoma real: un jugador con 30 en la tabla y 33 en
--  "Mis resultados", sin que nadie hiciera trampa.
--
--  SOLUCIÓN
--  La base mantiene points_total de forma atómica: cada vez que cambian
--  los puntos de un pronóstico o de un bono, un trigger recalcula el total
--  de ESE jugador. Ya no depende de que la app acierte a recalcular.
--
--  Fórmula (idéntica a recomputeAllTotals y a "Mis resultados" en el caso
--  normal): suma de predictions.points + suma de bonus_answers.points.
--  Los puntos solo existen (no-null) cuando el admin carga el resultado o
--  califica el bono, así que esto cuenta exactamente lo que corresponde.
--
--  Correr en Supabase SQL Editor (proyecto Pollapp) > Run. Seguro de
--  re-correr: usa CREATE OR REPLACE / DROP TRIGGER IF EXISTS.
-- =====================================================================

-- Recalcula el total de un jugador desde la base (fuente de verdad).
-- SECURITY DEFINER: corre con permisos del owner para poder escribir en
-- profiles aunque el cambio lo dispare un jugador editando su pronóstico.
create or replace function recompute_points_total(p_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles pr
  set points_total =
        coalesce((select sum(p.points) from predictions p
                  join matches m on m.id = p.match_id
                  where p.user_id = p_user and m.status = 'finalizado'), 0)
      + coalesce((select sum(ba.points) from bonus_answers ba
                  join bonus_questions q on q.id = ba.question_id
                  where ba.user_id = p_user and q.official_answer is not null), 0)
  where pr.id = p_user;
$$;

-- Trigger genérico: recalcula al jugador afectado tras cualquier cambio.
create or replace function trg_recompute_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    perform recompute_points_total(old.user_id);
    return old;
  end if;

  perform recompute_points_total(new.user_id);
  -- Si en un UPDATE cambiara el dueño de la fila (no debería pasar),
  -- recalcula también al jugador anterior para no dejarlo inflado.
  if (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
    perform recompute_points_total(old.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists predictions_points_sync on predictions;
create trigger predictions_points_sync
  after insert or update or delete on predictions
  for each row execute function trg_recompute_points();

drop trigger if exists bonus_answers_points_sync on bonus_answers;
create trigger bonus_answers_points_sync
  after insert or update or delete on bonus_answers
  for each row execute function trg_recompute_points();

-- ---------------------------------------------------------------------
-- Resync inicial: corrige a TODOS los que ya estaban desincronizados
-- (incluido el caso de los 30 vs 33). Idempotente.
-- ---------------------------------------------------------------------
update profiles pr
set points_total =
      coalesce((select sum(p.points) from predictions p
                join matches m on m.id = p.match_id
                where p.user_id = pr.id and m.status = 'finalizado'), 0)
    + coalesce((select sum(ba.points) from bonus_answers ba
                join bonus_questions q on q.id = ba.question_id
                where ba.user_id = pr.id and q.official_answer is not null), 0);

-- Verificación (la tabla ya corregida, de mayor a menor):
select full_name, points_total
from profiles
where is_admin = false
order by points_total desc;

-- =====================================================================
--  POLLAPP — Polla Mundialera 2026 — Esquema de base de datos
--  Cómo usarlo:
--    1. Entra a tu proyecto en https://supabase.com
--    2. Menú izquierdo: "SQL Editor" > "New query"
--    3. Pega TODO este archivo y presiona "Run"
--  Es seguro correrlo más de una vez (usa IF NOT EXISTS / CREATE OR REPLACE).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
--  PERFILES (cada usuario que se registra)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  paid         boolean not null default false,   -- ¿pagó la inscripción de $20.000?
  is_admin     boolean not null default false,   -- ¿es administrador?
  points_total int     not null default 0,       -- puntaje acumulado (lo calcula el sistema)
  created_at   timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando alguien se registra
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
--  SELECCIONES (para los bonos de grupos y finalistas)
-- ---------------------------------------------------------------------
create table if not exists teams (
  id          text primary key,    -- 'ARG', 'CHI', 'BRA'...
  name        text not null,       -- 'Argentina'
  group_label text                 -- 'A'..'L'
);

-- ---------------------------------------------------------------------
--  PARTIDOS
-- ---------------------------------------------------------------------
create table if not exists matches (
  id          bigint generated always as identity primary key,
  phase       text not null default 'grupos', -- grupos | dieciseisavos | octavos | cuartos | semis | tercer | final
  group_label text,                            -- 'A'..'L' (solo fase de grupos)
  home_team   text not null,                  -- nombre o etiqueta (ej. 'Chile' o 'Ganador Grupo A')
  away_team   text not null,
  kickoff_at  timestamptz not null,           -- fecha/hora del partido (UTC)
  lock_at     timestamptz not null,           -- cierre de pronósticos: 23:59 Chile del día anterior (UTC)
  home_score  int,                            -- resultado oficial (90' + adición), lo carga el admin
  away_score  int,
  status      text not null default 'oculto', -- oculto | abierto | finalizado
  created_at  timestamptz not null default now()
);
create index if not exists matches_status_idx on matches(status);
create index if not exists matches_kickoff_idx on matches(kickoff_at);

-- ---------------------------------------------------------------------
--  PRONÓSTICOS DE MARCADOR
-- ---------------------------------------------------------------------
create table if not exists predictions (
  id         bigint generated always as identity primary key,
  user_id    uuid   not null references profiles(id) on delete cascade,
  match_id   bigint not null references matches(id)  on delete cascade,
  home_score int    not null,
  away_score int    not null,
  points     int,                                   -- lo calcula el sistema al cargar el resultado
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

-- ---------------------------------------------------------------------
--  BONOS — preguntas (el admin define la respuesta oficial)
-- ---------------------------------------------------------------------
--  kind (tipo de respuesta):
--    number      -> un número exacto (ej. tarjetas rojas). Acierto = max_points
--    team        -> una selección. Acierto exacto = max_points
--    player      -> un jugador (texto). Acierto = max_points
--    finalists   -> dos selecciones finalistas. 2 ok = 6 pts, 1 ok = 3 pts
--    qualifiers  -> dos clasificados de un grupo. 1 punto por cada acierto
create table if not exists bonus_questions (
  id              text primary key,             -- 'goleador', 'arquero', 'grupo_A', 'rojas_r32'...
  phase           text not null,                -- especial | grupos | dieciseisavos | octavos | cuartos | semis | final
  kind            text not null,
  title           text not null,
  description     text,
  group_label     text,                         -- para clasificados de grupo
  max_points      int  not null default 0,
  deadline        timestamptz not null,         -- cierre para responder este bono (UTC)
  official_answer jsonb,                         -- respuesta oficial (la carga el admin)
  sort            int  not null default 0,
  status          text not null default 'abierto' -- abierto (visible) | oculto
);

-- ---------------------------------------------------------------------
--  BONOS — respuestas de los usuarios
-- ---------------------------------------------------------------------
create table if not exists bonus_answers (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references profiles(id) on delete cascade,
  question_id text not null references bonus_questions(id) on delete cascade,
  answer      jsonb not null,
  points      int,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, question_id)
);

-- =====================================================================
--  SEGURIDAD (Row Level Security) — quién puede ver/editar qué
-- =====================================================================
alter table profiles        enable row level security;
alter table teams           enable row level security;
alter table matches         enable row level security;
alter table predictions     enable row level security;
alter table bonus_questions enable row level security;
alter table bonus_answers   enable row level security;

-- PERFILES: todos los logueados ven la lista (para la tabla de posiciones);
--           cada uno edita solo el suyo (nombre).
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (true);
drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- SELECCIONES: lectura para logueados
drop policy if exists teams_select on teams;
create policy teams_select on teams for select to authenticated using (true);

-- PARTIDOS: visibles para cualquier logueado (calendario completo en Fixture).
-- La página de Apuestas filtra a los no-ocultos; el Fixture muestra todo.
drop policy if exists matches_select on matches;
create policy matches_select on matches for select to authenticated using (true);

-- PRONÓSTICOS: cada uno ve los suyos; solo puede crear/editar si el partido está
--              abierto y aún no llega la hora de cierre (anti-trampa, en la base).
drop policy if exists pred_select_own on predictions;
create policy pred_select_own on predictions for select to authenticated
  using (auth.uid() = user_id);
-- Ver las apuestas de TODOS, pero solo de partidos cuyo plazo ya cerró.
drop policy if exists pred_select_locked on predictions;
create policy pred_select_locked on predictions for select to authenticated
  using (exists (select 1 from matches m where m.id = match_id and now() >= m.lock_at));
drop policy if exists pred_insert_own on predictions;
create policy pred_insert_own on predictions for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from matches m
                where m.id = match_id and m.status = 'abierto' and now() < m.lock_at)
  );
drop policy if exists pred_update_own on predictions;
create policy pred_update_own on predictions for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from matches m
                where m.id = match_id and m.status = 'abierto' and now() < m.lock_at)
  );

-- BONOS preguntas: los jugadores solo ven los abiertos
drop policy if exists bq_select on bonus_questions;
create policy bq_select on bonus_questions for select to authenticated
  using (status = 'abierto');

-- BONOS respuestas: cada uno las suyas, solo antes del deadline
drop policy if exists ba_select_own on bonus_answers;
create policy ba_select_own on bonus_answers for select to authenticated
  using (auth.uid() = user_id);
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

-- NOTA: el administrador escribe (resultados, respuestas oficiales, abrir partidos,
-- marcar pagos, calcular puntos) usando la "service role key" desde el servidor,
-- que pasa por encima de estas reglas. Cada acción de admin verifica is_admin.

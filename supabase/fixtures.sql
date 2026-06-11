-- =====================================================================
--  POLLAPP — Fixture oficial Mundial 2026 (FASE DE GRUPOS)
--  48 selecciones (grupos A–L) + los 72 partidos de grupos con su fecha.
--  Correr DESPUÉS de schema.sql (y seed.sql). SQL Editor > Run.
--
--  ⚠️ VERIFICAR antes de usar con plata real: equipos/fechas tomados del
--     sorteo y calendario público (ESPN). Las HORAS son aproximadas (20:00 UTC):
--     el CIERRE de cada partido (23:59 Chile del día anterior) depende solo de
--     la FECHA, así que el plazo queda correcto; ajusta la hora exacta en el
--     panel Admin si lo necesitas.
--
--  Los partidos nacen en estado 'oculto'. Ábrelos día a día desde Admin.
-- =====================================================================

-- Por si el esquema es previo a esta función: columna de grupo en partidos.
alter table matches add column if not exists group_label text;

-- ---------------------------------------------------------------------
--  SELECCIONES (48)
-- ---------------------------------------------------------------------
insert into teams (id, name, group_label) values
  ('MEX','Mexico','A'), ('RSA','South Africa','A'), ('KOR','South Korea','A'), ('CZE','Czechia','A'),
  ('CAN','Canada','B'), ('BIH','Bosnia and Herzegovina','B'), ('QAT','Qatar','B'), ('SUI','Switzerland','B'),
  ('BRA','Brazil','C'), ('MAR','Morocco','C'), ('HAI','Haiti','C'), ('SCO','Scotland','C'),
  ('USA','United States','D'), ('PAR','Paraguay','D'), ('AUS','Australia','D'), ('TUR','Türkiye','D'),
  ('GER','Germany','E'), ('CUW','Curaçao','E'), ('CIV','Ivory Coast','E'), ('ECU','Ecuador','E'),
  ('NED','Netherlands','F'), ('JPN','Japan','F'), ('SWE','Sweden','F'), ('TUN','Tunisia','F'),
  ('BEL','Belgium','G'), ('EGY','Egypt','G'), ('IRN','Iran','G'), ('NZL','New Zealand','G'),
  ('ESP','Spain','H'), ('CPV','Cape Verde','H'), ('KSA','Saudi Arabia','H'), ('URU','Uruguay','H'),
  ('FRA','France','I'), ('SEN','Senegal','I'), ('IRQ','Iraq','I'), ('NOR','Norway','I'),
  ('ARG','Argentina','J'), ('ALG','Algeria','J'), ('AUT','Austria','J'), ('JOR','Jordan','J'),
  ('POR','Portugal','K'), ('COD','DR Congo','K'), ('UZB','Uzbekistan','K'), ('COL','Colombia','K'),
  ('ENG','England','L'), ('CRO','Croatia','L'), ('GHA','Ghana','L'), ('PAN','Panama','L')
on conflict (id) do update set name = excluded.name, group_label = excluded.group_label;

-- ---------------------------------------------------------------------
--  PARTIDOS DE GRUPOS (72)
--  kickoff_at = fecha 20:00 UTC ; lock_at = fecha 03:59 UTC (= 23:59 Chile del día anterior)
-- ---------------------------------------------------------------------
insert into matches (phase, group_label, home_team, away_team, kickoff_at, lock_at, status) values
  -- Fecha 1
  ('grupos','A','Mexico','South Africa','2026-06-11 20:00+00','2026-06-11 03:59+00','oculto'),
  ('grupos','A','South Korea','Czechia','2026-06-11 20:00+00','2026-06-11 03:59+00','oculto'),
  ('grupos','B','Canada','Bosnia and Herzegovina','2026-06-12 20:00+00','2026-06-12 03:59+00','oculto'),
  ('grupos','D','United States','Paraguay','2026-06-12 20:00+00','2026-06-12 03:59+00','oculto'),
  ('grupos','B','Qatar','Switzerland','2026-06-13 20:00+00','2026-06-13 03:59+00','oculto'),
  ('grupos','C','Brazil','Morocco','2026-06-13 20:00+00','2026-06-13 03:59+00','oculto'),
  ('grupos','C','Haiti','Scotland','2026-06-13 20:00+00','2026-06-13 03:59+00','oculto'),
  ('grupos','D','Australia','Türkiye','2026-06-13 20:00+00','2026-06-13 03:59+00','oculto'),
  ('grupos','E','Germany','Curaçao','2026-06-14 20:00+00','2026-06-14 03:59+00','oculto'),
  ('grupos','F','Netherlands','Japan','2026-06-14 20:00+00','2026-06-14 03:59+00','oculto'),
  ('grupos','E','Ivory Coast','Ecuador','2026-06-14 20:00+00','2026-06-14 03:59+00','oculto'),
  ('grupos','F','Sweden','Tunisia','2026-06-14 20:00+00','2026-06-14 03:59+00','oculto'),
  ('grupos','H','Spain','Cape Verde','2026-06-15 20:00+00','2026-06-15 03:59+00','oculto'),
  ('grupos','G','Belgium','Egypt','2026-06-15 20:00+00','2026-06-15 03:59+00','oculto'),
  ('grupos','H','Saudi Arabia','Uruguay','2026-06-15 20:00+00','2026-06-15 03:59+00','oculto'),
  ('grupos','G','Iran','New Zealand','2026-06-15 20:00+00','2026-06-15 03:59+00','oculto'),
  ('grupos','I','France','Senegal','2026-06-16 20:00+00','2026-06-16 03:59+00','oculto'),
  ('grupos','I','Iraq','Norway','2026-06-16 20:00+00','2026-06-16 03:59+00','oculto'),
  ('grupos','J','Argentina','Algeria','2026-06-16 20:00+00','2026-06-16 03:59+00','oculto'),
  ('grupos','J','Austria','Jordan','2026-06-16 20:00+00','2026-06-16 03:59+00','oculto'),
  ('grupos','K','Portugal','DR Congo','2026-06-17 20:00+00','2026-06-17 03:59+00','oculto'),
  ('grupos','L','England','Croatia','2026-06-17 20:00+00','2026-06-17 03:59+00','oculto'),
  ('grupos','L','Ghana','Panama','2026-06-17 20:00+00','2026-06-17 03:59+00','oculto'),
  ('grupos','K','Uzbekistan','Colombia','2026-06-17 20:00+00','2026-06-17 03:59+00','oculto'),
  -- Fecha 2
  ('grupos','A','Czechia','South Africa','2026-06-18 20:00+00','2026-06-18 03:59+00','oculto'),
  ('grupos','B','Switzerland','Bosnia and Herzegovina','2026-06-18 20:00+00','2026-06-18 03:59+00','oculto'),
  ('grupos','B','Canada','Qatar','2026-06-18 20:00+00','2026-06-18 03:59+00','oculto'),
  ('grupos','A','Mexico','South Korea','2026-06-18 20:00+00','2026-06-18 03:59+00','oculto'),
  ('grupos','D','United States','Australia','2026-06-19 20:00+00','2026-06-19 03:59+00','oculto'),
  ('grupos','C','Scotland','Morocco','2026-06-19 20:00+00','2026-06-19 03:59+00','oculto'),
  ('grupos','C','Brazil','Haiti','2026-06-19 20:00+00','2026-06-19 03:59+00','oculto'),
  ('grupos','D','Türkiye','Paraguay','2026-06-19 20:00+00','2026-06-19 03:59+00','oculto'),
  ('grupos','F','Netherlands','Sweden','2026-06-20 20:00+00','2026-06-20 03:59+00','oculto'),
  ('grupos','E','Germany','Ivory Coast','2026-06-20 20:00+00','2026-06-20 03:59+00','oculto'),
  ('grupos','E','Ecuador','Curaçao','2026-06-20 20:00+00','2026-06-20 03:59+00','oculto'),
  ('grupos','F','Tunisia','Japan','2026-06-20 20:00+00','2026-06-20 03:59+00','oculto'),
  ('grupos','H','Spain','Saudi Arabia','2026-06-21 20:00+00','2026-06-21 03:59+00','oculto'),
  ('grupos','G','Belgium','Iran','2026-06-21 20:00+00','2026-06-21 03:59+00','oculto'),
  ('grupos','H','Uruguay','Cape Verde','2026-06-21 20:00+00','2026-06-21 03:59+00','oculto'),
  ('grupos','G','New Zealand','Egypt','2026-06-21 20:00+00','2026-06-21 03:59+00','oculto'),
  ('grupos','J','Argentina','Austria','2026-06-22 20:00+00','2026-06-22 03:59+00','oculto'),
  ('grupos','I','France','Iraq','2026-06-22 20:00+00','2026-06-22 03:59+00','oculto'),
  ('grupos','I','Norway','Senegal','2026-06-22 20:00+00','2026-06-22 03:59+00','oculto'),
  ('grupos','J','Jordan','Algeria','2026-06-22 20:00+00','2026-06-22 03:59+00','oculto'),
  ('grupos','K','Portugal','Uzbekistan','2026-06-23 20:00+00','2026-06-23 03:59+00','oculto'),
  ('grupos','L','England','Ghana','2026-06-23 20:00+00','2026-06-23 03:59+00','oculto'),
  ('grupos','L','Panama','Croatia','2026-06-23 20:00+00','2026-06-23 03:59+00','oculto'),
  ('grupos','K','Colombia','DR Congo','2026-06-23 20:00+00','2026-06-23 03:59+00','oculto'),
  -- Fecha 3
  ('grupos','B','Switzerland','Canada','2026-06-24 20:00+00','2026-06-24 03:59+00','oculto'),
  ('grupos','B','Bosnia and Herzegovina','Qatar','2026-06-24 20:00+00','2026-06-24 03:59+00','oculto'),
  ('grupos','C','Scotland','Brazil','2026-06-24 20:00+00','2026-06-24 03:59+00','oculto'),
  ('grupos','C','Morocco','Haiti','2026-06-24 20:00+00','2026-06-24 03:59+00','oculto'),
  ('grupos','A','Czechia','Mexico','2026-06-24 20:00+00','2026-06-24 03:59+00','oculto'),
  ('grupos','A','South Africa','South Korea','2026-06-24 20:00+00','2026-06-24 03:59+00','oculto'),
  ('grupos','E','Ecuador','Germany','2026-06-25 20:00+00','2026-06-25 03:59+00','oculto'),
  ('grupos','E','Curaçao','Ivory Coast','2026-06-25 20:00+00','2026-06-25 03:59+00','oculto'),
  ('grupos','F','Japan','Sweden','2026-06-25 20:00+00','2026-06-25 03:59+00','oculto'),
  ('grupos','F','Tunisia','Netherlands','2026-06-25 20:00+00','2026-06-25 03:59+00','oculto'),
  ('grupos','D','Türkiye','United States','2026-06-25 20:00+00','2026-06-25 03:59+00','oculto'),
  ('grupos','D','Paraguay','Australia','2026-06-25 20:00+00','2026-06-25 03:59+00','oculto'),
  ('grupos','I','Norway','France','2026-06-26 20:00+00','2026-06-26 03:59+00','oculto'),
  ('grupos','I','Senegal','Iraq','2026-06-26 20:00+00','2026-06-26 03:59+00','oculto'),
  ('grupos','H','Cape Verde','Saudi Arabia','2026-06-26 20:00+00','2026-06-26 03:59+00','oculto'),
  ('grupos','H','Uruguay','Spain','2026-06-26 20:00+00','2026-06-26 03:59+00','oculto'),
  ('grupos','G','Egypt','Iran','2026-06-26 20:00+00','2026-06-26 03:59+00','oculto'),
  ('grupos','G','New Zealand','Belgium','2026-06-26 20:00+00','2026-06-26 03:59+00','oculto'),
  ('grupos','L','Panama','England','2026-06-27 20:00+00','2026-06-27 03:59+00','oculto'),
  ('grupos','L','Croatia','Ghana','2026-06-27 20:00+00','2026-06-27 03:59+00','oculto'),
  ('grupos','K','Colombia','Portugal','2026-06-27 20:00+00','2026-06-27 03:59+00','oculto'),
  ('grupos','K','DR Congo','Uzbekistan','2026-06-27 20:00+00','2026-06-27 03:59+00','oculto'),
  ('grupos','J','Algeria','Austria','2026-06-27 20:00+00','2026-06-27 03:59+00','oculto'),
  ('grupos','J','Jordan','Argentina','2026-06-27 20:00+00','2026-06-27 03:59+00','oculto');

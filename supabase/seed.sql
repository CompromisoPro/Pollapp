-- =====================================================================
--  POLLAPP — Datos iniciales: los BONOS de la polla (con sus fechas tope)
--  Correr DESPUÉS de schema.sql, igual que el otro: SQL Editor > Run.
--  Nota: en junio/julio Chile está en horario UTC-4, por eso 23:59 Chile
--  se escribe como '...23:59:00-04'.
-- =====================================================================

-- ---- BONOS ESPECIALES DE TORNEO (cierre 10 de junio 23:59) ----
insert into bonus_questions (id, phase, kind, title, description, max_points, deadline, sort) values
  ('goleador',      'especial', 'player',    'Goleador del Mundial (Bota de Oro)',      'Jugador que será el máximo goleador (ganador oficial FIFA).', 6, '2026-06-10 23:59:00-04', 1),
  ('arquero',       'especial', 'player',    'Mejor Arquero (Guante de Oro)',           'Arquero ganador oficial FIFA.',                              6, '2026-06-10 23:59:00-04', 2),
  ('mejor_jugador', 'especial', 'player',    'Mejor Jugador (Balón de Oro)',            'Mejor jugador del Mundial (ganador oficial FIFA).',          6, '2026-06-10 23:59:00-04', 3),
  ('finalistas',    'especial', 'finalists', 'Dúo de Finalistas',                       'Las dos selecciones que jugarán la final. 2 ok = 6 pts, 1 ok = 3 pts.', 6, '2026-06-10 23:59:00-04', 4)
on conflict (id) do nothing;

-- ---- CLASIFICADOS DE FASE DE GRUPOS (cierre 10 de junio 23:59) ----
-- 12 grupos (A..L). 1 punto por cada selección acertada (2 por grupo).
insert into bonus_questions (id, phase, kind, title, description, group_label, max_points, deadline, sort) values
  ('grupo_A','grupos','qualifiers','Clasificados Grupo A','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','A',2,'2026-06-10 23:59:00-04',10),
  ('grupo_B','grupos','qualifiers','Clasificados Grupo B','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','B',2,'2026-06-10 23:59:00-04',11),
  ('grupo_C','grupos','qualifiers','Clasificados Grupo C','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','C',2,'2026-06-10 23:59:00-04',12),
  ('grupo_D','grupos','qualifiers','Clasificados Grupo D','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','D',2,'2026-06-10 23:59:00-04',13),
  ('grupo_E','grupos','qualifiers','Clasificados Grupo E','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','E',2,'2026-06-10 23:59:00-04',14),
  ('grupo_F','grupos','qualifiers','Clasificados Grupo F','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','F',2,'2026-06-10 23:59:00-04',15),
  ('grupo_G','grupos','qualifiers','Clasificados Grupo G','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','G',2,'2026-06-10 23:59:00-04',16),
  ('grupo_H','grupos','qualifiers','Clasificados Grupo H','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','H',2,'2026-06-10 23:59:00-04',17),
  ('grupo_I','grupos','qualifiers','Clasificados Grupo I','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','I',2,'2026-06-10 23:59:00-04',18),
  ('grupo_J','grupos','qualifiers','Clasificados Grupo J','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','J',2,'2026-06-10 23:59:00-04',19),
  ('grupo_K','grupos','qualifiers','Clasificados Grupo K','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','K',2,'2026-06-10 23:59:00-04',20),
  ('grupo_L','grupos','qualifiers','Clasificados Grupo L','Elige las 2 selecciones que pasan de ronda (sin importar el orden).','L',2,'2026-06-10 23:59:00-04',21)
on conflict (id) do nothing;

-- ---- DESAFÍOS POR ETAPA ----
insert into bonus_questions (id, phase, kind, title, description, max_points, deadline, sort) values
  ('rojas_r32',       'dieciseisavos','number','Tarjetas rojas en Dieciseisavos', 'Número EXACTO de tarjetas rojas totales en esta fase (jugadores en cancha y suplentes; incluye alargue).', 6, '2026-06-27 23:59:00-04', 30),
  ('alargues_octavos','octavos',      'number','Partidos a alargue en Octavos',   'Cuántos partidos terminarán en alargue (rango 0 a 8).', 3, '2026-07-03 23:59:00-04', 31),
  ('penales_cuartos', 'cuartos',      'number','Definiciones por penales en Cuartos','Cuántos partidos se definirán por tanda de penales (rango 0 a 4).', 3, '2026-07-08 23:59:00-04', 32),
  ('goles_semis',     'semis',        'number','Goles totales en Semifinales',    'Suma total de goles en ambas llaves (incluye alargue; NO cuenta tanda de penales).', 3, '2026-07-13 23:59:00-04', 33),
  ('goleador_final',  'final',        'player', 'Goleador en la Gran Final',       'Un jugador que anotará en la final (incluye alargue; NO tanda de penales). Autogol cuenta para el jugador. Apostar a "NADIE" (0-0 tras 120'') es válido.', 3, '2026-07-18 23:59:00-04', 34)
on conflict (id) do nothing;

-- =====================================================================
--  POLLAPP — MIGRACIÓN AL FIXTURE OFICIAL (generado desde la plantilla
--  "Plantilla_Polla_Mundial_2026_OPERATIVA"). Correr en SQL Editor > Run.
--
--  Qué hace:
--   1. Agrega la columna "code" (M001..M104) a los partidos.
--   2. BORRA los partidos anteriores (tenían horas aproximadas) y carga los
--      104 oficiales: hora exacta de Chile, nombres en español, y el cuadro
--      de eliminatorias con sus cruces (quedan "ocultos" hasta abrirlos).
--   3. Pone los nombres de las 48 selecciones en español.
--
--  Seguro de correr: en este punto no hay pronósticos guardados en la web.
-- =====================================================================

alter table matches add column if not exists code text unique;

delete from matches;

-- Selecciones en español
update teams set name = 'México' where id = 'MEX';
update teams set name = 'Sudáfrica' where id = 'RSA';
update teams set name = 'Corea del Sur' where id = 'KOR';
update teams set name = 'Chequia' where id = 'CZE';
update teams set name = 'Canadá' where id = 'CAN';
update teams set name = 'Bosnia y Herzegovina' where id = 'BIH';
update teams set name = 'Qatar' where id = 'QAT';
update teams set name = 'Suiza' where id = 'SUI';
update teams set name = 'Brasil' where id = 'BRA';
update teams set name = 'Marruecos' where id = 'MAR';
update teams set name = 'Haití' where id = 'HAI';
update teams set name = 'Escocia' where id = 'SCO';
update teams set name = 'Estados Unidos' where id = 'USA';
update teams set name = 'Paraguay' where id = 'PAR';
update teams set name = 'Australia' where id = 'AUS';
update teams set name = 'Turquía' where id = 'TUR';
update teams set name = 'Alemania' where id = 'GER';
update teams set name = 'Curazao' where id = 'CUW';
update teams set name = 'Costa de Marfil' where id = 'CIV';
update teams set name = 'Ecuador' where id = 'ECU';
update teams set name = 'Países Bajos' where id = 'NED';
update teams set name = 'Japón' where id = 'JPN';
update teams set name = 'Suecia' where id = 'SWE';
update teams set name = 'Túnez' where id = 'TUN';
update teams set name = 'Bélgica' where id = 'BEL';
update teams set name = 'Egipto' where id = 'EGY';
update teams set name = 'Irán' where id = 'IRN';
update teams set name = 'Nueva Zelanda' where id = 'NZL';
update teams set name = 'España' where id = 'ESP';
update teams set name = 'Cabo Verde' where id = 'CPV';
update teams set name = 'Arabia Saudita' where id = 'KSA';
update teams set name = 'Uruguay' where id = 'URU';
update teams set name = 'Francia' where id = 'FRA';
update teams set name = 'Senegal' where id = 'SEN';
update teams set name = 'Irak' where id = 'IRQ';
update teams set name = 'Noruega' where id = 'NOR';
update teams set name = 'Argentina' where id = 'ARG';
update teams set name = 'Argelia' where id = 'ALG';
update teams set name = 'Austria' where id = 'AUT';
update teams set name = 'Jordania' where id = 'JOR';
update teams set name = 'Portugal' where id = 'POR';
update teams set name = 'RD Congo' where id = 'COD';
update teams set name = 'Uzbekistán' where id = 'UZB';
update teams set name = 'Colombia' where id = 'COL';
update teams set name = 'Inglaterra' where id = 'ENG';
update teams set name = 'Croacia' where id = 'CRO';
update teams set name = 'Ghana' where id = 'GHA';
update teams set name = 'Panamá' where id = 'PAN';

-- Los 104 partidos oficiales (hora de Chile, UTC-04)
insert into matches (code, phase, group_label, home_team, away_team, kickoff_at, lock_at, status) values
  ('M001','grupos','A','México','Sudáfrica','2026-06-11 15:00:00-04','2026-06-10 23:59:00-04','oculto'),
  ('M002','grupos','A','Corea del Sur','Chequia','2026-06-11 22:00:00-04','2026-06-10 23:59:00-04','oculto'),
  ('M003','grupos','B','Canadá','Bosnia y Herzegovina','2026-06-12 15:00:00-04','2026-06-11 23:59:00-04','oculto'),
  ('M004','grupos','D','Estados Unidos','Paraguay','2026-06-12 21:00:00-04','2026-06-11 23:59:00-04','oculto'),
  ('M005','grupos','B','Qatar','Suiza','2026-06-13 15:00:00-04','2026-06-12 23:59:00-04','oculto'),
  ('M006','grupos','C','Brasil','Marruecos','2026-06-13 18:00:00-04','2026-06-12 23:59:00-04','oculto'),
  ('M007','grupos','C','Haití','Escocia','2026-06-13 21:00:00-04','2026-06-12 23:59:00-04','oculto'),
  ('M008','grupos','D','Australia','Turquía','2026-06-14 12:00:00-04','2026-06-13 23:59:00-04','oculto'),
  ('M009','grupos','E','Costa de Marfil','Ecuador','2026-06-14 13:00:00-04','2026-06-13 23:59:00-04','oculto'),
  ('M010','grupos','E','Alemania','Curazao','2026-06-14 13:00:00-04','2026-06-13 23:59:00-04','oculto'),
  ('M011','grupos','F','Países Bajos','Japón','2026-06-14 16:00:00-04','2026-06-13 23:59:00-04','oculto'),
  ('M012','grupos','F','Suecia','Túnez','2026-06-14 19:00:00-04','2026-06-13 23:59:00-04','oculto'),
  ('M013','grupos','H','España','Cabo Verde','2026-06-15 12:00:00-04','2026-06-14 23:59:00-04','oculto'),
  ('M014','grupos','G','Bélgica','Egipto','2026-06-15 15:00:00-04','2026-06-14 23:59:00-04','oculto'),
  ('M015','grupos','H','Arabia Saudita','Uruguay','2026-06-15 18:00:00-04','2026-06-14 23:59:00-04','oculto'),
  ('M016','grupos','G','Irán','Nueva Zelanda','2026-06-15 21:00:00-04','2026-06-14 23:59:00-04','oculto'),
  ('M017','grupos','I','Francia','Senegal','2026-06-16 15:00:00-04','2026-06-15 23:59:00-04','oculto'),
  ('M018','grupos','I','Irak','Noruega','2026-06-16 18:00:00-04','2026-06-15 23:59:00-04','oculto'),
  ('M019','grupos','J','Argentina','Argelia','2026-06-16 21:00:00-04','2026-06-15 23:59:00-04','oculto'),
  ('M020','grupos','J','Austria','Jordania','2026-06-17 00:00:00-04','2026-06-16 23:59:00-04','oculto'),
  ('M021','grupos','K','Portugal','RD Congo','2026-06-17 13:00:00-04','2026-06-16 23:59:00-04','oculto'),
  ('M022','grupos','L','Inglaterra','Croacia','2026-06-17 16:00:00-04','2026-06-16 23:59:00-04','oculto'),
  ('M023','grupos','L','Ghana','Panamá','2026-06-17 19:00:00-04','2026-06-16 23:59:00-04','oculto'),
  ('M024','grupos','K','Uzbekistán','Colombia','2026-06-17 22:00:00-04','2026-06-16 23:59:00-04','oculto'),
  ('M025','grupos','A','Chequia','Sudáfrica','2026-06-18 12:00:00-04','2026-06-17 23:59:00-04','oculto'),
  ('M026','grupos','B','Suiza','Bosnia y Herzegovina','2026-06-18 15:00:00-04','2026-06-17 23:59:00-04','oculto'),
  ('M027','grupos','B','Canadá','Qatar','2026-06-18 18:00:00-04','2026-06-17 23:59:00-04','oculto'),
  ('M028','grupos','A','México','Corea del Sur','2026-06-18 21:00:00-04','2026-06-17 23:59:00-04','oculto'),
  ('M029','grupos','D','Estados Unidos','Australia','2026-06-19 15:00:00-04','2026-06-18 23:59:00-04','oculto'),
  ('M030','grupos','C','Escocia','Marruecos','2026-06-19 18:00:00-04','2026-06-18 23:59:00-04','oculto'),
  ('M031','grupos','C','Brasil','Haití','2026-06-19 20:30:00-04','2026-06-18 23:59:00-04','oculto'),
  ('M032','grupos','D','Turquía','Paraguay','2026-06-19 23:00:00-04','2026-06-18 23:59:00-04','oculto'),
  ('M033','grupos','F','Países Bajos','Suecia','2026-06-20 13:00:00-04','2026-06-19 23:59:00-04','oculto'),
  ('M034','grupos','E','Alemania','Costa de Marfil','2026-06-20 16:00:00-04','2026-06-19 23:59:00-04','oculto'),
  ('M035','grupos','E','Ecuador','Curazao','2026-06-20 20:00:00-04','2026-06-19 23:59:00-04','oculto'),
  ('M036','grupos','F','Túnez','Japón','2026-06-21 00:00:00-04','2026-06-20 23:59:00-04','oculto'),
  ('M037','grupos','H','España','Arabia Saudita','2026-06-21 12:00:00-04','2026-06-20 23:59:00-04','oculto'),
  ('M038','grupos','G','Bélgica','Irán','2026-06-21 15:00:00-04','2026-06-20 23:59:00-04','oculto'),
  ('M039','grupos','H','Uruguay','Cabo Verde','2026-06-21 18:00:00-04','2026-06-20 23:59:00-04','oculto'),
  ('M040','grupos','G','Nueva Zelanda','Egipto','2026-06-21 21:00:00-04','2026-06-20 23:59:00-04','oculto'),
  ('M041','grupos','J','Argentina','Austria','2026-06-22 13:00:00-04','2026-06-21 23:59:00-04','oculto'),
  ('M042','grupos','I','Francia','Irak','2026-06-22 17:00:00-04','2026-06-21 23:59:00-04','oculto'),
  ('M043','grupos','I','Noruega','Senegal','2026-06-22 20:00:00-04','2026-06-21 23:59:00-04','oculto'),
  ('M044','grupos','J','Jordania','Argelia','2026-06-22 23:00:00-04','2026-06-21 23:59:00-04','oculto'),
  ('M045','grupos','K','Portugal','Uzbekistán','2026-06-23 13:00:00-04','2026-06-22 23:59:00-04','oculto'),
  ('M046','grupos','L','Inglaterra','Ghana','2026-06-23 16:00:00-04','2026-06-22 23:59:00-04','oculto'),
  ('M047','grupos','L','Panamá','Croacia','2026-06-23 19:00:00-04','2026-06-22 23:59:00-04','oculto'),
  ('M048','grupos','K','Colombia','RD Congo','2026-06-23 22:00:00-04','2026-06-22 23:59:00-04','oculto'),
  ('M049','grupos','B','Suiza','Canadá','2026-06-24 15:00:00-04','2026-06-23 23:59:00-04','oculto'),
  ('M050','grupos','B','Bosnia y Herzegovina','Qatar','2026-06-24 15:00:00-04','2026-06-23 23:59:00-04','oculto'),
  ('M051','grupos','C','Escocia','Brasil','2026-06-24 18:00:00-04','2026-06-23 23:59:00-04','oculto'),
  ('M052','grupos','C','Marruecos','Haití','2026-06-24 18:00:00-04','2026-06-23 23:59:00-04','oculto'),
  ('M053','grupos','A','Chequia','México','2026-06-24 21:00:00-04','2026-06-23 23:59:00-04','oculto'),
  ('M054','grupos','A','Sudáfrica','Corea del Sur','2026-06-24 21:00:00-04','2026-06-23 23:59:00-04','oculto'),
  ('M055','grupos','E','Curazao','Costa de Marfil','2026-06-25 16:00:00-04','2026-06-24 23:59:00-04','oculto'),
  ('M056','grupos','E','Ecuador','Alemania','2026-06-25 16:00:00-04','2026-06-24 23:59:00-04','oculto'),
  ('M057','grupos','F','Japón','Suecia','2026-06-25 19:00:00-04','2026-06-24 23:59:00-04','oculto'),
  ('M058','grupos','F','Túnez','Países Bajos','2026-06-25 19:00:00-04','2026-06-24 23:59:00-04','oculto'),
  ('M059','grupos','D','Turquía','Estados Unidos','2026-06-25 22:00:00-04','2026-06-24 23:59:00-04','oculto'),
  ('M060','grupos','D','Paraguay','Australia','2026-06-25 22:00:00-04','2026-06-24 23:59:00-04','oculto'),
  ('M061','grupos','I','Noruega','Francia','2026-06-26 15:00:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M062','grupos','I','Senegal','Irak','2026-06-26 15:00:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M063','grupos','K','Colombia','Portugal','2026-06-26 19:30:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M064','grupos','K','RD Congo','Uzbekistán','2026-06-26 19:30:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M065','grupos','H','Cabo Verde','Arabia Saudita','2026-06-26 20:00:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M066','grupos','H','Uruguay','España','2026-06-26 20:00:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M067','grupos','G','Egipto','Irán','2026-06-26 23:00:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M068','grupos','G','Nueva Zelanda','Bélgica','2026-06-26 23:00:00-04','2026-06-25 23:59:00-04','oculto'),
  ('M069','grupos','L','Panamá','Inglaterra','2026-06-27 17:00:00-04','2026-06-26 23:59:00-04','oculto'),
  ('M070','grupos','L','Croacia','Ghana','2026-06-27 17:00:00-04','2026-06-26 23:59:00-04','oculto'),
  ('M071','grupos','J','Argelia','Austria','2026-06-27 22:00:00-04','2026-06-26 23:59:00-04','oculto'),
  ('M072','grupos','J','Jordania','Argentina','2026-06-27 22:00:00-04','2026-06-26 23:59:00-04','oculto'),
  ('M073','dieciseisavos',null,'2° Grupo A','2° Grupo B','2026-06-28 15:00:00-04','2026-06-27 23:59:00-04','oculto'),
  ('M074','dieciseisavos',null,'1° Grupo E','Mejor 3° de A/B/C/D/F','2026-06-29 13:00:00-04','2026-06-28 23:59:00-04','oculto'),
  ('M075','dieciseisavos',null,'1° Grupo F','2° Grupo C','2026-06-29 16:30:00-04','2026-06-28 23:59:00-04','oculto'),
  ('M076','dieciseisavos',null,'1° Grupo C','2° Grupo F','2026-06-29 21:00:00-04','2026-06-28 23:59:00-04','oculto'),
  ('M077','dieciseisavos',null,'1° Grupo I','Mejor 3° de C/D/F/G/H','2026-06-30 13:00:00-04','2026-06-29 23:59:00-04','oculto'),
  ('M078','dieciseisavos',null,'2° Grupo E','2° Grupo I','2026-06-30 17:00:00-04','2026-06-29 23:59:00-04','oculto'),
  ('M079','dieciseisavos',null,'1° Grupo A','Mejor 3° de C/E/F/H/I','2026-06-30 21:00:00-04','2026-06-29 23:59:00-04','oculto'),
  ('M080','dieciseisavos',null,'1° Grupo L','Mejor 3° de E/H/I/J/K','2026-07-01 12:00:00-04','2026-06-30 23:59:00-04','oculto'),
  ('M081','dieciseisavos',null,'1° Grupo D','Mejor 3° de B/E/F/I/J','2026-07-01 16:00:00-04','2026-06-30 23:59:00-04','oculto'),
  ('M082','dieciseisavos',null,'1° Grupo G','Mejor 3° de A/E/H/I/J','2026-07-01 20:00:00-04','2026-06-30 23:59:00-04','oculto'),
  ('M083','dieciseisavos',null,'2° Grupo K','2° Grupo L','2026-07-02 15:00:00-04','2026-07-01 23:59:00-04','oculto'),
  ('M084','dieciseisavos',null,'1° Grupo H','2° Grupo J','2026-07-02 19:00:00-04','2026-07-01 23:59:00-04','oculto'),
  ('M085','dieciseisavos',null,'1° Grupo B','Mejor 3° de E/F/G/I/J','2026-07-02 23:00:00-04','2026-07-01 23:59:00-04','oculto'),
  ('M086','dieciseisavos',null,'1° Grupo J','2° Grupo H','2026-07-03 14:00:00-04','2026-07-02 23:59:00-04','oculto'),
  ('M087','dieciseisavos',null,'1° Grupo K','Mejor 3° de D/E/I/J/L','2026-07-03 18:00:00-04','2026-07-02 23:59:00-04','oculto'),
  ('M088','dieciseisavos',null,'2° Grupo D','2° Grupo G','2026-07-03 21:30:00-04','2026-07-02 23:59:00-04','oculto'),
  ('M089','octavos',null,'Ganador M074','Ganador M077','2026-07-04 13:00:00-04','2026-07-03 23:59:00-04','oculto'),
  ('M090','octavos',null,'Ganador M073','Ganador M075','2026-07-04 17:00:00-04','2026-07-03 23:59:00-04','oculto'),
  ('M091','octavos',null,'Ganador M076','Ganador M078','2026-07-05 16:00:00-04','2026-07-04 23:59:00-04','oculto'),
  ('M092','octavos',null,'Ganador M079','Ganador M080','2026-07-05 20:00:00-04','2026-07-04 23:59:00-04','oculto'),
  ('M093','octavos',null,'Ganador M083','Ganador M084','2026-07-06 15:00:00-04','2026-07-05 23:59:00-04','oculto'),
  ('M094','octavos',null,'Ganador M081','Ganador M082','2026-07-06 20:00:00-04','2026-07-05 23:59:00-04','oculto'),
  ('M095','octavos',null,'Ganador M086','Ganador M088','2026-07-07 12:00:00-04','2026-07-06 23:59:00-04','oculto'),
  ('M096','octavos',null,'Ganador M085','Ganador M087','2026-07-07 16:00:00-04','2026-07-06 23:59:00-04','oculto'),
  ('M097','cuartos',null,'Ganador M089','Ganador M090','2026-07-09 16:00:00-04','2026-07-08 23:59:00-04','oculto'),
  ('M098','cuartos',null,'Ganador M093','Ganador M094','2026-07-10 15:00:00-04','2026-07-09 23:59:00-04','oculto'),
  ('M099','cuartos',null,'Ganador M091','Ganador M092','2026-07-11 17:00:00-04','2026-07-10 23:59:00-04','oculto'),
  ('M100','cuartos',null,'Ganador M095','Ganador M096','2026-07-11 21:00:00-04','2026-07-10 23:59:00-04','oculto'),
  ('M101','semis',null,'Ganador M097','Ganador M098','2026-07-14 15:00:00-04','2026-07-13 23:59:00-04','oculto'),
  ('M102','semis',null,'Ganador M099','Ganador M100','2026-07-15 15:00:00-04','2026-07-14 23:59:00-04','oculto'),
  ('M103','tercer',null,'Perdedor M101','Perdedor M102','2026-07-18 17:00:00-04','2026-07-17 23:59:00-04','oculto'),
  ('M104','final',null,'Ganador M101','Ganador M102','2026-07-19 15:00:00-04','2026-07-18 23:59:00-04','oculto');

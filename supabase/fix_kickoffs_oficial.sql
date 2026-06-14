-- =============================================================================
-- Corrección de horarios (kickoff_at) — Mundial FIFA 2026
-- =============================================================================
-- La carga original guardó las horas mal: usaba la hora ET (o una hora local
-- equivocada) etiquetada como "-04", cuando cada partido se juega en la zona
-- horaria de SU sede (ET/CT/PT en EE.UU./Canadá, UTC-6 en México). Resultado:
-- casi todos los partidos aparecían a una hora incorrecta.
--
-- Estos valores son el instante UTC REAL de cada partido, verificados contra
-- el calendario oficial (Wikipedia "2026 FIFA World Cup Group A..L" y
-- "knockout stage", cruzado con ESPN/CBS/NBC). Ancla de control:
-- Costa de Marfil vs Ecuador (M009) = 19:00 EDT Filadelfia = 2026-06-14 23:00 UTC.
--
-- lock_at NO se toca: el cierre de apuestas es 23:59 hora Chile de la noche
-- anterior, independiente de la hora del partido.
--
-- Zonas aplicadas (verano 2026): EDT=UTC-4, CDT=UTC-5, PDT=UTC-7,
-- México=UTC-6 (sin horario de verano desde 2022).
--
-- Confianza: ALTA en todos salvo M092 (Estadio Azteca) que tiene discrepancia
-- entre fuentes (Wikipedia vs ET) — su UTC usa la versión con más respaldo.
-- =============================================================================

begin;

-- ---- Fase de grupos ----
update matches set kickoff_at = '2026-06-11 19:00:00+00' where code = 'M001'; -- México-Sudáfrica, CDMX
update matches set kickoff_at = '2026-06-12 02:00:00+00' where code = 'M002'; -- Corea-Chequia, Guadalajara
update matches set kickoff_at = '2026-06-12 19:00:00+00' where code = 'M003'; -- Canadá-Bosnia, Toronto
update matches set kickoff_at = '2026-06-13 01:00:00+00' where code = 'M004'; -- EEUU-Paraguay, LA
update matches set kickoff_at = '2026-06-13 19:00:00+00' where code = 'M005'; -- Qatar-Suiza, Bay Area
update matches set kickoff_at = '2026-06-13 22:00:00+00' where code = 'M006'; -- Brasil-Marruecos, NY/NJ
update matches set kickoff_at = '2026-06-14 01:00:00+00' where code = 'M007'; -- Haití-Escocia, Boston
update matches set kickoff_at = '2026-06-14 04:00:00+00' where code = 'M008'; -- Australia-Turquía, Vancouver
update matches set kickoff_at = '2026-06-14 23:00:00+00' where code = 'M009'; -- Costa de Marfil-Ecuador, Filadelfia
update matches set kickoff_at = '2026-06-14 17:00:00+00' where code = 'M010'; -- Alemania-Curazao, Houston
update matches set kickoff_at = '2026-06-14 20:00:00+00' where code = 'M011'; -- Países Bajos-Japón, Dallas
update matches set kickoff_at = '2026-06-15 02:00:00+00' where code = 'M012'; -- Suecia-Túnez, Monterrey
update matches set kickoff_at = '2026-06-15 16:00:00+00' where code = 'M013'; -- España-Cabo Verde, Atlanta
update matches set kickoff_at = '2026-06-15 19:00:00+00' where code = 'M014'; -- Bélgica-Egipto, Seattle
update matches set kickoff_at = '2026-06-15 22:00:00+00' where code = 'M015'; -- Arabia-Uruguay, Miami
update matches set kickoff_at = '2026-06-16 01:00:00+00' where code = 'M016'; -- Irán-Nueva Zelanda, LA
update matches set kickoff_at = '2026-06-16 19:00:00+00' where code = 'M017'; -- Francia-Senegal, NY/NJ
update matches set kickoff_at = '2026-06-16 22:00:00+00' where code = 'M018'; -- Irak-Noruega, Boston
update matches set kickoff_at = '2026-06-17 01:00:00+00' where code = 'M019'; -- Argentina-Argelia, Kansas City
update matches set kickoff_at = '2026-06-17 04:00:00+00' where code = 'M020'; -- Austria-Jordania, Santa Clara
update matches set kickoff_at = '2026-06-17 17:00:00+00' where code = 'M021'; -- Portugal-RD Congo, Houston
update matches set kickoff_at = '2026-06-17 20:00:00+00' where code = 'M022'; -- Inglaterra-Croacia, Arlington
update matches set kickoff_at = '2026-06-17 23:00:00+00' where code = 'M023'; -- Ghana-Panamá, Toronto
update matches set kickoff_at = '2026-06-18 02:00:00+00' where code = 'M024'; -- Uzbekistán-Colombia, CDMX
update matches set kickoff_at = '2026-06-18 16:00:00+00' where code = 'M025'; -- Chequia-Sudáfrica, Atlanta
update matches set kickoff_at = '2026-06-18 19:00:00+00' where code = 'M026'; -- Suiza-Bosnia, LA
update matches set kickoff_at = '2026-06-18 22:00:00+00' where code = 'M027'; -- Canadá-Qatar, Vancouver
update matches set kickoff_at = '2026-06-19 01:00:00+00' where code = 'M028'; -- México-Corea, Guadalajara
update matches set kickoff_at = '2026-06-19 19:00:00+00' where code = 'M029'; -- EEUU-Australia, Seattle
update matches set kickoff_at = '2026-06-19 22:00:00+00' where code = 'M030'; -- Escocia-Marruecos, Boston
update matches set kickoff_at = '2026-06-20 00:30:00+00' where code = 'M031'; -- Brasil-Haití, Filadelfia
update matches set kickoff_at = '2026-06-20 03:00:00+00' where code = 'M032'; -- Turquía-Paraguay, Santa Clara
update matches set kickoff_at = '2026-06-20 17:00:00+00' where code = 'M033'; -- Países Bajos-Suecia, Houston
update matches set kickoff_at = '2026-06-20 20:00:00+00' where code = 'M034'; -- Alemania-Costa de Marfil, Toronto
update matches set kickoff_at = '2026-06-21 00:00:00+00' where code = 'M035'; -- Ecuador-Curazao, Kansas City
update matches set kickoff_at = '2026-06-21 04:00:00+00' where code = 'M036'; -- Túnez-Japón, Monterrey
update matches set kickoff_at = '2026-06-21 16:00:00+00' where code = 'M037'; -- España-Arabia, Atlanta
update matches set kickoff_at = '2026-06-21 19:00:00+00' where code = 'M038'; -- Bélgica-Irán, LA
update matches set kickoff_at = '2026-06-21 22:00:00+00' where code = 'M039'; -- Uruguay-Cabo Verde, Miami
update matches set kickoff_at = '2026-06-22 01:00:00+00' where code = 'M040'; -- Nueva Zelanda-Egipto, Vancouver
update matches set kickoff_at = '2026-06-22 17:00:00+00' where code = 'M041'; -- Argentina-Austria, Dallas
update matches set kickoff_at = '2026-06-22 21:00:00+00' where code = 'M042'; -- Francia-Irak, Filadelfia
update matches set kickoff_at = '2026-06-23 00:00:00+00' where code = 'M043'; -- Noruega-Senegal, NY/NJ
update matches set kickoff_at = '2026-06-23 03:00:00+00' where code = 'M044'; -- Jordania-Argelia, Santa Clara
update matches set kickoff_at = '2026-06-23 17:00:00+00' where code = 'M045'; -- Portugal-Uzbekistán, Houston
update matches set kickoff_at = '2026-06-23 20:00:00+00' where code = 'M046'; -- Inglaterra-Ghana, Boston
update matches set kickoff_at = '2026-06-23 23:00:00+00' where code = 'M047'; -- Panamá-Croacia, Toronto
update matches set kickoff_at = '2026-06-24 02:00:00+00' where code = 'M048'; -- Colombia-RD Congo, Guadalajara
update matches set kickoff_at = '2026-06-24 19:00:00+00' where code = 'M049'; -- Suiza-Canadá, Vancouver
update matches set kickoff_at = '2026-06-24 19:00:00+00' where code = 'M050'; -- Bosnia-Qatar, Seattle
update matches set kickoff_at = '2026-06-24 22:00:00+00' where code = 'M051'; -- Escocia-Brasil, Miami
update matches set kickoff_at = '2026-06-24 22:00:00+00' where code = 'M052'; -- Marruecos-Haití, Atlanta
update matches set kickoff_at = '2026-06-25 01:00:00+00' where code = 'M053'; -- Chequia-México, CDMX
update matches set kickoff_at = '2026-06-25 01:00:00+00' where code = 'M054'; -- Sudáfrica-Corea, Monterrey
update matches set kickoff_at = '2026-06-25 20:00:00+00' where code = 'M055'; -- Curazao-Costa de Marfil, Filadelfia
update matches set kickoff_at = '2026-06-25 20:00:00+00' where code = 'M056'; -- Ecuador-Alemania, NY/NJ
update matches set kickoff_at = '2026-06-25 23:00:00+00' where code = 'M057'; -- Japón-Suecia, Dallas
update matches set kickoff_at = '2026-06-25 23:00:00+00' where code = 'M058'; -- Túnez-Países Bajos, Kansas City
update matches set kickoff_at = '2026-06-26 02:00:00+00' where code = 'M059'; -- Turquía-EEUU, LA
update matches set kickoff_at = '2026-06-26 02:00:00+00' where code = 'M060'; -- Paraguay-Australia, Santa Clara
update matches set kickoff_at = '2026-06-26 19:00:00+00' where code = 'M061'; -- Noruega-Francia, Boston
update matches set kickoff_at = '2026-06-26 19:00:00+00' where code = 'M062'; -- Senegal-Irak, Toronto
update matches set kickoff_at = '2026-06-27 00:00:00+00' where code = 'M063'; -- Cabo Verde-Arabia, Houston
update matches set kickoff_at = '2026-06-27 00:00:00+00' where code = 'M064'; -- Uruguay-España, Guadalajara
update matches set kickoff_at = '2026-06-27 03:00:00+00' where code = 'M065'; -- Egipto-Irán, Seattle
update matches set kickoff_at = '2026-06-27 03:00:00+00' where code = 'M066'; -- Nueva Zelanda-Bélgica, Vancouver
update matches set kickoff_at = '2026-06-27 21:00:00+00' where code = 'M067'; -- Panamá-Inglaterra, NY/NJ
update matches set kickoff_at = '2026-06-27 21:00:00+00' where code = 'M068'; -- Croacia-Ghana, Filadelfia
update matches set kickoff_at = '2026-06-27 23:30:00+00' where code = 'M069'; -- Colombia-Portugal, Miami
update matches set kickoff_at = '2026-06-27 23:30:00+00' where code = 'M070'; -- RD Congo-Uzbekistán, Atlanta
update matches set kickoff_at = '2026-06-28 02:00:00+00' where code = 'M071'; -- Argelia-Austria, Kansas City
update matches set kickoff_at = '2026-06-28 02:00:00+00' where code = 'M072'; -- Jordania-Argentina, Arlington

-- ---- Dieciseisavos (Round of 32) ----
update matches set kickoff_at = '2026-06-28 19:00:00+00' where code = 'M073'; -- SoFi, LA
update matches set kickoff_at = '2026-06-29 20:30:00+00' where code = 'M074'; -- Gillette, Foxborough
update matches set kickoff_at = '2026-06-30 01:00:00+00' where code = 'M075'; -- BBVA, Monterrey
update matches set kickoff_at = '2026-06-29 17:00:00+00' where code = 'M076'; -- NRG, Houston
update matches set kickoff_at = '2026-06-30 21:00:00+00' where code = 'M077'; -- MetLife, NY/NJ
update matches set kickoff_at = '2026-06-30 17:00:00+00' where code = 'M078'; -- AT&T, Arlington
update matches set kickoff_at = '2026-07-01 01:00:00+00' where code = 'M079'; -- Azteca, CDMX
update matches set kickoff_at = '2026-07-01 16:00:00+00' where code = 'M080'; -- Mercedes-Benz, Atlanta
update matches set kickoff_at = '2026-07-02 00:00:00+00' where code = 'M081'; -- Levi's, Santa Clara
update matches set kickoff_at = '2026-07-01 20:00:00+00' where code = 'M082'; -- Lumen, Seattle
update matches set kickoff_at = '2026-07-02 23:00:00+00' where code = 'M083'; -- BMO, Toronto
update matches set kickoff_at = '2026-07-02 19:00:00+00' where code = 'M084'; -- SoFi, LA
update matches set kickoff_at = '2026-07-03 03:00:00+00' where code = 'M085'; -- BC Place, Vancouver
update matches set kickoff_at = '2026-07-03 22:00:00+00' where code = 'M086'; -- Hard Rock, Miami
update matches set kickoff_at = '2026-07-04 01:30:00+00' where code = 'M087'; -- Arrowhead, Kansas City
update matches set kickoff_at = '2026-07-03 18:00:00+00' where code = 'M088'; -- AT&T, Arlington

-- ---- Octavos ----
update matches set kickoff_at = '2026-07-04 21:00:00+00' where code = 'M089'; -- Lincoln Financial, Filadelfia
update matches set kickoff_at = '2026-07-04 17:00:00+00' where code = 'M090'; -- NRG, Houston
update matches set kickoff_at = '2026-07-05 20:00:00+00' where code = 'M091'; -- MetLife, NY/NJ
update matches set kickoff_at = '2026-07-06 01:00:00+00' where code = 'M092'; -- Azteca, CDMX (confianza media)
update matches set kickoff_at = '2026-07-06 19:00:00+00' where code = 'M093'; -- AT&T, Arlington
update matches set kickoff_at = '2026-07-07 00:00:00+00' where code = 'M094'; -- Lumen, Seattle
update matches set kickoff_at = '2026-07-07 16:00:00+00' where code = 'M095'; -- Mercedes-Benz, Atlanta
update matches set kickoff_at = '2026-07-07 20:00:00+00' where code = 'M096'; -- BC Place, Vancouver

-- ---- Cuartos ----
update matches set kickoff_at = '2026-07-09 20:00:00+00' where code = 'M097'; -- Gillette, Foxborough
update matches set kickoff_at = '2026-07-10 19:00:00+00' where code = 'M098'; -- SoFi, LA
update matches set kickoff_at = '2026-07-11 21:00:00+00' where code = 'M099'; -- Hard Rock, Miami
update matches set kickoff_at = '2026-07-12 01:00:00+00' where code = 'M100'; -- Arrowhead, Kansas City

-- ---- Semifinales / Tercer lugar / Final ----
update matches set kickoff_at = '2026-07-14 19:00:00+00' where code = 'M101'; -- AT&T, Dallas
update matches set kickoff_at = '2026-07-15 19:00:00+00' where code = 'M102'; -- Mercedes-Benz, Atlanta
update matches set kickoff_at = '2026-07-18 21:00:00+00' where code = 'M103'; -- Hard Rock, Miami
update matches set kickoff_at = '2026-07-19 19:00:00+00' where code = 'M104'; -- MetLife, NY/NJ (FINAL)

-- =============================================================================
-- Verificación: revisar a OJO antes de confirmar. Debería mostrar cada partido
-- en su hora de Chile (America/Santiago). Si algo se ve raro, hacer ROLLBACK.
-- =============================================================================
select code, home_team, away_team,
       kickoff_at at time zone 'America/Santiago' as kickoff_chile,
       lock_at    at time zone 'America/Santiago' as lock_chile
from matches
order by kickoff_at;

-- Si todo cuadra:   commit;
-- Si algo está mal: rollback;
commit;

// Genera supabase/migracion_oficial.sql desde la plantilla Excel oficial.
// Lee la hoja "Partidos" (M001-M104, hora exacta de Chile, nombres en español)
// y produce el SQL que reemplaza el fixture de la base de datos.
// Uso: node scripts/generar_migracion.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const wb = XLSX.readFile(
  path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx")
);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Partidos"], {
  header: 1,
  defval: "",
  raw: false,
});

// --- Mapeo de fase (Grupo_Ronda de la plantilla -> phase de la app) ---
function phaseOf(grupoRonda) {
  if (/^Grupo /.test(grupoRonda)) return "grupos";
  if (/Ronda de 32/i.test(grupoRonda)) return "dieciseisavos";
  if (/Octavos/i.test(grupoRonda)) return "octavos";
  if (/Cuartos/i.test(grupoRonda)) return "cuartos";
  if (/Semifinal/i.test(grupoRonda)) return "semis";
  if (/tercer/i.test(grupoRonda)) return "tercer";
  if (/^Final$/i.test(grupoRonda.trim())) return "final";
  throw new Error("Fase desconocida: " + grupoRonda);
}

// Chile está en UTC-4 en junio/julio 2026 (horario de invierno).
const OFFSET = "-04";

function esc(s) {
  return String(s).trim().replace(/\s+/g, " ").replace(/'/g, "''");
}

function prevDay(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

const values = [];
for (let i = 1; i < rows.length; i++) {
  const [code, fecha, hora, _jornada, local, visita, grupoRonda] = rows[i];
  if (!code) continue;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("Fecha rara fila " + (i + 1) + ": " + fecha);
  if (!/^\d{1,2}:\d{2}$/.test(hora)) throw new Error("Hora rara fila " + (i + 1) + ": " + hora);

  const phase = phaseOf(grupoRonda);
  const group = phase === "grupos" ? `'${grupoRonda.replace("Grupo ", "").trim()}'` : "null";
  const kickoff = `${fecha} ${hora.padStart(5, "0")}:00${OFFSET}`;
  const lock = `${prevDay(fecha)} 23:59:00${OFFSET}`;

  values.push(
    `  ('${code}','${phase}',${group},'${esc(local)}','${esc(visita)}','${kickoff}','${lock}','oculto')`
  );
}

// --- Nombres de selecciones en español (alineados con la plantilla) ---
const TEAM_NAMES = {
  MEX: "México", RSA: "Sudáfrica", KOR: "Corea del Sur", CZE: "Chequia",
  CAN: "Canadá", BIH: "Bosnia y Herzegovina", QAT: "Qatar", SUI: "Suiza",
  BRA: "Brasil", MAR: "Marruecos", HAI: "Haití", SCO: "Escocia",
  USA: "Estados Unidos", PAR: "Paraguay", AUS: "Australia", TUR: "Turquía",
  GER: "Alemania", CUW: "Curazao", CIV: "Costa de Marfil", ECU: "Ecuador",
  NED: "Países Bajos", JPN: "Japón", SWE: "Suecia", TUN: "Túnez",
  BEL: "Bélgica", EGY: "Egipto", IRN: "Irán", NZL: "Nueva Zelanda",
  ESP: "España", CPV: "Cabo Verde", KSA: "Arabia Saudita", URU: "Uruguay",
  FRA: "Francia", SEN: "Senegal", IRQ: "Irak", NOR: "Noruega",
  ARG: "Argentina", ALG: "Argelia", AUT: "Austria", JOR: "Jordania",
  POR: "Portugal", COD: "RD Congo", UZB: "Uzbekistán", COL: "Colombia",
  ENG: "Inglaterra", CRO: "Croacia", GHA: "Ghana", PAN: "Panamá",
};
const teamUpdates = Object.entries(TEAM_NAMES)
  .map(([id, name]) => `update teams set name = '${esc(name)}' where id = '${id}';`)
  .join("\n");

const sql = `-- =====================================================================
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
${teamUpdates}

-- Los 104 partidos oficiales (hora de Chile, UTC${OFFSET})
insert into matches (code, phase, group_label, home_team, away_team, kickoff_at, lock_at, status) values
${values.join(",\n")};
`;

const out = path.join(__dirname, "..", "supabase", "migracion_oficial.sql");
fs.writeFileSync(out, sql, "utf8");
console.log(`OK: ${values.length} partidos -> ${out}`);

// PREVISUALIZACIÓN (no escribe nada): toma la última respuesta de cada persona,
// mapea las selecciones a IDs de equipo y MARCA cualquier nombre que no calce.
// Uso: node scripts/preview_bonos.js
const XLSX = require("xlsx");
const path = require("path");

const PLANTILLA = path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx");
const F_INI = path.join(__dirname, "..", "Bonus de Torneo Inicial - Mundial 2026(1-37).xlsx");
const F_CLAS = path.join(__dirname, "..", "Bonus Clasificados de Fase de Grupos - Mundial 2026(1-33).xlsx");

const normRut = (s) => String(s ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
const lower = (s) => String(s ?? "").trim().toLowerCase();
const noAcc = (s) => lower(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
function ts(s) {
  const m = String(s).match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/);
  if (!m) return 0;
  const [, mo, d, y, h, mi, se] = m.map(Number);
  return Date.UTC(2000 + y, mo - 1, d, h, mi, se);
}

// equipos (nombre español -> id) y grupo
const TEAMS = {
  MEX: ["México", "A"], RSA: ["Sudáfrica", "A"], KOR: ["Corea del Sur", "A"], CZE: ["Chequia", "A"],
  CAN: ["Canadá", "B"], BIH: ["Bosnia y Herzegovina", "B"], QAT: ["Qatar", "B"], SUI: ["Suiza", "B"],
  BRA: ["Brasil", "C"], MAR: ["Marruecos", "C"], HAI: ["Haití", "C"], SCO: ["Escocia", "C"],
  USA: ["Estados Unidos", "D"], PAR: ["Paraguay", "D"], AUS: ["Australia", "D"], TUR: ["Turquía", "D"],
  GER: ["Alemania", "E"], CUW: ["Curazao", "E"], CIV: ["Costa de Marfil", "E"], ECU: ["Ecuador", "E"],
  NED: ["Países Bajos", "F"], JPN: ["Japón", "F"], SWE: ["Suecia", "F"], TUN: ["Túnez", "F"],
  BEL: ["Bélgica", "G"], EGY: ["Egipto", "G"], IRN: ["Irán", "G"], NZL: ["Nueva Zelanda", "G"],
  ESP: ["España", "H"], CPV: ["Cabo Verde", "H"], KSA: ["Arabia Saudita", "H"], URU: ["Uruguay", "H"],
  FRA: ["Francia", "I"], SEN: ["Senegal", "I"], IRQ: ["Irak", "I"], NOR: ["Noruega", "I"],
  ARG: ["Argentina", "J"], ALG: ["Argelia", "J"], AUT: ["Austria", "J"], JOR: ["Jordania", "J"],
  POR: ["Portugal", "K"], COD: ["RD Congo", "K"], UZB: ["Uzbekistán", "K"], COL: ["Colombia", "K"],
  ENG: ["Inglaterra", "L"], CRO: ["Croacia", "L"], GHA: ["Ghana", "L"], PAN: ["Panamá", "L"],
};
const NAME2ID = {};
for (const [id, [nombre]] of Object.entries(TEAMS)) NAME2ID[noAcc(nombre)] = id;
// alias / abreviaciones frecuentes
Object.assign(NAME2ID, {
  "ecua": "ECU", "corea": "KOR", "holanda": "NED", "eeuu": "USA", "ee uu": "USA", "usa": "USA",
  "rd congo": "COD", "r d congo": "COD", "congo": "COD", "republica democratica del congo": "COD",
  "curacao": "CUW", "bosnia": "BIH", "arabia": "KSA", "cabo": "CPV", "nueva zelandia": "NZL",
});
const unmapped = new Map(); // nombre -> [contextos]
function teamId(name, ctx) {
  const id = NAME2ID[noAcc(name)];
  if (!id && String(name).trim()) {
    if (!unmapped.has(name)) unmapped.set(name, []);
    unmapped.get(name).push(ctx);
  }
  return id || null;
}

// inscritos
const pRows = XLSX.utils.sheet_to_json(XLSX.readFile(PLANTILLA).Sheets["Participantes"], { header: 1, defval: "", raw: false });
const byRut = new Map(), byEmail = new Map(), byPid = new Map();
for (let i = 1; i < pRows.length; i++) {
  const [pid, nombre, , rut, correo] = pRows[i];
  if (!pid || !nombre) continue;
  const p = { pid, nombre: nombre.trim() };
  if (rut) byRut.set(normRut(rut), p);
  if (correo) byEmail.set(lower(correo), p);
  byPid.set(pid, p);
}
function match(r) {
  return byRut.get(normRut(r[7])) || byEmail.get(lower(r[8])) ||
    byPid.get((String(r[6]).match(/^(P\d+)/) || [])[1]) || null;
}
function dedup(file) {
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets["Sheet1"], { header: 1, defval: "", raw: false });
  const latest = new Map();
  for (let i = 1; i < rows.length; i++) {
    const p = match(rows[i]); if (!p) continue;
    const t = ts(rows[i][2]); const prev = latest.get(p.pid);
    if (!prev || t > prev.t) latest.set(p.pid, { row: rows[i], t, p });
  }
  return latest;
}

// --- Torneo Inicial: goleador, arquero, mejor jugador, finalistas ---
const ini = dedup(F_INI);
console.log(`TORNEO INICIAL: ${ini.size} personas`);
for (const { row, p } of ini.values()) {
  teamId(row[12], `Finalista1 de ${p.nombre}`);
  teamId(row[13], `Finalista2 de ${p.nombre}`);
}

// --- Clasificados: 12 grupos x 2 (cols 9..32) ---
const GRUPOS = "ABCDEFGHIJKL".split("");
const clas = dedup(F_CLAS);
console.log(`CLASIFICADOS: ${clas.size} personas`);
let fueraDeGrupo = [];
for (const { row, p } of clas.values()) {
  for (let g = 0; g < 12; g++) {
    const c1 = row[9 + g * 2], c2 = row[9 + g * 2 + 1];
    for (const c of [c1, c2]) {
      const id = teamId(c, `Grupo ${GRUPOS[g]} de ${p.nombre}`);
      if (id && TEAMS[id][1] !== GRUPOS[g]) {
        fueraDeGrupo.push(`${p.nombre}: puso "${c}" (grupo ${TEAMS[id][1]}) en el Grupo ${GRUPOS[g]}`);
      }
    }
  }
}

// --- ejemplos de jugadores (free text) ---
console.log(`\n--- Ejemplo respuestas Torneo Inicial (primeras 3) ---`);
let n = 0;
for (const { row, p } of ini.values()) {
  if (n++ >= 3) break;
  console.log(`  ${p.nombre}: Goleador="${row[9]}" | Arquero="${row[10]}" | Mejor="${row[11]}" | Finalistas=${teamId(row[12])||row[12]}/${teamId(row[13])||row[13]}`);
}

console.log(`\n================ VALIDACIÓN ================`);
if (unmapped.size === 0) console.log("✅ Todos los nombres de selecciones se mapearon a un equipo.");
else {
  console.log(`⚠️ Nombres de selección que NO calzan (${unmapped.size}):`);
  for (const [name, ctx] of unmapped) console.log(`  • "${name}"  -> usado en: ${ctx.slice(0, 3).join("; ")}${ctx.length > 3 ? "..." : ""}`);
}
if (fueraDeGrupo.length) {
  console.log(`\n⚠️ Clasificados puestos en grupo equivocado (${fueraDeGrupo.length}):`);
  fueraDeGrupo.slice(0, 15).forEach((x) => console.log("  • " + x));
}
console.log(`\nNota: los nombres de JUGADOR (goleador/arquero/mejor) se guardan tal cual; la variación ("Mbappe" vs "Kylian Mbappé") se resuelve al calificar (el admin define qué cuenta como acierto).`);

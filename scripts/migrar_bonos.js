// Migra a producción las respuestas de bonos (última de cada persona).
// - goleador/arquero/mejor_jugador: texto tal cual (se califican a mano)
// - finalistas y clasificados de grupo: como IDs de equipo
// NO asigna puntos (points queda null hasta que el admin califique).
// Uso: node scripts/migrar_bonos.js
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const PLANTILLA = path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx");
const F_INI = path.join(__dirname, "..", "Bonus de Torneo Inicial - Mundial 2026(1-37).xlsx");
const F_CLAS = path.join(__dirname, "..", "Bonus Clasificados de Fase de Grupos - Mundial 2026(1-33).xlsx");

const normRut = (s) => String(s ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
const lower = (s) => String(s ?? "").trim().toLowerCase();
const noAcc = (s) => lower(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
function ts(s) { const m = String(s).match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/); if (!m) return 0; const [, mo, d, y, h, mi, se] = m.map(Number); return Date.UTC(2000 + y, mo - 1, d, h, mi, se); }

const TEAMS = { MEX:["México","A"],RSA:["Sudáfrica","A"],KOR:["Corea del Sur","A"],CZE:["Chequia","A"],CAN:["Canadá","B"],BIH:["Bosnia y Herzegovina","B"],QAT:["Qatar","B"],SUI:["Suiza","B"],BRA:["Brasil","C"],MAR:["Marruecos","C"],HAI:["Haití","C"],SCO:["Escocia","C"],USA:["Estados Unidos","D"],PAR:["Paraguay","D"],AUS:["Australia","D"],TUR:["Turquía","D"],GER:["Alemania","E"],CUW:["Curazao","E"],CIV:["Costa de Marfil","E"],ECU:["Ecuador","E"],NED:["Países Bajos","F"],JPN:["Japón","F"],SWE:["Suecia","F"],TUN:["Túnez","F"],BEL:["Bélgica","G"],EGY:["Egipto","G"],IRN:["Irán","G"],NZL:["Nueva Zelanda","G"],ESP:["España","H"],CPV:["Cabo Verde","H"],KSA:["Arabia Saudita","H"],URU:["Uruguay","H"],FRA:["Francia","I"],SEN:["Senegal","I"],IRQ:["Irak","I"],NOR:["Noruega","I"],ARG:["Argentina","J"],ALG:["Argelia","J"],AUT:["Austria","J"],JOR:["Jordania","J"],POR:["Portugal","K"],COD:["RD Congo","K"],UZB:["Uzbekistán","K"],COL:["Colombia","K"],ENG:["Inglaterra","L"],CRO:["Croacia","L"],GHA:["Ghana","L"],PAN:["Panamá","L"] };
const NAME2ID = {}; for (const [id, [n]] of Object.entries(TEAMS)) NAME2ID[noAcc(n)] = id;
Object.assign(NAME2ID, { "ecua":"ECU","corea":"KOR","holanda":"NED","eeuu":"USA","ee uu":"USA","usa":"USA","rd congo":"COD","r d congo":"COD","congo":"COD","republica democratica del congo":"COD","curacao":"CUW","bosnia":"BIH","arabia":"KSA","cabo":"CPV","nueva zelandia":"NZL" });
const tid = (name) => NAME2ID[noAcc(name)] || null;

const pRows = XLSX.utils.sheet_to_json(XLSX.readFile(PLANTILLA).Sheets["Participantes"], { header: 1, defval: "", raw: false });
const byRut = new Map(), byEmail = new Map(), byPid = new Map();
for (let i = 1; i < pRows.length; i++) { const [pid, nombre, , rut, correo] = pRows[i]; if (!pid || !nombre) continue; const p = { pid, email: lower(correo) }; if (rut) byRut.set(normRut(rut), p); if (correo) byEmail.set(lower(correo), p); byPid.set(pid, p); }
const match = (r) => byRut.get(normRut(r[7])) || byEmail.get(lower(r[8])) || byPid.get((String(r[6]).match(/^(P\d+)/) || [])[1]) || null;
function dedup(file) { const rows = XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets["Sheet1"], { header: 1, defval: "", raw: false }); const latest = new Map(); for (let i = 1; i < rows.length; i++) { const p = match(rows[i]); if (!p) continue; const t = ts(rows[i][2]); const prev = latest.get(p.pid); if (!prev || t > prev.t) latest.set(p.pid, { row: rows[i], t, email: p.email }); } return latest; }

async function main() {
  const pr = await fetch(`${URL}/rest/v1/profiles?select=id,email`, { headers: H });
  const idByEmail = new Map((await pr.json()).map((p) => [lower(p.email), p.id]));

  const payload = [];
  const push = (email, qid, answer) => { const uid = idByEmail.get(lower(email)); if (uid) payload.push({ user_id: uid, question_id: qid, answer }); };

  for (const { row, email } of dedup(F_INI).values()) {
    push(email, "goleador", String(row[9]).trim());
    push(email, "arquero", String(row[10]).trim());
    push(email, "mejor_jugador", String(row[11]).trim());
    push(email, "finalistas", [tid(row[12]), tid(row[13])].filter(Boolean));
  }
  const G = "ABCDEFGHIJKL".split("");
  for (const { row, email } of dedup(F_CLAS).values()) {
    for (let g = 0; g < 12; g++) push(email, `grupo_${G[g]}`, [tid(row[9 + g * 2]), tid(row[9 + g * 2 + 1])].filter(Boolean));
  }

  const res = await fetch(`${URL}/rest/v1/bonus_answers?on_conflict=user_id,question_id`, {
    method: "POST", headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(payload),
  });
  if (!res.ok) { console.error("ERROR:", res.status, await res.text()); process.exit(1); }
  console.log(`OK: ${payload.length} respuestas de bonos migradas (30 personas x 16 bonos = 480 aprox).`);
}
main().catch((e) => { console.error(e); process.exit(1); });

// Migra las apuestas del Forms del 12-jun (Slot1=M003 Canadá-Bosnia,
// Slot2=M004 EEUU-Paraguay). Identifica por RUT -> correo -> código P,
// se queda con la ÚLTIMA respuesta por persona (Hora de finalización) y
// reporta quién no respondió.
//
//   node scripts/importar_12jun.js            -> solo ANALIZA (no escribe)
//   node scripts/importar_12jun.js migrar     -> migra a producción
//
// Incluye además la apuesta del organizador (P022 Andres Carreño), registrada
// fuera del Forms: M003 Canadá 1-0, M004 EEUU 2-1 (decisión del admin).
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "Apuestas Mundial 2026 - 12 Jun(1-31).xlsx");
const PLANTILLA = path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const normRut = (s) => String(s ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
const lower = (s) => String(s ?? "").trim().toLowerCase();
function ts(s) {
  const m = String(s).match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/);
  if (!m) return 0;
  const [, mo, d, y, h, mi, se] = m.map(Number);
  return Date.UTC(2000 + y, mo - 1, d, h, mi, se);
}

// Apuesta manual del organizador (no alcanzó a responder el Forms).
const EXTRA = [
  { email: "andrescarr.v@gmail.com", nombre: "Andres Carreño (manual)", m003: [1, 0], m004: [2, 1] },
];

// --- inscritos ---
const pRows = XLSX.utils.sheet_to_json(XLSX.readFile(PLANTILLA).Sheets["Participantes"], { header: 1, defval: "", raw: false });
const byRut = new Map(), byEmail = new Map(), byPid = new Map();
const participantes = [];
for (let i = 1; i < pRows.length; i++) {
  const [pid, nombre, , rut, correo] = pRows[i];
  if (!pid || !nombre) continue;
  const p = { pid, nombre: nombre.trim().replace(/\s+/g, " "), email: lower(correo) };
  participantes.push(p);
  if (rut) byRut.set(normRut(rut), p);
  if (correo) byEmail.set(lower(correo), p);
  byPid.set(pid, p);
}
const match = (r) => byRut.get(normRut(r[7])) || byEmail.get(lower(r[8])) || byPid.get((String(r[6]).match(/^(P\d+)/) || [])[1]) || null;

// --- última respuesta por persona ---
const rows = XLSX.utils.sheet_to_json(XLSX.readFile(FILE).Sheets["Sheet1"], { header: 1, defval: "", raw: false });
const latest = new Map();
const sinMatch = [];
let dupes = 0;
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const p = match(r);
  if (!p) { sinMatch.push(`fila ${i + 1}: "${r[6]}" RUT=${r[7]} ${r[8]}`); continue; }
  const t = ts(r[2]);
  const prev = latest.get(p.pid);
  if (prev) dupes++;
  if (!prev || t > prev.t) latest.set(p.pid, { row: r, t, p });
}

// --- armar pronósticos ---
const picks = []; // {email, nombre, m003:[h,a]|null, m004:[h,a]|null}
for (const { row, p } of latest.values()) {
  const n = (v) => { const x = parseInt(v, 10); return Number.isNaN(x) ? null : x; };
  const s1 = [n(row[9]), n(row[10])], s2 = [n(row[11]), n(row[12])];
  picks.push({
    email: p.email, nombre: p.nombre,
    m003: s1[0] !== null && s1[1] !== null ? s1 : null,
    m004: s2[0] !== null && s2[1] !== null ? s2 : null,
  });
}
for (const e of EXTRA) {
  if (!picks.some((x) => x.email === e.email)) {
    picks.push({ email: e.email, nombre: e.nombre, m003: e.m003, m004: e.m004 });
  }
}

// --- reporte ---
console.log(`Respuestas: ${rows.length - 1} | personas únicas: ${latest.size} | repetidas descartadas: ${dupes}`);
if (sinMatch.length) { console.log(`\n⚠️ SIN MATCH:`); sinMatch.forEach((x) => console.log("  • " + x)); }
const respondieron = new Set(picks.map((x) => x.email));
const faltan = participantes.filter((p) => !respondieron.has(p.email));
console.log(`\n❌ NO respondieron (${faltan.length}):`);
faltan.forEach((p) => console.log(`  • ${p.pid} ${p.nombre} <${p.email}>`));
console.log(`\nPronósticos finales (${picks.length} personas):`);
picks.sort((a, b) => a.nombre.localeCompare(b.nombre));
for (const x of picks) {
  console.log(`  ${x.nombre.padEnd(24)} CAN-BIH ${x.m003 ? x.m003.join("-") : "—"}   USA-PAR ${x.m004 ? x.m004.join("-") : "—"}`);
}

// --- migrar ---
if (process.argv[2] !== "migrar") {
  console.log(`\n(Solo análisis. Para migrar: node scripts/importar_12jun.js migrar)`);
  process.exit(0);
}

(async () => {
  const pr = await fetch(`${URL}/rest/v1/profiles?select=id,email`, { headers: H });
  const idByEmail = new Map((await pr.json()).map((p) => [lower(p.email), p.id]));
  const mr = await fetch(`${URL}/rest/v1/matches?select=id,code&code=in.(M003,M004)`, { headers: H });
  const codeToId = new Map((await mr.json()).map((m) => [m.code, m.id]));

  const payload = [];
  for (const x of picks) {
    const uid = idByEmail.get(x.email);
    if (!uid) { console.log(`! sin usuario: ${x.email}`); continue; }
    if (x.m003) payload.push({ user_id: uid, match_id: codeToId.get("M003"), home_score: x.m003[0], away_score: x.m003[1] });
    if (x.m004) payload.push({ user_id: uid, match_id: codeToId.get("M004"), home_score: x.m004[0], away_score: x.m004[1] });
  }
  const res = await fetch(`${URL}/rest/v1/predictions?on_conflict=user_id,match_id`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { console.error("ERROR:", res.status, await res.text()); process.exit(1); }
  console.log(`\n✓ MIGRADO: ${payload.length} pronósticos (M003/M004).`);
})();

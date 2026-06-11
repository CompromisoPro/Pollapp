// Analiza los Excel de bonos (Torneo Inicial y Clasificados): cruza cada
// respuesta con los 30 inscritos, deja la ÚLTIMA por persona, detecta duplicados,
// respuestas sin match y quién faltó. NO migra nada: solo reporta.
// Uso: node scripts/analizar_bonos.js
const XLSX = require("xlsx");
const path = require("path");

const PLANTILLA = path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx");
const FILES = {
  "TORNEO INICIAL": path.join(__dirname, "..", "Bonus de Torneo Inicial - Mundial 2026(1-37).xlsx"),
  "CLASIFICADOS GRUPOS": path.join(__dirname, "..", "Bonus Clasificados de Fase de Grupos - Mundial 2026(1-33).xlsx"),
};

const normRut = (s) => String(s ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
const lower = (s) => String(s ?? "").trim().toLowerCase();

// parsea "6/10/26 19:54:39" -> número comparable
function ts(s) {
  const m = String(s).match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/);
  if (!m) return 0;
  const [, mo, d, y, h, mi, se] = m.map(Number);
  return Date.UTC(2000 + y, mo - 1, d, h, mi, se);
}

// --- inscritos ---
const pRows = XLSX.utils.sheet_to_json(XLSX.readFile(PLANTILLA).Sheets["Participantes"], { header: 1, defval: "", raw: false });
const byRut = new Map(), byEmail = new Map(), byPid = new Map();
const participantes = [];
for (let i = 1; i < pRows.length; i++) {
  const [pid, nombre, , rut, correo, , activo] = pRows[i];
  if (!pid || !nombre) continue;
  const p = { pid, nombre: nombre.trim(), rut, email: lower(correo) };
  participantes.push(p);
  if (rut) byRut.set(normRut(rut), p);
  if (correo) byEmail.set(lower(correo), p);
  byPid.set(pid, p);
}

function match(rut, email, nombreParticipante) {
  const byR = byRut.get(normRut(rut));
  if (byR) return { p: byR, via: "RUT" };
  const byE = byEmail.get(lower(email));
  if (byE) return { p: byE, via: "correo" };
  const pidM = String(nombreParticipante).match(/^(P\d+)/);
  if (pidM && byPid.get(pidM[1])) return { p: byPid.get(pidM[1]), via: "código" };
  return null;
}

for (const [titulo, file] of Object.entries(FILES)) {
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets["Sheet1"], { header: 1, defval: "", raw: false });
  const header = rows[0];
  const answerCols = header.slice(9); // columnas de respuestas

  const latest = new Map(); // pid -> {row, t, via}
  const sinMatch = [];
  const dupes = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const t = ts(r[2]);
    const mt = match(r[7], r[8], r[6]);
    if (!mt) {
      sinMatch.push({ nombreForms: r[6], rut: r[7], email: r[8] });
      continue;
    }
    const prev = latest.get(mt.p.pid);
    if (prev) {
      dupes.push(`${mt.p.nombre}: 2 respuestas -> se queda la más nueva`);
      if (t > prev.t) latest.set(mt.p.pid, { row: r, t, via: mt.via });
    } else {
      latest.set(mt.p.pid, { row: r, t, via: mt.via });
    }
  }

  const respondieron = new Set(latest.keys());
  const faltan = participantes.filter((p) => !respondieron.has(p.pid));

  console.log(`\n================ ${titulo} ================`);
  console.log(`Respuestas totales: ${rows.length - 1}`);
  console.log(`Personas únicas que respondieron: ${respondieron.size} / ${participantes.length}`);

  if (dupes.length) {
    console.log(`\nDuplicados (se deja la última de c/u):`);
    [...new Set(dupes)].forEach((d) => console.log("  • " + d));
  }
  if (sinMatch.length) {
    console.log(`\n⚠️ Respuestas sin match (revisar a mano):`);
    sinMatch.forEach((s) => console.log(`  • Forms: "${s.nombreForms}" | RUT ${s.rut} | ${s.email}`));
  }
  console.log(`\n❌ NO respondieron (${faltan.length}):`);
  faltan.forEach((p) => console.log(`  • ${p.pid} ${p.nombre} <${p.email}>`));

  // método de match usado (transparencia)
  const vias = {};
  for (const v of latest.values()) vias[v.via] = (vias[v.via] || 0) + 1;
  console.log(`\nIdentificados por: ${Object.entries(vias).map(([k, n]) => `${k}=${n}`).join(", ")}`);
  console.log(`(columnas de respuesta: ${answerCols.length})`);
}

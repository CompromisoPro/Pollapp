// Importa las apuestas válidas de la hoja Apuestas_Normalizadas como
// pronósticos de la app (se queda con la última respuesta por jugador/partido).
// Requiere haber corrido antes supabase/migracion_oficial.sql (columna code).
// Uso: node scripts/importar_apuestas.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const env = {};
for (const line of fs
  .readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
  .split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const wb = XLSX.readFile(
  path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx")
);

// P-code -> email (de la hoja Participantes)
const partRows = XLSX.utils.sheet_to_json(wb.Sheets["Participantes"], {
  header: 1,
  defval: "",
  raw: false,
});
const emailByPid = new Map();
for (let i = 1; i < partRows.length; i++) {
  const [pid, , , , correo] = partRows[i];
  if (pid && correo) emailByPid.set(pid, String(correo).trim().toLowerCase());
}

// Apuestas válidas, última por (jugador, partido)
const betRows = XLSX.utils.sheet_to_json(wb.Sheets["Apuestas_Normalizadas"], {
  header: 1,
  defval: "",
  raw: true, // timestamps como número de Excel para comparar
});
const best = new Map(); // "pid|mcode" -> {pid, mcode, h, a, ts}
for (let i = 1; i < betRows.length; i++) {
  const r = betRows[i];
  const [_, ts, __, pid, ___, ____, _____, ______, _______, mcode, ________, _________, gl, gv, __________, valida] = r;
  if (String(valida).trim() !== "Sí") continue;
  if (!pid || !mcode) continue;
  const h = parseInt(gl, 10);
  const a = parseInt(gv, 10);
  if (Number.isNaN(h) || Number.isNaN(a)) continue;
  const key = `${pid}|${mcode}`;
  const prev = best.get(key);
  if (!prev || Number(ts) > prev.ts) best.set(key, { pid, mcode, h, a, ts: Number(ts) });
}

async function main() {
  // perfiles: email -> user_id
  const pr = await fetch(`${URL}/rest/v1/profiles?select=id,email`, { headers: H });
  const profiles = await pr.json();
  const idByEmail = new Map(profiles.map((p) => [String(p.email).toLowerCase(), p.id]));

  // partidos: code -> match_id
  const mr = await fetch(`${URL}/rest/v1/matches?select=id,code`, { headers: H });
  const matches = await mr.json();
  const matchByCode = new Map(matches.map((m) => [m.code, m.id]));
  if (matchByCode.size === 0 || !matchByCode.get("M001")) {
    console.error("ERROR: los partidos no tienen código M001... ¿Corriste migracion_oficial.sql?");
    process.exit(1);
  }

  const payload = [];
  for (const { pid, mcode, h, a } of best.values()) {
    const email = emailByPid.get(pid);
    const userId = email && idByEmail.get(email);
    const matchId = matchByCode.get(mcode);
    if (!userId || !matchId) {
      console.log(`! sin mapeo: ${pid} ${mcode} (${email})`);
      continue;
    }
    payload.push({ user_id: userId, match_id: matchId, home_score: h, away_score: a });
  }

  const res = await fetch(
    `${URL}/rest/v1/predictions?on_conflict=user_id,match_id`,
    {
      method: "POST",
      headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    console.error("ERROR al insertar:", res.status, await res.text());
    process.exit(1);
  }
  console.log(`OK: ${payload.length} pronósticos importados (de ${best.size} apuestas válidas).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Corrige partidos en estado inválido: un partido cuyo kickoff YA pasó no
// debería estar 'oculto' (oculto es solo para partidos futuros que el admin
// aún no abrió). Este script pasa a 'abierto' todos los partidos pasados que
// quedaron 'oculto', para que sus apuestas/estado se comporten bien.
//
// No toca los 'finalizado' ni los ya 'abiertos'. Solo reporta y corrige.
//
// Uso: node scripts/corregir_estados.js          (modo simulación, no escribe)
//      node scripts/corregir_estados.js --aplicar (aplica los cambios)
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
if (!URL || !KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
const H = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

const APLICAR = process.argv.includes("--aplicar");

async function main() {
  // Partidos ocultos cuyo kickoff ya pasó.
  const nowIso = new Date().toISOString();
  const url =
    `${URL}/rest/v1/matches` +
    `?select=id,home_team,away_team,kickoff_at,status` +
    `&status=eq.oculto&kickoff_at=lt.${nowIso}` +
    `&order=kickoff_at.asc`;
  const res = await fetch(url, { headers: H });
  if (!res.ok) {
    console.error("Error leyendo matches:", res.status, await res.text());
    process.exit(1);
  }
  const rows = await res.json();

  if (rows.length === 0) {
    console.log("✓ No hay partidos pasados en estado 'oculto'. Nada que corregir.");
    return;
  }

  console.log(`Partidos pasados que están 'oculto' (estado inválido): ${rows.length}`);
  for (const m of rows) {
    console.log(`  #${m.id}  ${m.home_team} vs ${m.away_team}  (${m.kickoff_at})`);
  }

  if (!APLICAR) {
    console.log("\nSimulación. Para aplicar: node scripts/corregir_estados.js --aplicar");
    return;
  }

  // Pasar todos a 'abierto'.
  const ids = rows.map((m) => m.id);
  const patch = await fetch(
    `${URL}/rest/v1/matches?id=in.(${ids.join(",")})`,
    {
      method: "PATCH",
      headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ status: "abierto" }),
    }
  );
  if (!patch.ok) {
    console.error("Error aplicando:", patch.status, await patch.text());
    process.exit(1);
  }
  console.log(`\n✓ Corregidos ${ids.length} partidos a 'abierto'.`);
}

main();

// Asigna una contraseña distinta (y fácil de tipear) a cada jugador.
// Genera "acceso_jugadores.csv" con Nombre, Correo y Contraseña para repartir.
// NO toca al admin (mantiene su clave actual).
// Uso: node scripts/set_passwords.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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

const W1 = ["Gol", "Copa", "Arco", "Tiro", "Pase", "Area", "Hincha", "Polla", "Mundial", "Crack", "Penal", "Banca"];
const W2 = ["Azul", "Rojo", "Verde", "Oro", "Sur", "Andes", "Campeon", "Estrella", "Bota", "Pacifico", "Cumbre", "Fuego"];

function genPassword() {
  const a = W1[crypto.randomInt(W1.length)];
  const b = W2[crypto.randomInt(W2.length)];
  const n = 10 + crypto.randomInt(90); // 10..99
  return `${a}${b}${n}`;
}

async function main() {
  const pr = await fetch(
    `${URL}/rest/v1/profiles?select=id,email,full_name,is_admin&order=full_name`,
    { headers: H }
  );
  const profiles = await pr.json();

  const out = [["Nombre", "Correo", "Contraseña"]];
  let done = 0,
    skipped = 0,
    failed = 0;

  for (const p of profiles) {
    if (p.is_admin) {
      skipped++;
      continue; // no tocar al admin
    }
    const pwd = genPassword();
    const r = await fetch(`${URL}/auth/v1/admin/users/${p.id}`, {
      method: "PUT",
      headers: H,
      body: JSON.stringify({ password: pwd }),
    });
    if (r.ok) {
      out.push([p.full_name || "", p.email, pwd]);
      console.log(`+ ${p.full_name}  <${p.email}>  ->  ${pwd}`);
      done++;
    } else {
      console.log(`! ERROR ${p.email}: ${r.status} ${await r.text()}`);
      failed++;
    }
  }

  const csv = out
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const file = path.join(__dirname, "..", "acceso_jugadores.csv");
  fs.writeFileSync(file, "﻿" + csv, "utf8"); // BOM para que Excel lea acentos
  console.log(`\nResumen: ${done} con clave nueva, ${skipped} admin omitido, ${failed} errores.`);
  console.log(`Lista guardada en: ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

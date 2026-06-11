// Pone como contraseña de cada JUGADOR su propio RUT (formato canónico
// "cuerpo-DV", K en mayúscula). No toca a los admins (mantienen su clave).
// Uso: node scripts/set_rut_passwords.js
const fs = require("fs");
const path = require("path");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const canonicalRut = (rut) => {
  const clean = String(rut ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  return clean.length < 2 ? clean : clean.slice(0, -1) + "-" + clean.slice(-1);
};

async function main() {
  const pr = await fetch(`${URL}/rest/v1/profiles?select=id,full_name,rut,is_admin&order=full_name`, { headers: H });
  const profiles = await pr.json();
  let done = 0, skip = 0, fail = 0;
  for (const p of profiles) {
    if (p.is_admin) { skip++; continue; }
    if (!p.rut) { console.log(`! sin RUT: ${p.full_name}`); fail++; continue; }
    const pass = canonicalRut(p.rut);
    if (pass.length < 6) { console.log(`! RUT muy corto (Supabase exige 6+): ${p.full_name} -> ${pass}`); fail++; continue; }
    const r = await fetch(`${URL}/auth/v1/admin/users/${p.id}`, { method: "PUT", headers: H, body: JSON.stringify({ password: pass }) });
    if (r.ok) { console.log(`✓ ${p.full_name}  ->  ${pass}`); done++; }
    else { console.log(`! ERROR ${p.full_name}: ${r.status} ${await r.text()}`); fail++; }
  }
  console.log(`\nListo: ${done} con RUT de contraseña, ${skip} admins omitidos, ${fail} con problema.`);
}
main().catch((e) => { console.error(e); process.exit(1); });

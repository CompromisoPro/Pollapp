// Importa los 30 inscritos de la plantilla como usuarios de la app.
// Crea cada usuario en Supabase Auth (email confirmado, sin enviar correo);
// el trigger handle_new_user crea su perfil automáticamente.
// Quedan con paid=false (el admin marca pagos a mano).
// Uso: node scripts/importar_inscritos.js
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// --- leer .env.local ---
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

// --- leer participantes de la plantilla ---
const wb = XLSX.readFile(
  path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx")
);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Participantes"], {
  header: 1,
  defval: "",
  raw: false,
});

function cleanName(s) {
  return String(s).trim().replace(/\s+/g, " ");
}

async function main() {
  // usuarios ya existentes (para no duplicar)
  const resp = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: H });
  const existing = new Set(
    ((await resp.json()).users || []).map((u) => u.email.toLowerCase())
  );

  let created = 0,
    skipped = 0,
    failed = 0;
  for (let i = 1; i < rows.length; i++) {
    const [pid, nombre, , , correo, , activo] = rows[i];
    const email = String(correo).trim().toLowerCase();
    if (!pid || !email) continue;
    if (activo !== "Sí") continue;
    if (existing.has(email)) {
      console.log(`= ya existe: ${pid} ${email}`);
      skipped++;
      continue;
    }
    const r = await fetch(`${URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: H,
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: { full_name: cleanName(nombre) },
      }),
    });
    if (r.ok) {
      console.log(`+ creado: ${pid} ${cleanName(nombre)} <${email}>`);
      created++;
    } else {
      console.log(`! ERROR ${pid} ${email}: ${r.status} ${await r.text()}`);
      failed++;
    }
  }
  console.log(`\nResumen: ${created} creados, ${skipped} ya existían, ${failed} errores.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

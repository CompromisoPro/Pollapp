// Importa el RUT de cada inscrito (desde la plantilla) al perfil correspondiente.
// Requiere haber corrido antes supabase/agregar_rut.sql.
// Uso: node scripts/importar_ruts.js
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
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Participantes"], {
  header: 1,
  defval: "",
  raw: false,
});

async function main() {
  let done = 0,
    failed = 0;
  for (let i = 1; i < rows.length; i++) {
    const [pid, , , rut, correo] = rows[i];
    const email = String(correo).trim().toLowerCase();
    const rutVal = String(rut).trim();
    if (!pid || !email || !rutVal) continue;

    const r = await fetch(
      `${URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`,
      {
        method: "PATCH",
        headers: { ...H, Prefer: "return=minimal" },
        body: JSON.stringify({ rut: rutVal }),
      }
    );
    if (r.ok) {
      console.log(`✓ ${pid} ${email} -> ${rutVal}`);
      done++;
    } else {
      console.log(`! ERROR ${email}: ${r.status} ${await r.text()}`);
      failed++;
    }
  }
  console.log(`\nListo: ${done} RUT cargados, ${failed} errores.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

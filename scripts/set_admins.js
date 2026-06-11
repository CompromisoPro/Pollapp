// Crea/asegura los admins neutros (no juegan), les pone contraseña y rol admin,
// y le QUITA el rol admin a andrescarr.v@gmail.com (pasa a jugador normal).
// Uso: node scripts/set_admins.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const ADMINS = ["sibarra@cchc.cl", "acarreno@cchc.cl"];
const QUITAR_ADMIN = "andrescarr.v@gmail.com";

const W1 = ["Gol", "Copa", "Arco", "Mundial", "Crack", "Penal"];
const W2 = ["Azul", "Oro", "Andes", "Campeon", "Estrella", "Cumbre"];
const genPass = () => `${W1[crypto.randomInt(W1.length)]}${W2[crypto.randomInt(W2.length)]}${10 + crypto.randomInt(90)}`;

async function findUser(email) {
  const r = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: H });
  const users = (await r.json()).users || [];
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

async function main() {
  const out = [];
  for (const email of ADMINS) {
    const pass = genPass();
    let user = await findUser(email);
    if (user) {
      await fetch(`${URL}/auth/v1/admin/users/${user.id}`, { method: "PUT", headers: H, body: JSON.stringify({ password: pass }) });
    } else {
      const r = await fetch(`${URL}/auth/v1/admin/users`, {
        method: "POST", headers: H,
        body: JSON.stringify({ email, password: pass, email_confirm: true, user_metadata: { full_name: "Administrador" } }),
      });
      user = await r.json();
      if (!r.ok) { console.log(`! ERROR creando ${email}:`, JSON.stringify(user)); continue; }
    }
    // marcar como admin (no juega -> paid true para que no diga "pago pendiente")
    await fetch(`${URL}/rest/v1/profiles?id=eq.${user.id}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ is_admin: true, paid: true, full_name: "Administrador" }),
    });
    out.push({ email, pass });
    console.log(`✓ ADMIN  ${email}  ->  ${pass}`);
  }

  // quitar admin a andrescarr (pasa a jugador)
  const quit = await findUser(QUITAR_ADMIN);
  if (quit) {
    await fetch(`${URL}/rest/v1/profiles?id=eq.${quit.id}`, {
      method: "PATCH", headers: { ...H, Prefer: "return=minimal" },
      body: JSON.stringify({ is_admin: false }),
    });
    console.log(`✓ ${QUITAR_ADMIN} ahora es JUGADOR (sin rol admin)`);
  }

  console.log("\n=== CONTRASEÑAS ADMIN ===");
  for (const a of out) console.log(`${a.email}  ${a.pass}`);
}

main().catch((e) => console.error(e));

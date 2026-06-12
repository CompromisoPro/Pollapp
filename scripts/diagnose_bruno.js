// Diagnóstico del login de Bruno: muestra su estado en auth + perfil y prueba
// con qué contraseña entra.  node scripts/diagnose_bruno.js
const fs = require("fs");
const path = require("path");
const env = {};
for (const l of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SVC = env.SUPABASE_SERVICE_ROLE_KEY, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HS = { apikey: SVC, Authorization: `Bearer ${SVC}` };
const EMAIL = "bfierimarinho@gmail.com";
const canonicalRut = (rut) => { const c = String(rut ?? "").replace(/[^0-9kK]/g, "").toUpperCase(); return c.length < 2 ? c : c.slice(0, -1) + "-" + c.slice(-1); };

async function tryLogin(email, password) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return r.ok ? "OK" : `FALLA (${r.status})`;
}

(async () => {
  // auth user
  const ur = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: HS });
  const u = ((await ur.json()).users || []).find((x) => (x.email || "").toLowerCase() === EMAIL || (x.new_email || "").toLowerCase() === EMAIL);
  if (!u) return console.log("No encontré usuario con ese correo.");
  console.log("AUTH:");
  console.log("  email:", u.email);
  console.log("  email_confirmed_at:", u.email_confirmed_at);
  console.log("  new_email (cambio pendiente):", u.new_email || "(ninguno)");
  console.log("  id:", u.id);

  // perfil
  const pr = await fetch(`${URL}/rest/v1/profiles?select=full_name,email,rut&id=eq.${u.id}`, { headers: HS });
  const p = (await pr.json())[0];
  console.log("\nPERFIL:");
  console.log("  full_name:", p.full_name);
  console.log("  email:", p.email);
  console.log("  rut:", JSON.stringify(p.rut), "-> canónico:", canonicalRut(p.rut));

  console.log("\nPRUEBAS DE LOGIN (con el email de AUTH =", u.email + "):");
  console.log("  RUT canónico        :", await tryLogin(u.email, canonicalRut(p.rut)));
  console.log("  RUT tal cual        :", await tryLogin(u.email, String(p.rut || "")));
  console.log("  MundialSur20 (viejo):", await tryLogin(u.email, "MundialSur20"));
})();

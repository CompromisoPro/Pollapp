// Fija la contraseña de Bruno y verifica. node scripts/set_bruno.js bruno123
const fs = require("fs");
const path = require("path");
const env = {};
for (const l of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, SVC = env.SUPABASE_SERVICE_ROLE_KEY, ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HS = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };
const EMAIL = "bfierimarinho@gmail.com";
const NEWPASS = process.argv[2] || "bruno123";

(async () => {
  const ur = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: HS });
  const u = ((await ur.json()).users || []).find((x) => (x.email || "").toLowerCase() === EMAIL);
  if (!u) return console.log("No encontré a Bruno.");
  const r = await fetch(`${URL}/auth/v1/admin/users/${u.id}`, { method: "PUT", headers: HS, body: JSON.stringify({ password: NEWPASS }) });
  console.log("Set password:", r.ok ? "OK" : `FALLA ${r.status} ${await r.text()}`);
  // verificar
  const lr = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: NEWPASS }),
  });
  console.log(`Login con "${NEWPASS}":`, lr.ok ? "✅ OK" : `❌ FALLA ${lr.status}`);
})();

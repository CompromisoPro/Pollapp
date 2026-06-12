// PRUEBA DE PUNTA A PUNTA del flujo de apuestas, con un jugador de PRUEBA
// desechable (no toca datos reales). Verifica:
//   1. Guardar apuesta en partido abierto      -> debe FUNCIONAR
//   2. Editarla (vale la última)               -> debe FUNCIONAR
//   3. Apostar en partido cerrado (trampa)     -> debe SER RECHAZADO
//   4. Editar apuesta de partido cerrado       -> debe SER RECHAZADO
// Al final BORRA al jugador de prueba (limpia todo en cascada).
// Uso: node scripts/test_e2e_apuesta.js
const fs = require("fs");
const path = require("path");

const env = {};
for (const l of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HS = { apikey: SVC, Authorization: `Bearer ${SVC}`, "Content-Type": "application/json" };

const EMAIL = "prueba.pollapp@example.com";
const PASS = "PruebaPollapp26!";
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => {
  console.log(`${cond ? "✅" : "❌"} ${name}${extra ? "  (" + extra + ")" : ""}`);
  cond ? pass++ : fail++;
};

(async () => {
  // --- preparar: usuario de prueba (marcado admin para que NO salga en la tabla) ---
  const ex = await fetch(`${URL}/auth/v1/admin/users?per_page=200`, { headers: HS });
  const old = ((await ex.json()).users || []).find((u) => u.email === EMAIL);
  if (old) await fetch(`${URL}/auth/v1/admin/users/${old.id}`, { method: "DELETE", headers: HS });

  const cr = await fetch(`${URL}/auth/v1/admin/users`, {
    method: "POST", headers: HS,
    body: JSON.stringify({ email: EMAIL, password: PASS, email_confirm: true, user_metadata: { full_name: "JUGADOR DE PRUEBA" } }),
  });
  const user = await cr.json();
  if (!cr.ok) { console.error("No se pudo crear el usuario de prueba:", JSON.stringify(user)); process.exit(1); }
  await fetch(`${URL}/rest/v1/profiles?id=eq.${user.id}`, {
    method: "PATCH", headers: { ...HS, Prefer: "return=minimal" },
    body: JSON.stringify({ is_admin: true }), // invisible en la tabla durante la prueba
  });

  // --- login como el jugador de prueba ---
  const lr = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const session = await lr.json();
  ok("Login del jugador", lr.ok);
  const HU = { apikey: ANON, Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };

  // --- buscar un partido ABIERTO y uno CERRADO ---
  const mr = await fetch(`${URL}/rest/v1/matches?select=id,code,home_team,away_team,status,lock_at&order=kickoff_at`, { headers: HS });
  const ms = await mr.json();
  const now = Date.now();
  const abierto = ms.find((m) => m.status === "abierto" && now < new Date(m.lock_at).getTime());
  const cerrado = ms.find((m) => now >= new Date(m.lock_at).getTime());
  if (!abierto) {
    console.log("\n⚠️ No hay ningún partido ABIERTO con plazo vigente: abre la jornada del 13 en Admin y vuelve a correr la prueba.");
  }

  if (abierto) {
    console.log(`\nPartido abierto de prueba: ${abierto.code} ${abierto.home_team} vs ${abierto.away_team}`);
    // 1. guardar
    const i1 = await fetch(`${URL}/rest/v1/predictions?on_conflict=user_id,match_id`, {
      method: "POST", headers: { ...HU, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ user_id: user.id, match_id: abierto.id, home_score: 1, away_score: 0 }),
    });
    ok("1. Guardar apuesta (1-0) en partido abierto", i1.ok);

    // 2. editar -> vale la última
    const i2 = await fetch(`${URL}/rest/v1/predictions?on_conflict=user_id,match_id`, {
      method: "POST", headers: { ...HU, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ user_id: user.id, match_id: abierto.id, home_score: 3, away_score: 2 }),
    });
    const final = await fetch(`${URL}/rest/v1/predictions?select=home_score,away_score&user_id=eq.${user.id}&match_id=eq.${abierto.id}`, { headers: HS });
    const fv = (await final.json())[0];
    ok("2. Editar apuesta (-> 3-2) y que valga la última", i2.ok && fv && fv.home_score === 3 && fv.away_score === 2, `quedó ${fv?.home_score}-${fv?.away_score}`);
  }

  if (cerrado) {
    console.log(`\nPartido cerrado de prueba: ${cerrado.code} ${cerrado.home_team} vs ${cerrado.away_team}`);
    // 3. intentar apostar en cerrado
    const i3 = await fetch(`${URL}/rest/v1/predictions`, {
      method: "POST", headers: { ...HU, Prefer: "return=representation" },
      body: JSON.stringify({ user_id: user.id, match_id: cerrado.id, home_score: 9, away_score: 9 }),
    });
    ok("3. Apostar en partido CERRADO es rechazado", !i3.ok, `HTTP ${i3.status}`);

    // 4. intentar editar una apuesta existente de partido cerrado (la de otro... no:
    //    la suya — inserta una con service role y prueba editarla como usuario)
    await fetch(`${URL}/rest/v1/predictions?on_conflict=user_id,match_id`, {
      method: "POST", headers: { ...HS, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: user.id, match_id: cerrado.id, home_score: 1, away_score: 1 }),
    });
    const i4 = await fetch(`${URL}/rest/v1/predictions?user_id=eq.${user.id}&match_id=eq.${cerrado.id}`, {
      method: "PATCH", headers: { ...HU, Prefer: "return=representation" },
      body: JSON.stringify({ home_score: 9, away_score: 9 }),
    });
    const after = await fetch(`${URL}/rest/v1/predictions?select=home_score&user_id=eq.${user.id}&match_id=eq.${cerrado.id}`, { headers: HS });
    const av = (await after.json())[0];
    ok("4. Editar apuesta de partido CERRADO no cambia nada", !av || av.home_score === 1, `quedó home=${av?.home_score}`);
  }

  // --- limpiar: borrar usuario de prueba (cascada borra perfil y apuestas) ---
  const del = await fetch(`${URL}/auth/v1/admin/users/${user.id}`, { method: "DELETE", headers: HS });
  ok("Limpieza: jugador de prueba eliminado", del.ok);

  console.log(`\nRESULTADO: ${pass} OK, ${fail} fallas.`);
  process.exit(fail ? 1 : 0);
})();

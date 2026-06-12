// Verifica cuántos pronósticos quedaron en M003/M004 y muestra los de Andrés.
const fs = require("fs");
const path = require("path");
const env = {};
for (const l of fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) env[m[1]] = m[2].trim();
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

(async () => {
  const mr = await fetch(`${URL}/rest/v1/matches?select=id,code,status,home_team,away_team&code=in.(M003,M004)`, { headers: H });
  for (const m of await mr.json()) {
    const pr = await fetch(`${URL}/rest/v1/predictions?select=id&match_id=eq.${m.id}&limit=1`, {
      headers: { ...H, Prefer: "count=exact" }, method: "HEAD",
    });
    const total = (pr.headers.get("content-range") || "/?").split("/")[1];
    console.log(`${m.code} ${m.home_team} vs ${m.away_team} (${m.status}): ${total} pronósticos`);
  }
  // los de Andrés
  const u = await fetch(`${URL}/rest/v1/profiles?select=id&email=eq.andrescarr.v@gmail.com`, { headers: H });
  const uid = (await u.json())[0].id;
  const p = await fetch(`${URL}/rest/v1/predictions?select=home_score,away_score,matches(code)&user_id=eq.${uid}&matches.code=in.(M003,M004)`, { headers: H });
  const rows = (await p.json()).filter((r) => r.matches);
  for (const r of rows) console.log(`Andrés ${r.matches.code}: ${r.home_score}-${r.away_score}`);
})();

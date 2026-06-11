// Envía a cada jugador su acceso a Pollapp por correo (Gmail SMTP).
// Lee acceso_jugadores.csv (Nombre, Correo, Contraseña).
// Requiere en .env.local:  GMAIL_USER=...   GMAIL_APP_PASSWORD=...
//
// Modo prueba (envía SOLO a un correo, para validar antes):
//    node scripts/send_accesos.js test tucorreo@gmail.com
// Envío real a todos:
//    node scripts/send_accesos.js
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const env = {};
for (const line of fs
  .readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
  .split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const USER = env.GMAIL_USER;
const PASS = env.GMAIL_APP_PASSWORD;
if (!USER || !PASS) {
  console.error("Falta GMAIL_USER o GMAIL_APP_PASSWORD en .env.local");
  process.exit(1);
}

const APP_URL = "https://pollapp-phi.vercel.app";

// --- leer CSV ---
const raw = fs
  .readFileSync(path.join(__dirname, "..", "acceso_jugadores.csv"), "utf8")
  .replace(/^﻿/, "");
const lines = raw.split(/\r?\n/).filter(Boolean);
const players = [];
for (let i = 1; i < lines.length; i++) {
  const m = lines[i].match(/^"(.*)","(.*)","(.*)"$/);
  if (m) players.push({ nombre: m[1], correo: m[2], pass: m[3] });
}

const testMode = process.argv[2] === "test";
const testTo = process.argv[3];

function html(p) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0b1437">
    <div style="background:linear-gradient(120deg,#4f46e5,#7c3aed,#db2777);color:#fff;padding:24px;border-radius:14px 14px 0 0;text-align:center">
      <div style="font-size:28px;font-weight:800">⚽ Pollapp</div>
      <div style="opacity:.85;font-size:13px">Polla Mundialera 2026</div>
    </div>
    <div style="border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 14px 14px">
      <p>¡Hola <b>${p.nombre}</b>! Tu acceso a la polla del Mundial ya está listo 🏆</p>
      <p>Entra aquí y pronostica los partidos:</p>
      <p style="text-align:center;margin:18px 0">
        <a href="${APP_URL}" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">Entrar a Pollapp</a>
      </p>
      <div style="background:#f6f7fb;border-radius:10px;padding:14px;font-size:15px">
        <div><b>Correo:</b> ${p.correo}</div>
        <div><b>Contraseña:</b> <code style="font-size:16px">${p.pass}</code></div>
      </div>
      <p style="font-size:13px;color:#555;margin-top:16px">
        Cómo entrar: abre el sitio → <b>"¿Problemas con el link? Entrar con contraseña"</b> → pon tu correo y tu contraseña.
        (También puedes entrar con "link mágico" si prefieres, sin contraseña.)
      </p>
      <p style="font-size:12px;color:#999">Cada partido cierra a las 23:59 (hora Chile) del día anterior. ¡Mucha suerte!</p>
    </div>
  </div>`;
}

async function main() {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: USER, pass: PASS },
  });

  await transport.verify();
  console.log("Conexión SMTP OK.");

  let list = players;
  if (testMode) {
    const sample = players[0] || { nombre: "Prueba", correo: testTo, pass: "EjemploClave99" };
    list = [{ ...sample, correo: testTo }];
    console.log(`MODO PRUEBA -> enviando 1 correo a ${testTo}`);
  }

  let sent = 0;
  for (const p of list) {
    await transport.sendMail({
      from: `"Pollapp ⚽" <${USER}>`,
      to: p.correo,
      subject: "Tu acceso a Pollapp ⚽ — Polla Mundialera 2026",
      html: html(p),
    });
    console.log(`✓ ${p.correo}`);
    sent++;
  }
  console.log(`\nListo: ${sent} correo(s) enviado(s).`);
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});

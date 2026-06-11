// Vuelca un rango de filas de una hoja. Uso: node scripts/leer_rango.js Hoja desde hasta
const XLSX = require("xlsx");
const path = require("path");
const wb = XLSX.readFile(
  path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx")
);
const ws = wb.Sheets[process.argv[2]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
const from = Number(process.argv[3] || 1) - 1;
const to = Math.min(rows.length, Number(process.argv[4] || rows.length));
for (let i = from; i < to; i++) {
  console.log(i + 1 + "\t" + JSON.stringify(rows[i].map((c) => String(c).slice(0, 40))));
}

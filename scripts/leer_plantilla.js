// Script utilitario: vuelca la estructura de la plantilla Excel a la consola.
// Uso: node scripts/leer_plantilla.js [nombreHoja]
const XLSX = require("xlsx");
const path = require("path");

const file = path.join(__dirname, "..", "Plantilla_Polla_Mundial_2026_OPERATIVA (1).xlsx");
const wb = XLSX.readFile(file);

const sheetArg = process.argv[2];

if (!sheetArg) {
  console.log("HOJAS:");
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const ref = ws["!ref"] || "(vacía)";
    console.log(`- ${name}  [${ref}]`);
  }
} else {
  const ws = wb.Sheets[sheetArg];
  if (!ws) {
    console.error("No existe la hoja: " + sheetArg);
    process.exit(1);
  }
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const max = Math.min(rows.length, Number(process.argv[3] || 60));
  for (let i = 0; i < max; i++) {
    // recorta filas muy largas
    const r = rows[i].map((c) => String(c).slice(0, 30));
    console.log(i + 1 + "\t" + JSON.stringify(r));
  }
  console.log(`(total filas: ${rows.length})`);
}

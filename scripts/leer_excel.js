// Lee cualquier Excel y vuelca hojas + filas. Uso: node scripts/leer_excel.js "archivo.xlsx" [Hoja] [maxFilas]
const XLSX = require("xlsx");
const wb = XLSX.readFile(process.argv[2]);
const sheet = process.argv[3];
const max = Number(process.argv[4] || 50);
if (!sheet) {
  console.log("HOJAS:");
  for (const n of wb.SheetNames) console.log(`- ${n}  [${wb.Sheets[n]["!ref"] || "vacía"}]`);
} else {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "", raw: false });
  for (let i = 0; i < Math.min(rows.length, max); i++) {
    console.log(i + 1 + "\t" + JSON.stringify(rows[i].map((c) => String(c).slice(0, 45))));
  }
  console.log(`(total filas: ${rows.length})`);
}

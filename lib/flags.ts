// Mapa de nombre de selección -> código ISO de país (alpha-2).
// Los partidos guardan el equipo como texto libre ('Chile', 'Brazil',
// 'Ganador Grupo A'...), por eso mapeamos por nombre y aceptamos español/inglés.
// El código se usa para mostrar la bandera como IMAGEN (ver components/Flag.tsx),
// que se ve igual en Windows, Mac, Android e iPhone (a diferencia del emoji de
// bandera, que en Windows aparece como dos letras).
// Si no hay match (etiquetas tipo 'Ganador Grupo A'), devuelve null -> ⚽.

const ISO: Record<string, string> = {
  mexico: "mx",
  "south africa": "za", sudafrica: "za",
  "south korea": "kr", "corea del sur": "kr",
  czechia: "cz", chequia: "cz", "republica checa": "cz",
  canada: "ca",
  "bosnia and herzegovina": "ba", "bosnia y herzegovina": "ba", bosnia: "ba",
  qatar: "qa", catar: "qa",
  switzerland: "ch", suiza: "ch",
  brazil: "br", brasil: "br",
  morocco: "ma", marruecos: "ma",
  haiti: "ht",
  scotland: "gb-sct", escocia: "gb-sct",
  "united states": "us", "estados unidos": "us", usa: "us", eeuu: "us",
  paraguay: "py",
  australia: "au",
  turkiye: "tr", turquia: "tr", turkey: "tr",
  germany: "de", alemania: "de",
  curacao: "cw",
  "ivory coast": "ci", "costa de marfil": "ci",
  ecuador: "ec",
  netherlands: "nl", "paises bajos": "nl", holanda: "nl",
  japan: "jp", japon: "jp",
  sweden: "se", suecia: "se",
  tunisia: "tn", tunez: "tn",
  belgium: "be", belgica: "be",
  egypt: "eg", egipto: "eg",
  iran: "ir",
  "new zealand": "nz", "nueva zelanda": "nz", "nueva zelandia": "nz",
  spain: "es", espana: "es",
  "cape verde": "cv", "cabo verde": "cv",
  "saudi arabia": "sa", "arabia saudita": "sa", arabia: "sa",
  uruguay: "uy",
  france: "fr", francia: "fr",
  senegal: "sn",
  iraq: "iq", irak: "iq",
  norway: "no", noruega: "no",
  argentina: "ar",
  algeria: "dz", argelia: "dz",
  austria: "at",
  jordan: "jo", jordania: "jo",
  portugal: "pt",
  "dr congo": "cd", "rd congo": "cd", congo: "cd", "republica democratica del congo": "cd",
  uzbekistan: "uz",
  colombia: "co",
  england: "gb-eng", inglaterra: "gb-eng",
  croatia: "hr", croacia: "hr",
  ghana: "gh",
  panama: "pa",
  // por si aparecen en finalistas u otros bonos
  chile: "cl", honduras: "hn", jamaica: "jm",
};

/** Normaliza un nombre de equipo (sin acentos, minúsculas). */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Código ISO (alpha-2 o subdivisión tipo gb-sct) del equipo, o null si no se reconoce. */
export function flagIso(team: string): string | null {
  return ISO[normalizeName(team)] ?? null;
}

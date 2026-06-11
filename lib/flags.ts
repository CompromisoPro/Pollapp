// Mapa de nombre de selección -> bandera emoji.
// Los partidos guardan el equipo como texto libre ('Chile', 'Brazil', 'Ganador
// Grupo A'...), por eso mapeamos por nombre y aceptamos español e inglés.
// Si no hay match (etiquetas tipo 'Ganador Grupo A'), cae al balón ⚽.

const FLAGS: Record<string, string> = {
  // Grupo de las 48 selecciones del Mundial 2026 (ES + EN).
  mexico: "🇲🇽",
  "south africa": "🇿🇦",
  sudafrica: "🇿🇦",
  "south korea": "🇰🇷",
  "corea del sur": "🇰🇷",
  czechia: "🇨🇿",
  chequia: "🇨🇿",
  "republica checa": "🇨🇿",
  canada: "🇨🇦",
  "bosnia and herzegovina": "🇧🇦",
  "bosnia y herzegovina": "🇧🇦",
  bosnia: "🇧🇦",
  qatar: "🇶🇦",
  catar: "🇶🇦",
  switzerland: "🇨🇭",
  suiza: "🇨🇭",
  brazil: "🇧🇷",
  brasil: "🇧🇷",
  morocco: "🇲🇦",
  marruecos: "🇲🇦",
  haiti: "🇭🇹",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  escocia: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "united states": "🇺🇸",
  "estados unidos": "🇺🇸",
  usa: "🇺🇸",
  eeuu: "🇺🇸",
  paraguay: "🇵🇾",
  australia: "🇦🇺",
  turkiye: "🇹🇷",
  turquia: "🇹🇷",
  turkey: "🇹🇷",
  germany: "🇩🇪",
  alemania: "🇩🇪",
  curacao: "🇨🇼",
  "ivory coast": "🇨🇮",
  "costa de marfil": "🇨🇮",
  ecuador: "🇪🇨",
  netherlands: "🇳🇱",
  "paises bajos": "🇳🇱",
  holanda: "🇳🇱",
  japan: "🇯🇵",
  japon: "🇯🇵",
  sweden: "🇸🇪",
  suecia: "🇸🇪",
  tunisia: "🇹🇳",
  tunez: "🇹🇳",
  belgium: "🇧🇪",
  belgica: "🇧🇪",
  egypt: "🇪🇬",
  egipto: "🇪🇬",
  iran: "🇮🇷",
  "new zealand": "🇳🇿",
  "nueva zelanda": "🇳🇿",
  spain: "🇪🇸",
  espana: "🇪🇸",
  "cape verde": "🇨🇻",
  "cabo verde": "🇨🇻",
  "saudi arabia": "🇸🇦",
  "arabia saudita": "🇸🇦",
  uruguay: "🇺🇾",
  france: "🇫🇷",
  francia: "🇫🇷",
  senegal: "🇸🇳",
  iraq: "🇮🇶",
  irak: "🇮🇶",
  norway: "🇳🇴",
  noruega: "🇳🇴",
  argentina: "🇦🇷",
  algeria: "🇩🇿",
  argelia: "🇩🇿",
  austria: "🇦🇹",
  jordan: "🇯🇴",
  jordania: "🇯🇴",
  portugal: "🇵🇹",
  "dr congo": "🇨🇩",
  "rd congo": "🇨🇩",
  "republica democratica del congo": "🇨🇩",
  uzbekistan: "🇺🇿",
  colombia: "🇨🇴",
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  inglaterra: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  croatia: "🇭🇷",
  croacia: "🇭🇷",
  ghana: "🇬🇭",
  panama: "🇵🇦",
  chile: "🇨🇱",
  // Repechajes / otras posibles
  italy: "🇮🇹",
  italia: "🇮🇹",
  nigeria: "🇳🇬",
  cameroon: "🇨🇲",
  camerun: "🇨🇲",
  peru: "🇵🇪",
  bolivia: "🇧🇴",
  venezuela: "🇻🇪",
  "costa rica": "🇨🇷",
  honduras: "🇭🇳",
  jamaica: "🇯🇲",
};

/** Normaliza un nombre de equipo para buscar en el mapa (sin acentos, minúsculas). */
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // quita acentos (rango de diacríticos)
}

/** Bandera emoji de un equipo, o ⚽ si no se reconoce (etiquetas de cruce, etc.). */
export function flagFor(team: string): string {
  return FLAGS[normalizeName(team)] ?? "⚽";
}

/** Bandera + nombre listo para mostrar, ej. "🇨🇱 Chile". */
export function teamWithFlag(team: string): string {
  return `${flagFor(team)} ${team}`;
}

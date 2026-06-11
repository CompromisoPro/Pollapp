// Motor de tablas de grupos del Mundial. Calcula posiciones desde los
// resultados oficiales y aplica los desempates de FIFA.

export interface MatchResult {
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
}

export interface Standing {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface RankedStanding extends Standing {
  rank: number;
  qualifies: boolean; // top 2 del grupo
}

/** Estadísticas de un equipo dentro de un conjunto de partidos finalizados. */
function statsFor(team: string, matches: MatchResult[]): Standing {
  const s: Standing = {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  };
  for (const m of matches) {
    let forGoals: number, againstGoals: number;
    if (m.home_team === team) {
      forGoals = m.home_score;
      againstGoals = m.away_score;
    } else if (m.away_team === team) {
      forGoals = m.away_score;
      againstGoals = m.home_score;
    } else {
      continue;
    }
    s.played++;
    s.gf += forGoals;
    s.ga += againstGoals;
    if (forGoals > againstGoals) {
      s.won++;
      s.points += 3;
    } else if (forGoals === againstGoals) {
      s.drawn++;
      s.points += 1;
    } else {
      s.lost++;
    }
  }
  s.gd = s.gf - s.ga;
  return s;
}

/** Orden general: puntos, diferencia de gol, goles a favor. */
function compareOverall(a: Standing, b: Standing): number {
  return b.points - a.points || b.gd - a.gd || b.gf - a.gf;
}

/**
 * Calcula la tabla de un grupo. `teamNames` son las 4 selecciones del grupo
 * (para mostrarlas aunque no hayan jugado). `matches` son SOLO los partidos
 * finalizados del grupo.
 *
 * Desempates FIFA aplicados: 1) puntos, 2) dif. de gol, 3) goles a favor,
 * 4) entre los empatados: puntos, dif. y goles en sus enfrentamientos directos.
 * (El fair play y el sorteo no se calculan; ante un empate total se ordena
 * alfabéticamente — el admin puede definir el clasificado en el bono.)
 */
export function computeStandings(
  teamNames: string[],
  matches: MatchResult[]
): RankedStanding[] {
  const table = teamNames.map((t) => statsFor(t, matches));
  table.sort(compareOverall);

  // Resolver empates (mismos puntos/dif/goles) por enfrentamiento directo.
  const resolved: Standing[] = [];
  let i = 0;
  while (i < table.length) {
    let j = i + 1;
    while (
      j < table.length &&
      table[j].points === table[i].points &&
      table[j].gd === table[i].gd &&
      table[j].gf === table[i].gf
    ) {
      j++;
    }
    const tiedGroup = table.slice(i, j);
    if (tiedGroup.length > 1) {
      const tiedNames = new Set(tiedGroup.map((t) => t.team));
      // Mini-liga solo con los partidos entre los empatados.
      const h2hMatches = matches.filter(
        (m) => tiedNames.has(m.home_team) && tiedNames.has(m.away_team)
      );
      const h2h = new Map(
        tiedGroup.map((t) => [t.team, statsFor(t.team, h2hMatches)])
      );
      tiedGroup.sort((a, b) => {
        const ha = h2h.get(a.team)!;
        const hb = h2h.get(b.team)!;
        return compareOverall(ha, hb) || a.team.localeCompare(b.team);
      });
    }
    resolved.push(...tiedGroup);
    i = j;
  }

  return resolved.map((s, idx) => ({
    ...s,
    rank: idx + 1,
    qualifies: idx < 2,
  }));
}

// Tipos que reflejan las tablas de la base de datos.

export type Phase =
  | "grupos"
  | "dieciseisavos"
  | "octavos"
  | "cuartos"
  | "semis"
  | "tercer"
  | "final";

export type MatchStatus = "oculto" | "abierto" | "finalizado";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  paid: boolean;
  is_admin: boolean;
  points_total: number;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  group_label: string | null;
}

export interface Match {
  id: number;
  phase: Phase;
  group_label: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  lock_at: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  created_at: string;
}

export interface Prediction {
  id: number;
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points: number | null;
  created_at: string;
  updated_at: string;
}

export interface BonusQuestion {
  id: string;
  phase: string;
  kind: "number" | "team" | "player" | "finalists" | "qualifiers";
  title: string;
  description: string | null;
  group_label: string | null;
  max_points: number;
  deadline: string;
  official_answer: unknown;
  sort: number;
  /** oculto = los jugadores no lo ven; abierto = visible (cierra por deadline) */
  status: "oculto" | "abierto";
}

export interface BonusAnswer {
  id: number;
  user_id: string;
  question_id: string;
  answer: unknown;
  points: number | null;
  created_at: string;
  updated_at: string;
}

/** Un partido con el pronóstico del usuario actual (si existe). */
export interface MatchWithPrediction extends Match {
  prediction: Prediction | null;
}

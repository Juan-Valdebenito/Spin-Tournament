export type TournamentStatus = "draft" | "in_progress" | "completed";

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  created_at: string;
}

export interface Participant {
  id: string;
  tournament_id: string;
  name: string;
  seed: number | null;
  created_at: string;
}

export interface MatchRow {
  id: string;
  tournament_id: string;
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
  score1: number | null;
  score2: number | null;
  winner_id: string | null;
  next_match_id: string | null;
  next_match_slot: number | null;
}

export interface MatchPlayer {
  id: string;
  name: string;
}

export interface MatchDisplay {
  id: string;
  round: number;
  position: number;
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  isBye: boolean;
}

export interface RoundDisplay {
  round: number;
  name: string;
  matches: MatchDisplay[];
}

export interface TournamentDetail {
  tournament: Tournament;
  participants: Participant[];
  rounds: RoundDisplay[];
  champion: MatchPlayer | null;
}

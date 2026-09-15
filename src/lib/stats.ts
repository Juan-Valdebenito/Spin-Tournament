import { getDb, ensureSchema } from "./db";
import type { Tournament } from "./types";

async function db() {
  await ensureSchema();
  return getDb();
}

export interface DashboardStats {
  activeTournaments: number;
  completedTournaments: number;
  totalPlayers: number;
  matchesPlayed: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const conn = await db();
  const [statusRes, playersRes, matchesRes] = await Promise.all([
    conn.execute(
      "SELECT status, COUNT(*) as count FROM tournaments GROUP BY status"
    ),
    conn.execute("SELECT COUNT(DISTINCT name) as count FROM participants"),
    conn.execute(
      `SELECT COUNT(*) as count FROM matches
       WHERE winner_id IS NOT NULL AND participant1_id IS NOT NULL AND participant2_id IS NOT NULL`
    ),
  ]);

  let activeTournaments = 0;
  let completedTournaments = 0;
  for (const row of statusRes.rows) {
    if (row.status === "in_progress") activeTournaments = Number(row.count);
    if (row.status === "completed") completedTournaments = Number(row.count);
  }

  return {
    activeTournaments,
    completedTournaments,
    totalPlayers: Number(playersRes.rows[0]?.count ?? 0),
    matchesPlayed: Number(matchesRes.rows[0]?.count ?? 0),
  };
}

export async function listRecentTournaments(limit = 5): Promise<Tournament[]> {
  const conn = await db();
  const res = await conn.execute({
    sql: "SELECT * FROM tournaments ORDER BY created_at DESC LIMIT ?",
    args: [limit],
  });
  return res.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    status: row.status as Tournament["status"],
    created_at: row.created_at as string,
  }));
}

export interface PlayerSummary {
  name: string;
  tournaments: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
}

export async function listPlayers(): Promise<PlayerSummary[]> {
  const conn = await db();
  const res = await conn.execute(`
    SELECT p.name AS name,
           COUNT(DISTINCT p.tournament_id) AS tournaments,
           COUNT(m.id) AS matches_played,
           SUM(CASE WHEN m.winner_id = p.id THEN 1 ELSE 0 END) AS wins
    FROM participants p
    LEFT JOIN matches m
      ON (m.participant1_id = p.id OR m.participant2_id = p.id)
      AND m.winner_id IS NOT NULL
      AND m.participant1_id IS NOT NULL
      AND m.participant2_id IS NOT NULL
    GROUP BY p.name
    ORDER BY p.name COLLATE NOCASE ASC
  `);

  return res.rows.map((row) => {
    const matchesPlayed = Number(row.matches_played ?? 0);
    const wins = Number(row.wins ?? 0);
    const losses = matchesPlayed - wins;
    return {
      name: row.name as string,
      tournaments: Number(row.tournaments ?? 0),
      matchesPlayed,
      wins,
      losses,
      winRate: matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0,
    };
  });
}

export interface PlayerMatch {
  tournamentId: string;
  tournamentName: string;
  tournamentDate: string;
  opponentName: string;
  ownScore: number;
  opponentScore: number;
  won: boolean;
}

export interface PlayerDetail {
  summary: PlayerSummary;
  matches: PlayerMatch[];
}

export async function getPlayerDetail(name: string): Promise<PlayerDetail | null> {
  const players = await listPlayers();
  const summary = players.find((p) => p.name.toLowerCase() === name.toLowerCase());
  if (!summary) return null;

  const conn = await db();
  const res = await conn.execute({
    sql: `
      SELECT m.score1, m.score2, m.winner_id,
             t.id AS tournament_id, t.name AS tournament_name, t.created_at AS tournament_date,
             p1.id AS p1_id, p1.name AS p1_name, p2.id AS p2_id, p2.name AS p2_name
      FROM matches m
      JOIN tournaments t ON t.id = m.tournament_id
      JOIN participants p1 ON p1.id = m.participant1_id
      JOIN participants p2 ON p2.id = m.participant2_id
      WHERE m.winner_id IS NOT NULL AND (p1.name = ? COLLATE NOCASE OR p2.name = ? COLLATE NOCASE)
      ORDER BY t.created_at DESC
    `,
    args: [summary.name, summary.name],
  });

  const matches: PlayerMatch[] = res.rows.map((row) => {
    const isP1 = (row.p1_name as string).toLowerCase() === summary.name.toLowerCase();
    const ownScore = Number(isP1 ? row.score1 : row.score2);
    const opponentScore = Number(isP1 ? row.score2 : row.score1);
    return {
      tournamentId: row.tournament_id as string,
      tournamentName: row.tournament_name as string,
      tournamentDate: row.tournament_date as string,
      opponentName: (isP1 ? row.p2_name : row.p1_name) as string,
      ownScore,
      opponentScore,
      won: row.winner_id === (isP1 ? row.p1_id : row.p2_id),
    };
  });

  return { summary, matches };
}

export interface SearchResults {
  tournaments: Tournament[];
  players: string[];
}

export async function searchAll(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { tournaments: [], players: [] };

  const conn = await db();
  const like = `%${q}%`;
  const [tRes, pRes] = await Promise.all([
    conn.execute({
      sql: "SELECT * FROM tournaments WHERE name LIKE ? COLLATE NOCASE ORDER BY created_at DESC LIMIT 15",
      args: [like],
    }),
    conn.execute({
      sql: "SELECT DISTINCT name FROM participants WHERE name LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE LIMIT 15",
      args: [like],
    }),
  ]);

  return {
    tournaments: tRes.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      status: row.status as Tournament["status"],
      created_at: row.created_at as string,
    })),
    players: pRes.rows.map((row) => row.name as string),
  };
}

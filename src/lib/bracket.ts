import { randomUUID } from "crypto";
import type { Client, InStatement, ResultSet, Row } from "@libsql/client";
import { getDb, ensureSchema } from "./db";
import type {
  MatchDisplay,
  MatchRow,
  Participant,
  RoundDisplay,
  Tournament,
  TournamentDetail,
} from "./types";

/** Anything that can run a single SQL statement — a plain connection or an
 * open interactive transaction. Lets the row-mapping helpers below work
 * with either. */
type Exec = { execute(stmt: InStatement): Promise<ResultSet> };

async function db(): Promise<Client> {
  await ensureSchema();
  return getDb();
}

function toTournament(row: Row): Tournament {
  return {
    id: row.id as string,
    name: row.name as string,
    status: row.status as Tournament["status"],
    created_at: row.created_at as string,
  };
}

function toParticipant(row: Row): Participant {
  return {
    id: row.id as string,
    tournament_id: row.tournament_id as string,
    name: row.name as string,
    seed: (row.seed as number | null) ?? null,
    created_at: row.created_at as string,
  };
}

function toMatchRow(row: Row): MatchRow {
  return {
    id: row.id as string,
    tournament_id: row.tournament_id as string,
    round: Number(row.round),
    position: Number(row.position),
    participant1_id: (row.participant1_id as string | null) ?? null,
    participant2_id: (row.participant2_id as string | null) ?? null,
    score1: row.score1 === null ? null : Number(row.score1),
    score2: row.score2 === null ? null : Number(row.score2),
    winner_id: (row.winner_id as string | null) ?? null,
    next_match_id: (row.next_match_id as string | null) ?? null,
    next_match_slot: row.next_match_slot === null ? null : Number(row.next_match_slot),
  };
}

function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return size;
}

/**
 * Classic bracket seeding order (1, n, n/2+1, ...) so that byes and strong
 * seeds are spread evenly across the draw instead of stacked on one side.
 */
function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const n = order.length * 2;
    const mirrored = order.map((x) => n + 1 - x);
    const next: number[] = [];
    for (let i = 0; i < order.length; i++) {
      next.push(order[i], mirrored[i]);
    }
    order = next;
  }
  return order;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function roundName(matchCount: number): string {
  switch (matchCount) {
    case 1:
      return "Final";
    case 2:
      return "Semifinales";
    case 4:
      return "Cuartos de Final";
    case 8:
      return "Octavos de Final";
    default:
      return `Ronda de ${matchCount * 2}`;
  }
}

export async function listTournaments(): Promise<Tournament[]> {
  const conn = await db();
  const res = await conn.execute("SELECT * FROM tournaments ORDER BY created_at DESC");
  return res.rows.map(toTournament);
}

export async function createTournament(
  name: string,
  participantNames: string[]
): Promise<Tournament> {
  const cleanNames = participantNames.map((n) => n.trim()).filter(Boolean);
  if (!name.trim()) throw new Error("El torneo necesita un nombre");
  if (cleanNames.length < 2) throw new Error("Se necesitan al menos 2 participantes");

  const conn = await db();
  const id = randomUUID();
  const now = new Date().toISOString();

  const statements: InStatement[] = [
    {
      sql: "INSERT INTO tournaments (id, name, status, created_at) VALUES (?, ?, 'draft', ?)",
      args: [id, name.trim(), now],
    },
    ...cleanNames.map(
      (n, i): InStatement => ({
        sql: "INSERT INTO participants (id, tournament_id, name, seed, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [randomUUID(), id, n, i, now],
      })
    ),
  ];
  await conn.batch(statements, "write");

  const res = await conn.execute({ sql: "SELECT * FROM tournaments WHERE id = ?", args: [id] });
  return toTournament(res.rows[0]);
}

export async function replaceParticipants(tournamentId: string, names: string[]): Promise<void> {
  const conn = await db();
  const tRes = await conn.execute({
    sql: "SELECT * FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tournament = tRes.rows[0] ? toTournament(tRes.rows[0]) : undefined;
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "draft") {
    throw new Error("Solo se puede editar participantes antes de iniciar el torneo");
  }

  const cleanNames = names.map((n) => n.trim()).filter(Boolean);
  if (cleanNames.length < 2) throw new Error("Se necesitan al menos 2 participantes");

  const now = new Date().toISOString();
  const statements: InStatement[] = [
    { sql: "DELETE FROM participants WHERE tournament_id = ?", args: [tournamentId] },
    ...cleanNames.map(
      (n, i): InStatement => ({
        sql: "INSERT INTO participants (id, tournament_id, name, seed, created_at) VALUES (?, ?, ?, ?, ?)",
        args: [randomUUID(), tournamentId, n, i, now],
      })
    ),
  ];
  await conn.batch(statements, "write");
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  const conn = await db();
  await conn.batch(
    [
      { sql: "DELETE FROM matches WHERE tournament_id = ?", args: [tournamentId] },
      { sql: "DELETE FROM participants WHERE tournament_id = ?", args: [tournamentId] },
      { sql: "DELETE FROM tournaments WHERE id = ?", args: [tournamentId] },
    ],
    "write"
  );
}

interface DraftMatch {
  id: string;
  round: number;
  position: number;
  participant1_id: string | null;
  participant2_id: string | null;
  winner_id: string | null;
  next_match_id: string | null;
  next_match_slot: number | null;
}

/**
 * Byes only ever occur in round 0: an uneven number of participants can
 * leave a single real player alone in a first-round match. Every later
 * round always has two real feeder matches, so it is built entirely in
 * memory here and only ever written once, atomically.
 */
export async function startTournament(tournamentId: string): Promise<void> {
  const conn = await db();
  const tRes = await conn.execute({
    sql: "SELECT * FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  const tournament = tRes.rows[0] ? toTournament(tRes.rows[0]) : undefined;
  if (!tournament) throw new Error("Torneo no encontrado");
  if (tournament.status !== "draft") throw new Error("El torneo ya fue iniciado");

  const pRes = await conn.execute({
    sql: "SELECT * FROM participants WHERE tournament_id = ? ORDER BY seed ASC",
    args: [tournamentId],
  });
  const participants = pRes.rows.map(toParticipant);
  if (participants.length < 2) throw new Error("Se necesitan al menos 2 participantes");

  const size = nextPowerOfTwo(participants.length);
  const order = seedOrder(size);
  const shuffled = shuffle(participants);
  const slots: (Participant | null)[] = order.map((seedPos) =>
    seedPos <= shuffled.length ? shuffled[seedPos - 1] : null
  );

  const totalRounds = Math.log2(size);
  const rounds: DraftMatch[][] = [];

  for (let r = 0; r < totalRounds; r++) {
    const matchesInRound = size / Math.pow(2, r + 1);
    const round: DraftMatch[] = [];
    for (let p = 0; p < matchesInRound; p++) {
      if (r === 0) {
        const p1 = slots[p * 2];
        const p2 = slots[p * 2 + 1];
        const winnerId = p1 && !p2 ? p1.id : p2 && !p1 ? p2.id : null;
        round.push({
          id: randomUUID(),
          round: r,
          position: p,
          participant1_id: p1?.id ?? null,
          participant2_id: p2?.id ?? null,
          winner_id: winnerId,
          next_match_id: null,
          next_match_slot: null,
        });
      } else {
        round.push({
          id: randomUUID(),
          round: r,
          position: p,
          participant1_id: null,
          participant2_id: null,
          winner_id: null,
          next_match_id: null,
          next_match_slot: null,
        });
      }
    }
    rounds.push(round);
  }

  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].forEach((match, p) => {
      const nextMatch = rounds[r + 1][Math.floor(p / 2)];
      const slot = p % 2 === 0 ? 1 : 2;
      match.next_match_id = nextMatch.id;
      match.next_match_slot = slot;
      if (match.winner_id) {
        if (slot === 1) nextMatch.participant1_id = match.winner_id;
        else nextMatch.participant2_id = match.winner_id;
      }
    });
  }

  const insertStatements: InStatement[] = rounds.flat().map((m) => ({
    sql: `INSERT INTO matches (id, tournament_id, round, position, participant1_id, participant2_id, score1, score2, winner_id, next_match_id, next_match_slot)
          VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
    args: [
      m.id,
      tournamentId,
      m.round,
      m.position,
      m.participant1_id,
      m.participant2_id,
      m.winner_id,
      m.next_match_id,
      m.next_match_slot,
    ],
  }));

  await conn.batch(
    [
      ...insertStatements,
      {
        sql: "UPDATE tournaments SET status = 'in_progress' WHERE id = ?",
        args: [tournamentId],
      },
    ],
    "write"
  );
}

async function resetDownstream(exec: Exec, match: MatchRow): Promise<void> {
  if (!match.winner_id || !match.next_match_id || !match.next_match_slot) return;

  const res = await exec.execute({
    sql: "SELECT * FROM matches WHERE id = ?",
    args: [match.next_match_id],
  });
  const nextMatch = res.rows[0] ? toMatchRow(res.rows[0]) : undefined;
  if (!nextMatch) return;

  const slotColumn = match.next_match_slot === 1 ? "participant1_id" : "participant2_id";

  if (nextMatch.winner_id) {
    await resetDownstream(exec, nextMatch);
    await exec.execute({
      sql: "UPDATE matches SET winner_id = NULL, score1 = NULL, score2 = NULL WHERE id = ?",
      args: [nextMatch.id],
    });
    if (!nextMatch.next_match_id) {
      // The match we just invalidated was the final: the tournament no
      // longer has a champion until it is replayed and resubmitted.
      await exec.execute({
        sql: "UPDATE tournaments SET status = 'in_progress' WHERE id = ?",
        args: [nextMatch.tournament_id],
      });
    }
  }

  await exec.execute({
    sql: `UPDATE matches SET ${slotColumn} = NULL WHERE id = ?`,
    args: [nextMatch.id],
  });
}

export async function submitMatchResult(
  matchId: string,
  score1: number,
  score2: number
): Promise<void> {
  if (!Number.isInteger(score1) || !Number.isInteger(score2)) {
    throw new Error("Los puntajes deben ser numeros enteros");
  }
  if (score1 < 0 || score2 < 0) throw new Error("Los puntajes no pueden ser negativos");
  if (score1 === score2) throw new Error("No se permiten empates, debe haber un ganador");

  const conn = await db();
  const mRes = await conn.execute({ sql: "SELECT * FROM matches WHERE id = ?", args: [matchId] });
  const match = mRes.rows[0] ? toMatchRow(mRes.rows[0]) : undefined;
  if (!match) throw new Error("Partido no encontrado");
  if (!match.participant1_id || !match.participant2_id) {
    throw new Error("El partido todavia no tiene los dos participantes definidos");
  }

  const winnerId = score1 > score2 ? match.participant1_id : match.participant2_id;

  const tx = await conn.transaction("write");
  try {
    await resetDownstream(tx, match);
    await tx.execute({
      sql: "UPDATE matches SET score1 = ?, score2 = ?, winner_id = ? WHERE id = ?",
      args: [score1, score2, winnerId, matchId],
    });

    if (match.next_match_id && match.next_match_slot) {
      const slotColumn = match.next_match_slot === 1 ? "participant1_id" : "participant2_id";
      await tx.execute({
        sql: `UPDATE matches SET ${slotColumn} = ? WHERE id = ?`,
        args: [winnerId, match.next_match_id],
      });
    } else {
      await tx.execute({
        sql: "UPDATE tournaments SET status = 'completed' WHERE id = ?",
        args: [match.tournament_id],
      });
    }
    await tx.commit();
  } finally {
    tx.close();
  }
}

export async function getTournamentDetail(tournamentId: string): Promise<TournamentDetail | null> {
  const conn = await db();
  const tRes = await conn.execute({
    sql: "SELECT * FROM tournaments WHERE id = ?",
    args: [tournamentId],
  });
  if (!tRes.rows[0]) return null;
  const tournament = toTournament(tRes.rows[0]);

  const [pRes, mRes] = await Promise.all([
    conn.execute({
      sql: "SELECT * FROM participants WHERE tournament_id = ? ORDER BY seed ASC",
      args: [tournamentId],
    }),
    conn.execute({
      sql: "SELECT * FROM matches WHERE tournament_id = ? ORDER BY round ASC, position ASC",
      args: [tournamentId],
    }),
  ]);

  const participants = pRes.rows.map(toParticipant);
  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const matchRows = mRes.rows.map(toMatchRow);

  const byRound = new Map<number, MatchRow[]>();
  for (const m of matchRows) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }

  const rounds: RoundDisplay[] = [...byRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, matches]) => ({
      round,
      name: roundName(matches.length),
      matches: matches.map((m): MatchDisplay => {
        const p1 = m.participant1_id ? participantMap.get(m.participant1_id) ?? null : null;
        const p2 = m.participant2_id ? participantMap.get(m.participant2_id) ?? null : null;
        return {
          id: m.id,
          round: m.round,
          position: m.position,
          player1: p1 ? { id: p1.id, name: p1.name } : null,
          player2: p2 ? { id: p2.id, name: p2.name } : null,
          score1: m.score1,
          score2: m.score2,
          winnerId: m.winner_id,
          isBye: !!m.winner_id && (!m.participant1_id || !m.participant2_id),
        };
      }),
    }));

  let champion: TournamentDetail["champion"] = null;
  if (tournament.status === "completed" && rounds.length > 0) {
    const finalMatch = rounds[rounds.length - 1].matches[0];
    const championPlayer =
      finalMatch?.winnerId === finalMatch?.player1?.id ? finalMatch?.player1 : finalMatch?.player2;
    champion = championPlayer ?? null;
  }

  return { tournament, participants, rounds, champion };
}

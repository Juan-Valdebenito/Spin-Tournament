import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

function resolveLocalFileUrl(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "tournament.db")}`;
}

declare global {
  var __spinTournamentDb: Client | undefined;
  var __spinTournamentDbReady: Promise<void> | undefined;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    name TEXT NOT NULL,
    seed INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    position INTEGER NOT NULL,
    participant1_id TEXT,
    participant2_id TEXT,
    score1 INTEGER,
    score2 INTEGER,
    winner_id TEXT,
    next_match_id TEXT,
    next_match_slot INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_participants_tournament ON participants(tournament_id);
  CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
`;

function createConnection(): Client {
  const client = createClient(
    TURSO_URL
      ? { url: TURSO_URL, authToken: TURSO_AUTH_TOKEN }
      : { url: resolveLocalFileUrl() }
  );
  return client;
}

export function getDb(): Client {
  if (!global.__spinTournamentDb) {
    global.__spinTournamentDb = createConnection();
  }
  return global.__spinTournamentDb;
}

export function ensureSchema(): Promise<void> {
  if (!global.__spinTournamentDbReady) {
    global.__spinTournamentDbReady = getDb().executeMultiple(SCHEMA);
  }
  return global.__spinTournamentDbReady;
}

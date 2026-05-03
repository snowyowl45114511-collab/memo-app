import { createClient, type Client, type Row } from "@libsql/client";
import { TAGS, type TagDef } from "./tags";

let _client: Client | null = null;
let _initPromise: Promise<void> | null = null;

function createDbClient(): Client {
  return createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:./memos.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

async function runMigrations(client: Client): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      tag TEXT NOT NULL DEFAULT 'idea',
      ai_comment TEXT,
      feedback TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL,
      bg TEXT NOT NULL,
      activeBg TEXT NOT NULL,
      badgeCls TEXT NOT NULL,
      description TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0
    )
  `);

  // 既存DBへのマイグレーション
  for (const sql of [
    "ALTER TABLE memos ADD COLUMN feedback TEXT",
    "ALTER TABLE memos ADD COLUMN completed INTEGER NOT NULL DEFAULT 0",
  ]) {
    try { await client.execute(sql); } catch { /* already exists */ }
  }

  // デフォルトタグのシード（初回のみ）
  const { rows } = await client.execute("SELECT COUNT(*) as n FROM tags");
  if (Number(rows[0][0]) === 0) {
    for (const [i, t] of TAGS.entries()) {
      await client.execute({
        sql: "INSERT INTO tags (id, label, emoji, color, bg, activeBg, badgeCls, description, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        args: [t.id, t.label, t.emoji, t.color, t.bg, t.activeBg, t.badgeCls, t.description, i],
      });
    }
  }
}

export async function getDb(): Promise<Client> {
  if (!_client) _client = createDbClient();
  if (!_initPromise) _initPromise = runMigrations(_client);
  await _initPromise;
  return _client;
}

export function rowToMemo(row: Row): Memo {
  return {
    id: Number(row.id),
    content: String(row.content),
    tag: String(row.tag),
    ai_comment: row.ai_comment != null ? String(row.ai_comment) : null,
    feedback: row.feedback != null ? String(row.feedback) : null,
    completed: Number(row.completed),
    created_at: String(row.created_at),
  };
}

export function rowToTagDef(row: Row): TagDef {
  return {
    id: String(row.id),
    label: String(row.label),
    emoji: String(row.emoji),
    color: String(row.color),
    bg: String(row.bg),
    activeBg: String(row.activeBg),
    badgeCls: String(row.badgeCls),
    description: String(row.description),
  };
}

export interface Memo {
  id: number;
  content: string;
  tag: string;
  ai_comment: string | null;
  feedback: string | null;
  completed: number;
  created_at: string;
}

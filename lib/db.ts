import { createClient, Client } from "@libsql/client";

let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;
  
  const url = process.env.TURSO_DATABASE_URL || "file:./data/codex.db";
  
  _db = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return _db;
}

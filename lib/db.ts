import { createClient, Client } from "@libsql/client";

let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;
  
  let url = process.env.TURSO_DATABASE_URL || "file:./data/codex.db";
  
  // Force HTTPS instead of WebSockets to prevent Vercel connection hanging
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }
  
  _db = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return _db;
}

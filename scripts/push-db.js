const Database = require('better-sqlite3');
const { createClient } = require('@libsql/client');

// Manually load the tokens from .env.local without needing dotenv package
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const tursoUrlRaw = env.match(/TURSO_DATABASE_URL="?([^"\n\r]+)"?/)?.[1];
const tursoToken = env.match(/TURSO_AUTH_TOKEN="?([^"\n\r]+)"?/)?.[1];

if (!tursoUrlRaw || !tursoToken) {
  console.error("Could not find Turso credentials in .env.local");
  process.exit(1);
}

const tursoUrl = tursoUrlRaw.replace('libsql://', 'https://');
console.log("Connecting to:", tursoUrl);

async function push() {
  console.log("Connecting to local database...");
  const localDb = new Database('data/codex.db');
  
  console.log("Connecting to Turso database...");
  const remoteDb = createClient({
    url: tursoUrl,
    authToken: tursoToken
  });

  const tables = localDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  
  for (const table of tables) {
    if (table.name === 'sqlite_sequence') continue;
    
    const schemaRow = localDb.prepare(`SELECT sql FROM sqlite_master WHERE name='${table.name}'`).get();
    if (!schemaRow || !schemaRow.sql) continue;
    
    console.log(`\nCreating table: ${table.name}...`);
    try {
      await remoteDb.execute(schemaRow.sql);
    } catch (e) {
      if (!e.message.includes("already exists")) {
        console.error("Error creating table:", e.message);
      }
    }
    
    const rows = localDb.prepare(`SELECT * FROM ${table.name}`).all();
    if (rows.length === 0) {
      console.log(`No data in ${table.name}, skipping insert.`);
      continue;
    }
    
    console.log(`Uploading ${rows.length} rows to ${table.name}...`);
    
    // Upload rows in a single batch to avoid network spam and 400 errors
    const batchStmts = rows.map(row => {
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = columns.map(() => '?').join(',');
      return {
        sql: `INSERT OR IGNORE INTO ${table.name} (${columns.join(',')}) VALUES (${placeholders})`,
        args: values
      };
    });
    
    try {
      await remoteDb.batch(batchStmts, "write");
      console.log(`Successfully uploaded ${rows.length}/${rows.length} rows to ${table.name}.`);
    } catch (e) {
      console.error(`Error inserting batch into ${table.name}:`, e.message);
    }
  }
  
  console.log("\n🎉 Database fully migrated to Turso!");
}

push().catch(console.error);

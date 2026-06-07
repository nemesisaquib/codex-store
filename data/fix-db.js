const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'codex.db');
const db = new Database(dbPath);

console.log('Fixing encoding...');
db.pragma('encoding = "UTF-8"');

console.log('Enabling WAL mode...');
db.pragma('journal_mode = WAL');

console.log('Vacuuming database...');
db.exec('VACUUM;');

db.close();
console.log('Done! The codex.db file is now in WAL mode and ready for Turso.');

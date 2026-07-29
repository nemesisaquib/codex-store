const { createClient } = require("@libsql/client");

async function migrate() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL || "file:./data/codex.db",
  });

  const columns = [
    { name: "sizes", type: "TEXT DEFAULT '[]'" },
    { name: "weight", type: "REAL" },
    { name: "length", type: "REAL" },
    { name: "width", type: "REAL" },
    { name: "height", type: "REAL" }
  ];

  for (const col of columns) {
    try {
      await db.execute(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name}`);
    } catch (e) {
      if (e.message.includes("duplicate column name")) {
        console.log(`Column ${col.name} already exists.`);
      } else {
        console.error(`Error adding column ${col.name}:`, e.message);
      }
    }
  }

  console.log("Migration complete.");
}

migrate();

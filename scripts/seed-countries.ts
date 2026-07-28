import { createClient } from "@libsql/client";

// Ensure environment variables are loaded if needed
import { config } from "dotenv";
config({ path: ".env.local" });

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./data/codex.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const countries = [
  // Middle East
  { code: "BH", name: "Bahrain" },
  { code: "EG", name: "Egypt" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "JO", name: "Jordan" },
  { code: "KW", name: "Kuwait" },
  { code: "LB", name: "Lebanon" },
  { code: "OM", name: "Oman" },
  { code: "PS", name: "Palestine" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "SY", name: "Syria" },
  { code: "TR", name: "Turkey" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "YE", name: "Yemen" },
  
  // Europe
  { code: "ES", name: "Spain" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "AT", name: "Austria" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  
  // Oceania
  { code: "NZ", name: "New Zealand" },
  { code: "AU", name: "Australia" },
  
  // North/South America
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "VE", name: "Venezuela" },
  { code: "BR", name: "Brazil" },
  
  // Asia
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "AF", name: "Afghanistan" },
  { code: "IN", name: "India" }
];

async function seed() {
  console.log("Creating countries table...");
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS countries (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );
  `);
  
  // Clear existing countries just in case
  await db.execute(`DELETE FROM countries;`);

  console.log("Inserting countries...");
  let count = 0;
  for (const c of countries) {
    await db.execute({
      sql: "INSERT INTO countries (code, name, is_active) VALUES (?, ?, 1)",
      args: [c.code, c.name]
    });
    count++;
  }
  
  console.log(`Successfully seeded ${count} countries.`);
}

seed().catch(console.error);

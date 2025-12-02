import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "database.db")

// Ensure data directory exists
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(dbPath)
    db.pragma("foreign_keys = ON")
    db.pragma("journal_mode = WAL")
    console.log(`Database connected: ${dbPath}`)
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log("Database connection closed")
  }
}

export async function initializeDatabase(): Promise<void> {
  const database = getDatabase()
  const schemaPath = path.join(__dirname, "schema.sql")
  const schema = fs.readFileSync(schemaPath, "utf-8")
  
  // Execute the entire schema at once (better-sqlite3 handles multi-statement SQL)
  database.exec(schema)
  
  console.log("Database schema initialized")
}


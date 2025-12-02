import { getDatabase, SQLiteDatabase } from "./connection"
import fs from "fs"
import path from "path"
import crypto from "crypto"

interface Migration {
  id: number
  version: number
  name: string
  checksum: string
  applied_at: string
  execution_time_ms: number
}

export class MigrationRunner {
  private db: SQLiteDatabase
  private migrationsDir: string

  constructor(db: SQLiteDatabase, migrationsDir?: string) {
    this.db = db
    this.migrationsDir = migrationsDir || path.join(process.cwd(), "migrations")
  }

  private calculateChecksum(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex")
  }

  private parseVersion(filename: string): number {
    const match = filename.match(/^(\d+)/)
    if (!match) throw new Error(`Invalid migration filename: ${filename}`)
    return parseInt(match[1], 10)
  }

  initialize(): void {
    // Create migrations table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        checksum TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);
    `)
  }

  getAppliedMigrations(): Migration[] {
    const stmt = this.db.prepare("SELECT * FROM migrations ORDER BY version")
    return stmt.all() as Migration[]
  }

  getPendingMigrations(): Array<{ filename: string; version: number; path: string }> {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true })
      return []
    }

    const applied = new Set(this.getAppliedMigrations().map((m) => m.version))

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith(".sql") && !f.includes(".rollback."))
      .sort()

    return files
      .map((filename) => ({
        filename,
        version: this.parseVersion(filename),
        path: path.join(this.migrationsDir, filename),
      }))
      .filter((m) => !applied.has(m.version))
  }

  applyMigration(migrationFile: { filename: string; version: number; path: string }): void {
    const content = fs.readFileSync(migrationFile.path, "utf-8")
    const checksum = this.calculateChecksum(content)

    // Check if already applied
    const existing = this.db.prepare("SELECT * FROM migrations WHERE version = ?").get(migrationFile.version) as Migration | undefined
    if (existing) {
      if (existing.checksum !== checksum) {
        throw new Error(
          `Migration ${migrationFile.filename} has been modified since it was applied. ` +
            `Expected checksum: ${existing.checksum}, got: ${checksum}`
        )
      }
      console.log(`✓ Migration ${migrationFile.filename} already applied`)
      return
    }

    console.log(`Applying migration: ${migrationFile.filename}`)
    const startTime = Date.now()

    try {
      // Apply migration in a transaction
      const transaction = this.db.transaction(() => {
        // Execute migration SQL
        this.db.exec(content)

        // Record migration
        const stmt = this.db.prepare(
          "INSERT INTO migrations (version, name, checksum, execution_time_ms) VALUES (?, ?, ?, ?)"
        )
        stmt.run(migrationFile.version, migrationFile.filename, checksum, Date.now() - startTime)
      })
      transaction()

      console.log(`✓ Migration ${migrationFile.filename} applied successfully (${Date.now() - startTime}ms)`)
    } catch (error: any) {
      console.error(`✗ Migration ${migrationFile.filename} failed:`, error.message)
      throw error
    }
  }

  rollback(version?: number): void {
    const migrations = this.getAppliedMigrations()
    if (migrations.length === 0) {
      console.log("No migrations to rollback")
      return
    }

    // Determine which migration to rollback
    const targetMigration = version ? migrations.find((m) => m.version === version) : migrations[migrations.length - 1]

    if (!targetMigration) {
      throw new Error(`Migration version ${version} not found`)
    }

    // Check for rollback file
    const rollbackPath = path.join(
      this.migrationsDir,
      "rollback",
      targetMigration.name.replace(".sql", ".rollback.sql")
    )

    if (!fs.existsSync(rollbackPath)) {
      throw new Error(`No rollback file found for migration ${targetMigration.name}`)
    }

    console.log(`Rolling back migration: ${targetMigration.name}`)
    const rollbackContent = fs.readFileSync(rollbackPath, "utf-8")

    try {
      const transaction = this.db.transaction(() => {
        // Execute rollback SQL
        this.db.exec(rollbackContent)

        // Remove migration record
        const stmt = this.db.prepare("DELETE FROM migrations WHERE version = ?")
        stmt.run(targetMigration.version)
      })
      transaction()

      console.log(`✓ Rolled back migration: ${targetMigration.name}`)
    } catch (error: any) {
      console.error(`✗ Rollback failed for ${targetMigration.name}:`, error.message)
      throw error
    }
  }

  runAll(): void {
    this.initialize()
    const pending = this.getPendingMigrations()

    if (pending.length === 0) {
      console.log("✓ All migrations are up to date")
      return
    }

    console.log(`Found ${pending.length} pending migration(s)`)

    for (const migration of pending) {
      this.applyMigration(migration)
    }

    console.log(`\n✓ All migrations completed successfully`)
  }

  status(): void {
    this.initialize()
    const applied = this.getAppliedMigrations()
    const pending = this.getPendingMigrations()

    console.log("\n=== Migration Status ===\n")

    if (applied.length > 0) {
      console.log("Applied migrations:")
      for (const migration of applied) {
        const date = new Date(migration.applied_at).toLocaleString()
        console.log(`  ✓ ${migration.name} (v${migration.version}) - ${date} [${migration.execution_time_ms}ms]`)
      }
    } else {
      console.log("No migrations applied yet")
    }

    if (pending.length > 0) {
      console.log("\nPending migrations:")
      for (const migration of pending) {
        console.log(`  ○ ${migration.filename} (v${migration.version})`)
      }
    } else {
      console.log("\nNo pending migrations")
    }

    console.log()
  }

  validate(): void {
    this.initialize()
    const applied = this.getAppliedMigrations()

    console.log("Validating migrations...")
    let hasErrors = false

    for (const migration of applied) {
      const migrationPath = path.join(this.migrationsDir, migration.name)

      if (!fs.existsSync(migrationPath)) {
        console.error(`✗ Migration file missing: ${migration.name}`)
        hasErrors = true
        continue
      }

      const content = fs.readFileSync(migrationPath, "utf-8")
      const currentChecksum = this.calculateChecksum(content)

      if (currentChecksum !== migration.checksum) {
        console.error(`✗ Migration ${migration.name} has been modified after being applied`)
        console.error(`  Expected: ${migration.checksum}`)
        console.error(`  Current:  ${currentChecksum}`)
        hasErrors = true
      } else {
        console.log(`✓ ${migration.name} is valid`)
      }
    }

    if (!hasErrors) {
      console.log("\n✓ All migrations are valid")
    } else {
      throw new Error("Migration validation failed")
    }
  }
}


#!/usr/bin/env node

// Database migration CLI

import { getDatabase, closeDatabase } from "./connection"
import { MigrationRunner } from "./migrations"
import path from "path"

const commands = {
  up: "Run all pending migrations",
  down: "Rollback the last migration",
  status: "Show migration status",
  validate: "Validate applied migrations",
  create: "Create a new migration file",
  reset: "Rollback all migrations and re-run them",
} as const

function printUsage() {
  console.log("\nUsage: npm run migrate [command] [options]\n")
  console.log("Commands:")
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(10)} ${desc}`)
  })
  console.log("\nOptions:")
  console.log("  --version <n>  Specific version for rollback")
  console.log("  --name <name>  Name for new migration")
  console.log("\nExamples:")
  console.log("  npm run migrate          # Run pending migrations")
  console.log("  npm run migrate up       # Run pending migrations")
  console.log("  npm run migrate down     # Rollback last migration")
  console.log("  npm run migrate status   # Show migration status")
  console.log("  npm run migrate create --name add_user_fields")
}

function createMigration(name: string) {
  const fs = require("fs")
  const existingFiles = fs
    .readdirSync(path.join(process.cwd(), "migrations"))
    .filter((f: string) => f.endsWith(".sql") && !f.includes(".rollback."))
    .sort()

  let nextVersion = 1
  if (existingFiles.length > 0) {
    const lastFile = existingFiles[existingFiles.length - 1]
    const match = lastFile.match(/^(\d+)/)
    if (match) {
      nextVersion = parseInt(match[1], 10) + 1
    }
  }

  const versionStr = nextVersion.toString().padStart(3, "0")
  const safeName = name.toLowerCase().replace(/[^a-z0-9_]+/g, "_")
  const filename = `${versionStr}_${safeName}.sql`
  const migrationPath = path.join(process.cwd(), "migrations", filename)
  const rollbackPath = path.join(process.cwd(), "migrations", "rollback", filename.replace(".sql", ".rollback.sql"))

  const migrationTemplate = `-- Migration: ${filename}
-- Description: ${name.replace(/_/g, " ")}
-- Author: ${process.env.USER || "Unknown"}
-- Date: ${new Date().toISOString().split("T")[0]}

-- Your migration SQL here
`

  const rollbackTemplate = `-- Rollback for: ${filename}
-- Description: Rollback ${name.replace(/_/g, " ")}

-- Your rollback SQL here
`

  // Ensure directories exist
  fs.mkdirSync(path.dirname(migrationPath), { recursive: true })
  fs.mkdirSync(path.dirname(rollbackPath), { recursive: true })

  // Write files
  fs.writeFileSync(migrationPath, migrationTemplate)
  fs.writeFileSync(rollbackPath, rollbackTemplate)

  console.log(`✓ Created migration: ${migrationPath}`)
  console.log(`✓ Created rollback: ${rollbackPath}`)
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0] || "up"

  if (command === "create") {
    const nameIndex = args.indexOf("--name")
    if (nameIndex === -1 || !args[nameIndex + 1]) {
      console.error("Error: --name option is required for create command")
      printUsage()
      process.exit(1)
    }
    createMigration(args[nameIndex + 1])
    return
  }

  if (command === "help" || command === "--help" || command === "-h") {
    printUsage()
    return
  }

  const db = getDatabase()
  const migrationsDir = path.join(process.cwd(), "migrations")
  const runner = new MigrationRunner(db, migrationsDir)

  try {
    switch (command) {
      case "up":
        runner.runAll()
        break

      case "down":
        const versionIndex = args.indexOf("--version")
        const version = versionIndex !== -1 ? parseInt(args[versionIndex + 1]) : undefined
        runner.rollback(version)
        break

      case "status":
        runner.status()
        break

      case "validate":
        runner.validate()
        break

      case "reset":
        console.log("Resetting database...")
        const applied = runner.getAppliedMigrations()
        for (let i = applied.length - 1; i >= 0; i--) {
          runner.rollback(applied[i].version)
        }
        console.log("\nRe-applying all migrations...")
        runner.runAll()
        break

      default:
        console.error(`Unknown command: ${command}`)
        printUsage()
        process.exit(1)
    }
  } catch (error: any) {
    console.error("\nMigration error:", error.message)
    process.exit(1)
  } finally {
    closeDatabase()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { MigrationRunner }


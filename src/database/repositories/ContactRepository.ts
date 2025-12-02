import Database from "better-sqlite3"
import { Contact, CreateContact, UpdateContact } from "../types"

export class ContactRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): Contact | null {
    const row = this.db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Contact | undefined
    return row || null
  }

  findByJobApplication(jobApplicationId: number): Contact[] {
    return this.db
      .prepare("SELECT * FROM contacts WHERE job_application_id = ? ORDER BY created_at DESC")
      .all(jobApplicationId) as Contact[]
  }

  create(contact: CreateContact): Contact {
    const fields = Object.keys(contact)
    const placeholders = fields.map(() => "?").join(", ")
    const values = fields.map((field) => (contact as any)[field])

    const sql = `INSERT INTO contacts (${fields.join(", ")}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...values)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create contact")
    return created
  }

  update(id: number, updates: UpdateContact): Contact | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => (updates as any)[field])
    values.push(id)

    this.db.prepare(`UPDATE contacts SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM contacts WHERE id = ?").run(id)
    return result.changes > 0
  }
}


import Database from "better-sqlite3"
import { Note, CreateNote, UpdateNote } from "../types"

export class NoteRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): Note | null {
    const row = this.db.prepare("SELECT * FROM notes WHERE id = ?").get(id) as Note | undefined
    return row || null
  }

  findByJobApplication(jobApplicationId: number): Note[] {
    return this.db
      .prepare("SELECT * FROM notes WHERE job_application_id = ? ORDER BY created_at DESC")
      .all(jobApplicationId) as Note[]
  }

  create(note: CreateNote): Note {
    const fields = Object.keys(note)
    const placeholders = fields.map(() => "?").join(", ")
    const values = fields.map((field) => (note as any)[field])

    const sql = `INSERT INTO notes (${fields.join(", ")}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...values)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create note")
    return created
  }

  update(id: number, updates: UpdateNote): Note | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => (updates as any)[field])
    values.push(id)

    this.db.prepare(`UPDATE notes SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM notes WHERE id = ?").run(id)
    return result.changes > 0
  }
}


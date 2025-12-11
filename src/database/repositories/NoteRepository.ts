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
      .prepare("SELECT * FROM notes WHERE job_application_id = ? ORDER BY created_at ASC")
      .all(jobApplicationId) as Note[]
  }

  findByIdAndUser(noteId: number, userId: number): Note | null {
    const row = this.db
      .prepare(
        `SELECT n.* FROM notes n
         INNER JOIN job_applications ja ON n.job_application_id = ja.id
         WHERE n.id = ? AND ja.user_id = ?`
      )
      .get(noteId, userId) as Note | undefined
    return row || null
  }

  findByApplicationAndUser(
    applicationId: number,
    userId: number,
    options?: { limit: number; offset: number }
  ): Note[] {
    let sql = `SELECT n.* FROM notes n
         INNER JOIN job_applications ja ON n.job_application_id = ja.id
         WHERE n.job_application_id = ? AND ja.user_id = ?
         ORDER BY n.created_at ASC`

    if (options) {
      sql += ` LIMIT ? OFFSET ?`
      return this.db.prepare(sql).all(applicationId, userId, options.limit, options.offset) as Note[]
    }

    return this.db.prepare(sql).all(applicationId, userId) as Note[]
  }

  countByApplicationAndUser(applicationId: number, userId: number): number {
    const result = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM notes n
         INNER JOIN job_applications ja ON n.job_application_id = ja.id
         WHERE n.job_application_id = ? AND ja.user_id = ?`
      )
      .get(applicationId, userId) as { count: number }
    return result.count
  }

  findByUser(userId: number, options?: { limit: number; offset: number }): Note[] {
    let sql = `SELECT n.* FROM notes n
         INNER JOIN job_applications ja ON n.job_application_id = ja.id
         WHERE ja.user_id = ?
         ORDER BY n.created_at DESC`

    if (options) {
      sql += ` LIMIT ? OFFSET ?`
      return this.db.prepare(sql).all(userId, options.limit, options.offset) as Note[]
    }

    return this.db.prepare(sql).all(userId) as Note[]
  }

  countByUser(userId: number): number {
    const result = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM notes n
         INNER JOIN job_applications ja ON n.job_application_id = ja.id
         WHERE ja.user_id = ?`
      )
      .get(userId) as { count: number }
    return result.count
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


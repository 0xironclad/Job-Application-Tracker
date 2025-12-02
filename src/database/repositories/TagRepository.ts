import Database from "better-sqlite3"
import { Tag, CreateTag, UpdateTag } from "../types"

export class TagRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): Tag | null {
    const row = this.db.prepare("SELECT * FROM tags WHERE id = ?").get(id) as Tag | undefined
    return row || null
  }

  findByName(name: string): Tag | null {
    const row = this.db.prepare("SELECT * FROM tags WHERE name = ?").get(name) as Tag | undefined
    return row || null
  }

  create(tag: CreateTag): Tag {
    const fields = Object.keys(tag)
    const placeholders = fields.map(() => "?").join(", ")
    const values = fields.map((field) => (tag as any)[field])

    const sql = `INSERT INTO tags (${fields.join(", ")}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...values)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create tag")
    return created
  }

  update(id: number, updates: UpdateTag): Tag | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => (updates as any)[field])
    values.push(id)

    this.db.prepare(`UPDATE tags SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM tags WHERE id = ?").run(id)
    return result.changes > 0
  }

  findAll(): Tag[] {
    return this.db.prepare("SELECT * FROM tags ORDER BY name").all() as Tag[]
  }
}


import Database from "better-sqlite3"
import { User, CreateUser, UpdateUser } from "../types"

export class UserRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): User | null {
    const row = this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined
    return row || null
  }

  findByEmail(email: string): User | null {
    const row = this.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined
    return row || null
  }

  create(user: CreateUser): User {
    const { email, password_hash, full_name } = user
    const result = this.db
      .prepare("INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)")
      .run(email, password_hash, full_name)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create user")
    return created
  }

  update(id: number, updates: UpdateUser): User | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => (updates as any)[field])
    values.push(id)

    this.db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM users WHERE id = ?").run(id)
    return result.changes > 0
  }

  findAll(): User[] {
    return this.db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as User[]
  }
}


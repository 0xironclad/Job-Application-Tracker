import Database from "better-sqlite3"
import { Task, CreateTask, UpdateTask } from "../types"

export class TaskRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): Task | null {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined
    return row || null
  }

  findByJobApplication(jobApplicationId: number): Task[] {
    return this.db
      .prepare("SELECT * FROM tasks WHERE job_application_id = ? ORDER BY due_date ASC, created_at DESC")
      .all(jobApplicationId) as Task[]
  }

  findUpcoming(days: number = 7): Task[] {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return this.db
      .prepare("SELECT * FROM tasks WHERE due_date <= ? AND is_completed = 0 ORDER BY due_date ASC")
      .all(date.toISOString().split("T")[0]) as Task[]
  }

  create(task: CreateTask): Task {
    const fields = Object.keys(task)
    const placeholders = fields.map(() => "?").join(", ")
    const values = fields.map((field) => {
      const value = (task as any)[field]
      if (value instanceof Date) {
        return value.toISOString().split("T")[0]
      }
      if (typeof value === "boolean") {
        return value ? 1 : 0
      }
      return value
    })

    const sql = `INSERT INTO tasks (${fields.join(", ")}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...values)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create task")
    return created
  }

  update(id: number, updates: UpdateTask): Task | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => {
      const value = (updates as any)[field]
      if (value instanceof Date) {
        return value.toISOString().split("T")[0]
      }
      return value
    })
    values.push(id)

    this.db.prepare(`UPDATE tasks SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  markComplete(id: number): boolean {
    const result = this.db
      .prepare("UPDATE tasks SET is_completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(id)
    return result.changes > 0
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id)
    return result.changes > 0
  }
}


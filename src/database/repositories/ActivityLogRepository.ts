import Database from "better-sqlite3"
import { ActivityLog, CreateActivityLog } from "../types"

export class ActivityLogRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): ActivityLog | null {
    const row = this.db.prepare("SELECT * FROM activity_logs WHERE id = ?").get(id) as ActivityLog | undefined
    return row || null
  }

  findByUser(userId: number, limit: number = 50): ActivityLog[] {
    return this.db
      .prepare("SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
      .all(userId, limit) as ActivityLog[]
  }

  findByJobApplication(jobApplicationId: number): ActivityLog[] {
    return this.db
      .prepare("SELECT * FROM activity_logs WHERE job_application_id = ? ORDER BY created_at DESC")
      .all(jobApplicationId) as ActivityLog[]
  }

  logActivity(
    userId: number,
    action: string,
    entityType: string,
    entityId?: number,
    jobApplicationId?: number,
    metadata?: any
  ): ActivityLog {
    const metadataJson = metadata ? JSON.stringify(metadata) : null
    const result = this.db
      .prepare(
        "INSERT INTO activity_logs (user_id, job_application_id, action, entity_type, entity_id, metadata) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(userId, jobApplicationId || null, action, entityType, entityId || null, metadataJson)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create activity log")
    return created
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM activity_logs WHERE id = ?").run(id)
    return result.changes > 0
  }
}


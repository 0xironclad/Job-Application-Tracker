import Database from "better-sqlite3"
import { JobApplication, CreateJobApplication, UpdateJobApplication, ApplicationStatus } from "../types"

export class JobApplicationRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): JobApplication | null {
    const row = this.db.prepare("SELECT * FROM job_applications WHERE id = ?").get(id) as JobApplication | undefined
    return row || null
  }

  findByUserId(userId: number): JobApplication[] {
    return this.db
      .prepare("SELECT * FROM job_applications WHERE user_id = ? ORDER BY application_date DESC")
      .all(userId) as JobApplication[]
  }

  findByStatus(userId: number, status: ApplicationStatus): JobApplication[] {
    return this.db
      .prepare("SELECT * FROM job_applications WHERE user_id = ? AND status = ? ORDER BY application_date DESC")
      .all(userId, status) as JobApplication[]
  }

  create(application: CreateJobApplication): JobApplication {
    const fields = Object.keys(application)
    const placeholders = fields.map(() => "?").join(", ")
    const values = fields.map((field) => {
      const value = (application as any)[field]
      if (value instanceof Date) {
        return value.toISOString().split("T")[0]
      }
      return value
    })

    const sql = `INSERT INTO job_applications (${fields.join(", ")}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...values)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create job application")
    return created
  }

  update(id: number, updates: UpdateJobApplication): JobApplication | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => (updates as any)[field])
    values.push(id)

    this.db.prepare(`UPDATE job_applications SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM job_applications WHERE id = ?").run(id)
    return result.changes > 0
  }

  getWithCompany(id: number): any {
    return this.db
      .prepare(
        `
      SELECT ja.*, c.name as company_name, c.website, c.industry
      FROM job_applications ja
      LEFT JOIN companies c ON ja.company_id = c.id
      WHERE ja.id = ?
    `
      )
      .get(id)
  }

  getStatsByUser(userId: number): any {
    return this.db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status = 'screening' THEN 1 ELSE 0 END) as screening,
        SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offer,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'withdrawn' THEN 1 ELSE 0 END) as withdrawn
      FROM job_applications
      WHERE user_id = ?
    `
      )
      .get(userId)
  }

  addTag(applicationId: number, tagId: number): void {
    this.db
      .prepare("INSERT OR IGNORE INTO job_application_tags (job_application_id, tag_id) VALUES (?, ?)")
      .run(applicationId, tagId)
  }

  removeTag(applicationId: number, tagId: number): boolean {
    const result = this.db
      .prepare("DELETE FROM job_application_tags WHERE job_application_id = ? AND tag_id = ?")
      .run(applicationId, tagId)
    return result.changes > 0
  }

  getTags(applicationId: number): any[] {
    return this.db
      .prepare(
        `
      SELECT t.* FROM tags t
      INNER JOIN job_application_tags jat ON t.id = jat.tag_id
      WHERE jat.job_application_id = ?
      ORDER BY t.name
    `
      )
      .all(applicationId) as any[]
  }
}


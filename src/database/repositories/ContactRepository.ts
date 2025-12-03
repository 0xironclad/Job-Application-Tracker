import Database from "better-sqlite3"
import { Contact, CreateContact, UpdateContact } from "../types"

export interface ContactFilters {
  companyId?: number
  jobApplicationId?: number
  search?: string
  role?: string
  userId?: number
}

interface ContactPaginationOptions {
  limit?: number
  offset?: number
}

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

  findByCompany(companyId: number): Contact[] {
    const sql = `
      SELECT c.*
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
      WHERE ja.company_id = ?
      ORDER BY c.created_at DESC
    `
    return this.db.prepare(sql).all(companyId) as Contact[]
  }

  findByCompanyAndUser(companyId: number, userId: number): Contact[] {
    const sql = `
      SELECT c.*
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
      WHERE ja.company_id = ? AND ja.user_id = ?
      ORDER BY c.created_at DESC
    `
    return this.db.prepare(sql).all(companyId, userId) as Contact[]
  }

  findByIdAndUser(id: number, userId: number): Contact | null {
    const sql = `
      SELECT c.*
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
      WHERE c.id = ? AND ja.user_id = ?
    `
    const row = this.db.prepare(sql).get(id, userId) as Contact | undefined
    return row || null
  }

  findByUser(userId: number, options?: ContactPaginationOptions): Contact[] {
    let sql = `
      SELECT c.*
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
      WHERE ja.user_id = ?
      ORDER BY c.created_at DESC
    `

    const params: any[] = [userId]

    if (options?.limit !== undefined) {
      sql += " LIMIT ?"
      params.push(options.limit)
      if (options.offset !== undefined) {
        sql += " OFFSET ?"
        params.push(options.offset)
      }
    }

    return this.db.prepare(sql).all(...params) as Contact[]
  }

  countByUser(userId: number): number {
    const sql = `
      SELECT COUNT(*) as count
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
      WHERE ja.user_id = ?
    `
    const result = this.db.prepare(sql).get(userId) as { count: number }
    return result.count
  }

  // Enhanced filtering methods for listing endpoints
  findWithFilters(filters: ContactFilters, pagination?: ContactPaginationOptions): Contact[] {
    let sql = `
      SELECT c.*
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
    `
    const params: any[] = []
    const conditions: string[] = []

    if (filters.userId) {
      conditions.push("ja.user_id = ?")
      params.push(filters.userId)
    }

    if (filters.companyId) {
      conditions.push("ja.company_id = ?")
      params.push(filters.companyId)
    }

    if (filters.jobApplicationId) {
      conditions.push("c.job_application_id = ?")
      params.push(filters.jobApplicationId)
    }

    if (filters.search && filters.search.trim() !== "") {
      const term = `%${filters.search.trim().toLowerCase()}%`
      conditions.push("(LOWER(c.name) LIKE ? OR LOWER(c.email) LIKE ?)")
      params.push(term, term)
    }

    if (filters.role && filters.role.trim() !== "") {
      conditions.push("LOWER(c.title) = LOWER(?)")
      params.push(filters.role.trim())
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    sql += " ORDER BY c.created_at DESC"

    if (pagination && pagination.limit !== undefined) {
      sql += " LIMIT ?"
      params.push(pagination.limit)
      if (pagination.offset !== undefined) {
        sql += " OFFSET ?"
        params.push(pagination.offset)
      }
    }

    return this.db.prepare(sql).all(...params) as Contact[]
  }

  countWithFilters(filters: ContactFilters): number {
    let sql = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
    `
    const params: any[] = []
    const conditions: string[] = []

    if (filters.userId) {
      conditions.push("ja.user_id = ?")
      params.push(filters.userId)
    }

    if (filters.companyId) {
      conditions.push("ja.company_id = ?")
      params.push(filters.companyId)
    }

    if (filters.jobApplicationId) {
      conditions.push("c.job_application_id = ?")
      params.push(filters.jobApplicationId)
    }

    if (filters.search && filters.search.trim() !== "") {
      const term = `%${filters.search.trim().toLowerCase()}%`
      conditions.push("(LOWER(c.name) LIKE ? OR LOWER(c.email) LIKE ?)")
      params.push(term, term)
    }

    if (filters.role && filters.role.trim() !== "") {
      conditions.push("LOWER(c.title) = LOWER(?)")
      params.push(filters.role.trim())
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    const result = this.db.prepare(sql).get(...params) as { count: number }
    return result.count
  }

  private getJobApplications(contactId: number): number[] {
    const row = this.db
      .prepare("SELECT job_application_id FROM contacts WHERE id = ?")
      .get(contactId) as { job_application_id: number } | undefined

    if (!row || row.job_application_id == null) {
      return []
    }

    return [row.job_application_id]
  }

  // Get contacts with their job application IDs included
  findWithApplications(filters: ContactFilters, pagination?: ContactPaginationOptions): Array<Contact & { job_application_ids: number[] }> {
    const contacts = this.findWithFilters(filters, pagination)
    return contacts.map(contact => ({
      ...(contact as Contact),
      job_application_ids: this.getJobApplications(contact.id)
    }))
  }

  create(contact: CreateContact): Contact {
    const fields = Object.keys(contact)
    const placeholders = fields.map(() => "?").join(", ")
    const values = fields.map(field => (contact as any)[field])

    const sql = `INSERT INTO contacts (${fields.join(", ")}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...values)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create contact")
    return created
  }

  update(id: number, updates: UpdateContact): Contact | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map(field => `${field} = ?`).join(", ")
    const values = fields.map(field => (updates as any)[field])
    values.push(id)

    this.db.prepare(`UPDATE contacts SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM contacts WHERE id = ?").run(id)
    return result.changes > 0
  }

  belongsToUser(contactId: number, userId: number): boolean {
    const sql = `
      SELECT COUNT(*) as count
      FROM contacts c
      INNER JOIN job_applications ja ON c.job_application_id = ja.id
      WHERE c.id = ? AND ja.user_id = ?
    `
    const result = this.db.prepare(sql).get(contactId, userId) as { count: number }
    return result.count > 0
  }
}

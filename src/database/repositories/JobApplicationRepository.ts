import Database from "better-sqlite3"
import { JobApplication, CreateJobApplication, UpdateJobApplication, ApplicationStatus } from "../types"

export interface ApplicationFilters {
  userId: number
  status?: ApplicationStatus
  companyId?: number
  dateFrom?: string
  dateTo?: string
  salaryMin?: number
  salaryMax?: number
  workType?: string
  location?: string
}

export interface ApplicationSort {
  field: 'application_date' | 'created_at' | 'status' | 'position_title' | 'company_id'
  order: 'ASC' | 'DESC'
}

export interface PaginationOptions {
  limit: number
  offset: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

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

  // Advanced filtering, sorting, and pagination
  findWithFilters(
    filters: ApplicationFilters,
    sort?: ApplicationSort,
    pagination?: PaginationOptions
  ): PaginatedResult<JobApplication> {
    let whereClauses: string[] = ['user_id = ?']
    let params: any[] = [filters.userId]

    // Build WHERE clauses
    if (filters.status) {
      whereClauses.push('status = ?')
      params.push(filters.status)
    }

    if (filters.companyId !== undefined && filters.companyId !== null) {
      whereClauses.push('company_id = ?')
      params.push(filters.companyId)
    }

    if (filters.dateFrom) {
      whereClauses.push('application_date >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      whereClauses.push('application_date <= ?')
      params.push(filters.dateTo)
    }

    if (filters.salaryMin !== undefined && filters.salaryMin !== null) {
      whereClauses.push('(salary_max IS NULL OR salary_max >= ?)')
      params.push(filters.salaryMin)
    }

    if (filters.salaryMax !== undefined && filters.salaryMax !== null) {
      whereClauses.push('(salary_min IS NULL OR salary_min <= ?)')
      params.push(filters.salaryMax)
    }

    if (filters.workType) {
      whereClauses.push('work_type = ?')
      params.push(filters.workType)
    }

    if (filters.location) {
      whereClauses.push('LOWER(location) LIKE LOWER(?)')
      params.push(`%${filters.location}%`)
    }

    const whereClause = whereClauses.join(' AND ')

    // Count total records
    const countSql = `SELECT COUNT(*) as total FROM job_applications WHERE ${whereClause}`
    const totalResult = this.db.prepare(countSql).get(...params) as { total: number }
    const total = totalResult.total

    // Build main query
    let sql = `SELECT * FROM job_applications WHERE ${whereClause}`

    // Add sorting
    if (sort) {
      sql += ` ORDER BY ${sort.field} ${sort.order}`
    } else {
      sql += ' ORDER BY application_date DESC, created_at DESC'
    }

    // Add pagination
    const limit = pagination?.limit || 20
    const offset = pagination?.offset || 0
    sql += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const data = this.db.prepare(sql).all(...params) as JobApplication[]

    return {
      data,
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    }
  }

  // Get applications with company data
  findWithCompanyAndFilters(
    filters: ApplicationFilters,
    sort?: ApplicationSort,
    pagination?: PaginationOptions
  ): PaginatedResult<any> {
    let whereClauses: string[] = ['ja.user_id = ?']
    let params: any[] = [filters.userId]

    // Build WHERE clauses
    if (filters.status) {
      whereClauses.push('ja.status = ?')
      params.push(filters.status)
    }

    if (filters.companyId !== undefined && filters.companyId !== null) {
      whereClauses.push('ja.company_id = ?')
      params.push(filters.companyId)
    }

    if (filters.dateFrom) {
      whereClauses.push('ja.application_date >= ?')
      params.push(filters.dateFrom)
    }

    if (filters.dateTo) {
      whereClauses.push('ja.application_date <= ?')
      params.push(filters.dateTo)
    }

    if (filters.salaryMin !== undefined && filters.salaryMin !== null) {
      whereClauses.push('(ja.salary_max IS NULL OR ja.salary_max >= ?)')
      params.push(filters.salaryMin)
    }

    if (filters.salaryMax !== undefined && filters.salaryMax !== null) {
      whereClauses.push('(ja.salary_min IS NULL OR ja.salary_min <= ?)')
      params.push(filters.salaryMax)
    }

    if (filters.workType) {
      whereClauses.push('ja.work_type = ?')
      params.push(filters.workType)
    }

    if (filters.location) {
      whereClauses.push('LOWER(ja.location) LIKE LOWER(?)')
      params.push(`%${filters.location}%`)
    }

    const whereClause = whereClauses.join(' AND ')

    // Count total records
    const countSql = `SELECT COUNT(*) as total FROM job_applications ja WHERE ${whereClause}`
    const totalResult = this.db.prepare(countSql).get(...params) as { total: number }
    const total = totalResult.total

    // Build main query with company join
    let sql = `
      SELECT 
        ja.*,
        c.name as company_name,
        c.website as company_website,
        c.industry as company_industry,
        c.size as company_size,
        c.location as company_location
      FROM job_applications ja
      LEFT JOIN companies c ON ja.company_id = c.id
      WHERE ${whereClause}
    `

    // Add sorting
    if (sort) {
      const sortField = sort.field === 'application_date' ? 'ja.application_date' :
                       sort.field === 'created_at' ? 'ja.created_at' :
                       sort.field === 'status' ? 'ja.status' :
                       sort.field === 'position_title' ? 'ja.position_title' :
                       sort.field === 'company_id' ? 'c.name' : 'ja.application_date'
      sql += ` ORDER BY ${sortField} ${sort.order}`
    } else {
      sql += ' ORDER BY ja.application_date DESC, ja.created_at DESC'
    }

    // Add pagination
    const limit = pagination?.limit || 20
    const offset = pagination?.offset || 0
    sql += ` LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const data = this.db.prepare(sql).all(...params)

    return {
      data,
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    }
  }

  // Check if company exists
  companyExists(companyId: number): boolean {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM companies WHERE id = ?').get(companyId) as { count: number }
    return result.count > 0
  }
}


import Database from "better-sqlite3"
import { Company, CreateCompany, UpdateCompany } from "../types"

export class CompanyRepository {
  constructor(private db: Database.Database) {}

  findById(id: number): Company | null {
    const row = this.db.prepare("SELECT * FROM companies WHERE id = ?").get(id) as Company | undefined
    return row || null
  }

  findByName(name: string): Company | null {
    const row = this.db.prepare("SELECT * FROM companies WHERE name = ?").get(name) as Company | undefined
    return row || null
  }

  create(company: CreateCompany): Company {
    const fields = Object.keys(company)
    const placeholders = fields.map(() => "?").join(", ")
    const values = fields.map((field) => (company as any)[field])

    const sql = `INSERT INTO companies (${fields.join(", ")}) VALUES (${placeholders})`
    const result = this.db.prepare(sql).run(...values)

    const created = this.findById(Number(result.lastInsertRowid))
    if (!created) throw new Error("Failed to create company")
    return created
  }

  update(id: number, updates: UpdateCompany): Company | null {
    const fields = Object.keys(updates)
    if (fields.length === 0) return this.findById(id)

    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => (updates as any)[field])
    values.push(id)

    this.db.prepare(`UPDATE companies SET ${setClause} WHERE id = ?`).run(...values)

    return this.findById(id)
  }

  delete(id: number): boolean {
    const result = this.db.prepare("DELETE FROM companies WHERE id = ?").run(id)
    return result.changes > 0
  }

  findAll(): Company[] {
    return this.db.prepare("SELECT * FROM companies ORDER BY name").all() as Company[]
  }

  findByUserId(userId: number): Company[] {
    return this.db.prepare("SELECT * FROM companies WHERE user_id = ? ORDER BY name").all(userId) as Company[]
  }

  getApplicationCount(id: number): number {
    const result = this.db.prepare("SELECT COUNT(*) as count FROM job_applications WHERE company_id = ?").get(id) as {
      count: number
    }
    return result.count
  }

  search(query: string, userId?: number): Company[] {
    if (userId) {
      return this.db
        .prepare("SELECT * FROM companies WHERE user_id = ? AND (name LIKE ? OR industry LIKE ?) ORDER BY name")
        .all(userId, `%${query}%`, `%${query}%`) as Company[]
    }
    return this.db
      .prepare("SELECT * FROM companies WHERE name LIKE ? OR industry LIKE ? ORDER BY name")
      .all(`%${query}%`, `%${query}%`) as Company[]
  }

  belongsToUser(id: number, userId: number): boolean {
    const result = this.db.prepare("SELECT user_id FROM companies WHERE id = ?").get(id) as { user_id: number } | undefined
    return result?.user_id === userId
  }

  findByUserIdWithFilters(userId: number, filters: {
    search?: string
    name?: string
    industry?: string
    size?: string
    location?: string
  }, sort?: { field: string, order: 'ASC' | 'DESC' }, limit: number = 20, offset: number = 0): { data: Company[], total: number } {
    let whereClause = "WHERE user_id = ?"
    let params: any[] = [userId]

    // General search across multiple fields
    if (filters.search) {
      whereClause += " AND (name LIKE ? OR industry LIKE ? OR description LIKE ? OR location LIKE ?)"
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    // Specific field filters
    if (filters.name) {
      whereClause += " AND name LIKE ?"
      params.push(`%${filters.name}%`)
    }

    if (filters.industry) {
      whereClause += " AND industry LIKE ?"
      params.push(`%${filters.industry}%`)
    }

    if (filters.size) {
      whereClause += " AND size LIKE ?"
      params.push(`%${filters.size}%`)
    }

    if (filters.location) {
      whereClause += " AND location LIKE ?"
      params.push(`%${filters.location}%`)
    }

    // Build ORDER BY clause
    let orderClause = "ORDER BY name ASC" // default sorting
    if (sort && sort.field) {
      // Map API field names to database column names
      const fieldMapping: Record<string, string> = {
        'name': 'name',
        'industry': 'industry',
        'size': 'size',
        'location': 'location',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at'
      }
      
      const dbField = fieldMapping[sort.field] || 'name'
      orderClause = `ORDER BY ${dbField} ${sort.order}`
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM companies ${whereClause}`
    const totalResult = this.db.prepare(countSql).get(...params) as { count: number }
    const total = totalResult.count

    // Get paginated data
    const dataSql = `SELECT * FROM companies ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
    const data = this.db.prepare(dataSql).all(...params, limit, offset) as Company[]

    return { data, total }
  }
}


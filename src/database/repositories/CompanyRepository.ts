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

  getApplicationCount(id: number): number {
    const result = this.db.prepare("SELECT COUNT(*) as count FROM job_applications WHERE company_id = ?").get(id) as {
      count: number
    }
    return result.count
  }

  search(query: string): Company[] {
    return this.db
      .prepare("SELECT * FROM companies WHERE name LIKE ? OR industry LIKE ? ORDER BY name")
      .all(`%${query}%`, `%${query}%`) as Company[]
  }
}


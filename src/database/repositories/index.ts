import { getDatabase } from "../connection"
import { UserRepository } from "./UserRepository"
import { CompanyRepository } from "./CompanyRepository"
import { JobApplicationRepository } from "./JobApplicationRepository"

export class Database {
  public users: UserRepository
  public companies: CompanyRepository
  public jobApplications: JobApplicationRepository

  constructor(private db: ReturnType<typeof getDatabase>) {
    this.users = new UserRepository(db)
    this.companies = new CompanyRepository(db)
    this.jobApplications = new JobApplicationRepository(db)
  }
}

// Singleton database instance
let dbInstance: Database | null = null

export function getDatabaseInstance(): Database {
  if (!dbInstance) {
    const db = getDatabase()
    dbInstance = new Database(db)
  }
  return dbInstance
}

export * from "./UserRepository"
export * from "./CompanyRepository"
export * from "./JobApplicationRepository"


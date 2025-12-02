import { getDatabase as getDbConnection } from "../connection"
import { UserRepository } from "./UserRepository"
import { CompanyRepository } from "./CompanyRepository"
import { JobApplicationRepository } from "./JobApplicationRepository"
import { TagRepository } from "./TagRepository"
import { ContactRepository } from "./ContactRepository"
import { NoteRepository } from "./NoteRepository"
import { TaskRepository } from "./TaskRepository"
import { ActivityLogRepository } from "./ActivityLogRepository"

export class Database {
  public users: UserRepository
  public companies: CompanyRepository
  public jobApplications: JobApplicationRepository
  public tags: TagRepository
  public contacts: ContactRepository
  public notes: NoteRepository
  public tasks: TaskRepository
  public activityLogs: ActivityLogRepository

  constructor(private db: ReturnType<typeof getDbConnection>) {
    this.users = new UserRepository(db)
    this.companies = new CompanyRepository(db)
    this.jobApplications = new JobApplicationRepository(db)
    this.tags = new TagRepository(db)
    this.contacts = new ContactRepository(db)
    this.notes = new NoteRepository(db)
    this.tasks = new TaskRepository(db)
    this.activityLogs = new ActivityLogRepository(db)
  }
}

// Singleton database instance
let dbInstance: Database | null = null

export function getDatabase(): Database {
  if (!dbInstance) {
    const db = getDbConnection()
    dbInstance = new Database(db)
  }
  return dbInstance
}

export * from "./UserRepository"
export * from "./CompanyRepository"
export * from "./JobApplicationRepository"
export * from "./TagRepository"
export * from "./ContactRepository"
export * from "./NoteRepository"
export * from "./TaskRepository"
export * from "./ActivityLogRepository"


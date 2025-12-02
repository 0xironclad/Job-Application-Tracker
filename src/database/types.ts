// Database model types

export interface User {
  id: number
  email: string
  password_hash: string
  full_name: string
  created_at: Date
  updated_at: Date
}

export interface Company {
  id: number
  name: string
  website?: string
  industry?: string
  size?: string
  location?: string
  description?: string
  created_at: Date
  updated_at: Date
}

export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn'
export type WorkType = 'remote' | 'hybrid' | 'onsite'

export interface JobApplication {
  id: number
  user_id: number
  company_id?: number
  position_title: string
  status: ApplicationStatus
  application_date: Date
  job_posting_url?: string
  salary_min?: number
  salary_max?: number
  location?: string
  work_type?: WorkType
  notes?: string
  created_at: Date
  updated_at: Date
}

export interface Contact {
  id: number
  job_application_id: number
  name: string
  title?: string
  email?: string
  phone?: string
  linkedin_url?: string
  notes?: string
  created_at: Date
  updated_at: Date
}

export type NoteType = 'general' | 'interview' | 'feedback' | 'followup'

export interface Note {
  id: number
  job_application_id: number
  content: string
  type?: NoteType
  created_at: Date
  updated_at: Date
}

export interface Task {
  id: number
  job_application_id: number
  title: string
  description?: string
  due_date?: Date
  is_completed: boolean
  completed_at?: Date
  created_at: Date
  updated_at: Date
}

export interface Tag {
  id: number
  name: string
  color?: string
  created_at: Date
}

export interface JobApplicationTag {
  job_application_id: number
  tag_id: number
  created_at: Date
}

export interface ActivityLog {
  id: number
  user_id: number
  job_application_id?: number
  action: string
  entity_type: string
  entity_id?: number
  metadata?: any
  created_at: Date
}

// Input types for creating/updating records
export type CreateUser = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>

export type CreateCompany = Omit<Company, 'id' | 'created_at' | 'updated_at'>
export type UpdateCompany = Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>

export type CreateJobApplication = Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>
export type UpdateJobApplication = Partial<Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'user_id'>>

export type CreateContact = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
export type UpdateContact = Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'job_application_id'>>

export type CreateNote = Omit<Note, 'id' | 'created_at' | 'updated_at'>
export type UpdateNote = Partial<Omit<Note, 'id' | 'created_at' | 'updated_at' | 'job_application_id'>>

export type CreateTask = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'>
export type UpdateTask = Partial<Omit<Task, 'id' | 'created_at' | 'updated_at' | 'job_application_id'>>

export type CreateTag = Omit<Tag, 'id' | 'created_at'>
export type UpdateTag = Partial<Omit<Tag, 'id' | 'created_at'>>

export type CreateActivityLog = Omit<ActivityLog, 'id' | 'created_at'>


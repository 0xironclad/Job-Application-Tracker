import { Router, Request, Response } from "express"
import { getDatabase } from "../database/repositories"
import { CreateJobApplication, UpdateJobApplication, ApplicationStatus } from "../database/types"

const router = Router()

// Middleware to extract userId from request (placeholder for actual auth)
// In a real app, this would come from JWT token or session
interface AuthenticatedRequest extends Request {
  userId?: number
}

// For demonstration purposes, we'll use a hardcoded user ID or get it from headers
// In production, this would be extracted from authenticated JWT token
function getUserId(req: AuthenticatedRequest): number {
  // Check for user ID in headers (for testing)
  const userIdHeader = req.headers['user-id']
  if (userIdHeader && typeof userIdHeader === 'string') {
    const userId = parseInt(userIdHeader, 10)
    if (!isNaN(userId)) {
      return userId
    }
  }
  
  // In a real application, you would extract this from JWT token
  // For now, return a default user ID for demonstration
  return 1
}

// Validation helper for required fields
function validateCreateApplication(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
    errors.push('title is required and must be a non-empty string')
  }
  
  if (!data.status || typeof data.status !== 'string') {
    errors.push('status is required')
  } else {
    const validStatuses: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']
    if (!validStatuses.includes(data.status as ApplicationStatus)) {
      errors.push('status must be one of: ' + validStatuses.join(', '))
    }
  }
  
  if (!data.appliedAt) {
    errors.push('appliedAt is required')
  } else {
    const date = new Date(data.appliedAt)
    if (isNaN(date.getTime())) {
      errors.push('appliedAt must be a valid date')
    }
  }
  
  if (data.companyId !== undefined && data.companyId !== null) {
    if (typeof data.companyId !== 'number' || data.companyId <= 0) {
      errors.push('companyId must be a positive number if provided')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

function validateUpdateApplication(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim() === '')) {
    errors.push('title must be a non-empty string if provided')
  }
  
  if (data.status !== undefined) {
    if (typeof data.status !== 'string') {
      errors.push('status must be a string if provided')
    } else {
      const validStatuses: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']
      if (!validStatuses.includes(data.status as ApplicationStatus)) {
        errors.push('status must be one of: ' + validStatuses.join(', '))
      }
    }
  }
  
  if (data.appliedAt !== undefined) {
    const date = new Date(data.appliedAt)
    if (isNaN(date.getTime())) {
      errors.push('appliedAt must be a valid date if provided')
    }
  }
  
  if (data.companyId !== undefined && data.companyId !== null) {
    if (typeof data.companyId !== 'number' || data.companyId <= 0) {
      errors.push('companyId must be a positive number if provided')
    }
  }
  
  return { isValid: errors.length === 0, errors }
}

// Transform API format to database format
function transformToDbFormat(data: any, userId: number): CreateJobApplication {
  return {
    user_id: userId,
    company_id: data.companyId || null,
    position_title: data.title,
    status: data.status,
    application_date: new Date(data.appliedAt),
    job_posting_url: data.jobPostingUrl || null,
    salary_min: data.salaryMin || null,
    salary_max: data.salaryMax || null,
    location: data.location || null,
    work_type: data.workType || null,
    notes: data.notes || null
  }
}

// Transform API format to database format for updates
function transformToDbUpdateFormat(data: any): UpdateJobApplication {
  const updates: any = {}
  
  if (data.title !== undefined) updates.position_title = data.title
  if (data.status !== undefined) updates.status = data.status
  if (data.appliedAt !== undefined) updates.application_date = new Date(data.appliedAt)
  if (data.companyId !== undefined) updates.company_id = data.companyId
  if (data.jobPostingUrl !== undefined) updates.job_posting_url = data.jobPostingUrl
  if (data.salaryMin !== undefined) updates.salary_min = data.salaryMin
  if (data.salaryMax !== undefined) updates.salary_max = data.salaryMax
  if (data.location !== undefined) updates.location = data.location
  if (data.workType !== undefined) updates.work_type = data.workType
  if (data.notes !== undefined) updates.notes = data.notes
  
  return updates
}

// Transform database format to API format
function transformToApiFormat(application: any) {
  return {
    id: application.id,
    title: application.position_title,
    companyId: application.company_id,
    status: application.status,
    appliedAt: application.application_date,
    jobPostingUrl: application.job_posting_url,
    salaryMin: application.salary_min,
    salaryMax: application.salary_max,
    location: application.location,
    workType: application.work_type,
    notes: application.notes,
    createdAt: application.created_at,
    updatedAt: application.updated_at
  }
}

// GET /applications - Get all applications for authenticated user
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req)
    const db = getDatabase()
    
    const applications = db.jobApplications.findByUserId(userId)
    const transformedApplications = applications.map(transformToApiFormat)
    
    res.json({
      data: transformedApplications,
      count: transformedApplications.length
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch applications'
    })
  }
})

// GET /applications/:id - Get single application by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req)
    const applicationId = parseInt(req.params.id, 10)
    
    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Application ID must be a valid number'
      })
    }
    
    const db = getDatabase()
    const application = db.jobApplications.findById(applicationId)
    
    if (!application) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    // Verify the application belongs to the authenticated user
    if (application.user_id !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    res.json({
      data: transformToApiFormat(application)
    })
  } catch (error) {
    console.error('Error fetching application:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch application'
    })
  }
})

// POST /applications - Create new application
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req)
    const validation = validateCreateApplication(req.body)
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request validation failed',
        details: validation.errors
      })
    }
    
    const db = getDatabase()
    const applicationData = transformToDbFormat(req.body, userId)
    const createdApplication = db.jobApplications.create(applicationData)
    
    res.status(201).json({
      data: transformToApiFormat(createdApplication),
      message: 'Application created successfully'
    })
  } catch (error) {
    console.error('Error creating application:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create application'
    })
  }
})

// PUT /applications/:id - Update existing application (full update)
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req)
    const applicationId = parseInt(req.params.id, 10)
    
    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Application ID must be a valid number'
      })
    }
    
    const validation = validateCreateApplication(req.body)
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request validation failed',
        details: validation.errors
      })
    }
    
    const db = getDatabase()
    const existingApplication = db.jobApplications.findById(applicationId)
    
    if (!existingApplication) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    // Verify the application belongs to the authenticated user
    if (existingApplication.user_id !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    const updateData = transformToDbUpdateFormat(req.body)
    const updatedApplication = db.jobApplications.update(applicationId, updateData)
    
    if (!updatedApplication) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update application'
      })
    }
    
    res.json({
      data: transformToApiFormat(updatedApplication),
      message: 'Application updated successfully'
    })
  } catch (error) {
    console.error('Error updating application:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update application'
    })
  }
})

// PATCH /applications/:id - Update existing application (partial update)
router.patch('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req)
    const applicationId = parseInt(req.params.id, 10)
    
    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Application ID must be a valid number'
      })
    }
    
    const validation = validateUpdateApplication(req.body)
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request validation failed',
        details: validation.errors
      })
    }
    
    const db = getDatabase()
    const existingApplication = db.jobApplications.findById(applicationId)
    
    if (!existingApplication) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    // Verify the application belongs to the authenticated user
    if (existingApplication.user_id !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    const updateData = transformToDbUpdateFormat(req.body)
    
    // If no valid fields to update, return the current application
    if (Object.keys(updateData).length === 0) {
      return res.json({
        data: transformToApiFormat(existingApplication),
        message: 'No changes to apply'
      })
    }
    
    const updatedApplication = db.jobApplications.update(applicationId, updateData)
    
    if (!updatedApplication) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update application'
      })
    }
    
    res.json({
      data: transformToApiFormat(updatedApplication),
      message: 'Application updated successfully'
    })
  } catch (error) {
    console.error('Error updating application:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update application'
    })
  }
})

// DELETE /applications/:id - Delete application
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = getUserId(req)
    const applicationId = parseInt(req.params.id, 10)
    
    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Application ID must be a valid number'
      })
    }
    
    const db = getDatabase()
    const existingApplication = db.jobApplications.findById(applicationId)
    
    if (!existingApplication) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    // Verify the application belongs to the authenticated user
    if (existingApplication.user_id !== userId) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Application not found'
      })
    }
    
    const deleted = db.jobApplications.delete(applicationId)
    
    if (!deleted) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete application'
      })
    }
    
    res.status(200).json({
      message: 'Application deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting application:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete application'
    })
  }
})

export default router


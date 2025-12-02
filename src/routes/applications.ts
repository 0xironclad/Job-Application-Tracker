import { Router, Request, Response } from "express"
import { getDatabase } from "../database/repositories"
import { CreateJobApplication, UpdateJobApplication, ApplicationStatus } from "../database/types"
import { ApplicationValidator, ValidationResult } from "../validation/applicationValidator"
import { ApplicationFilters, ApplicationSort, PaginationOptions } from "../database/repositories/JobApplicationRepository"
import { authenticate, requireAuth, AuthenticatedRequest } from "../middleware/auth"

const router: Router = Router()

// Apply authentication middleware to all routes
router.use(authenticate, requireAuth)

// Helper function to format validation errors consistently
function formatValidationErrors(validation: ValidationResult) {
  return {
    error: 'Validation failed',
    message: 'Request validation failed',
    errors: validation.errors
  }
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

// GET /applications/stats - Get application statistics
router.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as number
    const db = getDatabase()
    
    const stats = db.jobApplications.getStatsByUser(userId)
    
    return res.json({
      data: stats,
      summary: {
        totalApplications: stats.total,
        activeApplications: stats.applied + stats.screening + stats.interview,
        successRate: stats.total > 0 ? ((stats.offer / stats.total) * 100).toFixed(2) + '%' : '0%',
        responseRate: stats.total > 0 ? 
          (((stats.screening + stats.interview + stats.offer + stats.rejected) / stats.total) * 100).toFixed(2) + '%' : '0%'
      }
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch application statistics'
    })
  }
})

// GET /applications - Get all applications for authenticated user with filtering, sorting, and pagination
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as number
    const db = getDatabase()
    
    // Validate query parameters
    const queryValidation = ApplicationValidator.validateQueryParams(req.query)
    if (!queryValidation.isValid) {
      return res.status(400).json(formatValidationErrors(queryValidation))
    }
    
    // Build filters
    const filters: ApplicationFilters = {
      userId,
      status: req.query.status as ApplicationStatus,
      companyId: req.query.company ? parseInt(req.query.company as string, 10) : undefined,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      salaryMin: req.query.salaryMin ? parseInt(req.query.salaryMin as string, 10) : undefined,
      salaryMax: req.query.salaryMax ? parseInt(req.query.salaryMax as string, 10) : undefined,
      workType: req.query.workType as string,
      location: req.query.location as string
    }
    
    // Build sorting
    let sort: ApplicationSort | undefined
    if (req.query.sort) {
      sort = {
        field: req.query.sort as any,
        order: (req.query.order as string || 'DESC').toUpperCase() as 'ASC' | 'DESC'
      }
    }
    
    // Build pagination
    let pagination: PaginationOptions
    if (req.query.page && req.query.pageSize) {
      // Page-based pagination
      const page = parseInt(req.query.page as string, 10)
      const pageSize = parseInt(req.query.pageSize as string, 10)
      pagination = {
        limit: pageSize,
        offset: (page - 1) * pageSize
      }
    } else if (req.query.limit || req.query.offset) {
      // Offset-based pagination
      pagination = {
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0
      }
    } else {
      // Default pagination
      pagination = {
        limit: 20,
        offset: 0
      }
    }
    
    // Decide whether to include company data
    const includeCompany = req.query.includeCompany === 'true'
    
    const result = includeCompany 
      ? db.jobApplications.findWithCompanyAndFilters(filters, sort, pagination)
      : db.jobApplications.findWithFilters(filters, sort, pagination)
    
    // Transform data to API format
    const transformedData = result.data.map(app => {
      const transformed = transformToApiFormat(app)
      if (includeCompany && app.company_name) {
        (transformed as any).company = {
          id: app.company_id,
          name: app.company_name,
          website: app.company_website,
          industry: app.company_industry,
          size: app.company_size,
          location: app.company_location
        }
      }
      return transformed
    })
    
    return res.json({
      data: transformedData,
      pagination: {
        page: result.page,
        pageSize: result.limit,
        totalPages: result.totalPages,
        total: result.total,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1
      },
      filters: {
        status: filters.status,
        company: filters.companyId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        salaryMin: filters.salaryMin,
        salaryMax: filters.salaryMax,
        workType: filters.workType,
        location: filters.location
      },
      sort: sort ? { field: sort.field, order: sort.order } : null
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch applications'
    })
  }
})

// GET /applications/:id - Get single application by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as number
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
    
    return res.json({
      data: transformToApiFormat(application)
    })
  } catch (error) {
    console.error('Error fetching application:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch application'
    })
  }
})

// POST /applications - Create new application
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as number
    const validation = ApplicationValidator.validateCreate(req.body)
    
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrors(validation))
    }
    
    const db = getDatabase()
    
    // Check if company exists if provided
    if (req.body.companyId) {
      const companyExists = db.jobApplications.companyExists(req.body.companyId)
      if (!companyExists) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request validation failed',
          errors: [{
            field: 'companyId',
            message: 'Company does not exist',
            value: req.body.companyId
          }]
        })
      }
    }
    
    // Check for existing application with same position and company for the user
    const existingApplications = db.jobApplications.findByUserId(userId)
    const duplicate = existingApplications.find(app => 
      app.position_title === req.body.title && 
      app.company_id === req.body.companyId &&
      app.status !== 'withdrawn' && 
      app.status !== 'rejected'
    )
    
    if (duplicate) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request validation failed',
        errors: [{
          field: 'duplicate',
          message: 'An active application for this position at this company already exists',
          value: { title: req.body.title, companyId: req.body.companyId }
        }]
      })
    }
    
    const applicationData = transformToDbFormat(req.body, userId)
    const createdApplication = db.jobApplications.create(applicationData)
    
    return res.status(201).json({
      data: transformToApiFormat(createdApplication),
      message: 'Application created successfully'
    })
  } catch (error) {
    console.error('Error creating application:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create application'
    })
  }
})

// PUT /applications/:id - Update existing application (full update)
router.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as number
    const applicationId = parseInt(req.params.id, 10)
    
    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Application ID must be a valid number'
      })
    }
    
    const validation = ApplicationValidator.validateCreate(req.body)
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrors(validation))
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
    
    // Check if company exists if provided
    if (req.body.companyId && req.body.companyId !== existingApplication.company_id) {
      const companyExists = db.jobApplications.companyExists(req.body.companyId)
      if (!companyExists) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request validation failed',
          errors: [{
            field: 'companyId',
            message: 'Company does not exist',
            value: req.body.companyId
          }]
        })
      }
    }
    
    // Validate salary range considering existing values
    const salaryMin = req.body.salaryMin !== undefined ? req.body.salaryMin : existingApplication.salary_min
    const salaryMax = req.body.salaryMax !== undefined ? req.body.salaryMax : existingApplication.salary_max
    
    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request validation failed',
        errors: [{
          field: 'salaryRange',
          message: 'Minimum salary cannot be greater than maximum salary',
          value: { min: salaryMin, max: salaryMax }
        }]
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
    
    return res.json({
      data: transformToApiFormat(updatedApplication),
      message: 'Application updated successfully'
    })
  } catch (error) {
    console.error('Error updating application:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update application'
    })
  }
})

// PATCH /applications/:id - Update existing application (partial update)
router.patch('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as number
    const applicationId = parseInt(req.params.id, 10)
    
    if (isNaN(applicationId)) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Application ID must be a valid number'
      })
    }
    
    const validation = ApplicationValidator.validateUpdate(req.body)
    if (!validation.isValid) {
      return res.status(400).json(formatValidationErrors(validation))
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
    
    // Check if company exists if being updated
    if (req.body.companyId && req.body.companyId !== existingApplication.company_id) {
      const companyExists = db.jobApplications.companyExists(req.body.companyId)
      if (!companyExists) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request validation failed',
          errors: [{
            field: 'companyId',
            message: 'Company does not exist',
            value: req.body.companyId
          }]
        })
      }
    }
    
    // Validate salary range considering existing values
    const salaryMin = req.body.salaryMin !== undefined ? req.body.salaryMin : existingApplication.salary_min
    const salaryMax = req.body.salaryMax !== undefined ? req.body.salaryMax : existingApplication.salary_max
    
    if (salaryMin && salaryMax && salaryMin > salaryMax) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Request validation failed',
        errors: [{
          field: 'salaryRange',
          message: 'Minimum salary cannot be greater than maximum salary',
          value: { min: salaryMin, max: salaryMax }
        }]
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
    
    // Format dates properly before update
    if (updateData.application_date) {
      updateData.application_date = new Date(ApplicationValidator.formatDate(updateData.application_date))
    }
    
    const updatedApplication = db.jobApplications.update(applicationId, updateData)
    
    if (!updatedApplication) {
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to update application'
      })
    }
    
    return res.json({
      data: transformToApiFormat(updatedApplication),
      message: 'Application updated successfully'
    })
  } catch (error) {
    console.error('Error updating application:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update application'
    })
  }
})

// DELETE /applications/:id - Delete application
router.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId as number
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
    
    return res.status(200).json({
      message: 'Application deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting application:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete application'
    })
  }
})

export default router


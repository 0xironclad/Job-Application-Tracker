import { Router, Response } from "express"
import { getDatabase } from "../database/repositories"
import { CreateCompany, UpdateCompany } from "../database/types"
import { CompanyValidator, ValidationResult } from "../validation/companyValidator"
import { authenticate, requireAuth, AuthenticatedRequest } from "../middleware/auth"
import { asyncHandler, ValidationError, NotFoundError, DatabaseError } from "../middleware/errorHandler"
import { ResponseBuilder } from "../utils/response"

const router: Router = Router()

// Apply authentication middleware to all routes
router.use(authenticate, requireAuth)

// Helper function to format validation errors consistently
function formatValidationErrors(validation: ValidationResult) {
  return validation.errors.map(err => ({
    field: err.field,
    message: err.message,
    value: err.value
  }))
}

// Transform API format to database format
function transformToDbFormat(data: any, userId: number): CreateCompany {
  return {
    user_id: userId,
    name: data.name.trim(),
    website: data.website?.trim() || null,
    industry: data.industry?.trim() || null,
    size: data.size?.trim() || null,
    location: data.location?.trim() || null,
    description: data.description?.trim() || null
  }
}

// Transform API format to database format for updates
function transformToDbUpdateFormat(data: any): UpdateCompany {
  const updates: any = {}
  
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.website !== undefined) updates.website = data.website?.trim() || null
  if (data.industry !== undefined) updates.industry = data.industry?.trim() || null
  if (data.size !== undefined) updates.size = data.size?.trim() || null
  if (data.location !== undefined) updates.location = data.location?.trim() || null
  if (data.description !== undefined) updates.description = data.description?.trim() || null
  
  return updates
}

// Transform database format to API format
function transformToApiFormat(company: any) {
  return {
    id: company.id,
    name: company.name,
    website: company.website,
    industry: company.industry,
    size: company.size,
    location: company.location,
    description: company.description,
    createdAt: company.created_at,
    updatedAt: company.updated_at
  }
}

// GET /companies - Get all companies for authenticated user with filtering and pagination
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId as number
  const db = getDatabase()
  
  // Validate query parameters
  const queryValidation = CompanyValidator.validateQueryParams(req.query)
  if (!queryValidation.isValid) {
    throw new ValidationError("Invalid query parameters", formatValidationErrors(queryValidation))
  }
  
  // Build filters
  const filters = {
    search: req.query.search as string,
    industry: req.query.industry as string,
    size: req.query.size as string,
    location: req.query.location as string
  }
  
  // Build pagination
  let limit = 20
  let offset = 0
  let page = 1
  
  if (req.query.page && req.query.pageSize) {
    // Page-based pagination
    page = parseInt(req.query.page as string, 10)
    const pageSize = parseInt(req.query.pageSize as string, 10)
    limit = pageSize
    offset = (page - 1) * pageSize
  } else if (req.query.limit || req.query.offset) {
    // Offset-based pagination
    limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
    offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0
    page = Math.floor(offset / limit) + 1
  }
  
  const result = db.companies.findByUserIdWithFilters(userId, filters, limit, offset)
  
  // Transform data to API format
  const transformedData = result.data.map(transformToApiFormat)
  
  const totalPages = Math.ceil(result.total / limit)
  
  return ResponseBuilder.ok(res, transformedData, {
    page,
    pageSize: limit,
    totalPages,
    total: result.total
  })
}))

// GET /companies/:id - Get single company by ID
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId as number
  const companyId = parseInt(req.params.id, 10)
  
  if (isNaN(companyId)) {
    throw new ValidationError("Company ID must be a valid number", [{ field: "id", message: "Invalid ID format", value: req.params.id }])
  }
  
  const db = getDatabase()
  const company = db.companies.findById(companyId)
  
  if (!company) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  // Verify the company belongs to the authenticated user
  if (company.user_id !== userId) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  return ResponseBuilder.ok(res, transformToApiFormat(company))
}))

// POST /companies - Create new company
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId as number
  const validation = CompanyValidator.validateCreate(req.body)
  
  if (!validation.isValid) {
    throw new ValidationError("Request validation failed", formatValidationErrors(validation))
  }
  
  const db = getDatabase()
  
  // Check for existing company with same name for the user
  const existingCompanies = db.companies.findByUserId(userId)
  const duplicate = existingCompanies.find(company => 
    company.name.toLowerCase() === req.body.name.trim().toLowerCase()
  )
  
  if (duplicate) {
    throw new ValidationError("Request validation failed", [{
      field: 'name',
      message: 'A company with this name already exists',
      value: req.body.name
    }])
  }
  
  const companyData = transformToDbFormat(req.body, userId)
  const createdCompany = db.companies.create(companyData)
  
  return ResponseBuilder.created(res, transformToApiFormat(createdCompany))
}))

// PUT /companies/:id - Update existing company (full update)
router.put('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId as number
  const companyId = parseInt(req.params.id, 10)
  
  if (isNaN(companyId)) {
    throw new ValidationError("Company ID must be a valid number", [{ field: "id", message: "Invalid ID format", value: req.params.id }])
  }
  
  const validation = CompanyValidator.validateCreate(req.body)
  if (!validation.isValid) {
    throw new ValidationError("Request validation failed", formatValidationErrors(validation))
  }
  
  const db = getDatabase()
  const existingCompany = db.companies.findById(companyId)
  
  if (!existingCompany) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  // Verify the company belongs to the authenticated user
  if (existingCompany.user_id !== userId) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  // Check for name conflicts with other companies owned by this user
  if (req.body.name.trim().toLowerCase() !== existingCompany.name.toLowerCase()) {
    const existingCompanies = db.companies.findByUserId(userId)
    const duplicate = existingCompanies.find(company => 
      company.id !== companyId && 
      company.name.toLowerCase() === req.body.name.trim().toLowerCase()
    )
    
    if (duplicate) {
      throw new ValidationError("Request validation failed", [{
        field: 'name',
        message: 'A company with this name already exists',
        value: req.body.name
      }])
    }
  }
  
  const updateData = transformToDbUpdateFormat(req.body)
  const updatedCompany = db.companies.update(companyId, updateData)
  
  if (!updatedCompany) {
    throw new DatabaseError("Failed to update company")
  }
  
  return ResponseBuilder.ok(res, transformToApiFormat(updatedCompany))
}))

// PATCH /companies/:id - Update existing company (partial update)
router.patch('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId as number
  const companyId = parseInt(req.params.id, 10)
  
  if (isNaN(companyId)) {
    throw new ValidationError("Company ID must be a valid number", [{ field: "id", message: "Invalid ID format", value: req.params.id }])
  }
  
  const validation = CompanyValidator.validateUpdate(req.body)
  if (!validation.isValid) {
    throw new ValidationError("Request validation failed", formatValidationErrors(validation))
  }
  
  const db = getDatabase()
  const existingCompany = db.companies.findById(companyId)
  
  if (!existingCompany) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  // Verify the company belongs to the authenticated user
  if (existingCompany.user_id !== userId) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  // Check for name conflicts with other companies owned by this user
  if (req.body.name && req.body.name.trim().toLowerCase() !== existingCompany.name.toLowerCase()) {
    const existingCompanies = db.companies.findByUserId(userId)
    const duplicate = existingCompanies.find(company => 
      company.id !== companyId && 
      company.name.toLowerCase() === req.body.name.trim().toLowerCase()
    )
    
    if (duplicate) {
      throw new ValidationError("Request validation failed", [{
        field: 'name',
        message: 'A company with this name already exists',
        value: req.body.name
      }])
    }
  }
  
  const updateData = transformToDbUpdateFormat(req.body)
  
  // If no valid fields to update, return the current company
  if (Object.keys(updateData).length === 0) {
    return ResponseBuilder.ok(res, transformToApiFormat(existingCompany))
  }
  
  const updatedCompany = db.companies.update(companyId, updateData)
  
  if (!updatedCompany) {
    throw new DatabaseError("Failed to update company")
  }
  
  return ResponseBuilder.ok(res, transformToApiFormat(updatedCompany))
}))

// DELETE /companies/:id - Delete company
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId as number
  const companyId = parseInt(req.params.id, 10)
  
  if (isNaN(companyId)) {
    throw new ValidationError("Company ID must be a valid number", [{ field: "id", message: "Invalid ID format", value: req.params.id }])
  }
  
  const db = getDatabase()
  const existingCompany = db.companies.findById(companyId)
  
  if (!existingCompany) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  // Verify the company belongs to the authenticated user
  if (existingCompany.user_id !== userId) {
    throw new NotFoundError(`Company with ID '${companyId}' not found`)
  }
  
  // Check if company is being used in job applications
  const applicationCount = db.companies.getApplicationCount(companyId)
  if (applicationCount > 0) {
    throw new ValidationError("Cannot delete company that is referenced by job applications", [{
      field: 'company',
      message: `This company is referenced by ${applicationCount} job application(s). Please remove these references before deleting the company.`,
      value: companyId
    }])
  }
  
  const deleted = db.companies.delete(companyId)
  
  if (!deleted) {
    throw new DatabaseError("Failed to delete company")
  }
  
  return ResponseBuilder.noContent(res)
}))

export default router


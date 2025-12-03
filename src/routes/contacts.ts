import { Router, Response } from "express"
import { getDatabase } from "../database/repositories"
import { CreateContact, UpdateContact } from "../database/types"
import { ContactValidator, ValidationResult } from "../validation/contactValidator"
import { authenticate, requireAuth, AuthenticatedRequest } from "../middleware/auth"
import { asyncHandler, ValidationError, NotFoundError, DatabaseError, AuthorizationError } from "../middleware/errorHandler"
import { ResponseBuilder } from "../utils/response"

const router: Router = Router()

router.use(authenticate, requireAuth)

function formatValidationErrors(validation: ValidationResult) {
  return validation.errors.map(err => ({
    field: err.field,
    message: err.message,
    value: err.value
  }))
}

function transformToDbFormat(data: any, jobApplicationId: number): CreateContact {
  const result: CreateContact = {
    job_application_id: jobApplicationId,
    name: data.name.trim(),
    email: data.email.trim()
  }

  if (data.title !== undefined && data.title !== null) {
    const trimmed = data.title.trim()
    result.title = trimmed === "" ? null : trimmed
  }

  if (data.phone !== undefined && data.phone !== null) {
    const trimmed = data.phone.trim()
    result.phone = trimmed === "" ? null : trimmed
  }

  if (data.linkedin !== undefined && data.linkedin !== null) {
    const trimmed = data.linkedin.trim()
    result.linkedin_url = trimmed === "" ? null : trimmed
  }

  if (data.notes !== undefined && data.notes !== null) {
    const trimmed = data.notes.trim()
    result.notes = trimmed === "" ? null : trimmed
  }

  return result
}

function transformToDbUpdateFormat(data: any): UpdateContact {
  const updates: any = {}

  if (data.name !== undefined) {
    updates.name = data.name.trim()
  }

  if (data.email !== undefined) {
    updates.email = data.email.trim()
  }

  if (data.title !== undefined) {
    if (data.title === null) {
      updates.title = null
    } else {
      const trimmed = data.title.trim()
      updates.title = trimmed === "" ? null : trimmed
    }
  }

  if (data.phone !== undefined) {
    if (data.phone === null) {
      updates.phone = null
    } else {
      const trimmed = data.phone.trim()
      updates.phone = trimmed === "" ? null : trimmed
    }
  }

  if (data.linkedin !== undefined) {
    if (data.linkedin === null) {
      updates.linkedin_url = null
    } else {
      const trimmed = data.linkedin.trim()
      updates.linkedin_url = trimmed === "" ? null : trimmed
    }
  }

  if (data.notes !== undefined) {
    if (data.notes === null) {
      updates.notes = null
    } else {
      const trimmed = data.notes.trim()
      updates.notes = trimmed === "" ? null : trimmed
    }
  }

  return updates
}

// GET /contacts - list contacts for authenticated user (with simple pagination)
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const db = getDatabase()

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))
    const offset = (page - 1) * pageSize

    try {
      const contacts = db.contacts.findByUser(userId, { limit: pageSize, offset })
      const total = db.contacts.countByUser(userId)
      const totalPages = Math.ceil(total / pageSize)

      return ResponseBuilder.ok(res, contacts, {
        page,
        pageSize,
        total,
        totalPages
      })
    } catch (error) {
      throw new DatabaseError("Failed to fetch contacts")
    }
  })
)

// GET /contacts/company/:companyId - contacts for a company (user scoped)
router.get(
  "/company/:companyId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const companyId = parseInt(req.params.companyId, 10)

    if (isNaN(companyId) || companyId <= 0) {
      throw new ValidationError("Invalid company ID", [
        { field: "companyId", message: "Company ID must be a positive integer", value: req.params.companyId }
      ])
    }

    const db = getDatabase()

    const company = db.companies.findById(companyId)
    if (!company || company.user_id !== userId) {
      throw new AuthorizationError("You do not have access to this company")
    }

    try {
      const contacts = db.contacts.findByCompanyAndUser(companyId, userId)
      return ResponseBuilder.ok(res, contacts)
    } catch (error) {
      throw new DatabaseError("Failed to fetch contacts for company")
    }
  })
)

// GET /contacts/:id - single contact (user scoped)
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const contactId = parseInt(req.params.id, 10)

    if (isNaN(contactId) || contactId <= 0) {
      throw new ValidationError("Invalid contact ID", [
        { field: "id", message: "Contact ID must be a positive integer", value: req.params.id }
      ])
    }

    const db = getDatabase()
    const contact = db.contacts.findByIdAndUser(contactId, userId)

    if (!contact) {
      throw new NotFoundError("Contact not found")
    }

    return ResponseBuilder.ok(res, contact)
  })
)

// POST /contacts - create contact under a company (scoped to user)
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number

    const validation = ContactValidator.validateCreate(req.body)
    if (!validation.isValid) {
      throw new ValidationError("Validation failed", formatValidationErrors(validation))
    }

    const db = getDatabase()

    const company = db.companies.findById(req.body.companyId)
    if (!company) {
      throw new NotFoundError("Company not found")
    }
    if (company.user_id !== userId) {
      throw new AuthorizationError("You do not have access to this company")
    }

    // Find or create a simple "general" application for this contact
    const applications = db.jobApplications.findByCompanyAndUser(req.body.companyId, userId)
    const baseApplication =
      applications[0] ??
      db.jobApplications.create({
        user_id: userId,
        company_id: req.body.companyId,
        position_title: "General Contact",
        status: "applied",
        application_date: new Date()
      })

    const contactData = transformToDbFormat(req.body, baseApplication.id)
    const contact = db.contacts.create(contactData)

    return ResponseBuilder.created(res, contact)
  })
)

// PUT /contacts/:id - full update
router.put(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const contactId = parseInt(req.params.id, 10)

    if (isNaN(contactId) || contactId <= 0) {
      throw new ValidationError("Invalid contact ID", [
        { field: "id", message: "Contact ID must be a positive integer", value: req.params.id }
      ])
    }

    const validation = ContactValidator.validateUpdate(req.body)
    if (!validation.isValid) {
      throw new ValidationError("Validation failed", formatValidationErrors(validation))
    }

    const db = getDatabase()
    const existing = db.contacts.findByIdAndUser(contactId, userId)

    if (!existing) {
      throw new NotFoundError("Contact not found")
    }

    const updates = transformToDbUpdateFormat(req.body)
    const updated = db.contacts.update(contactId, updates)

    if (!updated) {
      throw new DatabaseError("Failed to update contact")
    }

    return ResponseBuilder.ok(res, updated)
  })
)

// PATCH /contacts/:id - partial update
router.patch(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const contactId = parseInt(req.params.id, 10)

    if (isNaN(contactId) || contactId <= 0) {
      throw new ValidationError("Invalid contact ID", [
        { field: "id", message: "Contact ID must be a positive integer", value: req.params.id }
      ])
    }

    const validation = ContactValidator.validatePatchUpdate(req.body)
    if (!validation.isValid) {
      throw new ValidationError("Validation failed", formatValidationErrors(validation))
    }

    const db = getDatabase()
    const existing = db.contacts.findByIdAndUser(contactId, userId)

    if (!existing) {
      throw new NotFoundError("Contact not found")
    }

    const updates = transformToDbUpdateFormat(req.body)
    const updated = db.contacts.update(contactId, updates)

    if (!updated) {
      throw new DatabaseError("Failed to update contact")
    }

    return ResponseBuilder.ok(res, updated)
  })
)

// DELETE /contacts/:id - delete contact
router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const contactId = parseInt(req.params.id, 10)

    if (isNaN(contactId) || contactId <= 0) {
      throw new ValidationError("Invalid contact ID", [
        { field: "id", message: "Contact ID must be a positive integer", value: req.params.id }
      ])
    }

    const db = getDatabase()
    const existing = db.contacts.findByIdAndUser(contactId, userId)

    if (!existing) {
      throw new NotFoundError("Contact not found")
    }

    const deleted = db.contacts.delete(contactId)
    if (!deleted) {
      throw new DatabaseError("Failed to delete contact")
    }

    return ResponseBuilder.noContent(res)
  })
)

export default router



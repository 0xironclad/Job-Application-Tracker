import { Router, Response } from "express"
import { getDatabase } from "../database/repositories"
import { CreateNote, UpdateNote } from "../database/types"
import { NoteValidator, ValidationResult } from "../validation/noteValidator"
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

function transformToDbFormat(data: any, jobApplicationId: number): CreateNote {
  const result: CreateNote = {
    job_application_id: jobApplicationId,
    content: data.content.trim()
  }

  if (data.type !== undefined && data.type !== null) {
    result.type = data.type
  }

  return result
}

function transformToDbUpdateFormat(data: any): UpdateNote {
  const updates: UpdateNote = {}

  if (data.content !== undefined) {
    updates.content = data.content.trim()
  }

  if (data.type !== undefined) {
    updates.type = data.type
  }

  return updates
}

// GET /notes - list all notes for authenticated user across all applications (newest first, with pagination)
router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const db = getDatabase()

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))
    const offset = (page - 1) * pageSize

    const notes = db.notes.findByUser(userId, { limit: pageSize, offset })
    const total = db.notes.countByUser(userId)
    const totalPages = Math.ceil(total / pageSize)

    return ResponseBuilder.ok(res, notes, {
      page,
      pageSize,
      total,
      totalPages
    })
  })
)

// GET /notes/application/:applicationId - list notes for a job application (user scoped, ordered by creation time, with pagination)
router.get(
  "/application/:applicationId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const applicationId = parseInt(req.params.applicationId, 10)

    if (isNaN(applicationId) || applicationId <= 0) {
      throw new ValidationError("Invalid application ID", [
        { field: "applicationId", message: "Application ID must be a positive integer", value: req.params.applicationId }
      ])
    }

    const db = getDatabase()

    const application = db.jobApplications.findById(applicationId)
    if (!application) {
      throw new NotFoundError("Job application not found")
    }
    if (application.user_id !== userId) {
      throw new AuthorizationError("You do not have access to this application")
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string, 10) || 20))
    const offset = (page - 1) * pageSize

    const notes = db.notes.findByApplicationAndUser(applicationId, userId, { limit: pageSize, offset })
    const total = db.notes.countByApplicationAndUser(applicationId, userId)
    const totalPages = Math.ceil(total / pageSize)

    return ResponseBuilder.ok(res, notes, {
      page,
      pageSize,
      total,
      totalPages
    })
  })
)

// GET /notes/:id - single note (user scoped)
router.get(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const noteId = parseInt(req.params.id, 10)

    if (isNaN(noteId) || noteId <= 0) {
      throw new ValidationError("Invalid note ID", [
        { field: "id", message: "Note ID must be a positive integer", value: req.params.id }
      ])
    }

    const db = getDatabase()
    const note = db.notes.findByIdAndUser(noteId, userId)

    if (!note) {
      throw new NotFoundError("Note not found")
    }

    return ResponseBuilder.ok(res, note)
  })
)

// POST /notes - create note for a job application (scoped to user)
router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number

    const validation = NoteValidator.validateCreate(req.body)
    if (!validation.isValid) {
      throw new ValidationError("Validation failed", formatValidationErrors(validation))
    }

    const db = getDatabase()

    const application = db.jobApplications.findById(req.body.applicationId)
    if (!application) {
      throw new NotFoundError("Job application not found")
    }
    if (application.user_id !== userId) {
      throw new AuthorizationError("You do not have access to this application")
    }

    const noteData = transformToDbFormat(req.body, req.body.applicationId)
    const note = db.notes.create(noteData)

    return ResponseBuilder.created(res, note)
  })
)

// PUT /notes/:id - full update
router.put(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const noteId = parseInt(req.params.id, 10)

    if (isNaN(noteId) || noteId <= 0) {
      throw new ValidationError("Invalid note ID", [
        { field: "id", message: "Note ID must be a positive integer", value: req.params.id }
      ])
    }

    const validation = NoteValidator.validateUpdate(req.body)
    if (!validation.isValid) {
      throw new ValidationError("Validation failed", formatValidationErrors(validation))
    }

    const db = getDatabase()
    const existing = db.notes.findByIdAndUser(noteId, userId)

    if (!existing) {
      throw new NotFoundError("Note not found")
    }

    const updates = transformToDbUpdateFormat(req.body)
    const updated = db.notes.update(noteId, updates)

    if (!updated) {
      throw new DatabaseError("Failed to update note")
    }

    return ResponseBuilder.ok(res, updated)
  })
)

// PATCH /notes/:id - partial update
router.patch(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const noteId = parseInt(req.params.id, 10)

    if (isNaN(noteId) || noteId <= 0) {
      throw new ValidationError("Invalid note ID", [
        { field: "id", message: "Note ID must be a positive integer", value: req.params.id }
      ])
    }

    const validation = NoteValidator.validateUpdate(req.body)
    if (!validation.isValid) {
      throw new ValidationError("Validation failed", formatValidationErrors(validation))
    }

    const db = getDatabase()
    const existing = db.notes.findByIdAndUser(noteId, userId)

    if (!existing) {
      throw new NotFoundError("Note not found")
    }

    const updates = transformToDbUpdateFormat(req.body)
    const updated = db.notes.update(noteId, updates)

    if (!updated) {
      throw new DatabaseError("Failed to update note")
    }

    return ResponseBuilder.ok(res, updated)
  })
)

// DELETE /notes/:id - delete note
router.delete(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId as number
    const noteId = parseInt(req.params.id, 10)

    if (isNaN(noteId) || noteId <= 0) {
      throw new ValidationError("Invalid note ID", [
        { field: "id", message: "Note ID must be a positive integer", value: req.params.id }
      ])
    }

    const db = getDatabase()
    const existing = db.notes.findByIdAndUser(noteId, userId)

    if (!existing) {
      throw new NotFoundError("Note not found")
    }

    const deleted = db.notes.delete(noteId)
    if (!deleted) {
      throw new DatabaseError("Failed to delete note")
    }

    return ResponseBuilder.noContent(res)
  })
)

export default router

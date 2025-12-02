import { Request, Response, NextFunction } from "express"

export interface FieldError {
  field?: string
  message: string
  value?: unknown
}

export interface ErrorResponse {
  error: string
  message: string
  code?: string
  errors?: FieldError[]
}

export interface SuccessResponse<T = unknown> {
  data: T
  meta?: Record<string, unknown>
}

export class AppError extends Error {
  statusCode: number
  code: string
  errors?: FieldError[]

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", errors?: FieldError[]) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.errors = errors
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors?: FieldError[]) {
    super(message, 400, "VALIDATION_ERROR", errors)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN")
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND")
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database error") {
    super(message, 500, "DATABASE_ERROR")
  }
}

function normalizeStatus(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode
  }

  const anyError = error as any

  if (typeof anyError?.statusCode === "number") {
    return anyError.statusCode
  }

  if (typeof anyError?.status === "number") {
    return anyError.status
  }

  return 500
}

function normalizeCode(error: unknown, statusCode: number): string | undefined {
  if (error instanceof AppError) {
    return error.code
  }

  const anyError = error as any

  if (typeof anyError?.code === "string") {
    return anyError.code
  }

  if (statusCode === 400) return "BAD_REQUEST"
  if (statusCode === 401) return "UNAUTHORIZED"
  if (statusCode === 403) return "FORBIDDEN"
  if (statusCode === 404) return "NOT_FOUND"

  return statusCode >= 500 ? "INTERNAL_ERROR" : undefined
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const statusCode = normalizeStatus(error)
  const message =
    error instanceof Error
      ? error.message || "An unexpected error occurred"
      : "An unexpected error occurred"

  const response: ErrorResponse = {
    error: error instanceof Error ? error.name || "Error" : "Error",
    message,
    code: normalizeCode(error, statusCode)
  }

  if (error instanceof AppError && error.errors && error.errors.length > 0) {
    response.errors = error.errors
  }

  if (statusCode >= 500) {
    console.error("Server error:", {
      path: req.path,
      method: req.method,
      message,
      stack: error instanceof Error ? error.stack : undefined
    })
  }

  res.status(statusCode).json(response)
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}



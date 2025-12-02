import type { Response } from "express"
import type { ErrorResponse } from "../middleware/errorHandler"

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export class ResponseBuilder {
  static success<T>(
    res: Response,
    data: T,
    statusCode = 200,
    meta?: Partial<PaginationMeta>
  ) {
    const body: { data: T; meta?: Partial<PaginationMeta> } = { data }

    if (meta && Object.keys(meta).length > 0) {
      body.meta = meta
    }

    return res.status(statusCode).json(body)
  }

  static created<T>(res: Response, data: T, meta?: Partial<PaginationMeta>) {
    return this.success(res, data, 201, meta)
  }

  static ok<T>(res: Response, data: T, meta?: Partial<PaginationMeta>) {
    return this.success(res, data, 200, meta)
  }

  static noContent(res: Response) {
    return res.status(204).send()
  }

  static error(
    res: Response,
    error: string,
    message: string,
    statusCode = 500,
    code?: string,
    errors?: ErrorResponse["errors"]
  ) {
    const body: ErrorResponse = {
      error,
      message,
      code: code || "ERROR"
    }

    if (errors && errors.length > 0) {
      body.errors = errors
    }

    return res.status(statusCode).json(body)
  }

  static badRequest(
    res: Response,
    message = "Bad request",
    errors?: ErrorResponse["errors"]
  ) {
    return this.error(res, "BadRequest", message, 400, "BAD_REQUEST", errors)
  }

  static notFound(res: Response, message = "Resource not found") {
    return this.error(res, "NotFound", message, 404, "NOT_FOUND")
  }

  static forbidden(res: Response, message = "Forbidden") {
    return this.error(res, "Forbidden", message, 403, "FORBIDDEN")
  }

  static serverError(res: Response, message = "Internal server error") {
    return this.error(res, "InternalServerError", message, 500, "INTERNAL_ERROR")
  }
}



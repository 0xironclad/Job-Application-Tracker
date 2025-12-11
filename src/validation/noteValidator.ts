export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

const VALID_NOTE_TYPES = ["general", "interview", "feedback", "followup"] as const

export class NoteValidator {
  static validateCreate(data: any): ValidationResult {
    const errors: ValidationError[] = []

    if (!data || typeof data !== "object") {
      errors.push({
        field: "body",
        message: "Request body must be a valid JSON object",
        value: data
      })
      return { isValid: false, errors }
    }

    if (data.applicationId === undefined || data.applicationId === null) {
      errors.push({
        field: "applicationId",
        message: "Application ID is required",
        value: data.applicationId
      })
    } else if (!Number.isInteger(data.applicationId) || data.applicationId <= 0) {
      errors.push({
        field: "applicationId",
        message: "Application ID must be a positive integer",
        value: data.applicationId
      })
    }

    if (data.content === undefined || data.content === null) {
      errors.push({
        field: "content",
        message: "Content is required",
        value: data.content
      })
    } else if (typeof data.content !== "string") {
      errors.push({
        field: "content",
        message: "Content must be a string",
        value: data.content
      })
    } else if (data.content.trim() === "") {
      errors.push({
        field: "content",
        message: "Content cannot be empty",
        value: data.content
      })
    } else if (data.content.trim().length > 10000) {
      errors.push({
        field: "content",
        message: "Content must not exceed 10000 characters",
        value: data.content
      })
    }

    if (data.type !== undefined && data.type !== null) {
      if (typeof data.type !== "string") {
        errors.push({
          field: "type",
          message: "Type must be a string",
          value: data.type
        })
      } else if (!VALID_NOTE_TYPES.includes(data.type as any)) {
        errors.push({
          field: "type",
          message: `Type must be one of: ${VALID_NOTE_TYPES.join(", ")}`,
          value: data.type
        })
      }
    }

    const allowedFields = ["applicationId", "content", "type"]
    const unexpectedFields = Object.keys(data).filter(field => !allowedFields.includes(field))

    if (unexpectedFields.length > 0) {
      unexpectedFields.forEach(field => {
        errors.push({
          field,
          message: `Unexpected field: ${field}`,
          value: data[field]
        })
      })
    }

    return { isValid: errors.length === 0, errors }
  }

  static validateUpdate(data: any): ValidationResult {
    const errors: ValidationError[] = []

    if (!data || typeof data !== "object") {
      errors.push({
        field: "body",
        message: "Request body must be a valid JSON object",
        value: data
      })
      return { isValid: false, errors }
    }

    const updatableFields = ["content", "type"]
    const providedFields = Object.keys(data)

    if (providedFields.length === 0) {
      errors.push({
        field: "body",
        message: "At least one field must be provided for update",
        value: data
      })
      return { isValid: false, errors }
    }

    if (data.content !== undefined) {
      if (data.content === null) {
        errors.push({
          field: "content",
          message: "Content cannot be null",
          value: data.content
        })
      } else if (typeof data.content !== "string") {
        errors.push({
          field: "content",
          message: "Content must be a string",
          value: data.content
        })
      } else if (data.content.trim() === "") {
        errors.push({
          field: "content",
          message: "Content cannot be empty",
          value: data.content
        })
      } else if (data.content.trim().length > 10000) {
        errors.push({
          field: "content",
          message: "Content must not exceed 10000 characters",
          value: data.content
        })
      }
    }

    if (data.type !== undefined) {
      if (data.type !== null && typeof data.type !== "string") {
        errors.push({
          field: "type",
          message: "Type must be a string or null",
          value: data.type
        })
      } else if (data.type !== null && !VALID_NOTE_TYPES.includes(data.type as any)) {
        errors.push({
          field: "type",
          message: `Type must be one of: ${VALID_NOTE_TYPES.join(", ")}`,
          value: data.type
        })
      }
    }

    const unexpectedFields = providedFields.filter(field => !updatableFields.includes(field))

    if (unexpectedFields.length > 0) {
      unexpectedFields.forEach(field => {
        errors.push({
          field,
          message: `Field '${field}' cannot be updated`,
          value: data[field]
        })
      })
    }

    return { isValid: errors.length === 0, errors }
  }
}

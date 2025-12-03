export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export class ContactValidator {
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

    if (data.companyId === undefined || data.companyId === null) {
      errors.push({
        field: "companyId",
        message: "Company ID is required",
        value: data.companyId
      })
    } else if (!Number.isInteger(data.companyId) || data.companyId <= 0) {
      errors.push({
        field: "companyId",
        message: "Company ID must be a positive integer",
        value: data.companyId
      })
    }

    if (data.name === undefined || data.name === null) {
      errors.push({
        field: "name",
        message: "Name is required",
        value: data.name
      })
    } else if (typeof data.name !== "string") {
      errors.push({
        field: "name",
        message: "Name must be a string",
        value: data.name
      })
    } else if (data.name.trim() === "") {
      errors.push({
        field: "name",
        message: "Name cannot be empty",
        value: data.name
      })
    } else if (data.name.trim().length < 2) {
      errors.push({
        field: "name",
        message: "Name must be at least 2 characters long",
        value: data.name
      })
    } else if (data.name.trim().length > 255) {
      errors.push({
        field: "name",
        message: "Name must not exceed 255 characters",
        value: data.name
      })
    }

    if (data.email === undefined || data.email === null) {
      errors.push({
        field: "email",
        message: "Email is required",
        value: data.email
      })
    } else if (typeof data.email !== "string") {
      errors.push({
        field: "email",
        message: "Email must be a string",
        value: data.email
      })
    } else if (data.email.trim() === "") {
      errors.push({
        field: "email",
        message: "Email cannot be empty",
        value: data.email
      })
    } else if (!this.isValidEmail(data.email.trim())) {
      errors.push({
        field: "email",
        message: "Email must be a valid email address",
        value: data.email
      })
    } else if (data.email.trim().length > 255) {
      errors.push({
        field: "email",
        message: "Email must not exceed 255 characters",
        value: data.email
      })
    }

    if (data.title !== undefined && data.title !== null) {
      if (typeof data.title !== "string") {
        errors.push({
          field: "title",
          message: "Title must be a string",
          value: data.title
        })
      } else if (data.title.trim() !== "" && data.title.trim().length > 255) {
        errors.push({
          field: "title",
          message: "Title must not exceed 255 characters",
          value: data.title
        })
      }
    }

    if (data.phone !== undefined && data.phone !== null) {
      if (typeof data.phone !== "string") {
        errors.push({
          field: "phone",
          message: "Phone must be a string",
          value: data.phone
        })
      } else if (data.phone.trim() !== "" && data.phone.trim().length > 50) {
        errors.push({
          field: "phone",
          message: "Phone must not exceed 50 characters",
          value: data.phone
        })
      } else if (data.phone.trim() !== "" && !this.isValidPhone(data.phone.trim())) {
        errors.push({
          field: "phone",
          message: "Phone must be a valid phone number",
          value: data.phone
        })
      }
    }

    if (data.linkedin !== undefined && data.linkedin !== null) {
      if (typeof data.linkedin !== "string") {
        errors.push({
          field: "linkedin",
          message: "LinkedIn must be a string",
          value: data.linkedin
        })
      } else if (data.linkedin.trim() !== "" && data.linkedin.trim().length > 500) {
        errors.push({
          field: "linkedin",
          message: "LinkedIn URL must not exceed 500 characters",
          value: data.linkedin
        })
      } else if (data.linkedin.trim() !== "" && !this.isValidLinkedInURL(data.linkedin.trim())) {
        errors.push({
          field: "linkedin",
          message: "LinkedIn must be a valid LinkedIn profile URL",
          value: data.linkedin
        })
      }
    }

    const unexpectedFields = Object.keys(data).filter(field =>
      !["companyId", "name", "email", "title", "phone", "linkedin", "notes"].includes(field)
    )

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

    const updatableFields = ["name", "email", "title", "phone", "linkedin", "notes"]
    const providedFields = Object.keys(data)

    if (providedFields.length === 0) {
      errors.push({
        field: "body",
        message: "At least one field must be provided for update",
        value: data
      })
      return { isValid: false, errors }
    }

    if (data.name !== undefined) {
      if (data.name === null) {
        errors.push({
          field: "name",
          message: "Name cannot be null",
          value: data.name
        })
      } else if (typeof data.name !== "string") {
        errors.push({
          field: "name",
          message: "Name must be a string",
          value: data.name
        })
      } else if (data.name.trim() === "") {
        errors.push({
          field: "name",
          message: "Name cannot be empty",
          value: data.name
        })
      } else if (data.name.trim().length < 2) {
        errors.push({
          field: "name",
          message: "Name must be at least 2 characters long",
          value: data.name
        })
      } else if (data.name.trim().length > 255) {
        errors.push({
          field: "name",
          message: "Name must not exceed 255 characters",
          value: data.name
        })
      }
    }

    if (data.email !== undefined) {
      if (data.email === null) {
        errors.push({
          field: "email",
          message: "Email cannot be null",
          value: data.email
        })
      } else if (typeof data.email !== "string") {
        errors.push({
          field: "email",
          message: "Email must be a string",
          value: data.email
        })
      } else if (data.email.trim() === "") {
        errors.push({
          field: "email",
          message: "Email cannot be empty",
          value: data.email
        })
      } else if (!this.isValidEmail(data.email.trim())) {
        errors.push({
          field: "email",
          message: "Email must be a valid email address",
          value: data.email
        })
      } else if (data.email.trim().length > 255) {
        errors.push({
          field: "email",
          message: "Email must not exceed 255 characters",
          value: data.email
        })
      }
    }

    if (data.title !== undefined) {
      if (data.title !== null && typeof data.title !== "string") {
        errors.push({
          field: "title",
          message: "Title must be a string or null",
          value: data.title
        })
      } else if (data.title !== null && data.title.trim() !== "" && data.title.trim().length > 255) {
        errors.push({
          field: "title",
          message: "Title must not exceed 255 characters",
          value: data.title
        })
      }
    }

    if (data.phone !== undefined) {
      if (data.phone !== null && typeof data.phone !== "string") {
        errors.push({
          field: "phone",
          message: "Phone must be a string or null",
          value: data.phone
        })
      } else if (data.phone !== null && data.phone.trim() !== "" && data.phone.trim().length > 50) {
        errors.push({
          field: "phone",
          message: "Phone must not exceed 50 characters",
          value: data.phone
        })
      } else if (data.phone !== null && data.phone.trim() !== "" && !this.isValidPhone(data.phone.trim())) {
        errors.push({
          field: "phone",
          message: "Phone must be a valid phone number",
          value: data.phone
        })
      }
    }

    if (data.linkedin !== undefined) {
      if (data.linkedin !== null && typeof data.linkedin !== "string") {
        errors.push({
          field: "linkedin",
          message: "LinkedIn must be a string or null",
          value: data.linkedin
        })
      } else if (data.linkedin !== null && data.linkedin.trim() !== "" && data.linkedin.trim().length > 500) {
        errors.push({
          field: "linkedin",
          message: "LinkedIn URL must not exceed 500 characters",
          value: data.linkedin
        })
      } else if (
        data.linkedin !== null &&
        data.linkedin.trim() !== "" &&
        !this.isValidLinkedInURL(data.linkedin.trim())
      ) {
        errors.push({
          field: "linkedin",
          message: "LinkedIn must be a valid LinkedIn profile URL",
          value: data.linkedin
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

  static validatePatchUpdate(data: any): ValidationResult {
    return this.validateUpdate(data)
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)\.]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, "").length >= 7
  }

  private static isValidLinkedInURL(url: string): boolean {
    let value = url
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      value = "https://" + value
    }

    try {
      const parsed = new URL(value)
      const host = parsed.hostname.toLowerCase()
      if (!host.includes("linkedin.com")) return false
      return /^\/(in|pub|company)\/[\w\-]+/i.test(parsed.pathname)
    } catch {
      return false
    }
  }
}



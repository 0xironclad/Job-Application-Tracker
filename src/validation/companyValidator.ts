export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export class CompanyValidator {
  static validateCreate(data: any): ValidationResult {
    const errors: ValidationError[] = []

    // Required field: name
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Name is required and must be a non-empty string',
        value: data.name
      })
    } else if (data.name.trim().length > 255) {
      errors.push({
        field: 'name',
        message: 'Name must not exceed 255 characters',
        value: data.name
      })
    }

    // Optional fields validation
    if (data.website !== undefined) {
      if (typeof data.website !== 'string') {
        errors.push({
          field: 'website',
          message: 'Website must be a string',
          value: data.website
        })
      } else if (data.website.length > 500) {
        errors.push({
          field: 'website',
          message: 'Website must not exceed 500 characters',
          value: data.website
        })
      } else if (data.website && !this.isValidURL(data.website)) {
        errors.push({
          field: 'website',
          message: 'Website must be a valid URL',
          value: data.website
        })
      }
    }

    if (data.industry !== undefined) {
      if (typeof data.industry !== 'string') {
        errors.push({
          field: 'industry',
          message: 'Industry must be a string',
          value: data.industry
        })
      } else if (data.industry.length > 100) {
        errors.push({
          field: 'industry',
          message: 'Industry must not exceed 100 characters',
          value: data.industry
        })
      }
    }

    if (data.size !== undefined) {
      if (typeof data.size !== 'string') {
        errors.push({
          field: 'size',
          message: 'Size must be a string',
          value: data.size
        })
      } else if (data.size.length > 50) {
        errors.push({
          field: 'size',
          message: 'Size must not exceed 50 characters',
          value: data.size
        })
      }
    }

    if (data.location !== undefined) {
      if (typeof data.location !== 'string') {
        errors.push({
          field: 'location',
          message: 'Location must be a string',
          value: data.location
        })
      } else if (data.location.length > 200) {
        errors.push({
          field: 'location',
          message: 'Location must not exceed 200 characters',
          value: data.location
        })
      }
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push({
          field: 'description',
          message: 'Description must be a string',
          value: data.description
        })
      } else if (data.description.length > 1000) {
        errors.push({
          field: 'description',
          message: 'Description must not exceed 1000 characters',
          value: data.description
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateUpdate(data: any): ValidationResult {
    const errors: ValidationError[] = []

    // For updates, all fields are optional but must be valid if provided
    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
        errors.push({
          field: 'name',
          message: 'Name must be a non-empty string',
          value: data.name
        })
      } else if (data.name.trim().length > 255) {
        errors.push({
          field: 'name',
          message: 'Name must not exceed 255 characters',
          value: data.name
        })
      }
    }

    if (data.website !== undefined) {
      if (data.website !== null && typeof data.website !== 'string') {
        errors.push({
          field: 'website',
          message: 'Website must be a string or null',
          value: data.website
        })
      } else if (data.website && data.website.length > 500) {
        errors.push({
          field: 'website',
          message: 'Website must not exceed 500 characters',
          value: data.website
        })
      } else if (data.website && !this.isValidURL(data.website)) {
        errors.push({
          field: 'website',
          message: 'Website must be a valid URL',
          value: data.website
        })
      }
    }

    if (data.industry !== undefined) {
      if (data.industry !== null && typeof data.industry !== 'string') {
        errors.push({
          field: 'industry',
          message: 'Industry must be a string or null',
          value: data.industry
        })
      } else if (data.industry && data.industry.length > 100) {
        errors.push({
          field: 'industry',
          message: 'Industry must not exceed 100 characters',
          value: data.industry
        })
      }
    }

    if (data.size !== undefined) {
      if (data.size !== null && typeof data.size !== 'string') {
        errors.push({
          field: 'size',
          message: 'Size must be a string or null',
          value: data.size
        })
      } else if (data.size && data.size.length > 50) {
        errors.push({
          field: 'size',
          message: 'Size must not exceed 50 characters',
          value: data.size
        })
      }
    }

    if (data.location !== undefined) {
      if (data.location !== null && typeof data.location !== 'string') {
        errors.push({
          field: 'location',
          message: 'Location must be a string or null',
          value: data.location
        })
      } else if (data.location && data.location.length > 200) {
        errors.push({
          field: 'location',
          message: 'Location must not exceed 200 characters',
          value: data.location
        })
      }
    }

    if (data.description !== undefined) {
      if (data.description !== null && typeof data.description !== 'string') {
        errors.push({
          field: 'description',
          message: 'Description must be a string or null',
          value: data.description
        })
      } else if (data.description && data.description.length > 1000) {
        errors.push({
          field: 'description',
          message: 'Description must not exceed 1000 characters',
          value: data.description
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateQueryParams(query: any): ValidationResult {
    const errors: ValidationError[] = []

    if (query.search !== undefined && typeof query.search !== 'string') {
      errors.push({
        field: 'search',
        message: 'Search must be a string',
        value: query.search
      })
    }

    if (query.industry !== undefined && typeof query.industry !== 'string') {
      errors.push({
        field: 'industry',
        message: 'Industry filter must be a string',
        value: query.industry
      })
    }

    if (query.size !== undefined && typeof query.size !== 'string') {
      errors.push({
        field: 'size',
        message: 'Size filter must be a string',
        value: query.size
      })
    }

    if (query.location !== undefined && typeof query.location !== 'string') {
      errors.push({
        field: 'location',
        message: 'Location filter must be a string',
        value: query.location
      })
    }

    // Pagination validation
    if (query.page !== undefined) {
      const page = parseInt(query.page as string, 10)
      if (isNaN(page) || page < 1) {
        errors.push({
          field: 'page',
          message: 'Page must be a positive integer',
          value: query.page
        })
      }
    }

    if (query.pageSize !== undefined) {
      const pageSize = parseInt(query.pageSize as string, 10)
      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        errors.push({
          field: 'pageSize',
          message: 'Page size must be an integer between 1 and 100',
          value: query.pageSize
        })
      }
    }

    if (query.limit !== undefined) {
      const limit = parseInt(query.limit as string, 10)
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push({
          field: 'limit',
          message: 'Limit must be an integer between 1 and 100',
          value: query.limit
        })
      }
    }

    if (query.offset !== undefined) {
      const offset = parseInt(query.offset as string, 10)
      if (isNaN(offset) || offset < 0) {
        errors.push({
          field: 'offset',
          message: 'Offset must be a non-negative integer',
          value: query.offset
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private static isValidURL(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      // Try with protocol prefix if missing
      if (!url.match(/^https?:\/\//)) {
        try {
          new URL(`https://${url}`)
          return true
        } catch {
          return false
        }
      }
      return false
    }
  }
}


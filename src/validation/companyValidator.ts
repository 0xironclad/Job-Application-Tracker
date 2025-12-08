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
  // Valid company size options
  private static readonly VALID_SIZES = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'
  ]

  // Common industry categories
  private static readonly COMMON_INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing',
    'Consulting', 'Media', 'Real Estate', 'Government', 'Non-profit', 'Automotive',
    'Energy', 'Telecommunications', 'Transportation', 'Agriculture', 'Construction',
    'Entertainment', 'Food & Beverage', 'Insurance', 'Legal', 'Pharmaceutical',
    'Software', 'Aerospace', 'Banking', 'Biotechnology', 'Chemical', 'Defense',
    'E-commerce', 'Fashion', 'Gaming', 'Hospitality', 'Logistics', 'Mining',
    'Publishing', 'Renewable Energy', 'Security', 'Sports', 'Tourism', 'Utilities'
  ]

  static validateCreate(data: any): ValidationResult {
    const errors: ValidationError[] = []

    // Validate data is an object
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'body',
        message: 'Request body must be a valid JSON object',
        value: data
      })
      return { isValid: false, errors }
    }

    // Required field: name
    if (data.name === undefined || data.name === null) {
      errors.push({
        field: 'name',
        message: 'Name is required',
        value: data.name
      })
    } else if (typeof data.name !== 'string') {
      errors.push({
        field: 'name',
        message: 'Name must be a string',
        value: data.name
      })
    } else if (data.name.trim() === '') {
      errors.push({
        field: 'name',
        message: 'Name cannot be empty',
        value: data.name
      })
    } else if (data.name.trim().length < 2) {
      errors.push({
        field: 'name',
        message: 'Name must be at least 2 characters long',
        value: data.name
      })
    } else if (data.name.trim().length > 255) {
      errors.push({
        field: 'name',
        message: 'Name must not exceed 255 characters',
        value: data.name
      })
    } else if (!/^[a-zA-Z0-9\s\.\-&,'"()]+$/.test(data.name.trim())) {
      errors.push({
        field: 'name',
        message: 'Name contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed',
        value: data.name
      })
    }

    // Optional field: website
    if (data.website !== undefined && data.website !== null) {
      if (typeof data.website !== 'string') {
        errors.push({
          field: 'website',
          message: 'Website must be a string',
          value: data.website
        })
      } else if (data.website.trim() !== '' && data.website.trim().length > 500) {
        errors.push({
          field: 'website',
          message: 'Website URL must not exceed 500 characters',
          value: data.website
        })
      } else if (data.website.trim() !== '' && !this.isValidURL(data.website.trim())) {
        errors.push({
          field: 'website',
          message: 'Website must be a valid URL (e.g., https://example.com or example.com)',
          value: data.website
        })
      }
    }

    if (data.industry !== undefined && data.industry !== null) {
      if (typeof data.industry !== 'string') {
        errors.push({
          field: 'industry',
          message: 'Industry must be a string',
          value: data.industry
        })
      } else if (data.industry.trim().length > 100) {
        errors.push({
          field: 'industry',
          message: 'Industry must not exceed 100 characters',
          value: data.industry
        })
      } else if (data.industry.trim() !== '' && !/^[a-zA-Z0-9\s\.\-&,'"()/]+$/.test(data.industry.trim())) {
        errors.push({
          field: 'industry',
          message: 'Industry contains invalid characters',
          value: data.industry
        })
      }
    }

    if (data.size !== undefined && data.size !== null) {
      if (typeof data.size !== 'string') {
        errors.push({
          field: 'size',
          message: 'Size must be a string',
          value: data.size
        })
      } else if (data.size.trim().length > 50) {
        errors.push({
          field: 'size',
          message: 'Size must not exceed 50 characters',
          value: data.size
        })
      } else if (data.size.trim() !== '' && !this.VALID_SIZES.includes(data.size.trim()) && !/^\d+[\-\+]?(\d+)?$/.test(data.size.trim())) {
        // Allow either predefined sizes or numeric ranges like "100-500", "1000+", "50"
        errors.push({
          field: 'size',
          message: `Size must be one of: ${this.VALID_SIZES.join(', ')} or a numeric range (e.g., "100-500", "1000+")`,
          value: data.size
        })
      }
    }

    if (data.location !== undefined && data.location !== null) {
      if (typeof data.location !== 'string') {
        errors.push({
          field: 'location',
          message: 'Location must be a string',
          value: data.location
        })
      } else if (data.location.trim().length > 200) {
        errors.push({
          field: 'location',
          message: 'Location must not exceed 200 characters',
          value: data.location
        })
      } else if (data.location.trim() !== '' && !/^[a-zA-Z0-9\s\.\-,'"()]+$/.test(data.location.trim())) {
        errors.push({
          field: 'location',
          message: 'Location contains invalid characters',
          value: data.location
        })
      }
    }

    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== 'string') {
        errors.push({
          field: 'description',
          message: 'Description must be a string',
          value: data.description
        })
      } else if (data.description.length > 2000) {
        errors.push({
          field: 'description',
          message: 'Description must not exceed 2000 characters',
          value: data.description
        })
      } else if (data.description.trim().length > 0 && data.description.trim().length < 10) {
        errors.push({
          field: 'description',
          message: 'Description must be at least 10 characters long if provided',
          value: data.description
        })
      }
    }

    // Check for unexpected fields
    const allowedFields = ['name', 'website', 'industry', 'size', 'location', 'description']
    const providedFields = Object.keys(data)
    const unexpectedFields = providedFields.filter(field => !allowedFields.includes(field))
    
    if (unexpectedFields.length > 0) {
      errors.push({
        field: 'unknown',
        message: `Unexpected fields: ${unexpectedFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`,
        value: unexpectedFields
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateUpdate(data: any): ValidationResult {
    const errors: ValidationError[] = []

    // Validate data is an object
    if (!data || typeof data !== 'object') {
      errors.push({
        field: 'body',
        message: 'Request body must be a valid JSON object',
        value: data
      })
      return { isValid: false, errors }
    }

    // Check if at least one field is provided for update
    const allowedFields = ['name', 'website', 'industry', 'size', 'location', 'description']
    const providedFields = Object.keys(data).filter(field => allowedFields.includes(field))
    
    if (providedFields.length === 0) {
      errors.push({
        field: 'body',
        message: `At least one field must be provided for update. Allowed fields: ${allowedFields.join(', ')}`,
        value: data
      })
    }

    // For updates, all fields are optional but must be valid if provided
    if (data.name !== undefined) {
      if (data.name === null) {
        errors.push({
          field: 'name',
          message: 'Name cannot be null',
          value: data.name
        })
      } else if (typeof data.name !== 'string') {
        errors.push({
          field: 'name',
          message: 'Name must be a string',
          value: data.name
        })
      } else if (data.name.trim() === '') {
        errors.push({
          field: 'name',
          message: 'Name cannot be empty',
          value: data.name
        })
      } else if (data.name.trim().length < 2) {
        errors.push({
          field: 'name',
          message: 'Name must be at least 2 characters long',
          value: data.name
        })
      } else if (data.name.trim().length > 255) {
        errors.push({
          field: 'name',
          message: 'Name must not exceed 255 characters',
          value: data.name
        })
      } else if (!/^[a-zA-Z0-9\s\.\-&,'"()]+$/.test(data.name.trim())) {
        errors.push({
          field: 'name',
          message: 'Name contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed',
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
      } else if (data.website && data.website.trim().length > 500) {
        errors.push({
          field: 'website',
          message: 'Website URL must not exceed 500 characters',
          value: data.website
        })
      } else if (data.website && data.website.trim() !== '' && !this.isValidURL(data.website.trim())) {
        errors.push({
          field: 'website',
          message: 'Website must be a valid URL (e.g., https://example.com or example.com)',
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
      } else if (data.industry && data.industry.trim().length > 100) {
        errors.push({
          field: 'industry',
          message: 'Industry must not exceed 100 characters',
          value: data.industry
        })
      } else if (data.industry && data.industry.trim() !== '' && !/^[a-zA-Z0-9\s\.\-&,'"()/]+$/.test(data.industry.trim())) {
        errors.push({
          field: 'industry',
          message: 'Industry contains invalid characters',
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
      } else if (data.size && data.size.trim().length > 50) {
        errors.push({
          field: 'size',
          message: 'Size must not exceed 50 characters',
          value: data.size
        })
      } else if (data.size && data.size.trim() !== '' && !this.VALID_SIZES.includes(data.size.trim()) && !/^\d+[\-\+]?(\d+)?$/.test(data.size.trim())) {
        errors.push({
          field: 'size',
          message: `Size must be one of: ${this.VALID_SIZES.join(', ')} or a numeric range (e.g., "100-500", "1000+")`,
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
      } else if (data.location && data.location.trim().length > 200) {
        errors.push({
          field: 'location',
          message: 'Location must not exceed 200 characters',
          value: data.location
        })
      } else if (data.location && data.location.trim() !== '' && !/^[a-zA-Z0-9\s\.\-,'"()]+$/.test(data.location.trim())) {
        errors.push({
          field: 'location',
          message: 'Location contains invalid characters',
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
      } else if (data.description && data.description.length > 2000) {
        errors.push({
          field: 'description',
          message: 'Description must not exceed 2000 characters',
          value: data.description
        })
      } else if (data.description && data.description.trim().length > 0 && data.description.trim().length < 10) {
        errors.push({
          field: 'description',
          message: 'Description must be at least 10 characters long if provided',
          value: data.description
        })
      }
    }

    // Check for unexpected fields
    const unexpectedFields = Object.keys(data).filter(field => !allowedFields.includes(field))
    
    if (unexpectedFields.length > 0) {
      errors.push({
        field: 'unknown',
        message: `Unexpected fields: ${unexpectedFields.join(', ')}. Allowed fields: ${allowedFields.join(', ')}`,
        value: unexpectedFields
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateQueryParams(query: any): ValidationResult {
    const errors: ValidationError[] = []

    // Search parameter (general search across name, industry, description)
    if (query.search !== undefined) {
      if (typeof query.search !== 'string') {
        errors.push({
          field: 'search',
          message: 'Search must be a string',
          value: query.search
        })
      } else if (query.search.length > 100) {
        errors.push({
          field: 'search',
          message: 'Search query must not exceed 100 characters',
          value: query.search
        })
      } else if (query.search.trim().length > 0 && query.search.trim().length < 2) {
        errors.push({
          field: 'search',
          message: 'Search query must be at least 2 characters long',
          value: query.search
        })
      }
    }

    // Name filter (specific name filtering)
    if (query.name !== undefined) {
      if (typeof query.name !== 'string') {
        errors.push({
          field: 'name',
          message: 'Name filter must be a string',
          value: query.name
        })
      } else if (query.name.length > 255) {
        errors.push({
          field: 'name',
          message: 'Name filter must not exceed 255 characters',
          value: query.name
        })
      }
    }

    // Industry filter
    if (query.industry !== undefined) {
      if (typeof query.industry !== 'string') {
        errors.push({
          field: 'industry',
          message: 'Industry filter must be a string',
          value: query.industry
        })
      } else if (query.industry.length > 100) {
        errors.push({
          field: 'industry',
          message: 'Industry filter must not exceed 100 characters',
          value: query.industry
        })
      }
    }

    // Size filter
    if (query.size !== undefined) {
      if (typeof query.size !== 'string') {
        errors.push({
          field: 'size',
          message: 'Size filter must be a string',
          value: query.size
        })
      } else if (query.size.length > 50) {
        errors.push({
          field: 'size',
          message: 'Size filter must not exceed 50 characters',
          value: query.size
        })
      }
    }

    // Location filter
    if (query.location !== undefined) {
      if (typeof query.location !== 'string') {
        errors.push({
          field: 'location',
          message: 'Location filter must be a string',
          value: query.location
        })
      } else if (query.location.length > 200) {
        errors.push({
          field: 'location',
          message: 'Location filter must not exceed 200 characters',
          value: query.location
        })
      }
    }

    // Sorting validation
    const validSortFields = ['name', 'industry', 'size', 'location', 'createdAt', 'updatedAt']
    const validSortOrders = ['ASC', 'DESC', 'asc', 'desc']

    if (query.sort !== undefined) {
      if (typeof query.sort !== 'string') {
        errors.push({
          field: 'sort',
          message: 'Sort field must be a string',
          value: query.sort
        })
      } else if (!validSortFields.includes(query.sort)) {
        errors.push({
          field: 'sort',
          message: `Sort field must be one of: ${validSortFields.join(', ')}`,
          value: query.sort
        })
      }
    }

    if (query.order !== undefined) {
      if (typeof query.order !== 'string') {
        errors.push({
          field: 'order',
          message: 'Sort order must be a string',
          value: query.order
        })
      } else if (!validSortOrders.includes(query.order)) {
        errors.push({
          field: 'order',
          message: 'Sort order must be one of: ASC, DESC (case insensitive)',
          value: query.order
        })
      }
    }

    // Pagination validation
    if (query.page !== undefined) {
      const page = parseInt(query.page as string, 10)
      if (isNaN(page)) {
        errors.push({
          field: 'page',
          message: 'Page must be a number',
          value: query.page
        })
      } else if (page < 1) {
        errors.push({
          field: 'page',
          message: 'Page must be a positive integer (minimum 1)',
          value: query.page
        })
      } else if (page > 10000) {
        errors.push({
          field: 'page',
          message: 'Page number too large (maximum 10000)',
          value: query.page
        })
      }
    }

    if (query.pageSize !== undefined) {
      const pageSize = parseInt(query.pageSize as string, 10)
      if (isNaN(pageSize)) {
        errors.push({
          field: 'pageSize',
          message: 'Page size must be a number',
          value: query.pageSize
        })
      } else if (pageSize < 1) {
        errors.push({
          field: 'pageSize',
          message: 'Page size must be a positive integer (minimum 1)',
          value: query.pageSize
        })
      } else if (pageSize > 100) {
        errors.push({
          field: 'pageSize',
          message: 'Page size too large (maximum 100)',
          value: query.pageSize
        })
      }
    }

    if (query.limit !== undefined) {
      const limit = parseInt(query.limit as string, 10)
      if (isNaN(limit)) {
        errors.push({
          field: 'limit',
          message: 'Limit must be a number',
          value: query.limit
        })
      } else if (limit < 1) {
        errors.push({
          field: 'limit',
          message: 'Limit must be a positive integer (minimum 1)',
          value: query.limit
        })
      } else if (limit > 100) {
        errors.push({
          field: 'limit',
          message: 'Limit too large (maximum 100)',
          value: query.limit
        })
      }
    }

    if (query.offset !== undefined) {
      const offset = parseInt(query.offset as string, 10)
      if (isNaN(offset)) {
        errors.push({
          field: 'offset',
          message: 'Offset must be a number',
          value: query.offset
        })
      } else if (offset < 0) {
        errors.push({
          field: 'offset',
          message: 'Offset must be a non-negative integer',
          value: query.offset
        })
      } else if (offset > 100000) {
        errors.push({
          field: 'offset',
          message: 'Offset too large (maximum 100000)',
          value: query.offset
        })
      }
    }

    // Validate pagination consistency
    if (query.page !== undefined && query.offset !== undefined) {
      errors.push({
        field: 'pagination',
        message: 'Cannot use both page-based (page/pageSize) and offset-based (limit/offset) pagination in the same request',
        value: { page: query.page, offset: query.offset }
      })
    }

    if (query.pageSize !== undefined && query.limit !== undefined) {
      errors.push({
        field: 'pagination',
        message: 'Cannot use both pageSize and limit in the same request',
        value: { pageSize: query.pageSize, limit: query.limit }
      })
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  private static isValidURL(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false
    }

    const trimmedUrl = url.trim()
    
    // Check for obviously invalid URLs
    if (trimmedUrl.length === 0 || trimmedUrl.includes(' ') || trimmedUrl.includes('\n') || trimmedUrl.includes('\t')) {
      return false
    }

    // Check for dangerous protocols
    if (trimmedUrl.match(/^(javascript|data|vbscript|file|ftp):/i)) {
      return false
    }

    try {
      // Try parsing as-is first
      new URL(trimmedUrl)
      return true
    } catch {
      // If it fails, try with https:// prefix
      if (!trimmedUrl.match(/^https?:\/\//i)) {
        try {
          const urlWithProtocol = `https://${trimmedUrl}`
          const parsedUrl = new URL(urlWithProtocol)
          
          // Additional validation for the parsed URL
          if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
            return false
          }
          
          // Check for valid TLD (basic check)
          const hostname = parsedUrl.hostname.toLowerCase()
          if (!hostname.includes('.') && hostname !== 'localhost') {
            return false
          }
          
          // Ensure hostname doesn't start or end with dot or dash
          if (hostname.startsWith('.') || hostname.endsWith('.') || 
              hostname.startsWith('-') || hostname.endsWith('-')) {
            return false
          }
          
          // Check for consecutive dots
          if (hostname.includes('..')) {
            return false
          }
          
          return true
        } catch {
          return false
        }
      }
      return false
    }
  }
}


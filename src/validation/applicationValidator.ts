import { ApplicationStatus, WorkType } from "../database/types"

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

const VALID_STATUSES: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer', 'rejected', 'withdrawn']
const VALID_WORK_TYPES: WorkType[] = ['remote', 'hybrid', 'onsite']

export class ApplicationValidator {
  static validateCreate(data: any): ValidationResult {
    const errors: ValidationError[] = []

    // Required fields
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Title is required and must be a non-empty string',
        value: data.title
      })
    } else if (data.title.trim().length > 255) {
      errors.push({
        field: 'title',
        message: 'Title must not exceed 255 characters',
        value: data.title
      })
    }

    if (!data.status) {
      errors.push({
        field: 'status',
        message: 'Status is required',
        value: data.status
      })
    } else if (!VALID_STATUSES.includes(data.status)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
        value: data.status
      })
    }

    if (!data.appliedAt) {
      errors.push({
        field: 'appliedAt',
        message: 'Application date is required',
        value: data.appliedAt
      })
    } else {
      const date = new Date(data.appliedAt)
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'appliedAt',
          message: 'Application date must be a valid date',
          value: data.appliedAt
        })
      } else if (date > new Date()) {
        errors.push({
          field: 'appliedAt',
          message: 'Application date cannot be in the future',
          value: data.appliedAt
        })
      }
    }

    // Optional fields validation
    if (data.companyId !== undefined && data.companyId !== null) {
      if (typeof data.companyId !== 'number' || !Number.isInteger(data.companyId) || data.companyId <= 0) {
        errors.push({
          field: 'companyId',
          message: 'Company ID must be a positive integer',
          value: data.companyId
        })
      }
    }

    if (data.jobPostingUrl !== undefined && data.jobPostingUrl !== null && data.jobPostingUrl !== '') {
      if (typeof data.jobPostingUrl !== 'string') {
        errors.push({
          field: 'jobPostingUrl',
          message: 'Job posting URL must be a string',
          value: data.jobPostingUrl
        })
      } else {
        try {
          new URL(data.jobPostingUrl)
        } catch (e) {
          errors.push({
            field: 'jobPostingUrl',
            message: 'Job posting URL must be a valid URL',
            value: data.jobPostingUrl
          })
        }
      }
    }

    // Salary validation
    if (data.salaryMin !== undefined && data.salaryMin !== null) {
      if (typeof data.salaryMin !== 'number' || !Number.isInteger(data.salaryMin) || data.salaryMin < 0) {
        errors.push({
          field: 'salaryMin',
          message: 'Minimum salary must be a non-negative integer',
          value: data.salaryMin
        })
      }
    }

    if (data.salaryMax !== undefined && data.salaryMax !== null) {
      if (typeof data.salaryMax !== 'number' || !Number.isInteger(data.salaryMax) || data.salaryMax < 0) {
        errors.push({
          field: 'salaryMax',
          message: 'Maximum salary must be a non-negative integer',
          value: data.salaryMax
        })
      }
    }

    // Validate salary range
    if (data.salaryMin !== undefined && data.salaryMin !== null && 
        data.salaryMax !== undefined && data.salaryMax !== null) {
      if (typeof data.salaryMin === 'number' && typeof data.salaryMax === 'number' && 
          data.salaryMin > data.salaryMax) {
        errors.push({
          field: 'salaryRange',
          message: 'Minimum salary cannot be greater than maximum salary',
          value: { min: data.salaryMin, max: data.salaryMax }
        })
      }
    }

    if (data.location !== undefined && data.location !== null && data.location !== '') {
      if (typeof data.location !== 'string') {
        errors.push({
          field: 'location',
          message: 'Location must be a string',
          value: data.location
        })
      } else if (data.location.length > 255) {
        errors.push({
          field: 'location',
          message: 'Location must not exceed 255 characters',
          value: data.location
        })
      }
    }

    if (data.workType !== undefined && data.workType !== null && data.workType !== '') {
      if (!VALID_WORK_TYPES.includes(data.workType)) {
        errors.push({
          field: 'workType',
          message: `Work type must be one of: ${VALID_WORK_TYPES.join(', ')}`,
          value: data.workType
        })
      }
    }

    if (data.notes !== undefined && data.notes !== null && data.notes !== '') {
      if (typeof data.notes !== 'string') {
        errors.push({
          field: 'notes',
          message: 'Notes must be a string',
          value: data.notes
        })
      } else if (data.notes.length > 5000) {
        errors.push({
          field: 'notes',
          message: 'Notes must not exceed 5000 characters',
          value: `${data.notes.substring(0, 50)}...`
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

    // Validate only provided fields
    if (data.title !== undefined) {
      if (data.title === null || data.title === '' || (typeof data.title === 'string' && data.title.trim() === '')) {
        errors.push({
          field: 'title',
          message: 'Title cannot be empty',
          value: data.title
        })
      } else if (typeof data.title === 'string' && data.title.trim().length > 255) {
        errors.push({
          field: 'title',
          message: 'Title must not exceed 255 characters',
          value: data.title
        })
      }
    }

    if (data.status !== undefined) {
      if (!VALID_STATUSES.includes(data.status)) {
        errors.push({
          field: 'status',
          message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          value: data.status
        })
      }
    }

    if (data.appliedAt !== undefined) {
      const date = new Date(data.appliedAt)
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'appliedAt',
          message: 'Application date must be a valid date',
          value: data.appliedAt
        })
      } else if (date > new Date()) {
        errors.push({
          field: 'appliedAt',
          message: 'Application date cannot be in the future',
          value: data.appliedAt
        })
      }
    }

    if (data.companyId !== undefined && data.companyId !== null) {
      if (typeof data.companyId !== 'number' || !Number.isInteger(data.companyId) || data.companyId <= 0) {
        errors.push({
          field: 'companyId',
          message: 'Company ID must be a positive integer',
          value: data.companyId
        })
      }
    }

    if (data.jobPostingUrl !== undefined && data.jobPostingUrl !== null && data.jobPostingUrl !== '') {
      if (typeof data.jobPostingUrl !== 'string') {
        errors.push({
          field: 'jobPostingUrl',
          message: 'Job posting URL must be a string',
          value: data.jobPostingUrl
        })
      } else {
        try {
          new URL(data.jobPostingUrl)
        } catch (e) {
          errors.push({
            field: 'jobPostingUrl',
            message: 'Job posting URL must be a valid URL',
            value: data.jobPostingUrl
          })
        }
      }
    }

    // Salary validation
    if (data.salaryMin !== undefined && data.salaryMin !== null) {
      if (typeof data.salaryMin !== 'number' || !Number.isInteger(data.salaryMin) || data.salaryMin < 0) {
        errors.push({
          field: 'salaryMin',
          message: 'Minimum salary must be a non-negative integer',
          value: data.salaryMin
        })
      }
    }

    if (data.salaryMax !== undefined && data.salaryMax !== null) {
      if (typeof data.salaryMax !== 'number' || !Number.isInteger(data.salaryMax) || data.salaryMax < 0) {
        errors.push({
          field: 'salaryMax',
          message: 'Maximum salary must be a non-negative integer',
          value: data.salaryMax
        })
      }
    }

    // Validate salary range if both are provided
    if (data.salaryMin !== undefined && data.salaryMin !== null && 
        data.salaryMax !== undefined && data.salaryMax !== null) {
      if (typeof data.salaryMin === 'number' && typeof data.salaryMax === 'number' && 
          data.salaryMin > data.salaryMax) {
        errors.push({
          field: 'salaryRange',
          message: 'Minimum salary cannot be greater than maximum salary',
          value: { min: data.salaryMin, max: data.salaryMax }
        })
      }
    }

    if (data.location !== undefined && data.location !== null && data.location !== '') {
      if (typeof data.location !== 'string') {
        errors.push({
          field: 'location',
          message: 'Location must be a string',
          value: data.location
        })
      } else if (data.location.length > 255) {
        errors.push({
          field: 'location',
          message: 'Location must not exceed 255 characters',
          value: data.location
        })
      }
    }

    if (data.workType !== undefined && data.workType !== null && data.workType !== '') {
      if (!VALID_WORK_TYPES.includes(data.workType)) {
        errors.push({
          field: 'workType',
          message: `Work type must be one of: ${VALID_WORK_TYPES.join(', ')}`,
          value: data.workType
        })
      }
    }

    if (data.notes !== undefined && data.notes !== null && data.notes !== '') {
      if (typeof data.notes !== 'string') {
        errors.push({
          field: 'notes',
          message: 'Notes must be a string',
          value: data.notes
        })
      } else if (data.notes.length > 5000) {
        errors.push({
          field: 'notes',
          message: 'Notes must not exceed 5000 characters',
          value: `${data.notes.substring(0, 50)}...`
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateQueryParams(params: any): ValidationResult {
    const errors: ValidationError[] = []

    // Validate status filter
    if (params.status !== undefined && params.status !== '') {
      if (!VALID_STATUSES.includes(params.status)) {
        errors.push({
          field: 'status',
          message: `Status filter must be one of: ${VALID_STATUSES.join(', ')}`,
          value: params.status
        })
      }
    }

    // Validate company filter
    if (params.company !== undefined && params.company !== '') {
      const companyId = parseInt(params.company, 10)
      if (isNaN(companyId) || companyId <= 0) {
        errors.push({
          field: 'company',
          message: 'Company filter must be a positive integer',
          value: params.company
        })
      }
    }

    // Validate date range filters
    if (params.dateFrom !== undefined && params.dateFrom !== '') {
      const date = new Date(params.dateFrom)
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'dateFrom',
          message: 'Date from must be a valid date (YYYY-MM-DD)',
          value: params.dateFrom
        })
      }
    }

    if (params.dateTo !== undefined && params.dateTo !== '') {
      const date = new Date(params.dateTo)
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'dateTo',
          message: 'Date to must be a valid date (YYYY-MM-DD)',
          value: params.dateTo
        })
      }
    }

    // Validate date range logic
    if (params.dateFrom && params.dateTo) {
      const dateFrom = new Date(params.dateFrom)
      const dateTo = new Date(params.dateTo)
      if (!isNaN(dateFrom.getTime()) && !isNaN(dateTo.getTime()) && dateFrom > dateTo) {
        errors.push({
          field: 'dateRange',
          message: 'Date from cannot be after date to',
          value: { from: params.dateFrom, to: params.dateTo }
        })
      }
    }

    // Validate salary filters
    if (params.salaryMin !== undefined && params.salaryMin !== '') {
      const salary = parseInt(params.salaryMin, 10)
      if (isNaN(salary) || salary < 0) {
        errors.push({
          field: 'salaryMin',
          message: 'Minimum salary filter must be a non-negative integer',
          value: params.salaryMin
        })
      }
    }

    if (params.salaryMax !== undefined && params.salaryMax !== '') {
      const salary = parseInt(params.salaryMax, 10)
      if (isNaN(salary) || salary < 0) {
        errors.push({
          field: 'salaryMax',
          message: 'Maximum salary filter must be a non-negative integer',
          value: params.salaryMax
        })
      }
    }

    // Validate work type filter
    if (params.workType !== undefined && params.workType !== '') {
      if (!VALID_WORK_TYPES.includes(params.workType)) {
        errors.push({
          field: 'workType',
          message: `Work type filter must be one of: ${VALID_WORK_TYPES.join(', ')}`,
          value: params.workType
        })
      }
    }

    // Validate sorting
    if (params.sort !== undefined && params.sort !== '') {
      const validSortFields = ['application_date', 'created_at', 'status', 'position_title', 'company_id']
      if (!validSortFields.includes(params.sort)) {
        errors.push({
          field: 'sort',
          message: `Sort field must be one of: ${validSortFields.join(', ')}`,
          value: params.sort
        })
      }
    }

    if (params.order !== undefined && params.order !== '') {
      const upperOrder = params.order.toUpperCase()
      if (upperOrder !== 'ASC' && upperOrder !== 'DESC') {
        errors.push({
          field: 'order',
          message: 'Sort order must be ASC or DESC',
          value: params.order
        })
      }
    }

    // Validate pagination
    if (params.page !== undefined && params.page !== '') {
      const page = parseInt(params.page, 10)
      if (isNaN(page) || page < 1) {
        errors.push({
          field: 'page',
          message: 'Page must be a positive integer',
          value: params.page
        })
      }
    }

    if (params.pageSize !== undefined && params.pageSize !== '') {
      const pageSize = parseInt(params.pageSize, 10)
      if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
        errors.push({
          field: 'pageSize',
          message: 'Page size must be an integer between 1 and 100',
          value: params.pageSize
        })
      }
    }

    if (params.limit !== undefined && params.limit !== '') {
      const limit = parseInt(params.limit, 10)
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push({
          field: 'limit',
          message: 'Limit must be an integer between 1 and 100',
          value: params.limit
        })
      }
    }

    if (params.offset !== undefined && params.offset !== '') {
      const offset = parseInt(params.offset, 10)
      if (isNaN(offset) || offset < 0) {
        errors.push({
          field: 'offset',
          message: 'Offset must be a non-negative integer',
          value: params.offset
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      date = new Date(date)
    }
    return date.toISOString().split('T')[0]
  }
}


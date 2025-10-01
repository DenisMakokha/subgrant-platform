/**
 * Validation schemas for grants SSOT implementation
 */

const Joi = require('joi');

// Base grant validation schema
const GrantBaseSchema = Joi.object({
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Grant name must be at least 2 characters',
      'string.max': 'Grant name cannot exceed 255 characters',
      'any.required': 'Grant name is required'
    }),
  
  grant_number: Joi.string().pattern(/^GRN-\d{6}-\d{4}$/).optional()
    .messages({
      'string.pattern.base': 'Grant number must follow format GRN-YYYYMM-####'
    }),
  
  description: Joi.string().max(2000).optional().allow(''),
  
  open_date: Joi.date().iso().required()
    .messages({
      'any.required': 'Start date is required',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
  
  close_date: Joi.date().iso().min(Joi.ref('open_date')).required()
    .messages({
      'any.required': 'End date is required',
      'date.min': 'End date must be on or after start date',
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)'
    }),
  
  currency: Joi.string().length(3).uppercase().required()
    .valid('USD', 'EUR', 'GBP', 'KES', 'CAD', 'AUD')
    .messages({
      'string.length': 'Currency must be a 3-letter code',
      'any.only': 'Currency must be one of: USD, EUR, GBP, KES, CAD, AUD',
      'any.required': 'Currency is required'
    }),
  
  budget_amount: Joi.number().min(0).precision(2).required()
    .messages({
      'number.min': 'Budget amount must be non-negative',
      'any.required': 'Budget amount is required'
    }),
  
  program_manager: Joi.string().uuid().optional().allow(null),
  
  donor_name: Joi.string().max(255).optional().allow(''),
  
  donor_contact_name: Joi.string().max(255).optional().allow(''),
  
  donor_contact_email: Joi.string().email().optional().allow('')
    .messages({
      'string.email': 'Donor contact email must be a valid email address'
    }),
  
  donor_contact_phone: Joi.string().max(50).optional().allow(''),
  
  status: Joi.string().valid('ACTIVE', 'ARCHIVED', 'CANCELLED').default('ACTIVE')
});

// Reporting date schema
const ReportingDateSchema = Joi.object({
  date: Joi.date().iso().required()
    .messages({
      'any.required': 'Reporting date is required',
      'date.format': 'Reporting date must be in ISO format (YYYY-MM-DD)'
    }),
  
  description: Joi.string().max(255).default('')
});

// Category allocation schema
const CategoryAllocationSchema = Joi.object({
  category_id: Joi.string().min(1).max(100).required()
    .messages({
      'any.required': 'Category ID is required',
      'string.min': 'Category ID cannot be empty'
    }),
  
  amount: Joi.number().min(0).precision(2).required()
    .messages({
      'number.min': 'Allocation amount must be non-negative',
      'any.required': 'Allocation amount is required'
    })
});

// Attachment schema
const AttachmentSchema = Joi.object({
  name: Joi.string().min(1).max(255).required()
    .messages({
      'any.required': 'Attachment name is required',
      'string.min': 'Attachment name cannot be empty'
    }),
  
  uri: Joi.string().uri().required()
    .messages({
      'any.required': 'Attachment URI is required',
      'string.uri': 'Attachment URI must be a valid URI'
    }),
  
  mime: Joi.string().pattern(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/).required()
    .messages({
      'any.required': 'MIME type is required',
      'string.pattern.base': 'Invalid MIME type format'
    }),
  
  size_bytes: Joi.number().integer().min(0).optional()
});

// Envelope schema
const EnvelopeSchema = Joi.object({
  currency: Joi.string().length(3).uppercase().required()
    .valid('USD', 'EUR', 'GBP', 'KES', 'CAD', 'AUD')
    .messages({
      'string.length': 'Envelope currency must be a 3-letter code',
      'any.only': 'Envelope currency must be one of: USD, EUR, GBP, KES, CAD, AUD',
      'any.required': 'Envelope currency is required'
    }),
  
  ceiling_amount: Joi.number().min(0).precision(2).required()
    .messages({
      'number.min': 'Envelope ceiling amount must be non-negative',
      'any.required': 'Envelope ceiling amount is required'
    }),
  
  status: Joi.string().valid('DRAFT', 'APPROVED', 'LOCKED', 'CANCELLED').default('APPROVED'),
  
  notes: Joi.string().max(1000).optional().allow('')
});

// Complete grant creation schema
const CreateGrantSchema = GrantBaseSchema.keys({
  financial_reporting_dates: Joi.array().items(ReportingDateSchema).default([]),
  
  narrative_reporting_dates: Joi.array().items(ReportingDateSchema).default([]),
  
  budget_category_allocations: Joi.array().items(CategoryAllocationSchema).default([])
    .custom((value, helpers) => {
      const totalAllocations = value.reduce((sum, alloc) => sum + alloc.amount, 0);
      const budgetAmount = helpers.state.ancestors[0].budget_amount;
      
      if (totalAllocations > budgetAmount) {
        return helpers.error('custom.exceedsBudget', { 
          totalAllocations, 
          budgetAmount 
        });
      }
      
      return value;
    })
    .messages({
      'custom.exceedsBudget': 'Category allocations ({{#totalAllocations}}) exceed total budget amount ({{#budgetAmount}})'
    }),
  
  attachments: Joi.array().items(AttachmentSchema).default([]),
  
  envelope: EnvelopeSchema.optional()
    .when('currency', {
      is: Joi.exist(),
      then: Joi.object().keys({
        currency: Joi.string().valid(Joi.ref('...currency')).messages({
          'any.only': 'Envelope currency must match grant currency'
        })
      }).unknown(true)
    })
});

// Grant update schema (all fields optional except validation rules)
const UpdateGrantSchema = GrantBaseSchema.fork(
  ['name', 'open_date', 'close_date', 'currency', 'budget_amount'], 
  (schema) => schema.optional()
);

// Query parameter schemas
const GrantListQuerySchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'ARCHIVED', 'CANCELLED').optional(),
  program_manager: Joi.string().uuid().optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  use_ssot: Joi.string().valid('true', 'false').default('false')
});

const GrantAnalyticsQuerySchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().min(Joi.ref('from')).optional(),
  window: Joi.string().valid('month', 'quarter').default('month'),
  scope: Joi.string().valid('partner', 'grant_internal').default('partner'),
  entityType: Joi.string().valid('budget_line', 'partner_budget', 'contract', 'fund_request').optional(),
  type: Joi.string().valid('financial', 'narrative').optional(),
  use_ssot: Joi.string().valid('true', 'false').default('false')
});

// Reporting date suggestion schema
const SuggestReportingDatesSchema = Joi.object({
  open_date: Joi.date().iso().required()
    .messages({
      'any.required': 'Start date is required for suggestions',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
  
  close_date: Joi.date().iso().min(Joi.ref('open_date')).required()
    .messages({
      'any.required': 'End date is required for suggestions',
      'date.min': 'End date must be on or after start date',
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)'
    }),
  
  frequency: Joi.string().valid('quarterly', 'biannual').default('quarterly')
});

// Validation helper functions
const validateCreateGrant = (data) => {
  return CreateGrantSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
};

const validateUpdateGrant = (data) => {
  return UpdateGrantSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
};

const validateGrantListQuery = (query) => {
  return GrantListQuerySchema.validate(query, { 
    abortEarly: false,
    stripUnknown: true 
  });
};

const validateAnalyticsQuery = (query) => {
  return GrantAnalyticsQuerySchema.validate(query, { 
    abortEarly: false,
    stripUnknown: true 
  });
};

const validateSuggestReportingDates = (data) => {
  return SuggestReportingDatesSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true 
  });
};

// Custom validation functions
const validateGrantNumber = (grantNumber) => {
  const pattern = /^GRN-\d{6}-\d{4}$/;
  return pattern.test(grantNumber);
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
};

const validateCategoryAllocations = (allocations, totalBudget) => {
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  return totalAllocated <= totalBudget;
};

const validateReportingDatesInRange = (reportingDates, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return reportingDates.every(rd => {
    const reportDate = new Date(rd.date);
    return reportDate >= start && reportDate <= end;
  });
};

module.exports = {
  // Schemas
  GrantBaseSchema,
  CreateGrantSchema,
  UpdateGrantSchema,
  ReportingDateSchema,
  CategoryAllocationSchema,
  AttachmentSchema,
  EnvelopeSchema,
  GrantListQuerySchema,
  GrantAnalyticsQuerySchema,
  SuggestReportingDatesSchema,
  
  // Validation functions
  validateCreateGrant,
  validateUpdateGrant,
  validateGrantListQuery,
  validateAnalyticsQuery,
  validateSuggestReportingDates,
  
  // Custom validators
  validateGrantNumber,
  validateDateRange,
  validateCategoryAllocations,
  validateReportingDatesInRange
};
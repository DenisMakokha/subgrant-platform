const { z } = require('zod');

// Common schemas
const MoneyYear = z.object({
  amountUsd: z.number().nonnegative().max(999999999.99),
  year: z.number().int().min(2000).max(2035),
});

const FileSchema = z.object({
  key: z.string().min(1),
  originalName: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().max(20 * 1024 * 1024), // 20MB max
  sha256: z.string().length(64),
  uploadedAt: z.string().datetime(),
  version: z.number().int().min(1),
});

// SECTION B: Financial Assessment Schema
const FinancialAssessmentSchema = z.object({
  currentAnnualBudget: MoneyYear,
  nextYearAnnualBudgetEstimate: MoneyYear,
  largestGrantEverManaged: MoneyYear,
  currentDonorFunding: MoneyYear,
  otherFunds: MoneyYear,
});

// SECTION C: Document Attachment Schema
const AttachmentItemSchema = z.object({
  requirementCode: z.string().min(1),
  available: z.enum(['yes', 'na']),
  naExplanation: z.string().optional(),
  note: z.string().optional(),
  files: z.array(FileSchema).optional(),
}).refine((data) => {
  // If available is 'yes', must have at least one file
  if (data.available === 'yes') {
    return data.files && data.files.length > 0;
  }
  // If available is 'na', must have explanation
  if (data.available === 'na') {
    return data.naExplanation && data.naExplanation.trim().length > 0;
  }
  return true;
}, {
  message: "Required documents must have files when available='yes' or explanation when available='na'"
});

const SectionCSchema = z.object({
  documents: z.array(AttachmentItemSchema)
});

// SECTION A: Final Organization Profile Schema
const SectionASchema = z.object({
  legalName: z.string().min(1).max(255),
  tradingName: z.string().min(1).max(255),
  registrationNumber: z.string().min(1).max(100),
  registrationType: z.enum(['NGO', 'CBO', 'Trust', 'Company', 'Other']),
  registrationTypeOther: z.string().max(100).optional(),
  dateOfRegistration: z.string().date(),
  countryOfRegistration: z.string().min(1).max(100),
  taxIdentificationNumber: z.string().min(1).max(100),
  physicalAddress: z.string().min(1),
  postalAddress: z.string().min(1),
  website: z.string().url().optional().or(z.literal('')),
  primaryContactPerson: z.string().min(1).max(255),
  primaryContactTitle: z.string().min(1).max(100),
  primaryContactEmail: z.string().email().max(255),
  primaryContactPhone: z.string().min(1).max(50),
  financeContactPerson: z.string().min(1).max(255),
  financeContactEmail: z.string().email().max(255),
  financeContactPhone: z.string().min(1).max(50),
}).refine((data) => {
  // If registration type is 'Other', must provide registrationTypeOther
  if (data.registrationType === 'Other') {
    return data.registrationTypeOther && data.registrationTypeOther.trim().length > 0;
  }
  return true;
}, {
  message: "Registration type 'Other' requires additional specification"
});

// Auth schemas
const RegisterSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

// Admin review schemas
const ReviewDecisionSchema = z.object({
  decision: z.enum(['approve', 'changes', 'reject']),
  comment: z.string().min(1),
});

const ReviewFlagSchema = z.object({
  scope: z.enum(['document', 'financial', 'profile']),
  scopeRef: z.string().optional(),
  comment: z.string().min(1),
});

const CreateReviewFlagsSchema = z.object({
  flags: z.array(ReviewFlagSchema),
});

// Assessment stream schemas
const AssessmentStreamSchema = z.object({
  stream: z.enum([
    'governance',
    'financial_management',
    'legal_compliance',
    'operational_planning',
    'risk_management',
    'community_engagement',
    'data_security_privacy',
    'safeguarding',
    'implementing_partners'
  ]),
  q1Score: z.number().int().min(0).max(5).optional(),
  q1Comment: z.string().optional(),
  q2Score: z.number().int().min(0).max(5).optional(),
  q2Comment: z.string().optional(),
  q3Score: z.number().int().min(0).max(5).optional(),
  q3Comment: z.string().optional(),
  q4Score: z.number().int().min(0).max(5).optional(),
  q4Comment: z.string().optional(),
  q5Score: z.number().int().min(0).max(5).optional(),
  q5Comment: z.string().optional(),
  q6Score: z.number().int().min(0).max(5).optional(),
  q6Comment: z.string().optional(),
  q7Score: z.number().int().min(0).max(5).optional(),
  q7Comment: z.string().optional(),
  q8Score: z.number().int().min(0).max(5).optional(),
  q8Comment: z.string().optional(),
  q9Score: z.number().int().min(0).max(5).optional(),
  q9Comment: z.string().optional(),
  q10Score: z.number().int().min(0).max(5).optional(),
  q10Comment: z.string().optional(),
  q11Score: z.number().int().min(0).max(5).optional(),
  q11Comment: z.string().optional(),
  q12Score: z.number().int().min(0).max(5).optional(),
  q12Comment: z.string().optional(),
  q13Score: z.number().int().min(0).max(5).optional(),
  q13Comment: z.string().optional(),
  q14Score: z.number().int().min(0).max(5).optional(),
  q14Comment: z.string().optional(),
  overallRisk: z.enum(['low', 'medium', 'high']).optional(),
});

// File upload schemas
const PresignRequestSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().max(20 * 1024 * 1024),
});

// Validation middleware factory
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedData = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Query parameter validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Query validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

module.exports = {
  // Schemas
  FinancialAssessmentSchema,
  SectionCSchema,
  SectionASchema,
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  ReviewDecisionSchema,
  CreateReviewFlagsSchema,
  AssessmentStreamSchema,
  PresignRequestSchema,
  AttachmentItemSchema,
  FileSchema,
  MoneyYear,
  
  // Middleware
  validateSchema,
  validateQuery,
};

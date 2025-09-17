const Joi = require('joi');

// Generic validation middleware for Zod schemas
const validateSchema = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error.errors) {
        // Zod validation error
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages
        });
      }
      return res.status(400).json({
        error: 'Validation failed',
        details: error.message
      });
    }
  };
};

// Validation schema for disbursement
const disbursementSchema = Joi.object({
  budget_id: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional().allow(null, ''),
  tranche_number: Joi.number().integer().min(1).required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).optional(),
  planned_date: Joi.date().iso().required(),
  status: Joi.string().valid('planned', 'invoiced', 'paid', 'reconciled').optional(),
  invoice_id: Joi.string().optional().allow(null, ''),
  bill_id: Joi.string().optional().allow(null, ''),
  paid_at: Joi.date().iso().optional().allow(null),
  reconciled_at: Joi.date().iso().optional().allow(null)
});

// Validation schema for ME report
const meReportSchema = Joi.object({
  budget_id: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional().allow(null, ''),
  report_date: Joi.date().iso().required(),
  indicators: Joi.object().optional(),
  status: Joi.string().valid('draft', 'submitted', 'approved').optional(),
  submitted_at: Joi.date().iso().optional().allow(null),
  approved_at: Joi.date().iso().optional().allow(null),
  approved_by: Joi.string().uuid().optional().allow(null)
});

// Validation schema for financial report
const financialReportSchema = Joi.object({
  budget_id: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional().allow(null, ''),
  report_date: Joi.date().iso().required(),
  total_spent: Joi.number().positive().optional(),
  variance: Joi.number().optional(),
  status: Joi.string().valid('draft', 'submitted', 'approved').optional(),
  submitted_at: Joi.date().iso().optional().allow(null),
  approved_at: Joi.date().iso().optional().allow(null),
  approved_by: Joi.string().uuid().optional().allow(null)
});

// Validation schema for receipt
const receiptSchema = Joi.object({
  financial_report_id: Joi.string().uuid().required(),
  budget_line_id: Joi.string().uuid().optional().allow(null),
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).optional(),
  description: Joi.string().optional().allow(null, ''),
  document_uri: Joi.string().uri().required(),
  document_name: Joi.string().min(1).max(255).required(),
  mime_type: Joi.string().min(1).max(100).required(),
  checksum: Joi.string().optional().allow(null, '')
});

// Validation schema for organization
const organizationSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  legal_name: Joi.string().min(1).max(255).optional(),
  registration_number: Joi.string().max(100).optional(),
  tax_id: Joi.string().max(100).optional(),
  address: Joi.string().optional(),
  country: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional(),
  email: Joi.string().email().max(255).required(),
  website: Joi.string().uri().optional(),
  description: Joi.string().optional()
});

// Validation schema for user
const userSchema = Joi.object({
  organization_id: Joi.string().uuid().optional().allow(null),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string().max(20).optional(),
  role: Joi.string().valid('admin', 'accountant', 'budget_holder', 'finance_manager', 'partner_user', 'auditor').required(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  password: Joi.string().min(8).required()
});

// Validation schema for project
const projectSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  open_date: Joi.date().iso().required(),
  close_date: Joi.date().iso().required(),
  currency: Joi.string().length(3).optional()
});

// Validation schema for budget
const budgetSchema = Joi.object({
  organization_id: Joi.string().uuid().required(),
  project_id: Joi.string().uuid().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  total_amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).optional(),
  status: Joi.string().valid('draft', 'submitted', 'revise_requested', 'approved').optional()
});

// Validation schema for contract
const contractSchema = Joi.object({
  budget_id: Joi.string().uuid().required(),
  template_id: Joi.string().min(1).max(100).required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  envelope_id: Joi.string().optional().allow(null, ''),
  status: Joi.string().valid('ready', 'sent', 'partially_signed', 'completed', 'filed').optional()
});

// Validation function for disbursement
const validateDisbursement = (data) => {
  return disbursementSchema.validate(data);
};

// Validation function for ME report
const validateMeReport = (data) => {
  return meReportSchema.validate(data);
};

// Validation function for financial report
const validateFinancialReport = (data) => {
  return financialReportSchema.validate(data);
};

// Validation function for receipt
const validateReceipt = (data) => {
  return receiptSchema.validate(data);
};

// Validation function for organization
const validateOrganization = (data) => {
  return organizationSchema.validate(data);
};

// Validation function for user
const validateUser = (data) => {
  return userSchema.validate(data);
};

// Validation function for project
const validateProject = (data) => {
  return projectSchema.validate(data);
};

// Validation function for budget
const validateBudget = (data) => {
  return budgetSchema.validate(data);
};

// Validation function for contract
const validateContract = (data) => {
  return contractSchema.validate(data);
};

module.exports = {
  validateSchema,
  validateDisbursement,
  validateOrganization,
  validateUser,
  validateProject,
  validateBudget,
  validateContract,
  validateMeReport,
  validateFinancialReport,
  validateReceipt
};
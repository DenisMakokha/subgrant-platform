// Zod schemas for budget entities
const { z } = require('zod');

// Budget schema
const BudgetSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  partner_id: z.string().uuid(),
  currency: z.string().min(3).max(3),
  ceiling_total: z.number().nonnegative(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'OPEN_FOR_PARTNER', 'LOCKED']),
  rules_json: z.record(z.string(), z.any()).optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

// Budget line schema
const BudgetLineSchema = z.object({
  id: z.string().uuid().optional(),
  budget_id: z.string().uuid(),
  template_id: z.string().uuid(),
  description: z.string().min(1),
  unit: z.string().min(1),
  qty: z.number().positive(),
  unit_cost: z.number().nonnegative(),
  total: z.number().nonnegative().optional(),
  currency: z.string().min(3).max(3),
  period_from: z.date().optional(),
  period_to: z.date().optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'NEEDS_CHANGES', 'REJECTED']),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional()
});

// Budget template schema
const BudgetTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  partner_budget_id: z.string().uuid(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  guidance: z.string().optional(),
  required: z.boolean().default(false),
  min_lines: z.number().int().nonnegative().optional(),
  sort_index: z.number().int().default(0),
  status: z.enum(['DRAFT', 'READY', 'CLOSED']),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional(),
  legacy_category_id: z.string().uuid().optional()
});

// Budget category schema
const BudgetCategorySchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  cap_amount: z.number().nonnegative().nullable(),
  cap_percentage: z.number().min(0).max(100).nullable(),
  is_active: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional()
});

module.exports = {
  BudgetSchema,
  BudgetLineSchema,
  BudgetTemplateSchema,
  BudgetCategorySchema
};
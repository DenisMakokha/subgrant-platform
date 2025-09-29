// Zod schemas for fund request entities
const { z } = require('zod');

// Fund request schema
const FundRequestSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  partner_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  purpose: z.string().min(1),
  period_from: z.date().optional(),
  period_to: z.date().optional(),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'paid']).default('draft'),
  requested_at: z.date().optional(),
  approved_at: z.date().optional(),
  rejected_at: z.date().optional(),
  paid_at: z.date().optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

module.exports = {
  FundRequestSchema
};
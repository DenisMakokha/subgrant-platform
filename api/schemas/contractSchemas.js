// Zod schemas for contract entities
const { z } = require('zod');

// Contract schema
const ContractSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  partner_id: z.string().uuid(),
  partner_budget_id: z.string().uuid().optional(),
  template_id: z.string().uuid(),
  number: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['DRAFT', 'GENERATED', 'SUBMITTED', 'APPROVED', 'SENT_FOR_SIGN', 'SIGNED', 'ACTIVE', 'CANCELLED']),
  state_json: z.record(z.string(), z.any()).optional(),
  substatus_json: z.record(z.string(), z.any()).optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

// Contract template schema
const ContractTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  template_docx_key: z.string().min(1),
  merge_fields_json: z.record(z.string(), z.any()).optional(),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

// Contract artifact schema
const ContractArtifactSchema = z.object({
  id: z.string().uuid().optional(),
  contract_id: z.string().uuid(),
  name: z.string().min(1),
  document_name: z.string().min(1),
  mime_type: z.string().min(1),
  storage_key: z.string().min(1),
  version: z.number().int().default(1),
  created_by: z.string().uuid().optional(),
  created_at: z.date().optional()
});

module.exports = {
  ContractSchema,
  ContractTemplateSchema,
  ContractArtifactSchema
};
import { z } from "zod";

// Organization Schema - Single Source of Truth
export const OrganizationSchema = z.object({
  // Core identifiers
  id: z.string().uuid().optional(),
  version: z.number().int().nonnegative().default(0),
  status: z.enum(['a_pending', 'b_pending', 'c_pending', 'under_review', 'finalized']).default('a_pending'),
  
  // Basic Information
  name: z.string().min(1, "Organization name is required"),
  legal_name: z.string().min(1, "Legal name is required"),
  registration_number: z.string().min(1, "Registration number is required"),
  tax_id: z.string().min(1, "Tax ID is required"),
  legal_structure: z.enum(['nonprofit', 'for_profit', 'government', 'other']),
  year_established: z.number().int().min(1800).max(new Date().getFullYear()).nullable(),
  
  // Contact Information
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  website: z.string().url().optional().or(z.literal("")),
  
  // Primary Contact
  primary_contact_name: z.string().min(1, "Primary contact name is required"),
  primary_contact_title: z.string().min(1, "Primary contact title is required"),
  primary_contact_email: z.string().email("Valid primary contact email is required"),
  primary_contact_phone: z.string().min(1, "Primary contact phone is required"),
  
  // Address Information
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state_province: z.string().min(1, "State/Province is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  country: z.string().length(2, "Country must be 2-letter code"),
  
  // Banking Information
  bank_name: z.string().nullable(),
  bank_branch: z.string().nullable(),
  account_name: z.string().nullable(),
  account_number: z.string().nullable(),
  swift_code: z.string().nullable(),
  
  // Financial Assessment (Section B)
  financial_assessment: z.object({
    currentAnnualBudget: z.object({
      amountUsd: z.number().nonnegative(),
      year: z.number().int().min(2020).max(new Date().getFullYear() + 1)
    }),
    nextYearAnnualBudgetEstimate: z.object({
      amountUsd: z.number().nonnegative(),
      year: z.number().int().min(2020).max(new Date().getFullYear() + 2)
    }),
    largestGrantEverManaged: z.object({
      amountUsd: z.number().nonnegative(),
      year: z.number().int().min(2000).max(new Date().getFullYear())
    }),
    currentDonorFunding: z.object({
      amountUsd: z.number().nonnegative(),
      year: z.number().int().min(2020).max(new Date().getFullYear() + 1)
    }),
    otherFunds: z.object({
      amountUsd: z.number().nonnegative(),
      year: z.number().int().min(2020).max(new Date().getFullYear() + 1)
    })
  }).optional(),
  
  // Metadata
  owner_user_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional(),
  updated_by: z.string().uuid().optional(),
});

// Derived types
export type Organization = z.infer<typeof OrganizationSchema>;

// Document schemas for Section C
export const FileUploadSchema = z.object({
  key: z.string(),
  originalName: z.string(),
  mime: z.string(),
  size: z.number(),
  sha256: z.string(),
  uploadedAt: z.string().datetime(),
  version: z.number().default(1)
});

export const DocumentResponseSchema = z.object({
  available: z.enum(['yes', 'no']).default('yes'),
  naExplanation: z.string().optional(),
  note: z.string().optional(),
  files: z.array(FileUploadSchema).default([])
});

export const SectionCSchema = z.object({
  documents: z.record(z.string(), DocumentResponseSchema),
  status: z.enum(['draft', 'submitted']).default('draft')
});

// Section-specific schemas for validation
export const SectionASchema = OrganizationSchema.pick({
  name: true,
  legal_name: true,
  registration_number: true,
  tax_id: true,
  legal_structure: true,
  year_established: true,
  email: true,
  phone: true,
  website: true,
  primary_contact_name: true,
  primary_contact_title: true,
  primary_contact_email: true,
  primary_contact_phone: true,
  address: true,
  city: true,
  state_province: true,
  postal_code: true,
  country: true,
  bank_name: true,
  bank_branch: true,
  account_name: true,
  account_number: true,
  swift_code: true,
});

export const SectionBSchema = OrganizationSchema.pick({
  financial_assessment: true,
});

export type SectionAData = z.infer<typeof SectionASchema>;
export type SectionBData = z.infer<typeof SectionBSchema>;
export type SectionCData = z.infer<typeof SectionCSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>;

// Default values generator
export const createOrganizationDefaults = (): Partial<Organization> => ({
  version: 0,
  status: 'a_pending',
  name: '',
  legal_name: '',
  registration_number: '',
  tax_id: '',
  legal_structure: 'nonprofit',
  year_established: null,
  email: '',
  phone: '',
  website: '',
  primary_contact_name: '',
  primary_contact_title: '',
  primary_contact_email: '',
  primary_contact_phone: '',
  address: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: 'KE',
  bank_name: null,
  bank_branch: null,
  account_name: null,
  account_number: null,
  swift_code: null,
});

// Field mappings for database operations
export const DB_FIELD_MAPPING = {
  // Maps schema fields to database columns
  year_established: 'year_established',
  bank_name: 'bank_name',
  bank_branch: 'bank_branch',
  account_name: 'account_name',
  account_number: 'account_number',
  swift_code: 'swift_code',
  // ... add other mappings as needed
};

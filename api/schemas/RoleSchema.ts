import { z } from "zod";

export const RoleSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  label: z.string().min(2),
  inherits: z.array(z.string()).default([]),
  caps: z.array(z.string()).min(0),
  scopes: z.object({
    project: z.enum(["all", "self"]),
    tenant: z.enum(["current", "all"]).default("current")
  }),
  visibility_rules: z.array(z.any()).default([]),
  version: z.number().int().positive(),
  active: z.boolean().default(false)
});
export type RoleDef = z.infer<typeof RoleSchema>;
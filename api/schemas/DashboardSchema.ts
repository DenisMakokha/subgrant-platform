import { z } from "zod";

export const WidgetSchema = z.object({
  key: z.string(),
  type: z.string(),                   // 'kpi'|'table'|'form'|'button'|'chart.bar'|'calendar'|'component'|...
  dataSourceKey: z.string().optional(),
  columns: z.array(z.object({ label: z.string(), path: z.string() })).optional(),
  rowActions: z.array(z.string()).optional(),
  fields: z.array(z.object({ name:z.string(), label:z.string(), required:z.boolean().optional(), placeholder:z.string().optional() })).optional(),
  props: z.record(z.any()).optional()
});

export const PageSchema = z.object({
  key: z.string(),
  route: z.string().optional(),       // if page mounted at a route
  params: z.record(z.string()).optional(),
  widgets: z.array(WidgetSchema).min(1)
});

export const DashboardSchema = z.object({
  role_id: z.string(),
  menus: z.array(z.any()),            // menu JSON (validate per your menu component)
  pages: z.array(PageSchema).min(1),
  version: z.number().int().positive(),
  active: z.boolean().default(false)
});
export type DashboardDef = z.infer<typeof DashboardSchema>;
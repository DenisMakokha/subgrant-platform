export interface RenewalAlert {
  id?: string;
  type: string;
  projectId?: string;
  projectName?: string;
  daysUntilClose?: number;
  daysSinceClose?: number;
  severity: string;
  message: string;
  created_at?: string;
}
// shared/constants/roles.ts
export const ROLES = { ADMIN: 'admin', PARTNER: 'partner_user' } as const;
export type Role = typeof ROLES[keyof typeof ROLES];

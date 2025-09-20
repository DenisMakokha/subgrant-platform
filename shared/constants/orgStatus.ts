// shared/constants/orgStatus.ts
export const ORG_STATUS = {
  EMAIL_PENDING:   'email_pending',
  A_PENDING:       'a_pending',
  B_PENDING:       'b_pending',
  C_PENDING:       'c_pending',
  UNDER_REVIEW:    'under_review',
  FINALIZED:       'finalized',
  CHANGES_REQUESTED:'changes_requested',
  REJECTED:        'rejected',
} as const;
export type OrgStatus = typeof ORG_STATUS[keyof typeof ORG_STATUS];

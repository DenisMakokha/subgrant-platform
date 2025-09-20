// services/orgStateMachine.ts
import { ORG_STATUS } from '../shared/constants/orgStatus';
import type { OrgStatus } from '../shared/constants/orgStatus';

export function nextStepFrom(status: OrgStatus):
  'section-a'|'section-b'|'section-c'|'review'|'partner-dashboard' {
  switch (status) {
    case ORG_STATUS.A_PENDING: return 'section-a';
    case ORG_STATUS.B_PENDING: return 'section-b';
    case ORG_STATUS.C_PENDING: return 'section-c';
    case ORG_STATUS.UNDER_REVIEW:
    case ORG_STATUS.CHANGES_REQUESTED: return 'review';
    case ORG_STATUS.FINALIZED: return 'partner-dashboard';
    default: return 'section-a';
  }
}

export function assertTransition(from: OrgStatus, to: OrgStatus) {
  const allowed: Record<OrgStatus, OrgStatus[]> = {
    [ORG_STATUS.EMAIL_PENDING]:   [ORG_STATUS.A_PENDING],
    [ORG_STATUS.A_PENDING]:       [ORG_STATUS.B_PENDING],
    [ORG_STATUS.B_PENDING]:       [ORG_STATUS.C_PENDING],
    [ORG_STATUS.C_PENDING]:       [ORG_STATUS.UNDER_REVIEW],
    [ORG_STATUS.UNDER_REVIEW]:    [ORG_STATUS.FINALIZED, ORG_STATUS.CHANGES_REQUESTED, ORG_STATUS.REJECTED],
    [ORG_STATUS.CHANGES_REQUESTED]:[ORG_STATUS.A_PENDING, ORG_STATUS.B_PENDING, ORG_STATUS.C_PENDING],
    [ORG_STATUS.FINALIZED]:       [],
    [ORG_STATUS.REJECTED]:        [],
  };
  if (!allowed[from]?.includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}

// services/orgStateMachine.js
const { ORG_STATUS } = require('../shared/constants/orgStatus');

function nextStepFrom(status) {
  switch (status) {
    case ORG_STATUS.A_PENDING: return 'section-a';
    case ORG_STATUS.B_PENDING: return 'section-b';
    case ORG_STATUS.C_PENDING: return 'section-c';
    case 'under_review': // legacy alias for GM/COO review umbrella
      return 'review';
    case ORG_STATUS.UNDER_REVIEW_GM:
    case ORG_STATUS.UNDER_REVIEW_COO:
    case ORG_STATUS.CHANGES_REQUESTED: return 'review';
    case ORG_STATUS.FINALIZED: return 'partner-dashboard';
    default: return 'section-a';
  }
}

function assertTransition(from, to) {
  const allowed = {
    [ORG_STATUS.EMAIL_PENDING]: [ORG_STATUS.A_PENDING],
    [ORG_STATUS.A_PENDING]:     [ORG_STATUS.B_PENDING],
    [ORG_STATUS.B_PENDING]:     [ORG_STATUS.C_PENDING],
    [ORG_STATUS.C_PENDING]:     [ORG_STATUS.UNDER_REVIEW_GM],
    // Legacy umbrella status: treat as being at GM stage for assertions
    'under_review':            [ORG_STATUS.UNDER_REVIEW_COO, ORG_STATUS.CHANGES_REQUESTED, ORG_STATUS.REJECTED],
    [ORG_STATUS.UNDER_REVIEW_GM]:  [ORG_STATUS.UNDER_REVIEW_COO, ORG_STATUS.CHANGES_REQUESTED, ORG_STATUS.REJECTED],
    [ORG_STATUS.UNDER_REVIEW_COO]: [ORG_STATUS.FINALIZED, ORG_STATUS.CHANGES_REQUESTED, ORG_STATUS.REJECTED],
    [ORG_STATUS.CHANGES_REQUESTED]: [ORG_STATUS.A_PENDING, ORG_STATUS.B_PENDING, ORG_STATUS.C_PENDING],
    [ORG_STATUS.REJECTED]: [],
    [ORG_STATUS.FINALIZED]: [],
  };
  
  if (!allowed[from]?.includes(to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
}

module.exports = {
  nextStepFrom,
  assertTransition
};

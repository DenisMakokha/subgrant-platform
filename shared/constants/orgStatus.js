// shared/constants/orgStatus.js
const ORG_STATUS = {
  EMAIL_PENDING:      'email_pending',
  A_PENDING:          'a_pending',
  B_PENDING:          'b_pending',
  C_PENDING:          'c_pending',
  UNDER_REVIEW_GM:    'under_review_gm',    // new - GM review stage
  UNDER_REVIEW_COO:   'under_review_coo',   // new - COO review stage
  CHANGES_REQUESTED:  'changes_requested',
  REJECTED:           'rejected',
  FINALIZED:          'finalized',
};

// Status validation helper
function isValidStatus(status) {
  return Object.values(ORG_STATUS).includes(status);
}

module.exports = {
  ORG_STATUS,
  isValidStatus
};

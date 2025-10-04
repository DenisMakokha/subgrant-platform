const logger = require('../utils/logger');

/**
 * Partner Onboarding Gate Middleware
 * Blocks partner API access until onboarding is complete
 * 
 * Use AFTER: requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership
 */

// Organization status constants
const ORG_STATUS = {
  EMAIL_PENDING: 'email_pending',
  A_PENDING: 'a_pending',
  B_PENDING: 'b_pending',
  C_PENDING: 'c_pending',
  UNDER_REVIEW: 'under_review',
  UNDER_REVIEW_GM: 'under_review_gm',
  UNDER_REVIEW_COO: 'under_review_coo',
  FINALIZED: 'finalized', // This status unlocks all features
  REJECTED: 'rejected'
};

function requireOnboardingCompleteOrBlock(req, res, next) {
  const status = req.org?.status;
  const isFinalized = status === ORG_STATUS.FINALIZED;
  
  logger.info('Onboarding Gate Check:', {
    orgId: req.org?.id,
    status: status,
    isFinalized: isFinalized,
    path: req.path,
    method: req.method
  });
  
  // If organization is finalized, allow access
  if (isFinalized) {
    return next();
  }

  // Allow onboarding routes to proceed
  if (req.path.startsWith('/onboarding')) {
    logger.info('Allowing onboarding route:', req.path);
    return next();
  }

  // Block everything else for partners until finalized
  // Use 423 (Locked) with a standard code for the FE to intercept
  logger.info('Blocking partner route - onboarding required:', req.path);
  
  return res.status(423).json({
    error: 'Onboarding required',
    code: 'ONBOARDING_REQUIRED',
    next: '/partner/onboarding/landing',
    current_status: status,
    required_status: ORG_STATUS.FINALIZED
  });
}

// Helper function to check if organization needs onboarding
function isOnboardingRequired(organization) {
  return !organization || organization.status !== ORG_STATUS.FINALIZED;
}

// Helper function to get next onboarding step
function getNextOnboardingStep(status) {
  switch (status) {
    case ORG_STATUS.EMAIL_PENDING:
    case ORG_STATUS.A_PENDING:
      return 'section-a';
    case ORG_STATUS.B_PENDING:
      return 'section-b';
    case ORG_STATUS.C_PENDING:
      return 'section-c';
    case ORG_STATUS.UNDER_REVIEW:
    case ORG_STATUS.UNDER_REVIEW_GM:
    case ORG_STATUS.UNDER_REVIEW_COO:
      return 'review';
    case ORG_STATUS.FINALIZED:
      return null; // No next step needed
    default:
      return 'section-a';
  }
}

module.exports = {
  requireOnboardingCompleteOrBlock,
  isOnboardingRequired,
  getNextOnboardingStep,
  ORG_STATUS
};

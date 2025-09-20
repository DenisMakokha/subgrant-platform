/**
 * Partner Routes with Onboarding Gate
 * All partner routes are protected by the onboarding gate middleware
 */

const express = require('express');
const { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } = require('../../middleware/onboarding');
const { requireOnboardingCompleteOrBlock } = require('../../middleware/partnerOnboardingGate');

// Import route handlers
const onboardingRouter = require('./onboarding');

const router = express.Router();

// Base middleware stack for all partner routes
const baseGuard = [
  requireAuth,
  requireEmailVerified, 
  getUserOrganization,
  requireOrgOwnership
];

// Apply base guard to all routes
router.use(baseGuard);

// Onboarding routes are allowed through WITHOUT the onboarding gate
router.use('/onboarding', onboardingRouter);

// Apply onboarding gate AFTER onboarding routes
// This will block all other routes until org.status === 'finalized'
router.use(requireOnboardingCompleteOrBlock);

// Other partner routes would go here after onboarding gate
// router.use('/applications', applicationsRouter);
// router.use('/compliance', complianceRouter);
// etc.

// Partner dashboard endpoint
router.get('/dashboard', async (req, res) => {
  try {
    const { org, user } = req;
    
    // Get dashboard data
    const dashboardData = {
      organization: {
        id: org.id,
        name: org.name,
        status: org.status
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      modules: {
        applications: {
          submitted: 0, // TODO: Get from database
          drafts: 0
        },
        compliance: {
          approved: 0,
          required: 0,
          expiring_soon: 0
        },
        me_reports: {
          submitted_this_quarter: 0,
          due: 0
        },
        disbursements: {
          paid: 0,
          upcoming: 0
        }
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Partner dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Health check endpoint (always accessible)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'partner-api',
    onboarding_required: req.org?.status !== 'finalized'
  });
});

module.exports = router;

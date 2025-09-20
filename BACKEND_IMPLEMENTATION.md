# Backend Implementation Guide for Mandatory Onboarding

This document provides the exact backend implementation needed to complete the mandatory onboarding system.

## 1. Onboarding Gate Middleware

Create `api/middleware/partnerOnboardingGate.js`:

```javascript
import { ORG_STATUS } from '../shared/constants/orgStatus.js';

/**
 * Middleware to block partner API access until onboarding is complete
 * Use AFTER: requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership
 */
export function requireOnboardingCompleteOrBlock(req, res, next) {
  const status = req.org?.status;
  const isFinalized = status === ORG_STATUS.FINALIZED;
  
  if (isFinalized) return next();

  // Allow onboarding routes to proceed
  if (req.path.startsWith('/onboarding')) return next();

  // Block everything else for partners until finalized
  // Use 423 (Locked) with standard code for FE to intercept
  return res.status(423).json({
    error: 'Onboarding required',
    code: 'ONBOARDING_REQUIRED',
    next: '/partner/onboarding/landing'
  });
}
```

## 2. Update Partner Router

In `api/routes/partner/index.js`:

```javascript
import { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } from '../../middleware/onboarding.js';
import { requireOnboardingCompleteOrBlock } from '../../middleware/partnerOnboardingGate.js';

const guard = [requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership];

// Apply the onboarding gate to all partner routes
router.use(guard, requireOnboardingCompleteOrBlock);

// All child partner routes (applications, compliance, me, finance, messages) 
// are now auto-blocked until org.status === 'finalized'
// Onboarding routes remain open
```

## 3. Update Session Endpoint

In `api/routes/session.js`:

```javascript
// Add onboarding_locked field to session response
const status = org?.status || ORG_STATUS.EMAIL_PENDING;
const next_step = nextStepFrom(status);
const onboarding_locked = status !== ORG_STATUS.FINALIZED;

res.json({
  user: { 
    id: user.id, 
    role, 
    email_verified: !!user.email_verified_at, 
    organization_id: user.organization_id 
  },
  organization: org ? { id: org.id, status } : null,
  next_step,
  onboarding_locked, // Add this field
  modules: { ... } // as before
});
```

## 4. Organization Status Constants

Ensure `api/shared/constants/orgStatus.js` includes:

```javascript
export const ORG_STATUS = {
  EMAIL_PENDING: 'email_pending',
  A_PENDING: 'a_pending',
  B_PENDING: 'b_pending', 
  C_PENDING: 'c_pending',
  UNDER_REVIEW: 'under_review',
  UNDER_REVIEW_GM: 'under_review_gm',
  UNDER_REVIEW_COO: 'under_review_coo',
  FINALIZED: 'finalized', // This unlocks all features
  REJECTED: 'rejected'
};
```

## 5. Onboarding Flow Logic

Ensure your onboarding endpoints follow this progression:

```javascript
// Section A save → status: a_pending → b_pending
// Section B save → b_pending → c_pending  
// Section C save → c_pending → under_review
// Submit Application → under_review → finalized (or through GM/COO if using approval flow)
```

## 6. Organization Creation Endpoint

Ensure `POST /organizations` accepts:

```javascript
{
  "name": "Organization Name",
  "email": "partner@example.com", 
  "status": "pending"
}
```

And automatically links the organization to the authenticated user.

## 7. Error Response Standardization

All partner API endpoints should return 423 Locked when onboarding incomplete:

```javascript
{
  "error": "Onboarding required",
  "code": "ONBOARDING_REQUIRED", 
  "next": "/partner/onboarding/landing"
}
```

## Implementation Checklist

- [ ] Create `partnerOnboardingGate.js` middleware
- [ ] Update partner router to use the gate
- [ ] Add `onboarding_locked` field to session endpoint
- [ ] Verify organization status constants
- [ ] Test onboarding flow progression
- [ ] Ensure organization creation works
- [ ] Verify 423 Locked responses

## Testing

1. Create a partner user without completed onboarding
2. Try to access `/partner/applications` → should get 423 Locked
3. Complete onboarding sections A→B→C→Submit
4. Verify `organization.status` becomes 'finalized'
5. Try to access `/partner/applications` → should work normally

The frontend is already implemented and will automatically handle the 423 responses and onboarding_locked status.

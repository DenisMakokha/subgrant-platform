# Comprehensive RBAC Implementation Guide

## Overview
This document provides a complete implementation guide for capability-based access control across the entire subgrant platform. **NO MORE ROLE CONFUSION** - every route checks capabilities, not role names.

## Architecture

### 1. Universal RBAC Middleware
**File:** `api/middleware/universalRBAC.js`

**Key Functions:**
- `requireCapability(capability)` - Require single capability
- `requireAnyCapability([capabilities])` - Require at least one capability
- `requireAllCapabilities([capabilities])` - Require all capabilities
- `attachCapabilities` - Add capabilities to request without enforcing
- `getUserCapabilities(userId, userRole)` - Get user's capabilities from DB

### 2. How It Works

#### For Built-in Roles (admin, partner, grants_manager, etc.):
```javascript
// Maps to predefined capability list
partner → ['onboarding.view', 'budgets.view', 'issues.create', ...]
admin → ALL capabilities automatically
```

#### For Custom Roles (from Role Wizard):
```javascript
// Fetches from database
SELECT capabilities FROM role_wizard WHERE role_name = 'Support Team'
// Returns: ['issues.view', 'issues.update', 'issues.assign']
```

#### For Admin:
```javascript
// Admin automatically has ALL capabilities
if (userRole === 'admin') {
  return allCapabilitiesFromCatalog;
}
```

## Complete Route Mapping

### Organizations Routes
**Base:** `/api/organizations`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `organizations.view` | List all organizations |
| GET | `/:id` | `organizations.view` | Get single organization |
| POST | `/` | `organizations.create` | Create new organization |
| PUT | `/:id` | `organizations.update` | Update organization |
| DELETE | `/:id` | `organizations.delete` | Delete organization |
| PUT | `/:id/status` | `organizations.manage_status` | Change organization status |

**Implementation:**
```javascript
const { requireCapability } = require('../middleware/universalRBAC');

router.get('/', requireAuth, requireCapability('organizations.view'), getAllOrganizations);
router.post('/', requireAuth, requireCapability('organizations.create'), createOrganization);
router.put('/:id', requireAuth, requireCapability('organizations.update'), updateOrganization);
router.delete('/:id', requireAuth, requireCapability('organizations.delete'), deleteOrganization);
router.put('/:id/status', requireAuth, requireCapability('organizations.manage_status'), updateStatus);
```

### Projects Routes
**Base:** `/api/projects`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `projects.view` | List all projects |
| GET | `/:id` | `projects.view` | Get single project |
| POST | `/` | `projects.create` | Create new project |
| PUT | `/:id` | `projects.update` | Update project |
| DELETE | `/:id` | `projects.delete` | Delete project |
| PUT | `/:id/close` | `projects.close` | Close project |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('projects.view'), getAllProjects);
router.post('/', requireAuth, requireCapability('projects.create'), createProject);
router.put('/:id', requireAuth, requireCapability('projects.update'), updateProject);
router.delete('/:id', requireAuth, requireCapability('projects.delete'), deleteProject);
router.put('/:id/close', requireAuth, requireCapability('projects.close'), closeProject);
```

### Budgets Routes
**Base:** `/api/budgets` or `/api/partner-budgets`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `budgets.view` | List all budgets |
| GET | `/:id` | `budgets.view` | Get single budget |
| POST | `/` | `budgets.create` | Create new budget |
| PUT | `/:id` | `budgets.update` | Update budget |
| DELETE | `/:id` | `budgets.delete` | Delete budget |
| POST | `/:id/submit` | `budgets.submit` | Submit budget for review |
| PUT | `/:id/review` | `budgets.review` | Review budget |
| PUT | `/:id/approve` | `budgets.approve` | Approve budget |
| PUT | `/:id/reject` | `budgets.reject` | Reject budget |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('budgets.view'), getAllBudgets);
router.post('/', requireAuth, requireCapability('budgets.create'), createBudget);
router.put('/:id', requireAuth, requireCapability('budgets.update'), updateBudget);
router.delete('/:id', requireAuth, requireCapability('budgets.delete'), deleteBudget);
router.post('/:id/submit', requireAuth, requireCapability('budgets.submit'), submitBudget);
router.put('/:id/review', requireAuth, requireCapability('budgets.review'), reviewBudget);
router.put('/:id/approve', requireAuth, requireCapability('budgets.approve'), approveBudget);
router.put('/:id/reject', requireAuth, requireCapability('budgets.reject'), rejectBudget);
```

### Contracts Routes
**Base:** `/api/contracts`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `contracts.view` | List all contracts |
| GET | `/:id` | `contracts.view` | Get single contract |
| POST | `/` | `contracts.create` | Create new contract |
| PUT | `/:id` | `contracts.update` | Update contract |
| DELETE | `/:id` | `contracts.delete` | Delete contract |
| POST | `/:id/send` | `contracts.send` | Send contract for signature |
| PUT | `/:id/approve` | `contracts.approve` | Approve contract |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('contracts.view'), getAllContracts);
router.post('/', requireAuth, requireCapability('contracts.create'), createContract);
router.put('/:id', requireAuth, requireCapability('contracts.update'), updateContract);
router.delete('/:id', requireAuth, requireCapability('contracts.delete'), deleteContract);
router.post('/:id/send', requireAuth, requireCapability('contracts.send'), sendContract);
router.put('/:id/approve', requireAuth, requireCapability('contracts.approve'), approveContract);
```

### Disbursements Routes
**Base:** `/api/disbursements`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `disbursements.view` | List all disbursements |
| GET | `/:id` | `disbursements.view` | Get single disbursement |
| POST | `/` | `disbursements.create` | Create new disbursement |
| PUT | `/:id` | `disbursements.update` | Update disbursement |
| PUT | `/:id/approve` | `disbursements.approve` | Approve disbursement |
| PUT | `/:id/process` | `disbursements.process` | Process payment |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('disbursements.view'), getAllDisbursements);
router.post('/', requireAuth, requireCapability('disbursements.create'), createDisbursement);
router.put('/:id', requireAuth, requireCapability('disbursements.update'), updateDisbursement);
router.put('/:id/approve', requireAuth, requireCapability('disbursements.approve'), approveDisbursement);
router.put('/:id/process', requireAuth, requireCapability('disbursements.process'), processDisbursement);
```

### M&E Reports Routes
**Base:** `/api/me-reports`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `me_reports.view` | List all M&E reports |
| GET | `/:id` | `me_reports.view` | Get single report |
| POST | `/` | `me_reports.create` | Create new report |
| PUT | `/:id` | `me_reports.update` | Update report |
| POST | `/:id/submit` | `me_reports.submit` | Submit report |
| PUT | `/:id/review` | `me_reports.review` | Review report |
| PUT | `/:id/approve` | `me_reports.approve` | Approve report |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('me_reports.view'), getAllReports);
router.post('/', requireAuth, requireCapability('me_reports.create'), createReport);
router.put('/:id', requireAuth, requireCapability('me_reports.update'), updateReport);
router.post('/:id/submit', requireAuth, requireCapability('me_reports.submit'), submitReport);
router.put('/:id/review', requireAuth, requireCapability('me_reports.review'), reviewReport);
router.put('/:id/approve', requireAuth, requireCapability('me_reports.approve'), approveReport);
```

### Financial Reports Routes
**Base:** `/api/financial-reports`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `financial_reports.view` | List all financial reports |
| GET | `/:id` | `financial_reports.view` | Get single report |
| POST | `/` | `financial_reports.create` | Create new report |
| PUT | `/:id` | `financial_reports.update` | Update report |
| POST | `/:id/submit` | `financial_reports.submit` | Submit report |
| PUT | `/:id/approve` | `financial_reports.approve` | Approve report |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('financial_reports.view'), getAllReports);
router.post('/', requireAuth, requireCapability('financial_reports.create'), createReport);
router.put('/:id', requireAuth, requireCapability('financial_reports.update'), updateReport);
router.post('/:id/submit', requireAuth, requireCapability('financial_reports.submit'), submitReport);
router.put('/:id/approve', requireAuth, requireCapability('financial_reports.approve'), approveReport);
```

### Documents Routes
**Base:** `/api/documents`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `documents.view` | List all documents |
| GET | `/:id` | `documents.view` | Get single document |
| POST | `/upload` | `documents.upload` | Upload new document |
| PUT | `/:id` | `documents.update` | Update document metadata |
| DELETE | `/:id` | `documents.delete` | Delete document |
| PUT | `/:id/review` | `documents.review` | Review document |
| PUT | `/:id/approve` | `documents.approve` | Approve document |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('documents.view'), getAllDocuments);
router.post('/upload', requireAuth, requireCapability('documents.upload'), uploadDocument);
router.put('/:id', requireAuth, requireCapability('documents.update'), updateDocument);
router.delete('/:id', requireAuth, requireCapability('documents.delete'), deleteDocument);
router.put('/:id/review', requireAuth, requireCapability('documents.review'), reviewDocument);
router.put('/:id/approve', requireAuth, requireCapability('documents.approve'), approveDocument);
```

### Compliance Routes
**Base:** `/api/compliance`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/requirements` | `compliance.view` | List compliance requirements |
| GET | `/documents` | `compliance.view` | List compliance documents |
| POST | `/submit` | `compliance.submit` | Submit compliance document |
| PUT | `/:id/review` | `compliance.review` | Review compliance |
| PUT | `/:id/approve` | `compliance.approve` | Approve compliance |

**Implementation:**
```javascript
router.get('/requirements', requireAuth, requireCapability('compliance.view'), getRequirements);
router.get('/documents', requireAuth, requireCapability('compliance.view'), getDocuments);
router.post('/submit', requireAuth, requireCapability('compliance.submit'), submitCompliance);
router.put('/:id/review', requireAuth, requireCapability('compliance.review'), reviewCompliance);
router.put('/:id/approve', requireAuth, requireCapability('compliance.approve'), approveCompliance);
```

### Fund Requests Routes
**Base:** `/api/fund-requests`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `fund_requests.view` | List all fund requests |
| GET | `/:id` | `fund_requests.view` | Get single request |
| POST | `/` | `fund_requests.create` | Create new request |
| PUT | `/:id` | `fund_requests.update` | Update request |
| POST | `/:id/submit` | `fund_requests.submit` | Submit request |
| PUT | `/:id/review` | `fund_requests.review` | Review request |
| PUT | `/:id/approve` | `fund_requests.approve` | Approve request |
| PUT | `/:id/reject` | `fund_requests.reject` | Reject request |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('fund_requests.view'), getAllRequests);
router.post('/', requireAuth, requireCapability('fund_requests.create'), createRequest);
router.put('/:id', requireAuth, requireCapability('fund_requests.update'), updateRequest);
router.post('/:id/submit', requireAuth, requireCapability('fund_requests.submit'), submitRequest);
router.put('/:id/review', requireAuth, requireCapability('fund_requests.review'), reviewRequest);
router.put('/:id/approve', requireAuth, requireCapability('fund_requests.approve'), approveRequest);
router.put('/:id/reject', requireAuth, requireCapability('fund_requests.reject'), rejectRequest);
```

### Reported Issues Routes
**Base:** `/api/reported-issues`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | None (filtered by user) | List issues (own or all) |
| GET | `/stats` | `issues.view` | Get issue statistics |
| GET | `/:id` | None (filtered by user) | Get single issue |
| POST | `/` | None (all can report) | Create new issue |
| PUT | `/:id` | `issues.update` | Update issue |
| DELETE | `/:id` | `issues.delete` | Delete issue |
| POST | `/:id/comments` | None (all can comment) | Add comment |

**Implementation:**
```javascript
router.get('/', requireAuth, attachCapabilities, getAllIssues); // Controller checks capabilities
router.get('/stats', requireAuth, requireCapability('issues.view'), getIssueStats);
router.get('/:id', requireAuth, attachCapabilities, getIssueById); // Controller checks capabilities
router.post('/', requireAuth, createIssue);
router.put('/:id', requireAuth, requireCapability('issues.update'), updateIssue);
router.delete('/:id', requireAuth, requireCapability('issues.delete'), deleteIssue);
router.post('/:id/comments', requireAuth, addComment);
```

### Users Routes
**Base:** `/api/users`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `users.view` | List all users |
| GET | `/:id` | `users.view` | Get single user |
| POST | `/` | `users.create` | Create new user |
| PUT | `/:id` | `users.update` | Update user |
| DELETE | `/:id` | `users.delete` | Delete user |
| PUT | `/:id/role` | `users.manage_roles` | Change user role |
| PUT | `/:id/status` | `users.manage_status` | Change user status |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('users.view'), getAllUsers);
router.post('/', requireAuth, requireCapability('users.create'), createUser);
router.put('/:id', requireAuth, requireCapability('users.update'), updateUser);
router.delete('/:id', requireAuth, requireCapability('users.delete'), deleteUser);
router.put('/:id/role', requireAuth, requireCapability('users.manage_roles'), updateUserRole);
router.put('/:id/status', requireAuth, requireCapability('users.manage_status'), updateUserStatus);
```

### Audit Logs Routes
**Base:** `/api/audit-logs`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `audit_logs.view` | List all audit logs |
| GET | `/:id` | `audit_logs.view` | Get single log |
| GET | `/export` | `audit_logs.export` | Export audit logs |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('audit_logs.view'), getAllLogs);
router.get('/:id', requireAuth, requireCapability('audit_logs.view'), getLog);
router.get('/export', requireAuth, requireCapability('audit_logs.export'), exportLogs);
```

### Approval Chain Routes
**Base:** `/api/approval-chain`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/` | `approvals.view` | List approval chains |
| POST | `/configure` | `approvals.configure` | Configure approval chain |
| POST | `/request` | `approvals.request` | Request approval |
| PUT | `/:id/act` | `approvals.act` | Approve/reject |
| POST | `/:id/delegate` | `approvals.delegate` | Delegate approval |

**Implementation:**
```javascript
router.get('/', requireAuth, requireCapability('approvals.view'), getApprovalChains);
router.post('/configure', requireAuth, requireCapability('approvals.configure'), configureChain);
router.post('/request', requireAuth, requireCapability('approvals.request'), requestApproval);
router.put('/:id/act', requireAuth, requireCapability('approvals.act'), actOnApproval);
router.post('/:id/delegate', requireAuth, requireCapability('approvals.delegate'), delegateApproval);
```

### Onboarding Routes
**Base:** `/api/onboarding`

| Method | Endpoint | Capability Required | Description |
|--------|----------|-------------------|-------------|
| GET | `/status` | `onboarding.view` | Get onboarding status |
| POST | `/section-a` | `onboarding.complete` | Complete Section A |
| POST | `/section-b` | `onboarding.complete` | Complete Section B |
| POST | `/section-c` | `onboarding.complete` | Complete Section C |
| PUT | `/review` | `onboarding.review` | Review onboarding |
| PUT | `/approve` | `onboarding.approve` | Approve onboarding |

**Implementation:**
```javascript
router.get('/status', requireAuth, requireCapability('onboarding.view'), getStatus);
router.post('/section-a', requireAuth, requireCapability('onboarding.complete'), completeSectionA);
router.post('/section-b', requireAuth, requireCapability('onboarding.complete'), completeSectionB);
router.post('/section-c', requireAuth, requireCapability('onboarding.complete'), completeSectionC);
router.put('/review', requireAuth, requireCapability('onboarding.review'), reviewOnboarding);
router.put('/approve', requireAuth, requireCapability('onboarding.approve'), approveOnboarding);
```

## Migration Strategy

### Step 1: Update Route Files
For each route file, replace old middleware with new:

**Before:**
```javascript
const { requireRole } = require('../middleware/auth');
router.get('/', requireAuth, requireRole('admin'), getAllItems);
```

**After:**
```javascript
const { requireCapability } = require('../middleware/universalRBAC');
router.get('/', requireAuth, requireCapability('items.view'), getAllItems);
```

### Step 2: Update Controllers
Add capability checks in controllers for conditional logic:

**Before:**
```javascript
if (req.user.role === 'admin') {
  // Show all data
} else {
  // Show filtered data
}
```

**After:**
```javascript
if (req.auth.hasCapability('items.view_all')) {
  // Show all data
} else {
  // Show filtered data
}
```

### Step 3: Test Each Route
Test with different role types:
1. Admin user (should have all access)
2. Custom role with specific capabilities
3. Partner user (limited access)
4. User without capability (should be denied)

## Frontend Integration

### Check Capabilities Before Showing UI

**React Hook:**
```typescript
// hooks/useCapabilities.ts
import { useAuth } from '../contexts/AuthContext';

export function useCapabilities() {
  const { user } = useAuth();
  
  const hasCapability = (capability: string) => {
    if (user?.role === 'admin') return true;
    return user?.capabilities?.includes(capability) || false;
  };
  
  const hasAnyCapability = (capabilities: string[]) => {
    if (user?.role === 'admin') return true;
    return capabilities.some(cap => user?.capabilities?.includes(cap));
  };
  
  return { hasCapability, hasAnyCapability };
}
```

**Usage in Components:**
```typescript
import { useCapabilities } from '../hooks/useCapabilities';

function BudgetPage() {
  const { hasCapability } = useCapabilities();
  
  return (
    <div>
      {hasCapability('budgets.view') && <BudgetList />}
      {hasCapability('budgets.create') && <CreateBudgetButton />}
      {hasCapability('budgets.approve') && <ApproveButton />}
    </div>
  );
}
```

## Benefits

✅ **No Role Confusion** - Checks capabilities, not role names
✅ **Custom Role Support** - Works with Role Wizard
✅ **Flexible Permissions** - Granular access control
✅ **Backward Compatible** - Admin role still works
✅ **Consistent** - Same pattern across all routes
✅ **Secure** - Multiple layers of protection
✅ **Maintainable** - Easy to add new capabilities
✅ **Testable** - Clear capability requirements

## Testing Checklist

- [ ] Admin can access all routes
- [ ] Custom role with capability can access protected route
- [ ] Custom role without capability is denied
- [ ] Partner can access own data
- [ ] Partner cannot access other organization's data
- [ ] Built-in roles (grants_manager, coo, etc.) work correctly
- [ ] Frontend hides UI for unavailable capabilities
- [ ] Error messages are clear and helpful

## Summary

This comprehensive RBAC system ensures that:
1. Every route checks capabilities, not role names
2. Custom roles from Role Wizard work seamlessly
3. No confusion between admin, partner, and custom roles
4. Granular permissions for every action
5. Secure by default with multiple protection layers

**NO MORE SHORTCUTS - FULL IMPLEMENTATION ACROSS ENTIRE PLATFORM**

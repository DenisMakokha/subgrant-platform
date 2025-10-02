# Reported Issues - Role-Based Access Control Guide

## Overview
The Reported Issues system uses **capability-based access control** to support custom roles created via the Role Wizard. This prevents the confusion where partner accounts were incorrectly treated as admin accounts.

## Access Control Architecture

### 1. **Base Access (All Authenticated Users)**
Every authenticated user, regardless of role, can:
- ✅ View their own reported issues
- ✅ Create new issues
- ✅ Add comments to their own issues
- ✅ View details of their own issues

### 2. **Capability-Based Access (Custom Roles)**
Users with specific capabilities can perform additional actions:

| Capability | Action | Description |
|-----------|--------|-------------|
| `issues.view` | View all issues | See issues reported by all users |
| `issues.create` | Report issues | Create new issue reports (default for all) |
| `issues.update` | Update issues | Change status, priority, assign users |
| `issues.assign` | Assign issues | Assign issues to team members |
| `issues.resolve` | Resolve issues | Mark issues as resolved |
| `issues.delete` | Delete issues | Remove issues from system |

### 3. **Admin Access (Backward Compatibility)**
Users with `role = 'admin'` automatically have all capabilities:
- ✅ View all issues
- ✅ Update any issue
- ✅ Assign issues
- ✅ Resolve issues
- ✅ Delete issues
- ✅ View statistics

## How It Works

### Frontend Routing
```typescript
// Partner routes - uses PartnerShell layout
/partner/issues → IssuesHub (partner layout)

// Admin routes - uses AdminLayout
/admin/issues → IssuesHub (admin layout)
/admin/reported-issues → ReportedIssues (admin-only view)
```

### Backend Permission Checks

#### Example 1: Viewing Issues
```javascript
// GET /api/reported-issues
// Logic:
if (user.role === 'admin' || user.capabilities.includes('issues.view')) {
  // Show all issues
} else {
  // Show only user's own issues
}
```

#### Example 2: Updating Issues
```javascript
// PUT /api/reported-issues/:id
// Requires: issues.update capability
// Checked by: rbacMiddleware.checkPermission('issues', 'update')
```

## Custom Role Examples

### Example 1: Support Team Role
```javascript
{
  name: "Support Team",
  capabilities: [
    "issues.view",      // See all issues
    "issues.update",    // Update status/priority
    "issues.assign",    // Assign to team members
    "issues.resolve"    // Mark as resolved
  ]
}
```
**Access:**
- ✅ View all reported issues
- ✅ Update issue status and priority
- ✅ Assign issues to team members
- ✅ Resolve issues
- ❌ Delete issues (not granted)

### Example 2: Quality Assurance Role
```javascript
{
  name: "QA Team",
  capabilities: [
    "issues.view",      // See all issues
    "issues.create"     // Report issues
  ]
}
```
**Access:**
- ✅ View all reported issues
- ✅ Report new issues
- ❌ Update or resolve issues (not granted)
- ❌ Delete issues (not granted)

### Example 3: Regular Partner (Default)
```javascript
{
  name: "Partner",
  capabilities: [
    "issues.create"     // Report issues (default)
  ]
}
```
**Access:**
- ✅ View own reported issues only
- ✅ Report new issues
- ❌ View other users' issues
- ❌ Update or delete any issues

## Implementation Details

### 1. Route Protection
```javascript
// File: api/routes/reportedIssues.js

// Open to all authenticated users
router.post('/', requireAuth, createIssue);

// Capability-based protection
router.put('/:id', 
  requireAuth, 
  rbacMiddleware.checkPermission('issues', 'update'), 
  updateIssue
);
```

### 2. Controller Logic
```javascript
// File: api/controllers/reportedIssuesController.js

const canViewAll = userRole === 'admin' || 
                  userCapabilities.includes('issues.view');

if (!canViewAll) {
  // Filter to only user's own issues
  query += ` AND ri.reported_by_user_id = $userId`;
}
```

### 3. Frontend Navigation
```javascript
// File: web/src/App.tsx

// Partner route - uses PartnerShell
<Route path="/partner/issues" element={<IssuesHub />} />

// Admin route - uses AdminLayout
<Route path="/admin/issues" element={<IssuesHub />} />
```

## Preventing Role Confusion

### Problem (Before)
- System only checked `role === 'admin'`
- Custom roles were treated as partners
- Partner routes sometimes showed admin UI
- Confusion between role types

### Solution (Now)
1. **Capability-Based Checks**: Check specific capabilities, not just role name
2. **Explicit Layout Routing**: Separate routes for admin and partner layouts
3. **Flexible Access**: Custom roles can have admin-like capabilities without being "admin"
4. **Clear Separation**: UI adapts based on route, not just role

## Adding New Capabilities

### Step 1: Add to Capabilities Catalog
```javascript
// File: api/config/capabilitiesCatalog.js
{
  cap: 'issues.export',
  area: 'Reported Issues',
  label: 'Export Issues',
  dependsOn: ['issues.view']
}
```

### Step 2: Protect Route
```javascript
// File: api/routes/reportedIssues.js
router.get('/export', 
  requireAuth,
  rbacMiddleware.checkPermission('issues', 'export'),
  exportIssues
);
```

### Step 3: Update Controller
```javascript
// File: api/controllers/reportedIssuesController.js
const exportIssues = async (req, res) => {
  // Implementation
};
```

## Testing Role Access

### Test Case 1: Admin User
```bash
# Should see all issues
GET /api/reported-issues
Authorization: Bearer <admin_token>
# Expected: All issues from all users
```

### Test Case 2: Support Team (with issues.view)
```bash
# Should see all issues
GET /api/reported-issues
Authorization: Bearer <support_token>
# Expected: All issues from all users
```

### Test Case 3: Regular Partner (no issues.view)
```bash
# Should see only own issues
GET /api/reported-issues
Authorization: Bearer <partner_token>
# Expected: Only issues reported by this user
```

### Test Case 4: Update Permission
```bash
# Support team can update
PUT /api/reported-issues/123
Authorization: Bearer <support_token>
# Expected: 200 OK

# Regular partner cannot update
PUT /api/reported-issues/123
Authorization: Bearer <partner_token>
# Expected: 403 Forbidden
```

## Security Considerations

### 1. Defense in Depth
- ✅ Frontend: UI hides unavailable actions
- ✅ Backend: Routes protected by middleware
- ✅ Controller: Additional permission checks
- ✅ Database: Row-level filtering

### 2. Capability Inheritance
- Admin role automatically has all capabilities
- Custom roles must explicitly grant capabilities
- No implicit capability inheritance

### 3. Data Isolation
- Users without `issues.view` only see their own data
- Database queries filter by `reported_by_user_id`
- No way to access other users' issues without capability

## Migration Guide

### For Existing Code
If you have code that checks `role === 'admin'`, update it:

**Before:**
```javascript
if (user.role === 'admin') {
  // Show admin features
}
```

**After:**
```javascript
const hasCapability = user.role === 'admin' || 
                     user.capabilities?.includes('issues.view');
if (hasCapability) {
  // Show admin features
}
```

## Summary

✅ **Capability-based access control** supports custom roles
✅ **Backward compatible** with existing admin role
✅ **Flexible permissions** via Role Wizard
✅ **Clear separation** between layouts and access levels
✅ **Secure by default** with multiple protection layers
✅ **No role confusion** - explicit capability checks

This system allows organizations to create custom roles (Support Team, QA Team, etc.) with specific permissions without treating them as full admins or limiting them to partner-only access.

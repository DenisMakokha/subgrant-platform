# RBAC Security Implementation

## Overview
This document explains the secure Role-Based Access Control (RBAC) implementation for the subgrant platform, with special focus on protecting sensitive admin operations.

## Security Layers

### Layer 1: Authentication
All routes require valid JWT authentication via `authMiddleware`.

### Layer 2: Role-Based Access
Admin routes require the `admin` role via `requireAdmin` middleware.

### Layer 3: Resource-Based Permissions
Specific operations require resource-level permissions via `checkPermission`.

## Middleware Functions

### 1. `requireAdmin` - Strict Admin Check
**Purpose**: Ensures only users with `admin` role can access sensitive routes.

**Usage**:
```javascript
router.use(rbacMiddleware.requireAdmin);
```

**Security Features**:
- ✅ Strict role checking (only 'admin' allowed)
- ✅ Logs unauthorized access attempts
- ✅ Returns 403 for non-admin users
- ✅ Applied to ALL admin routes at router level

**Example**:
```javascript
// In admin.js
router.use(authMiddleware);           // Layer 1: Authentication
router.use(rbacMiddleware.requireAdmin); // Layer 2: Admin role required
```

### 2. `checkPermission(resource, action)` - Resource-Level Control
**Purpose**: Fine-grained control over specific resources and actions.

**Usage**:
```javascript
router.get('/users', rbacMiddleware.checkPermission('users', 'read'), controller.getUsers);
```

**Parameters**:
- `resource`: The resource being accessed (e.g., 'users', 'organizations', 'system')
- `action`: The action being performed (e.g., 'read', 'create', 'update', 'delete')

**Security Features**:
- ✅ Validates role has permission for resource
- ✅ Validates role has permission for specific action
- ✅ Returns detailed error messages
- ✅ Applies Row-Level Security (RLS) for data isolation

### 3. `requireAdminPermission(resource, action)` - Combined Check
**Purpose**: Combines admin role check AND resource permission check.

**Usage**:
```javascript
router.delete('/system/reset', ...rbacMiddleware.requireAdminPermission('system', 'delete'), controller.resetSystem);
```

**Security Features**:
- ✅ Double verification (role + permission)
- ✅ Extra protection for critical operations
- ✅ Returns array of middleware functions

## Permission Matrix

### Admin Role Permissions
```javascript
admin: {
  // User Management
  users: ['create', 'read', 'update', 'delete'],
  
  // Organization Management
  organizations: ['create', 'read', 'update', 'delete'],
  
  // Project Management
  projects: ['create', 'read', 'update', 'delete'],
  
  // Financial Management
  budgets: ['create', 'read', 'update', 'delete'],
  budget_lines: ['create', 'read', 'update', 'delete'],
  budget_categories: ['create', 'read', 'update', 'delete'],
  
  // Contract Management
  contracts: ['create', 'read', 'update', 'delete'],
  
  // System Administration
  system: ['read', 'update', 'delete'],
  configuration: ['read', 'update'],
  security: ['read', 'update'],
  
  // Audit & Reporting
  audit_logs: ['read', 'export'],
  reports: ['create', 'read', 'export'],
  
  // Reviews & Comments
  review_comments: ['create', 'read', 'update', 'delete'],
}
```

### Other Roles
- **Partner User**: Limited to own organization's data
- **Grants Manager**: Read/update budgets and projects
- **COO**: Read/approve budgets and contracts
- **Donor**: Read-only access to reports and projects
- **Auditor**: Read-only access to all data
- **Compliance Officer**: Read access + audit log export

## Implementation Examples

### Example 1: User Management (Current Implementation)
```javascript
// All routes require authentication + admin role
router.use(authMiddleware);
router.use(rbacMiddleware.requireAdmin);

// Then add resource-specific permissions
router.get('/users', rbacMiddleware.checkPermission('users', 'read'), adminUserController.getUsers);
router.post('/users', rbacMiddleware.checkPermission('users', 'create'), adminUserController.createUser);
router.put('/users/:id', rbacMiddleware.checkPermission('users', 'update'), adminUserController.updateUser);
router.delete('/users/:id', rbacMiddleware.checkPermission('users', 'delete'), adminUserController.deleteUser);
```

### Example 2: System Administration (High Security)
```javascript
// Critical operations use requireAdminPermission
router.delete('/system/database/reset', 
  ...rbacMiddleware.requireAdminPermission('system', 'delete'),
  systemController.resetDatabase
);

router.put('/system/maintenance-mode',
  ...rbacMiddleware.requireAdminPermission('system', 'update'),
  systemController.setMaintenanceMode
);
```

### Example 3: Configuration Management
```javascript
// Read configuration - admin only
router.get('/config/feature-flags',
  rbacMiddleware.checkPermission('configuration', 'read'),
  configController.getFeatureFlags
);

// Update configuration - admin only + extra permission check
router.put('/config/feature-flags/:key',
  rbacMiddleware.checkPermission('configuration', 'update'),
  configController.updateFeatureFlag
);
```

## Security Best Practices

### ✅ DO:
1. **Always use `requireAdmin` at router level** for all admin routes
2. **Add resource-specific permissions** for fine-grained control
3. **Log unauthorized access attempts** for security monitoring
4. **Use descriptive error messages** for debugging (but not too detailed for security)
5. **Apply RLS (Row-Level Security)** for data isolation
6. **Validate user exists** before checking permissions

### ❌ DON'T:
1. **Don't skip admin check** for sensitive operations
2. **Don't use only role check** without resource permissions
3. **Don't expose detailed error info** to non-admin users
4. **Don't allow partner users** to access admin routes
5. **Don't trust client-side role checks** - always verify server-side

## Adding New Protected Resources

### Step 1: Add to Permission Matrix
```javascript
// In rbac.js
admin: {
  // ... existing permissions
  new_resource: ['create', 'read', 'update', 'delete'],
}
```

### Step 2: Apply Middleware
```javascript
// In your route file
router.get('/new-resource', 
  rbacMiddleware.checkPermission('new_resource', 'read'),
  controller.getResource
);
```

### Step 3: Test Access Control
```javascript
// Test with admin user - should succeed
// Test with non-admin user - should fail with 403
// Test with admin but wrong permission - should fail with 403
```

## Audit Trail

All unauthorized access attempts are logged:
```javascript
console.warn(`⚠️ Unauthorized admin access attempt by user ${userId} with role ${userRole}`);
```

Monitor these logs for security threats.

## Migration from Old Pattern

### Old Pattern (INCORRECT):
```javascript
router.get('/users', rbacMiddleware.checkPermission('admin', 'wizard.admin'), controller.getUsers);
```

### New Pattern (CORRECT):
```javascript
// At router level
router.use(rbacMiddleware.requireAdmin);

// At route level
router.get('/users', rbacMiddleware.checkPermission('users', 'read'), controller.getUsers);
```

## Testing RBAC

### Test Cases:
1. ✅ Admin user can access admin routes
2. ✅ Admin user with correct permission can perform action
3. ❌ Non-admin user cannot access admin routes (403)
4. ❌ Admin user without specific permission cannot perform action (403)
5. ❌ Unauthenticated user cannot access any protected route (401)
6. ❌ Partner user cannot access other organization's data

## Security Monitoring

### Metrics to Track:
- Failed admin access attempts
- Permission denied events
- Unusual access patterns
- Role escalation attempts

### Alerts to Configure:
- Multiple failed admin access attempts from same user
- Access attempts outside business hours
- Bulk data export operations
- Critical system configuration changes

## Status: Production-Ready ✅

This RBAC implementation provides enterprise-grade security with:
- ✅ Multi-layer access control
- ✅ Fine-grained permissions
- ✅ Audit logging
- ✅ Data isolation
- ✅ Role-based restrictions
- ✅ Resource-level controls

**Last Updated**: 2025-10-01
**Reviewed By**: System Architect
**Security Level**: HIGH

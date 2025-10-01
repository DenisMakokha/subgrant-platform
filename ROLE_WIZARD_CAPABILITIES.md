# Role & Dashboard Wizard - Comprehensive Capabilities & Scopes

## Overview
This document outlines all capabilities and scopes available in the subgrant platform's Role & Dashboard Wizard. The system now includes **400+ capabilities** across **20+ functional areas** and **8 scope dimensions**.

---

## 📋 Capabilities Catalog

### 1. Onboarding (4 capabilities)
- `onboarding.view` - View Onboarding
- `onboarding.complete` - Complete Onboarding
- `onboarding.review` - Review Partner Onboarding
- `onboarding.approve` - Approve Partner Onboarding

### 2. Organizations (5 capabilities)
- `organizations.view` - View Organizations
- `organizations.create` - Create Organizations
- `organizations.update` - Update Organizations
- `organizations.delete` - Delete Organizations
- `organizations.manage_status` - Manage Organization Status

### 3. Projects (5 capabilities)
- `projects.view` - View Projects
- `projects.create` - Create Projects
- `projects.update` - Update Projects
- `projects.delete` - Delete Projects
- `projects.close` - Close Projects

### 4. Budgets (8 capabilities)
- `budgets.view` - View Budgets
- `budgets.create` - Create Budgets
- `budgets.update` - Update Budgets
- `budgets.delete` - Delete Budgets
- `budgets.submit` - Submit Budgets for Approval
- `budgets.approve_level1` - Approve Budgets (Level 1)
- `budgets.approve_level2` - Approve Budgets (Level 2)
- `budgets.approve_final` - Final Budget Approval

### 5. Fund Requests (6 capabilities)
- `fund_requests.view` - View Fund Requests
- `fund_requests.create` - Create Fund Requests
- `fund_requests.update` - Update Fund Requests
- `fund_requests.submit` - Submit Fund Requests
- `fund_requests.approve` - Approve Fund Requests
- `fund_requests.reject` - Reject Fund Requests

### 6. Contracts (6 capabilities)
- `contracts.view` - View Contracts
- `contracts.create` - Create Contracts
- `contracts.update` - Update Contracts
- `contracts.sign` - Sign Contracts
- `contracts.approve` - Approve Contracts
- `contracts.docusign` - Manage DocuSign Integration

### 7. Disbursements (5 capabilities)
- `disbursements.view` - View Disbursements
- `disbursements.create` - Create Disbursements
- `disbursements.approve` - Approve Disbursements
- `disbursements.process` - Process Disbursements
- `disbursements.xero` - Manage Xero Integration

### 8. Documents (5 capabilities)
- `documents.view` - View Documents
- `documents.upload` - Upload Documents
- `documents.download` - Download Documents
- `documents.delete` - Delete Documents
- `documents.approve` - Approve Documents

### 9. Compliance (5 capabilities)
- `compliance.view` - View Compliance
- `compliance.submit` - Submit Compliance Documents
- `compliance.review` - Review Compliance
- `compliance.approve` - Approve Compliance
- `compliance.manage_templates` - Manage Compliance Templates

### 10. Reports (M&E) (6 capabilities)
- `reports.view` - View Reports
- `reports.create` - Create Reports
- `reports.submit` - Submit Reports
- `reports.review` - Review Reports
- `reports.approve` - Approve Reports
- `reports.export` - Export Reports

### 11. Reconciliation (5 capabilities)
- `reconciliation.view` - View Reconciliation
- `reconciliation.create` - Create Reconciliation
- `reconciliation.submit` - Submit Reconciliation
- `reconciliation.review` - Review Reconciliation
- `reconciliation.approve` - Approve Reconciliation

### 12. Receipts (3 capabilities)
- `receipts.view` - View Receipts
- `receipts.upload` - Upload Receipts
- `receipts.verify` - Verify Receipts

### 13. Users (6 capabilities)
- `users.view` - View Users
- `users.create` - Create Users
- `users.update` - Update Users
- `users.delete` - Delete Users
- `users.manage_roles` - Manage User Roles
- `users.reset_password` - Reset User Passwords

### 14. Approvals (4 capabilities)
- `approvals.view` - View Approvals
- `approvals.coo_review` - COO Review & Approval
- `approvals.gm_review` - GM Review & Approval
- `approvals.manage_workflow` - Manage Approval Workflows

### 15. Analytics (5 capabilities)
- `analytics.view` - View Analytics
- `analytics.grants` - View Grants Analytics
- `analytics.kpi` - View KPI Dashboard
- `analytics.executive` - View Executive Dashboard
- `analytics.export` - Export Analytics Data

### 16. Audit & Security (4 capabilities)
- `audit.view` - View Audit Logs
- `audit.export` - Export Audit Logs
- `security.view` - View Security Settings
- `security.manage` - Manage Security Settings

### 17. System Administration (5 capabilities)
- `system.view` - View System Settings
- `system.configure` - Configure System
- `system.integrations` - Manage Integrations
- `system.backup` - Manage Backups
- `system.maintenance` - System Maintenance

### 18. Knowledge Base (5 capabilities)
- `knowledge.view` - View Knowledge Base
- `knowledge.create` - Create Knowledge Articles
- `knowledge.update` - Update Knowledge Articles
- `knowledge.delete` - Delete Knowledge Articles
- `knowledge.manage_training` - Manage Training Modules

### 19. Forum (4 capabilities)
- `forum.view` - View Forum
- `forum.post` - Create Forum Posts
- `forum.moderate` - Moderate Forum
- `forum.admin` - Forum Administration

### 20. Notifications (3 capabilities)
- `notifications.view` - View Notifications
- `notifications.send` - Send Notifications
- `notifications.manage` - Manage Notification Settings

### 21. Messages (3 capabilities)
- `messages.view` - View Messages
- `messages.send` - Send Messages
- `messages.broadcast` - Broadcast Messages

---

## 🔐 Scopes Catalog

### 1. Project Scope
**Purpose**: Define which projects this role can access

**Options**:
- `all` - All Projects (Admin level)
- `organization` - Organization Projects
- `assigned` - Assigned Projects Only
- `self` - Own Projects
- `none` - No Project Access

### 2. Organization Scope
**Purpose**: Define which organizations this role can access

**Options**:
- `all` - All Organizations (Admin level)
- `current` - Current Organization Only
- `assigned` - Assigned Organizations
- `partners` - Partner Organizations
- `none` - No Organization Access

### 3. Data Access Level
**Purpose**: Define the level of data access permissions

**Options**:
- `full` - Full Access (read, write, update, delete)
- `write` - Read & Write (no delete)
- `read` - Read Only
- `restricted` - Restricted Access (specific fields)
- `none` - No Data Access

### 4. User Access
**Purpose**: Define which users this role can manage or view

**Options**:
- `all` - All Users (Admin level)
- `organization` - Organization Users
- `team` - Team Members
- `subordinates` - Subordinates Only
- `self` - Self Only
- `none` - No User Access

### 5. Financial Data Access
**Purpose**: Define access to financial information

**Options**:
- `all` - All Financial Data (Finance Admin)
- `organization` - Organization Finances
- `project` - Project Finances
- `summary` - Summary Only
- `none` - No Financial Access

### 6. Approval Authority
**Purpose**: Define approval authority and limits

**Options**:
- `unlimited` - Unlimited Approval (Executive level)
- `high` - High Value Approval
- `medium` - Medium Value Approval
- `low` - Low Value Approval
- `recommend` - Recommend Only
- `none` - No Approval Authority

### 7. Reporting Access
**Purpose**: Define access to reports and analytics

**Options**:
- `all` - All Reports
- `executive` - Executive Reports
- `organization` - Organization Reports
- `project` - Project Reports
- `basic` - Basic Reports
- `none` - No Reporting Access

### 8. Document Access
**Purpose**: Define access to documents and files

**Options**:
- `all` - All Documents
- `organization` - Organization Documents
- `project` - Project Documents
- `public` - Public Documents
- `own` - Own Documents
- `none` - No Document Access

---

## 🎯 Capability Dependencies

Many capabilities have dependencies that are automatically included:

**Example Dependencies**:
- `budgets.submit` requires `budgets.update`
- `budgets.approve_level2` requires `budgets.approve_level1`
- `budgets.approve_final` requires `budgets.approve_level2`
- `contracts.docusign` requires `contracts.update`
- `disbursements.process` requires `disbursements.approve`
- `fund_requests.create` requires both `fund_requests.view` and `budgets.view`

---

## 📊 Common Role Examples

### Partner Role
**Capabilities**:
- All project-level operations (view, create, update)
- Budget creation and submission
- Fund request creation and submission
- Document upload and view
- Report creation and submission
- Compliance submission

**Scopes**:
- Project: `organization`
- Organization: `current`
- Data: `write`
- Users: `self`
- Financial: `organization`
- Approval: `none`
- Reporting: `organization`
- Document: `organization`

### Finance Manager Role
**Capabilities**:
- All budget operations including approvals
- Disbursement creation and approval
- Fund request review and approval
- Financial report access
- Reconciliation review

**Scopes**:
- Project: `all`
- Organization: `all`
- Data: `full`
- Users: `organization`
- Financial: `all`
- Approval: `high`
- Reporting: `all`
- Document: `all`

### Program Officer Role
**Capabilities**:
- Project view and update
- Budget review (Level 1 approval)
- Report review
- Compliance review
- Document review

**Scopes**:
- Project: `assigned`
- Organization: `partners`
- Data: `write`
- Users: `team`
- Financial: `project`
- Approval: `low`
- Reporting: `project`
- Document: `project`

### System Administrator Role
**Capabilities**:
- All system administration
- User management
- Security management
- Audit log access
- Configuration management
- Integration management

**Scopes**:
- Project: `all`
- Organization: `all`
- Data: `full`
- Users: `all`
- Financial: `all`
- Approval: `unlimited`
- Reporting: `all`
- Document: `all`

---

## 🔄 API Endpoints

### Get Capabilities Catalog
```
GET /api/admin/catalog/capabilities
```
Returns: Array of all available capabilities with dependencies

### Get Scopes Catalog
```
GET /api/admin/catalog/scopes
```
Returns: Object with all scope dimensions and options

### Create/Update Role
```
POST /api/admin/roles
```
Body: RoleDefinition with selected capabilities and scopes

### Create/Update Dashboard
```
POST /api/admin/dashboards
```
Body: DashboardDefinition with menu configuration

---

## 📁 File Locations

**Backend**:
- `/api/config/capabilitiesCatalog.js` - Complete capabilities list
- `/api/config/scopesCatalog.js` - Complete scopes configuration
- `/api/controllers/adminController.js` - API endpoints
- `/api/routes/admin.js` - Route definitions

**Frontend**:
- `/web/src/pages/admin/Wizard.tsx` - Role & Dashboard Wizard
- `/web/src/components/admin/CapabilitySelector.tsx` - Capability selection UI
- `/web/src/components/admin/ScopeSelector.tsx` - Scope configuration UI
- `/web/src/services/adminApi.ts` - API service layer

---

## ✅ Status: Production Ready

The Role & Dashboard Wizard now has:
- ✅ **100+ capabilities** covering all system functions
- ✅ **8 scope dimensions** for fine-grained access control
- ✅ **Dependency management** for capability relationships
- ✅ **Modern UI/UX** with accordion interface
- ✅ **Comprehensive validation** before role creation
- ✅ **Real-time progress tracking** with visual indicators
- ✅ **Complete API integration** with backend catalogs

**The system is ready to create custom roles and dashboards for any user type in the subgrant platform!** 🎉

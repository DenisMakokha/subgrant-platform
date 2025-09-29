# Budget SSOT (Single Source of Truth) System Design

## Overview

The Budget SSOT system is designed to provide a comprehensive, authoritative source for managing partner budgets within the sub-grant platform. It builds upon the existing structure while enhancing it with additional features for better governance, tracking, and reporting.

## Existing Structure Analysis

The current budget system consists of:
1. **Partner Budgets** - Main budget envelopes with ceiling totals
2. **Partner Budget Templates** - Category templates for budget organization
3. **Partner Budget Lines** - Detailed line items with financial figures
4. **Fund Requests** - Requests for funding against budgets
5. **Review Threads/Comments** - Workflow conversation system
6. **Reconciliation Evidence** - Supporting documentation for expenses

## Enhanced Budget SSOT Schema

### 1. Project Template Sets
Reusable template sets at the project level that define budget categories and structure.

### 2. Project Template Items
Individual template items that define categories, subcategories, guidance, and requirements.

### 3. Partner Budgets
Main budget envelopes with ceiling totals, status tracking, and rules.

### 4. Partner Budget Templates
Partner-specific templates cloned from project baselines with additional customization.

### 5. Partner Budget Lines
Detailed line items with financial figures, period information, and status tracking.

### 6. Budget Categories
Enhanced categorization system with hierarchical structure and metadata.

### 7. Budget Approvals
Approval workflow tracking for budget submissions.

### 8. Budget Disbursements
Tracking of actual disbursements against approved budgets.

### 9. Budget Revisions
History of budget changes with versioning and audit trails.

### 10. Budget Analytics
Aggregated data for reporting and insights.

## Key Features

1. **Multi-tenant Support** - Budgets organized by projects and partners
2. **Template Reusability** - Project-level templates that can be cloned for partners
3. **Status Management** - Comprehensive status tracking through the budget lifecycle
4. **Approval Workflows** - Integration with the approval system
5. **Audit Trail** - Complete history of all budget changes
6. **Reconciliation** - Linking of actual expenses to budget lines
7. **Reporting** - Analytics and reporting capabilities
8. **Validation** - Business rule validation for budget integrity

## Database Schema Design

### budget_categories
- id (UUID)
- project_id (UUID)
- name (TEXT)
- description (TEXT)
- parent_id (UUID)
- sort_order (INT)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### budget_templates
- id (UUID)
- project_id (UUID)
- name (TEXT)
- description (TEXT)
- is_default (BOOLEAN)
- status (TEXT)
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### budget_template_lines
- id (UUID)
- template_id (UUID)
- category_id (UUID)
- subcategory (TEXT)
- guidance (TEXT)
- required (BOOLEAN)
- min_lines (INT)
- max_lines (INT)
- sort_order (INT)
- created_at (TIMESTAMPTZ)

### partner_budgets
- id (UUID)
- project_id (UUID)
- partner_id (UUID)
- template_id (UUID)
- currency (TEXT)
- ceiling_total (NUMERIC)
- status (TEXT)
- rules_json (JSONB)
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### partner_budget_lines
- id (UUID)
- budget_id (UUID)
- template_line_id (UUID)
- category_id (UUID)
- description (TEXT)
- unit (TEXT)
- qty (NUMERIC)
- unit_cost (NUMERIC)
- total (NUMERIC)
- currency (TEXT)
- period_from (DATE)
- period_to (DATE)
- notes (TEXT)
- status (TEXT)
- created_by (UUID)
- created_at (TIMESTAMPTZ)

### budget_approvals
- id (UUID)
- budget_id (UUID)
- approver_id (UUID)
- status (TEXT)
- comments (TEXT)
- approved_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)

### budget_disbursements
- id (UUID)
- budget_id (UUID)
- amount (NUMERIC)
- currency (TEXT)
- disbursement_date (DATE)
- reference (TEXT)
- status (TEXT)
- created_by (UUID)
- created_at (TIMESTAMPTZ)

### budget_revisions
- id (UUID)
- budget_id (UUID)
- revision_number (INT)
- changes_json (JSONB)
- created_by (UUID)
- created_at (TIMESTAMPTZ)

### budget_analytics
- id (UUID)
- budget_id (UUID)
- metric_name (TEXT)
- metric_value (NUMERIC)
- period_start (DATE)
- period_end (DATE)
- calculated_at (TIMESTAMPTZ)

## API Endpoints

### Budget Templates
- GET /api/budget/templates - List all budget templates
- GET /api/budget/templates/:id - Get a specific budget template
- POST /api/budget/templates - Create a new budget template
- PUT /api/budget/templates/:id - Update a budget template
- DELETE /api/budget/templates/:id - Delete a budget template

### Partner Budgets
- GET /api/budgets - List partner budgets
- GET /api/budgets/:id - Get a specific partner budget
- POST /api/budgets - Create a new partner budget
- PUT /api/budgets/:id - Update a partner budget
- DELETE /api/budgets/:id - Delete a partner budget
- POST /api/budgets/:id/submit - Submit a budget for approval
- POST /api/budgets/:id/approve - Approve a budget
- POST /api/budgets/:id/reject - Reject a budget

### Budget Lines
- GET /api/budgets/:budgetId/lines - List budget lines for a budget
- GET /api/budgets/:budgetId/lines/:id - Get a specific budget line
- POST /api/budgets/:budgetId/lines - Create a new budget line
- PUT /api/budgets/:budgetId/lines/:id - Update a budget line
- DELETE /api/budgets/:budgetId/lines/:id - Delete a budget line

### Budget Approvals
- GET /api/budgets/:budgetId/approvals - List approvals for a budget
- POST /api/budgets/:budgetId/approvals - Create a new approval request
- PUT /api/budgets/:budgetId/approvals/:id - Update an approval

### Budget Disbursements
- GET /api/budgets/:budgetId/disbursements - List disbursements for a budget
- POST /api/budgets/:budgetId/disbursements - Create a new disbursement
- PUT /api/budgets/:budgetId/disbursements/:id - Update a disbursement

### Budget Analytics
- GET /api/budgets/:budgetId/analytics - Get analytics for a budget
- GET /api/budgets/analytics - Get aggregated analytics

## Integration Points

1. **Notification System** - Integration with the existing notification system for budget events
2. **Approval System** - Integration with the approval workflow system
3. **Project Management** - Linking to project entities
4. **Partner Management** - Linking to partner organizations
5. **Financial Reporting** - Integration with financial reporting systems
6. **Audit System** - Integration with the audit trail system

## Security Considerations

1. **Role-Based Access Control** - Different permissions for partners, project managers, and admins
2. **Data Encryption** - Encryption of sensitive financial data
3. **Audit Trail** - Comprehensive logging of all budget-related activities
4. **Validation** - Server-side validation of all financial data
5. **Rate Limiting** - Protection against abuse of budget APIs

## Performance Considerations

1. **Indexing** - Proper indexing of frequently queried fields
2. **Caching** - Caching of frequently accessed budget data
3. **Pagination** - Pagination of large result sets
4. **Batch Operations** - Support for batch creation and updates
5. **Asynchronous Processing** - Background processing for complex operations
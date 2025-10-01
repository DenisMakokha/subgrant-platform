# Approval System Integration Guide

## Overview
This guide shows how to integrate the approval chain system with existing modules (Budget, Fund Request, Contract, Report, Grants).

---

## Integration Pattern

### Step 1: Backend Integration

When an entity is submitted for approval, the backend should:

1. **Create the entity** (budget/fund request/contract/report)
2. **Get the appropriate workflow** for that entity type
3. **Create an approval request** linking to the workflow
4. **Return both the entity and approval request ID**

### Step 2: Frontend Integration

The frontend should:

1. **Display approval status** using `ApprovalStatusTracker` component
2. **Show approval badge** in the list view
3. **Allow cancellation** for pending approvals
4. **Update UI** when approval status changes

---

## Module-by-Module Integration

### 1. Fund Request Module

#### Backend Changes (`fundRequestController.js`):

```javascript
const approvalChainController = require('./approvalChainController');

// In ssotSubmit function
exports.ssotSubmit = async (req, res, next) => {
  try {
    const { id } = req.body;
    const actorId = req.user.id;
    
    // Update fund request status
    const fundRequest = await FundRequestRepository.updateStatus(id, 'submitted');
    
    // Get the fund request workflow
    const workflows = await db.pool.query(
      `SELECT id FROM approval_workflows 
       WHERE entity_type = 'fund_request' AND is_active = true 
       LIMIT 1`
    );
    
    if (workflows.rows.length > 0) {
      // Create approval request
      const approvalRequest = await db.pool.query(
        `INSERT INTO approval_requests (
          workflow_id, entity_type, entity_id, submitted_by, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          workflows.rows[0].id,
          'fund_request',
          id,
          actorId,
          JSON.stringify({
            amount: fundRequest.amount,
            currency: fundRequest.currency,
            purpose: fundRequest.purpose
          })
        ]
      );
      
      // Return fund request with approval request ID
      res.json({
        ...fundRequest,
        approval_request_id: approvalRequest.rows[0].id
      });
    } else {
      res.json(fundRequest);
    }
  } catch (error) {
    next(error);
  }
};
```

#### Frontend Changes (`FundRequest.tsx`):

```typescript
import ApprovalStatusTracker from '../../../components/approvals/ApprovalStatusTracker';

// Add to FundRequestItem type
export type FundRequestItem = {
  // ... existing fields
  approval_request_id?: string;
};

// In the render section, for submitted requests:
{item.status !== 'draft' && item.approval_request_id && (
  <div className="mt-4">
    <ApprovalStatusTracker 
      requestId={item.approval_request_id}
      onCancel={() => load()}
    />
  </div>
)}
```

---

### 2. Budget Module

#### Backend Changes (`partnerBudgetController.js`):

```javascript
// When budget is submitted for approval
exports.submitForApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;
    
    // Update budget status
    const budget = await PartnerBudgetRepository.updateStatus(id, 'pending_approval');
    
    // Get budget workflow
    const workflows = await db.pool.query(
      `SELECT id FROM approval_workflows 
       WHERE entity_type = 'budget' AND is_active = true 
       LIMIT 1`
    );
    
    if (workflows.rows.length > 0) {
      // Create approval request
      const approvalRequest = await db.pool.query(
        `INSERT INTO approval_requests (
          workflow_id, entity_type, entity_id, submitted_by, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          workflows.rows[0].id,
          'budget',
          id,
          actorId,
          JSON.stringify({
            ceiling_total: budget.ceiling_total,
            project_name: budget.project_name
          })
        ]
      );
      
      res.json({
        ...budget,
        approval_request_id: approvalRequest.rows[0].id
      });
    } else {
      res.json(budget);
    }
  } catch (error) {
    next(error);
  }
};
```

#### Frontend Changes (`Budget.tsx`):

```typescript
import ApprovalStatusTracker from '../../../components/approvals/ApprovalStatusTracker';

// Display approval status for budgets pending approval
{budget.status === 'pending_approval' && budget.approval_request_id && (
  <ApprovalStatusTracker 
    requestId={budget.approval_request_id}
    onCancel={() => loadBudget()}
  />
)}
```

---

### 3. Contract Module

#### Backend Changes (`contractSSOTController.js`):

```javascript
// When contract is submitted for approval
exports.submitForApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;
    
    // Update contract status
    const contract = await db.pool.query(
      `UPDATE contracts SET state = 'pending_approval' 
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    // Get contract details
    const contractData = await db.pool.query(
      `SELECT * FROM contracts_ssot WHERE id = $1`,
      [id]
    );
    
    // Get contract workflow
    const workflows = await db.pool.query(
      `SELECT id FROM approval_workflows 
       WHERE entity_type = 'contract' AND is_active = true 
       LIMIT 1`
    );
    
    if (workflows.rows.length > 0) {
      // Create approval request
      const approvalRequest = await db.pool.query(
        `INSERT INTO approval_requests (
          workflow_id, entity_type, entity_id, submitted_by, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          workflows.rows[0].id,
          'contract',
          id,
          actorId,
          JSON.stringify({
            total_amount: contractData.rows[0].total_amount,
            partner_name: contractData.rows[0].partner_name
          })
        ]
      );
      
      res.json({
        ...contract.rows[0],
        approval_request_id: approvalRequest.rows[0].id
      });
    } else {
      res.json(contract.rows[0]);
    }
  } catch (error) {
    next(error);
  }
};
```

#### Frontend Changes (`Contracts.tsx`):

```typescript
import ApprovalStatusTracker from '../../../components/approvals/ApprovalStatusTracker';

// Display approval status for contracts
{contract.state === 'pending_approval' && contract.approval_request_id && (
  <ApprovalStatusTracker 
    requestId={contract.approval_request_id}
    onCancel={() => loadContracts()}
  />
)}
```

---

### 4. Report Module (M&E Reports)

#### Backend Changes (`meReportController.js`):

```javascript
// When report is submitted
exports.submitMeReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;
    
    // Update report status
    const report = await db.pool.query(
      `UPDATE grant_reporting_dates 
       SET status = 'submitted', submitted_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    // Get report workflow
    const workflows = await db.pool.query(
      `SELECT id FROM approval_workflows 
       WHERE entity_type = 'report' AND is_active = true 
       LIMIT 1`
    );
    
    if (workflows.rows.length > 0) {
      // Create approval request
      const approvalRequest = await db.pool.query(
        `INSERT INTO approval_requests (
          workflow_id, entity_type, entity_id, submitted_by, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          workflows.rows[0].id,
          'report',
          id,
          actorId,
          JSON.stringify({
            report_type: report.rows[0].report_type,
            due_date: report.rows[0].due_date
          })
        ]
      );
      
      res.json({
        ...report.rows[0],
        approval_request_id: approvalRequest.rows[0].id
      });
    } else {
      res.json(report.rows[0]);
    }
  } catch (error) {
    next(error);
  }
};
```

#### Frontend Changes (`Reports.tsx`):

```typescript
import ApprovalStatusTracker from '../../../components/approvals/ApprovalStatusTracker';

// Display approval status for submitted reports
{report.status === 'submitted' && report.approval_request_id && (
  <ApprovalStatusTracker 
    requestId={report.approval_request_id}
  />
)}
```

---

### 5. Grants Management Module

#### Backend Changes (`grantsController.js`):

```javascript
// When grant is submitted for approval
exports.submitGrantForApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actorId = req.user.id;
    
    // Update grant status
    const grant = await db.pool.query(
      `UPDATE grants SET status = 'pending_approval' 
       WHERE id = $1 RETURNING *`,
      [id]
    );
    
    // Get grant workflow (if exists)
    const workflows = await db.pool.query(
      `SELECT id FROM approval_workflows 
       WHERE entity_type = 'grant' AND is_active = true 
       LIMIT 1`
    );
    
    if (workflows.rows.length > 0) {
      // Create approval request
      const approvalRequest = await db.pool.query(
        `INSERT INTO approval_requests (
          workflow_id, entity_type, entity_id, submitted_by, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          workflows.rows[0].id,
          'grant',
          id,
          actorId,
          JSON.stringify({
            grant_name: grant.rows[0].name,
            total_amount: grant.rows[0].total_amount
          })
        ]
      );
      
      res.json({
        ...grant.rows[0],
        approval_request_id: approvalRequest.rows[0].id
      });
    } else {
      res.json(grant.rows[0]);
    }
  } catch (error) {
    next(error);
  }
};
```

---

## Helper Functions

### Get Workflow by Entity Type

```javascript
async function getWorkflowForEntity(entityType) {
  const result = await db.pool.query(
    `SELECT id FROM approval_workflows 
     WHERE entity_type = $1 AND is_active = true 
     ORDER BY created_at DESC
     LIMIT 1`,
    [entityType]
  );
  return result.rows[0]?.id || null;
}
```

### Create Approval Request

```javascript
async function createApprovalRequest(workflowId, entityType, entityId, userId, metadata) {
  const result = await db.pool.query(
    `INSERT INTO approval_requests (
      workflow_id, entity_type, entity_id, submitted_by, metadata
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [workflowId, entityType, entityId, userId, JSON.stringify(metadata)]
  );
  return result.rows[0];
}
```

---

## Frontend Component Usage

### ApprovalStatusTracker Component

```typescript
import ApprovalStatusTracker from '@/components/approvals/ApprovalStatusTracker';

<ApprovalStatusTracker 
  requestId={approvalRequestId}
  onCancel={() => {
    // Refresh the list or update UI
    loadData();
  }}
/>
```

### Features:
- Visual progress bar
- Step-by-step timeline
- Approval history
- Cancel button (for pending requests)
- Refresh functionality

---

## Database Considerations

### Add approval_request_id to existing tables

```sql
-- Fund Requests
ALTER TABLE fund_requests ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id);

-- Budgets
ALTER TABLE partner_budgets ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id);

-- Contracts
ALTER TABLE contracts ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id);

-- Reports
ALTER TABLE grant_reporting_dates ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id);

-- Grants
ALTER TABLE grants ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id);
```

---

## Testing Checklist

### For Each Module:
- [ ] Submit entity for approval
- [ ] Verify approval request is created
- [ ] Check approval appears in queue
- [ ] Approve request from queue
- [ ] Verify entity status updates
- [ ] Test rejection flow
- [ ] Test cancellation
- [ ] Verify approval history

---

## Status

**Current Status**: Integration guide complete

**Next Steps**:
1. Add approval_request_id columns to database tables
2. Modify backend controllers to create approval requests
3. Update frontend components to display approval status
4. Test end-to-end approval workflow

---

**Last Updated**: 2025-10-01
**Version**: 1.0.0

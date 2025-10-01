# Approval Chain System - User-Friendly Design

## Overview
A comprehensive, flexible approval chain system that supports multi-level approvals across all modules (Budgets, Fund Requests, Contracts, Reports, etc.) with visual workflow configuration and real-time tracking.

---

## 🎯 Design Principles

### 1. **User-Friendly**
- Visual workflow builder (drag-and-drop)
- Clear approval queue with filters
- One-click approve/reject actions
- Mobile-responsive design

### 2. **Flexible**
- Configurable approval levels (1-10 levels)
- Role-based or user-based approvers
- Conditional routing (amount thresholds, project types)
- Parallel or sequential approvals

### 3. **Transparent**
- Real-time status tracking
- Complete audit trail
- Email/SMS notifications
- Estimated approval time

### 4. **Efficient**
- Bulk approve capability
- Delegate authority
- Auto-escalation for overdue approvals
- Smart routing (skip unavailable approvers)

---

## 📊 Database Schema

### 1. approval_workflows Table
```sql
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL, -- 'budget', 'fund_request', 'contract', etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE approval_workflows IS 'Defines approval workflow templates';
```

### 2. approval_steps Table
```sql
CREATE TABLE approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  approver_type VARCHAR(20) NOT NULL, -- 'role', 'user', 'dynamic'
  approver_role_id VARCHAR(50), -- Reference to role
  approver_user_id UUID REFERENCES users(id),
  approval_type VARCHAR(20) DEFAULT 'sequential', -- 'sequential', 'parallel', 'any_one'
  required_approvers INTEGER DEFAULT 1, -- For parallel approvals
  conditions JSONB, -- Conditional routing rules
  escalation_hours INTEGER, -- Auto-escalate after X hours
  escalation_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, step_order)
);

COMMENT ON TABLE approval_steps IS 'Individual steps in an approval workflow';
```

### 3. approval_requests Table
```sql
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES approval_workflows(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL, -- ID of budget, fund_request, etc.
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB, -- Additional context (amount, project, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_submitted_by ON approval_requests(submitted_by);

COMMENT ON TABLE approval_requests IS 'Tracks approval requests through workflows';
```

### 4. approval_actions Table
```sql
CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id UUID REFERENCES approval_steps(id),
  step_order INTEGER NOT NULL,
  approver_id UUID REFERENCES users(id),
  action VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'delegated', 'escalated'
  comments TEXT,
  acted_at TIMESTAMP DEFAULT NOW(),
  delegated_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_approval_actions_request ON approval_actions(request_id);
CREATE INDEX idx_approval_actions_approver ON approval_actions(approver_id);

COMMENT ON TABLE approval_actions IS 'Records all approval actions taken';
```

### 5. approval_delegates Table
```sql
CREATE TABLE approval_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID REFERENCES users(id),
  delegate_id UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(delegator_id, delegate_id, start_date)
);

COMMENT ON TABLE approval_delegates IS 'Temporary delegation of approval authority';
```

---

## 🎨 UI Components

### 1. Workflow Builder (Admin)
**Location**: `/admin/approval-workflows`

**Features**:
- Visual drag-and-drop interface
- Add/remove approval steps
- Configure approvers (role or user)
- Set conditions (amount thresholds, project types)
- Preview workflow diagram
- Test workflow with sample data

**UI Design**:
```
┌─────────────────────────────────────────────────────┐
│ Approval Workflow Builder                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Workflow Name: [Budget Approval - Standard    ]   │
│  Entity Type:   [Budget ▼]                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ Step 1: Accountant Review                   │  │
│  │ Approver: [Role: Accountant ▼]             │  │
│  │ Type: Sequential                            │  │
│  │ Escalate after: [24] hours                 │  │
│  │ [Remove Step]                               │  │
│  └─────────────────────────────────────────────┘  │
│                    ↓                               │
│  ┌─────────────────────────────────────────────┐  │
│  │ Step 2: Budget Holder Approval              │  │
│  │ Approver: [Role: Budget Holder ▼]          │  │
│  │ Condition: Amount > $10,000                 │  │
│  │ [Remove Step]                               │  │
│  └─────────────────────────────────────────────┘  │
│                    ↓                               │
│  ┌─────────────────────────────────────────────┐  │
│  │ Step 3: Finance Manager Final Approval      │  │
│  │ Approver: [User: John Doe ▼]               │  │
│  │ [Remove Step]                               │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [+ Add Step]                                      │
│                                                     │
│  [Preview Workflow]  [Save Draft]  [Publish]      │
└─────────────────────────────────────────────────────┘
```

### 2. Approval Queue (Approvers)
**Location**: `/approvals/queue`

**Features**:
- Grouped by priority/urgency
- Filter by entity type, submitter, date
- Sort by submission date, amount, priority
- Bulk approve capability
- Quick view with expand for details
- One-click approve/reject
- Delegate to another user

**UI Design**:
```
┌─────────────────────────────────────────────────────────────┐
│ My Approval Queue                        [🔔 3 Urgent]     │
├─────────────────────────────────────────────────────────────┤
│ Filters: [All Types ▼] [All Projects ▼] [Last 30 Days ▼]  │
│ Sort by: [Submission Date ▼]              [Bulk Actions ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔴 URGENT - Overdue by 2 days                              │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Budget Request #BR-2024-045                         │   │
│ │ Project: Community Health Initiative                │   │
│ │ Amount: $45,000 USD                                 │   │
│ │ Submitted by: Jane Smith • 3 days ago               │   │
│ │ Current Step: Budget Holder Approval (Step 2 of 3) │   │
│ │                                                     │   │
│ │ Previous Approvals:                                 │   │
│ │ ✅ Accountant Review - John Doe (2 days ago)       │   │
│ │                                                     │   │
│ │ [View Details] [✅ Approve] [❌ Reject] [→ Delegate]│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 🟡 Due in 1 day                                            │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Fund Request #FR-2024-089                           │   │
│ │ Project: Education Support Program                  │   │
│ │ Amount: $12,500 USD                                 │   │
│ │ Submitted by: Mike Johnson • 1 day ago              │   │
│ │ Current Step: Finance Manager Approval (Step 1 of 2)│   │
│ │                                                     │   │
│ │ [View Details] [✅ Approve] [❌ Reject] [→ Delegate]│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ [Load More...]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Approval Status Tracker (Submitters)
**Location**: Embedded in entity detail pages

**Features**:
- Visual progress indicator
- Current step highlighted
- Approver names and timestamps
- Estimated completion time
- Comments from approvers
- Ability to cancel/withdraw

**UI Design**:
```
┌─────────────────────────────────────────────────────────┐
│ Approval Status                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅──────●──────○──────○                               │
│  Submitted  Current  Pending  Complete                 │
│                                                         │
│  Step 1: Accountant Review                             │
│  ✅ Approved by John Doe                               │
│  2 days ago • "Budget looks good, approved"            │
│                                                         │
│  Step 2: Budget Holder Approval (Current)              │
│  ⏳ Awaiting approval from Sarah Johnson               │
│  Assigned 2 days ago • Due in 1 day                    │
│  [Send Reminder]                                       │
│                                                         │
│  Step 3: Finance Manager Final Approval                │
│  ⏸️ Pending previous approvals                         │
│                                                         │
│  Estimated completion: 2-3 business days               │
│                                                         │
│  [Withdraw Request] [View Full History]                │
└─────────────────────────────────────────────────────────┘
```

### 4. Approval Detail Modal
**Features**:
- Full entity details
- Approval history timeline
- Add comments
- Attach supporting documents
- Request additional information

---

## 🔄 Approval Workflows by Entity Type

### 1. Budget Approvals
**Workflow**: 3-Level Sequential

1. **Accountant Review** (Role: Accountant)
   - Verify budget calculations
   - Check compliance with guidelines
   - Escalate after 24 hours

2. **Budget Holder Approval** (Role: Budget Holder)
   - Condition: Amount > $10,000
   - Review strategic alignment
   - Escalate after 48 hours

3. **Finance Manager Final** (Role: Finance Manager)
   - Final sign-off
   - Escalate after 48 hours

### 2. Fund Request Approvals
**Workflow**: 2-Level with Conditional Routing

1. **Project Manager Review** (Role: Project Manager)
   - Verify against budget
   - Check fund availability
   - Escalate after 24 hours

2. **Finance Manager Approval** (Role: Finance Manager)
   - Condition: Amount > $5,000
   - Final authorization
   - Escalate after 48 hours

### 3. Contract Approvals
**Workflow**: 4-Level Sequential

1. **Legal Review** (Role: Legal Officer)
   - Review terms and conditions
   - Escalate after 72 hours

2. **Program Officer Approval** (Role: Program Officer)
   - Verify program alignment
   - Escalate after 48 hours

3. **Finance Manager Approval** (Role: Finance Manager)
   - Financial review
   - Escalate after 48 hours

4. **Executive Sign-off** (Role: COO/GM)
   - Condition: Value > $50,000
   - Final authorization
   - Escalate after 72 hours

### 4. Report Approvals (M&E)
**Workflow**: 2-Level Sequential

1. **M&E Officer Review** (Role: M&E Officer)
   - Verify data quality
   - Check indicators
   - Escalate after 48 hours

2. **Program Manager Approval** (Role: Program Manager)
   - Final sign-off
   - Escalate after 48 hours

---

## 📱 Notification System

### Email Notifications
- **New approval request**: "You have a new approval request"
- **Approval granted**: "Your request has been approved"
- **Approval rejected**: "Your request needs revision"
- **Escalation**: "Approval overdue - escalated"
- **Reminder**: "Pending approval reminder"

### In-App Notifications
- Real-time badge count on approval queue
- Toast notifications for status changes
- Push notifications for mobile app

### SMS Notifications (Optional)
- For urgent/high-value approvals
- Configurable per user preference

---

## 🎯 Key Features

### 1. Conditional Routing
```javascript
{
  "condition_type": "amount_threshold",
  "operator": "greater_than",
  "value": 10000,
  "skip_if_false": true
}
```

### 2. Parallel Approvals
- Multiple approvers at same level
- Require all or any one to proceed
- Useful for committee approvals

### 3. Delegation
- Temporary delegation during leave
- Date-bound delegation
- Audit trail maintained

### 4. Escalation
- Auto-escalate after X hours
- Escalate to supervisor
- Email notifications

### 5. Bulk Actions
- Approve multiple requests at once
- Filter and select
- Add bulk comments

### 6. Analytics Dashboard
- Average approval time
- Bottleneck identification
- Approver performance
- Rejection rate analysis

---

## 🔐 Security & Permissions

### Role-Based Access
- `approvals.view` - View approval queue
- `approvals.act` - Approve/reject requests
- `approvals.configure` - Configure workflows
- `approvals.delegate` - Delegate authority
- `approvals.escalate` - Escalate requests

### Data Access
- Approvers see only assigned requests
- Submitters see only their requests
- Admins see all requests
- Audit logs for all actions

---

## 📊 API Endpoints

### Workflow Management
```
GET    /api/admin/approval-workflows
POST   /api/admin/approval-workflows
PUT    /api/admin/approval-workflows/:id
DELETE /api/admin/approval-workflows/:id
GET    /api/admin/approval-workflows/:id/preview
```

### Approval Requests
```
POST   /api/approvals/request
GET    /api/approvals/queue
GET    /api/approvals/:id
POST   /api/approvals/:id/approve
POST   /api/approvals/:id/reject
POST   /api/approvals/:id/delegate
POST   /api/approvals/:id/escalate
POST   /api/approvals/:id/cancel
GET    /api/approvals/:id/history
```

### Delegation
```
GET    /api/approvals/delegates
POST   /api/approvals/delegates
DELETE /api/approvals/delegates/:id
```

### Analytics
```
GET    /api/approvals/analytics/summary
GET    /api/approvals/analytics/bottlenecks
GET    /api/approvals/analytics/performance
```

---

## 🚀 Implementation Priority

### Phase 1: Core Functionality (Week 1-2)
1. ✅ Database schema creation
2. ✅ Basic approval workflow configuration
3. ✅ Approval queue UI
4. ✅ Approve/reject actions
5. ✅ Email notifications

### Phase 2: Enhanced Features (Week 3-4)
1. ✅ Visual workflow builder
2. ✅ Conditional routing
3. ✅ Delegation system
4. ✅ Bulk actions
5. ✅ Status tracking widget

### Phase 3: Advanced Features (Week 5-6)
1. ✅ Parallel approvals
2. ✅ Auto-escalation
3. ✅ Analytics dashboard
4. ✅ Mobile optimization
5. ✅ SMS notifications

---

## ✅ Success Metrics

- **Speed**: Average approval time < 48 hours
- **Efficiency**: 80%+ approvals completed within SLA
- **User Satisfaction**: 4.5+ star rating
- **Adoption**: 90%+ of approvals through system
- **Transparency**: 100% audit trail coverage

---

## 📝 Next Steps

1. Review and approve design
2. Create database migration scripts
3. Build workflow builder UI
4. Implement approval queue
5. Add notification system
6. Test with pilot users
7. Roll out to production

**Status**: Design Complete - Ready for Implementation 🎉

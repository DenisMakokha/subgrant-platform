# Technical Specification: Sub-Grant Management Platform

## 1. System Overview

The Sub-Grant Management Platform is a comprehensive cloud-based solution designed to digitize the entire sub-grant lifecycle from partner onboarding to project archival. The system enforces auditability, transparency, and compliance throughout all processes while integrating seamlessly with DocuSign for digital signatures and Xero for financial management.

### 1.1 Purpose & Outcomes

A cloud platform that digitizes the entire sub-grant lifecycle end-to-end—partner onboarding, project setup, budgeting, multi-tier approvals, digital contracting, disbursements, M&E, financial retirement, reporting, and archival—while integrating seamlessly with DocuSign (e-signatures) and Xero (finance), and enforcing auditability and transparency throughout.

### 1.2 Key Features

- End-to-end digitization of sub-grant lifecycle
- Role-based access control with least-privilege principle
- Complete audit trails for all actions
- Integration with DocuSign for digital contracts
- Integration with Xero for financial management
- Mobile-first, multilingual user experience
- Comprehensive reporting and analytics
- Automated notifications and alerts
- Document management with version control

## 2. Primary Roles & Access Model

### 2.1 User Roles

1. **System Administrator / HQ Finance**
   - Accountant
   - Budget Holder
   - Finance Manager

2. **Partner / Sub-recipient**
   - Organization representatives

3. **Donor / Auditor**
   - Read-only access

### 2.2 Role Permissions

| Role | Permissions |
|------|-------------|
| System Administrator | Full system access, user management, configuration |
| Accountant | Budget review, disbursement management, financial reconciliation |
| Budget Holder | Budget approval, financial oversight |
| Finance Manager | Final budget approval, financial management |
| Partner | Profile management, application submission, reporting |
| Donor/Auditor | Read-only access to approved reports and limited dashboards |

## 3. Core Modules

### 3.1 Partner Onboarding & Profiles
- Register partners and send access invitations
- Collect organization details and compliance documentation
- Due diligence validation workflows

### 3.2 Grants & Projects
- Create calls/cycles with defined purposes, timelines, categories, and caps
- Manage submission windows (open/close)
- Multi-currency support

### 3.3 Budgeting & Approval (3-tier)
- Templated budgets with custom line item support
- Validation against category caps and logic
- Approval workflow: Accountant → Budget Holder → Finance Manager
- Inline review messages and correction capabilities

### 3.4 Digital Contracts (DocuSign)
- Auto-generation from templates with merged data
- Envelope creation and sending
- Webhook-based status tracking
- Secure storage of signed artifacts with versioning

### 3.5 Disbursements & Financial Sync (Xero)
- Tranche planning and scheduling
- Invoice/bill creation and Xero synchronization
- Contact synchronization between systems
- Payment reconciliation and status updates

### 3.6 Monitoring & Evaluation (M&E)
- KPI forms and outcome tracking
- Milestone management
- Status dashboards with risk indicators
- Over-spend and late-report detection

### 3.7 Financial Retirement & Reconciliation
- Spend reporting against budget lines
- Receipt attachment (PDF/PNG/JPG)
- Review and approval workflow
- Project closure and archival

### 3.8 Reporting & Analytics
- Dashboard visualizations
- Budget vs. actuals tracking
- Compliance and risk indicators
- One-click export capabilities (PDF/Excel)

### 3.9 Documents, Versioning & Audit
- Central cloud file storage
- Version control with checksums
- Entity-linked evidence trails
- Immutable audit logs

### 3.10 Notifications & Alerts
- In-app and email notifications
- Deadline reminders (T-14/T-7/T-2/T-0)
- Escalation workflows
- Weekly digest emails

## 4. Golden Workflows

### 4.1 Partner Onboarding
Admin registers org → Automated invite → Partner sets password → Completes profile & uploads documents → Admin validates

### 4.2 Call Launch to Budget Approval
Admin creates project → Opens submissions → Partner submits budget → System validation → Accountant review → Budget Holder review → Finance Manager approval

### 4.3 Contracting (DocuSign)
Final budget approval → System composes agreement → Sends envelope → Receives signed files → Stores signed copy

### 4.4 Disbursement & Sync
Admin schedules tranches → Invoices created & synced to Xero → Payment confirmations flow back → Dashboard updates

### 4.5 M&E + Financial Retirement
Partner reports progress → Uploads receipts → Submits financial report → Reviewers validate/approve → Project closure

## 5. Key Entities (Data Model)

### 5.1 Organization (Partner)
- Profile information
- Compliance flags
- Contact set
- Status tracking

### 5.2 User
- Role assignment
- Organization linkage
- MFA enrollment
- Activity logs

### 5.3 Project/Call
- Name and description
- Dates (open/close)
- Budget categories and caps
- Currency settings
- State management

### 5.4 Budget
- Header information (org, project, state)
- Budget lines (category, unit, quantity, unit cost, cap)
- Review threads and comments

### 5.5 Contract
- Template reference
- Merge fields
- Envelope ID
- Status tracking
- Signed artifacts

### 5.6 Disbursement
- Tranche schedule
- Amount and currency
- External finance references
- Status tracking

### 5.7 M&E Report
- Indicators (JSON format)
- Attachments
- Status tracking

### 5.8 Financial Report
- Totals and variances
- Receipt attachments
- Line item matching

### 5.9 Document
- Entity type and ID linkage
- URI and MIME type
- Version control
- Checksum and metadata
- Uploader information
- Timestamps

### 5.10 Notification
- Type classification
- Audience targeting
- Payload data
- Delivery status

### 5.11 AuditLog
- Actor identification
- Action tracking
- Entity references
- Before/after states
- IP address and user agent
- Timestamps

## 6. System Architecture

### 6.1 High-Level Architecture
[Diagram to be added]

### 6.2 Technology Stack
- Frontend: React.js with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Cloud Storage: AWS S3
- Authentication: OAuth 2.0 / OpenID Connect
- API Documentation: Swagger/OpenAPI
- Testing: Jest, Cypress
- CI/CD: GitHub Actions
- Infrastructure: Docker, Kubernetes

### 6.3 Integration Architecture
- DocuSign eSignature API
- Xero Accounting API
- Email service (SMTP or cloud provider)
- Cloud storage service

## 7. Security, Audit, and Compliance

### 7.1 Role-Based Access Control (RBAC)
- Strict separation of duties
- Least-privilege principle
- Role inheritance and grouping

### 7.2 Audit Logging
- Immutable audit trails
- Queryable log storage
- Comprehensive event tracking

### 7.3 Document Controls
- Versioning and checksums
- Retention policies
- Legal hold capabilities

### 7.4 Data Protection
- Encrypted transport (TLS)
- Data encryption at rest
- MFA for privileged accounts
- Signed webhook verification

## 8. Workflow Engine

### 8.1 State Models

#### Budget State Model
Draft → Submitted → ReviseRequested → Approved

#### Contract State Model
Ready → Sent → PartiallySigned → Completed → Filed

#### Disbursement State Model
Planned → Invoiced → Paid → Reconciled

#### Report State Model (M&E/Financial)
Draft → Submitted → Corrections → Approved

### 8.2 Workflow Triggers
- State transitions
- Time-based events
- User actions
- System events

## 9. Notifications & SLA Rules

### 9.1 Deadline Management
- T-14/T-7/T-2/T-0 reminders for:
  - Budget submissions
  - Report submissions
  - Signature deadlines
  - Payment deadlines

### 9.2 Escalation Policies
- Overdue events escalate from Partner → Accountant → Finance Manager

### 9.3 Communication Channels
- In-app notifications
- Email alerts
- Weekly digest summaries
- Critical same-day alerts

## 10. Reporting & Analytics

### 10.1 Operational Reports
- Pipeline by stage tracking
- Approval throughput metrics
- Correction cycle analysis
- Time-to-sign/pay metrics
- Reconciliation lag tracking

### 10.2 Financial Reports
- Budget vs. actuals comparison
- Burn rate analysis
- Variance by category/organization
- Disbursement vs. milestone achievement

### 10.3 Compliance/Risk Reports
- Late submission rate tracking
- Missing evidence flagging
- Overspend detection
- Exception logging

## 11. Archival & Retention

### 11.1 Project Closure
- Auto-archival to read-only state
- Evidence preservation
- Access restriction

### 11.2 Retention Policies
- Configurable retention periods
- Legal hold capabilities
- Audit trail preservation

## 12. Implementation Roadmap

### 12.1 Phase 1: Core Infrastructure
- User management and authentication
- Basic entity models
- Role-based access control
- Audit logging framework

### 12.2 Phase 2: Partner Management
- Partner onboarding workflows
- Profile management
- Document storage
- Basic notification system

### 12.3 Phase 3: Grant & Budget Management
- Call/project creation
- Budgeting module
- Approval workflows
- Basic reporting

### 12.4 Phase 4: Integration & Advanced Features
- DocuSign integration
- Xero integration
- Advanced reporting
- M&E module

### 12.5 Phase 5: Compliance & Optimization
- Security hardening
- Performance optimization
- Mobile optimization
- Multilingual support

## 13. Non-Functional Requirements

### 13.1 Performance
- Page load times under 2 seconds
- API response times under 500ms
- Support for 1000+ concurrent users

### 13.2 Availability
- 99.9% uptime SLA
- Automated failover capabilities
- Regular backup and recovery procedures

### 13.3 Scalability
- Horizontal scaling capabilities
- Database optimization
- Caching strategies

### 13.4 Usability
- Mobile-first responsive design
- WCAG 2.1 AA compliance
- Multilingual support (EN/FR/ES/PT)
- Low-bandwidth optimization

## 14. Compliance & Standards

### 14.1 Data Protection
- GDPR compliance
- Data encryption standards
- Privacy by design

### 14.2 Financial Standards
- SOX compliance
- Financial audit readiness
- Document retention policies

### 14.3 Accessibility
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
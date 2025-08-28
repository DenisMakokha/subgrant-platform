# User Stories

## 1. Overview

This document captures all user stories for the Sub-Grant Management Platform, organized by persona and phase. These stories align with the requirements specified in the Zizi Afrique – ALiVE Partners Subgrants Management System document.

## 2. Personas

### 2.1 Admin
- Full system access
- User and organization management
- Project setup and configuration
- System maintenance and monitoring

### 2.2 Approvers
- Multi-level approval workflow participants:
  - Accountant: Financial review and initial approval
  - Budget Holder: Budget allocation approval
  - Finance Manager: Final financial approval

### 2.3 Partner Org Rep
- Organization profile management
- Budget submission and revision
- Report submission
- Document management

### 2.4 Donor
- Read-only access to approved reports
- Limited dashboard views
- Export functionality for approved data

## 3. Phase 1: Requirements & Planning User Stories

### 3.1 Admin User Stories
- As an Admin, I can onboard partners into the system
- As an Admin, I can define system-wide settings and configurations
- As an Admin, I can manage user roles and permissions
- As an Admin, I can view system analytics and usage reports

### 3.2 Partner Org Rep User Stories
- As a Partner Org Rep, I can see all upcoming deadlines for my organization
- As a Partner Org Rep, I can access help documentation and support resources
- As a Partner Org Rep, I can view my organization's profile and contact information

### 3.3 Finance Manager (Approver) User Stories
- As a Finance Manager (Approver), I can approve or reject submitted budgets
- As a Finance Manager (Approver), I can view all budgets requiring my approval
- As a Finance Manager (Approver), I can add comments and feedback to budget submissions

### 3.4 Donor User Stories
- As a Donor, I can access read-only reports once they are approved
- As a Donor, I can view high-level program metrics and outcomes
- As a Donor, I can download standard reports in approved formats

## 4. Phase 2: Core System Setup & User Management User Stories

### 4.1 Admin User Stories
- As an Admin, I can register a new partner organization in the system
- As an Admin, I can create and manage user accounts for partner organizations
- As an Admin, I can configure role-based dashboards for different user types
- As an Admin, I can set up notification preferences and schedules

### 4.2 Partner Org Rep User Stories
- As a Partner Org Rep, I can complete my organization's profile and upload required compliance documents
- As a Partner Org Rep, I can invite additional users from my organization
- As a Partner Org Rep, I can update my organization's contact information
- As a Partner Org Rep, I can reset my password and manage security settings

### 4.3 General User Stories
- As any user, I can log in securely with Multi-Factor Authentication (MFA) protection
- As any user, I receive notifications about actions requiring my attention
- As any user, I can access my profile settings and preferences
- As any user, I can view my activity history and audit trail

## 5. Phase 3: Project Setup & Budget Workflow User Stories

### 5.1 Partner Org Rep User Stories
- As a Partner Org Rep, I can submit a budget with custom line items that don't fit templates
- As a Partner Org Rep, I can view the status of my submitted budgets
- As a Partner Org Rep, I can revise and resubmit budgets that require corrections
- As a Partner Org Rep, I can view feedback and comments from approvers

### 5.2 Accountant (Approver) User Stories
- As an Accountant (Approver), I can request corrections to a submitted budget with inline comments
- As an Accountant (Approver), I can view detailed budget submissions for review
- As an Accountant (Approver), I can approve budgets within my authority level
- As an Accountant (Approver), I can escalate budgets requiring higher-level approval

### 5.3 Budget Holder (Approver) User Stories
- As a Budget Holder (Approver), I can approve or reject a budget with justification
- As a Budget Holder (Approver), I can view budgets that require my review
- As a Budget Holder (Approver), I can compare budgets against project guidelines
- As a Budget Holder (Approver), I can delegate review responsibilities when needed

### 5.4 Finance Manager (Approver) User Stories
- As a Finance Manager (Approver), I have the final approval authority for budgets
- As a Finance Manager (Approver), I can view all budgets in the approval pipeline
- As a Finance Manager (Approver), I can override lower-level approval decisions with justification
- As a Finance Manager (Approver), I can generate approval summary reports

## 6. Phase 4: Contracting User Stories

### 6.1 Admin User Stories
- As an Admin, I can auto-generate a contract from an approved budget with merged data
- As an Admin, I can view the status of all contracts in the system
- As an Admin, I can manage contract templates and clauses
- As an Admin, I can archive completed contracts with version control

### 6.2 Partner Org Rep User Stories
- As a Partner Org Rep, I can sign the contract digitally through DocuSign
- As a Partner Org Rep, I can view the status of contracts requiring my signature
- As a Partner Org Rep, I can download copies of signed contracts
- As a Partner Org Rep, I can receive notifications about contract-related actions

### 6.3 General User Stories
- As any user, I can see the contract status in real-time
- As any user, I can access contract history and version information
- As any user, I can receive alerts about upcoming contract renewals or expirations

## 7. Phase 5: Disbursements & Financial Sync User Stories

### 7.1 Accountant User Stories
- As an Accountant, I can record planned disbursements linked to approved budgets
- As an Accountant, I can view disbursement schedules and payment histories
- As an Accountant, I can reconcile payments with bank statements
- As an Accountant, I can generate disbursement summary reports

### 7.2 Partner Org Rep User Stories
- As a Partner Org Rep, I can view the status of funds that have been released to my organization
- As a Partner Org Rep, I can view expected disbursement dates and amounts
- As a Partner Org Rep, I can receive notifications about disbursement actions
- As a Partner Org Rep, I can access payment confirmation documents

### 7.3 Admin User Stories
- As an Admin, I can see real-time synchronization status with Xero
- As an Admin, I can troubleshoot integration issues with financial systems
- As an Admin, I can configure multi-currency settings and exchange rates
- As an Admin, I can view financial audit trails and transaction histories

### 7.4 General User Stories
- As any user, I can view financial information in my preferred currency
- As any user, I can access payment-related documentation and receipts
- As any user, I can receive alerts about financial discrepancies or issues

## 8. Phase 6: Reporting & Reconciliation User Stories

### 8.1 Partner Org Rep User Stories
- As a Partner Org Rep, I can file monthly reports with both KPI data and narrative components
- As a Partner Org Rep, I can upload supporting receipts in PDF, JPG, or PNG formats
- As a Partner Org Rep, I can view the status of submitted reports
- As a Partner Org Rep, I can revise and resubmit reports that require corrections

### 8.2 Admin User Stories
- As an Admin, I can review financial reconciliations against submitted receipts
- As an Admin, I can view all reports submitted by partner organizations
- As an Admin, I can generate compliance reports and analytics
- As an Admin, I can manage report templates and submission requirements

### 8.3 Accountant User Stories
- As an Accountant, I can match expenditures to specific budget lines
- As an Accountant, I can identify and resolve reconciliation discrepancies
- As an Accountant, I can approve or request corrections to financial reports
- As an Accountant, I can generate variance analysis reports

### 8.4 General User Stories
- As any user, I can access reporting guidelines and templates
- As any user, I can receive notifications about reporting deadlines
- As any user, I can view report history and previous submissions
- As any user, I can download reports in various formats

## 9. Phase 7: Monitoring, Evaluation & Donor Reporting User Stories

### 9.1 Donor User Stories
- As a Donor, I can receive standard reports in approved formats
- As a Donor, I can view high-level program performance dashboards
- As a Donor, I can access outcome and impact data within approved parameters
- As a Donor, I can download reports for offline review and sharing

### 9.2 M&E Officer User Stories
- As an M&E Officer, I can track outcomes and impact through KPI dashboards
- As an M&E Officer, I can validate reported data against source documentation
- As an M&E Officer, I can generate custom reports for specific evaluation needs
- As an M&E Officer, I can identify performance trends and areas for improvement

### 9.3 Admin User Stories
- As an Admin, I can export reports in donor-ready formats (PDF, Excel)
- As an Admin, I can configure read-only access permissions for donors
- As an Admin, I can manage donor-specific report templates and requirements
- As an Admin, I can monitor donor access and report usage

### 9.4 General User Stories
- As any user, I can view program performance against established targets
- As any user, I can access visual dashboards for data interpretation
- As any user, I can receive alerts about significant performance changes
- As any user, I can contribute to organizational learning through data sharing

## 10. Phase 8: Audit & Compliance User Stories

### 10.1 Auditor User Stories
- As an Auditor, I can view complete audit trails for any transaction or change
- As an Auditor, I can verify document integrity through checksums
- As an Auditor, I can access version history for all system records
- As an Auditor, I can generate compliance verification reports

### 10.2 Admin User Stories
- As an Admin, I receive compliance alerts when actions are overdue or missing
- As an Admin, I can configure compliance monitoring rules and thresholds
- As an Admin, I can view compliance dashboards and risk assessments
- As an Admin, I can generate audit-ready documentation packages

### 10.3 General User Stories
- As any user, I can see version history for all documents
- As any user, I can access compliance guidelines and requirements
- As any user, I can receive notifications about compliance-related actions
- As any user, I can contribute to audit preparation through proper documentation

## 11. Phase 9: Closure & Archiving User Stories

### 11.1 Admin User Stories
- As an Admin, I can close projects and move them to archived status
- As an Admin, I can configure automatic renewal alerts for ongoing projects
- As an Admin, I can manage the completed projects repository
- As an Admin, I can restore archived projects when needed

### 11.2 Partner Org Rep User Stories
- As a Partner Org Rep, I can view past reports and documents from completed projects
- As a Partner Org Rep, I can access historical project information for reference
- As a Partner Org Rep, I can receive notifications about project renewals
- As a Partner Org Rep, I can request access to archived project data

### 11.3 General User Stories
- As any user, I can search and access archived projects
- As any user, I can view project closure summaries and final reports
- As any user, I can receive alerts about archived project access requests
- As any user, I can contribute to knowledge management through project documentation

## 12. Phase 10: Training, UAT & Deployment User Stories

### 12.1 General User Stories
- As a User, I am trained on system functionality relevant to my role
- As a User, I can access training materials and resources online
- As a User, I can participate in hands-on training sessions
- As a User, I can provide feedback on system usability and functionality

### 12.2 Zizi HQ Representative User Stories
- As a Zizi HQ representative, I can sign off on system readiness after UAT
- As a Zizi HQ representative, I can coordinate UAT with partner organizations
- As a Zizi HQ representative, I can document UAT findings and recommendations
- As a Zizi HQ representative, I can approve production deployment

### 12.3 Partner Org Rep User Stories
- As a Partner Org Rep, I can access the production system after go-live
- As a Partner Org Rep, I can participate in UAT testing and feedback
- As a Partner Org Rep, I can access ongoing support and troubleshooting
- As a Partner Org Rep, I can provide input on system improvements

### 12.4 Support Administrator User Stories
- As a Support Administrator, I can provide assistance during the transition period
- As a Support Administrator, I can monitor system performance and user adoption
- As a Support Administrator, I can troubleshoot technical issues and problems
- As a Support Administrator, I can document support cases and resolutions

## 13. Cross-Cutting User Stories

### 13.1 Security and Access
- As any user, I can securely access the system with appropriate permissions
- As any user, I can protect my account with strong authentication
- As any user, I can report security concerns or incidents
- As any user, I can maintain privacy of sensitive information

### 13.2 Mobile and Accessibility
- As any user, I can access the system on mobile devices
- As any user, I can use the system with assistive technologies
- As any user, I can navigate the system with keyboard shortcuts
- As any user, I can access the system with limited bandwidth

### 13.3 Notifications and Communications
- As any user, I can customize my notification preferences
- As any user, I can receive alerts about important deadlines
- As any user, I can communicate with other system users
- As any user, I can access communication history and records

These user stories provide a comprehensive foundation for developing the Sub-Grant Management Platform, ensuring that all user needs and requirements are addressed throughout the implementation process.
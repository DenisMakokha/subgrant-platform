# Sub-Grant Management Platform Architecture Summary

## 1. Overview

This document provides a comprehensive summary of the architectural design for the Sub-Grant Management Platform, a cloud-based solution that digitizes the entire sub-grant lifecycle from partner onboarding to project archival. The platform enforces auditability, transparency, and compliance throughout all processes while integrating seamlessly with DocuSign for digital signatures and Xero for financial management.

## 2. Key Components

### 2.1 System Architecture
The platform follows a microservices architecture with the following key components:

1. **API Gateway** - Single entry point for all client requests
2. **Authentication Service** - Manages user authentication and authorization
3. **Workflow Engine** - Orchestrates business processes and state transitions
4. **Notification Service** - Handles all system communications
5. **Reporting Engine** - Generates operational and financial reports
6. **Document Management** - Centralized storage and management of all documents
7. **Domain Services** - Specialized services for each core domain:
   - Partner Management
   - Grant Management
   - Budget Management
   - Contract Management
   - Disbursement Management
   - M&E Management
   - Financial Management

### 2.2 Technology Stack
- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Cloud Storage**: AWS S3
- **Authentication**: OAuth 2.0 / OpenID Connect
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Cypress
- **CI/CD**: GitHub Actions
- **Infrastructure**: Docker, Kubernetes

## 3. Core Modules

### 3.1 Partner Onboarding & Profiles
Manages the registration, verification, and profile management of partner organizations with:
- Organization registration and verification
- User account management
- Compliance documentation collection
- Profile maintenance and updates
- Due diligence validation workflows

### 3.2 Grants & Projects
Manages the creation and administration of funding calls and projects:
- Project/call creation and configuration
- Timeline and submission window management
- Budget category and cap definition
- Multi-currency support
- Project status tracking

### 3.3 Budgeting & Approval (3-tier)
Enables partners to create detailed budgets with a structured approval workflow:
- Budget template creation and management
- Line item budgeting with category validation
- Multi-tier approval workflow (Accountant → Budget Holder → Finance Manager)
- Inline review comments and revision requests
- Budget versioning and history

### 3.4 Digital Contracts (DocuSign)
Automates the generation, signing, and storage of legal agreements:
- Automated contract generation from templates
- DocuSign envelope creation and sending
- Real-time status tracking
- Signed document storage and versioning
- Audit trail for contract history

### 3.5 Disbursements & Financial Sync (Xero)
Manages the planning and execution of fund transfers to partners:
- Tranche planning and scheduling
- Invoice/bill creation in Xero
- Payment status tracking
- Reconciliation with bank statements
- Evidence attachment for transactions

### 3.6 Monitoring & Evaluation (M&E)
Tracks project progress, outcomes, and risks:
- KPI definition and tracking
- Progress milestone reporting
- Risk and issue management
- Dashboard visualization
- Automated alerts for risks and delays

### 3.7 Financial Retirement & Reconciliation
Manages the process of reporting actual expenditures:
- Expenditure reporting against budget lines
- Receipt attachment and validation
- Review and approval workflow
- Variance analysis
- Project closure and archival

### 3.8 Reporting & Analytics
Provides comprehensive dashboards and reports:
- Executive dashboards
- Budget vs. actual reporting
- Compliance tracking
- Risk and exception reporting
- Export capabilities (PDF, Excel)

### 3.9 Documents, Versioning & Audit
Provides secure storage and audit capabilities:
- Centralized document storage
- Version control with history
- Checksum validation
- Metadata management
- Immutable audit logs

### 3.10 Notifications & Alerts
Manages all system communications:
- Multi-channel notifications (email, in-app)
- Deadline reminder ladder (T-14/T-7/T-2/T-0)
- Escalation workflows
- Weekly digest emails
- Custom notification templates

## 4. Data Model

The platform uses a comprehensive data model with the following core entities:
- **Organization (Partner)** - Partner organization information
- **User** - System users with role-based access
- **Project/Call** - Funding opportunities and programs
- **Budget** - Financial plans with approval workflows
- **Contract** - Legal agreements with DocuSign integration
- **Disbursement** - Fund transfers with Xero synchronization
- **M&E Report** - Progress and outcome tracking
- **Financial Report** - Expenditure and reconciliation reporting
- **Document** - Centralized document management
- **Notification** - Communication system
- **AuditLog** - Immutable audit trail

## 5. Security and Compliance

### 5.1 Authentication and Authorization
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- OAuth 2.0/OpenID Connect integration
- Session management with JWT tokens

### 5.2 Data Protection
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- Field-level encryption for PII
- Secure key management

### 5.3 Compliance
- GDPR compliance for data privacy
- SOX compliance for financial controls
- ISO 27001 alignment for information security
- Comprehensive audit logging

## 6. Workflow Engine

The platform implements a robust workflow engine that manages state transitions for all core entities:
- **Budget State Model**: Draft → Submitted → ReviseRequested → Approved
- **Contract State Model**: Ready → Sent → PartiallySigned → Completed → Filed
- **Disbursement State Model**: Planned → Invoiced → Paid → Reconciled
- **Report State Model**: Draft → Submitted → Corrections → Approved

## 7. Integrations

### 7.1 DocuSign Integration
- OAuth 2.0 authentication
- Template management and data merging
- Envelope creation and sending
- Webhook-based status updates
- Secure storage of signed artifacts

### 7.2 Xero Integration
- OAuth 2.0 authentication
- Contact synchronization
- Invoice/bill creation
- Payment status reconciliation
- Financial reporting synchronization

## 8. Implementation Roadmap

The implementation follows a structured 18-month roadmap across six phases:
1. **Foundation** (Months 1-3) - Core infrastructure and basic services
2. **Partner Management** (Months 4-6) - Onboarding and profile management
3. **Grant & Budget Management** (Months 7-9) - Core financial workflows
4. **Integration & Advanced Features** (Months 10-12) - Third-party integrations
5. **Compliance & Optimization** (Months 13-15) - Security and performance
6. **Production Deployment** (Months 16-18) - Live deployment and pilot

## 9. Conclusion

The Sub-Grant Management Platform architecture provides a comprehensive, secure, and scalable solution for managing the entire sub-grant lifecycle. By leveraging modern cloud technologies, robust security measures, and seamless third-party integrations, the platform will significantly improve efficiency, transparency, and compliance in sub-grant management processes.

The modular design allows for flexible implementation and future enhancements, while the detailed implementation roadmap ensures a structured approach to delivery. With proper execution, this platform will transform how organizations manage their sub-grant programs.
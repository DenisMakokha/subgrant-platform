# Third-Party Integrations

## 1. DocuSign Integration

### 1.1 Overview
The DocuSign integration enables automated contract generation, electronic signature collection, and secure storage of executed agreements. This integration streamlines the contracting process by eliminating manual document handling and providing real-time status updates.

### 1.2 Integration Architecture

```mermaid
graph TD
    A[Contract Service] --> B[DocuSign API Client]
    B --> C[DocuSign REST API]
    C --> D[DocuSign Platform]
    D --> E[Email System]
    E --> F[Signers]
    D --> B: Webhooks
    B --> A: Status Updates
    
    style A fill:#4CAF50,stroke:#388E3C
    style B fill:#2196F3,stroke:#0D47A1
    style C fill:#FF9800,stroke:#E65100
    style D fill:#9C27B0,stroke:#4A148C
    style E fill:#FF5722,stroke:#BF360C
    style F fill:#795548,stroke:#3E2723
```

### 1.3 Authentication and Authorization

#### 1.3.1 OAuth 2.0 Implementation
- Authorization Code Grant flow
- JWT bearer grant for system-to-system authentication
- Token refresh automation
- Secure token storage with encryption

#### 1.3.2 Security Considerations
- TLS 1.2+ for all API communications
- Signed webhook verification
- Request/response logging for audit purposes
- Rate limiting compliance

### 1.4 Core Functionality

#### 1.4.1 Template Management
- Template synchronization from DocuSign
- Custom field mapping for data merging
- Template version control
- Preview functionality

#### 1.4.2 Envelope Creation
```javascript
// Pseudocode for envelope creation
function createEnvelope(contractData) {
  const envelope = {
    emailSubject: `Subgrant Agreement - ${contractData.projectName}`,
    templateId: contractData.templateId,
    templateRoles: [
      {
        email: contractData.partnerEmail,
        name: contractData.partnerName,
        roleName: "Partner"
      },
      {
        email: contractData.adminEmail,
        name: contractData.adminName,
        roleName: "Administrator"
      }
    ],
    status: "sent"
  };
  
  // Merge custom fields
  envelope.customFields = mapCustomFields(contractData);
  
  return docusignClient.createEnvelope(envelope);
}
```

#### 1.4.3 Data Mapping
| DocuSign Field | System Field | Description |
|----------------|--------------|-------------|
| Organization Name | organization.name | Partner organization name |
| Project Title | project.name | Grant project title |
| Budget Amount | budget.total_amount | Total approved budget |
| Contract Date | contract.created_at | Date of contract creation |
| Admin Name | admin.full_name | Name of PAL administrator |
| Admin Title | admin.role | Title of PAL administrator |

#### 1.4.4 Webhook Configuration
- Status update notifications
- Document completion events
- Error and exception handling
- Retry mechanisms for failed deliveries

### 1.5 Webhook Processing

#### 1.5.1 Event Types
- Envelope sent
- Envelope delivered
- Envelope signed
- Envelope completed
- Envelope declined
- Envelope voided

#### 1.5.2 Webhook Validation
```javascript
// Pseudocode for webhook validation
function validateWebhook(request) {
  const signature = request.headers['x-docusign-signature'];
  const payload = request.body;
  
  // Verify signature using DocuSign certificate
  return crypto.verifySignature(signature, payload, docusignPublicKey);
}
```

#### 1.5.3 Status Update Processing
```javascript
// Pseudocode for status update processing
function processStatusUpdate(webhookData) {
  const envelopeId = webhookData.envelopeId;
  const status = webhookData.status;
  const contract = findContractByEnvelopeId(envelopeId);
  
  if (contract) {
    contract.status = mapStatus(status);
    
    if (status === 'completed') {
      // Download signed documents
      const documents = await docusignClient.getDocuments(envelopeId);
      await storeSignedDocuments(contract, documents);
    }
    
    await contract.save();
    await auditLog.create({
      action: 'contract_status_update',
      entity_type: 'contract',
      entity_id: contract.id,
      after_state: { status: contract.status }
    });
  }
}
```

### 1.6 Document Management

#### 1.6.1 Signed Document Storage
- Secure cloud storage with encryption
- Version control for document revisions
- Checksum validation for integrity
- Access control for document retrieval

#### 1.6.2 Document Retrieval
- API endpoint for document download
- Browser-based document viewing
- Audit trail for document access
- Expiration and retention policies

### 1.7 Error Handling and Monitoring

#### 1.7.1 Common Error Scenarios
- Invalid template IDs
- Failed envelope creation
- Webhook delivery failures
- Document download errors
- Rate limiting exceeded

#### 1.7.2 Retry Mechanisms
- Exponential backoff for API calls
- Dead letter queue for persistent failures
- Manual retry interface for administrators
- Alerting for critical failures

## 2. Xero Integration

### 2.1 Overview
The Xero integration synchronizes partner organization data, creates invoices/bills for disbursements, and reconciles payment statuses. This integration ensures financial data consistency between the sub-grant platform and the accounting system.

### 2.2 Integration Architecture

```mermaid
graph TD
    A[Disbursement Service] --> B[Xero API Client]
    B --> C[Xero API]
    C --> D[Xero Platform]
    D --> E[Bank Systems]
    E --> F[Payment Processors]
    D --> B: Webhooks
    B --> A: Status Updates
    
    style A fill:#4CAF50,stroke:#388E3C
    style B fill:#2196F3,stroke:#0D47A1
    style C fill:#FF9800,stroke:#E65100
    style D fill:#9C27B0,stroke:#4A148C
    style E fill:#FF5722,stroke:#BF360C
    style F fill:#795548,stroke:#3E2723
```

### 2.3 Authentication and Authorization

#### 2.3.1 OAuth 2.0 Implementation
- Authorization Code Grant flow
- Tenant-specific token management
- Automatic token refresh
- Secure credential storage

#### 2.3.2 Multi-Organization Support
- Separate connections per organization
- Tenant ID mapping
- Connection status monitoring
- Reconnection workflows

### 2.4 Core Functionality

#### 2.4.1 Contact Synchronization
```javascript
// Pseudocode for contact synchronization
function syncPartnerContact(organization) {
  const xeroContact = {
    Name: organization.legal_name || organization.name,
    FirstName: organization.primary_contact_first_name,
    LastName: organization.primary_contact_last_name,
    EmailAddress: organization.email,
    Addresses: [
      {
        AddressType: "POBOX",
        AddressLine1: organization.address,
        City: organization.city,
        PostalCode: organization.postal_code,
        Country: organization.country
      }
    ]
  };
  
  // Check if contact already exists
  const existingContact = await xeroClient.contacts.search(
    `Name="${xeroContact.Name}"`
  );
  
  if (existingContact) {
    return await xeroClient.contacts.update(existingContact.ContactID, xeroContact);
  } else {
    return await xeroClient.contacts.create(xeroContact);
  }
}
```

#### 2.4.2 Invoice/Bill Creation
```javascript
// Pseudocode for invoice creation
function createDisbursementInvoice(disbursement) {
  const invoice = {
    Type: "ACCPAY",
    Contact: {
      ContactID: disbursement.organization.xero_contact_id
    },
    Date: disbursement.planned_date,
    DueDate: disbursement.planned_date,
    LineItems: [
      {
        Description: `Subgrant disbursement - ${disbursement.title}`,
        Quantity: 1,
        UnitAmount: disbursement.amount,
        AccountCode: disbursement.project.account_code,
        Tracking: [
          {
            Name: "Project",
            Option: disbursement.project.name
          }
        ]
      }
    ],
    Reference: `DISB-${disbursement.id.substring(0, 8)}`,
    Status: "AUTHORISED"
  };
  
  const result = await xeroClient.invoices.create(invoice);
  
  // Update disbursement with Xero reference
  disbursement.invoice_id = result.InvoiceID;
  await disbursement.save();
  
  return result;
}
```

#### 2.4.3 Payment Reconciliation
```javascript
// Pseudocode for payment reconciliation
function reconcilePayment(invoiceId) {
  const invoice = await xeroClient.invoices.get(invoiceId);
  
  if (invoice.AmountPaid >= invoice.AmountDue) {
    const disbursement = findDisbursementByInvoiceId(invoiceId);
    disbursement.status = 'paid';
    disbursement.paid_at = new Date();
    
    // Attach payment evidence
    const paymentDocuments = await xeroClient.invoices.getAttachments(invoiceId);
    for (const doc of paymentDocuments) {
      await attachPaymentEvidence(disbursement, doc);
    }
    
    await disbursement.save();
  }
}
```

### 2.5 Webhook Configuration

#### 2.5.1 Event Types
- Invoice created/updated
- Payment received
- Contact updated
- Account updated

#### 2.5.2 Webhook Validation
```javascript
// Pseudocode for Xero webhook validation
function validateXeroWebhook(request) {
  const signature = request.headers['xero-signature'];
  const payload = request.body;
  
  // Calculate HMAC hash
  const hash = crypto
    .createHmac('sha256', xeroWebhookKey)
    .update(payload)
    .digest('base64');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}
```

#### 2.5.3 Event Processing
```javascript
// Pseudocode for event processing
function processXeroEvent(webhookData) {
  for (const event of webhookData.events) {
    switch (event.eventType) {
      case 'INVOICE_PAID':
        await reconcilePayment(event.resourceId);
        break;
      case 'CONTACT_UPDATED':
        await syncContact(event.resourceId);
        break;
      default:
        logger.warn(`Unhandled event type: ${event.eventType}`);
    }
  }
}
```

### 2.6 Data Mapping

#### 2.6.1 Organization to Contact Mapping
| Xero Field | System Field | Description |
|------------|--------------|-------------|
| Name | organization.legal_name | Legal entity name |
| EmailAddress | organization.email | Primary contact email |
| Addresses | organization.address | Physical address |
| Phones | organization.phone | Contact phone number |
| TaxNumber | organization.tax_id | Tax identification number |

#### 2.6.2 Disbursement to Invoice Mapping
| Xero Field | System Field | Description |
|------------|--------------|-------------|
| Type | "ACCPAY" | Accounts payable |
| Contact | organization.xero_contact_id | Linked contact |
| Date | disbursement.planned_date | Disbursement date |
| DueDate | disbursement.planned_date | Payment due date |
| LineItems | disbursement.amount | Disbursement amount |
| Reference | disbursement.id | System reference |
| Status | "AUTHORISED" | Authorized status |

### 2.7 Error Handling and Monitoring

#### 2.7.1 Common Error Scenarios
- Invalid contact data
- Duplicate contact creation
- Invoice creation failures
- Payment reconciliation errors
- API rate limiting

#### 2.7.2 Retry Mechanisms
- Exponential backoff for API calls
- Queue-based processing for batch operations
- Manual intervention for persistent errors
- Alerting for critical system issues

## 3. Integration Security

### 3.1 Credential Management
- Encrypted storage for API keys and tokens
- Regular credential rotation
- Access logging for credential usage
- Emergency credential revocation procedures

### 3.2 Data Protection
- Encryption in transit (TLS 1.2+)
- Field-level encryption for sensitive data
- Data minimization principles
- Secure deletion of temporary data

### 3.3 Compliance
- GDPR data handling compliance
- SOX financial data integrity
- Audit trail for all integration activities
- Regular security assessments

## 4. Monitoring and Maintenance

### 4.1 Health Monitoring
- API connectivity checks
- Response time monitoring
- Error rate tracking
- Integration status dashboards

### 4.2 Alerting
- Critical failure notifications
- Performance degradation alerts
- Rate limit warnings
- Data synchronization issues

### 4.3 Maintenance Procedures
- Regular API dependency updates
- Integration testing schedules
- Backup and recovery procedures
- Documentation updates for API changes

## 5. Implementation Roadmap

### 5.1 Phase 1: Foundation
- OAuth authentication setup
- Basic API client implementation
- Error handling framework
- Logging and monitoring

### 5.2 Phase 2: Core Functionality
- DocuSign template management
- Xero contact synchronization
- Webhook receivers
- Data mapping implementation

### 5.3 Phase 3: Advanced Features
- Document storage and retrieval
- Payment reconciliation
- Status synchronization
- Advanced error handling

### 5.4 Phase 4: Optimization
- Performance optimization
- Security hardening
- User experience improvements
- Comprehensive testing
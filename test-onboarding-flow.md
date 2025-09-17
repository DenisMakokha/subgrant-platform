# Partner Onboarding System - End-to-End Test Guide

## Prerequisites
1. Database schema applied (`partner-onboarding-schema.sql`)
2. Backend server running on port 3000/8000
3. Frontend server running on port 3001/3002
4. Email service configured (Ethereal for testing)

## Test Flow

### 1. Partner Registration
**URL:** `/partner/register`

**Test Steps:**
1. Navigate to partner registration page
2. Fill in form:
   - First Name: "John"
   - Last Name: "Doe" 
   - Email: "john.doe@testorg.com"
   - Password: "password123"
   - Confirm Password: "password123"
3. Submit form
4. Verify redirect to email verification page
5. Check database for new user record with `email_verified = false`

**Expected Results:**
- User created in database
- Verification email sent
- Redirect to `/auth/verify-email`

### 2. Email Verification
**URL:** `/auth/verify-email`

**Test Steps:**
1. Check email service logs for verification email
2. Extract verification token from email
3. Visit verification URL: `/auth/verify-email?token=<TOKEN>`
4. Verify automatic redirect to Section C

**Expected Results:**
- User `email_verified` set to `true`
- JWT token stored in localStorage
- Redirect to `/onboarding/section-c`

### 3. Section C - Document Attachments
**URL:** `/onboarding/section-c`

**Test Steps:**
1. Verify page loads with document requirements
2. Test file upload for each category:
   - Legal Documents
   - Governance Documents  
   - Financial Documents
   - Operational Documents
   - Compliance Documents
3. Add notes and N/A explanations
4. Save draft (verify API call)
5. Submit section (verify status change)

**Expected Results:**
- Organization created with status `attachments_pending`
- Document responses saved to database
- Status updated to `financials_pending`
- Redirect to Section B

### 4. Section B - Financial Assessment
**URL:** `/onboarding/section-b`

**Test Steps:**
1. Verify route protection (only accessible with `financials_pending` status)
2. Fill in financial assessment:
   - Annual Revenue: $500,000 (2023)
   - Annual Expenses: $450,000 (2023)
   - Current Assets: $100,000 (2023)
   - Current Liabilities: $50,000 (2023)
   - Grant Funding Received: $200,000 (2023)
3. Save draft
4. Submit section

**Expected Results:**
- Financial assessment saved to database
- Status updated to `under_review`
- Redirect to review status page

### 5. Review Status Page
**URL:** `/onboarding/review-status`

**Test Steps:**
1. Verify page shows "Under Review" status
2. Check timeline display
3. Verify navigation buttons are disabled during review

**Expected Results:**
- Status displayed correctly
- Timeline shows progress
- No edit access during review

### 6. Admin Review Process
**URL:** `/api/onboarding/admin/*` (Backend testing)

**Test Steps:**
1. Use admin API to fetch organization dossier
2. Create review flags for testing:
   ```json
   {
     "section": "C",
     "field": "legal_documents",
     "message": "Please provide updated articles of incorporation",
     "severity": "high"
   }
   ```
3. Make review decision: "changes_requested"

**Expected Results:**
- Review flags created in database
- Status updated to `changes_requested`
- Email notification sent to partner

### 7. Changes Requested Flow
**URL:** `/onboarding/review-status`

**Test Steps:**
1. Verify page shows flagged items
2. Click "Update Section C" button
3. Make required changes
4. Resubmit section
5. Verify status returns to `under_review`

**Expected Results:**
- Flagged items displayed clearly
- Navigation to correct section works
- Resubmission updates status

### 8. Approval and Final Section
**Admin Action:** Approve organization

**Test Steps:**
1. Admin approves organization via API
2. Verify status updated to `approved`
3. Partner receives approval email
4. Partner can access Section A

### 9. Section A - Final Organization Profile
**URL:** `/onboarding/section-a`

**Test Steps:**
1. Verify route protection (only accessible with `approved` status)
2. Fill in organization profile:
   - Organization Name: "Test Organization"
   - Description: "A test organization for onboarding"
   - Website: "https://testorg.com"
   - Address fields
   - Contact information
3. Submit final section

**Expected Results:**
- Organization profile saved
- Status updated to `finalized`
- Completion email sent
- Redirect to partner dashboard

### 10. Partner Dashboard
**URL:** `/partner/dashboard`

**Test Steps:**
1. Verify route protection (only accessible with `finalized` status)
2. Check organization information display
3. Verify quick actions are available
4. Test logout functionality

**Expected Results:**
- Dashboard loads successfully
- Organization data displayed correctly
- User can access partner features

## Database Verification Queries

```sql
-- Check user creation
SELECT * FROM users WHERE email = 'john.doe@testorg.com';

-- Check organization status progression
SELECT id, name, status, created_at, updated_at FROM organizations 
WHERE id = (SELECT organization_id FROM org_roles WHERE user_id = <USER_ID>);

-- Check document responses
SELECT * FROM org_documents WHERE organization_id = <ORG_ID>;

-- Check financial assessment
SELECT * FROM financial_assessments WHERE organization_id = <ORG_ID>;

-- Check audit logs
SELECT * FROM audit_logs WHERE organization_id = <ORG_ID> ORDER BY created_at;

-- Check review process
SELECT * FROM reviews WHERE organization_id = <ORG_ID>;
SELECT * FROM review_flags WHERE review_id = <REVIEW_ID>;
```

## API Endpoint Testing

### Authentication Endpoints
- `POST /api/onboarding/auth/register`
- `POST /api/onboarding/auth/login`
- `POST /api/onboarding/auth/verify`
- `POST /api/onboarding/auth/resend-verification`

### Onboarding Endpoints
- `GET /api/onboarding/section-c`
- `POST /api/onboarding/section-c/presign`
- `POST /api/onboarding/section-c/save`
- `POST /api/onboarding/section-c/submit`
- `GET /api/onboarding/section-b`
- `POST /api/onboarding/section-b/save`
- `POST /api/onboarding/section-b/submit`
- `GET /api/onboarding/section-a`
- `POST /api/onboarding/section-a/save`
- `POST /api/onboarding/section-a/submit`

### Admin Endpoints
- `GET /api/onboarding/admin/dossier/:organizationId`
- `POST /api/onboarding/admin/flags`
- `POST /api/onboarding/admin/decision`

## Error Scenarios to Test

1. **Invalid email verification token**
2. **Accessing wrong onboarding step** (route protection)
3. **Submitting incomplete forms**
4. **Network errors during API calls**
5. **Session expiration during onboarding**
6. **Duplicate email registration**
7. **Invalid file uploads** (wrong type, too large)

## Performance Considerations

1. **File upload handling** (presigned URLs)
2. **Database query optimization**
3. **Email delivery reliability**
4. **JWT token expiration**
5. **Audit log volume**

## Security Testing

1. **SQL injection prevention** (parameterized queries)
2. **XSS protection** (input sanitization)
3. **CSRF protection** (JWT tokens)
4. **File upload security** (type validation, size limits)
5. **Rate limiting** (registration, email resend)

## Success Criteria

✅ Complete onboarding flow from registration to finalization
✅ Proper status transitions and route protection
✅ Email notifications at each step
✅ Admin review process with flags and decisions
✅ Audit logging of all actions
✅ Error handling and user feedback
✅ Security measures in place
✅ Database integrity maintained

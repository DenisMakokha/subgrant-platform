const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { logStartup, logShutdown } = require('./services/observabilityService');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3000'],
  credentials: true
})); // Enable CORS first
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers with CORS allowance
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Routes
const authRoutes = require('./routes/auth');
const organizationRoutes = require('./routes/organizations');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const budgetCategoryRoutes = require('./routes/budgetCategories');
const budgetRoutes = require('./routes/budgets');
const budgetLineRoutes = require('./routes/budgetLines');
const partnerBudgetRoutes = require('./routes/partnerBudgets');
const reviewCommentRoutes = require('./routes/reviewComments');
const budgetApprovalRoutes = require('./routes/budgetApprovals');
const contractRoutes = require('./routes/contracts');
const docusignWebhookRoutes = require('./routes/docusignWebhooks');
const disbursementRoutes = require('./routes/disbursements');
const xeroWebhookRoutes = require('./routes/xeroWebhooks');
const auditLogRoutes = require('./routes/auditLogs');
const documentRoutes = require('./routes/documents');
const complianceRoutes = require('./routes/compliance');
const complianceDocumentTemplateRoutes = require('./routes/complianceDocumentTemplates');
const renewalAlertRoutes = require('./routes/renewalAlerts');
const meReportRoutes = require('./routes/meReports');
const financialReportRoutes = require('./routes/financialReports');
const receiptRoutes = require('./routes/receipts');
const kpiRoutes = require('./routes/kpi');
const healthRoutes = require('./routes/health');
const profileRoutes = require('./routes/profile');
const forumRoutes = require('./routes/forum');
const forumAdminRoutes = require('./routes/forumAdmin');
const integrationRoutes = require('./routes/integrations');
const onboardingAuthRoutes = require('./routes/onboardingAuth');
const onboardingSectionCRoutes = require('./routes/onboardingSectionC');
const onboardingSectionBRoutes = require('./routes/onboardingSectionB');
const onboardingSectionARoutes = require('./routes/onboardingSectionA');
const onboardingAdminRoutes = require('./routes/onboardingAdmin');
const sessionRoutes = require('./routes/session');
const debugRoutes = require('./routes/debug-org-status');
const ssotRoutes = require('./routes/ssot');
const adminRoutes = require('./routes/admin');
const partnerDashboardRoutes = require('./routes/partnerDashboard');
const runtimeRoutes = require('./routes/runtime');
const approvalRoutes = require('./routes/approvals');
const fundRequestsRoutes = require('./routes/fundRequests');
const emailRoutes = require('./routes/email');
const budgetSSOTRoutes = require('./routes/budgetSSOT');
const contractSSOTRoutes = require('./routes/contractSSOT');

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Sub-Grant Management Platform API',
    version: '1.0.0'
  });
});

// Health check endpoint (removed - using healthRoutes instead)

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/budget-categories', budgetCategoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/budget-lines', budgetLineRoutes);
app.use('/api/partner-budgets', partnerBudgetRoutes);
app.use('/api/review-comments', reviewCommentRoutes);
app.use('/api/budget-approvals', budgetApprovalRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/docusign', docusignWebhookRoutes);
app.use('/api/disbursements', disbursementRoutes);
app.use('/api/xero', xeroWebhookRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/compliance-document-templates', complianceDocumentTemplateRoutes);
app.use('/api/renewal-alerts', renewalAlertRoutes);
app.use('/api/me-reports', meReportRoutes);
app.use('/api/financial-reports', financialReportRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/health', healthRoutes);
app.use('/api', profileRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/forum-admin', forumAdminRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api', sessionRoutes);
app.use('/api/partner/dashboard', partnerDashboardRoutes);
app.use('/api/onboarding/auth', onboardingAuthRoutes);
app.use('/api/onboarding', onboardingSectionCRoutes);
app.use('/api/onboarding', onboardingSectionBRoutes);
app.use('/api/onboarding', onboardingSectionARoutes);
app.use('/api/onboarding/admin', onboardingAdminRoutes);
app.use('/api', debugRoutes);
app.use('/ssot', ssotRoutes);
app.use('/admin', adminRoutes);
app.use('/app', runtimeRoutes);
app.use('/approvals', approvalRoutes);
app.use('/api/fund-requests', fundRequestsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/budget-ssot', budgetSSOTRoutes);
app.use('/api/contract-ssot', contractSSOTRoutes);

// Partner module routes
const partnerApplications = require('./routes/partnerApplications');
const partnerCompliance = require('./routes/partnerCompliance');
const partnerME = require('./routes/partnerME');
const partnerFinance = require('./routes/partnerFinance');
const partnerMessages = require('./routes/partnerMessages');

// Mount partner module routes
const partnerRoutes = require('./routes/partner/index');
app.use('/api/partner', partnerRoutes);

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Test endpoint working' });
});

// Working section-a endpoint that bypasses middleware
app.post('/api/onboarding/section-a', async (req, res) => {
  console.log('=== DIRECT SECTION A ENDPOINT ===');
  console.log('Headers:', req.headers.authorization);
  console.log('Body:', req.body);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }
    
    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    const db = require('./config/database');
    const userId = decoded.id || decoded.sub;
    console.log('Using userId for query:', userId);
    
    const userResult = await db.pool.query(
      'SELECT id, email, organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    console.log('User from DB:', userResult.rows[0]);
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(400).json({ 
        error: 'No organization found for user',
        userId: userId,
        userExists: userResult.rows.length > 0
      });
    }
    
    const orgId = userResult.rows[0].organization_id;

    // Ensure required columns exist (CRITICAL POLICY)
    try {
      await db.pool.query(`
        ALTER TABLE organizations 
        ADD COLUMN IF NOT EXISTS year_established INTEGER,
        ADD COLUMN IF NOT EXISTS bank_name TEXT,
        ADD COLUMN IF NOT EXISTS bank_branch TEXT,
        ADD COLUMN IF NOT EXISTS account_name TEXT,
        ADD COLUMN IF NOT EXISTS account_number TEXT,
        ADD COLUMN IF NOT EXISTS swift_code TEXT,
        ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0
      `);
    } catch (e) {
      console.warn('Section A direct: column ensure warning:', e.message || e);
    }
    
    // Support SSoT envelope { data, meta }
    const payload = (req.body && req.body.data) ? req.body.data : req.body;
    
    // Normalize numeric fields
    const yearEstablished = payload.year_established !== undefined && payload.year_established !== null
      ? Number(payload.year_established)
      : null;
    
    // Update organization with Section A data including bank details
    const updateQuery = `
      UPDATE organizations 
      SET name = $1, legal_name = $2, registration_number = $3, tax_id = $4, 
          legal_structure = $5, year_established = $6, email = $7, phone = $8, website = $9, 
          primary_contact_name = $10, primary_contact_title = $11, 
          primary_contact_email = $12, primary_contact_phone = $13, address = $14, 
          city = $15, state_province = $16, postal_code = $17, country = $18,
          bank_name = $19, bank_branch = $20, account_name = $21, account_number = $22, swift_code = $23,
          status = 'b_pending', updated_at = NOW(), version = COALESCE(version, 0) + 1
      WHERE id = $24
      RETURNING *
    `;
    
    const values = [
      payload.name, payload.legal_name, payload.registration_number, payload.tax_id,
      payload.legal_structure, yearEstablished, payload.email, payload.phone, payload.website, 
      payload.primary_contact_name, payload.primary_contact_title,
      payload.primary_contact_email, payload.primary_contact_phone, payload.address,
      payload.city, payload.state_province, payload.postal_code, payload.country,
      payload.bank_name ?? null, payload.bank_branch ?? null, payload.account_name ?? null, payload.account_number ?? null, payload.swift_code ?? null,
      orgId
    ];
    
    const result = await db.pool.query(updateQuery, values);
    console.log('Organization updated:', result.rows[0]);
    
    res.json({ 
      success: true, 
      message: 'Section A completed successfully',
      organization: result.rows[0]
    });
    
  } catch (error) {
    console.error('Section A error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Direct section-b endpoint that bypasses middleware (same pattern as section-a)
app.post('/api/onboarding/section-b-financial', async (req, res) => {
  console.log('=== DIRECT SECTION B ENDPOINT ===');
  console.log('Headers:', req.headers.authorization);
  console.log('Body:', req.body);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }
    
    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    const db = require('./config/database');
    const userId = decoded.id || decoded.sub;
    console.log('Using userId for query:', userId);
    
    const userResult = await db.pool.query(
      'SELECT id, email, organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    console.log('User from DB:', userResult.rows[0]);
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(400).json({ 
        error: 'No organization found for user',
        userId: userId,
        userExists: userResult.rows.length > 0
      });
    }
    
    const orgId = userResult.rows[0].organization_id;
    
    const {
      currentAnnualBudget,
      nextYearAnnualBudgetEstimate,
      largestGrantEverManaged,
      currentDonorFunding,
      otherFunds
    } = req.body;

    console.log('Section B Financial - Received data:', req.body);

    // Upsert financial assessment data
    await db.pool.query(`
      INSERT INTO financial_assessments (
        organization_id,
        current_annual_budget_amount_usd, current_annual_budget_year,
        next_year_annual_budget_estimate_amount_usd, next_year_annual_budget_estimate_year,
        largest_grant_ever_managed_amount_usd, largest_grant_ever_managed_year,
        current_donor_funding_amount_usd, current_donor_funding_year,
        other_funds_amount_usd, other_funds_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (organization_id)
      DO UPDATE SET
        current_annual_budget_amount_usd = EXCLUDED.current_annual_budget_amount_usd,
        current_annual_budget_year = EXCLUDED.current_annual_budget_year,
        next_year_annual_budget_estimate_amount_usd = EXCLUDED.next_year_annual_budget_estimate_amount_usd,
        next_year_annual_budget_estimate_year = EXCLUDED.next_year_annual_budget_estimate_year,
        largest_grant_ever_managed_amount_usd = EXCLUDED.largest_grant_ever_managed_amount_usd,
        largest_grant_ever_managed_year = EXCLUDED.largest_grant_ever_managed_year,
        current_donor_funding_amount_usd = EXCLUDED.current_donor_funding_amount_usd,
        current_donor_funding_year = EXCLUDED.current_donor_funding_year,
        other_funds_amount_usd = EXCLUDED.other_funds_amount_usd,
        other_funds_year = EXCLUDED.other_funds_year,
        updated_at = CURRENT_TIMESTAMP
    `, [
      orgId,
      currentAnnualBudget?.amountUsd || 0,
      currentAnnualBudget?.year || new Date().getFullYear(),
      nextYearAnnualBudgetEstimate?.amountUsd || 0,
      nextYearAnnualBudgetEstimate?.year || new Date().getFullYear() + 1,
      largestGrantEverManaged?.amountUsd || 0,
      largestGrantEverManaged?.year || new Date().getFullYear(),
      currentDonorFunding?.amountUsd || 0,
      currentDonorFunding?.year || new Date().getFullYear(),
      otherFunds?.amountUsd || 0,
      otherFunds?.year || new Date().getFullYear()
    ]);

    // Update organization status to C_PENDING
    await db.pool.query(`
      UPDATE organizations SET 
        status = 'c_pending',
        updated_at = NOW()
      WHERE id = $1
    `, [orgId]);

    console.log('Section B Financial - Successfully saved for org:', orgId);

    res.json({ 
      success: true, 
      message: 'Section B completed successfully',
      nextStep: 'section-c',
      status: 'c_pending'
    });
    
  } catch (error) {
    console.error('Section B error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Temporary direct onboarding endpoint for debugging (bypass partner middleware)
app.post('/api/debug/section-a', async (req, res) => {
  console.log('=== DEBUG SECTION A ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('User from token:', req.user);
  
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization header' });
    }
    
    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    
    const db = require('./config/database');
    const userId = decoded.id || decoded.sub;
    console.log('Using userId for query:', userId);
    
    const userResult = await db.pool.query(
      'SELECT id, email, organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    console.log('User query result rows:', userResult.rows);
    console.log('User from DB:', userResult.rows[0]);
    
    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'User not found in database',
        userId: decoded.id || decoded.sub
      });
    }
    
    if (userResult.rows[0]?.organization_id) {
      res.json({ 
        success: true, 
        message: 'Organization found',
        organizationId: userResult.rows[0].organization_id,
        userId: decoded.id
      });
    } else {
      res.status(400).json({ 
        error: 'No organization found for user',
        userId: decoded.id,
        userExists: userResult.rows.length > 0
      });
    }
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/partner/applications', partnerApplications);
app.use('/api/partner/compliance', partnerCompliance);
app.use('/api/partner/me', partnerME);
app.use('/api/partner/finance', partnerFinance);
app.use('/api/partner/messages', partnerMessages);

// Mount reviewer routes
const gmReview = require('./routes/gmReview');
const cooReview = require('./routes/cooReview');
const reviewerSummariesRoutes = require('./routes/reviewerSummaries');
app.use('/api/review/gm', gmReview);
app.use('/api/review/coo', cooReview);
app.use('/api/review/summaries', reviewerSummariesRoutes);

// Error handling middleware
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// API error handler - ensure JSON responses on all /api routes
app.use('/api', (err, req, res, next) => {
  console.error('API Error:', err);
  res
    .status(err.status || 500)
    .type('application/json')
    .json({ error: err.message || 'Internal error' });
});

// Log startup
logStartup();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  logShutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  logShutdown();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
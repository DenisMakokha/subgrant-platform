const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const budgetCategoryRoutes = require('./routes/budgetCategories');
const budgetRoutes = require('./routes/budgets');
const budgetLineRoutes = require('./routes/budgetLines');
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

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Sub-Grant Management Platform API',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/budget-categories', budgetCategoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/budget-lines', budgetLineRoutes);
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
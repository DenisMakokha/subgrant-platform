/**
 * Comprehensive Capabilities Catalog for Role & Dashboard Wizard
 * This defines all available capabilities in the subgrant platform
 */

const capabilitiesCatalog = [
  // ==================== ONBOARDING ====================
  {
    cap: 'onboarding.view',
    area: 'Onboarding',
    label: 'View Onboarding',
    dependsOn: []
  },
  {
    cap: 'onboarding.complete',
    area: 'Onboarding',
    label: 'Complete Onboarding',
    dependsOn: ['onboarding.view']
  },
  {
    cap: 'onboarding.review',
    area: 'Onboarding',
    label: 'Review Partner Onboarding',
    dependsOn: ['onboarding.view']
  },
  {
    cap: 'onboarding.approve',
    area: 'Onboarding',
    label: 'Approve Partner Onboarding',
    dependsOn: ['onboarding.review']
  },

  // ==================== ORGANIZATIONS ====================
  {
    cap: 'organizations.view',
    area: 'Organizations',
    label: 'View Organizations',
    dependsOn: []
  },
  {
    cap: 'organizations.create',
    area: 'Organizations',
    label: 'Create Organizations',
    dependsOn: ['organizations.view']
  },
  {
    cap: 'organizations.update',
    area: 'Organizations',
    label: 'Update Organizations',
    dependsOn: ['organizations.view']
  },
  {
    cap: 'organizations.delete',
    area: 'Organizations',
    label: 'Delete Organizations',
    dependsOn: ['organizations.view']
  },
  {
    cap: 'organizations.manage_status',
    area: 'Organizations',
    label: 'Manage Organization Status',
    dependsOn: ['organizations.update']
  },

  // ==================== PROJECTS ====================
  {
    cap: 'projects.view',
    area: 'Projects',
    label: 'View Projects',
    dependsOn: []
  },
  {
    cap: 'projects.create',
    area: 'Projects',
    label: 'Create Projects',
    dependsOn: ['projects.view']
  },
  {
    cap: 'projects.update',
    area: 'Projects',
    label: 'Update Projects',
    dependsOn: ['projects.view']
  },
  {
    cap: 'projects.delete',
    area: 'Projects',
    label: 'Delete Projects',
    dependsOn: ['projects.view']
  },
  {
    cap: 'projects.close',
    area: 'Projects',
    label: 'Close Projects',
    dependsOn: ['projects.update']
  },

  // ==================== BUDGETS ====================
  {
    cap: 'budgets.view',
    area: 'Budgets',
    label: 'View Budgets',
    dependsOn: []
  },
  {
    cap: 'budgets.create',
    area: 'Budgets',
    label: 'Create Budgets',
    dependsOn: ['budgets.view']
  },
  {
    cap: 'budgets.update',
    area: 'Budgets',
    label: 'Update Budgets',
    dependsOn: ['budgets.view']
  },
  {
    cap: 'budgets.delete',
    area: 'Budgets',
    label: 'Delete Budgets',
    dependsOn: ['budgets.view']
  },
  {
    cap: 'budgets.submit',
    area: 'Budgets',
    label: 'Submit Budgets for Approval',
    dependsOn: ['budgets.update']
  },
  {
    cap: 'budgets.approve_level1',
    area: 'Budgets',
    label: 'Approve Budgets (Level 1)',
    dependsOn: ['budgets.view']
  },
  {
    cap: 'budgets.approve_level2',
    area: 'Budgets',
    label: 'Approve Budgets (Level 2)',
    dependsOn: ['budgets.approve_level1']
  },
  {
    cap: 'budgets.approve_final',
    area: 'Budgets',
    label: 'Final Budget Approval',
    dependsOn: ['budgets.approve_level2']
  },

  // ==================== FUND REQUESTS ====================
  {
    cap: 'fund_requests.view',
    area: 'Fund Requests',
    label: 'View Fund Requests',
    dependsOn: []
  },
  {
    cap: 'fund_requests.create',
    area: 'Fund Requests',
    label: 'Create Fund Requests',
    dependsOn: ['fund_requests.view', 'budgets.view']
  },
  {
    cap: 'fund_requests.update',
    area: 'Fund Requests',
    label: 'Update Fund Requests',
    dependsOn: ['fund_requests.view']
  },
  {
    cap: 'fund_requests.submit',
    area: 'Fund Requests',
    label: 'Submit Fund Requests',
    dependsOn: ['fund_requests.update']
  },
  {
    cap: 'fund_requests.approve',
    area: 'Fund Requests',
    label: 'Approve Fund Requests',
    dependsOn: ['fund_requests.view']
  },
  {
    cap: 'fund_requests.reject',
    area: 'Fund Requests',
    label: 'Reject Fund Requests',
    dependsOn: ['fund_requests.view']
  },

  // ==================== CONTRACTS ====================
  {
    cap: 'contracts.view',
    area: 'Contracts',
    label: 'View Contracts',
    dependsOn: []
  },
  {
    cap: 'contracts.create',
    area: 'Contracts',
    label: 'Create Contracts',
    dependsOn: ['contracts.view', 'projects.view']
  },
  {
    cap: 'contracts.update',
    area: 'Contracts',
    label: 'Update Contracts',
    dependsOn: ['contracts.view']
  },
  {
    cap: 'contracts.sign',
    area: 'Contracts',
    label: 'Sign Contracts',
    dependsOn: ['contracts.view']
  },
  {
    cap: 'contracts.approve',
    area: 'Contracts',
    label: 'Approve Contracts',
    dependsOn: ['contracts.view']
  },
  {
    cap: 'contracts.docusign',
    area: 'Contracts',
    label: 'Manage DocuSign Integration',
    dependsOn: ['contracts.update']
  },

  // ==================== DISBURSEMENTS ====================
  {
    cap: 'disbursements.view',
    area: 'Disbursements',
    label: 'View Disbursements',
    dependsOn: []
  },
  {
    cap: 'disbursements.create',
    area: 'Disbursements',
    label: 'Create Disbursements',
    dependsOn: ['disbursements.view', 'contracts.view']
  },
  {
    cap: 'disbursements.approve',
    area: 'Disbursements',
    label: 'Approve Disbursements',
    dependsOn: ['disbursements.view']
  },
  {
    cap: 'disbursements.process',
    area: 'Disbursements',
    label: 'Process Disbursements',
    dependsOn: ['disbursements.approve']
  },
  {
    cap: 'disbursements.xero',
    area: 'Disbursements',
    label: 'Manage Xero Integration',
    dependsOn: ['disbursements.process']
  },

  // ==================== DOCUMENTS ====================
  {
    cap: 'documents.view',
    area: 'Documents',
    label: 'View Documents',
    dependsOn: []
  },
  {
    cap: 'documents.upload',
    area: 'Documents',
    label: 'Upload Documents',
    dependsOn: ['documents.view']
  },
  {
    cap: 'documents.download',
    area: 'Documents',
    label: 'Download Documents',
    dependsOn: ['documents.view']
  },
  {
    cap: 'documents.delete',
    area: 'Documents',
    label: 'Delete Documents',
    dependsOn: ['documents.view']
  },
  {
    cap: 'documents.approve',
    area: 'Documents',
    label: 'Approve Documents',
    dependsOn: ['documents.view']
  },

  // ==================== COMPLIANCE ====================
  {
    cap: 'compliance.view',
    area: 'Compliance',
    label: 'View Compliance',
    dependsOn: []
  },
  {
    cap: 'compliance.submit',
    area: 'Compliance',
    label: 'Submit Compliance Documents',
    dependsOn: ['compliance.view', 'documents.upload']
  },
  {
    cap: 'compliance.review',
    area: 'Compliance',
    label: 'Review Compliance',
    dependsOn: ['compliance.view']
  },
  {
    cap: 'compliance.approve',
    area: 'Compliance',
    label: 'Approve Compliance',
    dependsOn: ['compliance.review']
  },
  {
    cap: 'compliance.manage_templates',
    area: 'Compliance',
    label: 'Manage Compliance Templates',
    dependsOn: ['compliance.view']
  },

  // ==================== REPORTS (M&E) ====================
  {
    cap: 'reports.view',
    area: 'Reports',
    label: 'View Reports',
    dependsOn: []
  },
  {
    cap: 'reports.create',
    area: 'Reports',
    label: 'Create Reports',
    dependsOn: ['reports.view']
  },
  {
    cap: 'reports.submit',
    area: 'Reports',
    label: 'Submit Reports',
    dependsOn: ['reports.create']
  },
  {
    cap: 'reports.review',
    area: 'Reports',
    label: 'Review Reports',
    dependsOn: ['reports.view']
  },
  {
    cap: 'reports.approve',
    area: 'Reports',
    label: 'Approve Reports',
    dependsOn: ['reports.review']
  },
  {
    cap: 'reports.export',
    area: 'Reports',
    label: 'Export Reports',
    dependsOn: ['reports.view']
  },

  // ==================== RECONCILIATION ====================
  {
    cap: 'reconciliation.view',
    area: 'Reconciliation',
    label: 'View Reconciliation',
    dependsOn: []
  },
  {
    cap: 'reconciliation.create',
    area: 'Reconciliation',
    label: 'Create Reconciliation',
    dependsOn: ['reconciliation.view', 'receipts.view']
  },
  {
    cap: 'reconciliation.submit',
    area: 'Reconciliation',
    label: 'Submit Reconciliation',
    dependsOn: ['reconciliation.create']
  },
  {
    cap: 'reconciliation.review',
    area: 'Reconciliation',
    label: 'Review Reconciliation',
    dependsOn: ['reconciliation.view']
  },
  {
    cap: 'reconciliation.approve',
    area: 'Reconciliation',
    label: 'Approve Reconciliation',
    dependsOn: ['reconciliation.review']
  },

  // ==================== RECEIPTS ====================
  {
    cap: 'receipts.view',
    area: 'Receipts',
    label: 'View Receipts',
    dependsOn: []
  },
  {
    cap: 'receipts.upload',
    area: 'Receipts',
    label: 'Upload Receipts',
    dependsOn: ['receipts.view']
  },
  {
    cap: 'receipts.verify',
    area: 'Receipts',
    label: 'Verify Receipts',
    dependsOn: ['receipts.view']
  },

  // ==================== USERS ====================
  {
    cap: 'users.view',
    area: 'Users',
    label: 'View Users',
    dependsOn: []
  },
  {
    cap: 'users.create',
    area: 'Users',
    label: 'Create Users',
    dependsOn: ['users.view']
  },
  {
    cap: 'users.update',
    area: 'Users',
    label: 'Update Users',
    dependsOn: ['users.view']
  },
  {
    cap: 'users.delete',
    area: 'Users',
    label: 'Delete Users',
    dependsOn: ['users.view']
  },
  {
    cap: 'users.manage_roles',
    area: 'Users',
    label: 'Manage User Roles',
    dependsOn: ['users.update']
  },
  {
    cap: 'users.reset_password',
    area: 'Users',
    label: 'Reset User Passwords',
    dependsOn: ['users.view']
  },

  // ==================== APPROVALS ====================
  {
    cap: 'approvals.view',
    area: 'Approvals',
    label: 'View Approvals',
    dependsOn: []
  },
  {
    cap: 'approvals.coo_review',
    area: 'Approvals',
    label: 'COO Review & Approval',
    dependsOn: ['approvals.view']
  },
  {
    cap: 'approvals.gm_review',
    area: 'Approvals',
    label: 'GM Review & Approval',
    dependsOn: ['approvals.view']
  },
  {
    cap: 'approvals.manage_workflow',
    area: 'Approvals',
    label: 'Manage Approval Workflows',
    dependsOn: ['approvals.view']
  },

  // ==================== ANALYTICS ====================
  {
    cap: 'analytics.view',
    area: 'Analytics',
    label: 'View Analytics',
    dependsOn: []
  },
  {
    cap: 'analytics.grants',
    area: 'Analytics',
    label: 'View Grants Analytics',
    dependsOn: ['analytics.view']
  },
  {
    cap: 'analytics.kpi',
    area: 'Analytics',
    label: 'View KPI Dashboard',
    dependsOn: ['analytics.view']
  },
  {
    cap: 'analytics.executive',
    area: 'Analytics',
    label: 'View Executive Dashboard',
    dependsOn: ['analytics.view']
  },
  {
    cap: 'analytics.export',
    area: 'Analytics',
    label: 'Export Analytics Data',
    dependsOn: ['analytics.view']
  },

  // ==================== AUDIT & SECURITY ====================
  {
    cap: 'audit.view',
    area: 'Audit & Security',
    label: 'View Audit Logs',
    dependsOn: []
  },
  {
    cap: 'audit.export',
    area: 'Audit & Security',
    label: 'Export Audit Logs',
    dependsOn: ['audit.view']
  },
  {
    cap: 'security.view',
    area: 'Audit & Security',
    label: 'View Security Settings',
    dependsOn: []
  },
  {
    cap: 'security.manage',
    area: 'Audit & Security',
    label: 'Manage Security Settings',
    dependsOn: ['security.view']
  },

  // ==================== SYSTEM ADMINISTRATION ====================
  {
    cap: 'system.view',
    area: 'System Admin',
    label: 'View System Settings',
    dependsOn: []
  },
  {
    cap: 'system.configure',
    area: 'System Admin',
    label: 'Configure System',
    dependsOn: ['system.view']
  },
  {
    cap: 'system.integrations',
    area: 'System Admin',
    label: 'Manage Integrations',
    dependsOn: ['system.configure']
  },
  {
    cap: 'system.backup',
    area: 'System Admin',
    label: 'Manage Backups',
    dependsOn: ['system.view']
  },
  {
    cap: 'system.maintenance',
    area: 'System Admin',
    label: 'System Maintenance',
    dependsOn: ['system.configure']
  },

  // ==================== KNOWLEDGE BASE ====================
  {
    cap: 'knowledge.view',
    area: 'Knowledge Base',
    label: 'View Knowledge Base',
    dependsOn: []
  },
  {
    cap: 'knowledge.create',
    area: 'Knowledge Base',
    label: 'Create Knowledge Articles',
    dependsOn: ['knowledge.view']
  },
  {
    cap: 'knowledge.update',
    area: 'Knowledge Base',
    label: 'Update Knowledge Articles',
    dependsOn: ['knowledge.view']
  },
  {
    cap: 'knowledge.delete',
    area: 'Knowledge Base',
    label: 'Delete Knowledge Articles',
    dependsOn: ['knowledge.view']
  },
  {
    cap: 'knowledge.manage_training',
    area: 'Knowledge Base',
    label: 'Manage Training Modules',
    dependsOn: ['knowledge.view']
  },

  // ==================== FORUM ====================
  {
    cap: 'forum.view',
    area: 'Forum',
    label: 'View Forum',
    dependsOn: []
  },
  {
    cap: 'forum.post',
    area: 'Forum',
    label: 'Create Forum Posts',
    dependsOn: ['forum.view']
  },
  {
    cap: 'forum.moderate',
    area: 'Forum',
    label: 'Moderate Forum',
    dependsOn: ['forum.view']
  },
  {
    cap: 'forum.admin',
    area: 'Forum',
    label: 'Forum Administration',
    dependsOn: ['forum.moderate']
  },

  // ==================== NOTIFICATIONS ====================
  {
    cap: 'notifications.view',
    area: 'Notifications',
    label: 'View Notifications',
    dependsOn: []
  },
  {
    cap: 'notifications.send',
    area: 'Notifications',
    label: 'Send Notifications',
    dependsOn: []
  },
  {
    cap: 'notifications.manage',
    area: 'Notifications',
    label: 'Manage Notification Settings',
    dependsOn: ['notifications.view']
  },

  // ==================== REPORTED ISSUES ====================
  {
    cap: 'issues.view',
    area: 'Reported Issues',
    label: 'View Reported Issues',
    dependsOn: []
  },
  {
    cap: 'issues.create',
    area: 'Reported Issues',
    label: 'Report Issues',
    dependsOn: []
  },
  {
    cap: 'issues.update',
    area: 'Reported Issues',
    label: 'Update Issue Status',
    dependsOn: ['issues.view']
  },
  {
    cap: 'issues.assign',
    area: 'Reported Issues',
    label: 'Assign Issues',
    dependsOn: ['issues.view']
  },
  {
    cap: 'issues.resolve',
    area: 'Reported Issues',
    label: 'Resolve Issues',
    dependsOn: ['issues.update']
  },
  {
    cap: 'issues.delete',
    area: 'Reported Issues',
    label: 'Delete Issues',
    dependsOn: ['issues.view']
  },

  // ==================== MESSAGES ====================
  {
    cap: 'messages.view',
    area: 'Messages',
    label: 'View Messages',
    dependsOn: []
  },
  {
    cap: 'messages.send',
    area: 'Messages',
    label: 'Send Messages',
    dependsOn: ['messages.view']
  },
  {
    cap: 'messages.broadcast',
    area: 'Messages',
    label: 'Broadcast Messages',
    dependsOn: ['messages.send']
  },
];

module.exports = capabilitiesCatalog;

/**
 * Comprehensive Scopes Catalog for Role & Dashboard Wizard
 * This defines all available access scopes in the subgrant platform
 */

const scopesCatalog = {
  // ==================== PROJECT SCOPE ====================
  project: {
    label: 'Project Access',
    description: 'Define which projects this role can access',
    options: [
      {
        value: 'all',
        label: 'All Projects',
        description: 'Access to all projects in the system (Admin level)'
      },
      {
        value: 'organization',
        label: 'Organization Projects',
        description: 'Access to all projects within user\'s organization'
      },
      {
        value: 'assigned',
        label: 'Assigned Projects Only',
        description: 'Access only to specifically assigned projects'
      },
      {
        value: 'self',
        label: 'Own Projects',
        description: 'Access only to projects user created or owns'
      },
      {
        value: 'none',
        label: 'No Project Access',
        description: 'No access to any projects'
      }
    ]
  },

  // ==================== ORGANIZATION SCOPE ====================
  organization: {
    label: 'Organization Access',
    description: 'Define which organizations this role can access',
    options: [
      {
        value: 'all',
        label: 'All Organizations',
        description: 'Access to all organizations in the system (Admin level)'
      },
      {
        value: 'current',
        label: 'Current Organization Only',
        description: 'Access only to user\'s own organization'
      },
      {
        value: 'assigned',
        label: 'Assigned Organizations',
        description: 'Access to specifically assigned organizations'
      },
      {
        value: 'partners',
        label: 'Partner Organizations',
        description: 'Access to partner organizations only'
      },
      {
        value: 'none',
        label: 'No Organization Access',
        description: 'No access to organization data'
      }
    ]
  },

  // ==================== DATA SCOPE ====================
  data: {
    label: 'Data Access Level',
    description: 'Define the level of data access permissions',
    options: [
      {
        value: 'full',
        label: 'Full Access',
        description: 'Complete read, write, update, and delete access'
      },
      {
        value: 'write',
        label: 'Read & Write',
        description: 'Can view and modify data, but not delete'
      },
      {
        value: 'read',
        label: 'Read Only',
        description: 'Can view data but cannot make any changes'
      },
      {
        value: 'restricted',
        label: 'Restricted Access',
        description: 'Limited access to specific data fields only'
      },
      {
        value: 'none',
        label: 'No Data Access',
        description: 'No access to data'
      }
    ]
  },

  // ==================== USER SCOPE ====================
  users: {
    label: 'User Access',
    description: 'Define which users this role can manage or view',
    options: [
      {
        value: 'all',
        label: 'All Users',
        description: 'Access to all users in the system (Admin level)'
      },
      {
        value: 'organization',
        label: 'Organization Users',
        description: 'Access to users within same organization'
      },
      {
        value: 'team',
        label: 'Team Members',
        description: 'Access to direct team members only'
      },
      {
        value: 'subordinates',
        label: 'Subordinates Only',
        description: 'Access to users reporting to this role'
      },
      {
        value: 'self',
        label: 'Self Only',
        description: 'Access only to own user profile'
      },
      {
        value: 'none',
        label: 'No User Access',
        description: 'No access to user management'
      }
    ]
  },

  // ==================== FINANCIAL SCOPE ====================
  financial: {
    label: 'Financial Data Access',
    description: 'Define access to financial information',
    options: [
      {
        value: 'all',
        label: 'All Financial Data',
        description: 'Access to all financial information (Finance Admin)'
      },
      {
        value: 'organization',
        label: 'Organization Finances',
        description: 'Access to own organization\'s financial data'
      },
      {
        value: 'project',
        label: 'Project Finances',
        description: 'Access to assigned project budgets and finances'
      },
      {
        value: 'summary',
        label: 'Summary Only',
        description: 'Access to financial summaries, not detailed transactions'
      },
      {
        value: 'none',
        label: 'No Financial Access',
        description: 'No access to financial data'
      }
    ]
  },

  // ==================== APPROVAL SCOPE ====================
  approval: {
    label: 'Approval Authority',
    description: 'Define approval authority and limits',
    options: [
      {
        value: 'unlimited',
        label: 'Unlimited Approval',
        description: 'Can approve any amount or request (Executive level)'
      },
      {
        value: 'high',
        label: 'High Value Approval',
        description: 'Can approve requests up to high value threshold'
      },
      {
        value: 'medium',
        label: 'Medium Value Approval',
        description: 'Can approve requests up to medium value threshold'
      },
      {
        value: 'low',
        label: 'Low Value Approval',
        description: 'Can approve requests up to low value threshold'
      },
      {
        value: 'recommend',
        label: 'Recommend Only',
        description: 'Can recommend but not approve'
      },
      {
        value: 'none',
        label: 'No Approval Authority',
        description: 'Cannot approve any requests'
      }
    ]
  },

  // ==================== REPORTING SCOPE ====================
  reporting: {
    label: 'Reporting Access',
    description: 'Define access to reports and analytics',
    options: [
      {
        value: 'all',
        label: 'All Reports',
        description: 'Access to all system reports and analytics'
      },
      {
        value: 'executive',
        label: 'Executive Reports',
        description: 'Access to executive dashboards and KPIs'
      },
      {
        value: 'organization',
        label: 'Organization Reports',
        description: 'Access to own organization\'s reports'
      },
      {
        value: 'project',
        label: 'Project Reports',
        description: 'Access to assigned project reports only'
      },
      {
        value: 'basic',
        label: 'Basic Reports',
        description: 'Access to basic operational reports'
      },
      {
        value: 'none',
        label: 'No Reporting Access',
        description: 'No access to reports'
      }
    ]
  },

  // ==================== DOCUMENT SCOPE ====================
  document: {
    label: 'Document Access',
    description: 'Define access to documents and files',
    options: [
      {
        value: 'all',
        label: 'All Documents',
        description: 'Access to all documents in the system'
      },
      {
        value: 'organization',
        label: 'Organization Documents',
        description: 'Access to organization\'s documents'
      },
      {
        value: 'project',
        label: 'Project Documents',
        description: 'Access to assigned project documents'
      },
      {
        value: 'public',
        label: 'Public Documents',
        description: 'Access to public/shared documents only'
      },
      {
        value: 'own',
        label: 'Own Documents',
        description: 'Access only to documents user uploaded'
      },
      {
        value: 'none',
        label: 'No Document Access',
        description: 'No access to documents'
      }
    ]
  }
};

module.exports = scopesCatalog;

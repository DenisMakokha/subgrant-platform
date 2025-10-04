import React, { useState } from 'react';

interface PageTemplate {
  id: string;
  name: string;
  route: string;
  layout: 'full' | 'sidebar' | 'split' | 'tabs';
  sections: PageSection[];
  permissions?: string[];
}

interface PageSection {
  id: string;
  type: 'header' | 'content' | 'sidebar' | 'footer' | 'tabs' | 'grid';
  title?: string;
  content?: string;
  columns?: number;
  items?: any[];
}

interface PageTemplateBuilderProps {
  selectedPages: PageTemplate[];
  onPagesChange: (pages: PageTemplate[]) => void;
  availableCapabilities?: string[];
}

const PageTemplateBuilder: React.FC<PageTemplateBuilderProps> = ({
  selectedPages,
  onPagesChange,
  availableCapabilities = []
}) => {
  const [activePageIndex, setActivePageIndex] = useState<number | null>(null);

  const defaultPageTemplates: PageTemplate[] = [
    // Dashboard Pages
    {
      id: 'dashboard',
      name: 'Dashboard Home',
      route: '/dashboard',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'Dashboard', content: 'Welcome to your dashboard' },
        { id: 'widgets', type: 'grid', columns: 3, items: [] }
      ]
    },
    
    // Partner Pages
    {
      id: 'partner-onboarding',
      name: 'Partner Onboarding',
      route: '/partner/onboarding',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'Onboarding', content: 'Complete your organization profile' },
        { id: 'progress', type: 'content', title: 'Progress Tracker' },
        { id: 'form', type: 'content', title: 'Onboarding Form' }
      ],
      permissions: ['onboarding.access']
    },
    {
      id: 'partner-profile',
      name: 'Partner Profile',
      route: '/partner/profile',
      layout: 'tabs',
      sections: [
        { id: 'header', type: 'header', title: 'Organization Profile' },
        { id: 'tabs', type: 'tabs', items: ['Basic Info', 'Contact Details', 'Bank Details', 'Documents'] }
      ],
      permissions: ['profile.view']
    },
    {
      id: 'projects',
      name: 'Projects List',
      route: '/projects',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Projects', content: 'Manage your projects' },
        { id: 'filters', type: 'sidebar', title: 'Filters' },
        { id: 'list', type: 'content', title: 'Project List' }
      ],
      permissions: ['projects.view']
    },
    {
      id: 'budgets',
      name: 'Budget Management',
      route: '/budgets',
      layout: 'tabs',
      sections: [
        { id: 'header', type: 'header', title: 'Budgets' },
        { id: 'tabs', type: 'tabs', items: ['Overview', 'Budget Lines', 'Approvals', 'History'] }
      ],
      permissions: ['budgets.view']
    },
    {
      id: 'fund-requests',
      name: 'Fund Requests',
      route: '/fund-requests',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Fund Requests', content: 'Request and track disbursements' },
        { id: 'filters', type: 'sidebar', title: 'Status Filters' },
        { id: 'requests', type: 'content', title: 'Request List' }
      ],
      permissions: ['fund_requests.view']
    },
    {
      id: 'reconciliation',
      name: 'Reconciliation',
      route: '/reconciliation',
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', title: 'Financial Reconciliation' },
        { id: 'summary', type: 'content', title: 'Summary' },
        { id: 'transactions', type: 'content', title: 'Transactions' }
      ],
      permissions: ['reconciliation.view']
    },
    {
      id: 'me-reports',
      name: 'M&E Reports',
      route: '/reports',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'M&E Reports', content: 'Monitoring and Evaluation Reports' },
        { id: 'filters', type: 'sidebar', title: 'Report Filters' },
        { id: 'reports', type: 'content', title: 'Reports List' }
      ],
      permissions: ['me_reports.view']
    },
    {
      id: 'contracts',
      name: 'Contracts',
      route: '/contracts',
      layout: 'tabs',
      sections: [
        { id: 'header', type: 'header', title: 'Contracts & Agreements' },
        { id: 'tabs', type: 'tabs', items: ['Active Contracts', 'Disbursements', 'Documents', 'History'] }
      ],
      permissions: ['contracts.view']
    },
    {
      id: 'documents',
      name: 'Documents',
      route: '/documents',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Document Library' },
        { id: 'categories', type: 'sidebar', title: 'Categories' },
        { id: 'files', type: 'content', title: 'Files' }
      ],
      permissions: ['documents.view']
    },
    
    // Admin Pages
    {
      id: 'users',
      name: 'User Management',
      route: '/admin/users',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'User Management', content: 'Manage system users and permissions' },
        { id: 'filters', type: 'content', title: 'Search & Filters' },
        { id: 'table', type: 'content', title: 'User List' }
      ],
      permissions: ['users.view']
    },
    {
      id: 'organizations',
      name: 'Organizations',
      route: '/admin/organizations',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Organizations', content: 'Manage partner organizations' },
        { id: 'filters', type: 'sidebar', title: 'Filters' },
        { id: 'list', type: 'content', title: 'Organization List' }
      ],
      permissions: ['organizations.view']
    },
    {
      id: 'audit',
      name: 'Audit Center',
      route: '/admin/audit',
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', title: 'Audit Center', content: 'System activity and security logs' },
        { id: 'filters', type: 'content', title: 'Filters & Search' },
        { id: 'logs', type: 'content', title: 'Audit Logs' }
      ],
      permissions: ['audit_logs.view']
    },
    {
      id: 'wizard',
      name: 'Role & Dashboard Wizard',
      route: '/admin/wizard',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'Role & Dashboard Wizard', content: 'Create and configure roles' },
        { id: 'steps', type: 'content', title: 'Wizard Steps' }
      ],
      permissions: ['wizard.admin']
    },
    {
      id: 'config',
      name: 'Configuration',
      route: '/admin/config',
      layout: 'tabs',
      sections: [
        { id: 'header', type: 'header', title: 'System Configuration' },
        { id: 'tabs', type: 'tabs', items: ['General', 'Integrations', 'Email', 'Security', 'Features'] }
      ],
      permissions: ['config.edit']
    },
    
    // Finance Pages
    {
      id: 'disbursements',
      name: 'Disbursements',
      route: '/finance/disbursements',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Disbursements', content: 'Manage fund disbursements' },
        { id: 'filters', type: 'sidebar', title: 'Status Filters' },
        { id: 'list', type: 'content', title: 'Disbursement Queue' }
      ],
      permissions: ['disbursements.view']
    },
    {
      id: 'payments',
      name: 'Payments',
      route: '/finance/payments',
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', title: 'Payments', content: 'Payment processing and tracking' },
        { id: 'pending', type: 'content', title: 'Pending Payments' },
        { id: 'completed', type: 'content', title: 'Completed Payments' }
      ],
      permissions: ['payments.view']
    },
    
    // Grants Manager Pages
    {
      id: 'applications',
      name: 'Grant Applications',
      route: '/gm/applications',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Grant Applications', content: 'Review and process applications' },
        { id: 'filters', type: 'sidebar', title: 'Application Filters' },
        { id: 'list', type: 'content', title: 'Applications' }
      ],
      permissions: ['applications.view']
    },
    {
      id: 'approvals',
      name: 'Approvals Queue',
      route: '/approvals',
      layout: 'tabs',
      sections: [
        { id: 'header', type: 'header', title: 'Approvals', content: 'Pending approval requests' },
        { id: 'tabs', type: 'tabs', items: ['Budgets', 'Fund Requests', 'Reports', 'Documents'] }
      ],
      permissions: ['approvals.view']
    },
    {
      id: 'compliance',
      name: 'Compliance Monitoring',
      route: '/gm/compliance',
      layout: 'split',
      sections: [
        { id: 'header', type: 'header', title: 'Compliance', content: 'Monitor partner compliance' },
        { id: 'overview', type: 'content', title: 'Compliance Overview' },
        { id: 'issues', type: 'content', title: 'Compliance Issues' }
      ],
      permissions: ['compliance.view']
    },
    {
      id: 'partner-performance',
      name: 'Partner Performance',
      route: '/gm/performance',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'Partner Performance', content: 'Track partner performance metrics' },
        { id: 'metrics', type: 'grid', columns: 3, items: [] },
        { id: 'details', type: 'content', title: 'Performance Details' }
      ],
      permissions: ['organizations.view']
    },
    
    // Executive Pages
    {
      id: 'portfolio',
      name: 'Portfolio Overview',
      route: '/executive/portfolio',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'Portfolio Overview', content: 'Strategic portfolio view' },
        { id: 'kpis', type: 'grid', columns: 4, items: [] },
        { id: 'charts', type: 'grid', columns: 2, items: [] }
      ],
      permissions: ['portfolio.view']
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      route: '/executive/analytics',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'Analytics', content: 'Data insights and trends' },
        { id: 'charts', type: 'grid', columns: 2, items: [] },
        { id: 'tables', type: 'content', title: 'Detailed Analytics' }
      ],
      permissions: ['analytics.view']
    },
    
    // Common Pages
    {
      id: 'settings',
      name: 'Settings',
      route: '/settings',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Settings' },
        { id: 'nav', type: 'sidebar', title: 'Navigation' },
        { id: 'content', type: 'content', title: 'Settings Content' }
      ]
    },
    {
      id: 'notifications',
      name: 'Notifications',
      route: '/notifications',
      layout: 'full',
      sections: [
        { id: 'header', type: 'header', title: 'Notifications', content: 'Your notifications and alerts' },
        { id: 'list', type: 'content', title: 'Notification List' }
      ]
    },
    {
      id: 'help',
      name: 'Help Center',
      route: '/help',
      layout: 'sidebar',
      sections: [
        { id: 'header', type: 'header', title: 'Help Center', content: 'Get help and support' },
        { id: 'categories', type: 'sidebar', title: 'Help Categories' },
        { id: 'articles', type: 'content', title: 'Help Articles' }
      ]
    }
  ];

  const addPage = (template: PageTemplate) => {
    if (!selectedPages.find(p => p.id === template.id)) {
      onPagesChange([...selectedPages, { ...template }]);
    }
  };

  const removePage = (pageId: string) => {
    onPagesChange(selectedPages.filter(p => p.id !== pageId));
  };

  const updatePage = (index: number, updates: Partial<PageTemplate>) => {
    const newPages = [...selectedPages];
    newPages[index] = { ...newPages[index], ...updates };
    onPagesChange(newPages);
  };

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'full':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
          </svg>
        );
      case 'sidebar':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18m0 0H5a2 2 0 01-2-2V5a2 2 0 012-2h4m0 18h10a2 2 0 002-2V5a2 2 0 00-2-2H9" />
          </svg>
        );
      case 'split':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v18m6-18v18M3 5h18M3 19h18" />
          </svg>
        );
      case 'tabs':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const canAddPage = (template: PageTemplate) => {
    if (!template.permissions || template.permissions.length === 0) return true;
    return template.permissions.some(perm => availableCapabilities.includes(perm));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Page Template Builder
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure page layouts and sections for your dashboard
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Templates */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Available Page Templates
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {defaultPageTemplates.map(template => {
                const isSelected = selectedPages.some(p => p.id === template.id);
                const canAdd = canAddPage(template);
                
                return (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      !canAdd
                        ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                    }`}
                    onClick={() => canAdd && !isSelected && addPage(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1 text-indigo-600 dark:text-indigo-400">
                          {getLayoutIcon(template.layout)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {template.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {template.route}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                              {template.layout}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                              {template.sections.length} sections
                            </span>
                          </div>
                          {template.permissions && template.permissions.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Requires: {template.permissions.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Pages */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Selected Pages ({selectedPages.length})
            </h4>
            <div className="space-y-2 min-h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              {selectedPages.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">No pages selected</p>
                  <p className="text-xs mt-1">Click templates from the left to add them</p>
                </div>
              ) : (
                selectedPages.map((page, index) => (
                  <div
                    key={page.id}
                    className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-1 text-indigo-600 dark:text-indigo-400">
                          {getLayoutIcon(page.layout)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {page.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {page.route}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded">
                              {page.layout} layout
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                              {page.sections.length} sections
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removePage(page.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 flex-shrink-0 ml-2"
                        title="Remove page"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Expand to show sections */}
                    {activePageIndex === index && (
                      <div className="mt-3 pt-3 border-t border-indigo-200 dark:border-indigo-700">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Page Sections:
                        </div>
                        <div className="space-y-1">
                          {page.sections.map(section => (
                            <div key={section.id} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>{section.type}</span>
                              {section.title && <span>- {section.title}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setActivePageIndex(activePageIndex === index ? null : index)}
                      className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                      {activePageIndex === index ? 'Hide' : 'Show'} sections
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generated JSON Preview */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Generated Pages Configuration ({selectedPages.length} pages)
          </h4>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedPages, null, 2))}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy JSON
          </button>
        </div>
        <pre className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto max-h-48">
          {JSON.stringify(selectedPages, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PageTemplateBuilder;

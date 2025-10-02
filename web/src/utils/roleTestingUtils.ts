/**
 * Role Testing Utilities
 * 
 * Utilities for testing dashboard with different roles and capabilities
 */

export interface TestRole {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  description: string;
}

export const testRoles: TestRole[] = [
  {
    id: 'admin-test',
    name: 'Admin User',
    role: 'admin',
    capabilities: [
      'users.view',
      'users.create',
      'users.update',
      'users.delete',
      'organizations.view',
      'organizations.create',
      'organizations.update',
      'organizations.delete',
      'projects.view',
      'projects.create',
      'projects.update',
      'projects.delete',
      'budgets.view',
      'budgets.create',
      'budgets.update',
      'budgets.delete',
      'approvals.view',
      'approvals.approve',
      'approvals.reject',
      'audit_logs.view',
      'audit_logs.export',
      'system.read',
      'system.update',
      'reports.view',
      'reports.create',
      'reports.export'
    ],
    description: 'Full system access with all capabilities'
  },
  {
    id: 'partner-test',
    name: 'Partner User',
    role: 'partner',
    capabilities: [
      'budgets.view',
      'projects.view',
      'me_reports.view',
      'me_reports.create',
      'me_reports.submit',
      'compliance.view',
      'compliance.submit',
      'fund_requests.view',
      'fund_requests.create',
      'documents.view',
      'documents.upload',
      'contracts.view'
    ],
    description: 'Partner organization user with standard access'
  },
  {
    id: 'grants-manager-test',
    name: 'Grants Manager',
    role: 'grants_manager',
    capabilities: [
      'projects.view',
      'projects.create',
      'projects.update',
      'budgets.view',
      'budgets.create',
      'budgets.update',
      'approvals.view',
      'approvals.approve',
      'me_reports.view',
      'compliance.view',
      'organizations.view',
      'reports.view',
      'reports.create'
    ],
    description: 'Grants management with approval authority'
  },
  {
    id: 'finance-manager-test',
    name: 'Finance Manager',
    role: 'finance_manager',
    capabilities: [
      'budgets.view',
      'budgets.create',
      'budgets.update',
      'budgets.delete',
      'disbursements.view',
      'disbursements.create',
      'disbursements.approve',
      'financial_reports.view',
      'financial_reports.create',
      'financial_reports.export',
      'reconciliation.view',
      'reconciliation.approve',
      'contracts.view'
    ],
    description: 'Financial management and disbursements'
  },
  {
    id: 'coo-test',
    name: 'Chief Operating Officer',
    role: 'coo',
    capabilities: [
      'projects.view',
      'budgets.view',
      'approvals.view',
      'approvals.approve',
      'organizations.view',
      'reports.view',
      'reports.export',
      'audit_logs.view',
      'system.read'
    ],
    description: 'Executive oversight with approval authority'
  },
  {
    id: 'custom-limited-test',
    name: 'Custom Limited User',
    role: 'custom_limited',
    capabilities: [
      'budgets.view',
      'projects.view',
      'reports.view'
    ],
    description: 'Custom role with limited view-only access'
  },
  {
    id: 'custom-advanced-test',
    name: 'Custom Advanced User',
    role: 'custom_advanced',
    capabilities: [
      'budgets.view',
      'budgets.create',
      'budgets.update',
      'projects.view',
      'projects.create',
      'projects.update',
      'me_reports.view',
      'me_reports.create',
      'approvals.view',
      'compliance.view',
      'compliance.submit',
      'reports.view',
      'reports.create'
    ],
    description: 'Custom role with advanced permissions'
  }
];

/**
 * Get test role by ID
 */
export function getTestRole(roleId: string): TestRole | undefined {
  return testRoles.find(r => r.id === roleId);
}

/**
 * Get test roles by category
 */
export function getTestRolesByCategory(category: 'builtin' | 'custom'): TestRole[] {
  if (category === 'builtin') {
    return testRoles.filter(r => !r.role.startsWith('custom_'));
  }
  return testRoles.filter(r => r.role.startsWith('custom_'));
}

/**
 * Simulate user with test role
 */
export function simulateUserWithRole(testRole: TestRole) {
  return {
    id: `test-user-${testRole.id}`,
    email: `${testRole.role}@test.com`,
    name: testRole.name,
    role: testRole.role,
    capabilities: testRole.capabilities,
    status: 'active' as const,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Count widgets visible for role
 */
export function countVisibleWidgets(
  widgets: any[],
  capabilities: string[]
): number {
  return widgets.filter(widget => {
    if (!widget.capability) return true;
    return capabilities.includes(widget.capability);
  }).length;
}

/**
 * Get dashboard template for role
 */
export function getDashboardTemplateForRole(role: string): string {
  const templateMap: Record<string, string> = {
    admin: 'admin',
    partner: 'partner',
    partner_user: 'partner',
    grants_manager: 'operations',
    coo: 'executive',
    finance_manager: 'finance',
    accountant: 'finance'
  };

  return templateMap[role] || 'partner';
}

/**
 * Generate test report
 */
export interface TestReport {
  role: TestRole;
  dashboardTemplate: string;
  totalWidgets: number;
  visibleWidgets: number;
  hiddenWidgets: number;
  capabilities: string[];
  timestamp: string;
}

export function generateTestReport(
  testRole: TestRole,
  widgets: any[]
): TestReport {
  const visibleCount = countVisibleWidgets(widgets, testRole.capabilities);
  
  return {
    role: testRole,
    dashboardTemplate: getDashboardTemplateForRole(testRole.role),
    totalWidgets: widgets.length,
    visibleWidgets: visibleCount,
    hiddenWidgets: widgets.length - visibleCount,
    capabilities: testRole.capabilities,
    timestamp: new Date().toISOString()
  };
}

/**
 * Export test results to console
 */
export function logTestResults(reports: TestReport[]) {
  console.group('🧪 Dashboard Role Testing Results');
  
  reports.forEach(report => {
    console.group(`\n📊 ${report.role.name} (${report.role.role})`);
    console.log(`Template: ${report.dashboardTemplate}`);
    console.log(`Total Widgets: ${report.totalWidgets}`);
    console.log(`Visible: ${report.visibleWidgets}`);
    console.log(`Hidden: ${report.hiddenWidgets}`);
    console.log(`Capabilities: ${report.capabilities.length}`);
    console.log(`Tested: ${report.timestamp}`);
    console.groupEnd();
  });
  
  console.groupEnd();
}

/**
 * Export test results to JSON
 */
export function exportTestResults(reports: TestReport[]): string {
  return JSON.stringify(reports, null, 2);
}

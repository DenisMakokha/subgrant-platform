import React, { useState, useEffect } from 'react';

interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  items?: MenuItem[];
}

interface MenuBuilderProps {
  selectedMenus: MenuItem[];
  onMenuChange: (menus: MenuItem[]) => void;
  className?: string;
  roleType?: 'admin' | 'partner' | 'finance' | 'grants' | 'executive' | 'all';
}

const MenuBuilder: React.FC<MenuBuilderProps> = ({
  selectedMenus,
  onMenuChange,
  className = '',
  roleType = 'all',
}) => {
  // Comprehensive menu items for all roles
  const [availableItems] = useState<MenuItem[]>([
    // Admin Menu Items
    { key: 'admin_dashboard', label: 'Admin Dashboard', icon: '🏠', route: '/admin/dashboard' },
    { key: 'users', label: 'User Management', icon: '👥', route: '/admin/users' },
    { key: 'organizations', label: 'Organizations', icon: '🏢', route: '/admin/organizations' },
    { key: 'audit', label: 'Audit Center', icon: '📋', route: '/admin/audit' },
    { key: 'wizard', label: 'Role Wizard', icon: '🧙', route: '/admin/wizard' },
    { key: 'config', label: 'Configuration', icon: '⚙️', route: '/admin/config' },
    { key: 'security', label: 'Security Center', icon: '🔒', route: '/admin/security' },
    { key: 'system', label: 'System Admin', icon: '🖥️', route: '/admin/system' },
    
    // Partner Menu Items
    { key: 'partner_dashboard', label: 'Dashboard', icon: '🏠', route: '/partner/dashboard' },
    { key: 'onboarding', label: 'Onboarding', icon: '🚀', route: '/partner/onboarding' },
    { key: 'profile', label: 'Profile', icon: '👤', route: '/partner/profile' },
    { key: 'projects', label: 'Projects', icon: '📁', route: '/partner/projects' },
    { key: 'budgets', label: 'Budget', icon: '💰', route: '/partner/budget' },
    { key: 'fund_request', label: 'Fund Request', icon: '💵', route: '/partner/fund-request' },
    { key: 'reconciliation', label: 'Reconciliation', icon: '🔄', route: '/partner/reconciliation' },
    { key: 'reports', label: 'M&E Reports', icon: '📊', route: '/partner/reports' },
    { key: 'contracts', label: 'Contracts', icon: '📄', route: '/partner/contracts' },
    { key: 'documents', label: 'Documents', icon: '📋', route: '/partner/documents' },
    { key: 'forum', label: 'Forum', icon: '💬', route: '/partner/forum' },
    { key: 'help', label: 'Help Center', icon: '❓', route: '/partner/help' },
    
    // Finance Menu Items
    { key: 'finance_dashboard', label: 'Finance Dashboard', icon: '💼', route: '/finance/dashboard' },
    { key: 'disbursements', label: 'Disbursements', icon: '💸', route: '/finance/disbursements' },
    { key: 'payments', label: 'Payments', icon: '💳', route: '/finance/payments' },
    { key: 'budget_review', label: 'Budget Review', icon: '📊', route: '/finance/budgets' },
    { key: 'reconciliation_review', label: 'Reconciliation', icon: '🔍', route: '/finance/reconciliation' },
    
    // Grants Manager Menu Items
    { key: 'gm_dashboard', label: 'GM Dashboard', icon: '🎯', route: '/gm/dashboard' },
    { key: 'applications', label: 'Applications', icon: '📝', route: '/gm/applications' },
    { key: 'approvals', label: 'Approvals', icon: '✅', route: '/gm/approvals' },
    { key: 'compliance', label: 'Compliance', icon: '📋', route: '/gm/compliance' },
    { key: 'partner_performance', label: 'Partner Performance', icon: '📈', route: '/gm/performance' },
    
    // Executive Menu Items
    { key: 'executive_dashboard', label: 'Executive Dashboard', icon: '👔', route: '/executive/dashboard' },
    { key: 'portfolio', label: 'Portfolio Overview', icon: '📊', route: '/executive/portfolio' },
    { key: 'analytics', label: 'Analytics', icon: '📈', route: '/executive/analytics' },
    { key: 'strategic_reports', label: 'Strategic Reports', icon: '📑', route: '/executive/reports' },
  ]);

  const [draggedItem, setDraggedItem] = useState<MenuItem | null>(null);

  const addMenuItem = (item: MenuItem) => {
    if (!selectedMenus.find(menu => menu.key === item.key)) {
      const newMenuItem: MenuItem = {
        key: item.key,
        label: item.label,
        icon: item.icon,
        route: item.route,
        items: []
      };
      onMenuChange([...selectedMenus, newMenuItem]);
    }
  };

  const removeMenuItem = (itemKey: string) => {
    onMenuChange(selectedMenus.filter(menu => menu.key !== itemKey));
  };

  const moveMenuItem = (fromIndex: number, toIndex: number) => {
    const newMenus = [...selectedMenus];
    const [movedItem] = newMenus.splice(fromIndex, 1);
    newMenus.splice(toIndex, 0, movedItem);
    onMenuChange(newMenus);
  };

  const handleDragStart = (e: React.DragEvent, item: MenuItem, index: number) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem) {
      const currentIndex = selectedMenus.findIndex(item => item.key === draggedItem.key);
      if (currentIndex !== -1) {
        moveMenuItem(currentIndex, dropIndex);
      }
    }
    setDraggedItem(null);
  };

  const generateMenuJSON = () => {
    return selectedMenus.map(menu => ({
      key: menu.key,
      label: menu.label,
      icon: menu.icon,
      route: menu.route,
      items: menu.items || []
    }));
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Dashboard Menu Builder
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Drag and drop to arrange menu items, or click to add from available options
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Items */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Available Menu Items
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableItems
                .filter(item => {
                  if (roleType === 'all') return true;
                  const itemKey = item.key.toLowerCase();
                  if (roleType === 'admin') return itemKey.startsWith('admin_') || ['users', 'organizations', 'audit', 'wizard', 'config', 'security', 'system'].includes(item.key);
                  if (roleType === 'partner') return itemKey.startsWith('partner_') || ['onboarding', 'profile', 'projects', 'budgets', 'fund_request', 'reconciliation', 'reports', 'contracts', 'documents', 'forum', 'help'].includes(item.key);
                  if (roleType === 'finance') return itemKey.startsWith('finance_') || ['disbursements', 'payments', 'budget_review', 'reconciliation_review'].includes(item.key);
                  if (roleType === 'grants') return itemKey.startsWith('gm_') || ['applications', 'approvals', 'compliance', 'partner_performance'].includes(item.key);
                  if (roleType === 'executive') return itemKey.startsWith('executive_') || ['portfolio', 'analytics', 'strategic_reports'].includes(item.key);
                  return true;
                })
                .map(item => {
                const isSelected = selectedMenus.some(menu => menu.key === item.key);
                return (
                  <div
                    key={item.key}
                    className={`p-3 border rounded-lg transition-colors ${
                      isSelected
                        ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                    }`}
                    onClick={() => !isSelected && addMenuItem(item)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.route}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Menu */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Selected Menu Items ({selectedMenus.length})
            </h4>
            <div className="space-y-2 min-h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
              {selectedMenus.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No menu items selected</p>
                  <p className="text-sm">Click items from the left to add them</p>
                </div>
              ) : (
                selectedMenus.map((item, index) => (
                  <div
                    key={item.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg cursor-move hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.key}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeMenuItem(item.key)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
            Generated Menu Configuration
          </h4>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(generateMenuJSON(), null, 2))}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            Copy JSON
          </button>
        </div>
        <pre className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border overflow-x-auto">
          {JSON.stringify(generateMenuJSON(), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default MenuBuilder;

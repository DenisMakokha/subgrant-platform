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
}

const MenuBuilder: React.FC<MenuBuilderProps> = ({
  selectedMenus,
  onMenuChange,
  className = '',
}) => {
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([
    { key: 'dashboard', label: 'Dashboard', icon: '📊', route: '/admin/dashboard' },
    { key: 'users', label: 'User Management', icon: '👥', route: '/admin/users' },
    { key: 'audit', label: 'Audit Center', icon: '📋', route: '/admin/audit' },
    { key: 'wizard', label: 'Role Wizard', icon: '🔧', route: '/admin/wizard' },
    { key: 'config', label: 'Configuration', icon: '⚙️', route: '/admin/config' },
    { key: 'projects', label: 'Projects', icon: '📁', route: '/projects' },
    { key: 'contracts', label: 'Contracts', icon: '📄', route: '/contracts' },
    { key: 'budgets', label: 'Budgets', icon: '💰', route: '/budgets' },
    { key: 'reports', label: 'Reports', icon: '📊', route: '/reports' },
    { key: 'documents', label: 'Documents', icon: '📋', route: '/documents' },
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
            <div className="space-y-2">
              {availableItems.map(item => {
                const isSelected = selectedMenus.some(menu => menu.key === item.key);
                return (
                  <div
                    key={item.key}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                          {item.key}
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

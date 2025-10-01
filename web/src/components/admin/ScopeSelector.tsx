import React, { useState } from 'react';

interface ScopeSelectorProps {
  selectedScopes: Record<string, string>;
  onScopeChange: (scopes: Record<string, string>) => void;
  className?: string;
}

const ScopeSelector: React.FC<ScopeSelectorProps> = ({
  selectedScopes,
  onScopeChange,
  className = '',
}) => {
  const [customScopes, setCustomScopes] = useState<Record<string, string>>(selectedScopes);

  const scopeOptions = {
    project: [
      { value: 'all', label: 'All Projects', description: 'Access to all projects in the system' },
      { value: 'organization', label: 'Organization Projects', description: 'Access to projects in user\'s organization' },
      { value: 'self', label: 'Own Projects', description: 'Access only to projects user owns' },
      { value: 'assigned', label: 'Assigned Projects', description: 'Access to specifically assigned projects' },
    ],
    tenant: [
      { value: 'all', label: 'All Tenants', description: 'Access to all tenant data' },
      { value: 'current', label: 'Current Tenant', description: 'Access to current tenant only' },
      { value: 'assigned', label: 'Assigned Tenants', description: 'Access to assigned tenants' },
    ],
    data: [
      { value: 'read', label: 'Read Only', description: 'Can view but not modify data' },
      { value: 'write', label: 'Read & Write', description: 'Can view and modify data' },
      { value: 'admin', label: 'Admin Access', description: 'Full administrative access' },
    ],
    users: [
      { value: 'all', label: 'All Users', description: 'Access to all user data' },
      { value: 'organization', label: 'Organization Users', description: 'Access to users in same organization' },
      { value: 'team', label: 'Team Members', description: 'Access to team members only' },
      { value: 'self', label: 'Self Only', description: 'Access to own data only' },
    ],
  };

  const updateScope = (category: string, value: string) => {
    const newScopes = {
      ...customScopes,
      [category]: value
    };
    setCustomScopes(newScopes);
    onScopeChange(newScopes);
  };

  const generateScopeJSON = () => {
    return { ...customScopes };
  };

  const getScopeIcon = (category: string) => {
    switch (category) {
      case 'project':
        return '📁';
      case 'tenant':
        return '🏢';
      case 'data':
        return '💾';
      case 'users':
        return '👥';
      default:
        return '🔧';
    }
  };

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-4 rounded-t-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Access Scope Configuration
            </h3>
            <p className="text-purple-100 text-sm">
              Define what data and resources this role can access
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6 bg-white dark:bg-gray-800">
        {Object.entries(scopeOptions).map(([category, options]) => (
          <div key={category} className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 border-2 border-purple-100 dark:border-purple-900">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center text-2xl">
                {getScopeIcon(category)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white capitalize text-base">
                  {category} Access
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control {category} access level
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {options.map(option => {
                const isSelected = customScopes[category] === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex items-start space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all group ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name={category}
                      value={option.value}
                      checked={isSelected}
                      onChange={(e) => updateScope(category, e.target.value)}
                      className="mt-1 w-5 h-5 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Generated JSON Preview */}
      <div className="p-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-b-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h4 className="text-white font-medium">
              Generated Configuration
            </h4>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(generateScopeJSON(), null, 2));
              alert('Configuration copied to clipboard!');
            }}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-xs font-medium transition-all flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Copy JSON</span>
          </button>
        </div>
        <pre className="text-xs text-white bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 overflow-x-auto font-mono">
          {JSON.stringify(generateScopeJSON(), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ScopeSelector;

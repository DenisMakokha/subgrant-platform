import React, { useState } from 'react';
import ApprovalWorkflowBuilder from './ApprovalWorkflowBuilder';
import ApprovalQueue from './ApprovalQueue';
import ApprovalAnalytics from './ApprovalAnalytics';

const ApprovalManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workflows' | 'queue' | 'analytics'>('workflows');

  const tabs = [
    { id: 'workflows' as const, label: 'Workflows', icon: '⚙️', description: 'Configure approval workflows' },
    { id: 'queue' as const, label: 'Queue', icon: '📋', description: 'Pending approvals' },
    { id: 'analytics' as const, label: 'Analytics', icon: '📊', description: 'Approval metrics' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <h1 className="text-3xl font-bold mb-2">Approval Management</h1>
          <p className="text-blue-100">Manage workflows, process approvals, and view analytics</p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all relative
                  ${activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <span className="text-xl">{tab.icon}</span>
                <div className="text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === 'workflows' && <ApprovalWorkflowBuilder />}
          {activeTab === 'queue' && <ApprovalQueue />}
          {activeTab === 'analytics' && <ApprovalAnalytics />}
        </div>
      </div>
    </div>
  );
};

export default ApprovalManagement;

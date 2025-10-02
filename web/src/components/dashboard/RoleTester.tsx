import React, { useState } from 'react';
import { testRoles, simulateUserWithRole, generateTestReport, logTestResults, exportTestResults, TestRole, TestReport } from '../../utils/roleTestingUtils';

/**
 * RoleTester - Component for testing dashboard with different roles
 * 
 * Features:
 * - Select test role
 * - View role capabilities
 * - Test dashboard visibility
 * - Generate test reports
 * - Export test results
 */

interface RoleTesterProps {
  widgets: any[];
  onRoleChange?: (role: TestRole) => void;
}

export default function RoleTester({ widgets, onRoleChange }: RoleTesterProps) {
  const [selectedRole, setSelectedRole] = useState<TestRole | null>(null);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [showTester, setShowTester] = useState(false);

  const handleRoleSelect = (role: TestRole) => {
    setSelectedRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  const handleRunTest = () => {
    if (!selectedRole) return;

    const report = generateTestReport(selectedRole, widgets);
    setTestReports(prev => [...prev, report]);
    logTestResults([report]);
  };

  const handleRunAllTests = () => {
    const reports = testRoles.map(role => generateTestReport(role, widgets));
    setTestReports(reports);
    logTestResults(reports);
  };

  const handleExportResults = () => {
    const json = exportTestResults(testReports);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-role-tests-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearResults = () => {
    setTestReports([]);
  };

  if (!showTester) {
    return (
      <button
        onClick={() => setShowTester(true)}
        className="fixed bottom-4 left-4 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="Open Role Tester"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-white font-semibold">Role Tester</h3>
        </div>
        <button
          onClick={() => setShowTester(false)}
          className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Test Role
          </label>
          <select
            value={selectedRole?.id || ''}
            onChange={(e) => {
              const role = testRoles.find(r => r.id === e.target.value);
              if (role) handleRoleSelect(role);
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Choose a role...</option>
            {testRoles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.role})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Role Info */}
        {selectedRole && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 space-y-2">
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Role</p>
              <p className="text-sm text-gray-900 dark:text-white">{selectedRole.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Description</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{selectedRole.description}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Capabilities</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{selectedRole.capabilities.length} capabilities</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleRunTest}
            disabled={!selectedRole}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Run Test
          </button>
          <button
            onClick={handleRunAllTests}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Test All
          </button>
        </div>

        {/* Test Results */}
        {testReports.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Test Results ({testReports.length})
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={handleExportResults}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={handleClearResults}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testReports.map((report, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {report.role.name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(report.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                    <div>Template: {report.dashboardTemplate}</div>
                    <div>Widgets: {report.totalWidgets}</div>
                    <div className="text-green-600 dark:text-green-400">
                      Visible: {report.visibleWidgets}
                    </div>
                    <div className="text-red-600 dark:text-red-400">
                      Hidden: {report.hiddenWidgets}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

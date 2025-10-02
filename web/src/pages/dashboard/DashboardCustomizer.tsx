import React, { useState } from 'react';
import { DashboardShell } from '../../components/dashboard/shells';
import { PageLayout } from '../../components/dashboard/layouts';
import { useDashboard } from '../../hooks/useDashboard';
import { useCapabilities } from '../../hooks/useCapabilities';
import { dashboardTemplates } from '../../config/dashboards';
import { toast } from 'react-toastify';

/**
 * DashboardCustomizer - Dashboard customization interface
 * 
 * Features:
 * - Template selection
 * - Widget management
 * - Layout customization
 * - Preview mode
 * - Save/reset functionality
 */

export default function DashboardCustomizer() {
  const { dashboard, preferences, updatePreferences, resetToDefault } = useDashboard();
  const { capabilities } = useCapabilities();
  
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const availableTemplates = dashboardTemplates.filter(template => {
    if (!template.requiredCapabilities) return true;
    return template.requiredCapabilities.every(cap => capabilities.includes(cap));
  });

  const handleSelectTemplate = async (templateId: string) => {
    try {
      setSaving(true);
      setSelectedTemplate(templateId);
      
      await updatePreferences({
        dashboardId: templateId,
        updatedAt: new Date().toISOString()
      });

      toast.success('Dashboard template applied successfully');
    } catch (error) {
      toast.error('Failed to apply template');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset to the default dashboard?')) {
      return;
    }

    try {
      setSaving(true);
      await resetToDefault();
      setSelectedTemplate(null);
      toast.success('Dashboard reset to default');
    } catch (error) {
      toast.error('Failed to reset dashboard');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell>
      <PageLayout
        title="Customize Dashboard"
        subtitle="Choose a template or customize your dashboard layout"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Customize' }
        ]}
      >
        <div className="space-y-8">
          {/* Current Dashboard Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Current Dashboard
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Name:</span> {dashboard?.name || 'Default'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Widgets:</span> {dashboard?.widgets.length || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Layout:</span> {dashboard?.layout || 'grid'}
              </p>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Dashboard Templates
              </h3>
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                Reset to Default
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => handleSelectTemplate(template.id)}
                >
                  {/* Template Preview */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg mb-4 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>

                  {/* Template Info */}
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>

                  {/* Template Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{template.config.widgets.length} widgets</span>
                    <span className={`px-2 py-1 rounded-full ${
                      template.category === 'executive' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                      template.category === 'finance' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      template.category === 'operations' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {template.category}
                    </span>
                  </div>

                  {/* Selected Indicator */}
                  {selectedTemplate === template.id && (
                    <div className="mt-4 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Widget Management (Future Enhancement) */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Widget Management
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Advanced widget customization coming soon. You'll be able to:
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Add or remove individual widgets
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Drag and drop to rearrange layout
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Resize widgets to fit your needs
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Configure widget-specific settings
              </li>
            </ul>
          </div>

          {/* Save Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'View Dashboard'}
            </button>
          </div>
        </div>
      </PageLayout>
    </DashboardShell>
  );
}

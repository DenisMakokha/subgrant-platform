import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleDefinition, DashboardDefinition, FeatureFlag } from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import CapabilitySelector from '../../components/admin/CapabilitySelector';
import MenuBuilder from '../../components/admin/MenuBuilder';
import ScopeSelector from '../../components/admin/ScopeSelector';
import { toast } from 'react-toastify';

const AdminWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [roleDef, setRoleDef] = useState<Partial<RoleDefinition>>({
    id: '',
    label: '',
    description: '',
    capabilities: [],
    scopes: {},
    visibility_rules: [],
    version: 1,
    active: true,
  });
  const [dashboardDef, setDashboardDef] = useState<Partial<DashboardDefinition>>({
    role_id: '',
    version: 1,
    menus_json: [],
    pages_json: [],
    active: true,
  });
  const [availableCapabilities, setAvailableCapabilities] = useState<any[]>([]);
  const [availableScopes, setAvailableScopes] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const [capabilities, scopes] = await Promise.all([
        adminApi.roles.getCapabilitiesCatalog(),
        adminApi.roles.getScopesCatalog()
      ]);
      setAvailableCapabilities(capabilities);
      setAvailableScopes(scopes);
    } catch (error) {
      console.error('Error fetching catalogs:', error);
      toast.error('Failed to load capabilities and scopes catalog');
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    if (!roleDef.id || !roleDef.label) {
      toast.error('Please fill in Role ID and Role Label');
      return;
    }

    if (!roleDef.capabilities || roleDef.capabilities.length === 0) {
      toast.error('Please select at least one capability');
      return;
    }

    if (!roleDef.scopes || Object.keys(roleDef.scopes).length === 0) {
      toast.error('Please configure access scopes');
      return;
    }

    setLoading(true);
    try {
      await adminApi.roles.createOrUpdateRole(roleDef as RoleDefinition);
      toast.success('Role created successfully! Now configure the dashboard.');
      setDashboardDef(prev => ({ ...prev, role_id: roleDef.id }));
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardDef.role_id) {
      toast.error('Please select a role for this dashboard');
      return;
    }

    setLoading(true);
    try {
      await adminApi.roles.createOrUpdateDashboard(dashboardDef as DashboardDefinition);
      toast.success('Dashboard created successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Failed to create dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleCapability = (capabilityKey: string) => {
    setRoleDef(prev => ({
      ...prev,
      capabilities: prev.capabilities?.includes(capabilityKey)
        ? prev.capabilities.filter(cap => cap !== capabilityKey)
        : [...(prev.capabilities || []), capabilityKey]
    }));
  };

  const steps = [
    { id: 1, title: 'Role Definition', description: 'Define role capabilities and permissions' },
    { id: 2, title: 'Dashboard Configuration', description: 'Configure dashboard layout and menus' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Role & Dashboard Wizard
            </h1>
            <p className="text-blue-100">
              Create custom roles and configure dashboards for your team
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center space-x-3 ${
                step.id <= currentStep ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
              }`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                  step.id < currentStep
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                    : step.id === currentStep
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {step.id < currentStep ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.id}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{step.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 rounded-full ${
                  step.id < currentStep 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-8">
        {currentStep === 1 && (
          <div className="role-definition-step">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Define Role & Permissions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set up role details and assign capabilities
                </p>
              </div>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-6">
              {/* Validation Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Required Fields</h4>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li className="flex items-center space-x-2">
                        {roleDef.id && roleDef.label ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>Role ID and Label</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        {roleDef.capabilities && roleDef.capabilities.length > 0 ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>At least one capability ({roleDef.capabilities?.length || 0} selected)</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        {roleDef.scopes && Object.keys(roleDef.scopes).length > 0 ? (
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>Access scopes configured ({Object.keys(roleDef.scopes || {}).length} of 4)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleDef.id}
                    onChange={(e) => setRoleDef(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., project_manager"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleDef.label}
                    onChange={(e) => setRoleDef(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Project Manager"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={roleDef.description}
                  onChange={(e) => setRoleDef(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe the role's purpose and responsibilities..."
                />
              </div>

              {/* Capabilities Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-base font-semibold text-gray-900 dark:text-white">
                      Step 1: Select Capabilities <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Choose what actions this role can perform in the system
                    </p>
                  </div>
                  {roleDef.capabilities && roleDef.capabilities.length > 0 && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                      {roleDef.capabilities.length} selected
                    </span>
                  )}
                </div>
                <CapabilitySelector
                  capabilities={availableCapabilities}
                  selectedCapabilities={roleDef.capabilities || []}
                  onSelectionChange={(capabilities) => setRoleDef(prev => ({ ...prev, capabilities }))}
                />
              </div>

              {/* Access Scopes Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-base font-semibold text-gray-900 dark:text-white">
                      Step 2: Configure Access Scopes <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Define the boundaries of what data this role can access
                    </p>
                  </div>
                  {roleDef.scopes && Object.keys(roleDef.scopes).length > 0 && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full">
                      {Object.keys(roleDef.scopes).length} of 4 configured
                    </span>
                  )}
                </div>
                <ScopeSelector
                  selectedScopes={roleDef.scopes || {}}
                  onScopeChange={(scopes) => setRoleDef(prev => ({ ...prev, scopes }))}
                />
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Next: Configure Dashboard</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {currentStep === 2 && (
          <div className="dashboard-definition-step">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configure Dashboard
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Build custom dashboard layout and menu structure
                </p>
              </div>
            </div>

            <form onSubmit={handleDashboardSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    value={dashboardDef.role_id}
                    onChange={(e) => setDashboardDef(prev => ({ ...prev, role_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value={roleDef.id}>{roleDef.label} ({roleDef.id})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version
                  </label>
                  <input
                    type="number"
                    value={dashboardDef.version}
                    onChange={(e) => setDashboardDef(prev => ({ ...prev, version: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Dashboard Menu Builder
                </label>
                <MenuBuilder
                  selectedMenus={dashboardDef.menus_json || []}
                  onMenuChange={(menus) => setDashboardDef(prev => ({ ...prev, menus_json: menus }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pages Configuration (JSON)
                </label>
                <textarea
                  value={JSON.stringify(dashboardDef.pages_json, null, 2)}
                  onChange={(e) => {
                    try {
                      const pages = JSON.parse(e.target.value);
                      setDashboardDef(prev => ({ ...prev, pages_json: pages }));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="[]"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Advanced users can customize page layouts here
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="dashboardActive"
                  checked={dashboardDef.active}
                  onChange={(e) => setDashboardDef(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="dashboardActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Active Dashboard
                </label>
              </div>

              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Role</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Create Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminWizard;

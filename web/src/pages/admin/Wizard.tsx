import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoleDefinition, DashboardDefinition, FeatureFlag } from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import CapabilitySelector from '../../components/admin/CapabilitySelector';
import MenuBuilder from '../../components/admin/MenuBuilder';
import ScopeSelector from '../../components/admin/ScopeSelector';
import WidgetSelector from '../../components/admin/WidgetSelector';
import DashboardPreview from '../../components/admin/DashboardPreview';
import PageTemplateBuilder from '../../components/admin/PageTemplateBuilder';
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
  const [availableWidgets, setAvailableWidgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [roleIdValidation, setRoleIdValidation] = useState<{ checking: boolean; available: boolean; message: string }>({
    checking: false,
    available: true,
    message: ''
  });

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const [capabilities, scopes, widgets] = await Promise.all([
        adminApi.roles.getCapabilitiesCatalog(),
        adminApi.roles.getScopesCatalog(),
        fetch('/api/dashboard/widgets', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()).then(data => data.data || [])
      ]);
      setAvailableCapabilities(capabilities);
      setAvailableScopes(scopes);
      setAvailableWidgets(widgets);
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

  const handleDashboardSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Comprehensive validation
    if (!dashboardDef.role_id) {
      toast.error('Please select a role for this dashboard');
      return;
    }

    if (!dashboardDef.menus_json || dashboardDef.menus_json.length === 0) {
      toast.warning('No menu items selected. Dashboard will have minimal navigation.');
    }

    if (!dashboardDef.pages_json || dashboardDef.pages_json.length === 0) {
      toast.warning('No pages configured. Dashboard will have basic pages only.');
    }

    if (!dashboardDef.widgets || dashboardDef.widgets.length === 0) {
      toast.error('Please select at least one widget');
      return;
    }

    setLoading(true);
    try {
      // Use complete wizard endpoint for atomic operation
      const response = await fetch('/api/admin/wizard/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: roleDef,
          dashboard: {
            role_id: roleDef.id,
            menus_json: dashboardDef.menus_json,
            pages_json: dashboardDef.pages_json,
            widgets: dashboardDef.widgets,
            active: true
          },
          saveAsTemplate,
          templateName: saveAsTemplate ? templateName : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create role and dashboard');
      }

      const result = await response.json();
      
      if (result.success) {
        if (saveAsTemplate && templateName) {
          toast.success('🎉 Role, dashboard, and template created successfully!');
        } else {
          toast.success('🎉 Role and dashboard created successfully!');
        }
        
        // Navigate to role management after short delay
        setTimeout(() => {
          navigate('/admin/roles');
        }, 2000);
      }
    } catch (error) {
      console.error('Error completing wizard:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create role and dashboard');
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

  // Real-time role ID validation
  const validateRoleId = async (roleId: string) => {
    if (!roleId || roleId.length < 3) {
      setRoleIdValidation({ checking: false, available: false, message: 'Role ID must be at least 3 characters' });
      return;
    }

    // Check format
    if (!/^[a-z][a-z0-9_]*$/.test(roleId)) {
      setRoleIdValidation({ checking: false, available: false, message: 'Role ID must start with a letter and contain only lowercase letters, numbers, and underscores' });
      return;
    }

    setRoleIdValidation({ checking: true, available: false, message: 'Checking availability...' });

    try {
      const response = await fetch(`/api/admin/wizard/validate-role-id/${roleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const result = await response.json();

      if (result.success && result.data.available) {
        setRoleIdValidation({ checking: false, available: true, message: '✓ Role ID is available' });
      } else {
        setRoleIdValidation({ checking: false, available: false, message: '✗ Role ID already exists' });
      }
    } catch (error) {
      console.error('Error validating role ID:', error);
      setRoleIdValidation({ checking: false, available: false, message: 'Unable to validate' });
    }
  };

  // Debounced role ID validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (roleDef.id) {
        validateRoleId(roleDef.id);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [roleDef.id]);

  const steps = [
    { id: 1, title: 'Role Definition', description: 'Define role capabilities and permissions' },
    { id: 2, title: 'Menu & Pages', description: 'Configure menu structure and page templates' },
    { id: 3, title: 'Dashboard Widgets', description: 'Select and arrange dashboard widgets' },
    { id: 4, title: 'Preview & Publish', description: 'Review and publish your dashboard' },
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
                  <div className="relative">
                    <input
                      type="text"
                      value={roleDef.id}
                      onChange={(e) => setRoleDef(prev => ({ ...prev, id: e.target.value.toLowerCase() }))}
                      className={`w-full px-3 py-2 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 ${
                        roleDef.id && !roleIdValidation.checking
                          ? roleIdValidation.available
                            ? 'border-green-500 dark:border-green-600'
                            : 'border-red-500 dark:border-red-600'
                          : 'border-gray-300 dark:border-gray-600 focus:border-indigo-500'
                      }`}
                      placeholder="e.g., project_manager"
                      required
                    />
                    {roleIdValidation.checking && (
                      <div className="absolute right-3 top-3">
                        <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  {roleDef.id && roleIdValidation.message && (
                    <p className={`text-xs mt-1 ${
                      roleIdValidation.available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {roleIdValidation.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Lowercase letters, numbers, and underscores only
                  </p>
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
                      <span>Next: Menu & Pages</span>
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
          <div className="menu-pages-step">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configure Menu & Pages
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Build menu structure and configure page templates
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Menu Builder */}
              <MenuBuilder
                selectedMenus={dashboardDef.menus_json || []}
                onMenuChange={(menus) => setDashboardDef(prev => ({ ...prev, menus_json: menus }))}
                roleType={roleDef.id?.includes('admin') ? 'admin' : roleDef.id?.includes('partner') ? 'partner' : roleDef.id?.includes('finance') ? 'finance' : roleDef.id?.includes('grants') ? 'grants' : 'all'}
              />

              {/* Page Template Builder */}
              <PageTemplateBuilder
                selectedPages={dashboardDef.pages_json || []}
                onPagesChange={(pages) => setDashboardDef(prev => ({ ...prev, pages_json: pages }))}
                availableCapabilities={roleDef.capabilities || []}
              />

              {/* Navigation Buttons */}
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
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span>Next: Select Widgets</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="widget-selection-step">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Dashboard Widgets
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose widgets that will appear on the dashboard
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Widget Selector */}
              <WidgetSelector
                availableWidgets={availableWidgets}
                selectedCapabilities={roleDef.capabilities || []}
                selectedWidgets={dashboardDef.widgets || []}
                onWidgetChange={(widgets) => setDashboardDef(prev => ({ ...prev, widgets }))}
              />

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Menu & Pages</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!dashboardDef.widgets || dashboardDef.widgets.length === 0) {
                      toast.warning('Please select at least one widget');
                      return;
                    }
                    setDashboardDef(prev => ({ ...prev, role_id: roleDef.id }));
                    setCurrentStep(4);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <span>Next: Preview & Publish</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="preview-publish-step">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Preview & Publish Dashboard
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Review your dashboard and publish when ready
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Dashboard Preview */}
              <DashboardPreview
                widgets={dashboardDef.widgets || []}
                availableWidgets={availableWidgets}
                columns={3}
                roleName={roleDef.label}
              />

              {/* Save as Template Option */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    id="saveAsTemplate"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    className="mt-1 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="saveAsTemplate" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                      Save as Template
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Save this dashboard configuration as a reusable template for future roles
                    </p>
                    {saveAsTemplate && (
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Enter template name..."
                        className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Publish Options */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                      Ready to Publish?
                    </h4>
                    <ul className="space-y-1 text-xs text-green-700 dark:text-green-300">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Role: {roleDef.label} ({roleDef.capabilities?.length} capabilities)
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Dashboard: {dashboardDef.widgets?.length} widgets configured
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {saveAsTemplate ? `Template: ${templateName || 'Unnamed'}` : 'No template'}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Widgets</span>
                </button>
                <button
                  type="button"
                  onClick={handleDashboardSubmit}
                  disabled={loading}
                  className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Publish Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminWizard;

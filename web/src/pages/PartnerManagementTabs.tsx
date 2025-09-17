import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/organizationService';
import { Organization, OrganizationFormData } from '../types/organization';
import {
  PlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  XCircleIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const PartnerManagementTabs: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Determine active tab based on URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/onboarding')) return 'onboarding';
    if (path.includes('/due-diligence')) return 'due-diligence';
    if (path.includes('/compliance')) return 'compliance';
    return 'partners';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  // Fetch organizations
  useEffect(() => {
    fetchOrganizations();
  }, []);

  // Filter organizations based on search term and status filters
  useEffect(() => {
    let filtered = organizations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

    // Apply compliance filter
    if (complianceFilter !== 'all') {
      filtered = filtered.filter(org => org.compliance_status === complianceFilter);
    }

    setFilteredOrganizations(filtered);
  }, [organizations, searchTerm, statusFilter, complianceFilter]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getOrganizations();
      setOrganizations(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch organizations');
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Update URL based on tab
    switch (tabId) {
      case 'onboarding':
        navigate('/partner-management/onboarding');
        break;
      case 'due-diligence':
        navigate('/partner-management/due-diligence');
        break;
      case 'compliance':
        navigate('/partner-management/compliance');
        break;
      default:
        navigate('/partner-management');
    }
  };

  const handleViewOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setActiveTab('view-organization');
  };

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setActiveTab('edit-organization');
  };

  const handleSaveOrganization = async (organizationData: OrganizationFormData) => {
    if (!selectedOrganization) return;
    
    try {
      await organizationService.updateOrganization(selectedOrganization.id, organizationData);
      setSuccess('Organization updated successfully');
      setSelectedOrganization(null);
      setActiveTab('partners');
      await fetchOrganizations();
    } catch (error) {
      setError('Failed to update organization');
    }
  };

  const handleApproveOrganization = async (org: Organization) => {
    try {
      await organizationService.updateOrganization(org.id, { status: 'approved' });
      setSuccess(`${org.name} has been approved successfully`);
      await fetchOrganizations();
    } catch (error) {
      setError('Failed to approve organization');
      console.error('Error approving organization:', error);
    }
  };

  const handleRejectOrganization = async (org: Organization) => {
    if (window.confirm(`Are you sure you want to reject ${org.name}? This will prevent them from accessing the platform.`)) {
      try {
        await organizationService.updateOrganization(org.id, { status: 'rejected' });
        setSuccess(`${org.name} has been rejected`);
        await fetchOrganizations();
      } catch (error) {
        setError('Failed to reject organization');
        console.error('Error rejecting organization:', error);
      }
    }
  };

  const handleDeleteOrganization = async (org: Organization) => {
    if (window.confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone.`)) {
      try {
        await organizationService.deleteOrganization(org.id);
        setSuccess('Organization deleted successfully');
        await fetchOrganizations();
      } catch (error) {
        setError('Failed to delete organization');
        console.error('Error deleting organization:', error);
      }
    }
  };


  const handleBulkApprove = async () => {
    try {
      await Promise.all(
        selectedOrganizations.map(orgId => 
          organizationService.updateOrganization(orgId, { status: 'approved' })
        )
      );
      setSuccess(`${selectedOrganizations.length} organizations approved successfully`);
      await fetchOrganizations();
      setSelectedOrganizations([]);
      setShowBulkActions(false);
    } catch (error) {
      setError('Failed to approve organizations');
      console.error('Error approving organizations:', error);
    }
  };

  const handleBulkReject = async () => {
    if (window.confirm(`Are you sure you want to reject ${selectedOrganizations.length} organizations? This will prevent them from accessing the platform.`)) {
      try {
        await Promise.all(
          selectedOrganizations.map(orgId => 
            organizationService.updateOrganization(orgId, { status: 'rejected' })
          )
        );
        setSuccess(`${selectedOrganizations.length} organizations rejected`);
        await fetchOrganizations();
        setSelectedOrganizations([]);
        setShowBulkActions(false);
      } catch (error) {
        setError('Failed to reject organizations');
        console.error('Error rejecting organizations:', error);
      }
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'approve':
        handleBulkApprove();
        break;
      case 'reject':
        handleBulkReject();
        break;
      case 'suspend':
        // Handle suspend action
        console.log('Suspend action for:', selectedOrganizations);
        setSelectedOrganizations([]);
        setShowBulkActions(false);
        break;
      case 'export':
        exportData();
        setSelectedOrganizations([]);
        setShowBulkActions(false);
        break;
      default:
        setSelectedOrganizations([]);
        setShowBulkActions(false);
    }
  };

  const handleSelectOrganization = (orgId: string) => {
    setSelectedOrganizations(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrganizations.length === filteredOrganizations.length) {
      setSelectedOrganizations([]);
    } else {
      setSelectedOrganizations(filteredOrganizations.map(org => org.id));
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Name', 'Legal Name', 'Email', 'Country', 'Status', 'Compliance', 'Created'],
      ...filteredOrganizations.map(org => [
        org.name,
        org.legal_name || '',
        org.email,
        org.country || '',
        org.status,
        org.compliance_status,
        new Date(org.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organizations.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: CheckCircleIcon },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', icon: ClockIcon },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: ExclamationTriangleIcon },
      suspended: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-200', icon: ExclamationTriangleIcon }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  const formatFieldValue = (value: string | null | undefined, fallback: string = 'Not provided') => {
    if (!value || value.trim() === '') {
      return (
        <span className="text-gray-400 dark:text-gray-500 italic text-sm">
          {fallback}
        </span>
      );
    }
    return value;
  };

  const tabs = [
    { id: 'partners', name: 'Partner Directory', icon: UserGroupIcon },
    { id: 'onboarding', name: 'Pending Approvals', icon: ClockIcon },
    { id: 'due-diligence', name: 'Due Diligence', icon: DocumentCheckIcon },
    { id: 'compliance', name: 'Compliance', icon: ShieldCheckIcon },
  ];

  // Partner Directory Tab Content
  const renderPartnerProfiles = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Directory</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage approved partner organizations</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedOrganizations.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBulkActions(!showBulkActions)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <EllipsisHorizontalIcon className="w-5 h-5" />
                Actions ({selectedOrganizations.length})
              </button>
              {showBulkActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="w-full text-left px-4 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    Approve Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Reject Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('suspend')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Suspend Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('export')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export Selected
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Export
          </button>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Partners register through self-service portal
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Compliance</option>
              <option value="approved">Compliant</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="rejected">Non-Compliant</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganizations.map((org) => (
                <div key={org.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{org.legal_name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{org.country}</p>
                    </div>
                    <div className="flex items-center">
                      {org.status === 'approved' && (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      )}
                      {org.status === 'pending' && (
                        <ClockIcon className="w-5 h-5 text-yellow-500" />
                      )}
                      {(org.status === 'suspended' || org.status === 'rejected') && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`font-medium ${
                        org.status === 'approved' ? 'text-green-600' :
                        org.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Compliance:</span>
                      <span className={`font-medium ${
                        org.compliance_status === 'approved' ? 'text-green-600' :
                        org.compliance_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {org.compliance_status?.charAt(0).toUpperCase() + org.compliance_status?.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedOrganizations.length === filteredOrganizations.length && filteredOrganizations.length > 0}
                            onChange={handleSelectAll}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          Organization
                        </div>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
                        Country
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/8">
                        Compliance
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrganizations.map((org) => (
                      <tr key={org.id}>
                        <td className="px-3 py-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedOrganizations.includes(org.id)}
                              onChange={() => handleSelectOrganization(org.id)}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{org.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{formatFieldValue(org.legal_name, 'No legal name')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                          <div className="truncate max-w-[200px]" title={org.email}>{org.email}</div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                          <div className="truncate">{formatFieldValue(org.country, 'N/A')}</div>
                        </td>
                        <td className="px-3 py-2">
                          {getStatusBadge(org.status)}
                        </td>
                        <td className="px-3 py-2">
                          {getStatusBadge(org.compliance_status)}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => handleViewOrganization(org)}
                              className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="View organization details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrganization(org);
                                setShowViewModal(true);
                              }}
                              className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                              title="View organization details"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteOrganization(org)}
                              className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Delete organization"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );


  const renderTabContent = () => {
    switch (activeTab) {
      case 'partners':
        return renderPartnerProfiles();
      case 'onboarding':
        return renderPartnerOnboarding();
      case 'due-diligence':
        return renderDueDiligence();
      case 'compliance':
        return renderCompliance();
      case 'view-organization':
        return selectedOrganization ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organization Details</h2>
              <button
                onClick={() => {
                  setSelectedOrganization(null);
                  setActiveTab('partners');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <OrganizationView organization={selectedOrganization} />
          </div>
        ) : null;
      case 'edit-organization':
        return selectedOrganization ? (
          <OrganizationForm
            organization={selectedOrganization}
            onSave={handleSaveOrganization}
            onCancel={() => {
              setSelectedOrganization(null);
              setActiveTab('partners');
            }}
          />
        ) : null;
      default:
        return renderPartnerProfiles();
    }
  };

  // Due Diligence Tab Content
  const renderDueDiligence = () => {
    const dueDiligenceStats = {
      completed: organizations.filter(org => org.due_diligence_completed).length,
      inProgress: organizations.filter(org => !org.due_diligence_completed && org.status !== 'rejected').length,
      issues: organizations.filter(org => org.status === 'rejected' || org.compliance_status === 'rejected').length,
      total: organizations.length
    };

    const dueDiligenceChecks = [
      { 
        id: 'legal_registration', 
        name: 'Legal Registration Verification', 
        description: 'Verify legal entity status and registration documents',
        completed: organizations.filter(org => org.registration_number).length,
        total: organizations.length,
        priority: 'high'
      },
      { 
        id: 'financial_background', 
        name: 'Financial Background Check', 
        description: 'Review financial statements and credit history',
        completed: organizations.filter(org => org.tax_id).length,
        total: organizations.length,
        priority: 'high'
      },
      { 
        id: 'reference_verification', 
        name: 'Reference Verification', 
        description: 'Contact and verify provided references',
        completed: Math.floor(organizations.length * 0.6),
        total: organizations.length,
        priority: 'medium'
      },
      { 
        id: 'compliance_history', 
        name: 'Compliance History Review', 
        description: 'Review past compliance records and violations',
        completed: organizations.filter(org => org.compliance_status === 'approved').length,
        total: organizations.length,
        priority: 'high'
      },
      { 
        id: 'leadership_background', 
        name: 'Leadership Background Check', 
        description: 'Verify key personnel and leadership credentials',
        completed: Math.floor(organizations.length * 0.4),
        total: organizations.length,
        priority: 'medium'
      }
    ];

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Due Diligence</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage partner due diligence processes</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export Report
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <DocumentCheckIcon className="w-5 h-5" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Due Diligence Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{dueDiligenceStats.completed}</span>
            </div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Completed</h3>
            <p className="text-sm text-green-700 dark:text-green-300">Due diligence verified</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{dueDiligenceStats.inProgress}</span>
            </div>
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">In Progress</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Under review</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-6 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{dueDiligenceStats.issues}</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Issues Found</h3>
            <p className="text-sm text-red-700 dark:text-red-300">Requires attention</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dueDiligenceStats.total}</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Total Partners</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">All organizations</p>
          </div>
        </div>

        {/* Due Diligence Checklist */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Due Diligence Checklist</h3>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium">
              Customize Checklist
            </button>
          </div>
          <div className="space-y-6">
            {dueDiligenceChecks.map((check) => {
              const completionRate = check.total > 0 ? (check.completed / check.total) * 100 : 0;
              const priorityColors = {
                high: 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20',
                medium: 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
                low: 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
              };

              return (
                <div key={check.id} className={`p-6 border rounded-xl ${priorityColors[check.priority as keyof typeof priorityColors]}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{check.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          check.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          check.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {check.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{check.description}</p>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {check.completed} of {check.total} ({Math.round(completionRate)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                completionRate === 100 ? 'bg-green-500' : 
                                completionRate >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        View Details
                      </button>
                      <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Organizations Due Diligence Status */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Organizations by Due Diligence Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Diligence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {organizations.map((org) => {
                  const riskLevel = org.status === 'rejected' ? 'high' : 
                                   !org.due_diligence_completed ? 'medium' : 'low';
                  const riskColors = {
                    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  };

                  return (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <BuildingOfficeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{org.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          org.due_diligence_completed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            org.due_diligence_completed ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          {org.due_diligence_completed ? 'Completed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(org.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${riskColors[riskLevel]}`}>
                          {riskLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewOrganization(org)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleEditOrganization(org)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Compliance Tab Content
  const renderCompliance = () => {
    const complianceStats = {
      compliant: organizations.filter(org => org.compliance_status === 'approved').length,
      pending: organizations.filter(org => org.compliance_status === 'pending').length,
      underReview: organizations.filter(org => org.compliance_status === 'in_review').length,
      nonCompliant: organizations.filter(org => org.compliance_status === 'rejected').length,
      total: organizations.length
    };

    const complianceRequirements = [
      {
        id: 'financial_reporting',
        name: 'Financial Reporting',
        description: 'Regular financial statements and audit reports',
        compliant: organizations.filter(org => org.compliance_status === 'approved').length,
        total: organizations.length,
        category: 'Financial',
        priority: 'high'
      },
      {
        id: 'governance_structure',
        name: 'Governance Structure',
        description: 'Board composition and governance policies',
        compliant: Math.floor(organizations.length * 0.8),
        total: organizations.length,
        category: 'Governance',
        priority: 'high'
      },
      {
        id: 'regulatory_compliance',
        name: 'Regulatory Compliance',
        description: 'Compliance with local and international regulations',
        compliant: Math.floor(organizations.length * 0.7),
        total: organizations.length,
        category: 'Legal',
        priority: 'high'
      },
      {
        id: 'risk_management',
        name: 'Risk Management',
        description: 'Risk assessment and mitigation frameworks',
        compliant: Math.floor(organizations.length * 0.6),
        total: organizations.length,
        category: 'Risk',
        priority: 'medium'
      },
      {
        id: 'data_protection',
        name: 'Data Protection',
        description: 'GDPR and data privacy compliance',
        compliant: Math.floor(organizations.length * 0.9),
        total: organizations.length,
        category: 'Security',
        priority: 'high'
      }
    ];

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Partner Compliance</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor compliance status and requirements</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export Report
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <DocumentCheckIcon className="w-5 h-5" />
              Compliance Audit
            </button>
          </div>
        </div>

        {/* Compliance Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{complianceStats.compliant}</span>
            </div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Compliant</h3>
            <p className="text-sm text-green-700 dark:text-green-300">Fully compliant partners</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{complianceStats.pending}</span>
            </div>
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Pending Review</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Awaiting compliance review</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <DocumentCheckIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{complianceStats.underReview}</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Under Review</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">Currently being reviewed</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-6 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{complianceStats.nonCompliant}</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Non-Compliant</h3>
            <p className="text-sm text-red-700 dark:text-red-300">Requires immediate action</p>
          </div>
        </div>

        {/* Compliance Requirements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Compliance Requirements</h3>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium">
              Manage Requirements
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {complianceRequirements.map((requirement) => {
              const complianceRate = requirement.total > 0 ? (requirement.compliant / requirement.total) * 100 : 0;
              const categoryColors = {
                Financial: 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20',
                Governance: 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
                Legal: 'border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20',
                Risk: 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20',
                Security: 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
              };

              return (
                <div key={requirement.id} className={`p-6 border rounded-xl ${categoryColors[requirement.category as keyof typeof categoryColors]}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{requirement.name}</h4>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {requirement.category}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          requirement.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {requirement.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{requirement.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Rate</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {requirement.compliant} of {requirement.total} ({Math.round(complianceRate)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              complianceRate >= 90 ? 'bg-green-500' : 
                              complianceRate >= 70 ? 'bg-blue-500' : 
                              complianceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${complianceRate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance Status by Organization */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Organization Compliance Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Compliance Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Review</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Next Review</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {organizations.map((org) => {
                  const nextReviewDate = new Date();
                  nextReviewDate.setMonth(nextReviewDate.getMonth() + 6);

                  return (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <BuildingOfficeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{org.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          org.compliance_status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          org.compliance_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          org.compliance_status === 'in_review' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            org.compliance_status === 'approved' ? 'bg-green-500' :
                            org.compliance_status === 'pending' ? 'bg-yellow-500' :
                            org.compliance_status === 'in_review' ? 'bg-blue-500' : 'bg-red-500'
                          }`}></div>
                          {org.compliance_status?.charAt(0).toUpperCase() + org.compliance_status?.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(org.updated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {nextReviewDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewOrganization(org)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleEditOrganization(org)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Partner Onboarding Tab Content
  const renderPartnerOnboarding = () => {
    const onboardingStats = {
      submitted: organizations.filter(org => org.status === 'pending').length,
      review: organizations.filter(org => org.compliance_status === 'in_review').length,
      approved: organizations.filter(org => org.status === 'approved').length,
      rejected: organizations.filter(org => org.status === 'rejected').length
    };

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Partner Onboarding</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage partner application pipeline and onboarding process</p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            Partners register through the public registration portal
          </div>
        </div>

        {/* Onboarding Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <DocumentCheckIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{onboardingStats.submitted}</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Applications Submitted</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">Awaiting initial review</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{onboardingStats.review}</span>
            </div>
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Under Review</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">Due diligence in progress</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{onboardingStats.approved}</span>
            </div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">Approved Partners</h3>
            <p className="text-sm text-green-700 dark:text-green-300">Ready for collaboration</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 rounded-xl p-6 border border-red-200 dark:border-red-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">{onboardingStats.rejected}</span>
            </div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Rejected</h3>
            <p className="text-sm text-red-700 dark:text-red-300">Did not meet criteria</p>
          </div>
        </div>

        {/* Onboarding Process Flow */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Onboarding Process</h3>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {[
              { step: 1, title: 'Application', desc: 'Submit initial application', icon: DocumentCheckIcon, color: 'blue' },
              { step: 2, title: 'Review', desc: 'Initial document review', icon: ClockIcon, color: 'yellow' },
              { step: 3, title: 'Due Diligence', desc: 'Background verification', icon: ShieldCheckIcon, color: 'purple' },
              { step: 4, title: 'Compliance', desc: 'Compliance assessment', icon: CheckCircleIcon, color: 'green' },
              { step: 5, title: 'Approval', desc: 'Final approval & onboarding', icon: UserGroupIcon, color: 'emerald' }
            ].map((process, index) => {
              const IconComponent = process.icon;
              return (
                <div key={process.step} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 bg-${process.color}-500 rounded-full flex items-center justify-center mb-4 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{process.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{process.desc}</p>
                  </div>
                  {index < 4 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-300 dark:bg-gray-600 transform -translate-y-1/2"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organization</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {organizations.slice(0, 10).map((org) => {
                  const progress = org.status === 'approved' ? 100 : 
                                 org.status === 'rejected' ? 0 :
                                 org.compliance_status === 'approved' ? 80 :
                                 org.due_diligence_completed ? 60 : 
                                 org.status === 'pending' ? 20 : 40;
                  
                  return (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <BuildingOfficeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{org.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(org.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                            <div 
                              className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' : progress === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewOrganization(org)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleEditOrganization(org)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl mb-8">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Partner Management
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Manage partner organizations, onboarding, due diligence, and compliance
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-right">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-blue-100 font-medium">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-blue-200 mt-1">
                      {new Date().toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">{success}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}

        {/* View Organization Modal */}
        {showViewModal && selectedOrganization && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <BuildingOfficeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedOrganization.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Organization Profile
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setSelectedOrganization(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6">
                <OrganizationView organization={selectedOrganization} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Organization Form Component
const OrganizationForm: React.FC<{
  organization?: Organization | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}> = ({ organization, onSave, onCancel }) => {
  // East African Countries
  const eastAfricanCountries = [
    'Burundi', 'Comoros', 'Djibouti', 'Eritrea', 'Ethiopia', 'Kenya', 
    'Madagascar', 'Malawi', 'Mauritius', 'Mozambique', 'Rwanda', 
    'Seychelles', 'Somalia', 'South Sudan', 'Sudan', 'Tanzania', 'Uganda', 'Zambia', 'Zimbabwe'
  ];

  const [formData, setFormData] = useState({
    name: organization?.name || '',
    legal_name: organization?.legal_name || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    address: organization?.address || '',
    country: organization?.country || '',
    website: organization?.website || '',
    description: organization?.description || '',
    registration_number: organization?.registration_number || '',
    tax_id: organization?.tax_id || '',
    // Primary Contact Information
    primary_contact_name: organization?.primary_contact_name || '',
    primary_contact_title: organization?.primary_contact_title || '',
    primary_contact_phone: organization?.primary_contact_phone || '',
    primary_contact_email: organization?.primary_contact_email || '',
    // Enhanced Address Information
    city: organization?.city || '',
    state_province: organization?.state_province || '',
    postal_code: organization?.postal_code || '',
    // Banking Information
    bank_name: organization?.bank_name || '',
    bank_branch: organization?.bank_branch || '',
    account_name: organization?.account_name || '',
    account_number: organization?.account_number || '',
    swift_code: organization?.swift_code || '',
    // Authorized Signatory
    signatory_name: organization?.signatory_name || '',
    signatory_title: organization?.signatory_title || '',
    signatory_email: organization?.signatory_email || '',
    // Legal Structure
    legal_structure: organization?.legal_structure || '',
    incorporation_country: organization?.incorporation_country || '',
    incorporation_date: organization?.incorporation_date || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving organization:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors[name] = 'Organization name is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors[name] = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[name] = 'Please enter a valid email address';
        } else {
          delete newErrors[name];
        }
        break;
      case 'primary_contact_email':
        if (!value.trim()) {
          newErrors[name] = 'Primary contact email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors[name] = 'Please enter a valid email address';
        } else {
          delete newErrors[name];
        }
        break;
      case 'phone':
      case 'primary_contact_phone':
        if (value && !/^[+]?[0-9\s\-\(\)]{10,}$/.test(value)) {
          newErrors[name] = 'Please enter a valid phone number';
        } else {
          delete newErrors[name];
        }
        break;
      case 'website':
        if (value && !/^https?:\/\/.+/.test(value)) {
          newErrors[name] = 'Please enter a valid URL (starting with http:// or https://)';
        } else {
          delete newErrors[name];
        }
        break;
      case 'country':
        if (!value.trim()) {
          newErrors[name] = 'Operating country is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'address':
        if (!value.trim()) {
          newErrors[name] = 'Address is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'city':
        if (!value.trim()) {
          newErrors[name] = 'City is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'bank_name':
      case 'bank_branch':
      case 'account_name':
      case 'account_number':
        if (!value.trim()) {
          newErrors[name] = 'This banking field is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'signatory_name':
        if (!value.trim()) {
          newErrors[name] = 'Signatory name is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'signatory_title':
        if (!value.trim()) {
          newErrors[name] = 'Signatory title is required';
        } else {
          delete newErrors[name];
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Validate field on change
    validateField(name, value);
  };

  const validateForm = () => {
    const requiredFields = [
      'name', 'email', 'country', 'address', 'city',
      'primary_contact_name', 'primary_contact_title', 'primary_contact_email', 'primary_contact_phone',
      'bank_name', 'bank_branch', 'account_name', 'account_number',
      'signatory_name', 'signatory_title'
    ];
    
    const newErrors: Record<string, string> = {};
    
    requiredFields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (!value || !value.toString().trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Additional validations
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.primary_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) {
      newErrors.primary_contact_email = 'Please enter a valid email address';
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="space-y-6">
      {/* Simple Title and Description */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {organization ? 'Edit Partner' : 'Add Partner'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {organization ? 'Update partner organization information and details' : 'Add a new partner organization to the platform'}
        </p>
      </div>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-7 h-7 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2.5 rounded-lg border ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/10'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 transition-colors`}
                placeholder="Enter organization name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Legal Name
              </label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="Enter legal name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors font-mono"
                placeholder="REG123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tax ID
              </label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors font-mono"
                placeholder="TAX123456789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Legal Structure
              </label>
              <select
                name="legal_structure"
                value={formData.legal_structure}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
              >
                <option value="">Select legal structure</option>
                <option value="NGO">NGO</option>
                <option value="Foundation">Foundation</option>
                <option value="Company">Company</option>
                <option value="Trust">Trust</option>
                <option value="Association">Association</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Incorporation Country
              </label>
              <select
                name="incorporation_country"
                value={formData.incorporation_country}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
              >
                <option value="">Select incorporation country</option>
                {eastAfricanCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Operating Country *
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 rounded-lg border ${errors.country ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:ring-2 transition-colors`}
              >
                <option value="">Select operating country</option>
                {eastAfricanCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.country}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Incorporation Date
              </label>
              <input
                type="date"
                name="incorporation_date"
                value={formData.incorporation_date}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-7 h-7 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Address Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors resize-none"
                placeholder="Enter complete address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="City name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State/Province
              </label>
              <input
                type="text"
                name="state_province"
                value={formData.state_province}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="State or Province"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="Postal/ZIP code"
              />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-7 h-7 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                General Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2.5 rounded-lg border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 transition-colors`}
                placeholder="info@organization.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                General Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="https://www.organization.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Person Name *
              </label>
              <input
                type="text"
                name="primary_contact_name"
                value={formData.primary_contact_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="John Mary Vianney Mitana"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title/Position *
              </label>
              <input
                type="text"
                name="primary_contact_title"
                value={formData.primary_contact_title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="Executive Director"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Email *
              </label>
              <input
                type="email"
                name="primary_contact_email"
                value={formData.primary_contact_email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="contact@lgihe.org"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact Phone *
              </label>
              <input
                type="tel"
                name="primary_contact_phone"
                value={formData.primary_contact_phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="+256 xxx xxx xxx"
              />
            </div>
          </div>
        </div>

        {/* Authorized Signatory Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-7 h-7 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Authorized Signatory</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Person authorized to sign contracts</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signatory Name *
              </label>
              <input
                type="text"
                name="signatory_name"
                value={formData.signatory_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="John Mary Vianney Mitana"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signatory Title *
              </label>
              <input
                type="text"
                name="signatory_title"
                value={formData.signatory_title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="Executive Director"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Signatory Email (for DocuSign)
              </label>
              <input
                type="email"
                name="signatory_email"
                value={formData.signatory_email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
                placeholder="director@lgihe.org"
              />
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <DocumentCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Information</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none"
                placeholder="Describe the organization's mission, activities, and goals"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transform relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isSubmitting ? 'Saving...' : (organization ? 'Update Organization' : 'Create Organization')}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};

// Organization View Component
const OrganizationView: React.FC<{ organization: Organization }> = ({ organization }) => {
  return (
    <div className="space-y-8">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Organization Status</p>
              <p className="text-lg font-bold text-green-900 dark:text-green-100 capitalize">
                {organization.status}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Compliance Status</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100 capitalize">
                {organization.compliance_status}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <DocumentCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Due Diligence</p>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {organization.due_diligence_completed ? 'Completed' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[120px]">Organization</span>
              <span className="text-sm text-gray-900 dark:text-white text-right font-medium">{organization.name}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[120px]">Legal Name</span>
              <span className="text-sm text-gray-900 dark:text-white text-right">{organization.legal_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[120px]">Registration</span>
              <span className="text-sm text-gray-900 dark:text-white text-right font-mono">{organization.registration_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[120px]">Tax ID</span>
              <span className="text-sm text-gray-900 dark:text-white text-right font-mono">{organization.tax_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[120px]">Country</span>
              <span className="text-sm text-gray-900 dark:text-white text-right">{organization.country || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px]">Email</span>
              <a href={`mailto:${organization.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline text-right">
                {organization.email}
              </a>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px]">Phone</span>
              <a href={`tel:${organization.phone}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline text-right">
                {organization.phone || 'N/A'}
              </a>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px]">Website</span>
              {organization.website ? (
                <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline text-right break-all">
                  {organization.website}
                </a>
              ) : (
                <span className="text-sm text-gray-900 dark:text-white text-right">N/A</span>
              )}
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px]">Created</span>
              <span className="text-sm text-gray-900 dark:text-white text-right">
                {new Date(organization.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Address Section */}
      {organization.address && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address</h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{organization.address}</p>
          </div>
        </div>
      )}

      {/* Description Section */}
      {organization.description && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About Organization</h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{organization.description}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            // This will be handled by the parent component's context
            window.dispatchEvent(new CustomEvent('editOrganization', { detail: organization }));
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Edit Organization
        </button>
      </div>
    </div>
  );
};

export default PartnerManagementTabs;

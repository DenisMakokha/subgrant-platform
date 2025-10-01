import React, { useState, useEffect } from 'react';
import { Organization, User, TableColumn, FilterOption, BulkAction } from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import MetricsCard from '../../components/admin/MetricsCard';
import StatusIndicator from '../../components/admin/StatusIndicator';
import { toast } from 'react-toastify';

const OrganizationManagement: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrganizations, setSelectedOrganizations] = useState<Organization[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [viewingUsers, setViewingUsers] = useState<Organization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await adminApi.organizations.getOrganizations();
      // Handle both direct array and paginated response formats
      const orgsData = Array.isArray(response) ? response : response?.data || [];
      setOrganizations(orgsData);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to fetch organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationUsers = async (orgId: string) => {
    try {
      const orgUsers = await adminApi.organizations.getOrganizationUsers(orgId);
      setUsers(orgUsers);
    } catch (error) {
      console.error('Error fetching organization users:', error);
      toast.error('Failed to fetch organization users');
      setUsers([]);
    }
  };

  const handleCreateOrganization = async (orgData: Partial<Organization>) => {
    try {
      // For now, we'll simulate organization creation
      const newOrg: Organization = {
        id: `org-${Date.now()}`,
        name: orgData.name || '',
        legalName: orgData.legalName,
        status: orgData.status || 'active',
        type: orgData.type || 'ngo',
        createdAt: new Date(),
        updatedAt: new Date(),
        userCount: 0,
        projectCount: 0,
      };

      setOrganizations(prev => [...prev, newOrg]);
      toast.success('Organization created successfully');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    }
  };

  const handleUpdateOrganization = async (orgId: string, orgData: Partial<Organization>) => {
    try {
      await adminApi.organizations.updateOrganization(orgId, orgData);
      toast.success('Organization updated successfully');
      setEditingOrganization(null);
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization');
    }
  };

  const handleViewUsers = (organization: Organization) => {
    setViewingUsers(organization);
    fetchOrganizationUsers(organization.id);
  };

  const handleBulkStatusUpdate = async (selectedOrganizations: Organization[], newStatus: string) => {
    try {
      // Simulate bulk status update
      setOrganizations(prev => prev.map(org =>
        selectedOrganizations.find(selected => selected.id === org.id)
          ? { ...org, status: newStatus as Organization['status'], updatedAt: new Date() }
          : org
      ));
      toast.success(`Updated ${selectedOrganizations.length} organizations to ${newStatus}`);
      setSelectedOrganizations([]);
    } catch (error) {
      console.error('Error bulk updating organizations:', error);
      toast.error('Failed to update organizations');
    }
  };

  const handleExportOrganizations = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      // Simulate export
      const csvContent = [
        ['ID', 'Name', 'Legal Name', 'Type', 'Status', 'User Count', 'Project Count', 'Created At'].join(','),
        ...organizations.map(org => [
          org.id,
          org.name,
          org.legalName || '',
          org.type,
          org.status,
          org.userCount,
          org.projectCount,
          org.createdAt
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `organizations.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Organizations exported successfully');
    } catch (error) {
      console.error('Error exporting organizations:', error);
      toast.error('Failed to export organizations');
    }
  };

  const organizationColumns: TableColumn<Organization>[] = [
    {
      key: 'name',
      label: 'Organization Name',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'legalName',
      label: 'Legal Name',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
          {value ? value.toUpperCase() : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <StatusIndicator
          status={value === 'active' ? 'healthy' : value === 'pending' ? 'warning' : 'error'}
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          size="sm"
        />
      ),
    },
    {
      key: 'userCount',
      label: 'Users',
      sortable: true,
      render: (value: number) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'projectCount',
      label: 'Projects',
      sortable: true,
      render: (value: number) => (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
  ];

  const userColumns: TableColumn<User>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'firstName',
      label: 'First Name',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <StatusIndicator
          status={value ? 'healthy' : 'error'}
          label={value ? 'Active' : 'Inactive'}
          size="sm"
        />
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (value: Date) => value ? new Date(value).toLocaleDateString() : 'Never',
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Filter by Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'suspended', label: 'Suspended' },
      ],
    },
    {
      key: 'type',
      label: 'Filter by Type',
      options: [
        { value: 'ngo', label: 'NGO' },
        { value: 'company', label: 'Company' },
        { value: 'government', label: 'Government' },
        { value: 'individual', label: 'Individual' },
      ],
    },
  ];

  const bulkActions: BulkAction<Organization>[] = [
    {
      key: 'activate',
      label: 'Activate Selected',
      action: (selected) => handleBulkStatusUpdate(selected, 'active'),
    },
    {
      key: 'deactivate',
      label: 'Deactivate Selected',
      action: (selected) => handleBulkStatusUpdate(selected, 'inactive'),
    },
    {
      key: 'export',
      label: 'Export Selected',
      action: async (selected) => {
        await handleExportOrganizations('csv');
      },
    },
  ];

  const activeOrgs = organizations.filter(org => org.status === 'active').length;
  const totalOrgs = organizations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage partner organizations, their status, and compliance
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExportOrganizations('csv')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Export All
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create Organization
          </button>
        </div>
      </div>

      {/* Organization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Organizations"
          value={totalOrgs.toString()}
          icon={<span className="text-blue-500">🏢</span>}
        />
        <MetricsCard
          title="Active Organizations"
          value={activeOrgs.toString()}
          icon={<span className="text-green-500">✅</span>}
        />
        <MetricsCard
          title="Pending Review"
          value={organizations.filter(org => org.status === 'pending').length.toString()}
          icon={<span className="text-yellow-500">⏳</span>}
        />
        <MetricsCard
          title="Total Users"
          value={organizations.reduce((sum, org) => sum + org.userCount, 0).toString()}
          icon={<span className="text-purple-500">👥</span>}
        />
      </div>

      {/* Organizations Table */}
      <DataTable
        data={organizations}
        columns={organizationColumns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search organizations by name..."
        filters={filters}
        bulkActions={bulkActions}
        selectedItems={selectedOrganizations}
        onSelectionChange={setSelectedOrganizations}
        onRowClick={(org) => setEditingOrganization(org)}
      />

      {/* Organization Users Modal */}
      {viewingUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Users in {viewingUsers.name}
              </h2>
              <button
                onClick={() => setViewingUsers(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <DataTable
              data={users}
              columns={userColumns}
              loading={false}
              searchable={true}
              searchPlaceholder="Search users..."
            />
          </div>
        </div>
      )}

      {/* Create Organization Modal */}
      {showCreateModal && (
        <OrganizationForm
          onSubmit={handleCreateOrganization}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Organization Modal */}
      {editingOrganization && (
        <OrganizationForm
          organization={editingOrganization}
          onSubmit={(orgData) => handleUpdateOrganization(editingOrganization.id, orgData)}
          onCancel={() => setEditingOrganization(null)}
        />
      )}
    </div>
  );
};

// Organization Form Component
interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (orgData: Partial<Organization>) => void;
  onCancel: () => void;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ organization, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Organization>>({
    name: organization?.name || '',
    legalName: organization?.legalName || '',
    type: organization?.type || 'ngo',
    status: organization?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {organization ? 'Edit Organization' : 'Create Organization'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Legal Name
            </label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Organization['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="ngo">NGO</option>
              <option value="company">Company</option>
              <option value="government">Government</option>
              <option value="individual">Individual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Organization['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {organization ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationManagement;

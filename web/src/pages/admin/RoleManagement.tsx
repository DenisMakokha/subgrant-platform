import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/adminApi';
import { toast } from 'react-toastify';

interface Role {
  id: string;
  label: string;
  description?: string;
  capabilities: string[];
  scopes: Record<string, string>;
  active: boolean;
  version?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  created_at?: string;
  updated_at?: string;
  user_count?: number;
}

const RoleManagement: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminApi.roles.getAllRoles();
      setRoles(data as Role[]);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles. Using mock data for demonstration.');
      
      // Fallback to mock data if API fails
      const mockRoles: Role[] = [
        {
          id: 'admin',
          label: 'Administrator',
          description: 'Full system access with all permissions',
          capabilities: ['users.create', 'users.read', 'users.update', 'users.delete', 'system.configure'],
          scopes: { project: 'all', tenant: 'all', data: 'admin', users: 'all' },
          active: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          user_count: 3
        },
        {
          id: 'partner_user',
          label: 'Partner User',
          description: 'Standard partner access for project management',
          capabilities: ['projects.view', 'projects.update', 'budgets.create', 'reports.submit'],
          scopes: { project: 'organization', tenant: 'current', data: 'write', users: 'self' },
          active: true,
          created_at: '2025-01-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
          user_count: 12
        },
        {
          id: 'finance_manager',
          label: 'Finance Manager',
          description: 'Financial oversight and approval authority',
          capabilities: ['budgets.view', 'budgets.approve_final', 'disbursements.approve', 'reports.view'],
          scopes: { project: 'all', tenant: 'all', data: 'write', users: 'organization' },
          active: true,
          created_at: '2025-02-01T00:00:00Z',
          updated_at: '2025-02-01T00:00:00Z',
          user_count: 2
        },
        {
          id: 'program_officer',
          label: 'Program Officer',
          description: 'Program monitoring and evaluation',
          capabilities: ['projects.view', 'reports.review', 'compliance.review', 'budgets.approve_level1'],
          scopes: { project: 'assigned', tenant: 'current', data: 'write', users: 'team' },
          active: true,
          created_at: '2025-02-10T00:00:00Z',
          updated_at: '2025-02-10T00:00:00Z',
          user_count: 5
        },
        {
          id: 'auditor',
          label: 'Auditor',
          description: 'Read-only access for auditing purposes',
          capabilities: ['audit.view', 'audit.export', 'reports.view', 'budgets.view'],
          scopes: { project: 'all', tenant: 'all', data: 'read', users: 'all' },
          active: false,
          created_at: '2025-03-01T00:00:00Z',
          updated_at: '2025-03-01T00:00:00Z',
          user_count: 1
        }
      ];
      
      setRoles(mockRoles);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (roleId: string) => {
    navigate(`/admin/wizard?edit=${roleId}`);
  };

  const handleClone = async (role: Role) => {
    try {
      const newRoleId = `${role.id}_copy`;
      const newLabel = `${role.label} (Copy)`;
      
      await adminApi.roles.cloneRole(role.id, newRoleId, newLabel);
      
      toast.success(`Role "${role.label}" cloned successfully`);
      fetchRoles();
    } catch (error) {
      console.error('Error cloning role:', error);
      toast.error('Failed to clone role. Creating local copy for demonstration.');
      
      // Fallback: Create local copy
      const clonedRole = {
        ...role,
        id: `${role.id}_copy`,
        label: `${role.label} (Copy)`,
        user_count: 0
      };
      setRoles([...roles, clonedRole]);
      toast.success(`Role "${role.label}" cloned locally`);
    }
  };

  const handleDelete = async (roleId: string) => {
    try {
      await adminApi.roles.deleteRole(roleId);
      
      setRoles(roles.filter(r => r.id !== roleId));
      toast.success('Role deleted successfully');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role. Removing locally for demonstration.');
      
      // Fallback: Remove locally
      setRoles(roles.filter(r => r.id !== roleId));
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (roleId: string, currentActive: boolean) => {
    try {
      await adminApi.roles.toggleRoleActive(roleId, !currentActive);
      
      // Update local state
      setRoles(roles.map(r => 
        r.id === roleId ? { ...r, active: !currentActive } : r
      ));
      
      toast.success(`Role ${!currentActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error('Failed to update role status. Updating locally for demonstration.');
      
      // Fallback: Update locally
      setRoles(roles.map(r => 
        r.id === roleId ? { ...r, active: !currentActive } : r
      ));
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && role.active) ||
                         (filterActive === 'inactive' && !role.active);
    
    return matchesSearch && matchesFilter;
  });

  const getRoleIcon = (roleId: string) => {
    if (roleId.includes('admin')) return '👑';
    if (roleId.includes('finance')) return '💰';
    if (roleId.includes('partner')) return '🤝';
    if (roleId.includes('program')) return '📊';
    if (roleId.includes('audit')) return '🔍';
    return '👤';
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'all': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'organization': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'assigned': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'self': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'write': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'read': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Role Management
            </h1>
            <p className="text-blue-100">
              Manage custom roles and permissions for your team
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Roles</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{roles.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Roles</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {roles.filter(r => r.active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Inactive Roles</p>
              <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                {roles.filter(r => !r.active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Users</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {roles.reduce((sum, r) => sum + (r.user_count || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter & Actions */}
          <div className="flex items-center space-x-3">
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setFilterActive('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterActive === 'all'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterActive('active')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterActive === 'active'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterActive('inactive')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filterActive === 'inactive'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={() => navigate('/admin/wizard')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Create Role</span>
            </button>
          </div>
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No roles found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first custom role'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => navigate('/admin/wizard')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Your First Role</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map(role => (
            <div
              key={role.id}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center text-2xl">
                      {getRoleIcon(role.id)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {role.label}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {role.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(role.id, role.active)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      role.active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {role.active ? 'Active' : 'Inactive'}
                  </button>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {role.description || 'No description provided'}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Capabilities */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Capabilities
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                      {role.capabilities.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.capabilities.slice(0, 3).map(cap => (
                      <span
                        key={cap}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded"
                      >
                        {cap.split('.')[1] || cap}
                      </span>
                    ))}
                    {role.capabilities.length > 3 && (
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded">
                        +{role.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Scopes */}
                <div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Access Scopes
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(role.scopes).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-slate-500 dark:text-slate-400 capitalize">{key}:</span>
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-xs font-medium ${getScopeColor(value)}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users Count */}
                <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>{role.user_count || 0} user{role.user_count !== 1 ? 's' : ''} assigned</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleEdit(role.id)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleClone(role)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-1"
                      title="Clone role"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Clone</span>
                    </button>

                    {deleteConfirm === role.id ? (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleDelete(role.id)}
                          className="px-2 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(role.id)}
                        className="px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center space-x-1"
                        disabled={!!(role.user_count && role.user_count > 0)}
                        title={role.user_count && role.user_count > 0 ? 'Cannot delete role with assigned users' : 'Delete role'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleManagement;

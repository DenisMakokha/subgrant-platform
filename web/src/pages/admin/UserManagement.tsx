import React, { useState, useEffect } from 'react';
import { User } from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import { toast } from 'react-toastify';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'partner_user',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching users with params:', {
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      console.log('📡 API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:3000/api');
      console.log('📡 Calling adminApi.users.getUsers...');
      
      const response = await adminApi.users.getUsers({
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        status: statusFilter ? (statusFilter as 'active' | 'inactive') : undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });
      
      console.log('✅ Users response:', response);
      
      const usersData = Array.isArray(response) ? response : response?.data || [];
      const pagination = response?.pagination;
      
      console.log('📊 Users data:', usersData);
      console.log('📄 Pagination:', pagination);
      
      setUsers(usersData);
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalUsers(pagination.total || 0);
      }
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.status,
      });
      toast.error(`Failed to fetch users: ${error.message || 'Unknown error'}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.users.createUser(formData);
      toast.success('User created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      console.log('🔍 FormData state:', formData);
      console.log('🔍 FormData.role:', formData.role);
      
      const updateData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        isActive: formData.isActive,
      };
      
      console.log('📤 Updating user:', editingUser.id);
      console.log('📤 Update data:', updateData);
      console.log('📤 Original user:', editingUser);
      
      const response = await adminApi.users.updateUser(editingUser.id, updateData);
      console.log('✅ Update response:', response);
      
      toast.success('User updated successfully');
      
      // Close modal and reset form
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      
      // Small delay to ensure database transaction is complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh the users list
      console.log('🔄 Refreshing users list...');
      await fetchUsers();
      console.log('✅ Users list refreshed');
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(`Failed to update user: ${error.message || 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'partner_user',
      password: '',
      isActive: true,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    setShowDeleteDialog(true);
  };

  const handlePasswordReset = (userId: string) => {
    setResetPasswordUserId(userId);
    // Generate a random temporary password
    const tempPassword = generateTemporaryPassword();
    setNewPassword(tempPassword);
    setShowPasswordResetDialog(true);
  };

  const generateTemporaryPassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const confirmPasswordReset = async () => {
    if (!resetPasswordUserId || !newPassword) return;

    try {
      await adminApi.users.resetPassword(resetPasswordUserId, newPassword);
      toast.success('Password reset successfully. Make sure to share the new password with the user.');
      setShowPasswordResetDialog(false);
      setResetPasswordUserId(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(`Failed to reset password: ${error.message || 'Unknown error'}`);
    }
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    toast.success('Password copied to clipboard!');
  };

  const confirmDelete = async () => {
    if (!deletingUserId) return;

    // Check if trying to delete the last admin
    const userToDelete = users.find(u => u.id === deletingUserId);
    const adminUsers = users.filter(u => u.role === 'admin' && u.isActive);
    
    if (userToDelete?.role === 'admin' && adminUsers.length === 1) {
      toast.error('Cannot delete the last admin user. Please create another admin first.');
      setShowDeleteDialog(false);
      setDeletingUserId(null);
      return;
    }

    try {
      await adminApi.users.deleteUser(deletingUserId);
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setDeletingUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users first');
      return;
    }

    if (action === 'delete') {
      // Check if trying to delete all admins
      const selectedUserObjects = users.filter(u => selectedUsers.includes(u.id));
      const selectedAdmins = selectedUserObjects.filter(u => u.role === 'admin');
      const totalActiveAdmins = users.filter(u => u.role === 'admin' && u.isActive).length;
      const remainingAdmins = totalActiveAdmins - selectedAdmins.length;
      
      if (remainingAdmins < 1) {
        toast.error('Cannot delete all admin users. At least one admin must remain.');
        return;
      }
      
      if (!window.confirm(`Delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) return;
      
      try {
        await Promise.all(selectedUsers.map(userId => adminApi.users.deleteUser(userId)));
        toast.success(`${selectedUsers.length} user(s) deleted successfully`);
        setSelectedUsers([]);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting users:', error);
        toast.error('Failed to delete some users');
      }
    } else if (action === 'activate') {
      try {
        await Promise.all(selectedUsers.map(userId => 
          adminApi.users.updateUser(userId, { isActive: true })
        ));
        toast.success(`${selectedUsers.length} user(s) activated successfully`);
        setSelectedUsers([]);
        fetchUsers();
      } catch (error) {
        console.error('Error activating users:', error);
        toast.error('Failed to activate some users');
      }
    } else if (action === 'deactivate') {
      try {
        await Promise.all(selectedUsers.map(userId => 
          adminApi.users.updateUser(userId, { isActive: false })
        ));
        toast.success(`${selectedUsers.length} user(s) deactivated successfully`);
        setSelectedUsers([]);
        fetchUsers();
      } catch (error) {
        console.error('Error deactivating users:', error);
        toast.error('Failed to deactivate some users');
      }
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleExportUsers = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      const blob = await adminApi.users.exportUsers(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Users exported successfully');
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Failed to export users');
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
        isActive 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    return (
      <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system users, roles, and permissions
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExportUsers('csv')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Export All
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="partner_user">Partner User</option>
            <option value="grants_manager">Grants Manager</option>
            <option value="chief_operations_officer">COO</option>
            <option value="donor">Donor</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedUsers.length} user(s) selected
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBulkAction('activate')}
              className="px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkAction('deactivate')}
              className="px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedUsers([])}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={(e) => {
                        // Don't trigger if clicking checkbox or action buttons
                        if ((e.target as HTMLElement).closest('input, button')) return;
                        setEditingUser(user);
                        setFormData({
                          email: user.email,
                          firstName: user.firstName || '',
                          lastName: user.lastName || '',
                          role: user.role,
                          password: '',
                          isActive: user.isActive,
                        });
                        setShowEditModal(true);
                      }}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-4 py-2">
                        {getStatusBadge(user.isActive)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUser(user);
                              setFormData({
                                email: user.email,
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                role: user.role,
                                password: '',
                                isActive: user.isActive,
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePasswordReset(user.id);
                            }}
                            className="p-1.5 text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                            title="Reset password"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                          {(() => {
                            const isLastAdmin = user.role === 'admin' && 
                              users.filter(u => u.role === 'admin' && u.isActive).length === 1;
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isLastAdmin) {
                                    handleDeleteUser(user.id);
                                  }
                                }}
                                disabled={isLastAdmin}
                                className={`p-1.5 rounded transition-colors ${
                                  isLastAdmin
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                                }`}
                                title={isLastAdmin ? 'Cannot delete the last admin' : 'Delete user'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            );
                          })()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalUsers)}</span> of{' '}
                    <span className="font-medium">{totalUsers}</span> results
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <UserForm
          onSubmit={async (userData) => {
            await handleCreateUser({ preventDefault: () => {} } as React.FormEvent);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <UserForm
          user={editingUser}
          onSubmit={async (userData) => {
            console.log('📥 Received userData from UserForm:', userData);
            try {
              const updateData = {
                email: userData.email!,
                firstName: userData.firstName!,
                lastName: userData.lastName!,
                role: userData.role!,
                isActive: userData.isActive!,
              };
              
              console.log('📤 Sending update with role:', updateData.role);
              const response = await adminApi.users.updateUser(editingUser.id, updateData);
              console.log('✅ Update response:', response);
              
              toast.success('User updated successfully');
              setShowEditModal(false);
              setEditingUser(null);
              
              // Refresh users list
              await new Promise(resolve => setTimeout(resolve, 100));
              await fetchUsers();
            } catch (error) {
              console.error('Error updating user:', error);
              toast.error('Failed to update user');
            }
          }}
          onCancel={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingUserId(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Dialog */}
      {showPasswordResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-4 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Reset User Password
                  </h3>
                  <p className="text-amber-100 text-xs">
                    Generate a new temporary password
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Important Security Notice
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Make sure to securely share this password with the user. They should change it immediately after logging in.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  New Temporary Password
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    readOnly
                  />
                  <button
                    onClick={copyPasswordToClipboard}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const newPass = generateTemporaryPassword();
                      setNewPassword(newPass);
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Generate new password"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Password must be at least 12 characters with letters, numbers, and special characters
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowPasswordResetDialog(false);
                  setResetPasswordUserId(null);
                  setNewPassword('');
                }}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPasswordReset}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg hover:from-amber-700 hover:to-orange-700 shadow-lg shadow-amber-500/50 transition-all"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// User Form Component
interface UserFormProps {
  user?: User;
  onSubmit: (userData: Partial<User>) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || '',
    isActive: user?.isActive ?? true,
  });

  // Sync form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || '',
        isActive: user.isActive ?? true,
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 UserForm submitting with formData:', formData);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {user ? 'Edit User' : 'Create New User'}
                </h2>
                <p className="text-blue-100 text-xs">
                  {user ? 'Update user information and permissions' : 'Add a new user to the system'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content - Auto height on desktop, scrollable on mobile */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="user@example.com"
                required
              />
            </div>
          </div>

          {/* Name Fields - Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              User Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <select
                value={formData.role}
                onChange={(e) => {
                  console.log('🔄 Role dropdown changed to:', e.target.value);
                  setFormData(prev => {
                    const updated = { ...prev, role: e.target.value };
                    console.log('🔄 Updated formData:', updated);
                    return updated;
                  });
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                required
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="partner_user">Partner User</option>
                <option value="grants_manager">Grants Manager</option>
                <option value="chief_operations_officer">Chief Operations Officer (COO)</option>
                <option value="donor">Donor</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Select the appropriate role for this user's access level
            </p>
          </div>

          {/* Active Status Toggle */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <svg className={`w-6 h-6 ${formData.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <label htmlFor="isActive" className="block text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                    Account Status
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.isActive ? 'User can log in and access the system' : 'User account is disabled'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-3 mt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/50 transition-all"
              >
                {user ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithAuth } from '../../services/api';
import { toast } from 'react-toastify';

interface Organization {
  id: string;
  name: string;
  legal_name?: string;
  registration_number?: string;
  tax_id?: string;
  legal_structure?: string;
  year_established?: number;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  bank_name?: string;
  bank_branch?: string;
  account_name?: string;
  account_number?: string;
  swift_code?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const PartnerProfile: React.FC = () => {
  const { user, organization, refreshSession } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState(false);
  const [personalData, setPersonalData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: (user as any)?.phone || '',
  });
  const [orgData, setOrgData] = useState<Partial<Organization>>({});

  // Update personal data when user data becomes available
  useEffect(() => {
    if (user) {
      setPersonalData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (organization) {
      setOrgData({
        name: organization.name || '',
        legal_name: organization.legal_name || '',
        registration_number: organization.registration_number || '',
        tax_id: organization.tax_id || '',
        legal_structure: organization.legal_structure || '',
        year_established: organization.year_established || undefined,
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state_province: organization.state_province || '',
        postal_code: organization.postal_code || '',
        country: organization.country || '',
        bank_name: organization.bank_name || '',
        bank_branch: organization.bank_branch || '',
        account_name: organization.account_name || '',
        account_number: organization.account_number || '',
        swift_code: organization.swift_code || '',
      });
    }
  }, [organization]);

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting personal data:', personalData);
      
      const response = await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personalData),
      });

      console.log('Personal profile update response:', response);

      await refreshSession();
      toast.success('Personal information updated successfully');
      setEditingPersonal(false);
    } catch (error: any) {
      console.error('Failed to update personal information:', error);
      
      // Handle specific error cases
      if (error?.response?.status === 409) {
        toast.error('Email is already taken by another user');
      } else if (error?.response?.status === 400) {
        toast.error('Please fill in all required fields');
      } else if (error?.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to update personal information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetchWithAuth('/api/organization/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      });

      await refreshSession();
      toast.success('Organization information updated successfully');
      setEditingOrganization(false);
    } catch (error: any) {
      console.error('Failed to update organization information:', error);
      
      // Handle finalized organization error
      if (error?.response?.status === 403 && error?.response?.data?.code === 'ORGANIZATION_FINALIZED') {
        toast.error('Organization profile cannot be modified after onboarding is finalized');
      } else {
        toast.error('Failed to update organization information');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'under_review':
      case 'under_review_gm':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'c_pending':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'b_pending':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'a_pending':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finalized':
        return 'Onboarding Complete';
      case 'under_review':
      case 'under_review_gm':
        return 'Application Under Review';
      case 'c_pending':
        return 'Document Upload Incomplete';
      case 'b_pending':
        return 'Financial Assessment Incomplete';
      case 'a_pending':
        return 'Organization Profile Incomplete';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your personal and organization information
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Partner User</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
          <button
            onClick={() => setEditingPersonal(!editingPersonal)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            {editingPersonal ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingPersonal ? (
          <form onSubmit={handlePersonalSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={personalData.first_name}
                  onChange={(e) => setPersonalData({ ...personalData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={personalData.last_name}
                  onChange={(e) => setPersonalData({ ...personalData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={personalData.email}
                  onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={personalData.phone}
                  onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingPersonal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">First Name</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.first_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.last_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{user?.email || 'Not provided'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{(user as any)?.phone || 'Not provided'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Organization Information */}
      {organization && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          {organization.status === 'finalized' && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Organization Profile Locked</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                    This organization profile cannot be modified because onboarding has been finalized.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Organization Information</h2>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(organization.status)}`}>
                  {getStatusText(organization.status)}
                </span>
              </div>
            </div>
            {organization.status !== 'finalized' ? (
              <button
                onClick={() => setEditingOrganization(!editingOrganization)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                {editingOrganization ? 'Cancel' : 'Edit'}
              </button>
            ) : (
              <div className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg">
                Read Only
              </div>
            )}
          </div>

          {editingOrganization ? (
            <form onSubmit={handleOrganizationSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgData.name || ''}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={orgData.legal_name || ''}
                      onChange={(e) => setOrgData({ ...orgData, legal_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={orgData.registration_number || ''}
                      onChange={(e) => setOrgData({ ...orgData, registration_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={orgData.tax_id || ''}
                      onChange={(e) => setOrgData({ ...orgData, tax_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={orgData.email || ''}
                      onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={orgData.phone || ''}
                      onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      value={orgData.website || ''}
                      onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingOrganization(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Organization Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Legal Name</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.legal_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Registration Number</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.registration_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Tax ID</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.tax_id || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.phone || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Website</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.website || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {(organization.address || organization.city || organization.country) && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">City</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{organization.country || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">{user?.id}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {(user as any)?.created_at ? new Date((user as any).created_at).toLocaleDateString() : 'Not available'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {user?.email_verified ? (
                <span className="inline-flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center text-amber-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Not Verified
                </span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Role</label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">Partner User</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfile;

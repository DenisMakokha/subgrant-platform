import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { fetchWithAuth } from '../../services/api';
import { BuildingOfficeIcon, UserGroupIcon, BanknotesIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

interface OrganizationProfile {
  // Basic Information
  name: string;
  legal_name: string;
  registration_number: string;
  tax_id: string;
  legal_structure: string;
  incorporation_country: string;
  country: string;
  incorporation_date: string;
  
  // Address Information
  address: string;
  city: string;
  state_province: string;
  postal_code: string;
  
  // Contact Information
  email: string;
  phone: string;
  website: string;
  primary_contact_name: string;
  primary_contact_title: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  
  // Authorized Signatory
  signatory_name: string;
  signatory_title: string;
  signatory_email: string;
  
  // Banking Information
  bank_name: string;
  bank_branch: string;
  account_name: string;
  account_number: string;
  
  // Additional Information
  description: string;
}

interface OnboardingData {
  organizationStatus: string;
  sectionAData?: Partial<OrganizationProfile>;
}

const SectionA: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<OnboardingData>({ organizationStatus: 'section_a' });
  const [profile, setProfile] = useState<OrganizationProfile>({
    name: '',
    legal_name: '',
    registration_number: '',
    tax_id: '',
    legal_structure: '',
    incorporation_country: '',
    country: '',
    incorporation_date: '',
    address: '',
    city: '',
    state_province: '',
    postal_code: '',
    email: '',
    phone: '',
    website: '',
    primary_contact_name: '',
    primary_contact_title: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    signatory_name: '',
    signatory_title: '',
    signatory_email: '',
    bank_name: '',
    bank_branch: '',
    account_name: '',
    account_number: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const eastAfricanCountries = [
    'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Ethiopia', 'Somalia'
  ];

  const legalStructures = [
    'NGO', 'CBO', 'Trust', 'Company Limited by Guarantee', 'Private Limited Company', 'Other'
  ];

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const response = await fetchWithAuth('/api/onboarding/status');
      if (response.ok) {
        const onboardingData = await response.json();
        setData(onboardingData);
        if (onboardingData.sectionAData) {
          setProfile(prev => ({ ...prev, ...onboardingData.sectionAData }));
        }
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const handleProfileChange = (field: keyof OrganizationProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const response = await fetchWithAuth('/api/onboarding/section-a', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionAData: profile })
      });

      if (response.ok) {
        console.log('Draft saved successfully');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const submitSection = async () => {
    setSubmitting(true);
    try {
      const response = await fetchWithAuth('/api/onboarding/section-a/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionAData: profile })
      });

      if (response.ok) {
        navigate('/onboarding/complete');
      }
    } catch (error) {
      console.error('Error submitting section:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingLayout currentStep="section-a" organizationStatus={data.organizationStatus}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete Your Organization Profile</h2>
          <p className="text-lg text-gray-600">
            Provide your organization's comprehensive details to finalize your partnership with Zizi Afrique Foundation. This information will be used for contracts, payments, and official communications.
          </p>
        </div>

        <form className="space-y-8">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center mb-6">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Legal Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.legal_name}
                  onChange={(e) => handleProfileChange('legal_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.registration_number}
                  onChange={(e) => handleProfileChange('registration_number', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax ID
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.tax_id}
                  onChange={(e) => handleProfileChange('tax_id', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Legal Structure *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.legal_structure}
                  onChange={(e) => handleProfileChange('legal_structure', e.target.value)}
                >
                  <option value="">Select legal structure</option>
                  {legalStructures.map(structure => (
                    <option key={structure} value={structure}>{structure}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incorporation Country *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.incorporation_country}
                  onChange={(e) => handleProfileChange('incorporation_country', e.target.value)}
                >
                  <option value="">Select country</option>
                  {eastAfricanCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Country *
                </label>
                <select
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.country}
                  onChange={(e) => handleProfileChange('country', e.target.value)}
                >
                  <option value="">Select country</option>
                  {eastAfricanCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incorporation Date *
                </label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.incorporation_date}
                  onChange={(e) => handleProfileChange('incorporation_date', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.website}
                  onChange={(e) => handleProfileChange('website', e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={profile.description}
                  onChange={(e) => handleProfileChange('description', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center mb-6">
              <BuildingOfficeIcon className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Address Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Physical Address *
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={profile.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={profile.city}
                  onChange={(e) => handleProfileChange('city', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={profile.state_province}
                  onChange={(e) => handleProfileChange('state_province', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={profile.postal_code}
                  onChange={(e) => handleProfileChange('postal_code', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={profile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Phone *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={profile.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center mb-6">
              <UserGroupIcon className="h-6 w-6 text-purple-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Primary Contact Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  value={profile.primary_contact_name}
                  onChange={(e) => handleProfileChange('primary_contact_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  value={profile.primary_contact_title}
                  onChange={(e) => handleProfileChange('primary_contact_title', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  value={profile.primary_contact_email}
                  onChange={(e) => handleProfileChange('primary_contact_email', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  value={profile.primary_contact_phone}
                  onChange={(e) => handleProfileChange('primary_contact_phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Authorized Signatory */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center mb-6">
              <DocumentCheckIcon className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Authorized Signatory</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signatory Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  value={profile.signatory_name}
                  onChange={(e) => handleProfileChange('signatory_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signatory Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  value={profile.signatory_title}
                  onChange={(e) => handleProfileChange('signatory_title', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Signatory Email *
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  value={profile.signatory_email}
                  onChange={(e) => handleProfileChange('signatory_email', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Banking Information */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center mb-6">
              <BanknotesIcon className="h-6 w-6 text-emerald-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Banking Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  value={profile.bank_name}
                  onChange={(e) => handleProfileChange('bank_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Branch *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  value={profile.bank_branch}
                  onChange={(e) => handleProfileChange('bank_branch', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  value={profile.account_name}
                  onChange={(e) => handleProfileChange('account_name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  value={profile.account_number}
                  onChange={(e) => handleProfileChange('account_number', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              type="button"
              onClick={submitSection}
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-medium shadow-lg"
            >
              {submitting ? 'Submitting...' : 'Complete Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </OnboardingLayout>
  );
};

export default SectionA;

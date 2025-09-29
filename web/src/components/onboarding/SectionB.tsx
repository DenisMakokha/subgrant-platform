import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { fetchWithAuth } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface MoneyYear {
  amountUsd: number;
  year: number;
}

interface FinancialAssessment {
  currentAnnualBudget: MoneyYear;
  nextYearAnnualBudgetEstimate: MoneyYear;
  largestGrantEverManaged: MoneyYear;
  currentDonorFunding: MoneyYear;
  otherFunds: MoneyYear;
  submittedAt?: string;
}

interface SectionBData {
  organizationStatus: string;
  assessment: FinancialAssessment | null;
}

const SectionB: React.FC = () => {
  const navigate = useNavigate();
  const { organization, refreshSession } = useAuth();
  const isFinalized = organization?.status === 'finalized';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<SectionBData | null>(null);
  const [assessment, setAssessment] = useState<FinancialAssessment>({
    currentAnnualBudget: { amountUsd: 0, year: new Date().getFullYear() },
    nextYearAnnualBudgetEstimate: { amountUsd: 0, year: new Date().getFullYear() + 1 },
    largestGrantEverManaged: { amountUsd: 0, year: new Date().getFullYear() },
    currentDonorFunding: { amountUsd: 0, year: new Date().getFullYear() },
    otherFunds: { amountUsd: 0, year: new Date().getFullYear() }
  });

  useEffect(() => {
    loadSectionB();
  }, []);

  const loadSectionB = async () => {
    try {
      const response = await fetchWithAuth('/api/onboarding/section-b');
      const sectionData = await response.json();
      
      setData(sectionData);
      
      if (sectionData.assessment) {
        setAssessment(sectionData.assessment);
      }
    } catch (error) {
      console.error('Failed to load Section B:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentChange = (field: keyof FinancialAssessment, subField: keyof MoneyYear, value: number) => {
    setAssessment(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as MoneyYear),
        [subField]: value
      }
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await fetchWithAuth('/api/onboarding/section-b/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment)
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const submitSection = async () => {
    setSubmitting(true);
    try {
      const response = await fetchWithAuth('/api/onboarding/section-b/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessment)
      });

      if (response.ok) {
        await refreshSession(); // Refresh to get updated organization status
        navigate('/onboarding/section-c');
      } else {
        const errorData = await response.json();
        console.error('Submission failed:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to submit Section B:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep="section-b">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial assessment...</p>
        </div>
      </OnboardingLayout>
    );
  }

  if (!data) {
    return (
      <OnboardingLayout currentStep="section-b">
        <div className="p-8 text-center">
          <p className="text-red-600">Failed to load financial assessment</p>
        </div>
      </OnboardingLayout>
    );
  }

  const assessmentCards = [
    {
      key: 'currentAnnualBudget' as keyof FinancialAssessment,
      title: 'Current Annual Budget',
      description: 'Your organization\'s current annual operating budget',
      icon: '📊'
    },
    {
      key: 'nextYearAnnualBudgetEstimate' as keyof FinancialAssessment,
      title: 'Next Year Budget Estimate',
      description: 'Estimated budget for the upcoming fiscal year',
      icon: '📈'
    },
    {
      key: 'largestGrantEverManaged' as keyof FinancialAssessment,
      title: 'Largest Grant Ever Managed',
      description: 'The largest single grant your organization has managed',
      icon: '🏆'
    },
    {
      key: 'currentDonorFunding' as keyof FinancialAssessment,
      title: 'Current Donor Funding',
      description: 'Total current funding from all donors',
      icon: '🤝'
    },
    {
      key: 'otherFunds' as keyof FinancialAssessment,
      title: 'Other Funds',
      description: 'Other sources of funding (earned revenue, investments, etc.)',
      icon: '💰'
    }
  ];

  return (
    <OnboardingLayout currentStep="section-b" organizationStatus={data.organizationStatus}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Section B: Financial Assessment</h2>
          <p className="text-lg text-gray-600">
            Help us understand your organization's financial capacity and grant management experience. This information helps us determine appropriate funding levels and support needs. Complete this section to proceed to Section C.
          </p>
        </div>

        {/* Financial Assessment Cards */}
        {isFinalized && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            Onboarding is complete. This section is read-only.
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {assessmentCards.map(card => {
            const value = assessment[card.key] as MoneyYear;
            
            return (
              <div key={card.key} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="text-3xl">{card.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{card.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Amount (USD)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            className={`block w-full pl-7 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg ${isFinalized ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                            placeholder="0"
                            value={value.amountUsd || ''}
                            onChange={(e) => handleAssessmentChange(card.key, 'amountUsd', parseInt(e.target.value) || 0)}
                            disabled={isFinalized}
                          />
                        </div>
                        {value.amountUsd > 0 && (
                          <p className="mt-1 text-sm text-gray-500">
                            {formatCurrency(value.amountUsd)}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year
                        </label>
                        <input
                          type="number"
                          min="2000"
                          max="2035"
                          className={`block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-lg ${isFinalized ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                          placeholder="YYYY"
                          value={value.year || ''}
                          onChange={(e) => handleAssessmentChange(card.key, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                          disabled={isFinalized}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        <div className="bg-indigo-50 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-indigo-900 mb-4">Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(assessment.currentAnnualBudget.amountUsd)}
              </div>
              <div className="text-sm text-indigo-700">Current Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(assessment.largestGrantEverManaged.amountUsd)}
              </div>
              <div className="text-sm text-indigo-700">Largest Grant</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {formatCurrency(assessment.currentDonorFunding.amountUsd + assessment.otherFunds.amountUsd)}
              </div>
              <div className="text-sm text-indigo-700">Total Funding</div>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Notes</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>All amounts should be in USD</li>
                  <li>Years should be between 2000 and 2035</li>
                  <li>This information will be used to assess your organization's financial capacity</li>
                  <li>Ensure all figures are accurate as they will be verified during the review process</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between">
          <button
            onClick={() => navigate('/onboarding/section-a')}
            className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Back to Section A
          </button>
          
          {!isFinalized && (
            <div className="flex space-x-4">
              <button
                onClick={saveDraft}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              
              <button
                onClick={submitSection}
                disabled={submitting}
                className="px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Continue to Section C'}
              </button>
            </div>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default SectionB;

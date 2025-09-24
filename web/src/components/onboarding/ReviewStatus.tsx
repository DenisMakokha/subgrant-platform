import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { fetchWithAuth } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface ReviewFlag {
  id: string;
  scope: 'document' | 'financial' | 'profile';
  scopeRef?: string;
  comment: string;
  status: 'pending' | 'addressed';
  createdAt: string;
  resolvedAt?: string;
}

interface ReviewData {
  organizationStatus: string;
  flags: ReviewFlag[];
  lastReviewDate?: string;
  canProceed: boolean;
}

const ReviewStatus: React.FC = () => {
  const navigate = useNavigate();
  const { organization, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    loadReviewStatus();
    // Poll for status updates every 30 seconds
    const interval = setInterval(loadReviewStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadReviewStatus = async () => {
    try {
      const reviewData = await fetchWithAuth('/onboarding/review-status');
      setData(reviewData);
    } catch (error) {
      console.error('Failed to load review status:', error);
      // Mock data for development
      setData({
        organizationStatus: 'under_review',
        flags: [],
        canProceed: false
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'under_review':
        return {
          title: 'Under Review',
          description: 'Your application is currently being reviewed by our team.',
          color: 'yellow',
          icon: '⏳'
        };
      case 'changes_requested':
        return {
          title: 'Changes Requested',
          description: 'Please address the items below and resubmit your application.',
          color: 'orange',
          icon: '📝'
        };
      case 'finalized':
        return {
          title: 'Application Finalized!',
          description: 'Congratulations! Your application has been finalized and you can now access the partner dashboard.',
          color: 'green',
          icon: '✅'
        };
      default:
        return {
          title: 'In Review',
          description: 'Your application status is being processed.',
          color: 'gray',
          icon: '📋'
        };
    }
  };

  const getScopeTitle = (scope: string) => {
    switch (scope) {
      case 'document': return 'Document';
      case 'financial': return 'Financial';
      case 'profile': return 'Profile';
      default: return scope;
    }
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep="review">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading review status...</p>
        </div>
      </OnboardingLayout>
    );
  }

  if (!data) {
    return (
      <OnboardingLayout currentStep="review">
        <div className="p-8 text-center">
          <p className="text-red-600">Failed to load review status</p>
        </div>
      </OnboardingLayout>
    );
  }

  const statusDisplay = getStatusDisplay(data.organizationStatus);

  return (
    <OnboardingLayout currentStep="review" organizationStatus={data.organizationStatus}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">{statusDisplay.icon}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{statusDisplay.title}</h2>
          <p className="text-lg text-gray-600">{statusDisplay.description}</p>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl p-8 mb-8 ${
          statusDisplay.color === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
          statusDisplay.color === 'orange' ? 'bg-orange-50 border border-orange-200' :
          statusDisplay.color === 'green' ? 'bg-green-50 border border-green-200' :
          'bg-gray-50 border border-gray-200'
        }`}>
          <div className="text-center">
            {data.organizationStatus === 'under_review' && (
              <div>
                <h3 className="text-xl font-semibold text-yellow-800 mb-4">Review in Progress</h3>
                <p className="text-yellow-700 mb-6">
                  Our team is carefully reviewing your submission. This process typically takes 5-7 business days.
                  We'll notify you via email once the review is complete.
                </p>
                <div className="flex justify-center items-center space-x-2 text-yellow-600">
                  <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.2s' }}></div>
                  <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}

            {data.organizationStatus === 'finalized' && (
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-4">Application Complete!</h3>
                <p className="text-green-700 mb-6">
                  Your application has been finalized! You now have full access to the partner dashboard and can begin managing your grants.
                </p>
                <button
                  onClick={() => navigate('/partner/')}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Go to Partner Home →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Review Flags */}
        {data.flags && data.flags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Items Requiring Attention</h3>
            <div className="space-y-4">
              {data.flags.map(flag => (
                <div key={flag.id} className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {getScopeTitle(flag.scope)}
                        </span>
                        {flag.scopeRef && (
                          <span className="text-sm text-gray-500">({flag.scopeRef})</span>
                        )}
                      </div>
                      <p className="text-gray-900">{flag.comment}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Flagged on {new Date(flag.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons for Changes Requested */}
            {data.organizationStatus === 'changes_requested' && (
              <div className="mt-8 flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/onboarding/section-a')}
                  className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                >
                  Update Profile
                </button>
                <button
                  onClick={() => navigate('/onboarding/section-b')}
                  className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                >
                  Update Financial Info
                </button>
                <button
                  onClick={() => navigate('/onboarding/section-c')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Update Documents
                </button>
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Section A: Organization Profile</p>
                <p className="text-sm text-gray-500">Organization details submitted</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Section B: Financial Assessment</p>
                <p className="text-sm text-gray-500">Financial capacity information provided</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Section C: Documents Submitted</p>
                <p className="text-sm text-gray-500">All required documents uploaded</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                data.organizationStatus === 'under_review' ? 'bg-yellow-500' :
                ['finalized', 'changes_requested'].includes(data.organizationStatus) ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {['finalized', 'changes_requested'].includes(data.organizationStatus) ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : data.organizationStatus === 'under_review' ? (
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Review Process</p>
                <p className="text-sm text-gray-500">
                  {data.organizationStatus === 'under_review' ? 'Currently in progress...' :
                   data.organizationStatus === 'finalized' ? 'Completed - Finalized!' :
                   data.organizationStatus === 'changes_requested' ? 'Completed - Changes requested' :
                   'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Have questions about your application status?
          </p>
          <button className="text-indigo-600 hover:text-indigo-800 font-medium">
            Contact Support →
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default ReviewStatus;

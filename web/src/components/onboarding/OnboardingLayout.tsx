import React from 'react';
import { useLocation } from 'react-router-dom';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: 'section-c' | 'section-b' | 'review' | 'section-a';
  organizationStatus?: string;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  currentStep, 
  organizationStatus 
}) => {
  const location = useLocation();

  const getStepStatus = (step: string) => {
    const stepOrder = ['section-c', 'section-b', 'review', 'section-a'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'section-c': return 'Document Upload';
      case 'section-b': return 'Financial Assessment';
      case 'review': return 'Application Review';
      case 'section-a': return 'Organization Profile';
      default: return step;
    }
  };

  const isStepAccessible = (step: string) => {
    if (!organizationStatus) return false;
    
    switch (step) {
      case 'section-c':
        return ['attachments_pending', 'changes_requested'].includes(organizationStatus);
      case 'section-b':
        return ['financials_pending', 'changes_requested'].includes(organizationStatus);
      case 'review':
        return ['under_review', 'changes_requested', 'approved'].includes(organizationStatus);
      case 'section-a':
        return organizationStatus === 'final_info_pending';
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Onboarding</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Complete your organization profile to partner with Zizi Afrique Foundation
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Status: <span className="font-medium capitalize">{organizationStatus?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <ol className="flex items-center justify-center space-x-8">
              {['section-c', 'section-b', 'review', 'section-a'].map((step, index) => {
                const status = getStepStatus(step);
                const isAccessible = isStepAccessible(step);
                
                return (
                  <li key={step} className="flex items-center">
                    <div className="flex items-center">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                        ${status === 'completed' 
                          ? 'bg-green-500 text-white' 
                          : status === 'active'
                          ? 'bg-indigo-600 text-white'
                          : isAccessible
                          ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}>
                        {status === 'completed' ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          status === 'active' ? 'text-indigo-600' : 'text-gray-500'
                        }`}>
                          {getStepTitle(step)}
                        </p>
                      </div>
                    </div>
                    {index < 3 && (
                      <div className={`ml-8 w-8 h-0.5 ${
                        status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;

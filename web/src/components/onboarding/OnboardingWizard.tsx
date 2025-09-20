import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../StatusBadge';

// Modern SVG Icons for better UI
const StepIcons = {
  'section-a': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  'section-b': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'section-c': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'review': (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  'completed': (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  )
};

interface WizardStep {
  id: string;
  title: string;
  icon: string;
  description: string;
  component: React.ReactNode;
}

interface OnboardingWizardProps {
  steps: WizardStep[];
  currentStepId: string;
  onStepComplete: (stepId: string) => void;
  onPrevious?: () => void;
  onSaveDraft?: () => void;
  onStepClick?: (stepId: string) => void;
  completedSteps: string[];
  isSubmitting?: boolean;
  isSaving?: boolean;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  steps,
  currentStepId,
  onStepComplete,
  onPrevious,
  onSaveDraft,
  onStepClick,
  completedSteps,
  isSubmitting = false,
  isSaving = false
}) => {
  const navigate = useNavigate();
  const { organization } = useAuth();
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);
  const currentStep = steps[currentStepIndex];


  const goToStep = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    }
  };

  const handleNext = () => {
    onStepComplete(currentStepId);
    if (currentStepIndex < steps.length - 1) {
      // Parent should handle navigation
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0 && onPrevious) {
      onPrevious();
    }
  };

  const progress = ((completedSteps.length / steps.length) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Partnership Registration</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Join our network of trusted partners in just a few simple steps</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{progress}%</div>
              </div>
              {organization?.status && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Status</div>
                  <StatusBadge status={organization.status} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {steps.map((step, index) => {
              const isActive = step.id === currentStepId;
              const isCompleted = completedSteps.includes(step.id);
              // Allow access to first step or any step whose predecessor is completed
              const predecessorStep = index > 0 ? steps[index - 1]?.id : null;
              const isAccessible = index === 0 || (predecessorStep ? completedSteps.includes(predecessorStep) : false);

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`
                      relative flex flex-col items-center group
                      ${!isAccessible ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {/* Enhanced Step Circle */}
                    <div
                      className={`
                        relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out
                        ${isActive 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ring-4 ring-blue-200 dark:ring-blue-800 scale-110 shadow-lg' 
                          : isCompleted
                          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md hover:shadow-lg'
                          : isAccessible
                          ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-2 border-gray-200 dark:border-gray-700'
                        }
                      `}
                    >
                      {/* Step Number Badge for Active/Pending */}
                      {!isCompleted && !isActive && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      )}
                      
                      {/* Icon */}
                      <div className="flex items-center justify-center">
                        {isCompleted 
                          ? StepIcons.completed
                          : StepIcons[step.id as keyof typeof StepIcons] || (
                              <span className="text-2xl">{step.icon}</span>
                            )
                        }
                      </div>
                      
                      {/* Active Pulse Animation */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                      )}
                    </div>
                    
                    {/* Step Title */}
                    <div className="mt-2 text-center">
                      <p className={`
                        text-xs font-medium
                        ${isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        {step.title}
                      </p>
                    </div>

                    {/* Enhanced Tooltip */}
                    {isAccessible && (
                      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                        <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                          {step.description}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Enhanced Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 flex items-center px-4">
                      <div 
                        className={`
                          h-1 w-full rounded-full transition-all duration-500 relative overflow-hidden
                          ${completedSteps.includes(step.id) 
                            ? 'bg-gradient-to-r from-green-400 to-green-500' 
                            : 'bg-gray-200 dark:bg-gray-700'
                          }
                        `}
                      >
                        {/* Animated progress line */}
                        {completedSteps.includes(step.id) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-400 animate-pulse opacity-50"></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Enhanced Step Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-8 py-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            
            <div className="flex items-center space-x-4 relative">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center text-white">
                {StepIcons[currentStep?.id as keyof typeof StepIcons] || (
                  <span className="text-2xl">{currentStep?.icon}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{currentStep?.title}</h2>
                <p className="text-blue-100 mt-1">{currentStep?.description}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-8">
            {currentStep?.component || (
              <div className="text-center py-8">
                <p className="text-gray-500">No content available for this step</p>
                <p className="text-sm text-gray-400 mt-2">Step ID: {currentStepId}</p>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2
                  ${currentStepIndex === 0 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span>←</span>
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-4">
                {onSaveDraft && (
                  <button
                    onClick={onSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center space-x-2"
                >
                  <span>{currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Tips</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Save your progress frequently to avoid losing data
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📞</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Contact us at support@grants.com
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">📚</div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Resources</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Download our onboarding guide
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;

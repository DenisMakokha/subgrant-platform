import React from 'react';

interface ProgressStep {
  id: string;
  title: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ steps, currentStep }) => {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
          />
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300 transform
                  ${step.status === 'completed'
                    ? 'bg-green-500 text-white scale-100'
                    : step.status === 'current'
                    ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-100 dark:ring-blue-900'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 scale-90'
                  }
                `}
              >
                {step.status === 'completed' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step Title */}
              <span
                className={`
                  mt-2 text-xs font-medium text-center
                  ${step.status === 'current'
                    ? 'text-blue-600 dark:text-blue-400'
                    : step.status === 'completed'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {step.title}
              </span>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute top-5 left-full w-full h-0.5 -translate-x-1/2
                    ${step.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                    }
                  `}
                  style={{ width: 'calc(100% - 2.5rem)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;

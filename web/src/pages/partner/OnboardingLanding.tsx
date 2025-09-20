import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithAuth } from '../../services/api';
import { toast } from 'react-toastify';

export default function OnboardingLanding() {
  const { organization, nextStep, user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const current = organization?.status || 'email_pending';

  // State for organization creation form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [orgFormData, setOrgFormData] = useState({
    name: '',
    email: user?.email || '',
    description: ''
  });

  // Update email when user changes
  useEffect(() => {
    if (user?.email) {
      setOrgFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  // Handle organization creation for users without organizations
  const handleCreateOrganization = async () => {
    if (!orgFormData.name.trim()) {
      toast.error('Organization name is required');
      return;
    }
    
    if (!orgFormData.email.trim()) {
      toast.error('Organization email is required');
      return;
    }
    
    try {
      setIsCreatingOrg(true);
      console.log('Creating organization for user:', user?.email);
      
      const orgData = {
        name: orgFormData.name.trim(),
        email: orgFormData.email.trim(),
        description: orgFormData.description.trim(),
        status: 'a_pending' // Start with Section A pending
      };
      
      console.log('Organization data:', orgData);
      
      const result = await fetchWithAuth('/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });
      
      console.log('Organization created:', result);
      
      // Refresh session to get the new organization
      await refreshSession();
      toast.success('Organization profile created successfully!');
      
      // Small delay to ensure state updates, then navigate to Section A
      setTimeout(() => {
        navigate('/partner/onboarding/section-a');
      }, 1000);
    } catch (error) {
      console.error('Error creating organization:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to create organization: ${errorMessage}`);
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const sections = useMemo(() => [
    { 
      id: 'section-a', 
      title: 'Section A — Organization Profile', 
      description: 'Basic organization information and contact details',
      done: ['b_pending', 'c_pending', 'under_review', 'under_review_gm', 'under_review_coo', 'finalized'].includes(current) 
    },
    { 
      id: 'section-b', 
      title: 'Section B — Financial Information', 
      description: 'Banking details and financial documentation',
      done: ['c_pending', 'under_review', 'under_review_gm', 'under_review_coo', 'finalized'].includes(current) 
    },
    { 
      id: 'section-c', 
      title: 'Section C — Compliance Documents', 
      description: 'Required legal and compliance documentation',
      done: ['under_review', 'under_review_gm', 'under_review_coo', 'finalized'].includes(current) 
    },
    { 
      id: 'review', 
      title: 'Review & Submit', 
      description: 'Final review and application submission',
      done: ['under_review', 'under_review_gm', 'under_review_coo', 'finalized'].includes(current) 
    },
  ], [current]);

  const ctaHref =
    nextStep === 'section-a' ? '/partner/onboarding/section-a' :
    nextStep === 'section-b' ? '/partner/onboarding/section-b' :
    nextStep === 'section-c' ? '/partner/onboarding/section-c' :
    nextStep === 'review' ? '/partner/onboarding/review-status' :
    '/partner/onboarding/section-a';

  const getStepStatus = (step: any, index: number) => {
    if (step.done) return 'completed';
    if (index === 0 || sections[index - 1].done) return 'available';
    return 'locked';
  };

  // If user doesn't have an organization, show setup required message
  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-4xl mx-auto p-8 flex items-center justify-center min-h-screen">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center max-w-2xl">
            <div className="text-6xl mb-6">🏢</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Organization Setup Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Partner onboarding is for organizations only. Your account needs to be associated with an organization to proceed.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Account:</strong> {user?.email}<br/>
                <strong>Role:</strong> Partner User<br/>
                <strong>Status:</strong> No organization assigned
              </p>
            </div>
            <div className="space-y-4">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Organization Profile
                </button>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Create Your Organization Profile
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        id="orgName"
                        value={orgFormData.name}
                        onChange={(e) => setOrgFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your organization name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="orgEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Organization Email *
                      </label>
                      <input
                        type="email"
                        id="orgEmail"
                        value={orgFormData.email}
                        onChange={(e) => setOrgFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="organization@example.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="orgDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Brief Description (Optional)
                      </label>
                      <textarea
                        id="orgDescription"
                        value={orgFormData.description}
                        onChange={(e) => setOrgFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of your organization's mission and activities"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={handleCreateOrganization}
                        disabled={isCreatingOrg || !orgFormData.name.trim() || !orgFormData.email.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreatingOrg ? 'Creating...' : 'Create Organization'}
                      </button>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        disabled={isCreatingOrg}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This will create an organization profile for your partner account and begin the onboarding process
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Complete Your Partner Onboarding
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
            Welcome, {user?.email}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500">
            To unlock the full Partner Dashboard, please complete all onboarding steps below.
          </p>
        </div>

        {/* Progress Overview Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Your Progress
              </h2>
            </div>
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {sections.filter(s => s.done).length} of {sections.length} completed
              </span>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative mb-8">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${(sections.filter(s => s.done).length / sections.length) * 100}%` }}
              />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg animate-pulse" 
                 style={{ left: `${(sections.filter(s => s.done).length / sections.length) * 100}%`, transform: 'translateX(-50%)' }}>
            </div>
          </div>

          {/* Modern Steps Grid */}
          <div className="grid gap-4 md:gap-6">
            {sections.map((section, index) => {
              const status = getStepStatus(section, index);
              const sectionIcons = ['🏢', '💰', '📋', '✅'];
              
              return (
                <div 
                  key={section.id} 
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                    status === 'completed' 
                      ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-green-900/20 shadow-emerald-100 dark:shadow-emerald-900/20' 
                      : status === 'available'
                      ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-blue-100 dark:shadow-blue-900/20'
                      : 'border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 dark:border-slate-700 dark:from-slate-800/50 dark:to-gray-800/50'
                  } shadow-lg`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Enhanced Step Circle */}
                        <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                          status === 'completed'
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25'
                            : status === 'available'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-600 dark:from-slate-600 dark:to-slate-700 dark:text-slate-400'
                        }`}>
                          {status === 'completed' ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-2xl">{sectionIcons[index]}</span>
                          )}
                          {status === 'completed' && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {section.title}
                          </h3>
                          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            {section.description}
                          </p>
                          {status === 'completed' && (
                            <div className="flex items-center mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Enhanced Action Button */}
                      <button
                        onClick={() => navigate(`/partner/onboarding/${section.id}`)}
                        disabled={status === 'locked'}
                        className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                          status === 'locked'
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                            : status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-lg hover:shadow-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-lg hover:shadow-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                        }`}
                      >
                        {status === 'completed' ? (
                          <span className="flex items-center space-x-2">
                            <span>Review</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        ) : status === 'available' ? (
                          <span className="flex items-center space-x-2">
                            <span>Start</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span>Locked</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10 dark:to-slate-800/10 pointer-events-none"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Main CTA */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate(ctaHref)}
            className="group relative inline-flex items-center justify-center px-12 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
          >
            <span className="relative z-10 flex items-center space-x-3">
              <span>{nextStep === 'review' ? 'Complete Review & Submit' : 'Continue Your Journey'}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          
          {current && (
            <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-700 dark:text-slate-300">
                  Status: <span className="font-semibold capitalize">{current.replace('_', ' ')}</span>
                </span>
              </div>
              {nextStep && (
                <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-full px-4 py-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-slate-700 dark:text-slate-300">
                    Next: <span className="font-semibold capitalize">{nextStep.replace('-', ' ')}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Help Section */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-slate-700/50 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Need Assistance?
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Our support team is here to help you through every step of the onboarding process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group p-6 bg-white/80 dark:bg-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Direct Support</h4>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Get immediate help from our expert support team via email or phone during business hours.
              </p>
              <div className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-medium">
                support@subgrant.com
              </div>
            </div>
            
            <div className="group p-6 bg-white/80 dark:bg-slate-700/50 rounded-2xl border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">Documentation</h4>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Access comprehensive guides, requirements checklists, and step-by-step tutorials.
              </p>
              <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                View onboarding guide →
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

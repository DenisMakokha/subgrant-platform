import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from './OnboardingLayout';
import { fetchWithAuth } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface FileUpload {
  key: string;
  originalName: string;
  mime: string;
  size: number;
  sha256: string;
  uploadedAt: string;
  version: number;
}

interface DocumentResponse {
  available: 'yes' | 'na';
  naExplanation?: string;
  note?: string;
  files?: FileUpload[];
  lastSubmittedAt?: string;
}

interface DocumentRequirement {
  code: string;
  title: string;
  isOptional: boolean;
  sortOrder: number;
  response?: DocumentResponse;
}

interface SectionCData {
  organizationStatus: string;
  requirements: Record<string, DocumentRequirement[]>;
  categories: string[];
}

const SectionC: React.FC = () => {
  const navigate = useNavigate();
  const { organization, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<SectionCData | null>(null);
  const [responses, setResponses] = useState<Record<string, DocumentResponse>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSectionC();
  }, []);

  const loadSectionC = async () => {
    try {
      const response = await fetchWithAuth('/api/onboarding/section-c');
      const sectionData = await response.json();
      
      setData(sectionData);
      
      // Initialize responses from existing data
      const initialResponses: Record<string, DocumentResponse> = {};
      Object.values(sectionData.requirements).flat().forEach((req) => {
        const requirement = req as DocumentRequirement;
        if (requirement.response) {
          initialResponses[requirement.code] = requirement.response;
        } else {
          initialResponses[requirement.code] = {
            available: 'yes',
            naExplanation: '',
            note: '',
            files: []
          };
        }
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Failed to load Section C:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (code: string, field: keyof DocumentResponse, value: any) => {
    setResponses(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (code: string, files: FileList) => {
    const file = files[0];
    if (!file) return;

    try {
      setUploadProgress(prev => ({ ...prev, [code]: 0 }));

      // Get presigned URL
      const presignResponse = await fetchWithAuth('/api/onboarding/section-c/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      const { url, fields, fileKey } = await presignResponse.json();

      // Simulate file upload progress (in real implementation, use actual S3 upload)
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[code] || 0;
          if (current >= 100) {
            clearInterval(uploadInterval);
            return prev;
          }
          return { ...prev, [code]: current + 10 };
        });
      }, 100);

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(uploadInterval);
        setUploadProgress(prev => ({ ...prev, [code]: 100 }));

        // Add file to response
        const newFile: FileUpload = {
          key: fileKey,
          originalName: file.name,
          mime: file.type,
          size: file.size,
          sha256: 'mock-hash-' + Date.now(),
          uploadedAt: new Date().toISOString(),
          version: 1
        };

        handleResponseChange(code, 'files', [...(responses[code]?.files || []), newFile]);
        
        // Clear progress after a moment
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[code];
            return newProgress;
          });
        }, 1000);
      }, 1500);

    } catch (error) {
      console.error('File upload failed:', error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[code];
        return newProgress;
      });
    }
  };

  const removeFile = (code: string, fileIndex: number) => {
    const currentFiles = responses[code]?.files || [];
    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex);
    handleResponseChange(code, 'files', updatedFiles);
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const documents = Object.entries(responses).map(([code, response]) => ({
        requirementCode: code,
        ...response
      }));

      await fetchWithAuth('/api/onboarding/section-c/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      // Show success message
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const submitApplication = async () => {
    setSubmitting(true);
    try {
      const documents = Object.entries(responses).map(([code, response]) => ({
        requirementCode: code,
        ...response
      }));

      // First save the documents
      await fetchWithAuth('/api/onboarding/section-c/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents })
      });

      // Then submit the complete application
      const response = await fetchWithAuth('/api/onboarding/section-c/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (response.ok) {
        await refreshSession(); // Refresh to get updated organization status
        navigate('/onboarding/review-status');
      } else {
        const errorData = await response.json();
        console.error('Submission failed:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to submit application:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      legal: 'Legal Documents',
      governance: 'Governance Documents',
      financial: 'Financial Documents',
      operational: 'Operational Documents',
      compliance: 'Compliance Documents',
      additional: 'Additional Documents'
    };
    return titles[category] || category;
  };

  if (loading) {
    return (
      <OnboardingLayout currentStep="section-c">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document requirements...</p>
        </div>
      </OnboardingLayout>
    );
  }

  if (!data) {
    return (
      <OnboardingLayout currentStep="section-c">
        <div className="p-8 text-center">
          <p className="text-red-600">Failed to load document requirements</p>
        </div>
      </OnboardingLayout>
    );
  }

  return (
    <OnboardingLayout currentStep="section-c" organizationStatus={data.organizationStatus}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Section C: Document Upload</h2>
          <p className="text-lg text-gray-600">
            Upload the required documents for your organization's verification. You can upload files directly or mark items as not applicable with an explanation if they don't apply to your organization type. Complete this section to submit your application for review.
          </p>
        </div>

        {/* Document Categories */}
        <div className="space-y-8">
          {data.categories.map(category => {
            const requirements = data.requirements[category] || [];
            if (requirements.length === 0) return null;

            return (
              <div key={category} className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  {getCategoryTitle(category)}
                </h3>
                
                <div className="space-y-6">
                  {requirements.map(req => {
                    const response = responses[req.code];
                    const progress = uploadProgress[req.code];
                    
                    return (
                      <div key={req.code} className="bg-white rounded-lg border p-6">
                        <div className="grid grid-cols-12 gap-4 items-start">
                          {/* Document Title */}
                          <div className="col-span-5">
                            <p className="text-xs font-light text-gray-600 leading-tight">{req.title}</p>
                            {!req.isOptional && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                Required
                              </span>
                            )}
                          </div>

                          {/* Available Dropdown */}
                          <div className="col-span-2">
                            <select
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              value={response?.available || 'yes'}
                              onChange={(e) => handleResponseChange(req.code, 'available', e.target.value)}
                            >
                              <option value="yes">Yes</option>
                              <option value="na">N/A</option>
                            </select>
                          </div>

                          {/* Upload/Explanation Area */}
                          <div className="col-span-3">
                            {response?.available === 'yes' ? (
                              <div>
                                <input
                                  type="file"
                                  id={`file-${req.code}`}
                                  className="hidden"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                  onChange={(e) => e.target.files && handleFileUpload(req.code, e.target.files)}
                                />
                                <label
                                  htmlFor={`file-${req.code}`}
                                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  Upload File
                                </label>
                                
                                {progress !== undefined && (
                                  <div className="mt-2">
                                    <div className="bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                {/* File List */}
                                {response?.files && response.files.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {response.files.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                        <span className="text-sm text-gray-700 truncate">{file.originalName}</span>
                                        <button
                                          onClick={() => removeFile(req.code, index)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <textarea
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows={3}
                                placeholder="Explain why this document is not available..."
                                value={response?.naExplanation || ''}
                                onChange={(e) => handleResponseChange(req.code, 'naExplanation', e.target.value)}
                              />
                            )}
                          </div>

                          {/* Notes */}
                          <div className="col-span-2">
                            <textarea
                              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-none"
                              placeholder="Notes (optional)"
                              rows={2}
                              value={response?.note || ''}
                              onChange={(e) => handleResponseChange(req.code, 'note', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => navigate('/onboarding/section-b')}
            className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Back to Section B
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={saveDraft}
              disabled={saving}
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            
            <button
              onClick={submitApplication}
              disabled={submitting}
              className="px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 font-semibold"
            >
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default SectionC;

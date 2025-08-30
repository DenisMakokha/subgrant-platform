import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationService } from '../services/organizationService';
import { Organization, ComplianceDocumentType } from '../types/organization';

// SVG Icons
const DocumentIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CloudArrowUpIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ComplianceManagement: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [complianceDocuments, setComplianceDocuments] = useState<ComplianceDocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationAndCompliance();
    }
  }, [organizationId]);

  const fetchOrganizationAndCompliance = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      const [orgData, complianceData] = await Promise.all([
        organizationService.getOrganizationById(organizationId),
        organizationService.getRequiredComplianceDocuments(organizationId)
      ]);
      setOrganization(orgData);
      setComplianceDocuments(complianceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentTypeId: string, file: File) => {
    if (!organizationId) return;

    try {
      setUploadingDocuments(prev => new Set(prev).add(documentTypeId));
      await organizationService.uploadComplianceDocument(organizationId, documentTypeId, file);
      await fetchOrganizationAndCompliance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setUploadingDocuments(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentTypeId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: <ClockIcon className="w-4 h-4" />
      },
      approved: { 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-800 dark:text-green-300',
        icon: <CheckCircleIcon className="w-4 h-4" />
      },
      rejected: { 
        bg: 'bg-red-100 dark:bg-red-900/30', 
        text: 'text-red-800 dark:text-red-300',
        icon: <ExclamationTriangleIcon className="w-4 h-4" />
      },
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Organization not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The requested organization could not be found.
        </p>
      </div>
    );
  }

  const completedDocuments = complianceDocuments.filter(doc => 
    doc.compliance_document && doc.compliance_document.status === 'approved'
  ).length;
  const totalRequired = complianceDocuments.filter(doc => doc.required).length;
  const completionPercentage = totalRequired > 0 ? (completedDocuments / totalRequired) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/partner-onboarding')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Compliance Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {organization.name} - Document compliance tracking
            </p>
          </div>
        </div>

        {/* Organization Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Organization</p>
              <p className="text-sm text-gray-900 dark:text-white">{organization.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{organization.legal_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              <div className="mt-1">
                {getStatusBadge(organization.status)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Status</p>
              <div className="mt-1">
                {getStatusBadge(organization.compliance_status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Progress */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Compliance Progress</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedDocuments} of {totalRequired} required documents completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {completionPercentage === 100 
            ? "All required compliance documents have been approved!" 
            : `${(100 - completionPercentage).toFixed(1)}% remaining to complete compliance requirements.`
          }
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Documents */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Required Compliance Documents
        </h2>

        <div className="space-y-6">
          {complianceDocuments.map((docType) => (
            <div key={docType.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {docType.name}
                    </h3>
                    {docType.required && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {docType.description}
                  </p>
                </div>
                
                {docType.compliance_document && (
                  <div className="ml-4">
                    {getStatusBadge(docType.compliance_document.status)}
                  </div>
                )}
              </div>

              {docType.compliance_document ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {docType.compliance_document.document_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Uploaded on {formatDate(docType.compliance_document.uploaded_at)}
                        </p>
                        {docType.compliance_document.reviewed_at && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Reviewed on {formatDate(docType.compliance_document.reviewed_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {docType.compliance_document.status === 'rejected' && (
                        <label className="btn-primary cursor-pointer">
                          <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                          Re-upload
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(docType.id, file);
                              }
                            }}
                            disabled={uploadingDocuments.has(docType.id)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                  
                  {docType.compliance_document.comments && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>Review Comments:</strong> {docType.compliance_document.comments}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label className="btn-primary cursor-pointer">
                        {uploadingDocuments.has(docType.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
                            Upload Document
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(docType.id, file);
                            }
                          }}
                          disabled={uploadingDocuments.has(docType.id)}
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {complianceDocuments.length === 0 && (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No compliance documents required</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This organization has no compliance document requirements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceManagement;

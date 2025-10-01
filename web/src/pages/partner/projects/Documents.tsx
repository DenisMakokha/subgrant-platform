import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

function buildQuery(params: Record<string, any>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') usp.append(k, String(v));
  });
  return usp.toString();
}

async function fetchSSOT(key: string, params: Record<string, any>) {
  const path = `/ssot/${key.replace(/\./g, '/')}`;
  const qs = buildQuery(params);
  return api.fetchWithAuth(`${path}${qs ? `?${qs}` : ''}`);
}

type DocCard = {
  id: string;
  name: string;
  type?: string;
  description?: string;
  uploaded_at?: string;
  file_size?: number;
};

type ComplianceRequirement = {
  id: string;
  name: string;
  description: string;
  required_by?: string;
  document_type: string;
  is_recurring: boolean;
};

type ComplianceDocument = {
  id: string;
  requirement_id: string;
  requirement_name: string;
  status: 'submitted' | 'approved' | 'rejected' | 'expired';
  submitted_at: string;
  approved_at?: string;
  expires_at?: string;
  original_name: string;
  file_size: number;
};

export default function Documents() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [activeTab, setActiveTab] = useState<'project' | 'compliance'>('project');
  
  // Project Documents State
  const [docs, setDocs] = useState<DocCard[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Compliance State
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [complianceDocs, setComplianceDocs] = useState<ComplianceDocument[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState<string | null>(null);

  // Load Project Documents
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setDocsLoading(true);
        const res = await fetchSSOT('docs.list', { projectId, partnerId });
        if (!mounted) return;
        setDocs(Array.isArray(res) ? res : res?.items || []);
      } catch (e: any) {
        if (!mounted) return;
        setDocsError(e?.message || 'Failed to load documents');
      } finally {
        if (mounted) setDocsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [projectId, partnerId]);

  // Load Compliance Data
  useEffect(() => {
    if (activeTab !== 'compliance') return;
    
    let mounted = true;
    async function loadCompliance() {
      try {
        setComplianceLoading(true);
        
        // Load requirements and documents in parallel
        const [reqRes, docsRes] = await Promise.all([
          api.fetchWithAuth('/api/partner/compliance/requirements'),
          api.fetchWithAuth('/api/partner/compliance/documents')
        ]);
        
        if (!mounted) return;
        setRequirements(reqRes?.requirements || []);
        setComplianceDocs(docsRes?.documents || []);
      } catch (e: any) {
        if (!mounted) return;
        setComplianceError(e?.message || 'Failed to load compliance data');
      } finally {
        if (mounted) setComplianceLoading(false);
      }
    }
    loadCompliance();
    return () => { mounted = false; };
  }, [activeTab]);

  const downloadProjectDoc = async (id: string) => {
    try {
      const res = await fetchSSOT('doc.download', { id });
      const url = res?.url;
      if (url) window.open(url, '_blank');
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'expired': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Documents & Compliance</h1>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('project')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'project'
                ? 'bg-white text-blue-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Project Documents
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'compliance'
                ? 'bg-white text-blue-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Compliance Documents
          </button>
        </div>
      </div>

      {/* Project Documents Tab */}
      {activeTab === 'project' && (
        <div>
          {docsLoading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : docsError ? (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{docsError}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {docs.map(d => (
                <div key={d.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 mb-1">{d.type || 'Document'}</div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{d.name}</h3>
                    </div>
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L13.293 3.293A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {d.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{d.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    {d.file_size && (
                      <span className="text-xs text-slate-500">{formatFileSize(d.file_size)}</span>
                    )}
                    <button 
                      onClick={() => downloadProjectDoc(d.id)} 
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
              {docs.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L13.293 3.293A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-slate-500">No project documents available</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compliance Documents Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {complianceLoading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : complianceError ? (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{complianceError}</div>
          ) : (
            <>
              {/* Compliance Requirements */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Compliance Requirements</h2>
                <div className="space-y-3">
                  {requirements.map(req => (
                    <div key={req.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 dark:text-white">{req.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{req.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Type: {req.document_type}</span>
                            {req.required_by && <span>Required by: {new Date(req.required_by).toLocaleDateString()}</span>}
                            {req.is_recurring && <span className="text-amber-600">🔄 Recurring</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {requirements.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No compliance requirements</p>
                  )}
                </div>
              </div>

              {/* Submitted Compliance Documents */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Submitted Documents</h2>
                <div className="space-y-3">
                  {complianceDocs.map(doc => (
                    <div key={doc.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-slate-900 dark:text-white">{doc.requirement_name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{doc.original_name}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span>Submitted: {new Date(doc.submitted_at).toLocaleDateString()}</span>
                            {doc.approved_at && <span>Approved: {new Date(doc.approved_at).toLocaleDateString()}</span>}
                            {doc.expires_at && (
                              <span className={new Date(doc.expires_at) < new Date() ? 'text-rose-600 font-medium' : ''}>
                                Expires: {new Date(doc.expires_at).toLocaleDateString()}
                              </span>
                            )}
                            <span>{formatFileSize(doc.file_size)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {complianceDocs.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-slate-500">No compliance documents submitted yet</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import ApprovalStatusTracker from '../../../components/approvals/ApprovalStatusTracker';

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

type Contract = {
  id: string;
  number: string;
  title?: string;
  amount?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  state: string;
  signedAt?: string;
  approval_request_id?: string;
};

type Disbursement = {
  id: string;
  amount: number;
  currency: string;
  scheduled_date?: string;
  paid_date?: string;
  status: 'scheduled' | 'pending' | 'approved' | 'paid' | 'cancelled';
  description?: string;
  reference_number?: string;
};

export default function Contracts() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [activeTab, setActiveTab] = useState<'contracts' | 'disbursements'>('contracts');
  
  // Contracts State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);

  // Disbursements State
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [disbursementsLoading, setDisbursementsLoading] = useState(false);
  const [disbursementsError, setDisbursementsError] = useState<string | null>(null);

  // Load Contracts
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setContractsLoading(true);
        const res = await fetchSSOT('contract.list', { partnerId, projectId });
        if (!mounted) return;
        setContracts(Array.isArray(res) ? res : res?.items || []);
      } catch (e: any) {
        if (!mounted) return;
        setContractsError(e?.message || 'Failed to load contracts');
      } finally {
        if (mounted) setContractsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [partnerId, projectId]);

  // Load Disbursements
  useEffect(() => {
    if (activeTab !== 'disbursements') return;
    
    let mounted = true;
    async function loadDisbursements() {
      try {
        setDisbursementsLoading(true);
        const res = await api.fetchWithAuth('/api/partner/finance/disbursements');
        if (!mounted) return;
        setDisbursements(res?.disbursements || []);
      } catch (e: any) {
        if (!mounted) return;
        setDisbursementsError(e?.message || 'Failed to load disbursements');
      } finally {
        if (mounted) setDisbursementsLoading(false);
      }
    }
    loadDisbursements();
    return () => { mounted = false; };
  }, [activeTab]);

  const downloadContract = async (id: string, type: 'approved' | 'signed') => {
    try {
      const res = await fetchSSOT(`contract.download.${type}`, { id });
      const url = res?.url;
      if (url) window.open(url, '_blank');
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const getContractStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
      case 'pending_signature': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'signed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'expired': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getDisbursementStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
      case 'pending': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Contracts & Disbursements</h1>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'contracts'
                ? 'bg-white text-blue-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Contracts
          </button>
          <button
            onClick={() => setActiveTab('disbursements')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'disbursements'
                ? 'bg-white text-blue-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Disbursements & Payments
          </button>
        </div>
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div>
          {contractsLoading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : contractsError ? (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{contractsError}</div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Contracts</h2>
              </div>
              
              {contracts.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500">No contracts available</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {contracts.map(contract => (
                    <div key={contract.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {contract.title || `Contract ${contract.number}`}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getContractStateColor(contract.state)}`}>
                              {contract.state}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Contract #{contract.number}</p>
                        </div>
                        {contract.amount && (
                          <div className="text-right">
                            <div className="text-xl font-bold text-slate-900 dark:text-white">
                              {formatCurrency(contract.amount, contract.currency)}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
                        <div className="flex items-center gap-4">
                          {contract.start_date && (
                            <span>Start: {new Date(contract.start_date).toLocaleDateString()}</span>
                          )}
                          {contract.end_date && (
                            <span>End: {new Date(contract.end_date).toLocaleDateString()}</span>
                          )}
                          {contract.signedAt && (
                            <span>Signed: {new Date(contract.signedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button 
                          onClick={() => downloadContract(contract.id, 'approved')} 
                          className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium"
                        >
                          Download Approved
                        </button>
                        {contract.state.toLowerCase() === 'signed' && (
                          <button 
                            onClick={() => downloadContract(contract.id, 'signed')} 
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 transition-colors text-sm font-medium"
                          >
                            Download Signed
                          </button>
                        )}
                      </div>

                      {/* Approval Status Tracker */}
                      {contract.approval_request_id && (
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <ApprovalStatusTracker 
                            requestId={contract.approval_request_id}
                            onCancel={async () => {
                              // Refresh contracts after cancellation
                              const res = await fetchSSOT('contract.list', { partnerId, projectId });
                              setContracts(Array.isArray(res) ? res : res?.items || []);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Disbursements Tab */}
      {activeTab === 'disbursements' && (
        <div>
          {disbursementsLoading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : disbursementsError ? (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{disbursementsError}</div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Schedule & History</h2>
              </div>
              
              {disbursements.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-slate-500">No disbursements scheduled</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {disbursements.map(disbursement => (
                    <div key={disbursement.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {formatCurrency(disbursement.amount, disbursement.currency)}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDisbursementStatusColor(disbursement.status)}`}>
                              {disbursement.status}
                            </span>
                          </div>
                          {disbursement.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">{disbursement.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        {disbursement.scheduled_date && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Scheduled: {new Date(disbursement.scheduled_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {disbursement.paid_date && (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-green-600 font-medium">Paid: {new Date(disbursement.paid_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {disbursement.reference_number && (
                          <span>Ref: {disbursement.reference_number}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

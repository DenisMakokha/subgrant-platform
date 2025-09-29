// src/pages/gm/GMDashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { fetchWithAuth } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface QueueItem {
  id: number;
  name: string;
  status: string;
  created_at: string;
  sector?: string;
  country?: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  document_count: number;
}

interface OrgDetailsResponse {
  organization: any;
  owner: { email: string; first_name: string; last_name: string };
  financial_assessment: null | {
    currentAnnualBudget?: { amountUsd: number; year: number };
    nextYearAnnualBudgetEstimate?: { amountUsd: number; year: number };
    largestGrantEverManaged?: { amountUsd: number; year: number };
    currentDonorFunding?: { amountUsd: number; year: number };
    otherFunds?: { amountUsd: number; year: number };
  };
  documents: Array<{
    code: string;
    title: string;
    category: string;
    is_optional: boolean;
    available: string | null;
    na_explanation: string | null;
    note: string | null;
    files: Array<{ name?: string; url?: string; key?: string }>;
    updated_at: string | null;
  }>;
  document_summary: { required_total: number; required_complete: number; required_missing: number };
}

export default function GMDashboard() {
  const { modules } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [summary, setSummary] = useState<any>(modules?.reviewer || null);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [details, setDetails] = useState<OrgDetailsResponse | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null);

  // Change request modal
  const [crOpen, setCrOpen] = useState(false);
  const [crReason, setCrReason] = useState('');
  const [crSections, setCrSections] = useState<string[]>([]);
  const [crSubmitting, setCrSubmitting] = useState(false);

  useEffect(() => {
    loadQueue();
    // Initialize summary from session, fallback to API
    if (!modules?.reviewer) {
      fetchWithAuth('/review/summaries')
        .then(data => setSummary(data.reviewer))
        .catch(err => console.warn('Failed to load reviewer summaries:', err));
    }
  }, []);

  // Keep summary in sync with session updates
  useEffect(() => {
    if (modules?.reviewer) {
      setSummary(modules.reviewer);
    }
  }, [modules?.reviewer]);

  const loadQueue = async () => {
    try {
      setError(null);
      const data = await fetchWithAuth('/review/gm/queue');
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load GM queue:', error);
      setError('Failed to load GM queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const decide = async (
    orgId: number,
    decision: 'approve' | 'changes_requested' | 'reject',
    extra?: { reason?: string; sections?: string[] }
  ) => {
    setProcessing(orgId);
    try {
      await fetchWithAuth(`/review/gm/${orgId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, ...(extra || {}) })
      });
      // Remove item from queue upon success
      setItems(items.filter(item => item.id !== orgId));
      if (activeOrgId === orgId) {
        setDetailsOpen(false);
        setDetails(null);
        setActiveOrgId(null);
      }
    } catch (error) {
      console.error('Decision failed:', error);
      alert('Failed to process decision');
    } finally {
      setProcessing(null);
    }
  };

  const openDetails = async (orgId: number) => {
    setActiveOrgId(orgId);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsError(null);
    try {
      const data = await fetchWithAuth(`/review/gm/organization/${orgId}`);
      setDetails(data);
      // initialize change-request sections with common groups
      const baseSections = ['Section A: Organization Profile', 'Section B: Financial Assessment', 'Section C: Documents'];
      setCrSections(baseSections);
    } catch (e: any) {
      console.error('Failed to load organization details', e);
      setDetailsError('Failed to load organization details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const groupedDocs = useMemo(() => {
    if (!details?.documents) return {} as Record<string, OrgDetailsResponse['documents']>;
    return details.documents.reduce((acc: any, d) => {
      acc[d.category] = acc[d.category] || [];
      acc[d.category].push(d);
      return acc;
    }, {} as Record<string, OrgDetailsResponse['documents']>);
  }, [details]);

  const toggleCrSection = (s: string) => {
    setCrSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysWaiting = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-800 p-3 flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold">Could not load queue</div>
            <div className="text-xs opacity-80">{error}</div>
          </div>
          <button
            onClick={() => { setLoading(true); loadQueue(); }}
            className="ml-4 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Grants Manager Review Queue</h1>
        <p className="text-gray-600 mt-1">
          {items.length} organization{items.length !== 1 ? 's' : ''} awaiting GM review
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500">Total in Queue</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.queue?.total ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-yellow-200 shadow-sm">
            <div className="text-sm text-yellow-700">Aging ≥ 3 days</div>
            <div className="mt-1 text-2xl font-semibold text-yellow-900">{summary.queue?.aging_3_days ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-sm">
            <div className="text-sm text-orange-700">Aging ≥ 7 days</div>
            <div className="mt-1 text-2xl font-semibold text-orange-900">{summary.queue?.aging_7_days ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-red-200 shadow-sm">
            <div className="text-sm text-red-700">Aging ≥ 14 days</div>
            <div className="mt-1 text-2xl font-semibold text-red-900">{summary.queue?.aging_14_days ?? 0}</div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No organizations in queue</div>
          <p className="text-gray-500 mt-2">All caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {summary?.sectors?.length > 0 && (
            <div className="mb-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Sector breakdown</div>
              <div className="flex flex-wrap gap-2">
                {summary.sectors.map((s: any) => (
                  <span key={s.sector} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                    {s.sector}: {s.count}
                  </span>
                ))}
              </div>
            </div>
          )}
          {items.map(item => {
            const daysWaiting = getDaysWaiting(item.created_at);
            const isUrgent = daysWaiting >= 7;
            const isAging = daysWaiting >= 3;

            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-xl border-2 transition-all ${
                  isUrgent ? 'border-red-200 bg-red-50' : 
                  isAging ? 'border-yellow-200 bg-yellow-50' : 
                  'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {isUrgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          URGENT - {daysWaiting} days
                        </span>
                      )}
                      {isAging && !isUrgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          {daysWaiting} days waiting
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Contact:</span> {item.owner_first_name} {item.owner_last_name}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {item.owner_email}
                      </div>
                      {item.sector && (
                        <div>
                          <span className="font-medium">Sector:</span> {item.sector}
                        </div>
                      )}
                      {item.country && (
                        <div>
                          <span className="font-medium">Country:</span> {item.country}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Documents:</span> {item.document_count}
                      </div>
                      <div>
                        <span className="font-medium">Submitted:</span> {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-6">
                    <button
                      onClick={() => openDetails(item.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View details
                    </button>
                    <button
                      onClick={() => decide(item.id, 'approve')}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing === item.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => { setActiveOrgId(item.id); setCrOpen(true); setCrReason(''); }}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt('Optional: provide a reason for rejection');
                        decide(item.id, 'reject', { reason: reason || undefined });
                      }}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    {detailsOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Organization Details</h2>
              {details?.organization?.name && (
                <div className="text-sm text-gray-600">{details.organization.name}</div>
              )}
            </div>
            <button onClick={() => { setDetailsOpen(false); setDetails(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          {detailsLoading ? (
            <div className="p-6">Loading...</div>
          ) : detailsError ? (
            <div className="p-6 text-red-600">{detailsError}</div>
          ) : details ? (
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="text-xs text-gray-500">Required Docs</div>
                  <div className="text-lg font-semibold">{details.document_summary.required_complete}/{details.document_summary.required_total}</div>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="text-xs text-gray-500">Missing Required</div>
                  <div className="text-lg font-semibold text-red-600">{details.document_summary.required_missing}</div>
                </div>
                {details.organization?.country && (
                  <div className="p-4 rounded-lg border bg-gray-50">
                    <div className="text-xs text-gray-500">Country</div>
                    <div className="text-lg font-semibold">{details.organization.country}</div>
                  </div>
                )}
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="text-xs text-gray-500">Owner</div>
                  <div className="text-sm">{details.owner?.first_name} {details.owner?.last_name}</div>
                  <div className="text-xs text-gray-500">{details.owner?.email}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Section A: Organization Profile</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <Info label="Legal Name" value={details.organization?.legal_name} />
                  <Info label="Registration No" value={details.organization?.registration_number} />
                  <Info label="Tax ID" value={details.organization?.tax_id} />
                  <Info label="Legal Structure" value={details.organization?.legal_structure} />
                  <Info label="Year Established" value={details.organization?.year_established} />
                  <Info label="Email" value={details.organization?.email} />
                  <Info label="Phone" value={details.organization?.phone} />
                  <Info label="Website" value={details.organization?.website} />
                  <Info label="Primary Contact" value={details.organization?.primary_contact_name} />
                  <Info label="Contact Title" value={details.organization?.primary_contact_title} />
                  <Info label="Contact Email" value={details.organization?.primary_contact_email} />
                  <Info label="Contact Phone" value={details.organization?.primary_contact_phone} />
                  <Info label="Address" value={details.organization?.address} />
                  <Info label="City" value={details.organization?.city} />
                  <Info label="State/Province" value={details.organization?.state_province} />
                  <Info label="Postal Code" value={details.organization?.postal_code} />
                  <Info label="Country" value={details.organization?.country} />
                  <Info label="Bank Name" value={details.organization?.bank_name} />
                  <Info label="Bank Branch" value={details.organization?.bank_branch} />
                  <Info label="Account Name" value={details.organization?.account_name} />
                  <Info label="Account Number" value={details.organization?.account_number} />
                  <Info label="SWIFT Code" value={details.organization?.swift_code} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Section B: Financial Assessment</h3>
                </div>
                {details.financial_assessment ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <Info label="Current Budget (USD)" value={details.financial_assessment.currentAnnualBudget?.amountUsd} />
                    <Info label="Current Budget Year" value={details.financial_assessment.currentAnnualBudget?.year} />
                    <Info label="Next Year Estimate (USD)" value={details.financial_assessment.nextYearAnnualBudgetEstimate?.amountUsd} />
                    <Info label="Next Year" value={details.financial_assessment.nextYearAnnualBudgetEstimate?.year} />
                    <Info label="Largest Grant (USD)" value={details.financial_assessment.largestGrantEverManaged?.amountUsd} />
                    <Info label="Largest Grant Year" value={details.financial_assessment.largestGrantEverManaged?.year} />
                    <Info label="Current Donor Funding (USD)" value={details.financial_assessment.currentDonorFunding?.amountUsd} />
                    <Info label="Current Donor Funding Year" value={details.financial_assessment.currentDonorFunding?.year} />
                    <Info label="Other Funds (USD)" value={details.financial_assessment.otherFunds?.amountUsd} />
                    <Info label="Other Funds Year" value={details.financial_assessment.otherFunds?.year} />
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No financial assessment found.</div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Section C: Document Upload</h3>
                </div>
                {Object.keys(groupedDocs).length === 0 ? (
                  <div className="text-sm text-gray-500">No documents found.</div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedDocs).map(([category, docs]) => {
                      const docsArr = docs as OrgDetailsResponse['documents'];
                      return (
                        <div key={category} className="border rounded-lg">
                          <div className="px-4 py-2 bg-gray-50 border-b font-medium text-gray-700">{category}</div>
                          <div className="divide-y">
                            {docsArr.map((d: OrgDetailsResponse['documents'][number]) => {
                              const ok = (d.available === 'yes' && d.files && d.files.length > 0) || (d.available === 'na' && !!d.na_explanation);
                              return (
                                <div key={d.code} className="px-4 py-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="font-medium text-gray-900">{d.title}</div>
                                      <div className="text-xs text-gray-500">Code: {d.code}{d.is_optional ? ' • optional' : ''}</div>
                                      <div className="mt-1 text-sm">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                          {ok ? 'Complete' : 'Incomplete'}
                                        </span>
                                        {d.available === 'na' && d.na_explanation && (
                                          <span className="ml-2 text-xs text-gray-600">N/A: {d.na_explanation}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right text-sm text-gray-600 min-w-[220px]">
                                      {d.files && d.files.length > 0 ? (
                                        <ul className="space-y-1">
                                          {d.files.map((f: { name?: string; url?: string; key?: string }, idx: number) => (
                                            <li key={idx} className="truncate">
                                              {f.url ? (
                                                <a href={f.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{f.name || f.key || 'Document'}</a>
                                              ) : (
                                                <span>{f.name || f.key || 'Document'}</span>
                                              )}
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <span className="text-xs text-gray-500">No files</span>
                                      )}
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
                )}
              </div>
            </div>
          ) : null}

          <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
            {activeOrgId && (
              <>
                <button
                  onClick={() => decide(activeOrgId, 'approve')}
                  disabled={processing === activeOrgId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing === activeOrgId ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => { setCrOpen(true); setCrReason(''); }}
                  disabled={processing === activeOrgId}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => {
                    const reason = window.prompt('Optional: provide a reason for rejection');
                    decide(activeOrgId, 'reject', { reason: reason || undefined });
                  }}
                  disabled={processing === activeOrgId}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            <button onClick={() => { setDetailsOpen(false); setDetails(null); }} className="ml-auto px-3 py-2 text-gray-600 hover:text-gray-800">Close</button>
          </div>
        </div>
      </div>
    )}

    {crOpen && activeOrgId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Request Changes</h3>
            <button onClick={() => setCrOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <textarea
                value={crReason}
                onChange={(e) => setCrReason(e.target.value)}
                rows={4}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Provide a brief summary of the changes requested"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">Sections</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Section A: Organization Profile', 'Section B: Financial Assessment', 'Section C: Documents'].map(s => (
                  <label key={s} className="inline-flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={crSections.includes(s)} onChange={() => toggleCrSection(s)} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
              {details?.documents && details.documents.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Specific documents (optional)</div>
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {details.documents.map((d) => (
                      <label key={d.code} className="block text-xs py-0.5">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={crSections.includes(d.title)}
                          onChange={() => toggleCrSection(d.title)}
                        />
                        {d.title}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
            <button onClick={() => setCrOpen(false)} className="px-3 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button
              onClick={async () => {
                try {
                  setCrSubmitting(true);
                  await decide(activeOrgId, 'changes_requested', { reason: crReason || undefined, sections: crSections });
                  setCrOpen(false);
                } finally {
                  setCrSubmitting(false);
                }
              }}
              disabled={crSubmitting}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {crSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}

// Small info display
function Info({ label, value }: { label: string; value: any }) {
  if (value === undefined || value === null || value === '') return (
    <div className="text-xs text-gray-400">{label}: —</div>
  );
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm text-gray-900 truncate">{String(value)}</div>
    </div>
  );
}

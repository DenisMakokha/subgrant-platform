import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import ApprovalStatusTracker from '../../../components/approvals/ApprovalStatusTracker';

// Util copied to match SSoT usage pattern
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

// Types
export type FundRequestItem = {
  id: string;
  requested_at: string;
  amount: number;
  currency?: string;
  purpose: string;
  description?: string;
  period_start?: string;
  period_end?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | string;
  submitted_at?: string;
  updated_at?: string;
  approval_request_id?: string;
};

export default function FundRequest() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [items, setItems] = useState<FundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const list = await fetchSSOT('fundRequest.list', { projectId, partnerId });
      const data = Array.isArray(list) ? list : list?.items || [];
      setItems(data);
    } catch (e: any) {
      console.error('FundRequest list failed', e);
      setError(e?.message || 'Failed to load fund requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, partnerId]);

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setCurrency('KES');
    setPurpose('');
    setDescription('');
    setPeriodStart('');
    setPeriodEnd('');
    setShowForm(false);
  };

  const saveDraft = async () => {
    if (!projectId || !partnerId) return;
    const amt = Number(amount);
    if (!amt || amt <= 0 || !purpose.trim()) return;
    try {
      setSubmitting(true);
      const endpoint = editingId ? 'fundRequest.update' : 'fundRequest.create';
      await fetchSSOT(endpoint, {
        id: editingId,
        projectId,
        partnerId,
        amount: amt,
        currency,
        purpose,
        description,
        period_start: periodStart || undefined,
        period_end: periodEnd || undefined,
        status: 'draft'
      });
      resetForm();
      await load();
    } catch (e) {
      console.error('Save draft failed', e);
      setError('Failed to save draft');
    } finally {
      setSubmitting(false);
    }
  };

  const submitRequest = async (id?: string) => {
    const requestId = id || editingId;
    if (!requestId && (!projectId || !partnerId)) return;
    
    try {
      setSubmitting(true);
      if (requestId) {
        // Submit existing draft
        await fetchSSOT('fundRequest.submit', { id: requestId });
      } else {
        // Create and submit new request
        const amt = Number(amount);
        if (!amt || amt <= 0 || !purpose.trim()) return;
        await fetchSSOT('fundRequest.create', {
          projectId,
          partnerId,
          amount: amt,
          currency,
          purpose,
          description,
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
          status: 'submitted'
        });
      }
      resetForm();
      await load();
    } catch (e) {
      console.error('Submit fund request failed', e);
      setError('Failed to submit fund request');
    } finally {
      setSubmitting(false);
    }
  };

  const editDraft = (item: FundRequestItem) => {
    setEditingId(item.id);
    setAmount(item.amount.toString());
    setCurrency(item.currency || 'KES');
    setPurpose(item.purpose);
    setDescription(item.description || '');
    setPeriodStart(item.period_start || '');
    setPeriodEnd(item.period_end || '');
    setShowForm(true);
  };

  const deleteDraft = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      await fetchSSOT('fundRequest.delete', { id });
      await load();
    } catch (e) {
      console.error('Delete draft failed', e);
      setError('Failed to delete draft');
    }
  };

  if (loading) return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{error}</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
      case 'submitted': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'under_review': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'paid': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Fund Requests</h1>
            <p className="text-blue-100">Request project funds from the grants team</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingId ? 'Edit Fund Request' : 'New Fund Request'}
            </h2>
            <button
              onClick={resetForm}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Currency</label>
                <select 
                  value={currency} 
                  onChange={e => setCurrency(e.target.value)} 
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2"
                >
                  <option>KES</option>
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2"
                  min={0}
                  step="0.01"
                  required
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Purpose *</label>
              <input
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Brief title for the request"
                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detailed description of what the funds will be used for..."
                rows={4}
                className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2"
              />
            </div>

            {/* Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Period Start</label>
                <input 
                  type="date" 
                  value={periodStart} 
                  onChange={e => setPeriodStart(e.target.value)} 
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Period End</label>
                <input 
                  type="date" 
                  value={periodEnd} 
                  onChange={e => setPeriodEnd(e.target.value)} 
                  className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2" 
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={resetForm}
                disabled={submitting}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveDraft}
                disabled={submitting || !Number(amount) || !purpose.trim()}
                className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={() => submitRequest()}
                disabled={submitting || !Number(amount) || !purpose.trim()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Fund Requests</h2>
          <div className="text-sm text-slate-500">
            {items.length} {items.length === 1 ? 'request' : 'requests'}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 mb-4">No fund requests yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              Create Your First Request
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.purpose}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.description}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.currency || 'KES'} {Number(item.amount).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Requested: {new Date(item.requested_at).toLocaleDateString()}</span>
                    </div>
                    {item.period_start && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Period: {item.period_start}{item.period_end ? ` - ${item.period_end}` : ''}</span>
                      </div>
                    )}
                  </div>

                  {item.status === 'draft' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editDraft(item)}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => submitRequest(item.id)}
                        className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => deleteDraft(item.id)}
                        className="px-3 py-1 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Approval Status Tracker for submitted requests */}
                {item.status !== 'draft' && item.approval_request_id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <ApprovalStatusTracker 
                      requestId={item.approval_request_id}
                      onCancel={() => load()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

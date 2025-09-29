import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

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
  period_start?: string;
  period_end?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | string;
};

export default function FundRequest() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [items, setItems] = useState<FundRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [purpose, setPurpose] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const submit = async () => {
    if (!projectId || !partnerId) return;
    const amt = Number(amount);
    if (!amt || amt <= 0 || !purpose.trim()) return;
    try {
      setSubmitting(true);
      await fetchSSOT('fundRequest.create', {
        projectId,
        partnerId,
        amount: amt,
        currency,
        purpose,
        period_start: periodStart || undefined,
        period_end: periodEnd || undefined,
      });
      setAmount('');
      setPurpose('');
      setPeriodStart('');
      setPeriodEnd('');
      await load();
    } catch (e) {
      console.error('Create fund request failed', e);
      setError('Failed to submit fund request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">Fund Request</div>
            <div className="text-sm text-slate-500">Request project funds from the grants team</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-4">New Request</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Amount</label>
            <div className="flex gap-2">
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-24 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
                <option>KES</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2"
                min={0}
                step="0.01"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Purpose</label>
            <input
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Brief description of the request"
              className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:col-span-1">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Period Start</label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Period End</label>
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm px-3 py-2" />
            </div>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              onClick={submit}
              disabled={submitting || !Number(amount) || !purpose.trim()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Previous Requests</div>
        {items.length === 0 ? (
          <div className="text-sm text-slate-500">No fund requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Requested On</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Purpose</th>
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="py-2 pr-4">{new Date(it.requested_at).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 font-medium">{it.currency || currency} {Number(it.amount).toLocaleString()}</td>
                    <td className="py-2 pr-4">{it.purpose}</td>
                    <td className="py-2 pr-4">{it.period_start || '—'}{it.period_end ? ` → ${it.period_end}` : ''}</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {it.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

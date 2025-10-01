import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../services/api';

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

async function executeSSOTAction(actionKey: string, payload: Record<string, any>) {
  return api.fetchWithAuth('/ssot/action', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ actionKey, payload }),
  });
}

type ApprovedLine = {
  id: string;
  category: string;
  description: string;
  total: number;
  spentCumulative?: number;
  remaining?: number;
  evidenceCount?: number;
};

export default function Reconciliation() {
  const { projectId } = useParams<{ projectId: string }>();
  const [partnerBudgetId, setPartnerBudgetId] = useState<string>('');
  const [lines, setLines] = useState<ApprovedLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try { setPartnerBudgetId(localStorage.getItem('currentPartnerBudgetId') || ''); } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!partnerBudgetId) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await fetchSSOT('recon.summary', { partnerBudgetId });
        if (!mounted) return;
        setLines(res?.lines || []);
      } catch (e: any) {
        console.error('Recon load failed', e);
        if (!mounted) return;
        setError(e?.message || 'Failed to load approved lines');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [partnerBudgetId, projectId]);

  const [form, setForm] = useState<{ lineId: string; amount: string; spentAt: string; file?: File | null; note?: string }>({ lineId: '', amount: '', spentAt: '' });
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setForm(prev => ({ ...prev, file }));
  };

  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!form.lineId || !form.amount || !form.spentAt) return;
    try {
      setSubmitting(true);
      // Convert file to base64 if present
      let documentBuffer = null;
      if (form.file) {
        documentBuffer = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(Buffer.from(arrayBuffer));
          };
          reader.readAsArrayBuffer(form.file!);
        });
      }

      const payload: any = {
        partnerBudgetLineId: form.lineId,
        amount: form.amount,
        spentAt: form.spentAt,
        documentBuffer,
        documentName: form.file?.name || 'evidence',
        note: form.note
      };
      
      await executeSSOTAction('recon.upload', payload);
      setForm({ lineId: '', amount: '', spentAt: '', file: null, note: '' });
      
      // refresh summary
      const res = await fetchSSOT('recon.summary', { partnerBudgetId });
      setLines(res?.lines || []);
    } catch (e) {
      console.error('Upload evidence failed', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div>;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Reconciliation</h1>
        <p className="text-blue-100">Upload spending evidence and track budget utilization</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Approved Budget Lines</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-slate-50 dark:bg-slate-700/50">
                {['Description','Approved','Spent (Cum)','Remaining','Evidence'].map(h => (
                  <th key={h} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map(l => (
                <tr key={l.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-6 py-3">{l.description}</td>
                  <td className="px-6 py-3">${l.total?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-3">${l.spentCumulative?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-3">${l.remaining?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-3">{l.evidenceCount || 0}</td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr><td className="px-6 py-6 text-center text-slate-500" colSpan={6}>No approved lines</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Upload Evidence</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select name="lineId" value={form.lineId} onChange={onChange} className="rounded-lg border-slate-300 dark:border-slate-600">
            <option value="">Select Line</option>
            {lines.map(l => (<option value={l.id} key={l.id}>{l.description}</option>))}
          </select>
          <input type="number" name="amount" value={form.amount} onChange={onChange} placeholder="Amount" className="rounded-lg border-slate-300 dark:border-slate-600" />
          <input type="date" name="spentAt" value={form.spentAt} onChange={onChange} className="rounded-lg border-slate-300 dark:border-slate-600" />
          <input type="file" onChange={onFile} className="rounded-lg border-slate-300 dark:border-slate-600" />
          <button disabled={submitting || !form.lineId || !form.amount || !form.spentAt} onClick={submit} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50">{submitting ? 'Uploading...' : 'Upload'}</button>
        </div>
        <textarea name="note" value={form.note || ''} onChange={onChange} placeholder="Note (optional)" className="mt-3 w-full rounded-lg border-slate-300 dark:border-slate-600" rows={2} />
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
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

type HistoryItem = { id: string; type: string; period: string; status: string; submittedAt?: string; approval_request_id?: string; };

type CalendarEntry = { id: string; date: string; type: string; period?: string; title?: string };

export default function Reports() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [narrativePeriod, setNarrativePeriod] = useState('');
  const [narrativeFile, setNarrativeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [cal, hist] = await Promise.all([
          fetchSSOT('report.schedule', { projectId, partnerId }),
          fetchSSOT('report.history', { projectId, partnerId })
        ]);
        if (!mounted) return;
        setCalendar(Array.isArray(cal) ? cal : cal?.items || []);
        setHistory(Array.isArray(hist) ? hist : hist?.items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [projectId, partnerId]);

  const exportFinancial = async () => {
    await fetchSSOT('report.generate.financial', { periodStart, periodEnd, projectId, partnerId });
  };

  const submitNarrative = async () => {
    if (!narrativePeriod || !narrativeFile) return;
    try {
      setSubmitting(true);
      await fetchSSOT('report.submit.narrative', { period: narrativePeriod, projectId, partnerId });
      setNarrativePeriod('');
      setNarrativeFile(null);
      const hist = await fetchSSOT('report.history', { projectId, partnerId });
      setHistory(Array.isArray(hist) ? hist : hist?.items || []);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">M&E Reports</h1>
        <p className="text-blue-100">Manage monitoring and evaluation reports for your project</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Reporting Calendar</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {calendar.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="text-xs text-slate-500">{new Date(ev.date).toLocaleDateString()}</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{ev.title || ev.type}</div>
                {ev.period && <div className="text-xs text-slate-500">Period: {ev.period}</div>}
              </div>
            ))}
            {calendar.length === 0 && <div className="text-sm text-slate-500">No scheduled reports</div>}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Export Financial (XLSX)</div>
            <div className="space-y-2">
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full rounded-lg border-slate-300 dark:border-slate-600" />
              <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full rounded-lg border-slate-300 dark:border-slate-600" />
              <button onClick={exportFinancial} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">Export</button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Submit Narrative Report</div>
            <div className="space-y-2">
              <input type="text" placeholder="Period (e.g. 2025-Q1)" value={narrativePeriod} onChange={e => setNarrativePeriod(e.target.value)} className="w-full rounded-lg border-slate-300 dark:border-slate-600" />
              <input type="file" onChange={e => setNarrativeFile(e.target.files?.[0] || null)} className="w-full rounded-lg border-slate-300 dark:border-slate-600" />
              <button disabled={submitting || !narrativePeriod || !narrativeFile} onClick={submitNarrative} className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit'}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold">Report History</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left bg-slate-50 dark:bg-slate-700/50">
                {['Type','Period','Status','Submitted'].map(h => (
                  <th key={h} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <React.Fragment key={h.id}>
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-6 py-3">{h.type}</td>
                    <td className="px-6 py-3">{h.period}</td>
                    <td className="px-6 py-3">{h.status}</td>
                    <td className="px-6 py-3">{h.submittedAt ? new Date(h.submittedAt).toLocaleString() : '—'}</td>
                  </tr>
                  {h.status === 'submitted' && h.approval_request_id && (
                    <tr className="border-t border-slate-200 dark:border-slate-700">
                      <td colSpan={4} className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30">
                        <ApprovalStatusTracker 
                          requestId={h.approval_request_id}
                          onCancel={async () => {
                            // Refresh history after cancellation
                            const hist = await fetchSSOT('report.history', { projectId, partnerId });
                            setHistory(Array.isArray(hist) ? hist : hist?.items || []);
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {history.length === 0 && (
                <tr><td className="px-6 py-6 text-center text-slate-500" colSpan={4}>No history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

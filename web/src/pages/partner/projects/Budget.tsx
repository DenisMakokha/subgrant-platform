import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import ReviewThreadPane from '../../../components/review/ReviewThreadPane';

type Summary = {
  ceiling?: number;
  budgeted?: number;
  approved?: number;
  spent?: number;
  remaining?: number;
  utilizationPct?: number;
  partnerBudgetId?: string;
};

type CapItem = { category: string; usedPct: number; capPct: number };

type Line = {
  id: string;
  category: string;
  description: string;
  qty: number;
  unit_cost: number;
  total: number;
  status: string;
};

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

export default function Budget() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [summary, setSummary] = useState<Summary>({});
  const [caps, setCaps] = useState<CapItem[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newLine, setNewLine] = useState<{ category: string; description: string; qty: string; unit_cost: string }>({ category: '', description: '', qty: '', unit_cost: '' });
  const partnerBudgetId = useMemo(
    () => summary.partnerBudgetId || localStorage.getItem('currentPartnerBudgetId') || '',
    [summary.partnerBudgetId]
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const [s, c, l] = await Promise.all([
          fetchSSOT('budget.pb.summary', { projectId, partnerId }),
          fetchSSOT('budget.categoryCaps', { projectId, partnerId }),
          fetchSSOT('budget.lines', { partnerBudgetId }),
        ]);
        if (!mounted) return;
        setSummary(s || {});
        setCaps(Array.isArray(c) ? c : c?.items || []);
        setLines(Array.isArray(l) ? l : l?.items || []);
        if ((s as any)?.partnerBudgetId) {
          try { localStorage.setItem('currentPartnerBudgetId', (s as any).partnerBudgetId); } catch {}
        }
      } catch (e: any) {
        console.error('Budget load failed', e);
        if (!mounted) return;
        setError(e?.message || 'Failed to load budget');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [projectId, partnerId, partnerBudgetId]);

  const refreshLines = async () => {
    try {
      const l = await fetchSSOT('budget.lines', { partnerBudgetId });
      setLines(Array.isArray(l) ? l : l?.items || []);
    } catch (e) {
      // noop
    }
  };

  const updateLine = async (id: string, patch: Partial<Line>) => {
    try {
      await fetchSSOT('line.update', { id, ...patch });
      setLines(prev => prev.map(x => x.id === id ? { ...x, ...patch } as Line : x));
    } catch (e) {
      console.error('Update line failed', e);
    }
  };

  const submitLine = async (id: string) => {
    try {
      await fetchSSOT('line.submit', { id });
      setLines(prev => prev.map(x => x.id === id ? { ...x, status: 'submitted' } : x));
    } catch (e) {
      console.error('Submit line failed', e);
    }
  };

  const resubmitLine = async (id: string) => {
    try {
      await fetchSSOT('line.resubmit', { id });
      setLines(prev => prev.map(x => x.id === id ? { ...x, status: 'resubmitted' } : x));
    } catch (e) {
      console.error('Resubmit line failed', e);
    }
  };

  const createLine = async () => {
    if (!partnerBudgetId || !newLine.category || !newLine.description || !newLine.qty || !newLine.unit_cost) return;
    try {
      await fetchSSOT('line.create', {
        partnerBudgetId,
        category: newLine.category,
        description: newLine.description,
        qty: Number(newLine.qty),
        unit_cost: Number(newLine.unit_cost),
      });
      setShowAdd(false);
      setNewLine({ category: '', description: '', qty: '', unit_cost: '' });
      await refreshLines();
    } catch (e) {
      console.error('Create line failed', e);
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
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {([
          { label: 'Ceiling', value: summary.ceiling },
          { label: 'Budgeted', value: summary.budgeted },
          { label: 'Approved', value: summary.approved },
          { label: 'Spent', value: summary.spent },
          { label: 'Remaining', value: summary.remaining },
          { label: 'Utilization', value: `${summary.utilizationPct ?? 0}%` },
        ] as const).map((k) => (
          <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 mb-1">{k.label}</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white">{k.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Category Caps Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Category Caps</div>
        <div className="space-y-3">
          {caps.map((it) => (
            <div key={it.category}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">{it.category}</span>
                <span className="text-slate-500">{it.usedPct}% / cap {it.capPct}%</span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: `${Math.min(it.usedPct, 100)}%` }} />
              </div>
            </div>
          ))}
          {caps.length === 0 && (
            <div className="text-sm text-slate-500">No category caps</div>
          )}
        </div>
      </div>

      {/* Lines + Review Pane */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Budget Lines</div>
              <button onClick={() => setShowAdd(v => !v)} className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">{showAdd ? 'Cancel' : 'Add Line'}</button>
            </div>
            {showAdd && (
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-5 gap-3">
                <input value={newLine.category} onChange={e => setNewLine({ ...newLine, category: e.target.value })} placeholder="Category" className="rounded-lg border-slate-300 dark:border-slate-600" />
                <input value={newLine.description} onChange={e => setNewLine({ ...newLine, description: e.target.value })} placeholder="Description" className="rounded-lg border-slate-300 dark:border-slate-600 md:col-span-2" />
                <input type="number" value={newLine.qty} onChange={e => setNewLine({ ...newLine, qty: e.target.value })} placeholder="Qty" className="rounded-lg border-slate-300 dark:border-slate-600" />
                <input type="number" value={newLine.unit_cost} onChange={e => setNewLine({ ...newLine, unit_cost: e.target.value })} placeholder="Unit Cost" className="rounded-lg border-slate-300 dark:border-slate-600" />
                <div className="md:col-span-5">
                  <button onClick={createLine} disabled={!partnerBudgetId || !newLine.category || !newLine.description || !newLine.qty || !newLine.unit_cost} className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm disabled:opacity-50">Create</button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left bg-slate-50 dark:bg-slate-700/50">
                    {['Category','Description','Qty','Unit Cost','Total','Status','Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lines.map((ln) => (
                    <tr key={ln.id} onClick={() => setSelectedLineId(ln.id)} className={`border-t border-slate-200 dark:border-slate-700 cursor-pointer ${selectedLineId === ln.id ? 'bg-blue-50 dark:bg-slate-700/30' : ''}`}>
                      <td className="px-6 py-3">{ln.category}</td>
                      <td className="px-6 py-3">{ln.description}</td>
                      <td className="px-6 py-3">{ln.qty}</td>
                      <td className="px-6 py-3">{ln.unit_cost}</td>
                      <td className="px-6 py-3">{ln.total}</td>
                      <td className="px-6 py-3">{ln.status}</td>
                      <td className="px-6 py-3 space-x-2">
                        <button onClick={() => updateLine(ln.id, {})} className="text-blue-600 hover:underline">Update</button>
                        <button onClick={() => submitLine(ln.id)} className="text-emerald-600 hover:underline">Submit</button>
                        <button onClick={() => resubmitLine(ln.id)} className="text-indigo-600 hover:underline">Resubmit</button>
                      </td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-center text-slate-500" colSpan={7}>No lines found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ReviewThreadPane entityType="budget_line" entityId={selectedLineId} />
        </div>
      </div>
    </div>
  );
}

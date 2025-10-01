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

type Contract = {
  id: string;
  number: string;
  state: string;
  signedAt?: string;
};

export default function Contracts() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [rows, setRows] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetchSSOT('contract.list', { partnerId, projectId });
        if (!mounted) return;
        setRows(Array.isArray(res) ? res : res?.items || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load contracts');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [partnerId, projectId]);

  const download = async (id: string, type: 'approved' | 'signed') => {
    try {
      const res = await fetchSSOT(`contract.download.${type}`, { id });
      const url = res?.url;
      if (url) window.open(url, '_blank');
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div>;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{error}</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold">Contracts</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left bg-slate-50 dark:bg-slate-700/50">
              {['Contract #','State','Signed At','Actions'].map(h => (
                <th key={h} className="px-6 py-3 text-slate-600 dark:text-slate-300 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700">
                <td className="px-6 py-3">{r.number}</td>
                <td className="px-6 py-3">{r.state}</td>
                <td className="px-6 py-3">{r.signedAt ? new Date(r.signedAt).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3 space-x-2">
                  <button onClick={() => download(r.id, 'approved')} className="text-blue-600 hover:underline">Download Approved</button>
                  <button onClick={() => download(r.id, 'signed')} className="text-emerald-600 hover:underline">Download Signed</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td className="px-6 py-6 text-center text-slate-500" colSpan={4}>No contracts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

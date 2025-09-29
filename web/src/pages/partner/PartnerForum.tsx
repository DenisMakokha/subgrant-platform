import React, { useEffect, useState } from 'react';
import api from '../../services/api';

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

type Thread = {
  id: string;
  title: string;
  project?: { id: string; name: string };
  updatedAt: string;
};

export default function PartnerForum() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetchSSOT('forum.threads', { scope: 'partner' });
        if (!mounted) return;
        setThreads(Array.isArray(res) ? res : res?.items || []);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Partner Forum</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Community threads across your projects</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold">Threads</div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {threads.map(t => (
            <div key={t.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{t.title}</div>
                <div className="text-xs text-slate-500">
                  {t.project?.name ? <span>Project: {t.project.name} · </span> : null}
                  Updated {new Date(t.updatedAt).toLocaleString()}
                </div>
              </div>
              <button className="text-blue-600 hover:underline text-sm">Open</button>
            </div>
          ))}
          {threads.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500">No threads yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

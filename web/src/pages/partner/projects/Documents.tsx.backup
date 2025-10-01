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
};

export default function Documents() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const partnerId = (user as any)?.partnerId || (user as any)?.organization_id || '';

  const [docs, setDocs] = useState<DocCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetchSSOT('docs.list', { projectId, partnerId });
        if (!mounted) return;
        setDocs(Array.isArray(res) ? res : res?.items || []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load documents');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [projectId, partnerId]);

  const download = async (id: string) => {
    try {
      const res = await fetchSSOT('doc.download', { id });
      const url = res?.url;
      if (url) window.open(url, '_blank');
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div>;
  if (error) return <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map(d => (
        <div key={d.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-2">
          <div className="text-sm text-slate-500">{d.type || 'Document'}</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">{d.name}</div>
          {d.description && <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{d.description}</div>}
          <div className="mt-3">
            <button onClick={() => download(d.id)} className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium">Download</button>
          </div>
        </div>
      ))}
      {docs.length === 0 && (
        <div className="col-span-full p-8 text-center text-slate-500">No documents available</div>
      )}
    </div>
  );
}

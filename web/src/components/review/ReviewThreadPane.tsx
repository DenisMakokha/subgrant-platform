import React, { useEffect, useState } from 'react';
import api from '../../services/api';

interface ReviewThreadPaneProps {
  entityType: string;
  entityId: string | null | undefined;
}

interface ReviewComment {
  id: string;
  entity_type: string;
  entity_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
  };
}

const ReviewThreadPane: React.FC<ReviewThreadPaneProps> = ({ entityType, entityId }) => {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!entityId) { setComments([]); return; }
      try {
        setLoading(true);
        const res = await api.reviewComments.getByEntity(entityType, entityId);
        if (!mounted) return;
        setComments((res as any)?.data || res || []);
      } catch (e) {
        if (!mounted) return;
        setComments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [entityType, entityId]);

  const add = async () => {
    if (!entityId || !text.trim()) return;
    try {
      const res = await api.reviewComments.create({ entity_type: entityType, entity_id: entityId, content: text.trim() });
      const created = (res as any)?.data || res;
      setComments(prev => [...prev, created]);
      setText('');
    } catch (e) {
      // noop
    }
  };

  const resolve = async (id: string) => {
    try {
      await api.reviewComments.resolve(id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, is_resolved: true, resolved_at: new Date().toISOString() } : c));
    } catch (e) {
      // noop
    }
  };

  if (!entityId) {
    return (
      <div className="p-4 text-sm text-slate-500">Select a line to view its review thread.</div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold">Review Thread</div>
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading...</div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No comments yet.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-slate-500">
                  {(c.author?.first_name || '') + ' ' + (c.author?.last_name || '')}
                </div>
                <div className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{c.content}</div>
              <div className="mt-2">
                {c.is_resolved ? (
                  <span className="text-xs text-emerald-600">Resolved</span>
                ) : (
                  <button onClick={() => resolve(c.id)} className="text-xs text-blue-600 hover:underline">Mark as resolved</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Add a comment" className="w-full rounded-lg border-slate-300 dark:border-slate-600" />
        <div className="text-right">
          <button onClick={add} disabled={!text.trim()} className="px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm disabled:opacity-50">Add Comment</button>
        </div>
      </div>
    </div>
  );
};

export default ReviewThreadPane;

// src/pages/coo/COODashboard.tsx
import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface QueueItem {
  id: number;
  name: string;
  status: string;
  updated_at: string;
  sector?: string;
  country?: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  document_count: number;
  days_in_coo_queue: number;
}

export default function COODashboard() {
  const { modules } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [summary, setSummary] = useState<any>(modules?.reviewer || null);
  const [error, setError] = useState<string | null>(null);

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
      const data = await fetchWithAuth('/review/coo/queue');
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load COO queue:', error);
      setError('Failed to load COO queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const decide = async (orgId: number, decision: 'approve' | 'changes_requested' | 'reject') => {
    setProcessing(orgId);
    try {
      await fetchWithAuth(`/review/coo/${orgId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });
      // Remove item from queue
      setItems(items.filter(item => item.id !== orgId));
    } catch (error) {
      console.error('Decision failed:', error);
      alert('Failed to process decision');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        <h1 className="text-2xl font-semibold text-gray-900">COO Final Review Queue</h1>
        <p className="text-gray-600 mt-1">
          {items.length} organization{items.length !== 1 ? 's' : ''} approved by GM, awaiting final COO approval
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
            <div className="text-sm text-gray-500">Total in Queue</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{summary.queue?.total ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-yellow-200 shadow-sm">
            <div className="text-sm text-yellow-700">Aging ≥ 2 days</div>
            <div className="mt-1 text-2xl font-semibold text-yellow-900">{summary.queue?.aging_2_days ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-sm">
            <div className="text-sm text-orange-700">Aging ≥ 5 days</div>
            <div className="mt-1 text-2xl font-semibold text-orange-900">{summary.queue?.aging_5_days ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-red-200 shadow-sm">
            <div className="text-sm text-red-700">Aging ≥ 10 days</div>
            <div className="mt-1 text-2xl font-semibold text-red-900">{summary.queue?.aging_10_days ?? 0}</div>
          </div>
          <div className="p-4 rounded-xl bg-white border border-green-200 shadow-sm">
            <div className="text-sm text-green-700">GM Approved Today</div>
            <div className="mt-1 text-2xl font-semibold text-green-900">{summary.gm_approved_today ?? 0}</div>
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
          {items.map(item => {
            const daysInQueue = Math.floor(item.days_in_coo_queue);
            const isUrgent = daysInQueue >= 5;
            const isAging = daysInQueue >= 2;

            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-xl border-2 transition-all ${
                  isUrgent ? 'border-red-200 bg-red-50' : 
                  isAging ? 'border-yellow-200 bg-yellow-50' : 
                  'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        ✓ GM Approved
                      </span>
                      {isUrgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          URGENT - {daysInQueue} days in COO queue
                        </span>
                      )}
                      {isAging && !isUrgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          {daysInQueue} days in COO queue
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
                        <span className="font-medium">GM Approved:</span> {formatDate(item.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-6">
                    <button
                      onClick={() => decide(item.id, 'approve')}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {processing === item.id ? 'Processing...' : 'Final Approve'}
                    </button>
                    <button
                      onClick={() => decide(item.id, 'changes_requested')}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => decide(item.id, 'reject')}
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
    </div>
  );
}

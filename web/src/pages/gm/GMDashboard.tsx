// src/pages/gm/GMDashboard.tsx
import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../services/api';

interface QueueItem {
  id: number;
  name: string;
  status: string;
  created_at: string;
  sector?: string;
  country?: string;
  owner_email: string;
  owner_first_name: string;
  owner_last_name: string;
  document_count: number;
}

export default function GMDashboard() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      const response = await fetchWithAuth('/api/review/gm/queue');
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to load GM queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (orgId: number, decision: 'approve' | 'changes_requested' | 'reject') => {
    setProcessing(orgId);
    try {
      const response = await fetchWithAuth(`/api/review/gm/${orgId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      });

      if (response.ok) {
        // Remove item from queue
        setItems(items.filter(item => item.id !== orgId));
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
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

  const getDaysWaiting = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Grants Manager Review Queue</h1>
        <p className="text-gray-600 mt-1">
          {items.length} organization{items.length !== 1 ? 's' : ''} awaiting GM review
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No organizations in queue</div>
          <p className="text-gray-500 mt-2">All caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const daysWaiting = getDaysWaiting(item.created_at);
            const isUrgent = daysWaiting >= 7;
            const isAging = daysWaiting >= 3;

            return (
              <div 
                key={item.id} 
                className={`p-6 rounded-xl border-2 transition-all ${
                  isUrgent ? 'border-red-200 bg-red-50' : 
                  isAging ? 'border-yellow-200 bg-yellow-50' : 
                  'border-gray-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      {isUrgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          URGENT - {daysWaiting} days
                        </span>
                      )}
                      {isAging && !isUrgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          {daysWaiting} days waiting
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
                        <span className="font-medium">Submitted:</span> {formatDate(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-6">
                    <button
                      onClick={() => decide(item.id, 'approve')}
                      disabled={processing === item.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processing === item.id ? 'Processing...' : 'Approve'}
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

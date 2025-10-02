import React, { useEffect, useState } from 'react';
import ListWidget from '../base/ListWidget';

interface ApprovalItem {
  id: string;
  title: string;
  type: string;
  requestedBy: string;
  requestedAt: string;
  priority: string;
}

export default function ApprovalQueueWidget() {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/approvals/pending?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch approvals');
      
      const result = await response.json();
      setItems(result.data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    };
    return colors[priority] || colors.medium;
  };

  const listItems = items.map(item => ({
    id: item.id,
    title: item.title,
    subtitle: `${item.type} • Requested by ${item.requestedBy}`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    badge: item.priority,
    badgeColor: getPriorityColor(item.priority),
    onClick: () => window.location.href = `/approvals/${item.id}`
  }));

  return (
    <ListWidget
      title="Pending Approvals"
      items={listItems}
      capability="approvals.view"
      loading={loading}
      emptyMessage="No pending approvals"
      maxItems={5}
      showViewAll={items.length > 5}
      onViewAll={() => window.location.href = '/approvals'}
    />
  );
}

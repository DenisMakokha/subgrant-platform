import React, { useEffect, useState } from 'react';
import ListWidget from '../base/ListWidget';

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function RecentIssuesWidget() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reported-issues?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch issues');
      
      const result = await response.json();
      setIssues(result.data || []);
    } catch (err) {
      console.error(err);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
    };
    return colors[status] || colors.open;
  };

  const listItems = issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    subtitle: `${issue.priority} priority • ${new Date(issue.created_at).toLocaleDateString()}`,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17.07V6.93A2 2 0 0018.93 5H5.07A2 2 0 003 6.93v10.14A2 2 0 005.07 19z" />
      </svg>
    ),
    badge: issue.status.replace('_', ' '),
    badgeColor: getStatusColor(issue.status),
    onClick: () => window.location.href = `/issues/${issue.id}`
  }));

  return (
    <ListWidget
      title="Recent Issues"
      items={listItems}
      capability="issues.view"
      loading={loading}
      emptyMessage="No recent issues"
      maxItems={5}
      showViewAll={issues.length > 5}
      onViewAll={() => window.location.href = '/issues'}
    />
  );
}

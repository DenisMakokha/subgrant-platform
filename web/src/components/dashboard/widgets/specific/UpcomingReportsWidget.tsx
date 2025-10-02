import React, { useEffect, useState } from 'react';
import ListWidget from '../base/ListWidget';

interface Report {
  id: string;
  title: string;
  due_date: string;
  status: string;
  type: string;
}

export default function UpcomingReportsWidget() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/me/due?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch reports');
      
      const result = await response.json();
      setReports(result.data || []);
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (daysUntilDue <= 3) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    if (daysUntilDue <= 7) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  };

  const listItems = reports.map(report => {
    const daysUntilDue = getDaysUntilDue(report.due_date);
    const badgeText = daysUntilDue < 0 
      ? 'Overdue' 
      : daysUntilDue === 0 
      ? 'Due Today' 
      : `${daysUntilDue}d`;

    return {
      id: report.id,
      title: report.title,
      subtitle: `Due: ${new Date(report.due_date).toLocaleDateString()}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: badgeText,
      badgeColor: getUrgencyColor(daysUntilDue),
      onClick: () => window.location.href = `/me-reports/${report.id}`
    };
  });

  return (
    <ListWidget
      title="Upcoming Reports"
      items={listItems}
      capability="me_reports.view"
      loading={loading}
      emptyMessage="No upcoming reports"
      maxItems={5}
      showViewAll={reports.length > 5}
      onViewAll={() => window.location.href = '/me-reports'}
    />
  );
}

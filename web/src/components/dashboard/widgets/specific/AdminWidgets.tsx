import React, { useState, useEffect } from 'react';
import { KPIWidget, ChartWidget, ListWidget } from '../base';
import { fetchWithAuth } from '../../../../utils/api';

/**
 * Admin-specific Dashboard Widgets
 */

// Total Users Widget
export function AdminUsersCountWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/admin_users_count/data')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <KPIWidget
      title="Total Users"
      value={data?.value || 0}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
      color="blue"
      loading={loading}
      capability="users.view"
    />
  );
}

// Total Organizations Widget
export function AdminOrgsCountWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/admin_orgs_count/data')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <KPIWidget
      title="Organizations"
      value={data?.value || 0}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      }
      color="green"
      loading={loading}
      capability="organizations.view"
    />
  );
}

// Active Projects Widget
export function AdminProjectsCountWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/admin_projects_count/data')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <KPIWidget
      title="Active Projects"
      value={data?.value || 0}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      color="purple"
      loading={loading}
      capability="projects.view"
    />
  );
}

// Total Budget Widget
export function AdminBudgetTotalWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/admin_budget_total/data')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <KPIWidget
      title="Total Budget"
      value={formatCurrency(data?.value || 0)}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      color="yellow"
      loading={loading}
      capability="budgets.view"
    />
  );
}

// System Health Chart Widget
export function AdminSystemHealthWidget() {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with real system metrics
  const data = [
    { label: 'CPU', value: 45 },
    { label: 'Memory', value: 62 },
    { label: 'Disk', value: 38 },
    { label: 'Network', value: 71 }
  ];

  return (
    <ChartWidget
      title="System Health"
      subtitle="Resource utilization"
      data={data}
      chartType="bar"
      loading={loading}
      capability="system.read"
    />
  );
}

// User Growth Chart Widget
export function AdminUserGrowthWidget() {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with real user growth data
  const data = [
    { label: 'Jan', value: 45 },
    { label: 'Feb', value: 52 },
    { label: 'Mar', value: 61 },
    { label: 'Apr', value: 58 },
    { label: 'May', value: 73 },
    { label: 'Jun', value: 89 }
  ];

  return (
    <ChartWidget
      title="User Growth"
      subtitle="New users per month"
      data={data}
      chartType="line"
      loading={loading}
      capability="users.view"
    />
  );
}

// Recent Activities List Widget
export function AdminRecentActivitiesWidget() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent activities from audit logs
    fetchWithAuth('/api/audit-logs?limit=5')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setActivities(result.data.map((log: any) => ({
            id: log.id,
            title: log.action,
            subtitle: `${log.user_email} • ${new Date(log.created_at).toLocaleString()}`,
            badge: log.entity_type,
            badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ListWidget
      title="Recent Activities"
      items={activities}
      loading={loading}
      emptyMessage="No recent activities"
      maxItems={5}
      showViewAll={true}
      onViewAll={() => window.location.href = '/admin/audit-center'}
      capability="audit_logs.view"
    />
  );
}

// Pending Approvals List Widget
export function AdminPendingApprovalsWidget() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch pending approvals
    fetchWithAuth('/approvals/pending')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setApprovals(result.data.slice(0, 5).map((approval: any) => ({
            id: approval.id,
            title: approval.item_type,
            subtitle: `Requested by ${approval.requester_name}`,
            badge: 'Pending',
            badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            onClick: () => window.location.href = `/admin/approvals/${approval.id}`
          })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ListWidget
      title="Pending Approvals"
      items={approvals}
      loading={loading}
      emptyMessage="No pending approvals"
      maxItems={5}
      showViewAll={true}
      onViewAll={() => window.location.href = '/admin/approvals'}
      capability="approvals.view"
    />
  );
}

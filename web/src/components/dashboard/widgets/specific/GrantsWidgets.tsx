import React, { useState, useEffect } from 'react';
import { KPIWidget, ChartWidget, ListWidget } from '../base';
import { fetchWithAuth } from '../../../../utils/api';

/**
 * Grants Manager-specific Dashboard Widgets
 */

// Pending Applications Widget
export function GrantsApplicationsPendingWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/grants_applications_pending/data')
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
      title="Pending Applications"
      value={data?.value || 0}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      color="blue"
      loading={loading}
      capability="applications.view"
    />
  );
}

// Active Grants Widget
export function GrantsProjectsActiveWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/grants_projects_active/data')
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
      title="Active Grants"
      value={data?.value || 0}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      }
      color="green"
      trend="up"
      loading={loading}
      capability="projects.view"
    />
  );
}

// Compliance Rate Widget
export function GrantsComplianceRateWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/grants_compliance_rate/data')
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
      title="Compliance Rate"
      value={`${data?.value || 0}%`}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      color="purple"
      trend={data?.value >= 90 ? 'up' : 'neutral'}
      loading={loading}
      capability="compliance.view"
    />
  );
}

// Approval Queue List Widget
export function GrantsApprovalQueueWidget() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/approvals/pending?role=grants_manager')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setApprovals(result.data.slice(0, 5).map((approval: any) => ({
            id: approval.id,
            title: approval.item_type,
            subtitle: `${approval.requester_name} • ${new Date(approval.created_at).toLocaleDateString()}`,
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
      title="Approval Queue"
      items={approvals}
      loading={loading}
      emptyMessage="No pending approvals"
      maxItems={5}
      showViewAll={true}
      onViewAll={() => window.location.href = '/admin/approvals'}
      capability="approvals.approve"
    />
  );
}

// Partner Performance Chart Widget
export function GrantsPartnerPerformanceWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/admin/grants/partner-performance')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          // Mock data
          setData([
            { label: 'Partner A', value: 92 },
            { label: 'Partner B', value: 88 },
            { label: 'Partner C', value: 95 },
            { label: 'Partner D', value: 85 },
            { label: 'Partner E', value: 90 }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ChartWidget
      title="Partner Performance"
      subtitle="Performance scores by partner"
      data={data}
      chartType="bar"
      loading={loading}
      capability="organizations.view"
    />
  );
}

// Application Status Distribution Widget
export function GrantsApplicationStatusWidget() {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with real application status data
  const data = [
    { label: 'Pending', value: 12 },
    { label: 'Under Review', value: 8 },
    { label: 'Approved', value: 45 },
    { label: 'Rejected', value: 5 }
  ];

  return (
    <ChartWidget
      title="Application Status"
      subtitle="Distribution of application statuses"
      data={data}
      chartType="doughnut"
      loading={loading}
      capability="applications.view"
    />
  );
}

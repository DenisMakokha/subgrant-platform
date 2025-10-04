import React, { useState, useEffect } from 'react';
import { KPIWidget, ChartWidget, ListWidget } from '../base';
import { fetchWithAuth } from '../../../../utils/api';

/**
 * Partner-specific Dashboard Widgets
 */

// Active Projects Widget
export function PartnerActiveProjectsWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/partner_active_projects/data')
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
      color="blue"
      loading={loading}
      capability="projects.view"
    />
  );
}

// Budget Ceiling Widget
export function PartnerBudgetCeilingWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/partner_budget_ceiling/data')
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
      title="Budget Ceiling"
      value={formatCurrency(data?.value || 0)}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      color="green"
      loading={loading}
      capability="budgets.view"
    />
  );
}

// Budget Spent Widget
export function PartnerBudgetSpentWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/partner_budget_spent/data')
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
      title="Budget Spent"
      value={formatCurrency(data?.value || 0)}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      color="purple"
      loading={loading}
      capability="budgets.view"
    />
  );
}

// Reports Due Widget
export function PartnerReportsDueWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/partner_reports_due/data')
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
      title="Reports Due"
      value={data?.value || 0}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      color="red"
      trend={data?.value > 0 ? 'down' : 'neutral'}
      loading={loading}
      capability="me_reports.view"
    />
  );
}

// Budget Utilization Chart Widget
export function PartnerBudgetUtilizationWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/partner/dashboard/budget-utilization')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          // Mock data for demonstration
          setData([
            { label: 'Jan', value: 15000 },
            { label: 'Feb', value: 22000 },
            { label: 'Mar', value: 28000 },
            { label: 'Apr', value: 35000 },
            { label: 'May', value: 41000 },
            { label: 'Jun', value: 48000 }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ChartWidget
      title="Budget Utilization"
      subtitle="Monthly spending trend"
      data={data}
      chartType="line"
      loading={loading}
      capability="budgets.view"
    />
  );
}

// Recent Disbursements List Widget
export function PartnerRecentDisbursementsWidget() {
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/partner/finance/disbursements?limit=5')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setDisbursements(result.data.map((d: any) => ({
            id: d.id,
            title: `${d.currency} ${d.amount.toLocaleString()}`,
            subtitle: new Date(d.scheduled_date).toLocaleDateString(),
            badge: d.status,
            badgeColor: getStatusColor(d.status)
          })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'scheduled': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
      'pending': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'paid': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'cancelled': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
    };
    return colors[status] || colors['scheduled'];
  };

  return (
    <ListWidget
      title="Recent Disbursements"
      items={disbursements}
      loading={loading}
      emptyMessage="No disbursements yet"
      maxItems={5}
      showViewAll={true}
      onViewAll={() => window.location.href = '/partner/contracts'}
      capability="disbursements.view"
    />
  );
}

// Upcoming Reports List Widget
export function PartnerUpcomingReportsWidget() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/partner/me/due')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setReports(result.data.slice(0, 5).map((r: any) => ({
            id: r.id,
            title: r.report_type || 'Monthly Report',
            subtitle: `Due: ${new Date(r.due_date).toLocaleDateString()}`,
            badge: r.status,
            badgeColor: r.status === 'pending' 
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            onClick: () => window.location.href = `/partner/reports/${r.id}`
          })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ListWidget
      title="Upcoming Reports"
      items={reports}
      loading={loading}
      emptyMessage="No reports due"
      maxItems={5}
      showViewAll={true}
      onViewAll={() => window.location.href = '/partner/reports'}
      capability="me_reports.view"
    />
  );
}

// Compliance Status Chart Widget
export function PartnerComplianceStatusWidget() {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with real compliance data
  const data = [
    { label: 'Compliant', value: 85 },
    { label: 'Pending', value: 10 },
    { label: 'Overdue', value: 5 }
  ];

  return (
    <ChartWidget
      title="Compliance Status"
      subtitle="Document compliance overview"
      data={data}
      chartType="doughnut"
      loading={loading}
      capability="compliance.view"
    />
  );
}

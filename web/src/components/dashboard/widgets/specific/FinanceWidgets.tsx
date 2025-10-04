import React, { useState, useEffect } from 'react';
import { KPIWidget, ChartWidget, ListWidget } from '../base';
import { fetchWithAuth } from '../../../../utils/api';

/**
 * Finance Manager-specific Dashboard Widgets
 */

// Total Disbursements Widget
export function FinanceTotalDisbursementsWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/finance_total_disbursements/data')
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
      title="Total Disbursements"
      value={formatCurrency(data?.value || 0)}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      color="green"
      trend="up"
      loading={loading}
      capability="disbursements.view"
    />
  );
}

// Pending Payments Widget
export function FinancePendingPaymentsWidget() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/dashboard/widgets/finance_pending_payments/data')
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
      title="Pending Payments"
      value={data?.value || 0}
      icon={
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      color="yellow"
      loading={loading}
      capability="disbursements.approve"
    />
  );
}

// Budget Variance Chart Widget
export function FinanceBudgetVarianceWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/admin/financial/budget-variance')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          // Mock data
          setData([
            { label: 'Project A', value: 5000 },
            { label: 'Project B', value: -2000 },
            { label: 'Project C', value: 3000 },
            { label: 'Project D', value: -1000 },
            { label: 'Project E', value: 4000 }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ChartWidget
      title="Budget Variance"
      subtitle="Budget vs actual spending"
      data={data}
      chartType="bar"
      loading={loading}
      capability="budgets.view"
    />
  );
}

// Payment Schedule List Widget
export function FinancePaymentScheduleWidget() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect () => {
    fetchWithAuth('/api/disbursements?status=scheduled&limit=5')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setPayments(result.data.map((p: any) => ({
            id: p.id,
            title: `${p.currency} ${p.amount.toLocaleString()}`,
            subtitle: `${p.partner_name} • ${new Date(p.scheduled_date).toLocaleDateString()}`,
            badge: p.status,
            badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            onClick: () => window.location.href = `/admin/disbursements/${p.id}`
          })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ListWidget
      title="Payment Schedule"
      items={payments}
      loading={loading}
      emptyMessage="No scheduled payments"
      maxItems={5}
      showViewAll={true}
      onViewAll={() => window.location.href = '/admin/disbursements'}
      capability="disbursements.view"
    />
  );
}

// Reconciliation Status Chart Widget
export function FinanceReconciliationStatusWidget() {
  const [loading, setLoading] = useState(false);

  // Mock data - replace with real reconciliation data
  const data = [
    { label: 'Reconciled', value: 75 },
    { label: 'Pending', value: 15 },
    { label: 'Issues', value: 10 }
  ];

  return (
    <ChartWidget
      title="Reconciliation Status"
      subtitle="Financial reconciliation overview"
      data={data}
      chartType="pie"
      loading={loading}
      capability="reconciliation.view"
    />
  );
}

// Monthly Disbursements Trend Widget
export function FinanceMonthlyDisbursementsWidget() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/admin/financial/monthly-disbursements')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        } else {
          // Mock data
          setData([
            { label: 'Jan', value: 125000 },
            { label: 'Feb', value: 142000 },
            { label: 'Mar', value: 138000 },
            { label: 'Apr', value: 155000 },
            { label: 'May', value: 168000 },
            { label: 'Jun', value: 175000 }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ChartWidget
      title="Monthly Disbursements"
      subtitle="Disbursement trends over time"
      data={data}
      chartType="line"
      loading={loading}
      capability="disbursements.view"
    />
  );
}

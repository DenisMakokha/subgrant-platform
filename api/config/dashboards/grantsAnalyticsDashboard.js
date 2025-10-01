/**
 * No-code dashboard configuration for Grants Analytics
 * Provides comprehensive analytics views for admin/finance roles
 */

const grantsAnalyticsDashboardConfig = {
  key: "grants_analytics_dashboard",
  name: "Grants Analytics",
  description: "Comprehensive grants and envelope analytics dashboard",
  roles: ["admin", "finance_officer", "program_manager"],
  
  layout: {
    type: "grid",
    columns: 12,
    gap: 16
  },

  widgets: [
    // Row 1: Key Performance Indicators
    {
      id: "envelope_overview_kpis",
      type: "kpi_row",
      title: "Envelope Overview",
      gridPosition: { col: 1, row: 1, colSpan: 12, rowSpan: 2 },
      dataKey: "grants.analytics.envelope.overview",
      kpis: [
        {
          key: "envelope_total",
          label: "Envelope Total",
          format: "currency",
          color: "blue"
        },
        {
          key: "approved_to_partners", 
          label: "Approved to Partners",
          format: "currency",
          color: "green"
        },
        {
          key: "headroom",
          label: "Headroom",
          format: "currency",
          color: "orange",
          alert: { threshold: 0, condition: "lt", severity: "warning" }
        },
        {
          key: "amendments_cum",
          label: "Total Amendments",
          format: "currency",
          color: "purple"
        }
      ]
    },

    // Row 2: Burn Rate Chart
    {
      id: "burn_rate_chart",
      type: "area_chart",
      title: "Burn Rate Analysis",
      gridPosition: { col: 1, row: 3, colSpan: 8, rowSpan: 4 },
      dataKey: "grants.analytics.burn.rate",
      config: {
        xAxis: "period",
        yAxis: ["spend", "cumulative"],
        colors: ["#3B82F6", "#10B981"],
        showLegend: true,
        showGrid: true
      }
    },

    // Row 2: Runway Indicator
    {
      id: "runway_indicator",
      type: "gauge",
      title: "Runway (Months)",
      gridPosition: { col: 9, row: 3, colSpan: 4, rowSpan: 2 },
      dataKey: "grants.analytics.burn.rate",
      config: {
        valueKey: "metadata.runway_months",
        min: 0,
        max: 24,
        thresholds: [
          { value: 3, color: "red", label: "Critical" },
          { value: 6, color: "orange", label: "Warning" },
          { value: 12, color: "green", label: "Healthy" }
        ]
      }
    },

    // Row 2: Budget Utilization
    {
      id: "budget_utilization",
      type: "progress_ring",
      title: "Budget Utilization",
      gridPosition: { col: 9, row: 5, colSpan: 4, rowSpan: 2 },
      dataKey: "grants.analytics.burn.rate",
      config: {
        valueKey: "metadata.total_spent",
        maxKey: "metadata.total_budget",
        format: "percentage",
        thresholds: [
          { value: 75, color: "orange" },
          { value: 90, color: "red" }
        ]
      }
    },

    // Row 3: Partner Analytics Table
    {
      id: "partner_analytics_table",
      type: "data_table",
      title: "Analytics by Partner",
      gridPosition: { col: 1, row: 7, colSpan: 12, rowSpan: 4 },
      dataKey: "grants.analytics.byPartner",
      config: {
        columns: [
          { key: "partner_name", label: "Partner", sortable: true },
          { key: "ceiling", label: "Ceiling", format: "currency", sortable: true },
          { key: "budgeted", label: "Budgeted", format: "currency", sortable: true },
          { key: "spent", label: "Spent", format: "currency", sortable: true },
          { key: "remaining", label: "Remaining", format: "currency", sortable: true },
          { 
            key: "utilization_pct", 
            label: "Utilization %", 
            format: "percentage", 
            sortable: true,
            colorScale: [
              { threshold: 75, color: "orange" },
              { threshold: 90, color: "red" }
            ]
          },
          { key: "variance", label: "Variance", format: "currency", sortable: true }
        ],
        actions: [
          {
            label: "Open Partner Budget",
            actionKey: "partner.budget.open",
            paramKey: "partner_id"
          }
        ],
        pagination: true,
        pageSize: 10
      }
    },

    // Row 4: Category Analysis
    {
      id: "category_analysis",
      type: "horizontal_bar_chart",
      title: "Budget by Category",
      gridPosition: { col: 1, row: 11, colSpan: 6, rowSpan: 4 },
      dataKey: "grants.analytics.byCategory",
      config: {
        xAxis: "category",
        yAxis: ["budgeted", "spent"],
        colors: ["#3B82F6", "#EF4444"],
        showLegend: true,
        toggleScope: {
          options: [
            { value: "partner", label: "Partner Scope" },
            { value: "grant_internal", label: "Internal Scope" }
          ],
          paramKey: "scope"
        }
      }
    },

    // Row 4: Approval Operations
    {
      id: "approval_ops_kpis",
      type: "metric_cards",
      title: "Approval Operations",
      gridPosition: { col: 7, row: 11, colSpan: 6, rowSpan: 2 },
      dataKey: "ops.approvals.metrics",
      config: {
        cards: [
          {
            key: "median_tta_seconds",
            label: "Median Time to Approval",
            format: "duration_seconds",
            color: "blue"
          },
          {
            key: "rework_rate",
            label: "Rework Rate",
            format: "percentage",
            color: "orange"
          }
        ]
      }
    },

    // Row 4: Contract & Fund Request Metrics
    {
      id: "contracts_fund_requests",
      type: "metric_grid",
      title: "Contracts & Fund Requests",
      gridPosition: { col: 7, row: 13, colSpan: 6, rowSpan: 2 },
      dataKeys: ["ops.contracts.cycle", "ops.fundRequests.flow"],
      config: {
        sections: [
          {
            title: "Contract Cycle",
            metrics: [
              { key: "median_cycle_days", label: "Median Cycle (Days)", format: "number" },
              { key: "signed", label: "Signed", format: "number" },
              { key: "activated", label: "Activated", format: "number" }
            ]
          },
          {
            title: "Fund Requests",
            metrics: [
              { key: "approved_sum", label: "Approved", format: "currency" },
              { key: "posted_sum", label: "Posted to ERP", format: "currency" },
              { key: "avg_approval_days", label: "Avg Approval (Days)", format: "number" }
            ]
          }
        ]
      }
    },

    // Row 5: Reporting SLA
    {
      id: "reporting_sla",
      type: "sla_dashboard",
      title: "Reporting SLA",
      gridPosition: { col: 1, row: 15, colSpan: 12, rowSpan: 3 },
      dataKey: "ops.reports.sla",
      config: {
        tabs: [
          { value: "financial", label: "Financial Reports" },
          { value: "narrative", label: "Narrative Reports" }
        ],
        metrics: [
          {
            key: "on_time_pct",
            label: "On-Time %",
            format: "percentage",
            target: 95,
            color: "green"
          },
          {
            key: "median_days_to_submit",
            label: "Avg Days to Submit",
            format: "number",
            target: 7,
            color: "blue"
          },
          {
            key: "due_this_month",
            label: "Due This Month",
            format: "number",
            color: "orange"
          },
          {
            key: "overdue",
            label: "Overdue",
            format: "number",
            color: "red",
            alert: { threshold: 0, condition: "gt", severity: "error" }
          }
        ]
      }
    }
  ],

  // Global dashboard actions
  actions: [
    {
      key: "refresh_analytics",
      label: "Refresh Analytics",
      actionKey: "analytics.refresh.daily",
      icon: "refresh",
      variant: "secondary"
    },
    {
      key: "export_data",
      label: "Export Data",
      actionKey: "analytics.export",
      icon: "download",
      variant: "outline"
    }
  ],

  // Dashboard filters
  filters: [
    {
      key: "date_range",
      type: "date_range",
      label: "Date Range",
      defaultValue: "last_30_days"
    },
    {
      key: "currency",
      type: "select",
      label: "Currency",
      options: [
        { value: "all", label: "All Currencies" },
        { value: "USD", label: "USD" },
        { value: "EUR", label: "EUR" },
        { value: "GBP", label: "GBP" },
        { value: "KES", label: "KES" }
      ],
      defaultValue: "all"
    }
  ],

  // Refresh settings
  refresh: {
    auto: true,
    interval: 300000, // 5 minutes
    onActions: ["grant.created", "grant.updated", "envelope.amended", "partner.budget.approved"]
  }
};

// Partner-specific analytics dashboard (simplified view)
const partnerAnalyticsDashboardConfig = {
  key: "partner_grants_analytics",
  name: "My Grant Analytics",
  description: "Partner view of grant analytics and budget status",
  roles: ["partner"],
  
  layout: {
    type: "grid",
    columns: 12,
    gap: 16
  },

  widgets: [
    // Partner Budget Overview
    {
      id: "my_budget_overview",
      type: "kpi_row",
      title: "My Budget Overview",
      gridPosition: { col: 1, row: 1, colSpan: 12, rowSpan: 2 },
      dataKey: "partner.analytics.myBudget",
      kpis: [
        {
          key: "ceiling",
          label: "Budget Ceiling",
          format: "currency",
          color: "blue"
        },
        {
          key: "budgeted",
          label: "Budgeted",
          format: "currency", 
          color: "green"
        },
        {
          key: "spent",
          label: "Spent",
          format: "currency",
          color: "orange"
        },
        {
          key: "remaining",
          label: "Remaining",
          format: "currency",
          color: "purple"
        },
        {
          key: "utilization_pct",
          label: "Utilization %",
          format: "percentage",
          color: "red",
          alert: { threshold: 90, condition: "gt", severity: "warning" }
        }
      ]
    },

    // Category Breakdown
    {
      id: "my_category_breakdown",
      type: "donut_chart",
      title: "Budget by Category",
      gridPosition: { col: 1, row: 3, colSpan: 6, rowSpan: 4 },
      dataKey: "partner.analytics.byCategory",
      config: {
        valueKey: "budgeted",
        labelKey: "category",
        showLegend: true,
        showPercentages: true
      }
    },

    // Spending vs Budget
    {
      id: "spending_vs_budget",
      type: "comparison_bar",
      title: "Spending vs Budget by Category",
      gridPosition: { col: 7, row: 3, colSpan: 6, rowSpan: 4 },
      dataKey: "partner.analytics.byCategory",
      config: {
        xAxis: "category",
        series: [
          { key: "budgeted", label: "Budgeted", color: "#3B82F6" },
          { key: "spent", label: "Spent", color: "#EF4444" }
        ]
      }
    },

    // Fund Requests Status (if applicable)
    {
      id: "my_fund_requests",
      type: "status_table",
      title: "My Fund Requests",
      gridPosition: { col: 1, row: 7, colSpan: 12, rowSpan: 3 },
      dataKey: "partner.fundRequests.status",
      config: {
        columns: [
          { key: "amount", label: "Amount", format: "currency" },
          { key: "purpose", label: "Purpose" },
          { key: "submitted_at", label: "Submitted", format: "date" },
          { key: "state", label: "Status", format: "badge" }
        ],
        statusColors: {
          "draft": "gray",
          "submitted": "blue", 
          "approved": "green",
          "rejected": "red",
          "paid": "purple"
        }
      }
    }
  ],

  actions: [
    {
      key: "request_funds",
      label: "Request Funds",
      actionKey: "partner.fundRequest.create",
      icon: "plus",
      variant: "primary"
    }
  ]
};

// Admin grants management dashboard
const grantsManagementDashboardConfig = {
  key: "grants_management_dashboard",
  name: "Grants Management",
  description: "Administrative grants management and oversight",
  roles: ["admin", "program_manager"],
  
  layout: {
    type: "grid",
    columns: 12,
    gap: 16
  },

  widgets: [
    // Grants Overview Table
    {
      id: "grants_overview_table",
      type: "data_table",
      title: "All Grants",
      gridPosition: { col: 1, row: 1, colSpan: 12, rowSpan: 6 },
      dataKey: "grants.list",
      config: {
        columns: [
          { key: "grant_number", label: "Grant #", sortable: true },
          { key: "name", label: "Grant Name", sortable: true },
          { key: "budget_amount", label: "Budget", format: "currency", sortable: true },
          { key: "currency", label: "Currency" },
          { key: "open_date", label: "Start Date", format: "date", sortable: true },
          { key: "close_date", label: "End Date", format: "date", sortable: true },
          { 
            key: "status", 
            label: "Status", 
            format: "badge",
            sortable: true,
            colorMap: {
              "ACTIVE": "green",
              "ARCHIVED": "gray", 
              "CANCELLED": "red"
            }
          },
          {
            key: "timeline_status",
            label: "Timeline",
            format: "badge",
            colorMap: {
              "PENDING": "blue",
              "ACTIVE": "green",
              "CLOSED": "gray"
            }
          }
        ],
        actions: [
          {
            label: "View Details",
            actionKey: "grants.view",
            paramKey: "id"
          },
          {
            label: "Edit",
            actionKey: "grants.edit", 
            paramKey: "id"
          },
          {
            label: "Analytics",
            actionKey: "grants.analytics.view",
            paramKey: "project_id"
          }
        ],
        pagination: true,
        pageSize: 20,
        searchable: true,
        exportable: true
      }
    },

    // Quick Actions
    {
      id: "quick_actions",
      type: "action_grid",
      title: "Quick Actions",
      gridPosition: { col: 1, row: 7, colSpan: 4, rowSpan: 2 },
      actions: [
        {
          key: "create_grant",
          label: "Create New Grant",
          actionKey: "grants.create",
          icon: "plus",
          color: "blue"
        },
        {
          key: "bulk_import",
          label: "Bulk Import",
          actionKey: "grants.import",
          icon: "upload",
          color: "green"
        },
        {
          key: "export_all",
          label: "Export All",
          actionKey: "grants.export.all",
          icon: "download",
          color: "purple"
        }
      ]
    },

    // Recent Activity
    {
      id: "recent_activity",
      type: "activity_feed",
      title: "Recent Activity",
      gridPosition: { col: 5, row: 7, colSpan: 8, rowSpan: 2 },
      dataKey: "grants.activity.recent",
      config: {
        maxItems: 10,
        showTimestamp: true,
        groupByDate: true
      }
    }
  ],

  filters: [
    {
      key: "status",
      type: "multi_select",
      label: "Status",
      options: [
        { value: "ACTIVE", label: "Active" },
        { value: "ARCHIVED", label: "Archived" },
        { value: "CANCELLED", label: "Cancelled" }
      ],
      defaultValue: ["ACTIVE"]
    },
    {
      key: "currency",
      type: "select",
      label: "Currency",
      options: [
        { value: "all", label: "All Currencies" },
        { value: "USD", label: "USD" },
        { value: "EUR", label: "EUR" },
        { value: "GBP", label: "GBP" },
        { value: "KES", label: "KES" }
      ],
      defaultValue: "all"
    }
  ]
};

module.exports = {
  grantsAnalyticsDashboardConfig,
  partnerAnalyticsDashboardConfig,
  grantsManagementDashboardConfig
};
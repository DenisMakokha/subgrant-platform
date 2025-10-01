const { v4: uuidv4 } = require('uuid');

class DashboardConfigService {
  constructor(db) {
    this.db = db;
  }

  async createDashboardConfig(configData) {
    const {
      name,
      description,
      layout,
      widgets,
      filters,
      permissions,
      createdBy
    } = configData;

    const dashboardId = uuidv4();
    const createdAt = new Date();

    const query = `
      INSERT INTO dashboard_configs (
        id, name, description, layout, widgets, filters, 
        permissions, created_by, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      dashboardId,
      name,
      description,
      JSON.stringify(layout),
      JSON.stringify(widgets),
      JSON.stringify(filters),
      JSON.stringify(permissions),
      createdBy,
      createdAt,
      createdAt
    ];

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getDashboardConfig(dashboardId) {
    const query = `
      SELECT * FROM dashboard_configs 
      WHERE id = $1 AND deleted_at IS NULL
    `;

    const result = await this.db.query(query, [dashboardId]);
    return result.rows[0];
  }

  async updateDashboardConfig(dashboardId, updates) {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (key === 'layout' || key === 'widgets' || key === 'filters' || key === 'permissions') {
      setClause.push(`${key} = $${paramCount}`);
      values.push(JSON.stringify(updates[key]));
    } else {
      setClause.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
    }
    paramCount++;
    });

    setClause.push(`updated_at = $${paramCount}`);
      values.push(new Date());
      values.push(dashboardId);

    const query = `
      UPDATE dashboard_configs 
      SET ${setClause.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async deleteDashboardConfig(dashboardId) {
    const query = `
      UPDATE dashboard_configs 
      SET deleted_at = $1
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await this.db.query(query, [new Date(), dashboardId]);
    return result.rows[0];
  }

  async listDashboardConfigs(userId, role) {
    const query = `
      SELECT * FROM dashboard_configs 
      WHERE (permissions->>'role' = $1 OR created_by = $2) 
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `;

    const result = await this.db.query(query, [role, userId]);
    return result.rows;
  }

  getDefaultTemplates() {
    return {
      financial_overview: {
        name: "Financial Overview Dashboard",
        description: "Comprehensive financial metrics and KPIs",
        layout: {
          type: "grid",
          columns: 12,
          rows: 6
      },
      widgets: [
        {
          id: "total_envelope",
          type: "metric",
          title: "Total Envelope",
          position: { x: 0, y: 0, w: 3, h: 2 },
          dataSource: "envelope_metrics",
          config: { metric: "total_amount" }
        },
        {
          id: "utilized_funds",
          type: "metric",
          title: "Utilized Funds",
          position: { x: 3, y: 0, w: 3, h: 2 },
          dataSource: "envelope_metrics",
          config: { metric: "utilized_amount" }
        },
        {
          id: "remaining_funds",
          type: "metric",
          title: "Remaining Funds",
          position: { x: 6, y: 0, w: 3, h: 2 },
          dataSource: "envelope_metrics",
          config: { metric: "remaining_amount" }
        },
        {
          id: "budget_breakdown",
          type: "pie_chart",
          title: "Budget Breakdown by Category",
          position: { x: 0, y: 2, w: 6, h: 4 },
          dataSource: "category_analytics",
          config: { groupBy: "category_name" }
        },
        {
          id: "spending_trend",
          type: "line_chart",
          title: "Spending Trend",
          position: { x: 6, y: 2, w: 6, h: 4 },
          dataSource: "spending_analytics",
          config: { period: "monthly" }
        }
      ],
      filters: [
        {
          id: "date_range",
          type: "date_range",
          field: "created_at",
          defaultValue: "last_30_days"
        }
      ],
      permissions: {
        role: "admin",
        users: [],
        groups: []
      }
    };
  }

  async cloneDashboardConfig(dashboardId, newName, createdBy) {
    const original = await this.getDashboardConfig(dashboardId);
    if (!original) {
      throw new Error("Dashboard configuration not found");
    }

    const clonedConfig = {
      name: newName,
      description: original.description,
      layout: original.layout,
      widgets: original.widgets,
      filters: original.filters,
      permissions: original.permissions,
      createdBy
    };

    return await this.createDashboardConfig(clonedConfig);
  }
}

module.exports = DashboardConfigService;
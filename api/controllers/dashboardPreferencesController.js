const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Dashboard Preferences Controller
 * 
 * Manages user dashboard preferences, widget configurations, and layouts
 */

/**
 * Get user's dashboard preferences
 */
async function getUserPreferences(req, res) {
  try {
    const userId = req.user.id;
    const { template } = req.query;

    let query = `
      SELECT 
        id, user_id, dashboard_template, widget_order, widget_config,
        layout_columns, theme, created_at, updated_at
      FROM dashboard_preferences
      WHERE user_id = $1
    `;
    
    const params = [userId];
    
    if (template) {
      query += ` AND dashboard_template = $2`;
      params.push(template);
    }

    const result = await db.pool.query(query, params);

    if (result.rows.length === 0) {
      // Return default preferences based on user role
      const defaultTemplate = getDefaultTemplateForRole(req.user.role);
      const templateResult = await db.pool.query(
        'SELECT * FROM dashboard_templates WHERE id = $1',
        [defaultTemplate]
      );

      if (templateResult.rows.length > 0) {
        const template = templateResult.rows[0];
        return res.json({
          success: true,
          data: {
            user_id: userId,
            dashboard_template: template.id,
            widget_order: template.default_widgets || [],
            widget_config: {},
            layout_columns: template.default_layout_columns || 3,
            theme: 'light',
            is_default: true
          }
        });
      }
    }

    res.json({
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null
    });
  } catch (error) {
    logger.error('Error getting user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user preferences'
    });
  }
}

/**
 * Save/Update user's dashboard preferences
 */
async function saveUserPreferences(req, res) {
  try {
    const userId = req.user.id;
    const {
      dashboard_template,
      widget_order,
      widget_config,
      layout_columns,
      theme
    } = req.body;

    // Validate input
    if (!dashboard_template) {
      return res.status(400).json({
        success: false,
        error: 'Dashboard template is required'
      });
    }

    if (layout_columns && (layout_columns < 1 || layout_columns > 4)) {
      return res.status(400).json({
        success: false,
        error: 'Layout columns must be between 1 and 4'
      });
    }

    // Upsert preferences
    const query = `
      INSERT INTO dashboard_preferences (
        user_id, dashboard_template, widget_order, widget_config, 
        layout_columns, theme, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, dashboard_template)
      DO UPDATE SET
        widget_order = EXCLUDED.widget_order,
        widget_config = EXCLUDED.widget_config,
        layout_columns = EXCLUDED.layout_columns,
        theme = EXCLUDED.theme,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await db.pool.query(query, [
      userId,
      dashboard_template,
      JSON.stringify(widget_order || []),
      JSON.stringify(widget_config || {}),
      layout_columns || 3,
      theme || 'light'
    ]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Dashboard preferences saved successfully'
    });
  } catch (error) {
    logger.error('Error saving user preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save user preferences'
    });
  }
}

/**
 * Get available widgets for user
 */
async function getAvailableWidgets(req, res) {
  try {
    const userRole = req.user.role;
    const { category, type } = req.query;

    let query = `
      SELECT 
        id, name, description, widget_type, category,
        default_config, required_capability, available_for_roles
      FROM dashboard_widgets
      WHERE is_active = true
        AND ($1 = ANY(available_for_roles) OR 'admin' = ANY(available_for_roles))
    `;

    const params = [userRole];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (type) {
      query += ` AND widget_type = $${paramIndex}`;
      params.push(type);
    }

    query += ` ORDER BY category, name`;

    const result = await db.pool.query(query, params);

    // Group by category
    const groupedWidgets = result.rows.reduce((acc, widget) => {
      const cat = widget.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(widget);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        widgets: result.rows,
        grouped: groupedWidgets
      }
    });
  } catch (error) {
    logger.error('Error getting available widgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available widgets'
    });
  }
}

/**
 * Get dashboard templates
 */
async function getDashboardTemplates(req, res) {
  try {
    const userRole = req.user.role;

    const query = `
      SELECT 
        id, name, description, target_role, default_widgets,
        default_layout_columns, is_system_template
      FROM dashboard_templates
      WHERE target_role = $1 OR is_system_template = true
      ORDER BY is_system_template DESC, name
    `;

    const result = await db.pool.query(query, [userRole]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error getting dashboard templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard templates'
    });
  }
}

/**
 * Reset user preferences to default
 */
async function resetToDefault(req, res) {
  try {
    const userId = req.user.id;
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'Template is required'
      });
    }

    // Delete existing preferences
    await db.pool.query(
      'DELETE FROM dashboard_preferences WHERE user_id = $1 AND dashboard_template = $2',
      [userId, template]
    );

    res.json({
      success: true,
      message: 'Dashboard preferences reset to default'
    });
  } catch (error) {
    logger.error('Error resetting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset preferences'
    });
  }
}

/**
 * Get widget data (for real-time updates)
 */
async function getWidgetData(req, res) {
  try {
    const { widgetId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const organizationId = req.user.organization_id;

    // Check if user has access to this widget
    const widgetResult = await db.pool.query(
      'SELECT * FROM dashboard_widgets WHERE id = $1 AND is_active = true',
      [widgetId]
    );

    if (widgetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }

    const widget = widgetResult.rows[0];

    // Check role access
    if (!widget.available_for_roles.includes(userRole) && !widget.available_for_roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this widget'
      });
    }

    // Fetch widget-specific data
    const data = await fetchWidgetData(widgetId, userId, userRole, organizationId);

    res.json({
      success: true,
      data: {
        widgetId,
        ...data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting widget data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get widget data'
    });
  }
}

/**
 * Helper: Get default template for role
 */
function getDefaultTemplateForRole(role) {
  const roleTemplateMap = {
    'admin': 'admin',
    'partner': 'partner',
    'partner_user': 'partner',
    'finance_manager': 'finance',
    'grants_manager': 'grants',
    'coo': 'executive'
  };

  return roleTemplateMap[role] || 'partner';
}

/**
 * Helper: Fetch widget-specific data
 */
async function fetchWidgetData(widgetId, userId, userRole, organizationId) {
  // This is a simplified version - you would implement specific queries for each widget
  const widgetDataFetchers = {
    // Admin widgets
    'admin_users_count': async () => {
      const result = await db.pool.query('SELECT COUNT(*) as count FROM users WHERE status = $1', ['active']);
      return { value: result.rows[0].count, label: 'Active Users' };
    },
    'admin_orgs_count': async () => {
      const result = await db.pool.query('SELECT COUNT(*) as count FROM organizations');
      return { value: result.rows[0].count, label: 'Organizations' };
    },
    'admin_projects_count': async () => {
      const result = await db.pool.query('SELECT COUNT(*) as count FROM projects WHERE status = $1', ['active']);
      return { value: result.rows[0].count, label: 'Active Projects' };
    },

    // Partner widgets
    'partner_active_projects': async () => {
      const result = await db.pool.query(
        'SELECT COUNT(*) as count FROM projects WHERE organization_id = $1 AND status = $2',
        [organizationId, 'active']
      );
      return { value: result.rows[0].count, label: 'Active Projects' };
    },
    'partner_budget_ceiling': async () => {
      const result = await db.pool.query(
        'SELECT COALESCE(SUM(ceiling_amount_usd), 0) as total FROM partner_budgets WHERE organization_id = $1',
        [organizationId]
      );
      return { value: result.rows[0].total, label: 'Budget Ceiling', format: 'currency' };
    },
    'partner_budget_spent': async () => {
      const result = await db.pool.query(
        'SELECT COALESCE(SUM(spent_amount_usd), 0) as total FROM partner_budgets WHERE organization_id = $1',
        [organizationId]
      );
      return { value: result.rows[0].total, label: 'Budget Spent', format: 'currency' };
    },
    'partner_reports_due': async () => {
      const result = await db.pool.query(
        `SELECT COUNT(*) as count FROM grant_reporting_dates 
         WHERE organization_id = $1 AND status = $2 AND due_date <= CURRENT_DATE + INTERVAL '7 days'`,
        [organizationId, 'pending']
      );
      return { value: result.rows[0].count, label: 'Reports Due' };
    }
  };

  const fetcher = widgetDataFetchers[widgetId];
  if (fetcher) {
    return await fetcher();
  }

  // Default empty data
  return { value: 0, label: 'No Data' };
}

/**
 * Get dashboard configuration by ID
 */
async function getDashboardConfig(req, res) {
  try {
    const { id } = req.params;
    
    const result = await db.pool.query(
      'SELECT * FROM dashboard_templates WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Dashboard template not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    logger.error('Error fetching dashboard config:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Get dashboard template for specific role
 */
async function getDashboardForRole(req, res) {
  try {
    const { role } = req.params;
    
    const result = await db.pool.query(
      'SELECT * FROM dashboard_templates WHERE target_role = $1',
      [role]
    );
    
    if (result.rows.length === 0) {
      // Return default template
      const defaultResult = await db.pool.query(
        'SELECT * FROM dashboard_templates WHERE id = $1',
        ['partner']
      );
      
      return res.json({ 
        success: true, 
        data: defaultResult.rows[0] 
      });
    }
    
    res.json({ 
      success: true, 
      data: result.rows[0] 
    });
  } catch (error) {
    logger.error('Error fetching dashboard for role:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

/**
 * Create custom dashboard template
 */
async function createDashboardTemplate(req, res) {
  try {
    const {
      id,
      name,
      description,
      target_role,
      default_widgets,
      default_layout_columns,
      is_system_template
    } = req.body;

    // Validate required fields
    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and name are required'
      });
    }

    const result = await db.pool.query(
      `INSERT INTO dashboard_templates 
       (id, name, description, target_role, default_widgets, default_layout_columns, is_system_template)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         default_widgets = EXCLUDED.default_widgets,
         default_layout_columns = EXCLUDED.default_layout_columns,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        id,
        name,
        description,
        target_role,
        JSON.stringify(default_widgets || []),
        default_layout_columns || 3,
        is_system_template || false
      ]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Dashboard template created successfully'
    });
  } catch (error) {
    logger.error('Error creating dashboard template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getUserPreferences,
  saveUserPreferences,
  getAvailableWidgets,
  getDashboardTemplates,
  resetToDefault,
  getWidgetData,
  getDashboardConfig,
  getDashboardForRole,
  createDashboardTemplate
};

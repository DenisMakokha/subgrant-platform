const db = require('../config/database');

/**
 * Dashboard Controller
 * 
 * Handles dashboard configuration, preferences, and widget data
 * Supports universal dashboard system with capability-based access
 */

// Get user dashboard preferences
const getPreferences = async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;

    const query = `
      SELECT * FROM dashboard_preferences
      WHERE user_id = $1
      LIMIT 1
    `;

    const result = await db.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'No preferences found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard preferences'
    });
  }
};

// Update user dashboard preferences
const updatePreferences = async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    const {
      dashboard_id,
      layout,
      widget_order,
      hidden_widgets,
      refresh_interval,
      theme
    } = req.body;

    // Check if preferences exist
    const checkQuery = 'SELECT id FROM dashboard_preferences WHERE user_id = $1';
    const checkResult = await db.pool.query(checkQuery, [userId]);

    let query;
    let values;

    if (checkResult.rows.length === 0) {
      // Insert new preferences
      query = `
        INSERT INTO dashboard_preferences (
          user_id, dashboard_id, layout, widget_order,
          hidden_widgets, refresh_interval, theme, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      values = [
        userId,
        dashboard_id,
        layout || 'grid',
        JSON.stringify(widget_order || []),
        JSON.stringify(hidden_widgets || []),
        refresh_interval || 300000,
        theme || 'auto'
      ];
    } else {
      // Update existing preferences
      query = `
        UPDATE dashboard_preferences
        SET
          dashboard_id = COALESCE($2, dashboard_id),
          layout = COALESCE($3, layout),
          widget_order = COALESCE($4, widget_order),
          hidden_widgets = COALESCE($5, hidden_widgets),
          refresh_interval = COALESCE($6, refresh_interval),
          theme = COALESCE($7, theme),
          updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
      `;
      values = [
        userId,
        dashboard_id,
        layout,
        widget_order ? JSON.stringify(widget_order) : null,
        hidden_widgets ? JSON.stringify(hidden_widgets) : null,
        refresh_interval,
        theme
      ];
    }

    const result = await db.pool.query(query, values);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Dashboard preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating dashboard preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update dashboard preferences'
    });
  }
};

// Reset dashboard preferences to default
const resetPreferences = async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;

    const query = 'DELETE FROM dashboard_preferences WHERE user_id = $1';
    await db.pool.query(query, [userId]);

    res.json({
      success: true,
      message: 'Dashboard preferences reset to default'
    });
  } catch (error) {
    console.error('Error resetting dashboard preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset dashboard preferences'
    });
  }
};

// Get dashboard configuration by ID
const getDashboardConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT * FROM dashboard_configs
      WHERE id = $1
      LIMIT 1
    `;

    const result = await db.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Dashboard configuration not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching dashboard config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard configuration'
    });
  }
};

// Get widget data
const getWidgetData = async (req, res) => {
  try {
    const { widgetId } = req.params;
    const userId = req.auth.sub || req.auth.user_id;

    // Route to appropriate widget data handler
    switch (widgetId) {
      case 'budget-summary':
        return await getBudgetSummaryData(req, res, userId);
      case 'project-timeline':
        return await getProjectTimelineData(req, res, userId);
      case 'approval-queue':
        return await getApprovalQueueData(req, res, userId);
      case 'compliance-status':
        return await getComplianceStatusData(req, res, userId);
      case 'recent-issues':
        return await getRecentIssuesData(req, res, userId);
      case 'upcoming-reports':
        return await getUpcomingReportsData(req, res, userId);
      default:
        return res.status(404).json({
          success: false,
          error: 'Widget not found'
        });
    }
  } catch (error) {
    console.error('Error fetching widget data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch widget data'
    });
  }
};

// Widget data handlers
async function getBudgetSummaryData(req, res, userId) {
  // Implementation would query budget data
  res.json({
    success: true,
    data: {
      total: 250000,
      spent: 187500,
      remaining: 62500,
      utilization: 75
    }
  });
}

async function getProjectTimelineData(req, res, userId) {
  // Implementation would query project data
  res.json({
    success: true,
    data: []
  });
}

async function getApprovalQueueData(req, res, userId) {
  // Implementation would query approval data
  res.json({
    success: true,
    data: []
  });
}

async function getComplianceStatusData(req, res, userId) {
  // Implementation would query compliance data
  res.json({
    success: true,
    data: {
      total: 10,
      compliant: 8,
      pending: 1,
      overdue: 1,
      complianceRate: 80
    }
  });
}

async function getRecentIssuesData(req, res, userId) {
  // Implementation would query issues data
  res.json({
    success: true,
    data: []
  });
}

async function getUpcomingReportsData(req, res, userId) {
  // Implementation would query reports data
  res.json({
    success: true,
    data: []
  });
}

module.exports = {
  getPreferences,
  updatePreferences,
  resetPreferences,
  getDashboardConfig,
  getWidgetData
};

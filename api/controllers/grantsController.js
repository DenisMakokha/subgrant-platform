const CreateGrantService = require('../services/grants/createGrantService');
const GrantsAnalyticsService = require('../services/grants/grantsAnalyticsService');

class GrantsController {
  static async createGrant(req, res) {
    try {
      const actorId = req.user.id;
      const dto = req.body;
      
      const grant = await CreateGrantService.createGrant(dto, actorId);
      
      res.status(201).json({
        success: true,
        data: grant
      });
    } catch (error) {
      console.error('Create grant failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async getGrantAnalytics(req, res) {
    try {
      const { projectId } = req.params;
      
      const analytics = await GrantsAnalyticsService.calculateEnvelopeMetrics(projectId);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Get grant analytics failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  static async refreshAnalytics(req, res) {
    try {
      const { projectId } = req.params;
      
      await GrantsAnalyticsService.refreshDailyAnalytics(projectId);
      
      res.json({
        success: true,
        message: 'Analytics refreshed successfully'
      });
    } catch (error) {
      console.error('Refresh analytics failed:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = GrantsController;

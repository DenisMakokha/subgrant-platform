const RenewalAlertService = require('../services/renewalAlertService');

class RenewalAlertController {
  // Get renewal alerts for the current user
  static async getRenewalAlerts(req, res, next) {
    try {
      const userId = req.user.id;
      const alerts = await RenewalAlertService.getRenewalAlertsForUser(userId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }
  
  // Send renewal alerts (admin only)
  static async sendRenewalAlerts(req, res, next) {
    try {
      const result = await RenewalAlertService.sendRenewalAlerts();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
  
  // Check for renewal alerts (for testing)
  static async checkRenewalAlerts(req, res, next) {
    try {
      const alerts = await RenewalAlertService.checkForRenewalAlerts();
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RenewalAlertController;
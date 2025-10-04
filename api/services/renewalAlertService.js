const Project = require('../models/project');
const logger = require('../utils/logger');

class RenewalAlertService {
  // Check for projects that need renewal alerts
  static async checkForRenewalAlerts() {
    try {
      // Get all active projects
      const activeProjects = await Project.findByStatus('active');
      
      const alerts = [];
      const now = new Date();
      
      // Check each project for renewal alerts
      for (const project of activeProjects) {
        // Calculate days until project close date
        const closeDate = new Date(project.close_date);
        const timeDiff = closeDate.getTime() - now.getTime();
        const daysUntilClose = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Generate alerts for different time periods
        if (daysUntilClose <= 30 && daysUntilClose > 7) {
          alerts.push({
            type: 'project_renewal_30_days',
            projectId: project.id,
            projectName: project.name,
            daysUntilClose: daysUntilClose,
            severity: 'medium',
            message: `Project "${project.name}" will close in ${daysUntilClose} days. Consider renewal.`
          });
        } else if (daysUntilClose <= 7 && daysUntilClose > 0) {
          alerts.push({
            type: 'project_renewal_7_days',
            projectId: project.id,
            projectName: project.name,
            daysUntilClose: daysUntilClose,
            severity: 'high',
            message: `Project "${project.name}" will close in ${daysUntilClose} days. Immediate renewal action required.`
          });
        } else if (daysUntilClose <= 0) {
          alerts.push({
            type: 'project_expired',
            projectId: project.id,
            projectName: project.name,
            daysSinceClose: Math.abs(daysUntilClose),
            severity: 'critical',
            message: `Project "${project.name}" has been closed for ${Math.abs(daysUntilClose)} days. Renewal is overdue.`
          });
        }
      }
      
      return alerts;
    } catch (error) {
      logger.error('Error checking for renewal alerts:', error);
      return [];
    }
  }
  
  // Get renewal alerts for a specific user
  static async getRenewalAlertsForUser(userId) {
    try {
      // Get projects for the user
      const userProjects = await Project.findByUserId(userId);
      
      // Get all renewal alerts
      const allAlerts = await this.checkForRenewalAlerts();
      
      // Filter alerts to only include those for the user's projects
      const userAlerts = allAlerts.filter(alert =>
        userProjects.some(project => project.id === alert.projectId)
      );
      
      return userAlerts;
    } catch (error) {
      logger.error('Error getting renewal alerts for user:', error);
      return [];
    }
  }
  
  // Send renewal alert notifications
  static async sendRenewalAlerts() {
    try {
      const alerts = await this.checkForRenewalAlerts();
      
      // In a real implementation, you would send these alerts via email, SMS, or in-app notifications
      // For now, we'll just log them
      if (alerts.length > 0) {
        logger.info(`Sending ${alerts.length} renewal alerts:`);
        alerts.forEach(alert => {
          logger.info(`- ${alert.severity.toUpperCase()}: ${alert.message}`);
        });
      } else {
        logger.info('No renewal alerts to send');
      }
      
      return { 
        message: 'Renewal alerts processed', 
        alertCount: alerts.length 
      };
    } catch (error) {
      logger.error('Error sending renewal alerts:', error);
      return { 
        message: 'Error processing renewal alerts', 
        alertCount: 0 
      };
    }
  }
}

module.exports = RenewalAlertService;
const Project = require('../models/project');

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
      console.error('Error checking for renewal alerts:', error);
      return [];
    }
  }
  
  // Get renewal alerts for a specific user
  static async getRenewalAlertsForUser(userId) {
    try {
      // For now, we'll return all renewal alerts
      // In a real implementation, you might filter by user's projects
      return await this.checkForRenewalAlerts();
    } catch (error) {
      console.error('Error getting renewal alerts for user:', error);
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
        console.log(`Sending ${alerts.length} renewal alerts:`);
        alerts.forEach(alert => {
          console.log(`- ${alert.severity.toUpperCase()}: ${alert.message}`);
        });
      } else {
        console.log('No renewal alerts to send');
      }
      
      return { 
        message: 'Renewal alerts processed', 
        alertCount: alerts.length 
      };
    } catch (error) {
      console.error('Error sending renewal alerts:', error);
      return { 
        message: 'Error processing renewal alerts', 
        alertCount: 0 
      };
    }
  }
}

module.exports = RenewalAlertService;
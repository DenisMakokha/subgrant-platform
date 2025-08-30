const AuditLog = require('../models/auditLog');

// Middleware to log actions
const auditLogger = (action, entityType) => {
  return async (req, res, next) => {
    try {
      // Skip audit logging for GET requests
      if (req.method === 'GET') {
        return next();
      }
      
      // Get the entity ID from the request parameters or body
      const entityId = req.params.id || req.body.id;
      
      // Get the user ID from the authenticated user
      const actorId = req.user ? req.user.id : null;
      
      // Get IP address and user agent
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      // Capture the state before the operation for PUT and PATCH requests
      let beforeState = null;
      if ((req.method === 'PUT' || req.method === 'PATCH') && entityId) {
        // This would require importing the appropriate model for the entity type
        // For now, we'll leave this as null and implement it properly later
        beforeState = null;
      }
      
      // Store the original send and json methods
      const originalSend = res.send;
      const originalJson = res.json;
      
      // Override the send method to capture the response
      res.send = function(data) {
        // Capture the state after the operation
        let afterState = null;
        if (data && typeof data === 'string') {
          try {
            afterState = JSON.parse(data);
          } catch (e) {
            // If it's not valid JSON, just store the string
            afterState = data;
          }
        } else {
          afterState = data;
        }
        
        // Create the audit log entry
        createAuditLogEntry(actorId, action, entityType, entityId, beforeState, afterState, ipAddress, userAgent);
        
        // Call the original send method
        originalSend.call(this, data);
      };
      
      // Override the json method to capture the response
      res.json = function(data) {
        // Capture the state after the operation
        const afterState = data;
        
        // Create the audit log entry
        createAuditLogEntry(actorId, action, entityType, entityId, beforeState, afterState, ipAddress, userAgent);
        
        // Call the original json method
        originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Error in audit logger middleware:', error);
      next();
    }
  };
};

// Helper function to create audit log entry
async function createAuditLogEntry(actorId, action, entityType, entityId, beforeState, afterState, ipAddress, userAgent) {
  try {
    const auditData = {
      actor_id: actorId,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      before_state: beforeState,
      after_state: afterState,
      ip_address: ipAddress,
      user_agent: userAgent
    };
    
    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Error creating audit log entry:', error);
  }
}

// Direct function to create audit log entry (for manual logging)
auditLogger.create = async function(auditData) {
  try {
    return await AuditLog.create(auditData);
  } catch (error) {
    console.error('Error creating audit log entry:', error);
    throw error;
  }
};

// Function to get audit logs for an entity
auditLogger.getAuditLogsForEntity = async function(entityType, entityId) {
  try {
    return await AuditLog.findByEntity(entityType, entityId);
  } catch (error) {
    console.error('Error fetching audit logs for entity:', error);
    throw error;
  }
};

// Function to get audit logs for an actor
auditLogger.getAuditLogsForActor = async function(actorId) {
  try {
    return await AuditLog.findByActor(actorId);
  } catch (error) {
    console.error('Error fetching audit logs for actor:', error);
    throw error;
  }
};

// Function to get audit logs by action
auditLogger.getAuditLogsByAction = async function(action) {
  try {
    return await AuditLog.findByAction(action);
  } catch (error) {
    console.error('Error fetching audit logs by action:', error);
    throw error;
  }
};

// Function to get all audit logs with filters
auditLogger.getAllAuditLogs = async function(filters = {}, limit = 50, offset = 0) {
  try {
    return await AuditLog.findAll(filters, limit, offset);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
};

// Function to get audit log count with filters
auditLogger.getAuditLogCount = async function(filters = {}) {
  try {
    return await AuditLog.getCount(filters);
  } catch (error) {
    console.error('Error fetching audit log count:', error);
    throw error;
  }
};

module.exports = auditLogger;
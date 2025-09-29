// Security middleware for RLS and other security checks

/**
 * Apply Row Level Security based on user scopes
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
function applyRLS(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Extract scopes from user
    const scopes = user.scopes || { project: 'self', tenant: 'current' };
    
    // Add RLS context to request
    req.rls = {
      project: scopes.project,
      tenant: scopes.tenant,
      userId: user.id
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user has specific security permissions
 * @param {string} resource - Resource to check permissions for
 * @param {string} action - Action to check permissions for
 * @returns {import('express').RequestHandler}
 */
function checkSecurity(resource, action) {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // In a real implementation, this would check against the security policies
      // For now, we'll just log the check
      console.log(`Security check: ${user.id} attempting ${action} on ${resource}`);
      
      // Add security context to request
      req.security = {
        resource,
        action,
        userId: user.id
      };
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  applyRLS,
  checkSecurity
};
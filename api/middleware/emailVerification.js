const User = require('../models/user');
const logger = require('../utils/logger');

// Middleware to check if user's email is verified
const requireEmailVerification = async (req, res, next) => {
  try {
    // Get user ID from JWT token (assuming it's already verified by auth middleware)
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user from database
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is verified
    if (!user.email_verified_at) {
      return res.status(403).json({
        error: 'Email verification required',
        message: 'Please verify your email address to access this feature',
        email: user.email,
        requiresVerification: true
      });
    }
    
    // Add user to request object for use in route handlers
    req.verifiedUser = user;
    next();
  } catch (error) {
    logger.error('Email verification middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check onboarding status
const checkOnboardingStatus = async (req, res, next) => {
  try {
    const user = req.verifiedUser || req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Allow access to onboarding routes if status is 'start' or beyond
    const allowedStatuses = ['start', 'profile_complete', 'organization_setup', 'completed'];
    
    if (!allowedStatuses.includes(user.onboarding_status)) {
      return res.status(403).json({
        error: 'Onboarding incomplete',
        message: 'Please complete your onboarding process',
        onboarding_status: user.onboarding_status
      });
    }
    
    next();
  } catch (error) {
    logger.error('Onboarding status middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  requireEmailVerification,
  checkOnboardingStatus
};

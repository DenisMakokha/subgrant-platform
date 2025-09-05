const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Organization = require('../models/organization');
const { authenticator } = require('otplib');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'subgrant_platform_secret_key';
    this.jwtExpiration = process.env.JWT_EXPIRATION || '4h';
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      org_id: user.organization_id
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiration
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Register a new user
  async register(userData) {
    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if organization exists (if provided)
    if (userData.organization_id) {
      const organization = await Organization.findById(userData.organization_id);
      if (!organization) {
        throw new Error('Organization not found');
      }
    }

    // Create the user
    const user = await User.create(userData);
    return user;
  }

  // Login user
  async login(email, password) {
    // Find user by email in database
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user account is active
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check if MFA is enabled
    if (user.mfa_enabled) {
      // For MFA enabled accounts, we return a partial token
      // The full token will be generated after MFA verification
      const partialPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        org_id: user.organization_id,
        mfa_required: true
      };

      return {
        token: jwt.sign(partialPayload, this.jwtSecret, { expiresIn: '5m' }),
        mfa_required: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          organization_id: user.organization_id
        }
      };
    }

    // Generate full JWT token
    const token = this.generateToken(user);
    
    // Update last login time
    await User.update(user.id, { last_login: new Date() });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id
      }
    };
  }

  // Verify MFA token
  async verifyMFA(user, token) {
    if (!user.mfa_secret) {
      throw new Error('MFA not properly configured for this user');
    }

    const isValid = authenticator.check(token, user.mfa_secret);
    if (!isValid) {
      throw new Error('Invalid MFA code');
    }

    // Generate full JWT token after successful MFA
    const fullToken = this.generateToken(user);
    
    // Update last login time
    await User.update(user.id, { last_login: new Date() });

    return {
      token: fullToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id
      }
    };
  }

  // Setup MFA for user
  async setupMFA(userId) {
    // Generate a new secret for the user
    const secret = authenticator.generateSecret();
    
    // Update user with the secret
    const user = await User.update(userId, { mfa_secret: secret });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Generate OTP auth URL for QR code
    const service = 'SubGrant Platform';
    const otpauth = authenticator.keyuri(user.email, service, secret);

    return {
      secret,
      otpauth,
      user
    };
  }

  // Enable MFA for user
  async enableMFA(userId, token) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.mfa_secret) {
      throw new Error('MFA not properly configured for this user');
    }

    // Verify the token
    const isValid = authenticator.check(token, user.mfa_secret);
    if (!isValid) {
      throw new Error('Invalid MFA code');
    }

    // Enable MFA
    const updatedUser = await User.update(userId, { mfa_enabled: true });
    
    return updatedUser;
  }

  // Disable MFA for user
  async disableMFA(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Disable MFA and clear secret
    const updatedUser = await User.update(userId, { 
      mfa_enabled: false,
      mfa_secret: null 
    });
    
    return updatedUser;
  }
}

module.exports = new AuthService();
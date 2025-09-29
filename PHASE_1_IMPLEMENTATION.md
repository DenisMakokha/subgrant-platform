# Phase 1 Implementation Plan

This document outlines the detailed implementation plan for Phase 1 improvements to bring the existing SSOT implementations (budgets, contracts, fund requests) up to production level standards.

## 1. Validation Schemas (Zod/TS)

### 1.1 Create Zod Schemas

#### Budget Schemas
- Create `BudgetSchema` for budget entities
- Create `BudgetLineSchema` for budget line entities
- Create `BudgetTemplateSchema` for budget template entities
- Create `BudgetCategorySchema` for budget category entities

#### Contract Schemas
- Create `ContractSchema` for contract entities
- Create `ContractTemplateSchema` for contract template entities
- Create `ContractArtifactSchema` for contract artifact entities

#### Fund Request Schemas
- Create `FundRequestSchema` for fund request entities

### 1.2 Implement Validation Middleware

#### Create validation middleware
```javascript
// middleware/validation.js
const { ZodError } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

module.exports = { validate };
```

### 1.3 Add TypeScript Interfaces

#### Budget Interfaces
- Create `Budget` interface
- Create `BudgetLine` interface
- Create `BudgetTemplate` interface
- Create `BudgetCategory` interface

#### Contract Interfaces
- Create `Contract` interface
- Create `ContractTemplate` interface
- Create `ContractArtifact` interface

#### Fund Request Interfaces
- Create `FundRequest` interface

### 1.4 Update Controllers

#### Update budget controller
- Add validation middleware to all endpoints
- Update error handling to use consistent patterns
- Add proper type annotations

#### Update contract controller
- Add validation middleware to all endpoints
- Update error handling to use consistent patterns
- Add proper type annotations

#### Update fund request controller
- Add validation middleware to all endpoints
- Update error handling to use consistent patterns
- Add proper type annotations

## 2. Error Handling

### 2.1 Create Custom Error Classes

#### Create error classes
```javascript
// errors/ValidationError.js
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.status = 400;
  }
}

// errors/NotFoundError.js
class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

// errors/UnauthorizedError.js
class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = 401;
  }
}

// errors/ForbiddenError.js
class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ForbiddenError';
    this.status = 403;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError
};
```

### 2.2 Implement Error Middleware

#### Create error middleware
```javascript
// middleware/errorHandler.js
const { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } = require('../errors');

function errorHandler(error, req, res, next) {
  // Log the error
  console.error('Error:', error);
  
  // Handle different error types
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: error.message,
      details: error.details
    });
  }
  
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: error.message
    });
  }
  
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      error: error.message
    });
  }
  
  if (error instanceof ForbiddenError) {
    return res.status(403).json({
      error: error.message
    });
  }
  
  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }
  
  // Handle database errors
  if (error.code && error.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Database constraint violation'
    });
  }
  
  // Default error
  res.status(500).json({
    error: 'Internal server error'
  });
}

module.exports = { errorHandler };
```

### 2.3 Update Controllers to Use Error Classes

#### Update all controllers to throw appropriate error classes
- Replace generic errors with specific error classes
- Add proper error messages and details
- Ensure consistent error handling patterns

## 3. Security Integration

### 3.1 Enhance RBAC Middleware

#### Update RBAC middleware to include security context
```javascript
// middleware/rbac.js
const User = require('../models/user');
const { applyRLS } = require('./security');

function checkPermission(resource, action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.sub || req.user.id;
      const userRole = req.user.role;

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if role exists in permissions
      if (!rolePermissions[userRole]) {
        return res.status(403).json({ error: 'Access denied: Invalid role' });
      }

      // Check if resource exists for this role
      if (!rolePermissions[userRole][resource]) {
        return res.status(403).json({ error: `Access denied: No permissions for ${resource}` });
      }

      // Check if action is allowed for this resource
      if (!rolePermissions[userRole][resource].includes(action)) {
        return res.status(403).json({ error: `Access denied: No permission to ${action} ${resource}` });
      }

      // For partner users, check if they're accessing their own organization's data
      if (userRole === 'partner_user' && user.organization_id) {
        // Add organization_id to request for filtering in controllers
        req.user.organization_id = user.organization_id;
      }

      // Apply Row Level Security
      applyRLS(req, res, () => {
        next();
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
```

### 3.2 Implement Input Sanitization

#### Add input sanitization middleware
```javascript
// middleware/sanitization.js
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeInput(req, res, next) {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = DOMPurify.sanitize(req.query[key]);
    }
  }
  
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key]);
      }
    }
  }
  
  next();
}

module.exports = { sanitizeInput };
```

### 3.3 Update Controllers to Use Security Features

#### Update all controllers to use security middleware
- Add input sanitization to all endpoints
- Ensure proper RBAC checks
- Implement RLS where appropriate

## 4. Observability

### 4.1 Add Logging to Controllers

#### Update controllers to use observability service
```javascript
// controllers/budgetController.js
const { logApiCall, logError } = require('../services/observabilityService');

exports.createBudget = async (req, res, next) => {
  const startTime = Date.now();
  try {
    const actorId = req.user.id;
    const { project_id, partner_id, currency, rules_json, lines } = req.body;

    const result = await BudgetDraftService.createDraft({
      actorId,
      projectId: project_id,
      partnerId: partner_id,
      currency,
      rulesJson: rules_json,
      lines
    });
    
    // Log successful API call
    logApiCall('POST', '/budgets', 201, Date.now() - startTime, actorId);
    
    res.status(201).json(result);
  } catch (error) {
    // Log error
    logError(error, 'createBudget', { userId: req.user.id });
    
    // Log failed API call
    logApiCall('POST', '/budgets', 500, Date.now() - startTime, req.user.id);
    
    next(error);
  }
};
```

### 4.2 Add Metrics Collection

#### Update services to collect metrics
```javascript
// services/budgets/budgetDraftService.js
const { logBudgetCreation } = require('../../services/observabilityService');

exports.createDraft = async (params) => {
  try {
    // Create budget draft logic
    
    // Log budget creation
    logBudgetCreation(result.id, params.projectId, params.partnerId, params.actorId);
    
    return result;
  } catch (error) {
    throw error;
  }
};
```

### 4.3 Add Health Checks

#### Create health check endpoints for all services
```javascript
// controllers/healthController.js
const { getHealthStatus } = require('../services/observabilityService');

exports.checkBudgetHealth = async (req, res, next) => {
  try {
    // Check budget service health
    const health = await getHealthStatus();
    
    // Add budget-specific health checks
    health.budgetService = 'healthy';
    
    res.json(health);
  } catch (error) {
    next(error);
  }
};
```

## Implementation Timeline

### Week 1

#### Days 1-2: Validation Schemas
- Create Zod schemas for all entities
- Implement validation middleware
- Add TypeScript interfaces

#### Days 3-4: Error Handling
- Create custom error classes
- Implement error middleware
- Update controllers to use error classes

#### Days 5-7: Security Integration
- Enhance RBAC middleware
- Implement input sanitization
- Update controllers to use security features

### Week 2

#### Days 1-3: Observability
- Add logging to controllers
- Add metrics collection to services
- Add health checks for all services

#### Days 4-5: Testing
- Write unit tests for new validation schemas
- Write unit tests for error handling
- Write unit tests for security features
- Write unit tests for observability features

#### Days 6-7: Integration and Refinement
- Integrate all features
- Fix any issues discovered during testing
- Optimize performance
- Document changes

## Testing Strategy

### Unit Tests
- Test all Zod schemas with valid and invalid data
- Test error middleware with different error types
- Test security middleware with different user roles
- Test observability features with different scenarios

### Integration Tests
- Test validation middleware with real endpoints
- Test error handling with real endpoints
- Test security features with real endpoints
- Test observability features with real endpoints

### End-to-End Tests
- Test complete workflows with validation, error handling, security, and observability
- Test edge cases and error scenarios
- Test performance under load

## Quality Assurance

### Code Review Checklist
- [ ] All Zod schemas are properly defined
- [ ] All error handling uses consistent patterns
- [ ] All security features are properly implemented
- [ ] All observability features are properly implemented
- [ ] All code follows established patterns and conventions
- [ ] All tests are passing
- [ ] All documentation is up to date

### Performance Benchmarks
- [ ] API response times are within acceptable limits
- [ ] Database queries are optimized
- [ ] Memory usage is within acceptable limits
- [ ] CPU usage is within acceptable limits

## Rollout Plan

### Staging Environment
1. Deploy changes to staging environment
2. Run comprehensive tests
3. Monitor performance and stability
4. Fix any issues discovered

### Production Environment
1. Deploy changes to production environment during maintenance window
2. Monitor closely for first 24 hours
3. Roll back if any critical issues are discovered
4. Gradually increase traffic if no issues are found

## Monitoring and Maintenance

### Post-Deployment Monitoring
- Monitor API response times
- Monitor error rates
- Monitor security events
- Monitor system performance

### Ongoing Maintenance
- Regular security audits
- Performance optimization
- Update dependencies
- Add new features based on feedback

## Conclusion

This Phase 1 implementation plan will bring the existing SSOT implementations up to production level standards by implementing proper validation, error handling, security, and observability features. The plan is designed to be executed over two weeks with comprehensive testing and quality assurance measures.
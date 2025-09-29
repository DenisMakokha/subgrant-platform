# SSOT Improvement Plan

This document outlines the improvements that should be made to the existing SSOT implementations (budgets, contracts, fund requests) based on the admin SSOT implementation.

## 1. Validation Schemas (Zod/TS)

### Current State
- Admin SSOT: Uses Zod schemas for validation
- Other SSOTs: Use basic validation in controllers

### Improvements
- Create Zod schemas for all entities in budgets, contracts, and fund requests
- Implement validation middleware that uses these schemas
- Add TypeScript interfaces for all entities

### Implementation Steps
1. Create Zod schemas for:
   - Budget entities (budget, budget line, budget template)
   - Contract entities (contract, contract template, contract artifact)
   - Fund request entities (fund request)
2. Create validation middleware that validates request bodies against schemas
3. Add TypeScript interfaces for all entities
4. Update controllers to use validation middleware

## 2. Registry Integration

### Current State
- Admin SSOT: Properly integrates with registries (capabilities, data keys, etc.)
- Other SSOTs: Have hardcoded validation and limited registry integration

### Improvements
- Update data controllers to use the data key registry for validation
- Update action controllers to use the action registry for validation
- Add entity-specific data keys and actions to the registries

### Implementation Steps
1. Update dataController to validate against DATA_KEYS registry
2. Update actionController to validate against ACTIONS registry
3. Add budget, contract, and fund request specific data keys to DATA_KEYS registry
4. Add budget, contract, and fund request specific actions to ACTIONS registry

## 3. Caching

### Current State
- Admin SSOT: Has proper caching with cache invalidation
- Other SSOTs: Don't have caching implemented

### Improvements
- Implement caching for frequently accessed data
- Add cache invalidation for data modification operations
- Use the existing registryCache system

### Implementation Steps
1. Add caching to dataController for frequently accessed data
2. Implement cache invalidation in controllers when data is modified
3. Add cache keys for different entity types
4. Set appropriate TTL values for different data types

## 4. Error Handling

### Current State
- Admin SSOT: Has consistent error handling
- Other SSOTs: Have inconsistent error handling

### Improvements
- Implement consistent error handling across all controllers
- Create custom error classes for different error types
- Add proper HTTP status codes and error messages

### Implementation Steps
1. Create custom error classes for different error types:
   - ValidationError
   - NotFoundError
   - UnauthorizedError
   - ForbiddenError
2. Update controllers to use consistent error handling patterns
3. Add proper HTTP status codes and error messages
4. Implement error middleware for centralized error handling

## 5. Security

### Current State
- Admin SSOT: Properly integrates with the security system
- Other SSOTs: Have basic RBAC but limited security integration

### Improvements
- Implement Row Level Security (RLS) for all entities
- Add security context to all requests
- Implement proper input sanitization

### Implementation Steps
1. Update RBAC middleware to include security context
2. Implement RLS for all entities based on user scopes
3. Add input sanitization for all user inputs
4. Implement proper authentication and authorization checks

## 6. Observability

### Current State
- Admin SSOT: Has proper logging and metrics
- Other SSOTs: Have limited observability

### Improvements
- Add logging to all controllers and services
- Implement metrics collection for key operations
- Add health checks for all services

### Implementation Steps
1. Add logging to all controllers and services using observabilityService
2. Implement metrics collection for key operations:
   - API calls
   - Database operations
   - Approval requests
3. Add health checks for all services
4. Implement proper log levels (debug, info, warn, error)

## 7. Feature Flags

### Current State
- Admin SSOT: Integrates with feature flags
- Other SSOTs: Don't use feature flags

### Improvements
- Add feature flags for different functionality
- Implement feature flag checks in controllers
- Add feature flag support to services

### Implementation Steps
1. Add feature flags for different functionality:
   - Budget approval workflow
   - Contract signing
   - Fund request submission
2. Implement feature flag checks in controllers
3. Add feature flag support to services
4. Update runtimeController to return feature flags for users

## 8. Hot-Reload

### Current State
- Admin SSOT: Supports hot-reload through cache invalidation
- Other SSOTs: Don't support hot-reload

### Improvements
- Implement cache invalidation for configuration changes
- Add support for runtime configuration updates
- Implement proper cache invalidation patterns

### Implementation Steps
1. Implement cache invalidation for configuration changes
2. Add support for runtime configuration updates
3. Implement proper cache invalidation patterns for different entity types
4. Add cache invalidation to adminController for registry updates

## 9. Data Key and Action Registry Expansion

### Current State
- Basic data keys and actions are defined
- Limited coverage of all entity operations

### Improvements
- Expand data keys to cover all entity operations
- Add actions for all entity operations
- Implement proper parameter validation for data keys

### Implementation Steps
1. Expand DATA_KEYS registry to include:
   - Budget data keys (list, detail, summary, etc.)
   - Contract data keys (list, detail, artifacts, etc.)
   - Fund request data keys (list, detail, status, etc.)
2. Expand ACTIONS registry to include:
   - Budget actions (create, update, submit, approve, etc.)
   - Contract actions (create, update, submit, sign, etc.)
   - Fund request actions (create, update, submit, approve, etc.)
3. Implement proper parameter validation for all data keys

## 10. Capability Catalog Integration

### Current State
- Admin SSOT: Integrates with capability catalog
- Other SSOTs: Don't integrate with capability catalog

### Improvements
- Map entity operations to capabilities
- Implement capability-based access control
- Add capability checks to controllers

### Implementation Steps
1. Map entity operations to capabilities in CAPABILITIES registry
2. Implement capability-based access control in controllers
3. Add capability checks to controllers
4. Update runtimeController to return user capabilities

## 11. Approval System Integration

### Current State
- Admin SSOT: Has approval system integration
- Other SSOTs: Have basic approval functionality but limited integration

### Improvements
- Implement proper approval policies for all entities
- Add approval workflow support for all entities
- Implement approval provider integration

### Implementation Steps
1. Implement approval policies for:
   - Budget approvals
   - Contract approvals
   - Fund request approvals
2. Add approval workflow support for all entities
3. Implement approval provider integration
4. Add approval tracking and audit logs

## 12. Performance Optimization

### Current State
- Basic performance characteristics
- Limited optimization

### Improvements
- Implement database query optimization
- Add database indexing for frequently queried fields
- Implement connection pooling
- Add query caching where appropriate

### Implementation Steps
1. Implement database query optimization
2. Add database indexing for frequently queried fields:
   - Budget: project_id, partner_id, status
   - Contract: project_id, partner_id, status
   - Fund request: project_id, partner_id, status
3. Implement connection pooling
4. Add query caching where appropriate

## 13. Testing and Quality Assurance

### Current State
- Limited automated testing
- Manual testing approach

### Improvements
- Implement comprehensive unit tests
- Add integration tests for all endpoints
- Implement end-to-end tests
- Add code coverage monitoring

### Implementation Steps
1. Implement comprehensive unit tests for all services and repositories
2. Add integration tests for all endpoints
3. Implement end-to-end tests for key workflows
4. Add code coverage monitoring
5. Implement CI/CD pipeline with automated testing

## 14. Documentation

### Current State
- Limited documentation
- Code comments only

### Improvements
- Create comprehensive API documentation
- Add developer documentation
- Implement inline documentation
- Add example usage documentation

### Implementation Steps
1. Create comprehensive API documentation using OpenAPI/Swagger
2. Add developer documentation for all services and repositories
3. Implement inline documentation for all functions and classes
4. Add example usage documentation for all endpoints

## Priority Implementation Order

1. **High Priority** (Implement first):
   - Validation schemas (Zod/TS)
   - Error handling
   - Security integration
   - Observability

2. **Medium Priority** (Implement second):
   - Registry integration
   - Caching
   - Feature flags
   - Hot-reload

3. **Low Priority** (Implement third):
   - Data key and action registry expansion
   - Capability catalog integration
   - Approval system integration
   - Performance optimization
   - Testing and quality assurance
   - Documentation

## Implementation Timeline

### Phase 1 (Weeks 1-2): Foundation
- Implement validation schemas
- Improve error handling
- Enhance security integration
- Add observability

### Phase 2 (Weeks 3-4): Core Features
- Implement registry integration
- Add caching
- Implement feature flags
- Add hot-reload support

### Phase 3 (Weeks 5-6): Advanced Features
- Expand data key and action registry
- Implement capability catalog integration
- Enhance approval system integration
- Optimize performance

### Phase 4 (Weeks 7-8): Quality Assurance
- Implement comprehensive testing
- Add documentation
- Finalize implementation
- Performance testing

## Conclusion

By implementing these improvements, the existing SSOT implementations (budgets, contracts, fund requests) will be brought up to the same production-level standard as the admin SSOT. This will result in a more consistent, secure, and maintainable system with better performance and observability.
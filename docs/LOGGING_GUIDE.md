# Structured Logging Guide

**Version**: 1.0  
**Last Updated**: October 4, 2025  
**Status**: Active

---

## 🎯 Purpose

This guide explains how to use the structured logging system to replace `console.log`, `console.error`, and other console methods with proper structured logging.

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Why Structured Logging?](#why-structured-logging)
3. [Logger API](#logger-api)
4. [Migration Examples](#migration-examples)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Import the Logger

```javascript
const logger = require('../utils/logger');
```

### 2. Replace Console Calls

```javascript
// Before
console.log('User logged in:', userId);
console.error('Database error:', error);

// After
logger.info('User logged in', { userId });
logger.error('Database connection failed', { 
  error: error.message,
  correlationId: req.correlationId 
});
```

### 3. That's It!

The logger automatically:
- ✅ Structures your logs as JSON
- ✅ Sanitizes sensitive data
- ✅ Adds timestamps
- ✅ Color-codes by level (dev)
- ✅ Writes to files (production)

---

## Why Structured Logging?

### Problems with console.log

❌ **Unstructured**: Hard to search and filter  
❌ **No context**: Missing request IDs, user info  
❌ **Security risks**: May log passwords/tokens  
❌ **Not searchable**: Can't query by field  
❌ **No aggregation**: Can't build dashboards  

### Benefits of Structured Logging

✅ **Searchable**: Query by any field  
✅ **Traceable**: Correlation IDs link related events  
✅ **Secure**: Automatic sanitization of sensitive data  
✅ **Analyzable**: Feed into ELK, DataDog, etc.  
✅ **Debuggable**: Context-rich error information  

---

## Logger API

### Log Levels

```javascript
logger.error()   // Errors that need immediate attention
logger.warn()    // Warnings about potential issues
logger.info()    // Important information (default)
logger.http()    // HTTP request/response logs
logger.debug()   // Detailed debugging information
```

### Special Methods

```javascript
logger.security()  // Security-related events
logger.audit()     // Audit trail events
```

### Method Signature

```javascript
logger.<level>(message, metadata)
```

- **message**: Human-readable string describing the event
- **metadata**: Object with contextual data

---

## Migration Examples

### Example 1: Simple Logging

```javascript
// ❌ Before
console.log('Server started on port 3000');

// ✅ After
logger.info('Server started', { port: 3000 });
```

### Example 2: Error Logging

```javascript
// ❌ Before
console.error('Error creating user:', error);

// ✅ After
logger.error('Failed to create user', {
  error: error.message,
  stack: error.stack,
  correlationId: req.correlationId,
  userEmail: req.body.email
});
```

### Example 3: Debug Logging

```javascript
// ❌ Before
console.log('Query params:', req.query);
console.log('User:', user);

// ✅ After
logger.debug('Processing request', {
  queryParams: req.query,
  userId: user.id,
  correlationId: req.correlationId
});
```

### Example 4: Warning Logging

```javascript
// ❌ Before
console.warn('Database pool running low');

// ✅ After
logger.warn('Database connection pool degraded', {
  available: pool.available,
  max: pool.max,
  threshold: 0.2
});
```

### Example 5: HTTP Logging

```javascript
// ❌ Before
console.log(`${req.method} ${req.url} - ${res.statusCode}`);

// ✅ After
logger.http('Request completed', {
  method: req.method,
  url: req.url,
  statusCode: res.statusCode,
  duration: `${Date.now() - startTime}ms`,
  correlationId: req.correlationId
});
```

### Example 6: Security Event

```javascript
// ❌ Before
console.log('Failed login attempt for:', email);

// ✅ After
logger.security('Failed login attempt', {
  email: email,
  ip: req.ip,
  userAgent: req.get('user-agent'),
  correlationId: req.correlationId,
  attempts: loginAttempts
});
```

### Example 7: Audit Trail

```javascript
// ❌ Before
console.log(`User ${userId} updated organization ${orgId}`);

// ✅ After
logger.audit('Organization updated', {
  action: 'update',
  resourceType: 'organization',
  resourceId: orgId,
  userId: req.user.id,
  changes: diff,
  correlationId: req.correlationId
});
```

---

## Best Practices

### 1. Always Include Context

```javascript
// ❌ Bad
logger.error('Database error', { error: err.message });

// ✅ Good
logger.error('Failed to fetch user', {
  error: err.message,
  stack: err.stack,
  userId: userId,
  operation: 'fetchUser',
  correlationId: req.correlationId
});
```

### 2. Use Descriptive Messages

```javascript
// ❌ Bad
logger.info('Done');
logger.error('Error');

// ✅ Good
logger.info('Organization onboarding completed', { orgId });
logger.error('Payment processing failed', { orderId, error });
```

### 3. Include Correlation IDs

```javascript
// Always include correlationId from request
logger.info('Processing payment', {
  orderId: order.id,
  amount: order.amount,
  correlationId: req.correlationId  // ✅ Always include
});
```

### 4. Don't Log Sensitive Data

```javascript
// ❌ Never log these
logger.info('User created', {
  email: user.email,
  password: user.password,  // ❌ NO!
  creditCard: user.creditCard  // ❌ NO!
});

// ✅ Logger auto-sanitizes, but be explicit
logger.info('User created', {
  userId: user.id,
  email: user.email
  // password is automatically redacted if accidentally included
});
```

### 5. Use Appropriate Log Levels

```javascript
// ERROR: Requires immediate action
logger.error('Database connection lost');

// WARN: Potential issue, investigate soon
logger.warn('Cache miss rate above 50%');

// INFO: Important business events
logger.info('User registration completed');

// HTTP: Request/response tracking
logger.http('API request processed');

// DEBUG: Detailed diagnostic info
logger.debug('Cache lookup', { key, hit: false });
```

---

## Common Patterns

### Pattern 1: Controller Error Handling

```javascript
async function createUser(req, res) {
  try {
    const user = await userService.create(req.body);
    
    logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
      correlationId: req.correlationId
    });
    
    res.status(201).json(user);
  } catch (error) {
    logger.error('User creation failed', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body,
      correlationId: req.correlationId
    });
    
    res.status(500).json({ 
      error: 'Failed to create user',
      correlationId: req.correlationId
    });
  }
}
```

### Pattern 2: Middleware Logging

```javascript
function authMiddleware(req, res, next) {
  const token = req.get('Authorization');
  
  if (!token) {
    logger.warn('Missing authorization header', {
      url: req.url,
      ip: req.ip,
      correlationId: req.correlationId
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    
    logger.debug('User authenticated', {
      userId: decoded.id,
      role: decoded.role,
      correlationId: req.correlationId
    });
    
    next();
  } catch (error) {
    logger.security('Invalid token attempt', {
      error: error.message,
      ip: req.ip,
      correlationId: req.correlationId
    });
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Pattern 3: Service Layer Logging

```javascript
class UserService {
  async createUser(data) {
    logger.debug('Creating user', { 
      email: data.email,
      role: data.role
    });
    
    const existing = await this.findByEmail(data.email);
    if (existing) {
      logger.warn('Duplicate user creation attempt', {
        email: data.email
      });
      throw new Error('User already exists');
    }
    
    const user = await db.users.create(data);
    
    logger.info('User created', {
      userId: user.id,
      email: user.email
    });
    
    return user;
  }
}
```

### Pattern 4: Database Operations

```javascript
async function queryDatabase(sql, params) {
  const startTime = Date.now();
  
  logger.debug('Executing query', {
    sql: sql.substring(0, 100),  // Truncate long queries
    paramCount: params.length
  });
  
  try {
    const result = await pool.query(sql, params);
    const duration = Date.now() - startTime;
    
    logger.debug('Query completed', {
      rowCount: result.rowCount,
      duration: `${duration}ms`
    });
    
    return result;
  } catch (error) {
    logger.error('Query failed', {
      error: error.message,
      sql: sql.substring(0, 100),
      duration: `${Date.now() - startTime}ms`
    });
    throw error;
  }
}
```

---

## Troubleshooting

### Logs Not Appearing

**Problem**: No logs in console or files

**Solution**:
1. Check NODE_ENV environment variable
2. Verify logger is imported correctly
3. Ensure logs directory exists (production)
4. Check log level configuration

### Sensitive Data in Logs

**Problem**: Passwords/tokens appearing in logs

**Solution**:
- Logger auto-sanitizes common fields
- Add custom fields to sanitize list in `logger.js`
- Review logs before shipping to production

### Too Much/Too Little Logging

**Problem**: Log volume issues

**Solution**:
```javascript
// Development
process.env.NODE_ENV = 'development';  // Shows debug logs

// Production
process.env.NODE_ENV = 'production';  // Info and above only
```

### Correlation IDs Missing

**Problem**: Can't trace requests

**Solution**:
1. Ensure correlationId middleware is registered in server.js
2. Always pass `req.correlationId` in metadata
3. Verify middleware is before route handlers

---

## Configuration

### Environment Variables

```bash
# .env file
NODE_ENV=development           # or production
LOG_LEVEL=debug                # error, warn, info, http, debug
```

### Log File Locations (Production)

```
logs/
├── error.log        # Error level only
└── combined.log     # All levels
```

### Log Rotation

- Max file size: 10MB
- Max files kept: 5 (error), 10 (combined)
- Automatic rotation when size exceeded

---

## Integration with Monitoring

### ELK Stack (Elasticsearch, Logstash, Kibana)

Logs are JSON-formatted and ready for ELK ingestion:

```javascript
// Automatically creates searchable fields
logger.info('Payment processed', {
  orderId: 'ORD-123',
  amount: 99.99,
  currency: 'USD'
});
```

Query in Kibana:
```
orderId: "ORD-123"
amount: >50
currency: "USD"
```

### DataDog / New Relic

Works out of the box with JSON structured logs.

### Custom Aggregation

Export to CSV/JSON for custom analysis:
```bash
cat logs/combined.log | jq '.userId' | sort | uniq -c
```

---

## Migration Checklist

When migrating a file:

- [ ] Import logger at top of file
- [ ] Replace all console.log with logger.info
- [ ] Replace all console.error with logger.error
- [ ] Replace all console.warn with logger.warn
- [ ] Add correlation IDs to all logs
- [ ] Include meaningful context in metadata
- [ ] Test the logging output
- [ ] Update file in LOGGING_MIGRATION_TRACKER.md

---

## Examples by File Type

### Controllers
```javascript
const logger = require('../utils/logger');

async function handler(req, res) {
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    correlationId: req.correlationId
  });
  // ... rest of handler
}
```

### Services
```javascript
const logger = require('../utils/logger');

class MyService {
  async performOperation(data) {
    logger.debug('Operation started', { data });
    // ... implementation
    logger.info('Operation completed successfully');
  }
}
```

### Middleware
```javascript
const logger = require('../utils/logger');

function middleware(req, res, next) {
  logger.debug('Middleware processing', {
    correlationId: req.correlationId
  });
  next();
}
```

---

## Support

**Questions?** 
- Check this guide first
- Review examples in migrated files
- Ask in #dev-logging Slack channel
- Escalate to tech lead

**Found an issue with the logger?**
- File a GitHub issue
- Tag with `logging` label
- Include example code

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-04 | Initial release |

---

**Happy Logging!** 🪵📊

# Security Policy

## 🚨 Core Security Principles

This project follows a **security-first** approach with these non-negotiable principles:

### 1. Zero Trust Inputs
**Validate, sanitize, escape, encode** - every input, every time.
- All user inputs must be validated against strict schemas
- Never trust data from any source (users, APIs, databases)
- Implement input validation at every layer

### 2. Least Privilege
Every component operates with **minimum necessary permissions**:
- API tokens scoped to specific resources
- Database users with minimal grants
- IAM roles with explicit permissions only
- Service accounts with limited scope

### 3. No Secrets in Code/Logs
- Use environment variables or secure vaults (AWS Secrets Manager, HashiCorp Vault)
- Never log sensitive data (passwords, tokens, API keys, PII)
- Rotate secrets regularly (quarterly minimum)
- Use `.env.example` for documentation, never commit `.env`

### 4. Defense in Depth
Multiple layers of security controls:
- Authentication → Authorization → Input Validation → Rate Limiting → Audit Logging
- If one layer fails, others provide protection
- Fail securely by default

## 🔐 Secure Coding Requirements

### HTTPS & Transport Security
- **TLS 1.2+ only**: Disable older protocols
- **HSTS enabled**: Force HTTPS for all connections
- **Certificate pinning**: For mobile/desktop clients
- **No mixed content**: All resources over HTTPS

```javascript
// api/server.js - HTTPS enforcement
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// HSTS header
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### Cookie Security
All cookies must be configured with maximum security:

```javascript
// Secure cookie configuration
res.cookie('sessionId', token, {
  httpOnly: true,      // Prevents XSS access
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 3600000,     // 1 hour
  signed: true         // Prevent tampering
});
```

**Requirements:**
- `HttpOnly`: Prevent JavaScript access
- `Secure`: HTTPS transmission only
- `SameSite=Strict`: Maximum CSRF protection
- Short expiration times
- Signed cookies for integrity

### CORS Configuration

**Never use wildcards (`*`) for credentialed requests.**

```javascript
// api/middleware/cors.js
const allowedOrigins = [
  'https://app.example.com',
  'https://staging.example.com',
  // Development only
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3001'] : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600 // 10 minutes
};

app.use(cors(corsOptions));
```

### Content Security Policy (CSP)

```javascript
// api/server.js
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://api.example.com'],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

### Database Security

#### Connection Security
```javascript
// api/config/database.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem').toString()
  } : false,
  // Connection limits
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Query Security
- **Always use parameterized queries** - never string concatenation
- **Validate all inputs** before queries
- **Enforce constraints** at database level
- **No unbounded queries** - always use LIMIT

```javascript
// ❌ WRONG - SQL Injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ CORRECT - Parameterized query
const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
const result = await pool.query(query, [email]);
```

#### Database User Permissions
```sql
-- Read-only user for reporting
CREATE USER reporter WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE subgrant_platform TO reporter;
GRANT USAGE ON SCHEMA public TO reporter;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporter;

-- Application user with minimal permissions
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE subgrant_platform TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON specific_tables TO app_user;
-- Do NOT grant CREATE, DROP, or TRUNCATE
```

### Authentication & Authorization

#### JWT Configuration
```javascript
// api/utils/jwt.js
const jwt = require('jsonwebtoken');

// Generate token with short expiration
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '1h',           // Short-lived tokens
      issuer: 'subgrant-platform',
      audience: 'subgrant-api'
    }
  );
}

// Verify token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'subgrant-platform',
      audience: 'subgrant-api'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

#### Password Hashing
```javascript
// api/utils/password.js
const bcrypt = require('bcryptjs');

// Hash password - NEVER store plain text
async function hashPassword(password) {
  const saltRounds = 12; // Increase for more security
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

#### Role-Based Access Control (RBAC)
```javascript
// api/middleware/rbac.js
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
app.get('/admin/users', requireRole(['admin', 'super_admin']), adminController.listUsers);
```

### Input Validation

#### Zod Schema Example
```typescript
// shared/schemas/user.schema.ts
import { z } from 'zod';

export const UserRegistrationSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  firstName: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  lastName: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  organization: z.string().min(1).max(200)
});

// Controller usage
app.post('/api/register', async (req, res) => {
  try {
    const data = UserRegistrationSchema.parse(req.body);
    // Proceed with validated data
  } catch (error) {
    return res.status(400).json({ error: 'Invalid input', details: error.errors });
  }
});
```

### XSS Prevention

```javascript
// api/utils/sanitize.js
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeHtml(dirty) {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  });
}

// Sanitize before storing or displaying
const cleanContent = sanitizeHtml(userInput);
```

### Rate Limiting

```javascript
// api/middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

### File Upload Security

```javascript
// api/middleware/upload.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Allowed file types
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
      // Random filename to prevent overwriting
      const randomName = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `${randomName}${ext}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 files per request
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.xlsx'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }
    cb(null, true);
  }
});
```

## 🚨 Reporting Vulnerabilities

### Private Reporting Only

**DO NOT** open public issues for security vulnerabilities.

#### Contact Methods

1. **Email**: security@nelium.cloud
2. **GitHub Security Advisory**: Use the Security tab in repository

#### What to Include

- Vulnerability description
- Affected component/version
- Steps to reproduce
- Proof of concept
- Suggested fix (optional)

#### Response Timeline

- 24 hours: Acknowledgment
- 72 hours: Initial assessment  
- 7 days: Patch for High/Critical
- 14 days: Coordinated disclosure

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines

---

**Remember**: Security is everyone's responsibility. When in doubt, ask before proceeding.

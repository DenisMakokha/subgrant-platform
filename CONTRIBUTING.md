# Contributing Guidelines

Welcome! This repository uses **strict working rules** for both human developers and AI coding agents. By contributing to this project, you agree to follow these guidelines.

## 🔑 Core Principles

### 1. No Shortcuts
Implement required work end-to-end (create/update/delete/fix). Half-measures are not acceptable.

### 2. Security First
Never expose vulnerabilities. Default-deny across the stack. Security is not optional.

### 3. Single Source of Truth (SSOT)
Define once, reuse everywhere:
- **Types**: Share types between frontend and backend
- **Environment Variables**: Document and validate at boot
- **Configuration**: Centralized config files
- **API Tokens**: Secure storage and rotation
- **Styles**: Consistent design system

### 4. Orderly Codebase
- Clean, modular folder structure
- Remove dead code immediately
- Follow established patterns
- Document architectural decisions

### 5. Document Without Leaking
- Excellent documentation required
- Zero secrets in code, logs, or docs
- Clear README files in each module
- API documentation up-to-date

### 6. Fail Fast, Fail Loud
- Actionable error messages
- No silent failures
- Proper error handling everywhere
- Log errors with context

## 🛠 Development Workflow

### Plan → Propose → Apply

All changes must follow this workflow:

1. **Plan**: Understand the requirement, review existing code
2. **Propose**: Create detailed plan/diff preview before changes
3. **Apply**: Implement with tests and documentation

### Pull Request Process

- All changes go through **Pull Requests** to `main`
- **No direct pushes** to protected branches
- **Conventional commits**: Use semantic commit messages
  ```
  feat: add user authentication
  fix: resolve budget calculation error
  docs: update API documentation
  chore: update dependencies
  refactor: simplify approval logic
  test: add integration tests for contracts
  ```

### PR Requirements

- **Atomic PRs**: One logical change per PR
- **Issue linking**: Every PR must link a tracked issue
- **Review buddy rule**: At least one human review required
- **Commit signing**: Sign all commits (GPG/Sigstore)
- **CI must pass**: All automated checks must pass

## 📂 Project Standards

### Code Quality

#### TypeScript/JavaScript
- **TypeScript strict mode**: Enabled in all TS projects
- **No `any` by default**: Explicitly type everything
- **ESLint compliance**: Zero warnings policy
- **Prettier formatting**: Auto-format on save

#### Folder Conventions
```
subgrant-platform/
├── api/                 # Backend API services
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── middleware/      # Custom middleware
│   ├── routes/          # API routes
│   ├── repositories/    # Data access layer
│   └── scripts/         # Utility scripts
├── web/                 # Frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API clients
│   │   ├── hooks/       # Custom hooks
│   │   ├── contexts/    # React contexts
│   │   └── utils/       # Utility functions
├── shared/              # Shared code between API and web
├── docs/                # Documentation
└── scripts/             # Project-wide scripts
```

### Configuration Management

#### Environment Variables
- **Config via env only** (12-factor app)
- **Validate at boot** against schema (Zod/Joi)
- **Never commit** `.env` files
- **Document** all variables in `.env.example`

Example validation:
```javascript
// api/config/env.js
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  PORT: Joi.number().default(3000)
}).unknown();

const { error, value: env } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}
```

#### Dependency Management
- **No `latest` tags**: Pin versions explicitly
- **Use lockfiles**: Commit `package-lock.json`
- **Regular updates**: Monthly dependency reviews
- **Security audits**: Run `npm audit` before merging

## 🔐 Security & Supply Chain

### Security Requirements

#### Authentication & Authorization
- **Least privilege** for all tokens, DB users, and IAM roles
- **Rotate secrets** regularly (quarterly minimum)
- **JWT tokens**: Short expiration times
- **RBAC**: Role-based access control enforced

#### Input Validation
- **Zero trust inputs**: Validate, sanitize, escape, encode
- **Zod/Joi schemas**: Validate all API inputs
- **SQL injection prevention**: Use parameterized queries
- **XSS prevention**: Sanitize all user inputs

#### Network Security
- **CORS**: Explicit origin lists, never `*` for credentialed requests
- **HTTPS everywhere**: TLS 1.2+ required
- **Security headers**: HSTS, CSP, X-Frame-Options
- **Cookies**: `Secure`, `HttpOnly`, `SameSite=Strict`

Example CORS configuration:
```javascript
// api/server.js
const cors = require('cors');

const allowedOrigins = [
  'https://app.yourdomain.com',
  'https://staging.yourdomain.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Secrets Scanning
- **Gitleaks**: Pre-commit hook scanning
- **GitHub secret scanning**: Must pass
- **Never commit**: API keys, passwords, tokens
- **Use**: Environment variables or secure vaults

### Dependency Security
- **Justify new libraries**: Why this lib? Alternatives?
- **License compatibility**: Check before adding
- **Typosquatting**: Verify package names
- **npm audit**: Must pass before merging
- **CodeQL scanning**: Automated vulnerability detection

### Webhook Security
- **Signature verification**: Verify all webhook signatures
- **Nonce/replay protection**: Prevent replay attacks
- **Idempotency keys**: Handle duplicate requests
- **Rate limiting**: Prevent abuse

## 🧪 Testing & Quality

### Testing Pyramid
```
        /\
       /E2E\         (Few)
      /------\
     /Integr.\      (Some)
    /----------\
   / Unit Tests \   (Many)
  /--------------\
```

### Testing Requirements

#### Unit Tests
- **Coverage threshold**: ≥80% for changed files
- **Deterministic**: No flaky tests
- **Fast**: Run in seconds
- **Isolated**: No network/DB dependencies

#### Integration Tests
- **API endpoints**: Test complete request/response
- **Database interactions**: Use test database
- **Service interactions**: Test service layer

#### End-to-End Tests
- **Critical paths**: User registration, authentication
- **Happy paths**: Complete user workflows
- **Error scenarios**: Test error handling

### Test Guidelines

```javascript
// Example unit test structure
describe('BudgetService', () => {
  describe('calculateTotalAmount', () => {
    it('should sum all budget line items', () => {
      const budget = {
        items: [
          { amount: 100 },
          { amount: 200 },
          { amount: 300 }
        ]
      };
      
      const total = BudgetService.calculateTotalAmount(budget);
      
      expect(total).toBe(600);
    });
    
    it('should handle empty budget', () => {
      const budget = { items: [] };
      
      const total = BudgetService.calculateTotalAmount(budget);
      
      expect(total).toBe(0);
    });
  });
});
```

### Regression Tests
- **Every bug fix** ships with a regression test
- **Document** the bug being fixed
- **Test edge cases** that caused the bug

### Coverage Gates
- **Changed files**: Must maintain or increase coverage
- **New files**: Minimum 80% coverage
- **Critical paths**: 100% coverage required

## 📊 Observability & Operations

### Structured Logging

#### Log Format
```javascript
// Use Winston structured logging
const logger = require('./utils/logger');

logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent']
});

logger.error('Database connection failed', {
  error: err.message,
  stack: err.stack,
  connectionString: sanitize(process.env.DATABASE_URL)
});
```

#### Logging Guidelines
- **JSON format**: Structured logs only
- **No secrets**: Never log passwords, tokens, or PII
- **Triageable levels**: DEBUG, INFO, WARN, ERROR
- **Context**: Include relevant context (user ID, request ID)
- **Correlation IDs**: Track requests across services

### Metrics & Monitoring

#### Key Metrics (SLIs)
- **Latency**: P50, P95, P99 response times
- **Error rate**: Percentage of failed requests
- **Saturation**: CPU, memory, disk usage
- **Cost**: Resource consumption tracking

#### Service Level Objectives (SLOs)
- **API availability**: 99.9% uptime
- **Response time**: P95 < 500ms
- **Error rate**: < 0.1%

### Tracing
- **Correlation IDs**: Generate and propagate across services
- **Distributed tracing**: Track requests end-to-end
- **Performance profiling**: Identify bottlenecks

### Runbooks
Every new feature requires:
- **Monitoring setup**: Alerts and dashboards
- **Troubleshooting guide**: Common issues and fixes
- **Rollback procedure**: How to revert changes
- **Incident response**: Who to contact, escalation path

### Chaos Testing
- **High-critical paths**: Test resilience
- **Graceful degradation**: Handle failures gracefully
- **Timeout handling**: Set appropriate timeouts

## 🤖 AI/Agent Guardrails

### When Using AI Code Assistants

#### Requirements
1. **Output reasoning**: Explain why and alternatives considered
2. **Dry-run mode**: Show diffs before applying
3. **Tag commits**: Use `[ai]` or bot signature
4. **No exfiltration**: Don't send code to external tools without permission
5. **Redact secrets**: Never include secrets in prompts

#### Best Practices
- **Review all AI code**: Human review required
- **Understand changes**: Don't merge code you don't understand
- **Test thoroughly**: AI-generated code needs testing
- **Refactor as needed**: Improve AI suggestions

## 🚫 Prohibited Practices

### Never Do These

- ❌ Direct pushes to `main` or protected branches
- ❌ Commit large binaries (>5MB) without Git LFS
- ❌ Untracked database migrations
- ❌ TODOs without linked tickets and due dates
- ❌ Debug flags enabled in production
- ❌ Hardcoded secrets or credentials
- ❌ `console.log` statements in production code
- ❌ Skipping tests to make CI pass
- ❌ Ignoring linting errors
- ❌ Using `any` type in TypeScript
- ❌ Disabling security features for convenience

## ✅ Pull Request Acceptance Checklist

Before requesting review, ensure:

### Design & Planning
- [ ] Design reviewed with team
- [ ] ADR filed for significant architectural changes
- [ ] Breaking changes documented and communicated

### Code Quality
- [ ] Lint/type checks pass locally
- [ ] All tests pass locally
- [ ] Code follows project conventions
- [ ] No console.log or debug statements

### Security
- [ ] Inputs validated/sanitized/escaped
- [ ] Secrets not exposed (code/logs/tests/docs)
- [ ] Authentication/Authorization verified
- [ ] Security headers configured
- [ ] Webhooks idempotent + signature verified (if applicable)

### Testing
- [ ] Tests added/updated (unit/integration/e2e)
- [ ] Coverage on changed files ≥ threshold
- [ ] Regression tests for bug fixes
- [ ] Edge cases covered

### Dependencies
- [ ] New dependencies justified
- [ ] License compatibility checked
- [ ] No `latest` tags; versions pinned
- [ ] npm audit passes

### Operations
- [ ] Logs/metrics/traces added or updated
- [ ] Runbook updated (monitoring, rollback, alerts)
- [ ] Feature flag / kill switch documented (if applicable)
- [ ] Performance impact assessed

### Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Comments added for complex logic
- [ ] Migration guide for breaking changes

### Review
- [ ] Self-review completed
- [ ] PR description clear and complete
- [ ] Issue linked
- [ ] Reviewers assigned
- [ ] CI/CD passing

## 🎓 Learning Resources

### Recommended Reading
- [The Twelve-Factor App](https://12factor.net/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React Best Practices](https://react.dev/learn)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Internal Documentation
- [System Architecture](docs/system-architecture.md)
- [Security & Compliance](docs/security-compliance.md)
- [API Documentation](docs/technical-specification.md)
- [Testing Strategy](docs/test-strategy.md)

## 📞 Getting Help

### Questions?
- Check existing documentation first
- Search closed issues/PRs
- Ask in team chat
- Tag maintainers in PR comments

### Found a Bug?
1. Check if already reported
2. Create detailed issue with reproduction steps
3. Include environment details
4. Add relevant logs/screenshots

### Security Issues?
**Do not open public issues for security vulnerabilities.**
- Email: security@yourdomain.com (replace with actual)
- Use private security advisory on GitHub

## 📝 License

This project is proprietary software. All rights reserved. By contributing, you agree that your contributions will be licensed under the same terms.

## 🙏 Thank You

Thank you for contributing to the Sub-Grant Management Platform! Your attention to quality, security, and best practices makes this project better for everyone.

---

**Remember**: Quality over speed. Security is not negotiable. Test everything. Document clearly.

# Pull Request

## 📖 Summary
<!-- Provide a clear and concise description of what this PR does -->


## 🔗 Related Issue
Closes #

## 🎯 Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 Build/CI configuration change
- [ ] 🔒 Security fix

## 🔒 Security Checklist
- [ ] Inputs validated/sanitized/escaped
- [ ] No secrets exposed (code/logs/tests/docs)
- [ ] Authentication/Authorization verified (RBAC/ABAC as applicable)
- [ ] Security headers configured properly
- [ ] Webhooks idempotent + signature verified (if applicable)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Rate limiting applied (if new endpoint)

## 📦 Dependencies
- [ ] New dependencies justified (documented why this lib? alternatives considered?)
- [ ] License compatibility checked
- [ ] No `latest` tags; all versions pinned
- [ ] `npm audit` passes with no high/critical vulnerabilities
- [ ] Dependency Review action passes (if applicable)

## 🧪 Tests & Coverage
- [ ] Tests added/updated (unit/integration/e2e)
- [ ] All tests pass locally
- [ ] Coverage on changed files meets/exceeds threshold (≥80%)
- [ ] Regression tests for bug fixes (if applicable)
- [ ] Edge cases covered

## 🧰 Operations & Observability
- [ ] Structured logs added/updated (JSON format, no secrets)
- [ ] Metrics/traces added (if applicable)
- [ ] Runbook updated (monitoring, troubleshooting, rollback)
- [ ] Feature flag / kill switch documented (if applicable)
- [ ] Performance impact assessed
- [ ] Database migrations included (if applicable)

## 📚 Documentation
- [ ] Code comments added for complex logic
- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] ADR filed for significant architectural decisions
- [ ] Migration guide for breaking changes (if applicable)

## ✅ Code Quality
- [ ] Lint checks pass (`npm run lint`)
- [ ] Type checks pass (`npm run type-check` or `tsc --noEmit`)
- [ ] Code follows project conventions
- [ ] No `console.log` or debug statements
- [ ] No `any` types in TypeScript (justified if used)
- [ ] Dead code removed

## 🖼️ Screenshots/Evidence
<!-- If applicable, add screenshots, logs, or test run outputs to help explain your changes -->


## 📝 Additional Notes
<!-- Any additional information that reviewers should know -->


## ✅ Pre-Merge Checklist
<!-- Verify before requesting review -->
- [ ] Self-review completed
- [ ] All CI checks passing
- [ ] Commit messages follow conventional commits format
- [ ] Commits signed (GPG/Sigstore)
- [ ] Branch is up-to-date with main
- [ ] Reviewers assigned
- [ ] Ready for review

---

**By submitting this PR, I confirm that:**
- I have read and followed the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
- I have followed the [SECURITY.md](../SECURITY.md) requirements
- This code is my own work or properly attributed
- I have the right to submit this code under the project's license

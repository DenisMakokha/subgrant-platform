# Phase 2: Code Quality Setup Guide

**Status**: Configuration Complete - Ready for Implementation  
**Date**: October 4, 2025  
**Project**: Sub-Grant Management Platform

---

## 🎯 Overview

Phase 2 establishes code quality standards through linting, formatting, and type checking. All configuration files are ready - this guide covers installation and activation.

## ✅ What's Already Done

### Configuration Files Created
- ✅ `api/.eslintrc.js` - API linting rules with security plugin
- ✅ `web/.eslintrc.js` - Web linting rules with TypeScript & React
- ✅ `.prettierrc` - Code formatting standards
- ✅ `.prettierignore` - Files to exclude from formatting
- ✅ `web/tsconfig.json` - TypeScript strict mode (already enabled!)

## 📦 Step 1: Install Dependencies

### API Dependencies
```bash
cd api
npm install --save-dev \
  eslint@^8.50.0 \
  eslint-plugin-security@^1.7.1 \
  eslint-config-prettier@^9.0.0 \
  eslint-plugin-prettier@^5.0.0 \
  prettier@^3.0.3 \
  husky@^8.0.3 \
  lint-staged@^15.0.0
```

### Web Dependencies
```bash
cd web
npm install --save-dev \
  @typescript-eslint/eslint-plugin@^6.7.0 \
  @typescript-eslint/parser@^6.7.0 \
  eslint-config-prettier@^9.0.0 \
  eslint-plugin-prettier@^5.0.0 \
  eslint-plugin-react@^7.33.2 \
  eslint-plugin-react-hooks@^4.6.0 \
  prettier@^3.0.3 \
  husky@^8.0.3 \
  lint-staged@^15.0.0
```

**Estimated Time**: 2-3 minutes per directory

## 📝 Step 2: Update package.json Scripts

### API - Add to `api/package.json`
```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx",
    "lint:fix": "eslint . --ext .js,.jsx --fix",
    "format": "prettier --write \"**/*.{js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,json,md}\"",
    "prepare": "cd .. && husky install"
  },
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

### Web - Add to `web/package.json`
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\"",
    "type-check": "tsc --noEmit",
    "prepare": "cd .. && husky install"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,scss,md}": [
      "prettier --write"
    ]
  }
}
```

**Time**: 5 minutes

## 🔧 Step 3: Initialize Husky Pre-commit Hooks

```bash
# From project root
npx husky install
npx husky add .husky/pre-commit "cd api && npx lint-staged"
npx husky add .husky/pre-commit "cd web && npx lint-staged"
```

This creates `.husky/pre-commit` that runs linting and formatting on staged files before each commit.

**Time**: 2 minutes

## 🧪 Step 4: Test the Setup

### Test Linting (API)
```bash
cd api
npm run lint
```

**Expected**: List of linting issues (if any). Don't worry about errors initially - we'll fix them incrementally.

### Test Linting (Web)
```bash
cd web
npm run lint
```

**Expected**: List of TypeScript/React linting issues.

### Test Formatting
```bash
# From project root
npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}"
```

**Expected**: List of files that need formatting.

### Test Type Checking (Web)
```bash
cd web
npm run type-check
```

**Expected**: TypeScript compilation check (no files generated).

**Time**: 3-5 minutes

## 🔄 Step 5: Initial Cleanup (Optional but Recommended)

### Option A: Auto-fix Everything
```bash
# API
cd api
npm run lint:fix
npm run format

# Web
cd web
npm run lint:fix
npm run format
```

**Warning**: This will modify many files. Commit the changes separately.

### Option B: Gradual Fixes
Fix files as you work on them. The pre-commit hooks will prevent new violations.

**Recommended**: Option B for large codebases to review changes carefully.

## 📊 Step 6: Verify CI Integration

The CI workflow (`.github/workflows/ci.yml`) is already configured to run:
- `npm run lint` (if the script exists)
- `npm test`
- `npm audit`

Once scripts are added, CI will automatically enforce these checks on all PRs.

## 🎯 Success Criteria

### Must Have
- [ ] All dependencies installed without errors
- [ ] `npm run lint` executes in both api and web
- [ ] `npm run format` executes successfully
- [ ] `npm run type-check` runs in web directory
- [ ] Pre-commit hooks installed and working

### Should Have
- [ ] Zero linting errors in new code
- [ ] Pre-commit hook runs on `git commit`
- [ ] CI pipeline shows lint/format checks
- [ ] Team understands how to fix common issues

## 🛠️ Common Issues & Solutions

### Issue 1: ESLint Cannot Find Plugins
```bash
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue 2: Prettier Conflicts with ESLint
- This is already handled by `eslint-config-prettier` which disables conflicting ESLint rules
- Run `npm run lint:fix` then `npm run format`

### Issue 3: Too Many Linting Errors
```bash
# Temporarily disable strict rules while fixing
# Add to .eslintrc.js:
rules: {
  '@typescript-eslint/no-explicit-any': 'warn', // Instead of 'error'
  'no-console': 'off', // During development
}
```

### Issue 4: Husky Pre-commit Hook Not Running
```bash
# Reinstall hooks
rm -rf .husky
npx husky install
npx husky add .husky/pre-commit "cd api && npx lint-staged"
npx husky add .husky/pre-commit "cd web && npx lint-staged"
```

### Issue 5: TypeScript Errors After Enabling Strict Mode
- Strict mode is already enabled in `web/tsconfig.json`
- Fix errors incrementally file-by-file
- Use `// @ts-expect-error` with explanation for known issues to fix later

## 📋 Quick Reference Commands

### Daily Development
```bash
# Before committing
npm run lint:fix    # Auto-fix linting issues
npm run format      # Format code
npm run type-check  # Check TypeScript (web only)

# Manual check without fixing
npm run lint
npm run format:check
```

### CI/CD Commands (Automated)
```bash
npm run lint        # Fails on any linting errors
npm test           # Runs test suite
npm audit          # Security vulnerabilities
```

## 🎓 Team Training Checklist

- [ ] Show team how to run lint/format commands
- [ ] Demonstrate pre-commit hooks
- [ ] Explain common ESLint errors and fixes
- [ ] Show how to disable rules temporarily (with justification)
- [ ] Practice fixing TypeScript strict mode errors

## 📈 Expected Timeline

| Task | Time | Status |
|------|------|--------|
| Install dependencies | 5 min | ⏳ Pending |
| Update package.json | 5 min | ⏳ Pending |
| Set up Husky | 5 min | ⏳ Pending |
| Test setup | 10 min | ⏳ Pending |
| Initial cleanup | 30-60 min | ⏳ Optional |
| Team training | 30 min | ⏳ Pending |
| **Total** | **55-85 min** | |

## 🎯 Next Steps After Completion

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "feat: add code quality tooling (Phase 2)"
   ```

2. **Create PR** using the template at `.github/PULL_REQUEST_TEMPLATE.md`

3. **Team announcement**: Share setup guide with all developers

4. **Grace period**: 1-2 weeks for team to adapt to new workflow

5. **Proceed to Phase 3**: Security hardening (secrets scanning, automated security tests)

## 📞 Support

### Configuration Files
- API ESLint: `api/.eslintrc.js`
- Web ESLint: `web/.eslintrc.js`
- Prettier: `.prettierrc`
- TypeScript: `web/tsconfig.json`

### Documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines
- [WORKING_RULES_INTEGRATION_PLAN.md](WORKING_RULES_INTEGRATION_PLAN.md) - Full roadmap

### External Resources
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/index.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Husky Documentation](https://typicode.github.io/husky/)

## ✅ Phase 2 Completion Checklist

When all items are complete, Phase 2 is done:

- [ ] Dependencies installed in api/
- [ ] Dependencies installed in web/
- [ ] Scripts added to both package.json files
- [ ] Husky pre-commit hooks configured
- [ ] All commands tested and working
- [ ] At least one successful commit with pre-commit hooks
- [ ] CI pipeline runs lint checks
- [ ] Team trained on new workflow
- [ ] Documentation reviewed by team
- [ ] Phase 2 completion announced

---

**Ready to proceed**: All configuration is in place. Run the installation steps and you're live! 🚀

**Questions?** Review [CONTRIBUTING.md](CONTRIBUTING.md) or consult with team leads.

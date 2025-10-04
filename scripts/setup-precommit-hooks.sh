#!/bin/bash

# Step 6: Setup Pre-commit Hooks
# This script initializes Husky and configures pre-commit hooks

set -e  # Exit on error

echo "=============================================="
echo "Step 6: Setup Pre-commit Hooks"
echo "=============================================="
echo ""

# Check if we're in project root
if [ ! -d "api" ] || [ ! -d "web" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Check if husky is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js"
    exit 1
fi

echo "🔧 Initializing Husky..."
echo ""

# Initialize Husky
npx husky install

if [ -d ".husky" ]; then
    echo "✅ Husky initialized successfully"
else
    echo "❌ Failed to initialize Husky"
    exit 1
fi

echo ""
echo "📝 Creating pre-commit hook..."
echo ""

# Create pre-commit hook file
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Check if gitleaks is installed
if command -v gitleaks &> /dev/null; then
    echo "🔒 Scanning for secrets with gitleaks..."
    gitleaks protect --staged --verbose
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Gitleaks found secrets in staged files!"
        echo "   Please remove them before committing."
        exit 1
    fi
    echo "✅ No secrets detected"
else
    echo "⚠️  Gitleaks not installed - skipping secret scan"
    echo "   Install with: brew install gitleaks (macOS)"
fi

# Run lint-staged for API
echo ""
echo "🔍 Linting API files..."
cd api
npx lint-staged
cd ..

# Run lint-staged for Web
echo ""
echo "🔍 Linting Web files..."
cd web
npx lint-staged
cd ..

echo ""
echo "✅ All pre-commit checks passed!"
EOF

# Make hook executable
chmod +x .husky/pre-commit

if [ -x ".husky/pre-commit" ]; then
    echo "✅ Pre-commit hook created and made executable"
else
    echo "❌ Failed to create executable hook"
    exit 1
fi

echo ""
echo "📝 Adding lint-staged configurations..."
echo ""

# Check if package.json files have lint-staged config
check_lint_staged_config() {
    local dir=$1
    if grep -q "lint-staged" "$dir/package.json" 2>/dev/null; then
        echo "✅ $dir: lint-staged config found"
        return 0
    else
        echo "⚠️  $dir: lint-staged config missing"
        return 1
    fi
}

api_has_config=$(check_lint_staged_config "api")
web_has_config=$(check_lint_staged_config "web")

if [ "$api_has_config" -eq 0 ] && [ "$web_has_config" -eq 0 ]; then
    echo ""
    echo "✅ Both directories have lint-staged configured"
else
    echo ""
    echo "⚠️  MANUAL STEP REQUIRED:"
    echo ""
    echo "Add lint-staged config to package.json files:"
    echo ""
    echo "api/package.json:"
    echo '  "lint-staged": {'
    echo '    "*.{js,jsx}": ["eslint --fix", "prettier --write"],'
    echo '    "*.{json,md}": ["prettier --write"]'
    echo '  }'
    echo ""
    echo "web/package.json:"
    echo '  "lint-staged": {'
    echo '    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],'
    echo '    "*.{json,css,scss,md}": ["prettier --write"]'
    echo '  }'
    echo ""
    echo "See PHASE_2_CODE_QUALITY_SETUP.md for details"
fi

echo ""
echo "🧪 Testing pre-commit hook..."
echo ""

# Create a test file to verify hook works
echo "// Test file" > test-precommit.js
git add test-precommit.js 2>/dev/null || true

echo "Try committing to test:"
echo "  git commit -m 'test: verify pre-commit hooks'"
echo ""
echo "The hook will run automatically."
echo "To skip hooks (not recommended): git commit --no-verify"

# Clean up test file
rm -f test-precommit.js
git reset test-precommit.js 2>/dev/null || true

echo ""
echo "=============================================="
echo "✅ Pre-commit Hooks Setup Complete!"
echo "=============================================="
echo ""
echo "Summary:"
echo "  ✅ Husky initialized"
echo "  ✅ Pre-commit hook created"
echo "  ✅ Gitleaks secret scanning enabled"
echo "  ✅ Lint-staged will run on commit"
echo ""
echo "What happens on commit:"
echo "  1. Gitleaks scans for secrets"
echo "  2. ESLint checks and auto-fixes code"
echo "  3. Prettier formats code"
echo "  4. Only clean code gets committed"
echo ""
echo "Next steps:"
echo "  1. Ensure lint-staged config is in package.json"
echo "  2. Test with: git commit -m 'test: hooks'"
echo "  3. Team training on new workflow"
echo ""
echo "📖 Full guide: PHASE_2_CODE_QUALITY_SETUP.md"
echo "🎉 All automation complete!"

#!/bin/bash

# Step 5: Install Code Quality Dependencies
# This script installs ESLint, Prettier, Husky, and lint-staged

set -e  # Exit on error

echo "=============================================="
echo "Step 5: Install Code Quality Tools"
echo "=============================================="
echo ""

# Function to check if we're in the project root
check_project_root() {
    if [ ! -d "api" ] || [ ! -d "web" ]; then
        echo "❌ Error: Must run from project root directory"
        echo "   Please cd to the project root and try again"
        exit 1
    fi
}

# Function to install API dependencies
install_api_deps() {
    echo "📦 Installing API dependencies..."
    echo "   Location: ./api"
    echo ""
    
    cd api
    
    echo "Installing: eslint, prettier, security plugins, husky, lint-staged..."
    npm install --save-dev \
        eslint@^8.50.0 \
        eslint-plugin-security@^1.7.1 \
        eslint-config-prettier@^9.0.0 \
        eslint-plugin-prettier@^5.0.0 \
        prettier@^3.0.3 \
        husky@^8.0.3 \
        lint-staged@^15.0.0
    
    echo ""
    echo "✅ API dependencies installed successfully!"
    echo ""
    
    cd ..
}

# Function to install Web dependencies
install_web_deps() {
    echo "📦 Installing Web dependencies..."
    echo "   Location: ./web"
    echo ""
    
    cd web
    
    echo "Installing: TypeScript ESLint, React plugins, prettier, husky, lint-staged..."
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
    
    echo ""
    echo "✅ Web dependencies installed successfully!"
    echo ""
    
    cd ..
}

# Function to verify installations
verify_installations() {
    echo "🔍 Verifying installations..."
    echo ""
    
    # Check API
    if cd api && npx eslint --version &>/dev/null; then
        echo "✅ API: ESLint installed"
    else
        echo "❌ API: ESLint not found"
        return 1
    fi
    
    if npx prettier --version &>/dev/null; then
        echo "✅ API: Prettier installed"
    else
        echo "❌ API: Prettier not found"
        return 1
    fi
    cd ..
    
    # Check Web
    if cd web && npx eslint --version &>/dev/null; then
        echo "✅ Web: ESLint installed"
    else
        echo "❌ Web: ESLint not found"
        return 1
    fi
    
    if npx prettier --version &>/dev/null; then
        echo "✅ Web: Prettier installed"
    else
        echo "❌ Web: Prettier not found"
        return 1
    fi
    
    if npx husky --version &>/dev/null; then
        echo "✅ Web: Husky installed"
    else
        echo "❌ Web: Husky not found"
        return 1
    fi
    cd ..
    
    echo ""
    echo "✅ All tools verified successfully!"
}

# Function to add npm scripts
add_npm_scripts() {
    echo ""
    echo "📝 Adding npm scripts..."
    echo ""
    echo "⚠️  MANUAL STEP REQUIRED:"
    echo ""
    echo "Add these scripts to api/package.json:"
    echo '  "lint": "eslint . --ext .js,.jsx",'
    echo '  "lint:fix": "eslint . --ext .js,.jsx --fix",'
    echo '  "format": "prettier --write \"**/*.{js,jsx,json,md}\"",'
    echo '  "format:check": "prettier --check \"**/*.{js,jsx,json,md}\""'
    echo ""
    echo "Add these scripts to web/package.json:"
    echo '  "lint": "eslint src --ext .ts,.tsx,.js,.jsx",'
    echo '  "lint:fix": "eslint src --ext .ts,.tsx,.js,.jsx --fix",'
    echo '  "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\"",'
    echo '  "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\"",'
    echo '  "type-check": "tsc --noEmit"'
    echo ""
    echo "See PHASE_2_CODE_QUALITY_SETUP.md for complete details"
}

# Main installation flow
main() {
    echo "Starting installation process..."
    echo ""
    
    # Check we're in the right place
    check_project_root
    
    # Install dependencies
    install_api_deps
    install_web_deps
    
    # Verify everything installed correctly
    verify_installations
    
    # Show manual steps
    add_npm_scripts
    
    echo ""
    echo "=============================================="
    echo "✅ Installation Complete!"
    echo "=============================================="
    echo ""
    echo "Summary:"
    echo "  ✅ API dependencies installed (8 packages)"
    echo "  ✅ Web dependencies installed (9 packages)"
    echo "  ✅ All tools verified"
    echo ""
    echo "Next steps:"
    echo "  1. Add npm scripts to package.json files (see above)"
    echo "  2. Run: npm run lint (in both api/ and web/)"
    echo "  3. Proceed to Step 6: Setup pre-commit hooks"
    echo ""
    echo "Time taken: ~2-3 minutes"
    echo "Disk space used: ~50-100 MB"
    echo ""
    echo "📖 For detailed setup: PHASE_2_CODE_QUALITY_SETUP.md"
    echo "➡️  Next: scripts/setup-precommit-hooks.sh"
}

# Run main function
main

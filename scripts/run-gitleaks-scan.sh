#!/bin/bash

# Step 2: Run Initial Gitleaks Scan
# This script installs and runs gitleaks to scan for secrets in the repository

set -e  # Exit on error

echo "=================================="
echo "Step 2: Gitleaks Secret Scanning"
echo "=================================="
echo ""

# Check if gitleaks is already installed
if command -v gitleaks &> /dev/null; then
    echo "✅ Gitleaks is already installed"
    gitleaks version
else
    echo "📦 Installing gitleaks..."
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "Installing via Homebrew..."
            brew install gitleaks
        else
            echo "❌ Homebrew not found. Please install from: https://brew.sh/"
            echo "   Then run: brew install gitleaks"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Downloading gitleaks for Linux..."
        wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz
        tar -xzf gitleaks_linux_x64.tar.gz
        sudo mv gitleaks /usr/local/bin/
        rm gitleaks_linux_x64.tar.gz
        echo "✅ Gitleaks installed to /usr/local/bin/gitleaks"
    else
        echo "❌ Unsupported OS: $OSTYPE"
        echo "Please install gitleaks manually from:"
        echo "https://github.com/gitleaks/gitleaks#installing"
        exit 1
    fi
fi

echo ""
echo "🔍 Running initial repository scan..."
echo "This may take a few minutes..."
echo ""

# Run gitleaks detect
if gitleaks detect --verbose --report-path=gitleaks-report.json; then
    echo ""
    echo "✅ SUCCESS: No secrets detected!"
    echo ""
    echo "Your repository is clean. Great job!"
    rm -f gitleaks-report.json
    exit 0
else
    echo ""
    echo "⚠️  SECRETS DETECTED!"
    echo ""
    echo "Gitleaks found potential secrets in your repository."
    echo "Report saved to: gitleaks-report.json"
    echo ""
    echo "Next steps:"
    echo "1. Review the report: cat gitleaks-report.json | jq"
    echo "2. See detailed guide: ACTIVATION_STEP_3_REVIEW_FINDINGS.md"
    echo "3. DO NOT commit the report file"
    echo ""
    echo "Adding gitleaks-report.json to .gitignore..."
    
    if ! grep -q "gitleaks-report.json" .gitignore 2>/dev/null; then
        echo "gitleaks-report.json" >> .gitignore
        echo "✅ Added to .gitignore"
    fi
    
    exit 1
fi

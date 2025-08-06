#!/bin/bash
# S-cubed Extension Installer Script
# Usage: curl -sSL https://raw.githubusercontent.com/avanishah/scubed-development-process/main/install-extension.sh | bash

set -e

REPO="scubed-sustainability/scubed-development-process"
EXTENSION_NAME="scubed-development-process"

echo "🚀 Installing S-cubed Extension..."

# Get latest release info
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest")
DOWNLOAD_URL=$(echo "$LATEST_RELEASE" | grep -o '"browser_download_url": "[^"]*\.vsix"' | cut -d'"' -f4)
VERSION=$(echo "$LATEST_RELEASE" | grep -o '"tag_name": "[^"]*' | cut -d'"' -f4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo "❌ Could not find latest release"
    exit 1
fi

echo "📦 Found version: $VERSION"
echo "⬇️  Downloading from: $DOWNLOAD_URL"

# Download extension
curl -L -o "/tmp/$EXTENSION_NAME.vsix" "$DOWNLOAD_URL"

# Check if extension is already installed and get current version
CURRENT_INSTALLED=""
if code --list-extensions | grep -q "scubed-solutions.scubed-development-process"; then
    CURRENT_INSTALLED="true"
    echo "📋 Previous S-cubed extension installation detected"
fi

# Install extension
echo "🔧 Installing extension..."
code --install-extension "/tmp/$EXTENSION_NAME.vsix" --force

# Cleanup
rm "/tmp/$EXTENSION_NAME.vsix"

echo "✅ S-cubed Extension $VERSION installed successfully!"

# Check if restart is required based on release notes or version changes
RESTART_REQUIRED="true"  # Default to requiring restart for safety

# Try to get release notes to check for restart requirements
RELEASE_BODY=$(echo "$LATEST_RELEASE" | grep -o '"body": "[^"]*' | cut -d'"' -f4 | head -1)
if echo "$RELEASE_BODY" | grep -qi "no restart required\|hot reload\|code-only update"; then
    RESTART_REQUIRED="false"
elif echo "$RELEASE_BODY" | grep -qi "restart required\|configuration changes\|activation changes"; then
    RESTART_REQUIRED="true"
fi

# Show restart information
if [ "$RESTART_REQUIRED" = "true" ]; then
    echo ""
    echo "🔄 RESTART REQUIRED: Please restart VS Code to activate the extension"
    echo "   This update includes configuration or activation changes"
    if [ "$CURRENT_INSTALLED" = "true" ]; then
        echo "   (Updating from previous version - restart needed for changes)"
    else
        echo "   (First-time installation - restart needed for activation)"
    fi
else
    echo ""
    echo "✅ NO RESTART REQUIRED: Extension will work immediately"
    echo "   This is a code-only update - changes take effect automatically"
fi

echo ""
echo "🧪 To verify installation:"
echo "   1. Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)"
echo "   2. Type 'S-cubed' to see available commands"
echo "   3. Check for 'SCubed' section in left activity bar"
echo ""
echo "💡 Pro Tip: Bookmark this command for easy updates:"
echo "   curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/install-extension.sh | bash"
echo ""
echo "📝 Or save this as 'update-scubed.sh' and run it anytime to get the latest version!"
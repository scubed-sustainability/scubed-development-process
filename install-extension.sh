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

# Install extension
echo "🔧 Installing extension..."
code --install-extension "/tmp/$EXTENSION_NAME.vsix" --force

# Cleanup
rm "/tmp/$EXTENSION_NAME.vsix"

echo "✅ S-cubed Extension $VERSION installed successfully!"
echo "🔄 Restart VS Code to activate the extension"
#!/bin/bash
# Deploy S-cubed Extension to Internal Server
# Usage: ./deploy-to-server.sh
# 
# Configuration: Set these environment variables or edit values below
# SERVER_HOST - Your internal server hostname
# SERVER_PATH - Path to extension directory on server
# 
# Example:
# SERVER_HOST="internal.company.com" SERVER_PATH="/var/www/extensions/" ./deploy-to-server.sh

# Get version from package.json
VERSION=$(grep '"version":' vscode-extension/package.json | sed 's/.*"version": "\(.*\)".*/\1/')
EXTENSION_FILE="vscode-extension/scubed-development-process-${VERSION}.vsix"
SERVER_PATH="${SERVER_PATH:-/var/www/extensions/}"  # Default path
SERVER_HOST="${SERVER_HOST:-your-internal-server.com}"  # Set via environment variable

echo "🚀 Deploying S-cubed Extension v${VERSION} to internal server..."

# Check if extension file exists
if [ ! -f "$EXTENSION_FILE" ]; then
    echo "❌ Extension file not found: $EXTENSION_FILE"
    echo "💡 Run './build-extension.sh' first to create the .vsix file"
    exit 1
fi

# Check if server host is configured
if [ "$SERVER_HOST" = "your-internal-server.com" ]; then
    echo "❌ Please configure SERVER_HOST environment variable"
    echo "💡 Example: SERVER_HOST=\"internal.company.com\" ./deploy-to-server.sh"
    exit 1
fi

# Copy to server
scp "$EXTENSION_FILE" "admin@$SERVER_HOST:$SERVER_PATH"

# Update latest symlink
ssh "admin@$SERVER_HOST" "cd $SERVER_PATH && ln -sf scubed-development-process-${VERSION}.vsix scubed-latest.vsix"

echo "✅ Extension deployed to: https://$SERVER_HOST/extensions/scubed-latest.vsix"
echo "📋 Team can install with:"
echo "curl -L https://$SERVER_HOST/extensions/scubed-latest.vsix | code --install-extension /dev/stdin"
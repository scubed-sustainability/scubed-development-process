#!/bin/bash
# Deploy S-cubed Extension to Internal Server
# Usage: ./deploy-to-server.sh

EXTENSION_FILE="vscode-extension/scubed-development-process-1.0.0.vsix"
SERVER_PATH="/var/www/extensions/"  # Adjust for your server
SERVER_HOST="your-internal-server.com"  # Adjust for your server

echo "🚀 Deploying S-cubed Extension to internal server..."

# Copy to server
scp "$EXTENSION_FILE" "admin@$SERVER_HOST:$SERVER_PATH"

# Update latest symlink
ssh "admin@$SERVER_HOST" "cd $SERVER_PATH && ln -sf scubed-development-process-1.0.0.vsix scubed-latest.vsix"

echo "✅ Extension deployed to: https://$SERVER_HOST/extensions/scubed-latest.vsix"
echo "📋 Team can install with:"
echo "curl -L https://$SERVER_HOST/extensions/scubed-latest.vsix | code --install-extension /dev/stdin"
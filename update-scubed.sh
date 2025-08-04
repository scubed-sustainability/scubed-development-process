#!/bin/bash
# S-cubed Extension Quick Update Script
# Save this file and run it anytime to update to the latest version

echo "🔄 Updating S-cubed Extension to latest version..."
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/install-extension.sh | bash

echo ""
echo "✅ Update complete! Your S-cubed extension is now up to date."
echo "🔄 Please restart VS Code to use the new version."
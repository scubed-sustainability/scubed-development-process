#!/bin/bash

# S-cubed Requirements Template - VS Code Extension Builder
# This script builds and packages the VS Code extension for distribution

set -e

echo "🚀 Building S-cubed Requirements Template Extension"
echo "=================================================="

# Check if we're in the right directory
if [ ! -d "vscode-extension" ]; then
    echo "❌ Error: vscode-extension directory not found"
    echo "Please run this script from the requirements-template root directory"
    exit 1
fi

# Navigate to extension directory
cd vscode-extension

echo "📦 Installing dependencies..."
npm install

echo "🔨 Compiling TypeScript..."
npm run compile

echo "📋 Installing VSCE (VS Code Extension manager)..."
npm install -g vsce || echo "VSCE already installed"

echo "📦 Packaging extension..."
vsce package

# Get the generated VSIX file name
VSIX_FILE=$(ls *.vsix | head -n 1)

if [ -n "$VSIX_FILE" ]; then
    echo ""
    echo "✅ Extension built successfully!"
    echo "📄 Package: $VSIX_FILE"
    echo ""
    echo "📋 Next steps:"
    echo "1. Distribute $VSIX_FILE to your team"
    echo "2. Install via VS Code: Extensions → Install from VSIX..."
    echo "3. See INSTALLATION.md for detailed deployment instructions"
    echo ""
    echo "🎉 Ready for team distribution!"
else
    echo "❌ Error: No VSIX file was generated"
    exit 1
fi
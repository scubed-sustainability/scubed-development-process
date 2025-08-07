#!/bin/bash

# 🔧 Setup Git Hooks for S-cubed Development
# Installs pre-commit hooks to prevent TypeScript errors

echo "🔧 Setting up S-cubed Git Hooks..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "vscode-extension/package.json" ]; then
    echo -e "${RED}❌ Error: Not in S-cubed repository root${NC}"
    echo "Please run from repository root directory"
    exit 1
fi

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy our pre-commit hook
if [ -f ".githooks/pre-commit" ]; then
    cp .githooks/pre-commit .git/hooks/pre-commit
    chmod +x .git/hooks/pre-commit
    echo -e "${GREEN}✅ Pre-commit hook installed${NC}"
else
    echo -e "${YELLOW}⚠️  Pre-commit hook source not found at .githooks/pre-commit${NC}"
    exit 1
fi

# Test the hook
echo -e "${BLUE}🧪 Testing pre-commit hook...${NC}"
if .git/hooks/pre-commit; then
    echo -e "${GREEN}✅ Git hooks setup complete!${NC}"
    echo ""
    echo "Now TypeScript compilation will be checked before each commit."
    echo "This will prevent issues like missing method calls from being committed."
else
    echo -e "${YELLOW}⚠️  Pre-commit hook test failed, but hook is installed${NC}"
fi
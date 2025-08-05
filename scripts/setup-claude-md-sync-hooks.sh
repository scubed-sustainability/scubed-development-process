#!/bin/bash

# CLAUDE.MD SYNCHRONIZATION HOOKS SETUP
# 
# This script sets up Git hooks to automatically check for CLAUDE.md
# synchronization issues whenever CLAUDE.md is modified.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Setting up CLAUDE.md Synchronization Hooks${NC}"
echo "=============================================="

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
echo -e "${BLUE}📝 Creating pre-commit hook...${NC}"
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Check if CLAUDE.md is being modified
if git diff --cached --name-only | grep -q "CLAUDE.md"; then
    echo "🔍 CLAUDE.md is being modified - checking synchronization..."
    
    # Run requirements tracker
    if [ -f "scripts/claude-md-requirements-tracker.js" ]; then
        echo "🔍 Running CLAUDE.md requirements analysis..."
        if ! node scripts/claude-md-requirements-tracker.js; then
            echo ""
            echo "⚠️  CLAUDE.md requirements analysis found potential issues."
            echo "Consider updating scripts/pre-release-validation.sh to match new requirements."
            echo ""
            echo "Options:"
            echo "1. Update pre-release-validation.sh now"
            echo "2. Commit anyway (add TODO to update validation script)"
            echo "3. Cancel commit"
            echo ""
            read -p "Continue with commit? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "Commit cancelled."
                exit 1
            fi
        else
            echo "✅ CLAUDE.md requirements analysis passed"
        fi
    else
        echo "⚠️  Requirements tracker not found - skipping analysis"
    fi
fi

# Continue with normal pre-commit checks
exit 0
EOF

# Make pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Create post-commit hook
echo -e "${BLUE}📝 Creating post-commit hook...${NC}"
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

# Check if CLAUDE.md was modified in the last commit
if git diff --name-only HEAD~1 HEAD | grep -q "CLAUDE.md"; then
    echo ""
    echo "🔄 CLAUDE.md was modified in this commit."
    echo "📋 Remember to review and update pre-release-validation.sh if needed."
    echo ""
    echo "Quick check commands:"
    echo "  node scripts/claude-md-requirements-tracker.js"
    echo "  ./scripts/pre-release-validation.sh"
    echo ""
fi
EOF

# Make post-commit hook executable
chmod +x .git/hooks/post-commit

# Create commit-msg hook to add reminders
echo -e "${BLUE}📝 Creating commit-msg hook...${NC}"
cat > .git/hooks/commit-msg << 'EOF'
#!/bin/bash

# Check if CLAUDE.md is being modified
if git diff --cached --name-only | grep -q "CLAUDE.md"; then
    # Add reminder to commit message if it's not already there
    if ! grep -q "validation script" "$1"; then
        echo "" >> "$1"
        echo "Note: CLAUDE.md modified - consider updating pre-release-validation.sh" >> "$1"
    fi
fi
EOF

# Make commit-msg hook executable
chmod +x .git/hooks/commit-msg

echo -e "${GREEN}✅ Git hooks created successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Hooks installed:${NC}"
echo "  • pre-commit: Runs requirements analysis when CLAUDE.md changes"
echo "  • post-commit: Reminds to update validation script after CLAUDE.md changes"  
echo "  • commit-msg: Adds reminder note to commit messages"
echo ""
echo -e "${BLUE}🔧 Test the setup:${NC}"
echo "  1. Modify CLAUDE.md"  
echo "  2. git add CLAUDE.md"
echo "  3. git commit -m 'Test message'"
echo "  4. Observe the automatic synchronization checks"
echo ""

# Test if requirements tracker works
echo -e "${BLUE}🧪 Testing requirements tracker...${NC}"
if node scripts/claude-md-requirements-tracker.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Requirements tracker working correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Requirements tracker had issues - review output manually${NC}"
fi

echo -e "${GREEN}🎉 CLAUDE.md synchronization hooks setup complete!${NC}"
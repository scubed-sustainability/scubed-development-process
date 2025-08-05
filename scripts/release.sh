#!/bin/bash
# Automated Release Script for S-cubed Extension
# Usage: ./release.sh [patch|minor|major] ["commit message"]
# Example: ./release.sh patch "Fix activity bar icon display"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RELEASE_TYPE=${1:-patch}
COMMIT_MESSAGE=${2:-""}

echo -e "${BLUE}🚀 S-cubed Automated Release System${NC}"
echo "=================================="

# Validate release type
if [[ ! "$RELEASE_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}❌ Invalid release type: $RELEASE_TYPE${NC}"
    echo "Usage: ./release.sh [patch|minor|major] [\"commit message\"]"
    echo "  patch: 1.0.6 → 1.0.7 (bug fixes)"
    echo "  minor: 1.0.6 → 1.1.0 (new features)"
    echo "  major: 1.0.6 → 2.0.0 (breaking changes)"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

# 🛡️ RUN PRE-RELEASE VALIDATION (ENFORCES ALL CLAUDE.MD REQUIREMENTS)
echo -e "${BLUE}🛡️ Running comprehensive pre-release validation...${NC}"
if ! ./scripts/pre-release-validation.sh; then
    echo -e "${RED}❌ Pre-release validation failed!${NC}"
    echo -e "${YELLOW}⚠️  Cannot proceed with release until all requirements are met.${NC}"
    echo -e "${BLUE}Please fix the issues above and try again.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Pre-release validation passed - ready for release!${NC}"
echo ""

# Check if working directory is clean (allow only staged changes)
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo -e "${YELLOW}⚠️  You have unstaged changes. Let's commit them first.${NC}"
    
    # Show status
    git status --short
    
    if [ -z "$COMMIT_MESSAGE" ]; then
        echo -e "${BLUE}Please enter a commit message for these changes:${NC}"
        read -r COMMIT_MESSAGE
        
        if [ -z "$COMMIT_MESSAGE" ]; then
            echo -e "${RED}❌ Commit message is required${NC}"
            exit 1
        fi
    fi
    
    echo -e "${BLUE}📝 Committing changes...${NC}"
    git add .
    git commit -m "$COMMIT_MESSAGE

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Get current version
cd vscode-extension
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "${BLUE}📦 Current version: ${CURRENT_VERSION}${NC}"

# Update version and sync all files (npm version hook handles sync automatically)
echo -e "${BLUE}🔄 Updating version ($RELEASE_TYPE)...${NC}"
npm version $RELEASE_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}📦 New version: ${NEW_VERSION}${NC}"

echo -e "${BLUE}✅ Version sync completed automatically by npm version hook${NC}"

# Test compilation before proceeding
echo -e "${BLUE}🔨 Testing TypeScript compilation...${NC}"
if ! npm run compile; then
    echo -e "${RED}❌ TypeScript compilation failed!${NC}"
    echo -e "${YELLOW}⚠️  Please fix the compilation errors before releasing.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript compilation successful${NC}"

# Go back to root
cd ..

# Commit version changes
echo -e "${BLUE}📝 Committing version changes...${NC}"
git add .
git commit -m "🔖 Bump version to v${NEW_VERSION}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create git tag
echo -e "${BLUE}🏷️  Creating git tag v${NEW_VERSION}...${NC}"
git tag "v${NEW_VERSION}"

# Push changes and tags
echo -e "${BLUE}⬆️  Pushing to GitHub...${NC}"
git push origin main
git push origin "v${NEW_VERSION}"

# Wait for GitHub Actions to complete
echo -e "${YELLOW}⏳ GitHub Actions is building the release...${NC}"
echo -e "${BLUE}🔗 You can monitor progress at:${NC}"
echo "   https://github.com/scubed-sustainability/scubed-development-process/actions"

# Check if release was created (with retry logic)
echo -e "${BLUE}🔍 Checking if release was created...${NC}"
for i in {1..12}; do  # Wait up to 2 minutes
    if curl -s "https://api.github.com/repos/scubed-sustainability/scubed-development-process/releases/tags/v${NEW_VERSION}" | grep -q "\"tag_name\""; then
        echo -e "${GREEN}✅ Release v${NEW_VERSION} created successfully!${NC}"
        echo -e "${BLUE}🔗 Release URL:${NC}"
        echo "   https://github.com/scubed-sustainability/scubed-development-process/releases/tag/v${NEW_VERSION}"
        echo ""
        echo -e "${GREEN}🎉 Automated release complete!${NC}"
        echo -e "${BLUE}📋 What happened:${NC}"
        echo "   1. ✅ Committed your changes"
        echo "   2. ✅ Bumped version to v${NEW_VERSION}"
        echo "   3. ✅ Synced version across all files"
        echo "   4. ✅ Created git tag"
        echo "   5. ✅ Pushed to GitHub"
        echo "   6. ✅ GitHub Actions built and published release"
        echo ""
        echo -e "${BLUE}📦 Team can now install with:${NC}"
        echo "   curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash"
        exit 0
    fi
    echo -e "${YELLOW}⏳ Waiting for release to be created... (${i}/12)${NC}"
    sleep 10
done

echo -e "${YELLOW}⚠️  Release creation is taking longer than expected.${NC}"
echo -e "${BLUE}Please check the GitHub Actions status manually:${NC}"
echo "   https://github.com/scubed-sustainability/scubed-development-process/actions"
echo ""

# Check if GitHub Actions workflow failed
echo -e "${BLUE}🔍 Checking GitHub Actions status...${NC}"
WORKFLOW_STATUS=$(curl -s "https://api.github.com/repos/scubed-sustainability/scubed-development-process/actions/runs?event=push&per_page=1" | grep -o '"conclusion":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$WORKFLOW_STATUS" = "failure" ]; then
    echo -e "${RED}❌ GitHub Actions workflow FAILED!${NC}"
    echo -e "${YELLOW}⚠️  The version was bumped and pushed, but the release build failed.${NC}"
    echo -e "${BLUE}Please check the workflow logs and fix any build errors:${NC}"
    echo "   https://github.com/scubed-sustainability/scubed-development-process/actions"
    exit 1
elif [ "$WORKFLOW_STATUS" = "success" ]; then
    echo -e "${GREEN}✅ GitHub Actions workflow completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub Actions workflow is still running or status unknown.${NC}"
fi

echo -e "${BLUE}📋 What was completed:${NC}"
echo "   1. ✅ Committed your changes"
echo "   2. ✅ Bumped version to v${NEW_VERSION}"
echo "   3. ✅ Synced version across all files"
echo "   4. ✅ Tested TypeScript compilation"
echo "   5. ✅ Created git tag"
echo "   6. ✅ Pushed to GitHub"
if [ "$WORKFLOW_STATUS" = "failure" ]; then
    echo "   7. ❌ GitHub Actions build failed"
else
    echo "   7. ⏳ GitHub Actions release build (check manually)"
fi
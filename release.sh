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

# Update version and sync all files
echo -e "${BLUE}🔄 Updating version ($RELEASE_TYPE)...${NC}"
npm version $RELEASE_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}📦 New version: ${NEW_VERSION}${NC}"

# Sync version across all files
echo -e "${BLUE}🔄 Syncing version across all files...${NC}"
npm run sync-version

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
        echo "   curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/install-extension.sh | bash"
        exit 0
    fi
    echo -e "${YELLOW}⏳ Waiting for release to be created... (${i}/12)${NC}"
    sleep 10
done

echo -e "${YELLOW}⚠️  Release creation is taking longer than expected.${NC}"
echo -e "${BLUE}Please check the GitHub Actions status manually:${NC}"
echo "   https://github.com/scubed-sustainability/scubed-development-process/actions"
echo ""
echo -e "${GREEN}✅ Version bump and push completed successfully!${NC}"
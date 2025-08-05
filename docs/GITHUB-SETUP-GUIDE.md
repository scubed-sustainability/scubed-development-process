# GitHub Requirements Automation - Setup Guide

This guide walks you through setting up and using the GitHub requirements automation feature in the S-cubed VSCode extension.

## 🚀 Quick Setup

### 1. Configure GitHub Repository

Add these settings to your VSCode workspace or user settings:

```json
{
  "scubed.github.owner": "your-github-username-or-org",
  "scubed.github.repo": "your-repository-name",
  "scubed.github.autoSync": false,
  "scubed.github.stakeholderTeam": "stakeholders"
}
```

### 2. GitHub Repository Setup

1. **Create a GitHub repository** (if you don't have one)
2. **Enable Discussions** in your repository: Settings → Features → Check "Discussions"
3. **Add stakeholders as collaborators** with appropriate permissions

## 📋 Available Commands

- **`S-cubed: Push Requirements to GitHub`** - Create GitHub issue and discussion from requirements
- **`S-cubed: Sync with GitHub`** - Check for new comments and updates
- **`S-cubed: Check GitHub Feedback`** - View stakeholder feedback and comments

## 🎯 Usage Workflow

1. **Create requirements.md** in your project
2. **Run**: `S-cubed: Push Requirements to GitHub`
3. **Stakeholders collaborate** via GitHub issues/discussions
4. **Monitor feedback** with sync commands

See the [complete workflow documentation](GITHUB-REQUIREMENTS-WORKFLOW.md) for detailed examples.

## 🔐 Authentication

Uses VSCode's built-in GitHub authentication - no manual token setup required!

---

*Ready to automate your requirements process with GitHub!* 🚀
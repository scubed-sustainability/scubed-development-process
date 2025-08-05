# S-cubed Development Process

**AI-powered development toolkit with VS Code extension, project templates, and automated workflows.**

## 🚀 Quick Start

### 1. Install Extension (One Command)
```bash
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash
```

> **Note**: If you get a 404 error, the old install URL may be cached. Use the URL above, or wait a few minutes for GitHub's cache to update.

### 2. Create Project
1. Open VS Code → `Ctrl+Shift+P` 
2. Run: **"S-cubed: Create New Project from Template"**
3. Choose template and configure
4. Start developing with AI workflows

### 3. Automated Releases
```bash
./scripts/release.sh patch "Your commit message"   # One command = commit + version + release
```

---

## 📋 Table of Contents

### 🔧 **Setup & Installation**
- [📦 Installation Methods](#-installation-methods)
- [👥 Team Distribution](#-team-distribution)
- [🔧 Building from Source](#-building-from-source)

### 💼 **Usage & Features**
- [⚡ Extension Features](#-extension-features)
- [🤖 AI Development Workflow](#-ai-development-workflow) 
- [📁 Project Structure](#-project-structure)
- [🔧 Configuration](#-configuration)

### 🛠️ **Development & Maintenance**
- [🔄 Automated Releases](#-automated-releases)
- [📊 Version Management](#-version-management)
- [🏗️ Repository Architecture](#-repository-architecture)
- [🛠️ Troubleshooting](#-troubleshooting)

### 📚 **Documentation & Community**
- [🚀 GitHub Requirements Workflow](docs/GITHUB-REQUIREMENTS-WORKFLOW.md) - Complete E2E automation guide
- [⚙️ GitHub Setup Guide](docs/GITHUB-SETUP-GUIDE.md) - Quick setup for GitHub integration
- [📊 Microsoft Loop Integration](#-microsoft-loop-integration)
- [🤝 Contributing](#-contributing)
- [🎯 Roadmap](#-roadmap)
- [📈 Changelog](#-changelog)

---

# 📦 Installation Methods

## Method 1: One-Click Install (Recommended)
**Prerequisites**: VS Code CLI must be installed first.
1. Open VS Code → Command Palette (`Cmd+Shift+P`)
2. Run: **"Shell Command: Install 'code' command in PATH"**
3. Restart terminal, then run:
```bash
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash
```

## Method 2: Manual Installation
1. Visit: https://github.com/scubed-sustainability/scubed-development-process/releases/latest
2. Download the `.vsix` file
3. VS Code → Extensions → "..." → "Install from VSIX..."
4. Select downloaded file and restart VS Code

## Method 3: Build from Source
```bash
./scripts/build-extension.sh        # Linux/Mac
.\scripts\build-extension.ps1       # Windows
```

# 👥 Team Distribution

**Share this link**: https://github.com/scubed-sustainability/scubed-development-process/releases/latest

### Team Setup Process
1. **Prerequisites**: Each member installs VS Code CLI (one-time setup)
2. **Install Extension**: Use one-click install script above
3. **Verification**: Look for "SCubed" in activity bar and available commands
4. **Updates**: Extension auto-checks for updates daily

---

# ⚡ Extension Features

### 🟧 **One-Click Project Creation**
- Create projects from curated templates
- Automatic setup and configuration
- Multiple project types (AI-enabled, minimal, enterprise)

### 🤖 **AI Integration** 
- Pre-built Claude prompt snippets
- Structured discovery workflows
- Progress tracking templates

### 🐙 **GitHub Requirements Automation** 
- Automatic GitHub issue creation from requirements
- Stakeholder collaboration via GitHub discussions
- Real-time feedback notifications in VSCode
- Complete audit trail of all requirement changes

### 📋 **Rich Snippets Library**
- `claude-discovery` - Discovery prompt template
- `user-story` - User story with acceptance criteria  
- `adr` - Architecture Decision Record template
- `requirements-doc` - Comprehensive requirements document
- `scubed-config` - Project configuration template

### ⚡ **Quick Commands**
- **S-cubed: Create New Project from Template** 
- **S-cubed: Initialize Current Project**
- **S-cubed: Generate Discovery Prompts**
- **S-cubed: Push Requirements to GitHub** - NEW! 🚀
- **S-cubed: Sync with GitHub** - NEW! 🔄
- **S-cubed: Check GitHub Feedback** - NEW! 💬
- **S-cubed: Open Template Gallery**
- **S-cubed: Check for Updates**

---

# 🔄 Automated Releases

## 🚀 One-Command Releases
**Fully automated**: commit → version bump → push → create GitHub release!

```bash
# Automated release (handles everything!)
./scripts/release.sh patch "Fix activity bar icon display"   # 1.0.31 → 1.0.32
./scripts/release.sh minor "Add new template features"       # 1.0.20 → 1.1.0  
./scripts/release.sh major "Breaking API changes"            # 1.0.20 → 2.0.0

# Or using npm scripts from vscode-extension directory
cd vscode-extension
npm run release:patch   # Quick patch release
npm run release:minor   # Quick minor release  
npm run release:major   # Quick major release
```

## What the Automated Release Does
1. ✅ **Commits your changes** with proper message format
2. ✅ **Bumps version** in package.json (patch/minor/major)
3. ✅ **Syncs version** across all files automatically
4. ✅ **Creates git tag** with new version
5. ✅ **Pushes to GitHub** (code + tags)
6. ✅ **Triggers GitHub Actions** to build and create release
7. ✅ **Waits and confirms** release was created successfully

**Result**: One command does EVERYTHING - no more repetitive manual work! 🎉

---

# 📊 Version Management

## Single Source of Truth
**package.json** is the single source of truth for all versions. No more manual updates in multiple files!

## What Gets Auto-Synced
- ✅ **template-registry.json** - Version metadata
- ✅ **extension.ts** - Runtime version reading  
- ✅ **deploy script** - Dynamic version detection
- ✅ **package-lock.json** - NPM auto-update

## Manual Operations (Rarely Needed)
```bash
# Manual version sync only
cd vscode-extension && npm run sync-version

# Build with auto-sync  
./scripts/build-extension.sh
```

---

# 🤖 AI Development Workflow

## Phase 1: Discovery & Requirements
1. **Choose Requirements Template** from S-cubed extension
2. **Generate Discovery Prompts** using built-in prompt library
3. **Collaborate with Claude** for comprehensive requirements gathering
4. **Document in Loop** for stakeholder review and approval

## Phase 2: Architecture & Planning
1. **Create Architecture Decision Records** using provided templates
2. **Design with AI Assistance** - technical architecture and patterns
3. **Plan Implementation** - break down into manageable tasks
4. **Risk Assessment** - identify and mitigate potential issues

## Phase 3: Development
1. **AI-Assisted Coding** - leverage Claude for code generation
2. **Continuous Documentation** - living docs with automated updates
3. **Code Review** - AI-powered analysis and suggestions
4. **Test Creation** - Generate comprehensive test suites

## Phase 4: Deployment & Monitoring
1. **Automated Deployment** - CI/CD with cloud integration
2. **Performance Monitoring** - automated alerts and tracking
3. **Feedback Loop** - continuous improvement with AI insights
4. **Knowledge Capture** - document lessons learned

---

# 📁 Project Structure

The extension creates projects with this standardized structure:

```
📁 Your Project/
├── 📄 CLAUDE.md                    # AI context and project notes
├── 📄 project.json                 # Project metadata and configuration
├── 📁 docs/                        # All project documentation
│   ├── 📁 discovery/               # Requirements gathering outputs
│   ├── 📁 requirements/            # Functional & non-functional requirements
│   ├── 📁 architecture/            # Technical architecture decisions
│   ├── 📁 user-stories/            # User stories and acceptance criteria
│   ├── 📁 testing/                 # Test plans and strategies
│   └── 📁 deployment/              # Deployment guides and configs
├── 📁 templates/                   # Reusable templates
├── 📁 scripts/                     # Automation scripts
├── 📁 src/                         # Source code
└── 📁 tests/                       # Test files
```

---

# 🔧 Configuration

Configure the extension in VS Code settings:

```json
{
  "scubed.templateSource": "https://github.com/scubed-sustainability/scubed-development-process/archive/refs/heads/main.zip",
  "scubed.defaultProjectPath": "/path/to/your/projects",
  "scubed.autoInitialize": true,
  "scubed.enableLoopIntegration": true,
  "scubed.autoCheckUpdates": true
}
```

**Settings:**
- **Template Source**: URL to the requirements template archive
- **Default Project Path**: Default location for new projects
- **Auto Initialize**: Automatically run setup tasks after project creation
- **Loop Integration**: Enable Microsoft Loop integration features
- **Auto Check Updates**: Check for extension updates on startup

---

# 🔧 Building from Source

```bash
# Build the extension
./scripts/build-extension.sh        # Linux/Mac
.\scripts\build-extension.ps1       # Windows

# Install in VS Code
# Extensions → Install from VSIX... → Select generated .vsix file
```

---

# 🏗️ Repository Architecture

```
scubed-development-process/
├── 📄 README.md                     # This comprehensive guide
├── 📁 scripts/                      # Build and deployment scripts
│   ├── 📄 release.sh                # Automated release script
│   ├── 📄 build-extension.sh/.ps1   # Extension build scripts
│   ├── 📄 install-extension.sh      # Installation script
│   └── 📄 deploy-to-server.sh       # Deployment script
├── 📁 templates/                    # Project templates
│   └── 📁 requirements-template/    # Requirements & discovery template
├── 📁 vscode-extension/             # VS Code Extension
│   ├── 📄 package.json              # Extension configuration
│   ├── 📁 src/extension.ts          # Main extension logic
│   ├── 📁 snippets/                 # Code snippets
│   └── 📁 scripts/sync-version.js   # Version sync automation
└── 📁 shared-resources/             # Common components
    ├── 📁 claude-prompts/           # Reusable AI prompts
    ├── 📁 loop-templates/           # Microsoft Loop components
    └── 📁 automation-scripts/       # Common automation scripts
```

---

# 📊 Microsoft Loop Integration

## Available Loop Templates
- **Requirements Loop Template** - Collaborative requirements gathering and review
- **Architecture Decision Template** - Collaborative architecture decision making  
- **Project Status Template** - Regular project status updates and stakeholder communication

## Usage Instructions
1. **Import Template into Loop**
   - Open Microsoft Loop
   - Create new workspace or open existing one
   - Import the appropriate JSON template file
   - Customize with your project details

2. **Configure for Your Project**
   - Update project name and details
   - Add team members and stakeholders
   - Customize fields and workflows
   - Set up notifications and reminders

3. **Integrate with AI Workflow**
   - Use with Claude discovery prompts
   - Connect to VS Code extension outputs
   - Sync with project documentation
   - Enable automated updates

---

# 🛠️ Troubleshooting

## Common Issues

**Extension not appearing in Command Palette:**
- Ensure the extension is installed and enabled
- Restart VS Code
- Check Extensions view for any error messages

**Template download fails:**
- Check internet connection
- Verify the `scubed.templateSource` URL in settings
- Ensure GitHub repository is accessible

**Commands not working:**
- Open a workspace folder (some commands require an active workspace)
- Check the Output panel for error messages
- Verify all dependencies are installed

**Python Scripts Not Running:**
- Ensure Python 3.7+ is installed for automation scripts
- Check `project.json` for configuration issues
- Review Power Automate flow connections for Loop integration

---

# 🤝 Contributing

We welcome contributions to the S-cubed Development Process!

## Adding New Templates
1. Create template structure in `templates/your-template-name/`
2. Update `vscode-extension/template-registry.json`
3. Add documentation and examples
4. Submit pull request

## Improving Existing Templates
1. Update template files
2. Test with extension
3. Update documentation
4. Submit pull request

## Extension Enhancements
1. Fork the repository
2. Make changes in `vscode-extension/`
3. Test thoroughly
4. Submit pull request

---

# 🎯 Roadmap

## Current Status
- ✅ Requirements Template (Complete)
- ✅ VS Code Extension (Complete - Ready for Distribution)
- ✅ **GitHub Requirements Automation (Complete - NEW!)** 🚀
- ✅ Microsoft Loop Integration (Complete)
- ✅ Claude Prompts Library (Complete)
- ✅ Automated Release System (Complete)

## Future Enhancements
- 📋 API Development Template
- 📋 Data Pipeline Template
- 📋 Mobile App Template
- 📋 Advanced AI Workflows
- 📋 Custom Template Builder
- 📋 Enterprise Features
- 📋 **VS Code Marketplace Publishing** - Make extension searchable in VS Code
  - Automatic updates via VS Code
  - Search discovery like other extensions
  - Broader community access
  - Professional marketplace presence

---

# 📈 Changelog

## 1.0.32
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.31
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.30
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.29
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.28
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.27
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.26
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.25
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.24
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.23
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.22
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.21
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements

## 1.0.20
- 🔄 Version sync update - 2025-08-05
- ✨ Latest features and improvements
- 🔧 Enhanced version management with dynamic README updates
- 📚 Comprehensive project review and documentation improvements

## 1.0.7
- 🤖 Added fully automated release system - no more manual release processes!
- 🔄 Complete automation: commit → version → push → GitHub release
- 📚 Major README reorganization with table of contents
- 🎯 Streamlined quick start process

## 1.0.6
- 🎨 Updated activity bar to show "SCubed" text instead of orange square
- 🧹 Major cleanup: Removed build artifacts, fixed version consistency
- 🔄 Automated version management across all files
- 📦 Standardized repository URLs and configuration

## 1.0.5
- 🔧 Fixed GitHub Actions Node.js compatibility
- 📚 Documentation consolidation and branding updates

## 1.0.0
- ✅ Initial release with complete functionality
- ✅ Project creation from template
- ✅ Rich snippet library for Claude prompts
- ✅ Claude integration workflows
- ✅ Template gallery with multiple options
- ✅ Automated project setup and initialization
- ✅ TypeScript compilation and packaging
- ✅ Professional extension icon
- ✅ Microsoft Loop integration templates
- ✅ Ready for team distribution

---

## 📞 Support

- **Documentation**: Check this comprehensive README
- **Issues**: Report bugs or request features on GitHub
- **Discussions**: Join the community for best practices and help
- **Enterprise Support**: Contact for custom templates and training

---

## 🟧 Ready to Transform Your Development Process!

Start with the S-cubed extension and experience AI-powered development. Build better software, faster, with structured workflows and intelligent automation.

**Next Steps:**
1. Install the VS Code extension using the one-click install
2. Create your first project using "S-cubed: Create New Project from Template"
3. Follow the AI development workflow with Claude integration
4. Set up Microsoft Loop collaboration for your team
5. Use automated releases for effortless deployment

*Built with ❤️ by the S-cubed Solutions team - Extension built and packaged successfully, ready for team deployment!*
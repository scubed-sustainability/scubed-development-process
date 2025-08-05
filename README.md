# S-cubed Development Process

A comprehensive, AI-powered development process with integrated templates, workflows, and automation tools for modern software development teams.

## 🟧 Overview

The S-cubed Development Process provides a complete toolkit for AI-enabled software development, featuring:

- **VS Code Extension** - One-click project creation and team distribution
- **AI Integration** - Structured Claude workflows and prompts
- **Microsoft Loop Integration** - Collaborative documentation and stakeholder engagement
- **Multiple Project Templates** - Ready-to-use templates for different project types
- **Automated Workflows** - Streamlined development processes

## 🎯 Quick Start

### 1. Install the S-cubed Extension

#### Method 1: One-Click Install Script (Recommended)

**Prerequisites**: VS Code CLI must be installed first.

**Install VS Code CLI:**
1. Open VS Code
2. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
3. Run: **"Shell Command: Install 'code' command in PATH"**
4. Restart your terminal

**Install S-cubed Extension:**
```bash
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/install-extension.sh | bash
```

#### Method 2: Manual Installation from GitHub Releases
1. Visit: https://github.com/scubed-sustainability/scubed-development-process/releases/latest
2. Download the `.vsix` file
3. Open VS Code → Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
4. Click "..." → "Install from VSIX..."
5. Select the downloaded file
6. Restart VS Code if prompted

#### Method 3: Build from Source (Developers)
```bash
# Build the extension
./build-extension.sh        # Linux/Mac
.\build-extension.ps1       # Windows

# Install in VS Code
# Extensions → Install from VSIX... → Select generated .vsix file
```

📋 **For Teams**: See [Team Distribution](#-team-distribution) section below for team deployment guidance.

### 2. Create Your First Project

1. **Open VS Code**
2. **Run Command**: `Ctrl+Shift+P` → "S-cubed: Create New Project from Template"
3. **Choose Template**: Select from available project templates
4. **Configure Project**: Enter name, location, and settings
5. **Start Development**: Follow the AI-powered workflow

### 3. Verification
After installation, you should see "S-cubed Development Process" in your Extensions list and have access to all S-cubed commands in the Command Palette.

## 🛠️ Extension Features

### ⚡ Quick Commands
- **S-cubed: Create New Project from Template** - Start a new project
- **S-cubed: Initialize Current Project** - Set up an existing folder
- **S-cubed: Generate Discovery Prompts** - Create tailored Claude prompts
- **S-cubed: Open Template Gallery** - Browse available templates

### 🟧 One-Click Project Creation
- **Create New Project from Template**: Instantly set up a new project with the complete S-cubed template structure
- **Smart Project Initialization**: Automatic configuration and setup based on your project details
- **Template Gallery**: Choose from multiple project templates (AI-enabled, minimal, enterprise)

### 🤖 AI Integration
- **Claude Prompt Snippets**: Pre-built, structured prompts for discovery and requirements gathering
- **AI Workflow Integration**: Seamless integration with Claude for development assistance
- **Progress Tracking**: Built-in templates for tracking AI development sessions

### 📋 Rich Snippets Library
- `claude-discovery` - Discovery prompt template
- `user-story` - User story format with acceptance criteria
- `adr` - Architecture Decision Record template
- `requirements-doc` - Comprehensive requirements document
- `scubed-config` - Project configuration template
- `claude-update` - Progress update format

### ⚙️ Configuration

Configure the extension in VS Code settings:

```json
{
  "scubed.templateSource": "https://github.com/your-org/requirements-template/archive/refs/heads/main.zip",
  "scubed.defaultProjectPath": "/path/to/your/projects",
  "scubed.autoInitialize": true,
  "scubed.enableLoopIntegration": true
}
```

**Settings:**
- **Template Source**: URL to the requirements template archive
- **Default Project Path**: Default location for new projects
- **Auto Initialize**: Automatically run setup tasks after project creation
- **Loop Integration**: Enable Microsoft Loop integration features

## 📁 Project Structure

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

## 🤖 AI-Powered Development Workflow

### Phase 1: Discovery & Requirements
1. **Choose Requirements Template** from S-cubed extension
2. **Generate Discovery Prompts** using built-in prompt library
3. **Collaborate with Claude** for comprehensive requirements gathering
4. **Document in Loop** for stakeholder review and approval

### Phase 2: Architecture & Planning
1. **Create Architecture Decision Records** using provided templates
2. **Design with AI Assistance** - technical architecture and patterns
3. **Plan Implementation** - break down into manageable tasks
4. **Risk Assessment** - identify and mitigate potential issues

### Phase 3: Development
1. **AI-Assisted Coding** - leverage Claude for code generation
2. **Continuous Documentation** - living docs with automated updates
3. **Code Review** - AI-powered analysis and suggestions
4. **Test Creation** - Generate comprehensive test suites

### Phase 4: Deployment & Monitoring
1. **Automated Deployment** - CI/CD with cloud integration
2. **Performance Monitoring** - automated alerts and tracking
3. **Feedback Loop** - continuous improvement with AI insights
4. **Knowledge Capture** - document lessons learned

## 🏗️ Repository Architecture

```
scubed-development-process/
├── 📄 README.md                     # This comprehensive guide
├── 📄 .gitignore                    # Git ignore rules
├── 📄 build-extension.sh/.ps1       # Extension build scripts
├── 📁 templates/                    # Project templates
│   └── 📁 requirements-template/    # Requirements & discovery template
│       ├── 📁 scripts/              # Template automation scripts
│       │   ├── 📄 init_project.py   # Project initialization
│       │   ├── 📄 generate_prompts.py # Claude prompt generation
│       │   └── 📄 create_loop_workspace.py # Loop integration
│       └── 📁 .vscode/              # Template VS Code settings
├── 📁 vscode-extension/             # VS Code Extension
│   ├── 📄 package.json              # Extension configuration
│   ├── 📄 tsconfig.json             # TypeScript configuration
│   ├── 📄 template-registry.json    # Available templates registry
│   ├── 📁 src/                      # Extension source code
│   │   └── 📄 extension.ts          # Main extension logic
│   ├── 📁 snippets/                 # Code snippets
│   │   ├── 📄 claude-prompts.json   # Claude prompt snippets
│   │   └── 📄 project-config.json   # Configuration snippets
│   └── 📁 images/                   # Extension assets
│       └── 📄 icon.png              # Extension icon
└── 📁 shared-resources/             # Common components
    ├── 📁 claude-prompts/           # Reusable AI prompts
    │   └── 📄 discovery-prompts.json # Structured prompt library
    ├── 📁 loop-templates/           # Microsoft Loop components
    └── 📁 automation-scripts/       # Common automation scripts
```

## 📊 Microsoft Loop Integration

### Available Loop Templates
- **Requirements Loop Template** - Collaborative requirements gathering and review
- **Architecture Decision Template** - Collaborative architecture decision making  
- **Project Status Template** - Regular project status updates and stakeholder communication

### Usage Instructions
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

## 📦 Team Distribution

### Quick Team Setup

**Share this repository link**: https://github.com/scubed-sustainability/scubed-development-process/releases/latest

### Installation Methods for Teams

#### Option 1: One-Click Install (Recommended for All Team Members)

**Prerequisites**: Each team member needs VS Code CLI installed.

**VS Code CLI Setup (One-time per team member):**
1. Open VS Code
2. Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
3. Run: **"Shell Command: Install 'code' command in PATH"**
4. Restart terminal

**Install S-cubed Extension:**
```bash
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/install-extension.sh | bash
```

#### Option 2: Manual Distribution
1. Download `.vsix` from [releases page](https://github.com/scubed-sustainability/scubed-development-process/releases/latest)
2. Share file with team members
3. Each member: VS Code → Extensions → "..." → "Install from VSIX..."

### Team Verification Steps
1. **Check Extensions**: Look for "S-cubed Development Process" in Extensions view
2. **Find Activity Bar Icon**: Look for 🟧 S-cubed icon in left sidebar
3. **Test Commands**: `Cmd+Shift+P` → type "S-cubed" to see available commands

### Keeping Team Updated

#### Automatic Updates
- Extension checks for updates daily
- Team members get notifications when new versions are available
- Run: **"S-cubed: Check for Updates"** in Command Palette

#### Update Process
1. Click **"Download Update"** when notified
2. Use installation methods above
3. Or re-run the one-click install script

### Extension Package Details

- **Package Size**: 916.62KB
- **Files Included**: 454 files (TypeScript compiled to JavaScript)
- **Version**: 1.0.0
- **Publisher**: scubed-solutions
- **Latest Release**: https://github.com/scubed-sustainability/scubed-development-process/releases/latest

## 🛠️ Troubleshooting

### Common Issues

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

## 🤝 Contributing

We welcome contributions to the S-cubed Development Process!

### Adding New Templates
1. Create template structure in `templates/your-template-name/`
2. Update `vscode-extension/template-registry.json`
3. Add documentation and examples
4. Submit pull request

### Improving Existing Templates
1. Update template files
2. Test with extension
3. Update documentation
4. Submit pull request

### Extension Enhancements
1. Fork the repository
2. Make changes in `vscode-extension/`
3. Test thoroughly
4. Submit pull request

## 📞 Support

- **Documentation**: Check this comprehensive README
- **Issues**: Report bugs or request features on GitHub
- **Discussions**: Join the community for best practices and help
- **Enterprise Support**: Contact for custom templates and training

## 🎯 Roadmap

### Current Status
- ✅ Requirements Template (Complete)
- ✅ VS Code Extension (Complete - Ready for Distribution)
- ✅ Microsoft Loop Integration (Complete)
- ✅ Claude Prompts Library (Complete)

### Future Enhancements
- 📋 API Development Template
- 📋 Data Pipeline Template
- 📋 Mobile App Template
- 📋 Advanced AI Workflows
- 📋 Custom Template Builder
- 📋 Enterprise Features
- 📋 **VS Code Marketplace Publishing** - Make extension searchable in VS Code (pending management approval)
  - Automatic updates via VS Code
  - Search discovery like other extensions
  - Broader community access
  - Professional marketplace presence

## 🔄 Version Management & Automated Releases

### 🚀 One-Command Releases
**Fully automated**: commit → version bump → push → create GitHub release!

```bash
# Automated release (handles everything!)
./release.sh patch "Fix activity bar icon display"   # 1.0.6 → 1.0.7
./release.sh minor "Add new template features"       # 1.0.6 → 1.1.0  
./release.sh major "Breaking API changes"            # 1.0.6 → 2.0.0

# Or using npm scripts from vscode-extension directory
cd vscode-extension
npm run release:patch   # Quick patch release
npm run release:minor   # Quick minor release
npm run release:major   # Quick major release
```

### What the Automated Release Does
1. ✅ **Commits your changes** with proper message format
2. ✅ **Bumps version** in package.json (patch/minor/major)
3. ✅ **Syncs version** across all files automatically
4. ✅ **Creates git tag** with new version
5. ✅ **Pushes to GitHub** (code + tags)
6. ✅ **Triggers GitHub Actions** to build and create release
7. ✅ **Waits and confirms** release was created successfully

### Single Source of Truth
**package.json** is the single source of truth for all versions. No more manual updates in multiple files!

### What Gets Auto-Synced
- ✅ **template-registry.json** - Version metadata
- ✅ **extension.ts** - Runtime version reading  
- ✅ **deploy script** - Dynamic version detection
- ✅ **package-lock.json** - NPM auto-update

### Manual Operations (Rarely Needed)
```bash
# Manual version sync only
cd vscode-extension && npm run sync-version

# Build with auto-sync  
./build-extension.sh
```

**Result**: One command does EVERYTHING - no more repetitive manual work! 🎉

## 📈 Changelog

### 1.0.6
- 🎨 Updated activity bar to show "SCubed" text instead of orange square
- 🧹 Major cleanup: Removed build artifacts, fixed version consistency
- 🔄 Automated version management across all files
- 📦 Standardized repository URLs and configuration

### 1.0.5
- 🔧 Fixed GitHub Actions Node.js compatibility
- 📚 Documentation consolidation and branding updates

### 1.0.0
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

## 🟧 Ready to Transform Your Development Process!

Start with the S-cubed extension and experience AI-powered development. Build better software, faster, with structured workflows and intelligent automation.

**Next Steps:**
1. Install the VS Code extension using the `.vsix` file
2. Create your first project using "S-cubed: Create New Project from Template"
3. Follow the AI development workflow with Claude integration
4. Set up Microsoft Loop collaboration for your team
5. Share feedback and contribute to the community

*Built with ❤️ by the S-cubed Solutions team - Extension built and packaged successfully, ready for team deployment!*
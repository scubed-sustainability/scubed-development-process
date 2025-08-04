# AI-Enabled Development Template

A comprehensive template for AI-powered software development with integrated Claude workflows, Microsoft Loop collaboration, and automated documentation.

## Quick Start

1. **Build the Extension**
   ```bash
   # Linux/Mac
   ./build-extension.sh
   
   # Windows  
   .\build-extension.ps1
   ```

2. **Install Extension**
   - Install the generated `.vsix` file in VS Code
   - Extensions → Install from VSIX...
   - See `vscode-extension/INSTALLATION.md` for team deployment

3. **Create Your First Project**
   - `Ctrl+Shift+P` → "S-cubed: Create New Project from Template"
   - Select project location and name
   - Extension handles all setup automatically

4. **Start Development**
   - Use generated Claude prompts for discovery
   - Leverage rich snippet library
   - Follow the AI-powered development workflow

## Repository Structure

```
📁 requirements-template/
├── 📄 README.md                    # Main documentation
├── 📄 .gitignore                   # Git ignore rules
├── 📄 build-extension.sh           # Linux/Mac build script
├── 📄 build-extension.ps1          # Windows build script
├── 📁 scripts/                     # Template automation scripts
│   ├── 📄 init_project.py          # Project initialization
│   ├── 📄 generate_prompts.py      # Claude prompt generation
│   └── 📄 create_loop_workspace.py # Loop integration setup
└── 📁 vscode-extension/            # VS Code Extension
    ├── 📄 README.md                # Extension documentation
    ├── 📄 INSTALLATION.md          # Team deployment guide
    ├── 📄 package.json             # Extension configuration
    ├── 📄 tsconfig.json            # TypeScript configuration
    ├── 📁 src/                     # Extension source code
    │   └── 📄 extension.ts         # Main extension logic
    └── 📁 snippets/                # Code snippets
        ├── 📄 claude-prompts.json  # Claude prompt snippets
        └── 📄 project-config.json  # Configuration snippets
```

## Generated Project Structure

When you create a project using the extension, it generates:

```
📁 Your New Project/
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
├── 📁 scripts/                     # Automation scripts (copied from template)
├── 📁 src/                         # Your source code
└── 📁 tests/                       # Your test files
```

## AI Development Workflow

### Phase 1: Discovery with Claude
1. **Preparation**: Gather business context, user research, constraints
2. **Structured Discovery**: Use generated prompts for comprehensive requirements gathering
3. **Documentation**: Auto-populate Loop workspace with Claude outputs
4. **Stakeholder Review**: Collaborate in Loop for refinement

### Phase 2: Implementation Planning  
1. **Architecture Decisions**: Use Claude for technical design assistance
2. **Development Planning**: Break down requirements into implementable tasks
3. **Technology Selection**: Get AI-powered recommendations
4. **Risk Assessment**: Identify and mitigate potential issues

### Phase 3: AI-Assisted Development
1. **Code Generation**: Use Claude for boilerplate and complex logic
2. **Test Creation**: Generate comprehensive test suites
3. **Code Review**: AI-powered code analysis and suggestions
4. **Documentation**: Auto-generate technical documentation

### Phase 4: Deployment & Monitoring
1. **Infrastructure Setup**: Azure deployment automation
2. **CI/CD Pipeline**: GitHub Actions with AI optimization
3. **Monitoring**: Automated alerts and performance tracking
4. **Iteration**: Feedback-driven improvements with AI assistance

## Building the Extension

### For Development Teams

**Quick Build (Recommended)**
```bash
# Linux/Mac
./build-extension.sh

# Windows
.\build-extension.ps1
```

**Manual Build**
```bash
cd vscode-extension
npm install
npm run compile
npx vsce package
```

This generates a `.vsix` file that you can distribute to your team.

### Extension Features

**Available Commands**
- **S-cubed: Create New Project from Template** - One-click project setup
- **S-cubed: Initialize Current Project** - Setup existing folders  
- **S-cubed: Generate Discovery Prompts** - Create Claude prompts
- **S-cubed: Open Template Gallery** - Browse project templates

**Code Snippets** (Type prefix + Tab)
- `claude-discovery` - Discovery prompt template
- `user-story` - User story format with acceptance criteria
- `adr` - Architecture Decision Record
- `requirements-doc` - Full requirements template
- `scubed-config` - Project configuration
- `claude-update` - Progress tracking format

## Microsoft Loop Integration

### Automated Workflows
- **Discovery Output Processing**: Parse Claude responses into structured Loop components
- **Stakeholder Notifications**: Automatic Teams notifications on updates
- **Requirement Tracking**: Live tables for requirements, user stories, and risks
- **Decision Documentation**: Collaborative architecture decision records

### Setup Required
1. Follow instructions in `docs/LOOP_SETUP.md`
2. Import Power Automate flow from `scripts/automation/`
3. Configure AI Builder model for text parsing
4. Test integration with sample data

## Key Features

### 🤖 AI-First Approach
- Structured prompts for consistent, high-quality Claude interactions
- Automated documentation generation from AI conversations
- AI-powered code generation and review workflows

### 📊 Living Documentation  
- Real-time collaboration in Microsoft Loop
- Automated sync between Claude outputs and project documentation
- Stakeholder engagement through collaborative tools

### 🔄 Automated Workflows
- Power Automate integration for seamless data flow
- GitHub Actions for CI/CD with AI optimization
- Azure deployment automation

### 📈 Scalable Structure
- Standardized project organization
- Reusable templates and prompts
- Extensible automation scripts

## Getting Help

### VS Code Commands
- `Ctrl+Shift+P` → Search for "Tasks: Run Task" to see all available automation
- Open Command Palette and type "Claude" to see AI-related commands

### Documentation
- `CLAUDE.md` - Your AI development context and notes
- `docs/LOOP_SETUP.md` - Microsoft Loop integration guide  
- `templates/claude-prompts/README.md` - Guide to discovery prompts

### Troubleshooting
- Ensure Python 3.7+ is installed for automation scripts
- Check `project.json` for configuration issues
- Review Power Automate flow connections for Loop integration

## Contributing

This template is designed to evolve with your development practices. Customize the prompts, automation scripts, and documentation structure to fit your team's needs.

---

🚀 **Ready to build something amazing with AI assistance!**
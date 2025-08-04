# S-cubed Requirements Template Extension

A VS Code extension for creating AI-powered project templates with integrated Claude workflows, Microsoft Loop collaboration, and automated documentation.

## Features

### 🚀 One-Click Project Creation
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

### ⚡ Quick Commands
- **S-cubed: Create New Project from Template** - Start a new project
- **S-cubed: Initialize Current Project** - Set up an existing folder
- **S-cubed: Generate Discovery Prompts** - Create tailored Claude prompts
- **S-cubed: Open Template Gallery** - Browse available templates

## Quick Start

1. **Install the Extension**
   - Search for "S-cubed Requirements Template" in VS Code Extensions
   - Click Install

2. **Create Your First Project**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "S-cubed: Create New Project from Template"
   - Follow the prompts to set up your project

3. **Start Development**
   - Use the generated prompts with Claude
   - Leverage the snippet library for quick documentation
   - Run the initialization tasks to set up automation

## Configuration

Configure the extension in VS Code settings:

```json
{
  "scubed.templateSource": "https://github.com/your-org/requirements-template/archive/refs/heads/main.zip",
  "scubed.defaultProjectPath": "/path/to/your/projects",
  "scubed.autoInitialize": true,
  "scubed.enableLoopIntegration": true
}
```

### Settings

- **Template Source**: URL to the requirements template archive
- **Default Project Path**: Default location for new projects
- **Auto Initialize**: Automatically run setup tasks after project creation
- **Loop Integration**: Enable Microsoft Loop integration features

## Project Structure

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

## Usage Examples

### Creating a New Project
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "S-cubed: Create New Project from Template"
3. Enter project name and select location
4. Wait for template download and extraction
5. Project opens automatically with full structure

### Using Snippets
1. Create a new Markdown file
2. Type `claude-discovery` and press Tab
3. Fill in the template fields
4. Use with Claude for structured requirements gathering

### Initializing an Existing Project
1. Open your project folder in VS Code
2. Run "S-cubed: Initialize Current Project"
3. Follow the terminal output for setup completion

## Development Workflow

### Phase 1: Discovery with Claude
1. Use `claude-discovery` snippets for structured prompts
2. Run "Generate Discovery Prompts" command
3. Collaborate with Claude for requirements gathering
4. Document findings using provided templates

### Phase 2: Requirements & Planning
1. Use `user-story` and `requirements-doc` snippets
2. Create Architecture Decision Records with `adr`
3. Plan implementation with AI assistance
4. Set up Microsoft Loop integration

### Phase 3: Development
1. Use `claude-update` to track development sessions
2. Leverage AI for code generation and review
3. Maintain living documentation
4. Continuous stakeholder collaboration

## Contributing

This extension is part of the S-cubed Requirements Template project. Contributions are welcome!

## Support

- **Documentation**: Check the generated `README.md` in your project
- **Issues**: Report bugs or request features on GitHub
- **Discussions**: Join the community for best practices

## Changelog

### 1.0.0
- Initial release
- Project creation from template
- Rich snippet library
- Claude integration prompts
- Template gallery
- Automated project setup

---

🚀 **Ready to build something amazing with AI assistance!**
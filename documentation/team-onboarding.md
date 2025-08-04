# S-cubed Development Process - Team Onboarding

Welcome to the S-cubed Development Process! This guide will get your team up and running with AI-powered development workflows.

## 🎯 Overview

The S-cubed Development Process is a comprehensive toolkit that combines:
- **Multiple Project Templates** for different development scenarios
- **VS Code Extension** for one-click project creation
- **AI Integration** with structured Claude workflows
- **Collaborative Tools** including Microsoft Loop integration
- **Automated Workflows** for streamlined development

## 📋 Prerequisites

### Required Software
- **VS Code** 1.74.0 or later
- **Node.js** 16+ and npm (for extension building)
- **Python** 3.7+ (for automation scripts)
- **Git** for version control

### Optional but Recommended
- **Microsoft Loop** access (for collaborative features)
- **Claude** access (for AI-powered development)
- **Docker** (for containerized templates)
- **Cloud account** (Azure/AWS for deployment templates)

## 🚀 Quick Setup (5 minutes)

### 1. Get the Extension
```bash
# Clone or download the S-cubed Development Process
git clone [repository-url]
cd scubed-development-process

# Build the VS Code extension
./build-extension.sh        # Linux/Mac
# OR
.\build-extension.ps1       # Windows
```

### 2. Install in VS Code
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "Extensions: Install from VSIX..."
4. Select the generated `.vsix` file
5. Restart VS Code

### 3. Create Your First Project
1. Press `Ctrl+Shift+P`
2. Type "S-cubed: Create New Project from Template"
3. Choose a template (start with Requirements Template)
4. Enter project details
5. Let the extension set everything up!

## 📚 Understanding Templates

### 🔧 Requirements Template
**Best for**: Project discovery, requirements gathering, stakeholder collaboration

**What you get**:
- Structured Claude discovery prompts
- Microsoft Loop integration setup
- Documentation templates
- Stakeholder workflow tools

**When to use**: Starting new projects, requirements analysis, business discovery

### 🚀 API Development Template *(Coming Soon)*
**Best for**: Building REST APIs and microservices

**What you'll get**:
- OpenAPI/Swagger setup
- Testing frameworks
- Docker configurations
- Database schema tools

### 📊 Data Pipeline Template *(Coming Soon)*
**Best for**: Data processing and analytics projects

**What you'll get**:
- Apache Airflow workflows
- Data validation tools
- Cloud deployment configs
- Monitoring setup

## 🤖 AI-Powered Workflow

### Phase 1: Discovery with Claude
1. **Use the Requirements Template** to set up your project
2. **Generate Discovery Prompts** using the extension command
3. **Work with Claude** using the structured prompts:
   - Business requirements discovery
   - Technical architecture planning
   - User experience design
   - Data requirements analysis

### Phase 2: Collaborative Planning
1. **Create Loop Workspace** (if using Loop integration)
2. **Document findings** in structured templates
3. **Share with stakeholders** for review and approval
4. **Iterate based on feedback**

### Phase 3: Development
1. **Choose appropriate template** for your technology stack
2. **Use AI assistance** for code generation and review
3. **Maintain living documentation** with automated updates
4. **Track progress** using built-in tracking tools

## 👥 Team Roles and Permissions

### Project Lead
- **Responsibilities**: Project setup, stakeholder coordination, final decisions
- **Access needed**: Full VS Code extension, Loop admin, Claude access
- **Key tasks**: Create projects, run discovery sessions, approve requirements

### Developers
- **Responsibilities**: Implementation, code review, technical documentation
- **Access needed**: VS Code extension, development templates, Claude access
- **Key tasks**: Use development templates, AI-assisted coding, maintain docs

### Business Analysts
- **Responsibilities**: Requirements gathering, stakeholder communication
- **Access needed**: Requirements template, Loop access, Claude for discovery
- **Key tasks**: Run discovery sessions, document requirements, facilitate reviews

### Stakeholders
- **Responsibilities**: Provide input, review requirements, approve decisions
- **Access needed**: Loop read/comment access, review documentation
- **Key tasks**: Participate in reviews, provide feedback, approve deliverables

## 🛠️ Extension Features

### Core Commands
- **S-cubed: Create New Project from Template** - Start new projects
- **S-cubed: Initialize Current Project** - Set up existing folders
- **S-cubed: Generate Discovery Prompts** - Create AI prompts
- **S-cubed: Open Template Gallery** - Browse available templates

### Snippet Library
Type these prefixes and press Tab in Markdown files:
- `claude-discovery` - Discovery prompt template
- `user-story` - User story with acceptance criteria
- `adr` - Architecture Decision Record
- `requirements-doc` - Full requirements document
- `scubed-config` - Project configuration template

### Configuration Options
Access via VS Code Settings → Extensions → S-cubed:
- **Default Project Path** - Where new projects are created
- **Template Source** - Custom template repository
- **Auto Initialize** - Automatically run setup tasks
- **Loop Integration** - Enable/disable Loop features

## 📖 Best Practices

### Project Organization
- Use consistent naming conventions
- Maintain clear folder structures
- Keep documentation up to date
- Use version control effectively

### AI Collaboration
- Start with structured prompts from the library
- Maintain context across AI sessions
- Document AI-generated insights
- Review and validate AI outputs

### Team Collaboration
- Set up Loop workspaces early
- Define clear approval processes
- Use commenting for discussions
- Maintain stakeholder visibility

### Documentation
- Use living documentation that updates automatically
- Link related documents and decisions
- Include rationale for major decisions
- Keep technical and business docs separate but linked

## 🔧 Troubleshooting

### Common Issues

**Extension not showing in VS Code**
- Restart VS Code after installation
- Check Extensions panel for "S-cubed Development Process"
- Verify VS Code version (1.74.0+ required)

**Template download fails**
- Check internet connection
- Verify template source URL in settings
- Try manual template installation

**Python scripts not running**
- Verify Python 3.7+ is installed
- Add Python to system PATH
- Install required dependencies: `pip install -r requirements.txt`

**Loop integration not working**
- Verify Loop access and permissions
- Check Microsoft 365 tenant settings
- Contact IT for Loop workspace creation rights

### Getting Help
1. **Check documentation** in the `/documentation` folder
2. **Review template README** files for specific guidance
3. **Search GitHub issues** for known problems
4. **Contact team leads** for process questions
5. **Submit new issues** for bugs or feature requests

## 🎓 Training Resources

### Self-Paced Learning
1. **Try the Requirements Template** - Start with a simple discovery project
2. **Practice AI Prompts** - Use the prompt library with Claude
3. **Explore Loop Integration** - Set up a collaborative workspace
4. **Review Example Projects** - Study completed project structures

### Team Workshops
1. **Extension Overview** (30 mins) - Basic features and commands
2. **AI Workflow Workshop** (1 hour) - Hands-on Claude discovery session
3. **Loop Collaboration** (45 mins) - Setting up stakeholder workflows
4. **Advanced Features** (1 hour) - Custom templates and automation

### Ongoing Support
- **Weekly office hours** - Regular Q&A sessions
- **Template updates** - Stay current with new features
- **Best practice sharing** - Learn from team experiences
- **Process improvements** - Contribute to process evolution

## 📈 Success Metrics

Track your team's progress with these metrics:

### Efficiency Gains
- Time from project start to requirements completion
- Reduction in requirements gathering iterations
- Faster stakeholder alignment and approval

### Quality Improvements
- More comprehensive requirements documentation
- Better stakeholder engagement and feedback
- Improved architecture decision tracking

### Team Adoption
- Number of projects using S-cubed templates
- Team members actively using AI workflows
- Stakeholder participation in collaborative tools

## 🚀 Next Steps

1. **Complete setup** following the Quick Setup guide
2. **Choose your first template** based on current project needs
3. **Schedule training sessions** for your team
4. **Start your first AI-powered project**
5. **Share feedback** to improve the process

Welcome to more efficient, AI-powered development! 🎉

---

*For additional support, contact the S-cubed Development Process team or submit issues to the GitHub repository.*
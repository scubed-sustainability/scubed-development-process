# 🤝 Contributing to S-cubed

Welcome to the S-cubed development process! This guide will help you contribute effectively to the project.

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js 16+** and npm
- **VS Code** for extension development
- **Git** for version control
- **GitHub CLI** (optional but recommended)

### **Setup Development Environment**
```bash
# Clone the repository
git clone https://github.com/scubed-sustainability/scubed-development-process.git
cd scubed-development-process

# Install all dependencies
npm run install:all

# Build the extension
npm run build:extension

# Run tests
npm run test:all
```

## 📋 **Development Workflow**

### **1. Choose Your Contribution Area**
- 🎨 **VS Code Extension** - UI, commands, validation logic
- 🔄 **GitHub Workflows** - CI/CD, automation, approval processes
- 📚 **Documentation** - Guides, README updates, API docs
- 🧪 **Testing** - Unit tests, integration tests, test automation
- 📁 **Templates** - Project templates, scaffolding

### **2. Create a Branch**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b bugfix/issue-description
```

### **3. Development Guidelines**

#### **Code Style**
- **TypeScript** for all new code
- **ESLint** configuration (run `npm run lint`)
- **Consistent naming** - camelCase for variables, PascalCase for classes
- **Documentation** - JSDoc comments for public functions

#### **Testing Requirements**
- **Unit tests** for all new functions
- **Integration tests** for workflows
- **90%+ coverage** for critical components
- **Test before commit** - always run `npm run test:all`

#### **Commit Convention**
```bash
# Feature commits
git commit -m "✨ Add requirements validation to extension"

# Bug fixes
git commit -m "🐛 Fix stakeholder parsing for empty sections"

# Documentation
git commit -m "📚 Update installation guide with troubleshooting"

# Tests
git commit -m "🧪 Add unit tests for GitHub service integration"

# Refactoring
git commit -m "♻️ Refactor validation service for better performance"
```

## 🎯 **Contribution Areas**

### **VS Code Extension Development**

#### **File Structure**
```
vscode-extension/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── validation-service.ts # Requirements validation
│   ├── github-service.ts     # GitHub API integration
│   └── commands/             # Extension commands
├── tests/
│   └── suite/               # Integration tests
└── package.json             # Extension manifest
```

#### **Adding New Commands**
1. Define command in `package.json` contributions
2. Implement handler in `src/commands/`
3. Register in `extension.ts`
4. Add tests in `tests/suite/`

#### **Adding New Validation Rules**
1. Extend `ValidationService.validateRequirements()`
2. Add test cases in `tests/validation/`
3. Update documentation

### **GitHub Workflows Development**

#### **Workflow Structure**
```
.github/workflows/
├── requirements-approval.yml  # Stakeholder approval automation
├── test.yml                  # CI/CD testing pipeline
├── release.yml               # Automated releases
└── project-board-automation.yml
```

#### **Adding New Workflows**
1. Create YAML file in `.github/workflows/`
2. Test with workflow dispatch
3. Add comprehensive error handling
4. Document in workflow README

### **Testing Contributions**

#### **Test Categories**
- **Unit Tests** - `tests/validation/`, `vscode-extension/tests/`
- **Integration Tests** - `tests/workflow/`
- **End-to-End Tests** - Full workflow validation

#### **Adding Tests**
1. Create test files following naming convention
2. Include both positive and negative test cases
3. Mock external dependencies
4. Ensure cleanup after tests

## 🔧 **Common Development Tasks**

### **Running Tests Locally**
```bash
# All tests
npm run test:all

# Specific test suites
npm run test:workflows      # GitHub workflow tests
npm run test:validation     # Requirements validation tests
npm run test:extension      # VS Code extension tests

# Extension development
cd vscode-extension
npm run watch              # Auto-compile on changes
npm test                   # Run extension tests
```

### **Building and Packaging**
```bash
# Build extension
npm run build:extension

# Create .vsix package
cd vscode-extension
npx vsce package

# Test installation
code --install-extension *.vsix
```

### **Release Process**
```bash
# Automated release (maintainers only)
./scripts/release.sh patch "Your changes description"

# Manual testing before release
npm run test:all
cd vscode-extension && npm run compile
```

## 🐛 **Bug Reports**

### **Before Submitting**
1. **Search existing issues** for duplicates
2. **Test with latest version**
3. **Gather reproduction steps**
4. **Check logs** for error messages

### **Bug Report Template**
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Expected vs actual result

## Environment
- OS: Windows/Mac/Linux
- VS Code version: 
- Extension version:
- Node.js version:

## Additional Context
Logs, screenshots, or other relevant information
```

## ✨ **Feature Requests**

### **Feature Request Template**
```markdown
## Feature Description
What would you like to see added?

## Use Case
Why is this feature needed?

## Proposed Solution
How might this work?

## Alternatives Considered
Other approaches you've thought about
```

## 📋 **Pull Request Process**

### **Before Submitting PR**
1. ✅ **Tests pass** - `npm run test:all`
2. ✅ **Code compiles** - `npm run build:extension`
3. ✅ **Linting passes** - `npm run lint`
4. ✅ **Documentation updated** if needed
5. ✅ **CHANGELOG updated** for user-facing changes

### **PR Template**
```markdown
## Changes Made
- Brief description of changes
- Link to related issues

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] CHANGELOG updated
```

### **Review Process**
1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** and merge

## 🎖️ **Recognition**

Contributors are recognized in:
- **Commit co-authorship** - Automatic for merged PRs
- **Release notes** - Major contributions highlighted
- **Contributors file** - All contributors listed
- **GitHub contributors graph** - Automatic recognition

## 💬 **Getting Help**

### **Resources**
- **Documentation** - Start with README and docs/
- **Issues** - Check existing issues and discussions
- **Code Examples** - Look at existing implementations
- **VS Code Extension API** - [Official documentation](https://code.visualstudio.com/api)

### **Contact**
- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and ideas
- **Code Review** - For architectural decisions

---

**Thank you for contributing to S-cubed! Your contributions help make AI-powered development accessible to everyone.** 🚀
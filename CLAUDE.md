# 🤖 Claude Context File - S-cubed Development Process

**Version**: 1.0.47 (Latest Release)  
**Last Updated**: 2025-08-06 (Extension Working - Ready for Development)  
**Repository**: [scubed-development-process](https://github.com/scubed-sustainability/scubed-development-process)

---

## 📋 **Project Overview**

S-cubed is an **AI-powered development toolkit** featuring a VS Code extension, project templates, and automated GitHub workflows for requirements management and stakeholder approval processes.

### **Core Components**
1. **VS Code Extension** (`/vscode-extension/`) - Main development interface
2. **Shared Utilities** (`/shared/`) - Validation utilities and resources
3. **Project Templates** (`/templates/`) - Requirements templates
4. **GitHub Workflows** (`/.github/workflows/`) - Automated CI/CD processes
5. **Scripts & Automation** (`/scripts/`) - Release and build scripts

---

## 🏗️ **Repository Structure**

```
scubed-development-process/
├── vscode-extension/              # VS Code extension (main component)
│   ├── src/                       # TypeScript source code
│   ├── tests/                     # Extension test suite
│   └── package.json               # Extension manifest
├── shared/                        # Shared utilities
│   ├── utils/                     # Validation utilities
│   ├── scripts/                   # Automation scripts
│   └── prompts/                   # Discovery prompts
├── tests/                         # Root-level testing
│   ├── validation/                # Requirements validation tests
│   └── workflow/                  # GitHub workflow tests
├── scripts/                       # Automation scripts
├── templates/                     # Project templates
└── docs/                          # Documentation
```

---

## 🔧 **Development Environment**

- **Languages**: TypeScript, Node.js
- **Extension**: VS Code Extension API
- **Testing**: Mocha, @vscode/test-electron
- **Build**: Webpack bundling, npm scripts
- **Entry Point**: `vscode-extension/src/extension.ts`

---

## 🚀 **Common Commands**

### **Development**
```bash
# Install all dependencies
npm run install:all

# Build extension
npm run build:extension

# Run all tests
npm run test:all

# Individual test suites
npm run test:workflows    # Root workflow tests
npm run test:validation   # Validation tests
npm run test:extension    # Extension tests
```

### **Extension Development**
```bash
cd vscode-extension

# Webpack bundling (RECOMMENDED - resolves all dependencies automatically)
npm run webpack

# Development mode with watch
npm run webpack:dev

# Compile TypeScript only (for development)
npm run compile

# Run tests
npm test

# Watch mode
npm run watch
```

### **Release Process**
```bash
# Automated release (patch/minor/major)
./scripts/release.sh patch "Your commit message"
```

---

## 🧪 **Testing Infrastructure**

- **Root Tests** (`/tests/`) - Workflow and validation tests
- **Extension Tests** (`/vscode-extension/tests/`) - Extension functionality tests
- **Coverage Target**: >95% code coverage

---

## 🧪 **UX Testing**

**Essential UX validation for VS Code extension changes:**
- Run `npm run validate-ux` before making extension changes
- Verify commands appear in Command Palette (`Cmd+Shift+P`)
- Check activity bar sections populate with data
- Test user experience, not just implementation

---



### **🎯 Testing Requirements**
- **Coverage Target**: >95% across all components
- **Test Types**: Unit, integration, end-to-end, security, and runtime tests
- **User Experience**: Test what users see and can do, not just implementation
- **Extension Tests**: Must verify actual VS Code functionality, not just configuration

---

## 📚 **Key Features**

- **VS Code Extension**: Project templates, requirements validation, activity bar integration
- **GitHub Workflows**: Automated stakeholder approval processes
- **Validation System**: GitHub username validation, file format validation
- **Build Automation**: Webpack bundling, automated releases, CI/CD pipeline

---

## 🎯 **Current Status**

### **✅ Production Ready (v1.0.47)**
- **Extension Working**: VS Code extension fully functional with webpack bundling
- **Repository Optimized**: Clean structure, no redundancy, 32% size reduction
- **Testing Complete**: >95% coverage with comprehensive test suite
- **CI/CD Active**: Automated testing and release pipeline
- **Documentation Updated**: Streamlined and current

---

## ⚠️ **Important Notes**

### **Development Conventions**
- **Always use TodoWrite tool** for task tracking and planning
- **Commit frequently**: Save work every 15-30 minutes to prevent loss
- **Test before committing**: Run `npm run test:all` and ensure >95% coverage
- **Code review frequently**: Identify redundancies and unused code regularly
- **Follow existing patterns**: Check neighboring files for conventions
- **Version sync**: Use `scripts/release.sh` for version management

### **File Path Conventions**
- **Absolute paths required** for most tools
- **Extension source**: `vscode-extension/src/`
- **Extension tests**: `vscode-extension/tests/suite/`
- **Root tests**: `tests/validation/` and `tests/workflow/`

### **🚨 CRITICAL: Git Safety Rules (NEVER VIOLATE)**
**THESE RULES ARE ABSOLUTELY NON-NEGOTIABLE**

#### **❌ FORBIDDEN COMMANDS - NEVER USE:**
- `git reset --hard` - **DESTROYS WORK PERMANENTLY**
- `git reset HEAD~` - **ERASES COMMITS FOREVER**  
- `git reset --mixed` - **LOSES STAGED CHANGES**
- `git checkout --` - **DISCARDS FILE CHANGES**
- `git clean -fd` - **DELETES UNTRACKED FILES**
- `git push --force` - **OVERWRITES REMOTE HISTORY**
- `git rebase -i` - **CAN LOSE COMMITS**
- `rm -rf` - **DELETES FILES PERMANENTLY**

#### **✅ SAFE OPERATIONS ONLY:**
- `git status` - Check repository state
- `git add` - Stage changes
- `git commit` - Save changes
- `git push` - Upload to remote (non-force)
- `git log` - View history
- `git diff` - Compare changes
- `git stash` - Temporarily save work

#### **🛡️ SAFETY PROTOCOL:**
1. **ASK PERMISSION** before ANY git command that could affect history
2. **ASSUME DESTRUCTIVE** unless explicitly confirmed safe
3. **PRESERVE WORK** - User time is invaluable and irreplaceable
4. **NO EXCEPTIONS** - These rules apply 100% of the time

### **📋 Code Quality & Review Guidelines**

#### **Frequent Commits Protocol**
- **Commit every 15-30 minutes** during active development
- **Use descriptive commit messages** following conventional commits format
- **Include test results** in commit descriptions when relevant
- **Create work-in-progress commits** to prevent data loss
- **Example**: `feat: add GitHub username validation with 95% test coverage`

#### **Code Review Checklist**
**Before Each Commit:**
- ✅ **Run all tests**: `npm run test:all` must pass
- ✅ **Check coverage**: Ensure >95% code coverage maintained
- ✅ **Identify redundancies**: Look for duplicate code or logic
- ✅ **Remove unused code**: Delete commented code, unused imports, dead functions
- ✅ **Verify imports**: Ensure all imports are necessary and properly organized
- ✅ **Check performance**: No obvious performance bottlenecks introduced

**Weekly Deep Review:**
- 🔍 **Cross-file analysis**: Look for code duplication across files
- 🔍 **Architecture review**: Ensure consistent patterns and structure
- 🔍 **Dependency audit**: Remove unused packages, update outdated ones
- 🔍 **Documentation sync**: Ensure docs match current code state
- 🔍 **Test quality**: Review test effectiveness and coverage gaps

### **Common Issues & Solutions**
- **TypeScript compilation**: Check `tsconfig.json` includes paths
- **Import paths**: Use relative paths like `../../src/` for tests
- **VS Code tests**: Require extension host (use CI for full testing)
- **Version sync**: Handled automatically by npm version hooks
- **Large files**: Add to .gitignore, never use destructive git operations

---


---

## 💡 **Context Usage Tips**

When starting a new conversation:
1. **Reference this file** for current project state
2. **Check recent changes** section for latest updates
3. **🛡️ MANDATORY: Follow UX Testing Framework** - for ANY VS Code extension changes
4. **Use common commands** for typical development tasks
5. **Follow conventions** outlined in important notes
6. **Leverage TodoWrite** for task planning and tracking
7. **Commit frequently** - every 15-30 minutes to prevent work loss
8. **Maintain >95% test coverage** for all new code
9. **🚨 CRITICAL: Run UX validation** - `npm run validate-ux` before any extension changes
10. **Review for redundancies** before each commit
11. **NEVER use destructive git commands** - always ask first

### **🎯 BEFORE Any VS Code Extension Work:**
- [ ] Read the **MANDATORY UX TESTING FRAMEWORK** section above
- [ ] Run `npm run validate-ux` to verify current state
- [ ] Understand that tests must verify **user experience**, not just implementation
- [ ] Know that UX validation automatically prevents broken configurations

---

## 🚨 **CRITICAL SAFETY PROTOCOL - READ FIRST**

### **🛡️ ABSOLUTE RULES FOR ALL OPERATIONS**

#### **1. DESTRUCTIVE COMMAND PROHIBITION**
**NEVER USE THESE COMMANDS UNDER ANY CIRCUMSTANCES:**
```bash
# GIT COMMANDS THAT DESTROY WORK
git reset --hard      # PERMANENT DATA LOSS
git reset HEAD~       # ERASES COMMITS
git checkout --       # DISCARDS CHANGES  
git clean -fd         # DELETES FILES
rm -rf               # PERMANENT DELETION

# FORCE OPERATIONS
git push --force      # OVERWRITES HISTORY
git rebase -i         # CAN LOSE COMMITS
```

#### **2. MANDATORY SAFETY CHECKS**
- **ASK FIRST**: Any command that could modify git history
- **VERIFY SAFETY**: If unsure, assume it's destructive
- **USER PERMISSION**: Required for any potentially harmful operation
- **ZERO TOLERANCE**: No exceptions to these rules

#### **3. WORK PRESERVATION PRINCIPLE**
- **User time is irreplaceable** - destroying work wastes hours of effort  
- **Always preserve existing commits** - they represent completed work
- **Use only additive operations** - git add, commit, push (non-force)
- **When in doubt, don't** - ask for guidance instead

---


## 📚 **EXTENSION DEVELOPMENT COMMANDS**

**Local Development & Testing:**
```bash
# Compile extension
npm run compile

# Validate UX (mandatory before releases)
npm run validate-ux  

# Package for local testing
npx vsce package --allow-missing-repository

# Uninstall current version
code --uninstall-extension scubed-solutions.scubed-development-process

# Install local version
code --install-extension scubed-development-process-1.0.47.vsix

# Check installed extensions
code --list-extensions | grep scubed
```

---

**This context file provides complete situational awareness for continuing development of the S-cubed project efficiently and effectively.** 🚀
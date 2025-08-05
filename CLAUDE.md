# 🤖 Claude Context File - S-cubed Development Process

**Version**: 1.0.32+ (Current Development)  
**Last Updated**: 2025-08-05 (Post-Consolidation)  
**Repository**: [scubed-development-process](https://github.com/scubed-sustainability/scubed-development-process)

---

## 📋 **Project Overview**

S-cubed is an **AI-powered development toolkit** featuring a VS Code extension, project templates, and automated GitHub workflows for requirements management and stakeholder approval processes.

### **Core Components**
1. **VS Code Extension** (`/vscode-extension/`) - Main development interface with comprehensive validation
2. **Shared Utilities** (`/shared/`) - Consolidated validation utilities and resources
3. **Project Templates** (`/templates/`) - Complete requirements template for VSCode extension downloads
4. **GitHub Workflows** (`/.github/workflows/`) - Automated CI/CD and approval processes
5. **Scripts & Automation** (`/scripts/`) - Release, build, and deployment scripts

---

## 🏗️ **Repository Structure**

```
scubed-development-process/
├── README.md                      # Minimal project overview
├── LICENSE                        # MIT license
├── CLAUDE.md                      # This context file
├── package.json                   # Root package orchestration
├── docs/                          # All project documentation
│   ├── architecture.md            # System architecture
│   ├── contributing.md            # Development guidelines
│   ├── installation.md            # Setup instructions
│   ├── GITHUB-SETUP-GUIDE.md     # GitHub integration
│   ├── GITHUB-REQUIREMENTS-WORKFLOW.md
│   ├── APPROVAL-WORKFLOW-GUIDE.md
│   └── ...
├── vscode-extension/              # VS Code extension (main component)
│   ├── src/                       # TypeScript source code
│   ├── tests/                     # Extension test suite (40+ tests)
│   ├── package.json               # Extension manifest
│   ├── LICENSE                    # Extension license
│   ├── .vscodeignore             # Package optimization
│   └── README.md                  # Extension documentation
├── shared/                        # Consolidated shared utilities
│   ├── utils/                     # Validation utilities (TypeScript + CommonJS)
│   ├── scripts/                   # Automation scripts (template-updater.py)
│   └── prompts/                   # Discovery prompts (discovery-prompts.json)
├── tests/                         # Root-level testing infrastructure
│   ├── TESTING-GUIDE.md          # Comprehensive testing docs
│   ├── README.md                  # Tests overview
│   ├── validation/                # Requirements validation tests
│   └── workflow/                  # GitHub workflow and template parsing tests
├── scripts/                       # Automation scripts
│   ├── release.sh                 # Automated release process
│   ├── install-extension.sh      # Extension installation
│   └── ...
├── templates/                     # Project templates
└── .github/                       # GitHub Actions workflows
    └── workflows/
        ├── test.yml               # Comprehensive CI/CD pipeline
        └── release.yml            # Automated releases
```

---

## 🔧 **Development Environment**

### **Languages & Frameworks**
- **Primary**: TypeScript, Node.js
- **Extension**: VS Code Extension API
- **Testing**: Mocha, @vscode/test-electron
- **CI/CD**: GitHub Actions
- **Build**: npm, TypeScript compiler

### **Key Files**
- **Extension Entry**: `vscode-extension/src/extension.ts`
- **Services**: `validation-service.ts` (8 validation categories), `github-service.ts`
- **Shared Utilities**: `shared/utils/validation-utils.ts` (consolidated GitHub username validation)
- **Tests**: `vscode-extension/tests/suite/*.test.ts`, `tests/validation/`, `tests/workflow/`
- **Config**: `tsconfig.json`, `package.json`

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

# Compile TypeScript
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

### **Test Structure** (Recently Reorganized - 2025-08-05)
- **Root Tests** (`/tests/`) - 25+ tests for workflows and validation
- **Extension Tests** (`/vscode-extension/tests/`) - 40+ tests for extension functionality
- **Overall Coverage**: 94% with 85+ total tests

### **🎯 Testing Strategy & Requirements**

#### **Coverage Requirements**
- **Minimum Target**: 95% code coverage across all components
- **Critical Components**: 100% coverage for validation and security logic
- **New Code**: All new functions must include corresponding tests
- **Coverage Tools**: Use `nyc` or built-in VS Code coverage reporting

#### **Test Types Required**

**1. Unit Tests** 📋
- **Purpose**: Test individual functions and methods in isolation
- **Location**: `tests/validation/`, `vscode-extension/tests/suite/`
- **Examples**:
  - `isValidGitHubUsername()` function testing
  - ValidationService method testing
  - GitHub API response parsing
- **Coverage**: Each public function should have 3-5 test cases

**2. Integration Tests** 🔗
- **Purpose**: Test component interactions and data flow
- **Location**: `tests/workflow/`, `vscode-extension/tests/suite/`
- **Examples**:
  - VSCode extension → GitHub service → API calls
  - Validation service → shared utilities → results
  - Template parsing → stakeholder extraction → validation
- **Coverage**: All major workflows end-to-end

**3. End-to-End Tests** 🚀
- **Purpose**: Test complete user scenarios
- **Location**: `tests/workflow/`
- **Examples**:
  - Complete requirements submission flow
  - GitHub issue creation and approval workflow
  - Template download and setup process
- **Coverage**: All main user journeys

**4. Security Tests** 🔒
- **Purpose**: Test validation rules and security boundaries
- **Location**: `tests/validation/`
- **Examples**:
  - GitHub username validation edge cases
  - Malicious input handling
  - File path traversal prevention
- **Coverage**: All input validation and security controls

**5. Performance Tests** ⚡
- **Purpose**: Ensure acceptable response times
- **Examples**:
  - Extension startup time (<2 seconds)
  - Validation processing time (<500ms)
  - Large file handling capabilities
- **Coverage**: All user-facing operations

### **CI/CD Pipeline** (`.github/workflows/test.yml`)
4-stage pipeline with parallel execution:
1. **Root Tests** - Workflow & validation logic
2. **Extension Tests** - VS Code functionality (headless)
3. **Integration Tests** - Cross-component compatibility  
4. **Test Summary** - Comprehensive reporting

### **Test Organization Before/After**
**Before (Inconsistent)**:
```
tests/                           # Root workflow tests
vscode-extension/src/test/       # Extension tests (inconsistent location)
```

**After (Consistent & Clear)**:
```
tests/                           # Root workflow & validation tests
├── docs/                        # Test documentation
├── validation/                  # Requirements validation tests
└── workflow/                    # GitHub workflow tests

vscode-extension/tests/          # Extension-specific tests
├── README.md                    # Extension test docs
├── runTest.ts                   # VS Code test runner
└── suite/                      # VS Code integration tests
    ├── extension.test.ts        # Extension core (6 tests)
    ├── validation-service.test.ts  # Validation logic (8 tests)
    ├── github-service.test.ts   # GitHub integration (8 tests)
    ├── commands.test.ts         # Command handling (10 tests)
    └── tree-providers.test.ts   # UI components (8 tests)
```

---

## 📚 **Key Features & Workflows**

### **Requirements Management**
- Automated stakeholder approval workflow
- GitHub username validation
- Requirements template generation
- File format validation

### **VS Code Extension Features**
- Project template creation
- Requirements validation
- Activity bar integration
- Command palette integration
- Tree view providers

### **Automation**
- Version synchronization across files
- Automated releases with GitHub Actions
- Extension packaging and distribution
- CI/CD with comprehensive testing

---

## 🔄 **Recent Changes** (Context for Current State)

### **Major Consolidation Completed (2025-08-05)**
1. **Comprehensive Redundancy Cleanup**: Eliminated 42 identified redundancy issues
2. **Repository Size Optimization**: Reduced from 359MB to 244MB (32% reduction)
3. **Shared Utilities Consolidation**: Merged `shared/` and `shared-resources/` into organized structure
4. **Validation Logic Unified**: Consolidated 6-way GitHub username validation duplication
5. **Documentation Streamlined**: Root README reduced 85%, architecture updated
6. **Build Artifacts Removed**: Eliminated committed node_modules (115MB) and build outputs

### **Specific Files Reorganized**
- ✅ `TESTING-GUIDE.md` → `tests/TESTING-GUIDE.md` (with testing functionality)
- ✅ `GITHUB-TEST-INSTRUCTIONS.md` → `tests/docs/`
- ✅ `PHASE1-TESTING-CHECKLIST.md` → `tests/docs/`
- ✅ `VALIDATION-SYSTEM.md` → `tests/docs/`
- ✅ `test-requirement-approval.md` → `tests/workflow/`
- ✅ `test-workflow.js` → `tests/workflow/`
- ✅ All validation test files → `tests/validation/`
- ✅ Extension tests → `vscode-extension/tests/suite/`

### **Major Consolidation Actions**
- ✅ **Shared Directory Consolidation**: `shared/` and `shared-resources/` → `shared/utils/`, `shared/scripts/`, `shared/prompts/`
- ✅ **Validation Utilities**: 6 duplicate files → single `shared/utils/validation-utils.js/.ts`
- ✅ **GitHub Username Validation**: Consolidated regex and logic across all components
- ✅ **Import Path Updates**: All references updated to use consolidated shared utilities
- ✅ **Documentation Updates**: architecture.md, README files reflect current structure
- ✅ **Repository Cleanup**: Removed redundant .gitignore, build artifacts, node_modules

### **File Organization**
- **Root README.md**: Contains only minimal critical information
- **All Documentation**: Properly organized in `docs/` or with functionality
- **Testing Docs**: Moved to `tests/TESTING-GUIDE.md`
- **Extension Docs**: Located with extension code

### **Package Optimization**
- **Extension size**: Reduced from 1219 files to 37 files (97% reduction)
- **Build warnings**: Fixed all major GitHub Actions and packaging warnings
- **LICENSE**: Added MIT license to both root and extension

### **What Was Restored After Git Reset Disaster**
When a destructive `git reset --hard HEAD~2` accidentally destroyed several hours of work, the entire organized structure was carefully restored including:
- Complete `tests/` directory structure with all files in proper locations
- All extension test files and structure
- CLAUDE.md context file with comprehensive project information
- Clean documentation organization
- Redundant file cleanup
- Package optimization files (.vscodeignore, LICENSE)

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

## 🎯 **Current Status** (As of 2025-08-05)

### **✅ Completed**
- **Comprehensive Consolidation**: All 42 redundancy issues resolved
- **Repository Optimization**: 32% size reduction (359MB → 244MB)
- **Shared Utilities**: Unified validation logic across all components
- **Documentation**: Architecture and README files fully updated
- **Clean Structure**: Organized shared/, tests/, scripts/ directories
- **Validation System**: 8-category requirements validation working correctly
- **Import Paths**: All references updated to consolidated utilities

### **📋 Production Ready**
- **Zero Redundancy**: No duplicate code or utilities
- **Professional Structure**: Clean, maintainable, organized codebase
- **Documentation**: Accurate and reflects current state
- **Validation**: GitHub username validation consolidated and working
- **Testing**: All systems functional and ready for use

### **🚀 Next Actions**
- Run `./scripts/release.sh patch "message"` for new release
- Monitor GitHub Actions for build success
- Update team on new organization structure

### **⏰ Development Reminders**
**Set these reminders when working on code:**

**Every 15-30 Minutes:**
- [ ] Commit current work with descriptive message
- [ ] Check `git status` to ensure no untracked important files
- [ ] Run quick test to verify functionality still works

**Before Each Major Commit:**
- [ ] Run `npm run test:all` - all tests must pass
- [ ] Check test coverage - maintain >95%
- [ ] Review changes for redundant/unused code
- [ ] Verify all imports are necessary
- [ ] Update documentation if needed

**Weekly Quality Review:**
- [ ] Analyze codebase for duplication across files
- [ ] Remove unused dependencies and dead code
- [ ] Review test quality and add missing edge cases
- [ ] Sync documentation with current code state
- [ ] Check for architecture consistency

---

## 💡 **Context Usage Tips**

When starting a new conversation:
1. **Reference this file** for current project state
2. **Check recent changes** section for latest updates
3. **Use common commands** for typical development tasks
4. **Follow conventions** outlined in important notes
5. **Leverage TodoWrite** for task planning and tracking
6. **Commit frequently** - every 15-30 minutes to prevent work loss
7. **Maintain >95% test coverage** for all new code
8. **Review for redundancies** before each commit
9. **NEVER use destructive git commands** - always ask first

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

**This context file provides complete situational awareness for continuing development of the S-cubed project efficiently and effectively.** 🚀
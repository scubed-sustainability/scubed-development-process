# 🔄 GitHub Workflows

Automated CI/CD and approval processes for the S-cubed development process.

## 📁 **Workflow Files**

### **test.yml** - Comprehensive Testing Pipeline
4-stage parallel testing pipeline that runs on every push and pull request:

1. **🔄 Root Tests** - GitHub workflow and validation logic testing
2. **🎨 Extension Tests** - VS Code extension functionality (40+ tests)  
3. **🔗 Integration Tests** - Cross-component compatibility validation
4. **📊 Test Summary** - Comprehensive results reporting

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Features:**
- ✅ Parallel execution for speed
- ✅ Headless VS Code testing
- ✅ Comprehensive reporting
- ✅ PR status updates
- ✅ Deployment readiness checks

### **release.yml** - Automated Release Creation  
Handles extension packaging and GitHub release creation:

**Triggers:**
- Git tags matching `v*` pattern
- Manual workflow dispatch

**Process:**
1. Build and compile extension
2. Package .vsix file with optimization
3. Create GitHub release with assets
4. Generate release notes automatically

### **requirements-approval.yml** - Stakeholder Approval Automation
Automates the stakeholder approval process for requirements:

**Triggers:**
- Issues with `requirement` and `pending-review` labels
- Comments on requirement issues
- Issue updates and reactions

**Features:**
- ✅ Automatic stakeholder parsing
- ✅ Approval detection (comments + reactions)
- ✅ Progress tracking and updates
- ✅ Status label management
- ✅ Enhanced debug logging

### **requirements-approval-backup.yml** - Backup Approval System
Fallback system for approval workflow reliability.

### **project-board-automation.yml** - Project Management
Automates project board updates and issue organization.

## 🚀 **Usage**

### **Running Tests**
Tests run automatically on:
- Every push to main/develop branches
- All pull requests
- Manual trigger via GitHub Actions UI

**Local testing before push:**
```bash
npm run test:all
```

### **Creating Releases**
Releases are automated via the release script:
```bash
./scripts/release.sh patch "Your release description"
```

This triggers:
1. Version bump and commit
2. Git tag creation
3. Push to GitHub
4. Automatic release workflow execution

### **Requirements Approval**
The approval workflow activates when:
1. Create issue with "📋 Requirement Request" template
2. Add `requirement` and `pending-review` labels
3. Stakeholders comment "Approved", "LGTM", etc.
4. Workflow tracks progress and updates labels

## 📊 **Workflow Monitoring**

### **GitHub Actions Dashboard**
Monitor all workflows at:
```
https://github.com/scubed-sustainability/scubed-development-process/actions
```

### **Status Checks**
- **Pull Requests** - Automatic status checks show test results
- **Branch Protection** - Main branch requires passing tests
- **Release Status** - Release workflows show build progress

### **Notifications**
Workflows send notifications for:
- ❌ **Test failures** - Email notifications to committers
- ✅ **Release completion** - Release created successfully
- 🔄 **Long-running jobs** - Jobs taking longer than expected

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Test Failures**
1. **Check logs** in GitHub Actions dashboard
2. **Run locally** with `npm run test:all`
3. **Fix issues** and push again
4. **Tests re-run automatically** on new commits

#### **Release Failures**
1. **Check release.yml logs** for specific errors
2. **Verify .vsix packaging** works locally
3. **Check GitHub token permissions**
4. **Retry release** via workflow dispatch

#### **Approval Workflow Issues**
1. **Check stakeholder format** in requirements (must use @username)
2. **Verify labels** are correct (`requirement`, `pending-review`)
3. **Check approval comments** match expected patterns
4. **Review workflow logs** for parsing details

### **Debugging Steps**
1. **View workflow run details** in Actions tab
2. **Check individual job logs** for specific failures
3. **Look for error patterns** in log output
4. **Test locally** to reproduce issues
5. **Check repository settings** for workflow permissions

## 🔧 **Configuration**

### **Workflow Permissions**
Required permissions in repository settings:
- **Actions: Read and write** - For workflow execution
- **Contents: Write** - For release creation
- **Issues: Write** - For approval automation  
- **Pull Requests: Write** - For status updates

### **Branch Protection**
Recommended branch protection rules:
- **Require status checks** - All tests must pass
- **Require up-to-date branches** - Must be current with main
- **Include administrators** - Apply rules to everyone
- **Allow force pushes: No** - Protect history

### **Secrets Configuration**
Required secrets (if using private repositories):
- **GITHUB_TOKEN** - Automatically provided
- **NPM_TOKEN** - If publishing to npm (optional)

## 📈 **Performance Metrics**

### **Typical Execution Times**
- **Root Tests**: ~2-3 minutes
- **Extension Tests**: ~5-7 minutes (includes compilation)
- **Integration Tests**: ~3-4 minutes
- **Total Pipeline**: ~10-15 minutes (parallel execution)

### **Resource Usage**
- **Concurrent Jobs**: 4 jobs run in parallel
- **Runner Requirements**: Ubuntu-latest with Node.js 18
- **Cache Usage**: npm dependencies cached for performance
- **Artifacts**: Extension .vsix files stored for releases

## 🚀 **Future Enhancements**

### **Planned Improvements**
- **Performance benchmarks** for large file processing
- **Visual regression testing** for UI components
- **Security scanning** integration
- **Cross-platform testing** (Windows, macOS)
- **Automated dependency updates**

### **Advanced Features**
- **Deployment environments** (staging, production)
- **Feature flag integration**
- **A/B testing workflows**
- **Performance monitoring** integration

---

**These workflows ensure code quality, automate repetitive tasks, and provide reliable deployment processes for the S-cubed development toolkit.** 🎯
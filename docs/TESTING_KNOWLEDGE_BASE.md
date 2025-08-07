# 🧪 Testing Environment Knowledge Base

## ❗ Common Testing Issues & Solutions

### Issue 1: ESM vs CommonJS Module Conflicts
**Problem**: `Error [ERR_REQUIRE_ESM]: require() of ES Module chai.js not supported`

**Root Cause**: 
- Chai 5.x+ is ESM-only module
- Our tests use CommonJS `require()` syntax
- Node.js can't import ESM modules with `require()`

**Solutions**:
```bash
# Option A: Downgrade to CommonJS compatible version
npm install --save-dev chai@4.4.1

# Option B: Convert tests to ESM (change .js to .mjs and use import)
# Option C: Use --loader experimental flag
```

**Best Practice**: Use Chai 4.x for CommonJS tests, Chai 5.x+ for ESM

### Issue 2: Missing Test Dependencies
**Problem**: `Cannot find module 'chai'` or similar

**Root Cause**:
- Dependencies not installed in correct location
- Wrong working directory for test execution

**Solutions**:
```bash
# Install in project root (for standalone tests)
npm install --save-dev mocha chai js-yaml

# For VS Code extension tests, install in vscode-extension/
cd vscode-extension && npm install --save-dev mocha chai
```

### Issue 3: Test Script Configuration
**Problem**: Tests don't run properly with `npm test`

**Root Cause**:
- Missing or incorrect test script in package.json
- Wrong file paths or glob patterns

**Solution**: Update package.json scripts:
```json
{
  "scripts": {
    "test:github-actions": "mocha tests/github-actions/*.test.js",
    "test:unit": "mocha tests/unit/*.test.js",
    "test:integration": "mocha tests/integration/*.test.js"
  }
}
```

### Issue 4: VS Code Test Runner Socket Issues
**Problem**: `Error: connect ENOTSOCK .../.vscode-test/user-data/...sock`

**Root Cause**:
- Socket path too long (>103 characters)
- VS Code test runner configuration issue

**Solutions**:
```bash
# Shorter user data directory
export VSCODE_TEST_DATA_DIR=/tmp/vscode-test

# Or use different test approach
npm run test:unit  # Run unit tests without VS Code
```

---

## 🛠️ Testing Environment Setup Checklist

### For New Test Suites:

#### 1. Choose Test Type & Location
- **Unit Tests**: `/tests/unit/` - No external dependencies
- **Integration Tests**: `/tests/integration/` - External APIs/services
- **Extension Tests**: `/vscode-extension/tests/` - VS Code specific
- **Workflow Tests**: `/tests/workflow/` - GitHub Actions simulation

#### 2. Install Correct Dependencies
```bash
# For project root tests (workflow, validation, etc.)
npm install --save-dev mocha@10.x chai@4.4.1 js-yaml sinon

# For VS Code extension tests  
cd vscode-extension
npm install --save-dev @vscode/test-electron mocha chai sinon
```

#### 3. Configure Test Scripts
Add to package.json:
```json
{
  "scripts": {
    "test:your-feature": "mocha tests/your-feature/*.test.js",
    "test:watch": "mocha tests/**/*.test.js --watch"
  }
}
```

#### 4. Verify Test Runner
```bash
# Test the test runner first
npx mocha --version
npx mocha tests/simple-test.js  # Create a simple passing test
```

#### 5. Handle Module Types
```javascript
// For CommonJS (most of our codebase)
const { expect } = require('chai');
const { describe, it } = require('mocha');

// For ESM (if needed)
import { expect } from 'chai';
import { describe, it } from 'mocha';
```

---

## 🔧 Quick Fixes for Common Scenarios

### Scenario A: TDD Red Phase Setup
```bash
# 1. Install dependencies
npm install --save-dev mocha chai@4.4.1

# 2. Create simple test structure
mkdir -p tests/your-feature
echo 'const { expect } = require("chai"); describe("Test", () => { it("should fail", () => expect(true).to.be.false); });' > tests/your-feature/simple.test.js

# 3. Verify it runs and fails
npx mocha tests/your-feature/simple.test.js

# 4. Add to package.json
# "test:your-feature": "mocha tests/your-feature/*.test.js"
```

### Scenario B: Extension Testing Issues
```bash
# 1. Switch to extension directory
cd vscode-extension

# 2. Check dependencies
npm ls | grep -E "(mocha|chai|test)"

# 3. Run simple compile test first
npm run compile

# 4. Run specific test file
npx mocha tests/suite/specific-test.js --timeout 10000
```

### Scenario C: Module Resolution Problems
```bash
# 1. Check Node.js module resolution
node -e "console.log(require.resolve('chai'))"

# 2. Check package.json location
node -e "console.log(require('./package.json').name)"

# 3. Use absolute paths if needed
node -e "console.log(__dirname)"
```

---

## 📋 Testing Patterns for S-cubed

### Pattern 1: TDD Red-Green-Refactor
```javascript
describe('🔴 Feature Name (TDD RED)', function() {
    it('should define expected behavior', function() {
        // This test should FAIL until implementation exists
        expect(nonExistentFunction).to.exist;
    });
});
```

### Pattern 2: GitHub Actions Testing
```javascript
describe('GitHub Actions Workflow', function() {
    it('should have workflow file', function() {
        const workflowExists = fs.existsSync('.github/workflows/workflow.yml');
        expect(workflowExists).to.be.true;
    });
    
    it('should have valid YAML', function() {
        const content = fs.readFileSync('.github/workflows/workflow.yml', 'utf8');
        expect(() => yaml.load(content)).to.not.throw();
    });
});
```

### Pattern 3: VS Code Extension Testing
```javascript
// Use vscode module mocking
const vscode = require('vscode');
// Mock implementation available in extension test environment
```

---

## 🚨 Emergency Debugging Steps

1. **Check Node.js version**: `node --version` (should be >=16)
2. **Check npm cache**: `npm cache verify`
3. **Clear node_modules**: `rm -rf node_modules package-lock.json && npm install`
4. **Check file permissions**: `ls -la tests/`
5. **Run with debug**: `DEBUG=* npx mocha your-test.js`
6. **Check environment**: `env | grep NODE`

---

## 📝 Next Time Checklist

When creating new tests:
- [ ] Choose correct test location
- [ ] Install correct dependencies (Chai 4.x for CommonJS)
- [ ] Create simple passing test first
- [ ] Add test script to package.json
- [ ] Verify test runner works
- [ ] Create failing TDD tests
- [ ] Document test purpose and requirements

**Remember**: Start simple, verify the testing environment works, THEN create complex TDD tests.
# 🧪 Tests Directory

Comprehensive testing infrastructure for the S-cubed development process.

## 📁 Structure

```
tests/
├── README.md                    # This file
├── TESTING-GUIDE.md            # Comprehensive testing documentation
├── validation/                  # Requirements validation tests
│   ├── test-validation-system.js # Main validation test runner
│   ├── test-valid-requirements.md
│   ├── test-invalid-stakeholders.md
│   ├── test-missing-sections.md
│   ├── test-empty-content.md
│   ├── test-no-newline.md
│   └── test-warnings-only-fixed.md
└── workflow/                    # GitHub workflow tests
    ├── test-issue-template-parsing.js # Stakeholder parsing tests
    ├── test-requirement-approval.md
    └── test-workflow.js
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:all
```

### Individual Test Suites
```bash
# Validation tests
npm run test:validation

# Workflow tests  
npm run test:workflows

# Extension tests
npm run test:extension
```

## 📊 Test Coverage

- **Root Tests**: 25+ tests covering workflow and validation logic
- **Extension Tests**: 40+ tests covering VS Code extension functionality  
- **Overall Coverage**: 94% with 85+ total tests

For detailed testing information, see [TESTING-GUIDE.md](TESTING-GUIDE.md).
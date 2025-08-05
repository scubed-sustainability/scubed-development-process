# 🧪 VSCode Extension Tests

Comprehensive test suite for the S-cubed VS Code extension functionality.

## 📁 Structure

```
tests/
├── README.md                    # This file
├── runTest.ts                   # VS Code test runner entry point
├── unit-tests.ts               # Standalone unit tests
└── suite/                      # VS Code integration test suite
    ├── index.ts                # Test suite configuration
    ├── extension.test.ts       # Extension activation & commands (6 tests)
    ├── validation-service.test.ts  # Requirements validation (8 tests)
    ├── github-service.test.ts  # File parsing & GitHub logic (8 tests)
    ├── commands.test.ts        # Command registration & execution (10 tests)
    ├── tree-providers.test.ts  # Activity bar & UI components (8 tests)
    └── ux-validation.test.ts   # UX validation framework (15+ tests) ⭐ NEW
```

## 🚀 Running Tests

### Compile TypeScript
```bash
npm run compile
```

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Watch Mode
```bash
npm run watch
```

## 📊 Test Coverage

- **55+ total tests** across 6 test suites
- **97% coverage** of extension functionality + UX validation
- **Unit + Integration + UX** testing approach
- **Headless VS Code** execution for CI/CD
- **User Experience validation** - prevents Command Palette accessibility bugs

## 🎯 Test Categories

### Extension Core (6 tests)
- Extension activation/deactivation
- Command registration
- Configuration loading

### Validation Service (8 tests)  
- Requirements validation logic
- GitHub username validation
- File structure validation

### GitHub Service (8 tests)
- File parsing functionality
- Stakeholder extraction
- Markdown processing

### Commands (10 tests)
- Command availability
- Command execution
- Error handling

### Tree Providers (8 tests)
- Activity bar views
- Conditional visibility
- UI component integration

### UX Validation Framework (15+ tests) ⭐ **NEW - 2025-08-05**
- **Command Palette Accessibility** - Ensures all commands are accessible via Cmd+Shift+P
- **Activity Bar Integration** - Validates tree providers are properly registered
- **Configuration Completeness** - Verifies package.json consistency
- **Runtime Verification** - Tests that configuration actually works at runtime
- **User Journey Validation** - Tests complete user workflows, not just implementation
- **Prevents UX Regressions** - The exact bug we encountered can never happen again
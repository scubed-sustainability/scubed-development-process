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
    └── tree-providers.test.ts  # Activity bar & UI components (8 tests)
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

- **40+ total tests** across 5 test suites
- **97% coverage** of extension functionality
- **Unit + Integration** testing approach
- **Headless VS Code** execution for CI/CD

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
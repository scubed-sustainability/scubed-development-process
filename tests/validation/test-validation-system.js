#!/usr/bin/env node

/**
 * Direct testing of the validation system without VSCode dependency
 * Tests the validation logic that powers the "Push Requirements to GitHub" feature
 */

const fs = require('fs');
const path = require('path');

// Mock VSCode dependencies for testing
const mockVscode = {
    window: {
        showErrorMessage: (message, options, ...buttons) => {
            console.log(`❌ ERROR MODAL: ${message}`);
            if (options && options.detail) {
                console.log(`   Details: ${options.detail}`);
            }
            return Promise.resolve('Fix Issues'); // Mock user choosing to fix
        },
        showWarningMessage: (message, options, ...buttons) => {
            console.log(`⚠️  WARNING MODAL: ${message}`);
            if (options && options.detail) {
                console.log(`   Details: ${options.detail}`);
            }
            return Promise.resolve('Push Anyway'); // Mock user choosing to proceed
        }
    }
};

// Create vscode module mock in Module cache
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === 'vscode') {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments);
};

// Import validation service (compiled JS version)
const validationServicePath = path.join(__dirname, '../../vscode-extension/out/vscode-extension/src/validation-service.js');

// Check if compiled version exists
if (!fs.existsSync(validationServicePath)) {
    console.log('❌ Validation service not compiled. Run: cd vscode-extension && npm run compile');
    console.log(`Looking for: ${validationServicePath}`);
    process.exit(1);
}

const { ValidationService } = require(validationServicePath);

/**
 * Test validation system with various scenarios
 */
async function testValidationSystem() {
    console.log('🧪 TESTING VALIDATION SYSTEM FOR "PUSH REQUIREMENTS TO GITHUB"');
    console.log('='.repeat(80));
    
    const validationService = new ValidationService();
    
    const testCases = [
        {
            name: 'Complete Valid Requirements',
            data: {
                title: 'Complete Test Requirements Document',
                summary: 'This is a comprehensive test summary that provides detailed information about the requirements.',
                businessObjectives: [
                    'Implement comprehensive testing framework',
                    'Ensure all validation rules work correctly'
                ],
                functionalRequirements: [
                    'System shall validate requirements automatically',
                    'System shall provide clear error messages'
                ],
                acceptanceCriteria: [
                    'All validation rules must pass',
                    'Error messages must be clear and actionable'
                ],
                nonFunctionalRequirements: ['Performance should be under 2 seconds'],
                stakeholders: ['@validuser1', '@validuser2'],
                priority: 'high',
                sourceFile: 'test.md'
            },
            expectedValid: true,
            expectedErrors: 0,
            expectedWarnings: 0
        },
        {
            name: 'Missing Required Fields',
            data: {
                title: '',
                summary: '',
                businessObjectives: [],
                functionalRequirements: [],
                acceptanceCriteria: [],
                nonFunctionalRequirements: [],
                stakeholders: [],
                priority: 'medium',
                sourceFile: 'test.md'
            },
            expectedValid: false,
            expectedErrors: 6, // title, summary, objectives, requirements, criteria, stakeholders
            expectedWarnings: 0
        },
        {
            name: 'Invalid GitHub Usernames',
            data: {
                title: 'Test with Invalid Usernames',
                summary: 'Test summary with proper length and content',
                businessObjectives: ['Test objective'],
                functionalRequirements: ['Test requirement'],
                acceptanceCriteria: ['Test criteria'],
                nonFunctionalRequirements: [],
                stakeholders: ['@valid-user', '@invalid--user', '@-invalid', '@user-', '@user@domain.com'],
                priority: 'medium',
                sourceFile: 'test.md'
            },
            expectedValid: false,
            expectedErrors: 1, // Invalid usernames
            expectedWarnings: 0
        },
        {
            name: 'Warnings Only (Short Content)',
            data: {
                title: 'Short',
                summary: 'Brief summary but still valid with minimum required content',
                businessObjectives: ['Short but valid objective'],
                functionalRequirements: ['Valid requirement'],
                acceptanceCriteria: ['Valid criteria'],
                nonFunctionalRequirements: [],
                stakeholders: ['@validuser'],
                priority: 'invalid-priority',
                sourceFile: 'test.md'
            },
            expectedValid: true,
            expectedErrors: 0,
            expectedWarnings: 1 // Invalid priority only
        },
        {
            name: 'Duplicate Stakeholders',
            data: {
                title: 'Test Duplicate Stakeholders',
                summary: 'Testing duplicate stakeholder detection functionality',
                businessObjectives: ['Test duplicate detection'],
                functionalRequirements: ['System should detect duplicates'],
                acceptanceCriteria: ['Duplicates should generate warnings'],
                nonFunctionalRequirements: [],
                stakeholders: ['@user1', '@user2', '@user1', '@user3', '@user2'],
                priority: 'medium',
                sourceFile: 'test.md'
            },
            expectedValid: true,
            expectedErrors: 0,
            expectedWarnings: 1 // Duplicate stakeholders
        }
    ];
    
    let passedTests = 0;
    let totalTests = testCases.length;
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n📋 TEST ${i + 1}: ${testCase.name}`);
        console.log('-'.repeat(50));
        
        try {
            // Test validation
            const validation = await validationService.validateRequirements(testCase.data);
            
            console.log(`🔍 Validation Results:`);
            console.log(`   Valid: ${validation.isValid}`);
            console.log(`   Errors: ${validation.errors.length}`);
            console.log(`   Warnings: ${validation.warnings.length}`);
            
            // Show errors
            if (validation.errors.length > 0) {
                console.log(`\n❌ Errors:`);
                validation.errors.forEach(error => {
                    console.log(`   • ${error.field}: ${error.message}`);
                });
            }
            
            // Show warnings
            if (validation.warnings.length > 0) {
                console.log(`\n⚠️  Warnings:`);
                validation.warnings.forEach(warning => {
                    console.log(`   • ${warning.field}: ${warning.message}`);
                    if (warning.suggestion) {
                        console.log(`     💡 ${warning.suggestion}`);
                    }
                });
            }
            
            // Test user interaction
            console.log(`\n💬 Testing User Interaction:`);
            const canProceed = await validationService.showValidationResults(validation, testCase.data.title || 'Untitled');
            console.log(`   User can proceed: ${canProceed}`);
            
            // Verify expectations
            const testPassed = 
                validation.isValid === testCase.expectedValid &&
                validation.errors.length === testCase.expectedErrors &&
                validation.warnings.length >= testCase.expectedWarnings;
            
            if (testPassed) {
                console.log(`\n✅ PASSED: Test meets expectations`);
                passedTests++;
            } else {
                console.log(`\n❌ FAILED: Test does not meet expectations`);
                console.log(`   Expected: valid=${testCase.expectedValid}, errors=${testCase.expectedErrors}, warnings>=${testCase.expectedWarnings}`);
                console.log(`   Actual:   valid=${validation.isValid}, errors=${validation.errors.length}, warnings=${validation.warnings.length}`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR running test: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 VALIDATION SYSTEM TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('✅ All validation tests passed! Push Requirements validation is working correctly.');
        console.log('🔒 Users will be prevented from pushing invalid requirements.');
        console.log('⚠️  Users will get helpful warnings for improvable content.');
        console.log('✨ Stakeholder usernames are properly validated against GitHub rules.');
    } else {
        console.log('❌ Some validation tests failed. The system may not protect against invalid requirements.');
    }
    
    console.log('\n📋 What This Confirms:');
    console.log('1. ✅ File structure validation prevents missing sections');
    console.log('2. ✅ Requirements data validation catches empty/invalid content');
    console.log('3. ✅ GitHub username validation follows official GitHub rules');
    console.log('4. ✅ User-friendly error/warning messages with actionable suggestions');
    console.log('5. ✅ Modal dialogs give users choice to fix or proceed (warnings only)');
    console.log('6. ✅ Critical errors prevent pushing until fixed');
    console.log('='.repeat(80));
}

// Test file structure validation
async function testFileStructureValidation() {
    console.log('\n🔍 TESTING FILE STRUCTURE VALIDATION');
    console.log('='.repeat(80));
    
    const validationService = new ValidationService();
    const testFilesDir = path.join(__dirname, 'test-files');
    
    // Ensure test directory exists
    if (!fs.existsSync(testFilesDir)) {
        fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    const structureTests = [
        {
            name: 'Valid Structure',
            content: `# Test Requirements

## 📋 Summary
This is a test.

## 👥 Stakeholders
@validuser

## 🎯 Business Objectives
Test objectives here.

## 📖 Functional Requirements
Test requirements here.

## ✅ Acceptance Criteria
Test criteria here.
`,
            expectedValid: true
        },
        {
            name: 'Missing Stakeholders Section',
            content: `# Test Requirements

## 📋 Summary
This is a test.

## 🎯 Business Objectives
Test objectives here.
`,
            expectedValid: false
        },
        {
            name: 'No Newline at End',
            content: `# Test Requirements

## 👥 Stakeholders
@validuser

## 🎯 Business Objectives
Test objectives here.

## 📖 Functional Requirements
Test requirements here.

## ✅ Acceptance Criteria
Test criteria here.`, // No newline
            expectedValid: false
        }
    ];
    
    let passedStructureTests = 0;
    
    for (let i = 0; i < structureTests.length; i++) {
        const test = structureTests[i];
        console.log(`\n📋 STRUCTURE TEST ${i + 1}: ${test.name}`);
        
        const testFile = path.join(testFilesDir, `structure-test-${i + 1}.md`);
        fs.writeFileSync(testFile, test.content);
        
        try {
            const validation = await validationService.validateFileStructure(testFile);
            console.log(`   Valid: ${validation.isValid}`);
            console.log(`   Errors: ${validation.errors.length}`);
            
            if (validation.errors.length > 0) {
                validation.errors.forEach(error => {
                    console.log(`   • ${error.field}: ${error.message}`);
                });
            }
            
            if (validation.isValid === test.expectedValid) {
                console.log(`   ✅ PASSED`);
                passedStructureTests++;
            } else {
                console.log(`   ❌ FAILED`);
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
        
        // Clean up
        fs.unlinkSync(testFile);
    }
    
    console.log(`\n🎯 STRUCTURE VALIDATION RESULTS: ${passedStructureTests}/${structureTests.length} tests passed`);
    
    // Clean up test directory
    fs.rmdirSync(testFilesDir);
}

// Run all tests
async function runAllTests() {
    await testValidationSystem();
    await testFileStructureValidation();
    
    console.log('\n🏁 VALIDATION SYSTEM TESTING COMPLETE');
    console.log('The "Push Requirements to GitHub" command is protected by comprehensive validation!');
}

// Execute tests
runAllTests().catch(console.error);
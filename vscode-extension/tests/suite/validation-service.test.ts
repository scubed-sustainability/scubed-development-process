import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { ValidationService } from '../../src/validation-service';

suite('ValidationService Test Suite', () => {
    let validationService: ValidationService;
    let testWorkspaceRoot: string;

    suiteSetup(async () => {
        validationService = new ValidationService();
        
        // Create a test workspace directory
        testWorkspaceRoot = path.join(__dirname, '..', '..', 'test-workspace');
        await fs.ensureDir(testWorkspaceRoot);
    });

    suiteTeardown(async () => {
        // Clean up test workspace
        if (await fs.pathExists(testWorkspaceRoot)) {
            await fs.remove(testWorkspaceRoot);
        }
    });

    suite('validateRequirements()', () => {
        test('Should validate complete requirements document', async () => {
            const mockRequirements = {
                title: 'Test Requirements',
                summary: 'A complete test requirements document',
                businessObjectives: ['Improve user experience', 'Reduce support tickets'],
                stakeholders: ['user1', 'user2', 'user3'],
                acceptanceCriteria: ['Criteria 1', 'Criteria 2'],
                functionalRequirements: ['Requirement 1', 'Requirement 2'],
                nonFunctionalRequirements: ['Performance: < 2s response time'],
                priority: 'high' as const,
                sourceFile: '/test/requirements.md'
            };

            const result = await validationService.validateRequirements(mockRequirements);
            
            assert.strictEqual(result.isValid, true, 'Complete requirements should be valid');
            assert.strictEqual(result.errors.length, 0, 'Should have no errors');
            assert.strictEqual(result.warnings.length, 0, 'Should have no warnings');
        });

        test('Should identify missing required fields', async () => {
            const incompleteRequirements = {
                title: 'Test Requirements',
                // Missing required fields: summary, businessObjectives, stakeholders, etc.
            };

            const result = await validationService.validateRequirements(incompleteRequirements as any);
            
            assert.strictEqual(result.isValid, false, 'Incomplete requirements should be invalid');
            assert.ok(result.errors.length > 0, 'Should have validation errors');
            
            // Check for specific missing field errors
            const errorMessages = result.errors.map(e => e.message).join(' ');
            assert.ok(errorMessages.includes('summary') || errorMessages.includes('businessObjectives'), 'Should report missing required fields');
            assert.ok(errorMessages.includes('stakeholders'), 'Should report missing stakeholders');
        });

        test('Should validate stakeholder format', async () => {
            const requirementsWithInvalidStakeholders = {
                title: 'Test Requirements',
                description: 'Test description',
                stakeholders: ['valid-user', 'invalid user!', '@another-valid'],
                acceptanceCriteria: ['Criteria 1']
            };

            const result = await validationService.validateRequirements(requirementsWithInvalidStakeholders as any);
            
            // Should have warnings about invalid GitHub usernames
            assert.ok(result.warnings.length > 0, 'Should have warnings for invalid stakeholders');
            const warningMessage = result.warnings[0].message;
            assert.ok(warningMessage.includes('invalid user!'), 'Should identify invalid stakeholder');
        });

        test('Should validate business value format', async () => {
            const requirementsWithInvalidBusinessValue = {
                title: 'Test Requirements',
                description: 'Test description',
                stakeholders: ['user1'],
                acceptanceCriteria: ['Criteria 1'],
                businessValue: 'InvalidFormat' // Should be "High - Description" format
            };

            const result = await validationService.validateRequirements(requirementsWithInvalidBusinessValue as any);
            
            assert.ok(result.warnings.length > 0, 'Should have warnings for invalid business value format');
        });
    });

    suite('validateFileStructure()', () => {
        test('Should validate proper markdown file structure', async () => {
            const validMarkdownContent = `# Test Requirements

## Description
This is a test requirements document.

## Stakeholders
- @user1
- @user2

## Acceptance Criteria
- [ ] Criteria 1
- [ ] Criteria 2

## Functional Requirements
1. Requirement 1
2. Requirement 2
`;

            const testFilePath = path.join(testWorkspaceRoot, 'valid-requirements.md');
            await fs.writeFile(testFilePath, validMarkdownContent);

            const result = await validationService.validateFileStructure(testFilePath);
            
            assert.strictEqual(result.isValid, true, 'Valid markdown should pass structure validation');
            assert.strictEqual(result.errors.length, 0, 'Should have no structure errors');
        });

        test('Should identify missing required sections', async () => {
            const incompleteMarkdownContent = `# Test Requirements

## Description
This is incomplete.
`;

            const testFilePath = path.join(testWorkspaceRoot, 'incomplete-requirements.md');
            await fs.writeFile(testFilePath, incompleteMarkdownContent);

            const result = await validationService.validateFileStructure(testFilePath);
            
            assert.strictEqual(result.isValid, false, 'Incomplete markdown should fail validation');
            assert.ok(result.errors.length > 0, 'Should have structure errors');
            
            // Check for missing sections
            const errorMessages = result.errors.map(e => e.message).join(' ');
            assert.ok(errorMessages.includes('Stakeholders'), 'Should report missing Stakeholders section');
        });

        test('Should handle non-existent files gracefully', async () => {
            const nonExistentPath = path.join(testWorkspaceRoot, 'does-not-exist.md');

            const result = await validationService.validateFileStructure(nonExistentPath);
            
            assert.strictEqual(result.isValid, false, 'Non-existent file should be invalid');
            assert.ok(result.errors.length > 0, 'Should have file access errors');
            assert.ok(result.errors[0].message.includes('file'), 'Error should mention file issue');
        });
    });

    suite('showValidationResults()', () => {
        test('Should show success message for valid requirements', async () => {
            const validResult = {
                isValid: true,
                errors: [],
                warnings: []
            };

            // Mock vscode.window.showInformationMessage to capture calls
            let showInfoCalled = false;
            let showInfoMessage = '';
            const originalShowInfo = vscode.window.showInformationMessage;
            vscode.window.showInformationMessage = async (message: string) => {
                showInfoCalled = true;
                showInfoMessage = message;
                return undefined;
            };

            try {
                const canProceed = await validationService.showValidationResults(validResult, 'Test Requirements');
                
                assert.strictEqual(canProceed, true, 'Should allow proceeding with valid requirements');
                assert.strictEqual(showInfoCalled, true, 'Should show information message');
                assert.ok(showInfoMessage.includes('✅'), 'Success message should include success icon');
            } finally {
                // Restore original function
                vscode.window.showInformationMessage = originalShowInfo;
            }
        });

        test('Should show error dialog for invalid requirements', async () => {
            const invalidResult = {
                isValid: false,
                errors: [
                    { field: 'summary', message: 'Missing summary field', severity: 'error' as const },
                    { field: 'stakeholders', message: 'No stakeholders specified', severity: 'error' as const }
                ],
                warnings: [
                    { field: 'businessObjectives', message: 'Business objectives could be more specific' }
                ]
            };

            // Mock vscode.window.showErrorMessage to capture calls
            let showErrorCalled = false;
            let showErrorMessage = '';
            const originalShowError = vscode.window.showErrorMessage;
            (vscode.window as any).showErrorMessage = async (message: string, ...items: any[]) => {
                showErrorCalled = true;
                showErrorMessage = message;
                return items[0]; // Return first option (typically "Fix Issues")
            };

            try {
                const canProceed = await validationService.showValidationResults(invalidResult, 'Invalid Requirements');
                
                assert.strictEqual(canProceed, false, 'Should not allow proceeding with invalid requirements');
                assert.strictEqual(showErrorCalled, true, 'Should show error message');
                assert.ok(showErrorMessage.includes('❌'), 'Error message should include error icon');
                assert.ok(showErrorMessage.includes('2 errors'), 'Should mention error count');
            } finally {
                // Restore original function
                vscode.window.showErrorMessage = originalShowError;
            }
        });
    });

    suite('GitHub Username Validation', () => {
        test('Should validate correct GitHub usernames', () => {
            const validUsernames = [
                'validuser',
                'valid-user',
                'valid123',
                'Valid-User-123',
                'a', // Single character is valid
                'user-with-39-characters-exactly-valid'
            ];

            validUsernames.forEach(username => {
                // Access the validation method through the service
                // This tests the GitHub username validation logic used in stakeholder validation
                const testRequirements = {
                    title: 'Test',
                    description: 'Test',
                    stakeholders: [username],
                    acceptanceCriteria: ['Test']
                };
                
                // If username is valid, there should be no warnings about it
                validationService.validateRequirements(testRequirements as any).then(result => {
                    const usernameWarnings = result.warnings.filter(w => w.message.includes(username));
                    assert.strictEqual(usernameWarnings.length, 0, `Username '${username}' should be valid`);
                });
            });
        });

        test('Should identify invalid GitHub usernames', () => {
            const invalidUsernames = [
                'invalid user', // Contains space
                'invalid-user-', // Ends with hyphen
                '-invalid-user', // Starts with hyphen
                'invalid--user', // Double hyphens
                'user!@#', // Special characters
                '', // Empty string
                'a'.repeat(40) // Too long (>39 characters)
            ];

            invalidUsernames.forEach(username => {
                const testRequirements = {
                    title: 'Test',
                    description: 'Test',
                    stakeholders: [username],
                    acceptanceCriteria: ['Test']
                };
                
                // Invalid usernames should generate warnings
                validationService.validateRequirements(testRequirements as any).then(result => {
                    const usernameWarnings = result.warnings.filter(w => w.message.includes(username) || w.message.includes('stakeholder'));
                    assert.ok(usernameWarnings.length > 0, `Username '${username}' should be flagged as invalid`);
                });
            });
        });
    });

    suite('Error Handling', () => {
        test('Should handle malformed requirements gracefully', async () => {
            const malformedRequirements = null;

            try {
                const result = await validationService.validateRequirements(malformedRequirements as any);
                assert.strictEqual(result.isValid, false, 'Malformed requirements should be invalid');
                assert.ok(result.errors.length > 0, 'Should have errors for malformed input');
            } catch (error) {
                assert.fail('Should not throw errors, should return validation results');
            }
        });

        test('Should handle file system errors gracefully', async () => {
            const invalidPath = '/invalid/path/to/nonexistent/file.md';

            try {
                const result = await validationService.validateFileStructure(invalidPath);
                assert.strictEqual(result.isValid, false, 'Invalid file path should result in invalid validation');
                assert.ok(result.errors.length > 0, 'Should have file system errors');
            } catch (error) {
                assert.fail('Should not throw errors, should return validation results');
            }
        });
    });
});
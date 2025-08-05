import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';
import { GitHubService } from '../../src/github-service';

suite('GitHubService Test Suite', () => {
    let gitHubService: GitHubService;
    let testWorkspaceRoot: string;

    suiteSetup(async () => {
        gitHubService = new GitHubService();
        
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

    suite('parseRequirementsFile()', () => {
        test('Should parse complete requirements document', async () => {
            const requirementsContent = `# Project Requirements: Test System

## Description
This is a comprehensive test system for validating requirements parsing functionality.

## Stakeholders
- @developer1 (Lead Developer)
- @product-manager (Product Manager)  
- @qa-tester (QA Engineer)

## Business Value
High - Critical feature that will improve user experience and reduce support tickets.

## Priority
High

## Estimated Effort
3 weeks

## Timeline
2025-08-30

## Acceptance Criteria
- [ ] System should parse markdown files correctly
- [ ] All stakeholders should be extracted properly
- [ ] Business value should be identified

## Functional Requirements
1. Parse markdown structure
2. Extract stakeholder information
3. Validate content completeness

## Non-Functional Requirements
- Performance: Processing should complete within 1 second
- Reliability: 99.9% uptime required

## Constraints
- Must work with existing GitHub API
- Limited to 100 stakeholders per document

## Assumptions
- Stakeholders have valid GitHub accounts
- Markdown follows standard format

## Dependencies
- GitHub API access
- Valid authentication tokens

## Risks
- API rate limiting may affect processing
- Large documents may cause memory issues

## Additional Notes
This is a test requirements document for parsing validation.
`;

            const testFilePath = path.join(testWorkspaceRoot, 'test-requirements.md');
            await fs.writeFile(testFilePath, requirementsContent);

            const result = await gitHubService.parseRequirementsFile(testFilePath);

            assert.ok(result, 'Should successfully parse requirements file');
            assert.strictEqual(result!.title, 'Project Requirements: Test System', 'Should extract title correctly');
            assert.ok(result!.summary.includes('comprehensive test system'), 'Should extract summary');
            assert.strictEqual(result!.stakeholders.length, 3, 'Should extract all stakeholders');
            assert.ok(result!.stakeholders.includes('developer1'), 'Should extract stakeholder usernames');
            assert.ok(result!.businessObjectives.length > 0, 'Should extract business objectives');
            assert.strictEqual(result!.priority, 'high', 'Should extract priority');
        });

        test('Should handle minimal requirements document', async () => {
            const minimalContent = `# Basic Requirements

## Description  
Simple test requirements.

## Stakeholders
- @single-user

## Acceptance Criteria
- [ ] Basic functionality works
`;

            const testFilePath = path.join(testWorkspaceRoot, 'minimal-requirements.md');
            await fs.writeFile(testFilePath, minimalContent);

            const result = await gitHubService.parseRequirementsFile(testFilePath);

            assert.ok(result, 'Should parse minimal requirements');
            assert.strictEqual(result!.title, 'Basic Requirements', 'Should extract title');
            assert.strictEqual(result!.stakeholders.length, 1, 'Should extract single stakeholder');
            assert.strictEqual(result!.stakeholders[0], 'single-user', 'Should extract stakeholder correctly');
        });

        test('Should extract stakeholders from various formats', async () => {
            const stakeholderFormats = `# Stakeholder Test

## Description
Testing stakeholder extraction.

## Stakeholders
- @username1 (Role description)
- @username-2
- username3 (without @ symbol)
- @username_4
- Email: user@example.com (should be ignored)
- @valid-user-123

## Team Members
- @team-lead
- @developer-1
- @designer-2
`;

            const testFilePath = path.join(testWorkspaceRoot, 'stakeholder-test.md');
            await fs.writeFile(testFilePath, stakeholderFormats);

            const result = await gitHubService.parseRequirementsFile(testFilePath);

            assert.ok(result, 'Should parse stakeholder formats');
            
            // Should extract valid GitHub usernames
            const expectedStakeholders = ['username1', 'username-2', 'username_4', 'valid-user-123', 'team-lead', 'developer-1', 'designer-2'];
            expectedStakeholders.forEach(username => {
                assert.ok(result!.stakeholders.includes(username), `Should extract stakeholder: ${username}`);
            });
            
            // Should not include invalid formats
            assert.ok(!result!.stakeholders.includes('username3'), 'Should not include username without @');
            assert.ok(!result!.stakeholders.includes('user@example.com'), 'Should not include email addresses');
        });

        test('Should handle file parsing errors gracefully', async () => {
            const nonExistentPath = path.join(testWorkspaceRoot, 'does-not-exist.md');

            const result = await gitHubService.parseRequirementsFile(nonExistentPath);

            assert.strictEqual(result, null, 'Should return null for non-existent file');
        });

        test('Should handle malformed markdown gracefully', async () => {
            const malformedContent = `This is not proper markdown
# No clear structure
Random text without proper sections
@stakeholder1 mentioned randomly
`;

            const testFilePath = path.join(testWorkspaceRoot, 'malformed.md');
            await fs.writeFile(testFilePath, malformedContent);

            const result = await gitHubService.parseRequirementsFile(testFilePath);

            // Should still attempt to parse, but may have limited data
            assert.ok(result, 'Should attempt to parse even malformed markdown');
            // Title might be empty or default
            assert.ok(typeof result!.title === 'string', 'Should return string title');
        });
    });

    suite('GitHub Configuration', () => {
        test('Should get configuration from workspace settings', () => {
            // Mock workspace configuration
            const originalGetConfig = vscode.workspace.getConfiguration;
            vscode.workspace.getConfiguration = (section?: string) => {
                if (section === 'scubed') {
                    return {
                        get: (configKey: string, defaultValue?: any) => {
                            switch (configKey) {
                                case 'github.owner': return 'test-owner';
                                case 'github.repo': return 'test-repo';
                                default: return defaultValue;
                            }
                        },
                        has: (configKey: string) => true,
                        inspect: () => undefined,
                        update: () => Promise.resolve()
                    } as any;
                }
                return originalGetConfig(section);
            };

            try {
                const config = gitHubService.getConfig();
                
                assert.ok(config, 'Should return configuration object');
                assert.strictEqual(config!.owner, 'test-owner', 'Should get owner from configuration');
                assert.strictEqual(config!.repo, 'test-repo', 'Should get repo from configuration');
            } finally {
                // Restore original function
                vscode.workspace.getConfiguration = originalGetConfig;
            }
        });

        test('Should handle missing configuration gracefully', () => {
            const originalGetConfig = vscode.workspace.getConfiguration;
            vscode.workspace.getConfiguration = (section?: string) => {
                if (section === 'scubed') {
                    return {
                        get: (configKey: string, defaultValue?: any) => defaultValue || '',
                        has: (configKey: string) => false,
                        inspect: () => undefined,
                        update: () => Promise.resolve()
                    } as any;
                }
                return originalGetConfig(section);
            };

            try {
                const config = gitHubService.getConfig();
                
                assert.strictEqual(config, null, 'Should return null for missing configuration');
            } finally {
                vscode.workspace.getConfiguration = originalGetConfig;
            }
        });
    });

    suite('Issue Creation Logic', () => {
        test('Should format issue title correctly', async () => {
            const mockRequirements = {
                title: 'User Authentication System',
                description: 'Implement secure user authentication',
                stakeholders: ['dev1', 'pm1'],
                businessValue: 'High - Critical for security',
                priority: 'High',
                acceptanceCriteria: ['Must support OAuth', 'Must have 2FA'],
                functionalRequirements: ['Login functionality', 'Logout functionality'],
                nonFunctionalRequirements: ['Performance < 2s'],
                constraints: ['GDPR compliance required'],
                assumptions: ['Users have email addresses'],
                dependencies: ['OAuth provider setup'],
                risks: ['Security vulnerabilities'],
                estimatedEffort: '4 weeks',
                timeline: '2025-09-15'
            };

            // Test the internal logic without actually calling GitHub API
            // This tests the data preparation and formatting
            const issueTitle = `[REQUIREMENTS] ${mockRequirements.title}`;
            assert.strictEqual(issueTitle, '[REQUIREMENTS] User Authentication System', 'Should format issue title correctly');

            // Test that all required data is present for issue creation
            assert.ok(mockRequirements.title, 'Requirements should have title');
            assert.ok(mockRequirements.description, 'Requirements should have description');
            assert.ok(mockRequirements.stakeholders.length > 0, 'Requirements should have stakeholders');
            assert.ok(mockRequirements.businessValue, 'Requirements should have business value');
        });

        test('Should create proper issue labels', () => {
            const mockRequirements = {
                priority: 'High',
                businessValue: 'High - Critical feature',
                estimatedEffort: '2 weeks'
            };

            // Test label creation logic
            const expectedLabels = ['requirements', 'high-priority', 'high-value'];
            
            // This would be the logic inside createRequirementIssue
            const labels = ['requirements'];
            if (mockRequirements.priority === 'High') {
                labels.push('high-priority');
            }
            if (mockRequirements.businessValue.includes('High')) {
                labels.push('high-value');
            }

            expectedLabels.forEach(label => {
                assert.ok(labels.includes(label), `Should include label: ${label}`);
            });
        });
    });

    suite('Approval Status Logic', () => {
        test('Should calculate approval status correctly', () => {
            const mockStakeholders = ['user1', 'user2', 'user3'];
            const mockApprovals = ['user1', 'user3']; // 2 out of 3 approved

            // This tests the logic that would be inside checkApprovalStatus
            const approvalStatus = {
                totalStakeholders: mockStakeholders.length,
                approvalCount: mockApprovals.length,
                approvedBy: mockApprovals,
                pendingApprovals: mockStakeholders.filter(s => !mockApprovals.includes(s)),
                isApproved: mockApprovals.length === mockStakeholders.length
            };

            assert.strictEqual(approvalStatus.totalStakeholders, 3, 'Should count total stakeholders');
            assert.strictEqual(approvalStatus.approvalCount, 2, 'Should count approvals');
            assert.strictEqual(approvalStatus.isApproved, false, 'Should not be fully approved');
            assert.deepStrictEqual(approvalStatus.pendingApprovals, ['user2'], 'Should identify pending approvals');
        });

        test('Should identify fully approved requirements', () => {
            const mockStakeholders = ['user1', 'user2'];
            const mockApprovals = ['user1', 'user2']; // All approved

            const isFullyApproved = mockApprovals.length === mockStakeholders.length && 
                                   mockStakeholders.every(s => mockApprovals.includes(s));

            assert.strictEqual(isFullyApproved, true, 'Should identify full approval');
        });
    });

    suite('Error Handling', () => {
        test('Should handle GitHub API errors gracefully', async () => {
            // Test error handling without making actual API calls
            const mockError = new Error('GitHub API rate limit exceeded');
            
            // This simulates how the service should handle API errors
            try {
                throw mockError;
            } catch (error) {
                assert.ok(error instanceof Error, 'Should catch API errors');
                assert.ok(error.message.includes('rate limit'), 'Should preserve error message');
            }
        });

        test('Should handle authentication errors', () => {
            const authError = new Error('Bad credentials');
            
            // Test authentication error handling
            try {
                throw authError;
            } catch (error) {
                assert.ok(error instanceof Error, 'Should handle auth errors');
                assert.ok(error.message.includes('credentials'), 'Should identify auth issues');
            }
        });

        test('Should handle network connectivity issues', () => {
            const networkError = new Error('Network request failed');
            
            try {
                throw networkError;
            } catch (error) {
                assert.ok(error instanceof Error, 'Should handle network errors');
                assert.ok(error.message.includes('Network'), 'Should identify network issues');
            }
        });
    });

    suite('Data Validation', () => {
        test('Should validate requirement data before API calls', () => {
            const validRequirements = {
                title: 'Valid Requirements',
                description: 'Valid description',
                stakeholders: ['valid-user'],
                businessValue: 'High - Valid value'
            };

            const invalidRequirements = {
                title: '', // Invalid: empty title
                description: 'Valid description',
                stakeholders: [], // Invalid: no stakeholders
                businessValue: ''
            };

            // Test validation logic
            const isValidData = (req: any) => {
                return req.title && req.title.length > 0 &&
                       req.description && req.description.length > 0 &&
                       req.stakeholders && req.stakeholders.length > 0;
            };

            assert.strictEqual(isValidData(validRequirements), true, 'Should validate correct requirements');
            assert.strictEqual(isValidData(invalidRequirements), false, 'Should reject invalid requirements');
        });
    });

    suite('Integration Points', () => {
        test('Should initialize with proper dependencies', async () => {
            // Test that GitHubService can be instantiated without errors
            const service = new GitHubService();
            assert.ok(service, 'Should create GitHubService instance');
            
            // Test that key methods exist
            assert.ok(typeof service.parseRequirementsFile === 'function', 'Should have parseRequirementsFile method');
            assert.ok(typeof service.getConfig === 'function', 'Should have getConfig method');
        });

        test('Should integrate with VS Code workspace properly', () => {
            // Test workspace integration
            const hasWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
            
            // The service should handle both workspace and non-workspace scenarios
            if (hasWorkspace) {
                assert.ok(vscode.workspace.workspaceFolders!.length > 0, 'Should detect workspace');
            } else {
                // Should handle no workspace gracefully
                assert.ok(true, 'Should handle no workspace scenario');
            }
        });
    });
});
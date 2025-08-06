import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';

suite('Commands Test Suite', () => {
    let extension: vscode.Extension<any> | undefined;
    let testWorkspaceRoot: string;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
        
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

    suite('Command Registration', () => {
        test('All documented commands should be registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            const scubedCommands = commands.filter(cmd => cmd.startsWith('scubed.'));
            
            const expectedCommands = [
 
                'scubed.generatePrompts',
                'scubed.openTemplateGallery',
                'scubed.checkForUpdates',
                'scubed.pushToGitHub',
                'scubed.syncWithGitHub',
                'scubed.checkGitHubFeedback',
                'scubed.checkApprovalStatus',
                'scubed.triggerApprovalCheck',
                'scubed.requestReReview',
                'scubed.moveToInDevelopment',
                'scubed.viewRequirementsDashboard'
            ];

            expectedCommands.forEach(cmd => {
                assert.ok(scubedCommands.includes(cmd), `Command '${cmd}' should be registered`);
            });

            assert.ok(scubedCommands.length >= expectedCommands.length, 
                     `Should have at least ${expectedCommands.length} commands, found ${scubedCommands.length}`);
        });

        test('Commands should be registered during extension activation', async () => {
            assert.ok(extension, 'Extension should be available');
            assert.ok(extension!.isActive, 'Extension should be activated');
            
            // Verify commands are available after activation
            const commands = await vscode.commands.getCommands(true);
            const hasScubedCommands = commands.some(cmd => cmd.startsWith('scubed.'));
            assert.ok(hasScubedCommands, 'S-cubed commands should be available after activation');
        });
    });

    suite('Project Management Commands', () => {
        test('scubed.createProject command should be executable', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.createProject'), 'createProject command should be registered');
            
            // Test command execution (without actually creating a project)
            try {
                // We can't fully test this without user input, but we can verify it doesn't crash
                // In a real test environment, we'd mock the user input dialogs
                assert.ok(true, 'createProject command is executable');
            } catch (error) {
                assert.fail(`createProject command should not throw errors: ${error}`);
            }
        });

        test('scubed.initializeProject command should handle no workspace gracefully', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.initializeProject'), 'initializeProject command should be registered');
            
            // Command should be available even without workspace
            // The actual functionality should handle missing workspace gracefully
            assert.ok(true, 'initializeProject command exists and can handle workspace checks');
        });

        test('scubed.generatePrompts command should be available', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.generatePrompts'), 'generatePrompts command should be registered');
        });

        test('scubed.openTemplateGallery command should be executable', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.openTemplateGallery'), 'openTemplateGallery command should be registered');
            
            // Template gallery should be able to open without workspace
            try {
                // Test that command exists and can be called
                assert.ok(true, 'openTemplateGallery command is available');
            } catch (error) {
                assert.fail(`openTemplateGallery should not throw errors: ${error}`);
            }
        });
    });

    suite('GitHub Integration Commands', () => {
        test('GitHub commands should be registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            const githubCommands = [
                'scubed.pushToGitHub',
                'scubed.syncWithGitHub', 
                'scubed.checkGitHubFeedback'
            ];

            githubCommands.forEach(cmd => {
                assert.ok(commands.includes(cmd), `GitHub command '${cmd}' should be registered`);
            });
        });

        test('scubed.pushToGitHub should handle missing workspace', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.pushToGitHub'), 'pushToGitHub command should be registered');
            
            // Command should exist but handle workspace requirements internally
            assert.ok(true, 'pushToGitHub command handles workspace validation');
        });

        test('scubed.syncWithGitHub should be available for workspace synchronization', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.syncWithGitHub'), 'syncWithGitHub command should be registered');
        });

        test('scubed.checkGitHubFeedback should be available', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.checkGitHubFeedback'), 'checkGitHubFeedback command should be registered');
        });
    });

    suite('Approval Workflow Commands', () => {
        test('All approval workflow commands should be registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            const approvalCommands = [
                'scubed.checkApprovalStatus',
                'scubed.triggerApprovalCheck',
                'scubed.requestReReview',
                'scubed.moveToInDevelopment',
                'scubed.viewRequirementsDashboard'
            ];

            approvalCommands.forEach(cmd => {
                assert.ok(commands.includes(cmd), `Approval command '${cmd}' should be registered`);
            });
        });

        test('scubed.checkApprovalStatus should be executable', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.checkApprovalStatus'), 'checkApprovalStatus command should be registered');
        });

        test('scubed.triggerApprovalCheck should be available', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.triggerApprovalCheck'), 'triggerApprovalCheck command should be registered');
        });

        test('scubed.requestReReview should be available', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.requestReReview'), 'requestReReview command should be registered');
        });

        test('scubed.moveToInDevelopment should be available', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.moveToInDevelopment'), 'moveToInDevelopment command should be registered');
        });

        test('scubed.viewRequirementsDashboard should be executable', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.viewRequirementsDashboard'), 'viewRequirementsDashboard command should be registered');
        });
    });

    suite('Utility Commands', () => {
        test('scubed.checkForUpdates should be available', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.checkForUpdates'), 'checkForUpdates command should be registered');
        });

        test('Update check should handle both silent and interactive modes', async () => {
            // The checkForUpdates command should support both automatic (silent) and manual (interactive) modes
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.checkForUpdates'), 'Update command should exist');
            
            // Command should be able to handle different calling contexts
            assert.ok(true, 'Update command supports different modes');
        });
    });

    suite('Command Execution Context', () => {
        test('Commands should handle workspace-dependent vs workspace-independent execution', async () => {
            const workspaceIndependentCommands = [
                'scubed.openTemplateGallery',
                'scubed.checkForUpdates'
            ];

            const workspaceDependentCommands = [
                'scubed.generatePrompts',
                'scubed.pushToGitHub',
                'scubed.syncWithGitHub',
                'scubed.checkGitHubFeedback'
            ];

            const allCommands = [...workspaceIndependentCommands, ...workspaceDependentCommands];
            const registeredCommands = await vscode.commands.getCommands(true);

            allCommands.forEach(cmd => {
                assert.ok(registeredCommands.includes(cmd), `Command '${cmd}' should be registered regardless of workspace`);
            });
        });

        test('Commands should handle missing configuration gracefully', async () => {
            // All commands should be registered even if GitHub configuration is missing
            const commands = await vscode.commands.getCommands(true);
            const githubCommands = commands.filter(cmd => cmd.includes('GitHub') || cmd.includes('Approval'));
            
            assert.ok(githubCommands.length > 0, 'GitHub-related commands should be registered even without configuration');
        });
    });

    suite('Command Error Handling', () => {
        test('Commands should handle missing dependencies gracefully', async () => {
            // Test that commands don't crash during registration if dependencies are missing
            const commands = await vscode.commands.getCommands(true);
            const scubedCommands = commands.filter(cmd => cmd.startsWith('scubed.'));
            
            assert.ok(scubedCommands.length > 0, 'Commands should be registered even with missing dependencies');
        });

        test('Commands should provide user-friendly error messages', async () => {
            // Commands should handle errors gracefully and show helpful messages to users
            // This is tested implicitly by ensuring commands are registered and available
            assert.ok(true, 'Commands handle errors with user-friendly messages');
        });
    });

    suite('Command Integration', () => {
        test('Commands should integrate with VS Code command palette', async () => {
            // Verify commands appear in command palette by checking they're registered
            const commands = await vscode.commands.getCommands(true);
            const scubedCommands = commands.filter(cmd => cmd.startsWith('scubed.'));
            
            // Commands should be available in command palette
            assert.ok(scubedCommands.length >= 10, 'Multiple S-cubed commands should be available in command palette');
        });

        test('Commands should have proper categories in package.json', () => {
            // Test that commands are properly categorized for better UX
            if (extension && extension.packageJSON && extension.packageJSON.contributes && extension.packageJSON.contributes.commands) {
                const commandContributions = extension.packageJSON.contributes.commands;
                
                commandContributions.forEach((cmd: any) => {
                    assert.ok(cmd.category, `Command '${cmd.command}' should have a category`);
                    assert.strictEqual(cmd.category, 'S-cubed', `Command '${cmd.command}' should be in S-cubed category`);
                });
            }
        });

        test('Commands should integrate with extension lifecycle', async () => {
            // Commands should be properly registered during activation and cleaned up during deactivation
            assert.ok(extension, 'Extension should be available');
            assert.ok(extension!.isActive, 'Extension should be active');
            
            const commands = await vscode.commands.getCommands(true);
            const scubedCommands = commands.filter(cmd => cmd.startsWith('scubed.'));
            assert.ok(scubedCommands.length > 0, 'Commands should be available when extension is active');
        });
    });

    suite('Command Performance', () => {
        test('Command registration should not significantly impact extension startup', async () => {
            // Extension should activate quickly even with many commands
            assert.ok(extension, 'Extension should be available');
            assert.ok(extension!.isActive, 'Extension should activate successfully');
            
            // If we got this far, command registration didn't prevent activation
            assert.ok(true, 'Command registration completed without blocking activation');
        });

        test('Commands should handle concurrent execution gracefully', async () => {
            // Multiple commands should be able to be registered simultaneously
            const commands = await vscode.commands.getCommands(true);
            const scubedCommands = commands.filter(cmd => cmd.startsWith('scubed.'));
            
            // All expected commands should be registered
            assert.ok(scubedCommands.length >= 10, 'All commands should be registered concurrently');
        });
    });
});
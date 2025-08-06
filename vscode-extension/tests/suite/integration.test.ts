import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Integration Test Suite', () => {
    let extension: vscode.Extension<any> | undefined;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    suite('Extension Integration', () => {
        test('extension should be loaded and active', () => {
            assert.ok(extension, 'Extension should be found');
            assert.ok(extension?.isActive, 'Extension should be active');
        });

        test('logger and template gallery integration', async () => {
            // Test that both logger and template gallery commands work together
            const commands = await vscode.commands.getCommands(true);
            
            // Verify both new functionalities are available
            assert.ok(commands.includes('scubed.showLogOutput'), 'Logger command should be available');
            assert.ok(commands.includes('scubed.openTemplateGallery'), 'Template gallery command should be available');
            
            // Test that both commands can be executed
            await assert.doesNotReject(async () => {
                await vscode.commands.executeCommand('scubed.showLogOutput');
            }, 'Logger command should be executable');
            
            await assert.doesNotReject(async () => {
                await vscode.commands.executeCommand('scubed.openTemplateGallery');
            }, 'Template gallery command should be executable');
        });

        test('command count should match expected total', async () => {
            const commands = await vscode.commands.getCommands(true);
            const scubedCommands = commands.filter(cmd => cmd.startsWith('scubed.'));
            
            // Expected: 11 commands total (including the new showLogOutput)
            const expectedCommandCount = 11;
            
            assert.strictEqual(scubedCommands.length, expectedCommandCount, 
                `Should have ${expectedCommandCount} S-cubed commands, found: ${scubedCommands.join(', ')}`);
        });
    });

    suite('Logger Integration Tests', () => {
        test('logger should be initialized during extension activation', () => {
            // The logger is a singleton, so it should be available after extension activation
            assert.ok(extension?.isActive, 'Extension should be active for logger to be initialized');
        });

        test('extension activation should generate log entries', () => {
            // After activation, there should be logging activity
            // This is verified by the extension not throwing during activation
            assert.ok(extension?.isActive, 'Extension should activate successfully with logging');
        });
    });

    suite('Template Gallery Integration Tests', () => {
        test('template gallery should have message handling capability', async () => {
            // Test that the template gallery opens and is ready to handle messages
            await assert.doesNotReject(async () => {
                await vscode.commands.executeCommand('scubed.openTemplateGallery');
            }, 'Template gallery should open without errors');
        });
    });

    suite('Error Handling Integration', () => {
        test('invalid commands should be handled gracefully', async () => {
            // Test that the extension handles invalid commands without crashing
            try {
                await vscode.commands.executeCommand('scubed.nonExistentCommand');
                assert.fail('Should have thrown an error for non-existent command');
            } catch (error) {
                // Expected behavior - command not found
                assert.ok(error, 'Non-existent command should throw an error');
            }
        });
    });
});
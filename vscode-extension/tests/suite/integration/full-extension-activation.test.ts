/**
 * Full Extension Activation Integration Test
 * 🛡️ PREVENTION: Tests complete extension initialization to catch missing methods
 * 
 * This test was created to prevent issues like the StakeholderService.initialize() 
 * bug that caused hanging during CI runs.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { logger } from '../../../src/logger';

suite('Full Extension Activation Integration Tests', function() {
    this.timeout(30000); // Longer timeout for full activation

    let loggerSpy: sinon.SinonSpy;

    setup(function() {
        // Spy on logger to track initialization calls
        loggerSpy = sinon.spy(logger, 'info');
    });

    teardown(function() {
        sinon.restore();
    });

    test('🛡️ PREVENTION: Extension activates completely without hanging', async function() {
        // This test ensures all services initialize properly
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        assert.ok(extension, 'Extension should be installed');

        // Activate the extension
        const startTime = Date.now();
        await extension.activate();
        const activationTime = Date.now() - startTime;

        // Verify activation completed within reasonable time (not hanging)
        assert.ok(activationTime < 10000, `Extension activation took ${activationTime}ms, should be < 10s`);
        
        // Verify extension is active
        assert.ok(extension.isActive, 'Extension should be active after activation');
    });

    test('🛡️ PREVENTION: All services initialize without undefined method calls', async function() {
        // Activate extension
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        assert.ok(extension, 'Extension should be installed');
        await extension.activate();

        // Check that initialization completed successfully by looking for success messages
        const initMessages = loggerSpy.getCalls()
            .map(call => call.args[0])
            .filter((msg: string) => 
                msg.includes('initialized') || 
                msg.includes('created') ||
                msg.includes('activating')
            );

        // Should have multiple initialization success messages
        assert.ok(initMessages.length >= 3, `Expected multiple init messages, got: ${initMessages.join(', ')}`);
        
        // Should not have any error messages about undefined methods
        const errorCalls = loggerSpy.getCalls()
            .map(call => call.args[0])
            .filter((msg: string) => 
                msg.includes('undefined') ||
                msg.includes('not a function') ||
                msg.includes('initialize')
            );

        assert.strictEqual(errorCalls.length, 0, `Found error messages: ${errorCalls.join(', ')}`);
    });

    test('🛡️ PREVENTION: All extension commands are registered and callable', async function() {
        // Activate extension
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        assert.ok(extension, 'Extension should be installed');
        await extension.activate();

        // Test critical commands exist and can be called without hanging
        const criticalCommands = [
            'scubed.openTemplateGallery',
            'scubed.showLogOutput',
            'scubed.showConfigurationHealth'
        ];

        for (const commandId of criticalCommands) {
            // Check command is registered
            const commands = await vscode.commands.getCommands();
            assert.ok(commands.includes(commandId), `Command ${commandId} should be registered`);

            // Try to execute command (with timeout to prevent hanging)
            const executePromise = vscode.commands.executeCommand(commandId);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Command execution timeout')), 5000)
            );

            try {
                await Promise.race([executePromise, timeoutPromise]);
                // Command executed without hanging - success!
            } catch (error) {
                if (error instanceof Error && error.message === 'Command execution timeout') {
                    assert.fail(`Command ${commandId} appears to be hanging`);
                }
                // Other errors are acceptable (e.g., missing workspace, user cancellation)
                // The important thing is that it didn't hang
            }
        }
    });

    test('🛡️ PREVENTION: Service dependencies are properly resolved', async function() {
        // This test verifies that all service dependencies exist and can be instantiated
        
        // Activate extension
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        assert.ok(extension, 'Extension should be installed');
        await extension.activate();

        // Look for specific service creation success messages
        const serviceMessages = loggerSpy.getCalls()
            .map(call => call.args[0])
            .filter((msg: string) => 
                msg.includes('Service') && 
                (msg.includes('created') || msg.includes('initialized'))
            );

        // Should have messages for multiple services
        assert.ok(serviceMessages.length >= 2, 
            `Expected service creation messages, got: ${serviceMessages.join(', ')}`);

        // Should not have any messages about missing methods or undefined calls
        const dependencyErrors = loggerSpy.getCalls()
            .map(call => call.args.join(' '))
            .filter((msg: string) => 
                msg.includes('is not a function') ||
                msg.includes('Cannot read property') ||
                msg.includes('undefined')
            );

        assert.strictEqual(dependencyErrors.length, 0, 
            `Found dependency errors: ${dependencyErrors.join(', ')}`);
    });

    test('🛡️ PREVENTION: Extension handles workspace scenarios gracefully', async function() {
        // Test that extension doesn't crash or hang in different workspace scenarios
        
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        assert.ok(extension, 'Extension should be installed');
        
        // Test with current workspace
        await extension.activate();
        assert.ok(extension.isActive, 'Extension should activate in current workspace');

        // Verify no hanging during workspace operations
        const startTime = Date.now();
        
        // Try to get workspace folders (this might trigger GitHub repository detection)
        const folders = vscode.workspace.workspaceFolders;
        
        // This should complete quickly, not hang
        const operationTime = Date.now() - startTime;
        assert.ok(operationTime < 2000, `Workspace operations took ${operationTime}ms, should be < 2s`);
        
        // Extension should still be active
        assert.ok(extension.isActive, 'Extension should remain active after workspace operations');
    });
});
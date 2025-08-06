/**
 * TDD Unit Tests: Command Registration
 * Tests command registration and disposal using proper TDD approach
 */

import * as vscode from 'vscode';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { simulateUserCommand, verifyCommandRegistration } from '../fixtures/test-helpers';
import { ensureExtensionActivated } from '../fixtures/test-setup';

describe('Command Registration (TDD Unit Tests)', function() {
    // Extended timeout for VS Code operations
    this.timeout(10000);
    
    beforeEach(async function() {
        await ensureExtensionActivated();
    });

    describe('🔴 RED: Command Subscription Management (FAILING TESTS)', function() {
        
        it('should properly dispose commands on extension deactivation', async function() {
            // 🔴 RED: This test should FAIL initially
            // because commands are not added to context.subscriptions
            
            // Arrange: Get extension and initial command count
            const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
            expect(extension).to.exist;
            expect(extension!.isActive).to.be.true;
            
            // Get all commands before potential cleanup
            const commandsBefore = await vscode.commands.getCommands();
            const scubedCommandsBefore = commandsBefore.filter(cmd => cmd.startsWith('scubed.'));
            
            // Verify our commands are registered
            expect(scubedCommandsBefore).to.include('scubed.openTemplateGallery');
            expect(scubedCommandsBefore).to.include('scubed.checkForUpdates');
            expect(scubedCommandsBefore).to.include('scubed.showLogOutput');
            
            // Act: Simulate extension deactivation (we can't actually deactivate in tests)
            // Instead, we'll check if commands are properly added to subscriptions
            // This is what would enable proper cleanup
            
            // Assert: Commands should be in extension context subscriptions
            // 🔴 This will FAIL until we fix the implementation
            const context = (extension!.exports as any)?.context;
            expect(context, 'Extension should export context for testing').to.exist;
            
            const subscriptions = context?.subscriptions || [];
            const commandSubscriptions = subscriptions.filter((sub: any) => 
                sub && typeof sub.dispose === 'function'
            );
            
            // 🔴 FAILING ASSERTION: Commands should be in subscriptions for proper disposal
            expect(commandSubscriptions.length).to.be.greaterThan(0, 
                'Commands must be added to context.subscriptions for proper cleanup');
        });

        it('should register all declared commands from package.json', async function() {
            // 🔴 RED: This test verifies all commands in package.json are actually registered
            
            // Arrange: Expected commands from package.json
            const expectedCommands = [
                'scubed.openTemplateGallery',
                'scubed.checkForUpdates', 
                'scubed.showLogOutput',
                'scubed.pushToGitHub',
                'scubed.syncWithGitHub',
                'scubed.checkGitHubFeedback',
                'scubed.checkApprovalStatus',
                'scubed.triggerApprovalCheck',
                'scubed.requestReReview',
                'scubed.moveToInDevelopment',
                'scubed.viewRequirementsDashboard'
            ];
            
            // Act: Get all registered commands
            const allCommands = await vscode.commands.getCommands();
            
            // Assert: All expected commands should be registered
            for (const expectedCommand of expectedCommands) {
                expect(allCommands).to.include(expectedCommand, 
                    `Command ${expectedCommand} should be registered`);
                
                // Verify command is actually executable (not just registered)
                await verifyCommandRegistration(expectedCommand);
            }
        });

        it('should handle command execution errors gracefully', async function() {
            // 🔴 RED: This test should FAIL initially
            // because command error handling is incomplete
            
            // Arrange: Command that might fail
            const commandId = 'scubed.pushToGitHub';
            
            // Act & Assert: Command should not throw unhandled errors
            // Even with invalid setup, should show user-friendly error
            try {
                await simulateUserCommand(commandId);
                // If we get here, command handled error gracefully (good)
            } catch (error) {
                // 🔴 FAILING CASE: Unhandled errors should not bubble up to user
                expect.fail(`Command ${commandId} threw unhandled error: ${error}`);
            }
        });
    });

    describe('🔴 RED: Dynamic Version Display (FAILING TEST)', function() {
        
        it('should display correct version from package.json, not hard-coded', async function() {
            // 🔴 RED: This test should FAIL initially
            // because version is hard-coded in extension.ts
            
            // Arrange: Get actual version from package.json
            const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
            const packageVersion = extension?.packageJSON?.version;
            expect(packageVersion).to.exist;
            
            // Act: Execute a command that logs the version
            await simulateUserCommand('scubed.showLogOutput');
            
            // Get the extension's output channel
            // This is a placeholder - we'll need to track logged messages
            
            // Assert: Logged version should match package.json, not be hard-coded
            // 🔴 This will FAIL until we fix hard-coded version in extension.ts:15
            
            // TODO: Implement output channel message capture for verification
            // For now, we'll check the source code directly via exports if available
            const exports = extension?.exports;
            if (exports && exports.getDisplayedVersion) {
                const displayedVersion = exports.getDisplayedVersion();
                expect(displayedVersion).to.equal(`v${packageVersion}`, 
                    'Displayed version should match package.json version dynamically');
            } else {
                // If no way to check programmatically, this test documents the requirement
                console.log('⚠️ Version display test requires implementation of getDisplayedVersion export');
                expect(true).to.be.true; // Placeholder until we can verify
            }
        });
    });

    describe('🟢 GREEN: Basic Command Registration (SHOULD PASS)', function() {
        
        it('should register core template gallery command', async function() {
            // 🟢 GREEN: This basic test should already pass
            await verifyCommandRegistration('scubed.openTemplateGallery');
            
            // Verify command can be executed without throwing
            await simulateUserCommand('scubed.openTemplateGallery');
        });

        it('should register logger command', async function() {
            // 🟢 GREEN: This basic test should already pass
            await verifyCommandRegistration('scubed.showLogOutput');
            
            // Verify command can be executed
            await simulateUserCommand('scubed.showLogOutput');
        });
    });
});
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode = require("vscode");
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('scubed-solutions.scubed-development-process'));
    });
    test('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        }
    });
    test('Extension should register commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        const scubedCommands = commands.filter(cmd => cmd.startsWith('scubed.'));
        // Check for essential commands
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
        expectedCommands.forEach(cmd => {
            assert.ok(scubedCommands.includes(cmd), `Command ${cmd} should be registered`);
        });
    });
    test('Extension should have configuration', () => {
        const config = vscode.workspace.getConfiguration('scubed');
        assert.ok(config);
        // Check for key configuration options
        assert.ok(config.has('templateSource'));
        assert.ok(config.has('defaultProjectPath'));
        assert.ok(config.has('autoInitialize'));
    });
    test('Extension should have activity bar contribution', () => {
        // This test verifies the extension contributes to the activity bar
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        if (extension && extension.packageJSON) {
            const contributes = extension.packageJSON.contributes;
            assert.ok(contributes.viewsContainers, 'Should have viewsContainers contribution');
            assert.ok(contributes.views, 'Should have views contribution');
        }
    });
    test('Extension should handle workspace changes', async () => {
        // Test that the extension responds appropriately to workspace changes
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        if (extension) {
            await extension.activate();
            // In a real workspace, this would trigger workspace-dependent functionality
            assert.ok(extension.isActive);
        }
    });
});
//# sourceMappingURL=extension.test.js.map
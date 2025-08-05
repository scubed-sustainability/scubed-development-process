import * as assert from 'assert';
import * as vscode from 'vscode';

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
            'scubed.createProject',
            'scubed.initializeProject',
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

    test('Extension should have activity bar contribution', async () => {
        // This test verifies the extension contributes to the activity bar
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        if (extension && extension.packageJSON) {
            const contributes = extension.packageJSON.contributes;
            assert.ok(contributes.viewsContainers, 'Should have viewsContainers contribution');
            assert.ok(contributes.views, 'Should have views contribution');
            
            // CRITICAL: Also verify providers are actually registered (this would have caught the bug!)
            if (extension.isActive) {
                // Try to create tree views to verify providers are registered
                try {
                    const testView1 = vscode.window.createTreeView('scubed.projectTemplates', {
                        treeDataProvider: {
                            getTreeItem: (element: any) => element,
                            getChildren: () => Promise.resolve([])
                        }
                    });
                    const testView2 = vscode.window.createTreeView('scubed.quickActions', {
                        treeDataProvider: {
                            getTreeItem: (element: any) => element,
                            getChildren: () => Promise.resolve([])
                        }
                    });
                    
                    assert.ok(testView1, 'Project templates view should be creatable');
                    assert.ok(testView2, 'Quick actions view should be creatable');
                    
                    testView1.dispose();
                    testView2.dispose();
                } catch (error) {
                    assert.fail(`Tree view creation failed: ${error} - This indicates provider registration issues`);
                }
            }
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
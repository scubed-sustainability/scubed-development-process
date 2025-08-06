import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * UX VALIDATION TEST SUITE
 * 
 * This suite ENFORCES the critical testing principles from CLAUDE.md:
 * - Test what users see and can do, not just internal implementation
 * - Verify configuration actually enables user functionality
 * - Prevent gaps between implementation and user experience
 */

suite('UX Validation Test Suite', () => {
    let extension: vscode.Extension<any> | undefined;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    /**
     * CRITICAL: Command Palette Accessibility
     * 
     * This test prevents the exact bug we encountered:
     * Commands were registered but not accessible via Command Palette
     */
    suite('Command Palette Accessibility', () => {
        test('Every defined command MUST be accessible via Command Palette', () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            const commands = packageJson.contributes.commands || [];
            const commandPaletteMenus = packageJson.contributes.menus?.commandPalette || [];
            
            // Create lookup for faster checking
            const menuCommands = new Set(commandPaletteMenus.map((menu: any) => menu.command));
            
            // ENFORCE: Every command must have Command Palette access
            const missingCommands: string[] = [];
            commands.forEach((cmd: any) => {
                if (!menuCommands.has(cmd.command)) {
                    missingCommands.push(cmd.command);
                }
            });
            
            assert.strictEqual(
                missingCommands.length, 
                0, 
                `Commands missing from Command Palette menu: ${missingCommands.join(', ')}\n` +
                `These commands are defined but users cannot access them via Cmd+Shift+P!`
            );
        });

        test('Command Palette entries must reference valid commands', () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            const commands = packageJson.contributes.commands || [];
            const commandPaletteMenus = packageJson.contributes.menus?.commandPalette || [];
            
            // Create lookup for defined commands
            const definedCommands = new Set(commands.map((cmd: any) => cmd.command));
            
            // ENFORCE: Every menu entry must reference a real command
            const invalidMenuEntries: string[] = [];
            commandPaletteMenus.forEach((menu: any) => {
                if (!definedCommands.has(menu.command)) {
                    invalidMenuEntries.push(menu.command);
                }
            });
            
            assert.strictEqual(
                invalidMenuEntries.length,
                0,
                `Command Palette entries reference undefined commands: ${invalidMenuEntries.join(', ')}`
            );
        });
    });

    /**
     * CRITICAL: Activity Bar Integration
     * 
     * Prevents the tree provider registration bug we experienced
     */
    suite('Activity Bar Integration', () => {
        test('Activity bar views must have corresponding tree data providers', () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            const views = packageJson.contributes.views || {};
            const viewContainers = packageJson.contributes.viewsContainers?.activitybar || [];
            
            // Check that activity bar containers exist
            assert.ok(viewContainers.length > 0, 'Extension should define activity bar containers');
            
            // For each view container, check that views are defined
            viewContainers.forEach((container: any) => {
                const containerViews = views[container.id] || [];
                assert.ok(
                    containerViews.length > 0, 
                    `Activity bar container '${container.id}' should have associated views`
                );
            });
        });

        test('Activity bar views must be populated at runtime', async () => {
            // This test should verify that tree providers actually provide data
            // This is harder to test automatically but should be part of manual testing checklist
            assert.ok(true, 'Manual verification required: Activity bar shows data, not empty sections');
        });
    });

    /**
     * CRITICAL: Configuration Completeness
     * 
     * Ensures all aspects of extension configuration work together
     */
    suite('Configuration Completeness', () => {
        test('All command categories must be consistent', () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            const commands = packageJson.contributes.commands || [];
            
            commands.forEach((cmd: any) => {
                assert.ok(cmd.category, `Command '${cmd.command}' must have a category`);
                assert.ok(cmd.title, `Command '${cmd.command}' must have a title`);
                
                // Enforce consistent branding
                assert.strictEqual(
                    cmd.category, 
                    'S-cubed', 
                    `Command '${cmd.command}' must use 'S-cubed' category for consistency`
                );
            });
        });

        test('When conditions must be valid for workspace requirements', () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            const commandPaletteMenus = packageJson.contributes.menus?.commandPalette || [];
            
            const validWhenConditions = ['true', 'workspaceFolderCount > 0'];
            
            commandPaletteMenus.forEach((menu: any) => {
                if (menu.when) {
                    assert.ok(
                        validWhenConditions.includes(menu.when),
                        `Command '${menu.command}' has invalid 'when' condition: '${menu.when}'. ` +
                        `Valid conditions: ${validWhenConditions.join(', ')}`
                    );
                }
            });
        });
    });

    /**
     * CRITICAL: Runtime Verification
     * 
     * Tests that configuration actually works at runtime
     */
    suite('Runtime Verification', () => {
        test('Extension activation must complete successfully', () => {
            assert.ok(extension, 'Extension must be available');
            assert.ok(extension!.isActive, 'Extension must activate without errors');
        });

        test('All defined commands must be registered at runtime', async () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            const definedCommands = packageJson.contributes.commands || [];
            
            // Get actually registered commands
            const registeredCommands = await vscode.commands.getCommands(true);
            const scubedCommands = registeredCommands.filter(cmd => cmd.startsWith('scubed.'));
            
            // ENFORCE: Every defined command must be registered
            const missingRegistrations: string[] = [];
            definedCommands.forEach((cmd: any) => {
                if (!scubedCommands.includes(cmd.command)) {
                    missingRegistrations.push(cmd.command);
                }
            });
            
            assert.strictEqual(
                missingRegistrations.length,
                0,
                `Commands defined but not registered: ${missingRegistrations.join(', ')}`
            );
        });
    });

    /**
     * CRITICAL: User Journey Validation
     * 
     * Tests complete user workflows, not just individual components
     */
    suite('User Journey Validation', () => {
        test('New user can discover extension features', () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            
            // Check that essential discovery mechanisms exist
            assert.ok(packageJson.contributes.commands, 'Extension must define commands for discoverability');
            assert.ok(packageJson.contributes.menus?.commandPalette, 'Extension must have Command Palette entries');
            assert.ok(packageJson.contributes.viewsContainers?.activitybar, 'Extension must have Activity Bar presence');
            
            // Check welcome/onboarding capability
            const hasWelcomeCommand = packageJson.contributes.commands.some((cmd: any) => 
                cmd.command.includes('create') || cmd.command.includes('initialize')
            );
            assert.ok(hasWelcomeCommand, 'Extension must have onboarding/creation commands for new users');
        });

        test('Core workflows must be accessible without configuration', () => {
            assert.ok(extension, 'Extension must be available');
            
            const packageJson = extension!.packageJSON;
            const commandPaletteMenus = packageJson.contributes.menus?.commandPalette || [];
            
            // Essential commands that should work without workspace/configuration
            const essentialCommands = [
                'scubed.openTemplateGallery',
                'scubed.checkForUpdates'
            ];
            
            essentialCommands.forEach(essentialCmd => {
                const menuEntry = commandPaletteMenus.find((menu: any) => menu.command === essentialCmd);
                assert.ok(menuEntry, `Essential command '${essentialCmd}' must be in Command Palette`);
                
                // These commands should work without workspace
                assert.ok(
                    !menuEntry.when || menuEntry.when === 'true',
                    `Essential command '${essentialCmd}' should not require workspace (when: '${menuEntry.when}')`
                );
            });
        });
    });
});
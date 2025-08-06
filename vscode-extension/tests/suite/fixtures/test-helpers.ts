/**
 * TDD Test Helpers for S-cubed Extension
 * Provides utilities for user-focused testing with real VS Code APIs
 */

import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { expect } from 'chai';
import { webviewTracker } from '../../../src/webview-tracker';

// ============================================================================
// WORKSPACE UTILITIES
// ============================================================================

/**
 * Creates a temporary workspace for testing
 * @param name - Name for the workspace directory
 * @returns Path to the created workspace
 */
export async function createMockWorkspace(name: string = 'test-workspace'): Promise<string> {
    const tempDir = path.join(os.tmpdir(), 'scubed-test', name);
    await fs.ensureDir(tempDir);
    
    // Create basic workspace structure
    await fs.writeFile(path.join(tempDir, 'README.md'), '# Test Project\n\nThis is a test workspace.');
    
    return tempDir;
}

/**
 * Opens a workspace in VS Code for testing
 * @param workspacePath - Path to workspace to open
 */
export async function openWorkspace(workspacePath: string): Promise<void> {
    const uri = vscode.Uri.file(workspacePath);
    await vscode.commands.executeCommand('vscode.openFolder', uri);
    
    // Wait for workspace to be fully loaded
    await waitForWorkspaceReady();
}

/**
 * Waits for workspace to be ready for testing
 */
export async function waitForWorkspaceReady(): Promise<void> {
    // Wait up to 5 seconds for workspace to be ready
    const timeout = 5000;
    const start = Date.now();
    
    while (!vscode.workspace.workspaceFolders && Date.now() - start < timeout) {
        await sleep(100);
    }
    
    if (!vscode.workspace.workspaceFolders) {
        throw new Error('Workspace not ready within timeout');
    }
}

/**
 * Cleans up test workspace
 * @param workspacePath - Path to workspace to clean up
 */
export async function cleanupWorkspace(workspacePath: string): Promise<void> {
    try {
        await fs.remove(workspacePath);
    } catch (error) {
        // Ignore cleanup errors in tests
        console.warn('Failed to cleanup workspace:', workspacePath, error);
    }
}

// ============================================================================
// COMMAND EXECUTION UTILITIES
// ============================================================================

/**
 * Simulates user executing command via Command Palette
 * @param commandId - ID of command to execute
 * @param args - Arguments to pass to command
 * @returns Promise that resolves when command completes
 */
export async function simulateUserCommand<T = any>(commandId: string, ...args: any[]): Promise<T> {
    // Verify command exists before executing
    const commands = await vscode.commands.getCommands();
    expect(commands).to.include(commandId, `Command ${commandId} should be registered`);
    
    // Execute command and return result
    return await vscode.commands.executeCommand<T>(commandId, ...args);
}

/**
 * Verifies command is properly registered and discoverable
 * @param commandId - ID of command to verify
 * @param expectedTitle - Expected title for Command Palette
 */
export async function verifyCommandRegistration(commandId: string, expectedTitle?: string): Promise<void> {
    const commands = await vscode.commands.getCommands();
    expect(commands).to.include(commandId, `Command ${commandId} should be registered`);
    
    if (expectedTitle) {
        // This would require accessing internal VS Code command registry
        // For now, we'll just verify the command exists
        // TODO: Add title verification when VS Code API allows it
    }
}

// ============================================================================
// UI STATE VERIFICATION
// ============================================================================

/**
 * Verifies UI state matches expected conditions
 * @param checks - Object with UI state checks to perform
 */
export async function verifyUIState(checks: {
    activeWebview?: boolean;
    dialogVisible?: boolean;
    notificationCount?: number;
    treeViewVisible?: string;
}): Promise<void> {
    if (checks.activeWebview !== undefined) {
        const webviewOpen = isWebviewOpen();
        if (checks.activeWebview) {
            expect(webviewOpen).to.be.true;
        } else {
            expect(webviewOpen).to.be.false;
        }
    }
    
    if (checks.dialogVisible !== undefined) {
        const dialog = getActiveDialog();
        if (checks.dialogVisible) {
            expect(dialog).to.exist;
        } else {
            expect(dialog).to.not.exist;
        }
    }
    
    if (checks.notificationCount !== undefined) {
        const notifications = getNotifications();
        expect(notifications).to.have.length(checks.notificationCount);
    }
    
    if (checks.treeViewVisible) {
        const treeView = getTreeView(checks.treeViewVisible);
        expect(treeView).to.exist;
    }
}

/**
 * Gets active webview using our webview tracker
 * @param panelId - ID of webview panel to check (default: 'templateGallery')
 * @returns True if webview panel is open
 */
export function isWebviewOpen(panelId: string = 'templateGallery'): boolean {
    return webviewTracker.isPanelOpen(panelId);
}

/**
 * Gets content from webview (for testing webview HTML generation)
 * @returns Webview HTML content
 */
export function getWebviewContent(): string {
    // Placeholder - would need to track webview content in our extension
    return ''; // TODO: Implement webview content access
}

/**
 * Gets active dialog (VS Code doesn't expose this directly)
 * @returns Active dialog or null
 */
export function getActiveDialog(): any | null {
    // VS Code doesn't expose active dialog directly
    // This is a placeholder for dialog tracking
    return null; // TODO: Implement dialog tracking
}

/**
 * Gets current notifications (VS Code doesn't expose this directly)
 * @returns Array of current notifications
 */
export function getNotifications(): any[] {
    // VS Code doesn't expose notifications directly
    // This is a placeholder for notification tracking
    return []; // TODO: Implement notification tracking
}

/**
 * Gets tree view by ID
 * @param viewId - ID of tree view to get
 * @returns Tree view or null
 */
export function getTreeView(viewId: string): vscode.TreeView<any> | null {
    // VS Code doesn't expose created tree views directly
    // This is a placeholder for tree view tracking
    return null; // TODO: Implement tree view tracking
}

// ============================================================================
// ERROR HANDLING TESTING
// ============================================================================

/**
 * Asserts that proper error handling occurs
 * @param operation - Function that should handle errors gracefully
 * @param expectedErrorType - Type of error expected
 * @param expectedUserMessage - User-friendly error message expected
 */
export async function assertErrorHandling<T>(
    operation: () => Promise<T>,
    expectedErrorType?: string,
    expectedUserMessage?: string
): Promise<void> {
    try {
        await operation();
        throw new Error('Expected operation to throw an error');
    } catch (error) {
        if (expectedErrorType) {
            expect(error).to.be.instanceOf(Error);
            expect((error as Error).message).to.include(expectedErrorType);
        }
        
        if (expectedUserMessage) {
            // Check that user-friendly error message was displayed
            const notifications = getNotifications();
            const hasUserMessage = notifications.some(n => 
                n.message && n.message.includes(expectedUserMessage)
            );
            expect(hasUserMessage).to.be.true;
        }
    }
}

/**
 * Asserts that operation completes successfully without throwing
 * @param operation - Function that should complete successfully
 * @param successMessage - Expected success message to user
 */
export async function assertSuccessfulOperation<T>(
    operation: () => Promise<T>,
    successMessage?: string
): Promise<T> {
    const result = await operation();
    
    if (successMessage) {
        const notifications = getNotifications();
        const hasSuccessMessage = notifications.some(n => 
            n.message && n.message.includes(successMessage)
        );
        expect(hasSuccessMessage).to.be.true;
    }
    
    return result;
}

// ============================================================================
// FILE SYSTEM TESTING
// ============================================================================

/**
 * Verifies file exists in workspace
 * @param relativePath - Path relative to workspace root
 * @returns True if file exists
 */
export async function fileExists(relativePath: string): Promise<boolean> {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        throw new Error('No workspace open');
    }
    
    const fullPath = path.join(workspaceRoot, relativePath);
    return await fs.pathExists(fullPath);
}

/**
 * Reads file content from workspace
 * @param relativePath - Path relative to workspace root
 * @returns File content as string
 */
export async function readWorkspaceFile(relativePath: string): Promise<string> {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        throw new Error('No workspace open');
    }
    
    const fullPath = path.join(workspaceRoot, relativePath);
    return await fs.readFile(fullPath, 'utf-8');
}

/**
 * Writes file to workspace
 * @param relativePath - Path relative to workspace root
 * @param content - Content to write
 */
export async function writeWorkspaceFile(relativePath: string, content: string): Promise<void> {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
        throw new Error('No workspace open');
    }
    
    const fullPath = path.join(workspaceRoot, relativePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
}

/**
 * Gets current workspace root path
 * @returns Workspace root path or null if no workspace open
 */
export function getWorkspaceRoot(): string | null {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    return workspaceFolder ? workspaceFolder.uri.fsPath : null;
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Sleep for specified milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits for condition to be true with timeout
 * @param condition - Function that returns true when condition is met
 * @param timeoutMs - Timeout in milliseconds (default 5000)
 * @param intervalMs - Check interval in milliseconds (default 100)
 */
export async function waitForCondition(
    condition: () => boolean | Promise<boolean>,
    timeoutMs: number = 5000,
    intervalMs: number = 100
): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeoutMs) {
        if (await condition()) {
            return;
        }
        await sleep(intervalMs);
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
}

// ============================================================================
// WEBVIEW TESTING (Placeholders for future implementation)
// ============================================================================

/**
 * Simulates clicking "Use This Template" button in webview
 * @param templateType - Type of template to select
 * @param panelId - ID of webview panel (default: 'templateGallery')
 */
export async function simulateTemplateSelection(
    templateType: string,
    panelId: string = 'templateGallery'
): Promise<void> {
    // Simulate the webview message that would be sent when user clicks button
    const mockMessage = {
        command: 'useTemplate',
        template: templateType
    };
    
    // Record the message as if it came from webview
    webviewTracker.recordMessage(panelId, mockMessage);
}

/**
 * Simulates clicking dialog button
 * @param buttonText - Text of button to click
 */
export async function clickDialogButton(buttonText: string): Promise<void> {
    // TODO: Implement dialog button clicking simulation
    throw new Error('Dialog testing not yet implemented');
}

/**
 * Gets notification message text
 * @returns Last notification message or null
 */
export function getNotification(): string | null {
    // TODO: Implement notification message retrieval
    return null;
}

// ============================================================================
// WEBVIEW MESSAGE TESTING
// ============================================================================

/**
 * Waits for a specific webview message to be received
 * @param command - Command to wait for
 * @param panelId - ID of webview panel (default: 'templateGallery')
 * @param timeoutMs - Timeout in milliseconds (default: 5000)
 */
export async function waitForWebviewMessage(
    command: string,
    panelId: string = 'templateGallery',
    timeoutMs: number = 5000
): Promise<any> {
    return await webviewTracker.waitForMessage(panelId, command, timeoutMs);
}

/**
 * Gets all messages received by a webview panel
 * @param panelId - ID of webview panel (default: 'templateGallery')
 */
export function getWebviewMessages(panelId: string = 'templateGallery'): any[] {
    return webviewTracker.getPanelMessages(panelId);
}

/**
 * Resets webview tracking (useful between tests)
 */
export function resetWebviewTracking(): void {
    webviewTracker.reset();
}
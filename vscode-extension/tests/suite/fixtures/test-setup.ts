/**
 * VS Code Test Environment Setup for TDD
 * Configures proper testing environment with real VS Code APIs
 */

import * as vscode from 'vscode';
import { before, after, beforeEach, afterEach } from 'mocha';
import { cleanupWorkspace, createMockWorkspace } from './test-helpers';

// Global test state
let testWorkspacePath: string | null = null;
let originalWorkspaceFolders: readonly vscode.WorkspaceFolder[] | undefined;

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

/**
 * Global setup before all tests
 */
before(async function() {
    // Extended timeout for VS Code setup
    this.timeout(30000);
    
    // Ensure extension is activated
    const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
    if (extension && !extension.isActive) {
        await extension.activate();
    }
    
    // Store original workspace state
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    
    console.log('🔧 Global test setup complete');
});

/**
 * Global cleanup after all tests
 */
after(async function() {
    this.timeout(10000);
    
    // Restore original workspace if needed
    if (originalWorkspaceFolders && originalWorkspaceFolders.length > 0) {
        await vscode.commands.executeCommand('vscode.openFolder', originalWorkspaceFolders[0].uri);
    }
    
    // Cleanup any remaining test workspaces
    if (testWorkspacePath) {
        await cleanupWorkspace(testWorkspacePath);
    }
    
    console.log('🧹 Global test cleanup complete');
});

// ============================================================================
// TEST SUITE SETUP
// ============================================================================

/**
 * Setup before each test
 */
beforeEach(async function() {
    this.timeout(10000);
    
    // Create fresh test workspace for each test
    testWorkspacePath = await createMockWorkspace(`test-${Date.now()}`);
    
    // Clear any existing notifications/dialogs
    await clearUIState();
});

/**
 * Cleanup after each test
 */
afterEach(async function() {
    this.timeout(5000);
    
    // Cleanup test workspace
    if (testWorkspacePath) {
        await cleanupWorkspace(testWorkspacePath);
        testWorkspacePath = null;
    }
    
    // Reset extension state
    await resetExtensionState();
});

// ============================================================================
// UI STATE MANAGEMENT
// ============================================================================

/**
 * Clears VS Code UI state for clean testing
 */
async function clearUIState(): Promise<void> {
    try {
        // Close any open editors
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        
        // Close any open panels
        await vscode.commands.executeCommand('workbench.action.closePanel');
        
        // Close any notifications (if possible)
        await vscode.commands.executeCommand('workbench.action.clearNotifications');
        
    } catch (error) {
        // Some commands might fail if nothing to close - that's okay
        console.warn('Warning during UI state cleanup:', error);
    }
}

/**
 * Resets extension state between tests
 */
async function resetExtensionState(): Promise<void> {
    try {
        // Reset any extension-specific state
        // This would depend on our extension's internal state management
        
        // Clear output channels
        const outputChannel = vscode.window.createOutputChannel('S-cubed');
        outputChannel.clear();
        
    } catch (error) {
        console.warn('Warning during extension state reset:', error);
    }
}

// ============================================================================
// TEST ENVIRONMENT VALIDATION
// ============================================================================

/**
 * Validates that test environment is properly set up
 */
export function validateTestEnvironment(): void {
    // Verify VS Code APIs are available
    if (!vscode.workspace) {
        throw new Error('VS Code workspace API not available');
    }
    
    if (!vscode.commands) {
        throw new Error('VS Code commands API not available');
    }
    
    if (!vscode.window) {
        throw new Error('VS Code window API not available');
    }
    
    // Verify extension is available
    const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
    if (!extension) {
        throw new Error('S-cubed extension not found');
    }
    
    console.log('✅ Test environment validation passed');
}

// ============================================================================
// EXTENSION ACTIVATION HELPERS
// ============================================================================

/**
 * Ensures extension is activated before tests
 * @returns Promise that resolves when extension is active
 */
export async function ensureExtensionActivated(): Promise<void> {
    const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
    
    if (!extension) {
        throw new Error('S-cubed extension not installed');
    }
    
    if (!extension.isActive) {
        console.log('🚀 Activating S-cubed extension for testing...');
        await extension.activate();
        
        // Wait a bit for activation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Verify activation was successful
    if (!extension.isActive) {
        throw new Error('Failed to activate S-cubed extension');
    }
    
    console.log('✅ S-cubed extension is active');
}

/**
 * Gets extension exports for testing internal functionality
 * @returns Extension exports object
 */
export function getExtensionExports(): any {
    const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
    
    if (!extension || !extension.isActive) {
        throw new Error('Extension not active');
    }
    
    return extension.exports;
}

// ============================================================================
// TIMEOUT CONFIGURATION
// ============================================================================

/**
 * Sets appropriate timeouts for different test types
 */
export function configureTestTimeouts(): void {
    // Unit tests should be fast
    const unitTestTimeout = 2000; // 2 seconds
    
    // Integration tests can be slower
    const integrationTestTimeout = 10000; // 10 seconds
    
    // E2E tests need more time
    const e2eTestTimeout = 30000; // 30 seconds
    
    // Set global timeout (can be overridden per test)
    const defaultTimeout = 5000; // 5 seconds
    
    // These would be used by individual test suites
    console.log('⏱️ Test timeouts configured:', {
        unit: unitTestTimeout,
        integration: integrationTestTimeout,
        e2e: e2eTestTimeout,
        default: defaultTimeout
    });
}

// ============================================================================
// DEBUG HELPERS
// ============================================================================

/**
 * Logs current VS Code state for debugging
 */
export function logVSCodeState(): void {
    console.log('📊 VS Code State:', {
        workspaceFolders: vscode.workspace.workspaceFolders?.map(f => f.name),
        activeTextEditor: vscode.window.activeTextEditor?.document.fileName,
        visibleTextEditors: vscode.window.visibleTextEditors.length,
        extensions: vscode.extensions.all.length
    });
}

/**
 * Logs extension state for debugging
 */
export function logExtensionState(): void {
    const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
    
    console.log('🔧 Extension State:', {
        found: !!extension,
        active: extension?.isActive,
        version: extension?.packageJSON?.version,
        exports: !!extension?.exports
    });
}

// ============================================================================
// AUTOMATIC SETUP
// ============================================================================

// Validate environment when this module is loaded
try {
    validateTestEnvironment();
    configureTestTimeouts();
} catch (error) {
    console.error('❌ Test environment setup failed:', error);
    process.exit(1);
}
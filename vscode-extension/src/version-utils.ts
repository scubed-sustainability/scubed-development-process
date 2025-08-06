/**
 * Version Display Utilities
 * Provides dynamic version display functionality for TDD
 */

import * as vscode from 'vscode';

/**
 * Gets the displayed version string from extension context
 * @param context - VS Code extension context
 * @returns Formatted version string (e.g., "v1.0.51")
 */
export function getDisplayedVersion(context: vscode.ExtensionContext): string {
    const packageVersion = context.extension?.packageJSON?.version;
    
    if (!packageVersion) {
        throw new Error('Unable to retrieve version from extension context');
    }
    
    return `v${packageVersion}`;
}

/**
 * Gets the raw version string from extension context
 * @param context - VS Code extension context  
 * @returns Raw version string (e.g., "1.0.51")
 */
export function getRawVersion(context: vscode.ExtensionContext): string {
    const packageVersion = context.extension?.packageJSON?.version;
    
    if (!packageVersion) {
        throw new Error('Unable to retrieve version from extension context');
    }
    
    return packageVersion;
}
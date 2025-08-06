/**
 * File System Error Handling Service
 * 🟢 GREEN PHASE: Implementation for comprehensive file system error handling
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { logger } from './logger';

const fsStats = promisify(fs.stat);
const fsAccess = promisify(fs.access);
const fsReaddir = promisify(fs.readdir);

export interface FileSystemError {
    code: string;
    description: string;
    userMessage: string;
    suggestedActions: string[];
    recoverable: boolean;
}

export interface PermissionCheck {
    path: string;
    required: string[];
    actual: string[];
    hasPermission: boolean;
    issues: string[];
}

export interface DiskSpaceInfo {
    available: number;
    total: number;
    used: number;
    percentage: number;
}

export interface RecoveryOptions {
    canRecover: boolean;
    backupAvailable: boolean;
    alternativeLocations: string[];
    recoveryActions: string[];
}

/**
 * Service to handle file system errors with comprehensive diagnostics and recovery
 */
export class FileSystemService {
    private errorCategories: Map<string, FileSystemError>;

    constructor(private context: vscode.ExtensionContext) {
        this.errorCategories = new Map([
            ['EACCES', {
                code: 'EACCES',
                description: 'Permission denied',
                userMessage: 'Cannot access file due to permission restrictions.',
                suggestedActions: ['Check Permissions', 'Run as Administrator', 'Choose Different Location'],
                recoverable: true
            }],
            ['ENOENT', {
                code: 'ENOENT',
                description: 'File/directory not found',
                userMessage: 'File or directory does not exist.',
                suggestedActions: ['Create Directory', 'Check Path', 'Choose Different Location'],
                recoverable: true
            }],
            ['EEXIST', {
                code: 'EEXIST',
                description: 'File already exists',
                userMessage: 'File already exists in target location.',
                suggestedActions: ['Overwrite Files', 'Backup Existing', 'Choose Different Location'],
                recoverable: true
            }],
            ['ENOSPC', {
                code: 'ENOSPC',
                description: 'No space left on device',
                userMessage: 'Not enough disk space for operation.',
                suggestedActions: ['Free Up Space', 'Choose Smaller Template', 'Select Different Drive'],
                recoverable: true
            }],
            ['EMFILE', {
                code: 'EMFILE',
                description: 'Too many open files',
                userMessage: 'System has too many files open.',
                suggestedActions: ['Close Other Applications', 'Restart VS Code', 'Retry Operation'],
                recoverable: true
            }],
            ['EISDIR', {
                code: 'EISDIR',
                description: 'Is a directory',
                userMessage: 'Expected file but found directory.',
                suggestedActions: ['Choose File Path', 'Rename Directory', 'Select Different Location'],
                recoverable: true
            }],
            ['ENOTDIR', {
                code: 'ENOTDIR',
                description: 'Not a directory',
                userMessage: 'Expected directory but found file.',
                suggestedActions: ['Choose Directory Path', 'Create Directory', 'Select Different Location'],
                recoverable: true
            }]
        ]);
    }

    /**
     * Detect and categorize file system errors
     */
    public detectFileSystemError(error: any): FileSystemError | null {
        const errorCode = error.code || error.errno;
        if (!errorCode) return null;

        const errorInfo = this.errorCategories.get(errorCode);
        if (!errorInfo) {
            // Return generic file system error for unknown codes
            return {
                code: errorCode,
                description: 'File system error',
                userMessage: `File system error occurred: ${error.message || errorCode}`,
                suggestedActions: ['Retry Operation', 'Check File System', 'Contact Support'],
                recoverable: false
            };
        }

        return errorInfo;
    }

    /**
     * Validate workspace permissions before template operations
     */
    public async validateWorkspacePermissions(workspacePath?: string): Promise<PermissionCheck[]> {
        logger.logFunctionEntry('FileSystemService.validateWorkspacePermissions');

        const workspace = workspacePath || this.getWorkspacePath();
        if (!workspace) {
            throw new Error('No workspace available for permission validation');
        }

        const permissionChecks = [
            {
                check: 'Workspace write permissions',
                path: workspace,
                required: ['read', 'write', 'create'],
                critical: true
            },
            {
                check: 'Template directory access',
                path: path.join(workspace, 'templates'),
                required: ['read', 'list'],
                critical: true
            },
            {
                check: 'Requirements file write',
                path: path.join(workspace, 'requirements.md'),
                required: ['read', 'write', 'create'],
                critical: false
            },
            {
                check: 'Configuration file access',
                path: path.join(workspace, '.vscode', 'settings.json'),
                required: ['read', 'write'],
                critical: false
            }
        ];

        const results: PermissionCheck[] = [];

        for (const check of permissionChecks) {
            try {
                const permissions = await this.checkPathPermissions(check.path);
                const hasRequired = check.required.every(req => permissions.includes(req));
                
                results.push({
                    path: check.path,
                    required: check.required,
                    actual: permissions,
                    hasPermission: hasRequired,
                    issues: hasRequired ? [] : [`Missing: ${check.required.filter(req => !permissions.includes(req)).join(', ')}`]
                });

            } catch (error: any) {
                results.push({
                    path: check.path,
                    required: check.required,
                    actual: [],
                    hasPermission: false,
                    issues: [error.message]
                });
            }
        }

        logger.info('Permission validation completed', { totalChecks: results.length, passed: results.filter(r => r.hasPermission).length });
        return results;
    }

    /**
     * Handle template copying permission failures gracefully
     */
    public async handleTemplateCopyError(error: any, sourcePath: string, targetPath: string): Promise<void> {
        const fsError = this.detectFileSystemError(error);
        if (!fsError) {
            throw error; // Re-throw if not a file system error
        }

        logger.warn('Template copy error detected', { code: fsError.code, source: sourcePath, target: targetPath });

        const copyErrorScenarios = {
            'EACCES': {
                error: 'EACCES on target directory',
                userMessage: 'Cannot write to workspace. Check folder permissions.',
                suggestedActions: ['Check Permissions', 'Choose Different Location', 'Run as Administrator']
            },
            'ENOSPC': {
                error: 'ENOSPC during copy',
                userMessage: 'Not enough disk space to copy template files.',
                suggestedActions: ['Free Up Space', 'Choose Smaller Template', 'Select Different Drive']
            },
            'EEXIST': {
                error: 'EEXIST for required files',
                userMessage: 'Template files already exist in workspace.',
                suggestedActions: ['Overwrite Files', 'Backup Existing', 'Choose Different Location']
            },
            'EMFILE': {
                error: 'EMFILE too many open files',
                userMessage: 'Too many files open. Template copy interrupted.',
                suggestedActions: ['Close Other Applications', 'Restart VS Code', 'Retry Operation']
            }
        };

        const scenario = copyErrorScenarios[fsError.code as keyof typeof copyErrorScenarios];
        const message = scenario ? scenario.userMessage : fsError.userMessage;
        const actions = scenario ? scenario.suggestedActions : fsError.suggestedActions;

        await this.showFileSystemErrorDialog(message, actions, 'template-copy', { sourcePath, targetPath });
    }

    /**
     * Check disk space before operations
     */
    public async checkDiskSpace(targetPath: string): Promise<DiskSpaceInfo> {
        logger.logFunctionEntry('FileSystemService.checkDiskSpace', { targetPath });

        try {
            // Get disk space info for the target path
            const stats = await fsStats(path.dirname(targetPath));
            
            // Note: This is a simplified implementation
            // Real implementation would use platform-specific APIs (statvfs on Unix, GetDiskFreeSpaceEx on Windows)
            const diskInfo: DiskSpaceInfo = {
                available: 1024 * 1024 * 1024, // 1GB - placeholder
                total: 10 * 1024 * 1024 * 1024, // 10GB - placeholder
                used: 9 * 1024 * 1024 * 1024, // 9GB - placeholder
                percentage: 90 // 90% used - placeholder
            };

            return diskInfo;

        } catch (error: any) {
            logger.error('Failed to check disk space', error);
            throw error;
        }
    }

    /**
     * Validate disk space requirements before operations
     */
    public async validateDiskSpaceRequirements(operationType: string, targetPath: string): Promise<boolean> {
        const diskSpaceChecks = {
            templateOperations: {
                minSpaceRequired: 50 * 1024 * 1024, // 50 MB
                checkBefore: 'template copy',
                fallbackAction: 'warn user and allow override'
            },
            requirementsFile: {
                minSpaceRequired: 1024 * 1024, // 1 MB
                checkBefore: 'file save',
                fallbackAction: 'show disk space and cleanup suggestions'
            },
            cacheOperations: {
                minSpaceRequired: 10 * 1024 * 1024, // 10 MB
                checkBefore: 'GitHub data caching',
                fallbackAction: 'disable caching temporarily'
            }
        };

        const requirements = diskSpaceChecks[operationType as keyof typeof diskSpaceChecks];
        if (!requirements) {
            return true; // Unknown operation, assume OK
        }

        try {
            const diskInfo = await this.checkDiskSpace(targetPath);
            
            if (diskInfo.available < requirements.minSpaceRequired) {
                const message = `⚠️ **Low Disk Space Warning**\n\n` +
                    `**Available:** ${this.formatBytes(diskInfo.available)}\n` +
                    `**Required:** ${this.formatBytes(requirements.minSpaceRequired)}\n\n` +
                    `${requirements.fallbackAction}`;

                const choice = await vscode.window.showWarningMessage(
                    message,
                    'Continue Anyway',
                    'Free Up Space',
                    'Cancel'
                );

                if (choice === 'Free Up Space') {
                    await this.showDiskCleanupSuggestions(diskInfo);
                    return false;
                } else if (choice === 'Continue Anyway') {
                    return true;
                } else {
                    return false; // Cancel
                }
            }

            return true;

        } catch (error) {
            logger.warn('Could not check disk space, proceeding with operation', error as Error);
            return true;
        }
    }

    /**
     * Handle read-only file system scenarios
     */
    public async handleReadOnlyFileSystem(targetPath: string): Promise<string | null> {
        logger.logFunctionEntry('FileSystemService.handleReadOnlyFileSystem', { targetPath });

        const readOnlyScenarios = [
            {
                scenario: 'Workspace on read-only drive',
                behavior: 'Detect read-only, suggest alternative location',
                alternativePath: this.getUserDocumentsPath()
            },
            {
                scenario: 'Files locked by other application',
                behavior: 'Wait briefly, then suggest closing other apps',
                alternativePath: null
            },
            {
                scenario: 'Corporate-controlled directories',
                behavior: 'Detect restrictions, suggest user Documents folder',
                alternativePath: this.getUserDocumentsPath()
            },
            {
                scenario: 'Network drive with intermittent access',
                behavior: 'Retry with backoff, suggest local copy',
                alternativePath: path.join(process.env.TEMP || '/tmp', 'scubed-workspace')
            }
        ];

        // Check if target path is writable
        try {
            await fsAccess(targetPath, fs.constants.W_OK);
            return null; // Writable, no issues
        } catch (error: any) {
            if (error.code !== 'EACCES') {
                throw error; // Different error, re-throw
            }
        }

        // Show read-only scenario dialog
        const message = `📁 **Read-Only File System Detected**\n\n` +
            `The target location appears to be read-only:\n` +
            `**Path:** ${targetPath}\n\n` +
            `**Suggested Solutions:**\n` +
            `• Choose a different location (Documents folder)\n` +
            `• Check if files are locked by another application\n` +
            `• Verify folder permissions`;

        const actions = ['Choose Alternative', 'Retry', 'Cancel'];
        const choice = await vscode.window.showWarningMessage(message, ...actions);

        if (choice === 'Choose Alternative') {
            const alternatives = readOnlyScenarios.map(s => s.alternativePath).filter(Boolean) as string[];
            return await this.selectAlternativeLocation(alternatives);
        } else if (choice === 'Retry') {
            // Wait a moment and try again
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await fsAccess(targetPath, fs.constants.W_OK);
                return null; // Now writable
            } catch (error) {
                return await this.handleReadOnlyFileSystem(targetPath); // Recursive retry
            }
        }

        return null; // User cancelled
    }

    /**
     * Provide file recovery options for partial operations
     */
    public async provideFileRecovery(operationType: string, affectedPaths: string[]): Promise<RecoveryOptions> {
        logger.logFunctionEntry('FileSystemService.provideFileRecovery', { operationType, pathCount: affectedPaths.length });

        const recoveryScenarios = {
            'template-copy-interrupted': {
                scenario: 'Template copy interrupted mid-operation',
                recovery: [
                    'Detect partial files',
                    'Offer to complete copy',
                    'Option to rollback changes',
                    'Clean up temporary files'
                ]
            },
            'requirements-save-failed': {
                scenario: 'Requirements file save failed',
                recovery: [
                    'Preserve unsaved changes in memory',
                    'Offer alternative save locations',
                    'Auto-backup to temp location',
                    'Suggest file recovery tools'
                ]
            },
            'config-file-corruption': {
                scenario: 'Configuration file corruption',
                recovery: [
                    'Detect corrupted settings',
                    'Restore from backup if available',
                    'Reset to defaults with confirmation',
                    'Preserve user customizations where possible'
                ]
            }
        };

        const scenario = recoveryScenarios[operationType as keyof typeof recoveryScenarios];
        const canRecover = !!scenario;

        // Check for available backups
        const backupAvailable = await this.checkForBackups(affectedPaths);

        // Generate alternative locations
        const alternativeLocations = [
            this.getUserDocumentsPath(),
            path.join(process.env.TEMP || '/tmp', 'scubed-recovery'),
            path.join(this.getWorkspacePath() || '', '.recovery')
        ].filter(Boolean) as string[];

        const recoveryActions = scenario ? scenario.recovery : [
            'Manual recovery required',
            'Check file system integrity',
            'Contact support if needed'
        ];

        const recoveryOptions: RecoveryOptions = {
            canRecover,
            backupAvailable,
            alternativeLocations,
            recoveryActions
        };

        // Show recovery options to user
        await this.showRecoveryDialog(operationType, recoveryOptions);

        return recoveryOptions;
    }

    /**
     * Show detailed file system diagnostics to users
     */
    public async showFileSystemDiagnostics(error: any, targetPath: string): Promise<void> {
        const fsError = this.detectFileSystemError(error);
        if (!fsError) return;

        const diagnosticInfo = {
            permissionErrors: {
                showCurrentUser: true,
                showFileOwner: true,
                showRequiredPermissions: true,
                provideFixCommands: true
            },
            diskSpaceErrors: {
                showAvailableSpace: true,
                showRequiredSpace: true,
                suggestCleanupTargets: true,
                showLargestFiles: true
            },
            pathErrors: {
                showFullPath: true,
                validatePathComponents: true,
                suggestAlternatives: true,
                checkPathLength: true
            }
        };

        let diagnosticDetails = `🔍 **File System Diagnostic Report**\n\n`;
        
        // Add error details
        diagnosticDetails += `**Error Details:**\n`;
        diagnosticDetails += `• Code: ${fsError.code}\n`;
        diagnosticDetails += `• Description: ${fsError.description}\n`;
        diagnosticDetails += `• Path: ${targetPath}\n\n`;

        // Add system information
        if (fsError.code === 'EACCES') {
            diagnosticDetails += `**Permission Information:**\n`;
            diagnosticDetails += `• Current User: ${process.env.USER || process.env.USERNAME || 'Unknown'}\n`;
            diagnosticDetails += `• Required Permissions: Read, Write, Execute\n`;
            try {
                const stats = await fsStats(path.dirname(targetPath));
                diagnosticDetails += `• File Mode: ${stats.mode.toString(8)}\n`;
            } catch (e) {
                diagnosticDetails += `• File Mode: Unable to determine\n`;
            }
        }

        if (fsError.code === 'ENOSPC') {
            try {
                const diskInfo = await this.checkDiskSpace(targetPath);
                diagnosticDetails += `**Disk Space Information:**\n`;
                diagnosticDetails += `• Available: ${this.formatBytes(diskInfo.available)}\n`;
                diagnosticDetails += `• Total: ${this.formatBytes(diskInfo.total)}\n`;
                diagnosticDetails += `• Used: ${diskInfo.percentage}%\n`;
            } catch (e) {
                diagnosticDetails += `**Disk Space:** Unable to determine\n`;
            }
        }

        // Show diagnostic dialog
        const actions = ['View Solutions', 'Copy Details', 'OK'];
        const choice = await vscode.window.showErrorMessage(diagnosticDetails, ...actions);

        if (choice === 'View Solutions') {
            await this.showFileSystemErrorDialog(fsError.userMessage, fsError.suggestedActions, 'diagnostic', { targetPath });
        } else if (choice === 'Copy Details') {
            await vscode.env.clipboard.writeText(diagnosticDetails);
            vscode.window.showInformationMessage('Diagnostic details copied to clipboard');
        }
    }

    /**
     * Implement smart retry logic for transient file system errors
     */
    public async executeWithSmartRetry<T>(
        operation: () => Promise<T>,
        operationType: string,
        maxRetries: number = 3
    ): Promise<T> {
        const retryStrategies = {
            'EMFILE': {
                description: 'Too many open files',
                retries: 3,
                backoff: [1000, 2000, 5000],
                actions: ['Close unused file handles', 'Garbage collect', 'Wait for system recovery']
            },
            'EBUSY': {
                description: 'File busy/locked',
                retries: 5,
                backoff: [500, 1000, 2000, 4000, 8000],
                actions: ['Wait for file unlock', 'Check for competing processes']
            },
            'ENOSPC': {
                description: 'No space left',
                retries: 1,
                backoff: [5000],
                actions: ['Clean temporary files', 'Suggest disk cleanup']
            }
        };

        let lastError: Error | undefined;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
                
            } catch (error: any) {
                lastError = error;
                const fsError = this.detectFileSystemError(error);
                
                if (!fsError) {
                    throw error; // Not a file system error
                }

                const strategy = retryStrategies[fsError.code as keyof typeof retryStrategies];
                
                // If no retry strategy or last attempt, throw error
                if (!strategy || attempt >= Math.min(maxRetries, strategy.retries)) {
                    logger.warn(`File system operation failed after ${attempt} attempts`, { code: fsError.code, operationType });
                    throw error;
                }

                const waitTime = strategy.backoff[attempt - 1] || 1000;
                logger.info(`Retrying file system operation in ${waitTime}ms (attempt ${attempt + 1}/${strategy.retries})`, {
                    code: fsError.code,
                    operationType
                });

                // Show retry notification to user
                if (attempt === 1) {
                    vscode.window.showInformationMessage(
                        `⏳ Retrying operation due to ${fsError.description.toLowerCase()}...`,
                        'Cancel'
                    );
                }

                await this.sleep(waitTime);
            }
        }

        throw lastError || new Error('Operation failed after retries');
    }

    /**
     * Private helper methods
     */
    private async checkPathPermissions(targetPath: string): Promise<string[]> {
        const permissions: string[] = [];

        try {
            // Check read permission
            await fsAccess(targetPath, fs.constants.R_OK);
            permissions.push('read');
        } catch (e: any) {
            // No read permission
        }

        try {
            // Check write permission
            await fsAccess(targetPath, fs.constants.W_OK);
            permissions.push('write');
        } catch (e: any) {
            // No write permission
        }

        try {
            // Check execute permission (for directories)
            await fsAccess(targetPath, fs.constants.X_OK);
            permissions.push('execute');
        } catch (e: any) {
            // No execute permission
        }

        // Check if path exists for create operations
        try {
            await fsStats(targetPath);
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                // Path doesn't exist, can potentially create
                permissions.push('create');
            }
        }

        return permissions;
    }

    private getWorkspacePath(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        return workspaceFolders && workspaceFolders.length > 0 
            ? workspaceFolders[0].uri.fsPath 
            : null;
    }

    private getUserDocumentsPath(): string {
        return process.env.USERPROFILE 
            ? path.join(process.env.USERPROFILE, 'Documents')
            : path.join(process.env.HOME || '/', 'Documents');
    }

    private async selectAlternativeLocation(alternatives: string[]): Promise<string | null> {
        const items = alternatives.map(alt => ({
            label: path.basename(alt),
            detail: alt,
            path: alt
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select alternative location',
            canPickMany: false
        });

        return selected ? selected.path : null;
    }

    private async checkForBackups(paths: string[]): Promise<boolean> {
        // Check if any backup files exist
        for (const filePath of paths) {
            const backupPath = `${filePath}.backup`;
            try {
                await fsStats(backupPath);
                return true;
            } catch (e: any) {
                // No backup for this file
            }
        }
        return false;
    }

    private async showRecoveryDialog(operationType: string, options: RecoveryOptions): Promise<void> {
        const message = `🔧 **File Recovery Options**\n\n` +
            `**Operation:** ${operationType}\n` +
            `**Recovery Available:** ${options.canRecover ? 'Yes' : 'No'}\n` +
            `**Backup Available:** ${options.backupAvailable ? 'Yes' : 'No'}\n\n` +
            `**Available Actions:**\n${options.recoveryActions.map(action => `• ${action}`).join('\n')}`;

        const actions = [];
        if (options.canRecover) actions.push('Start Recovery');
        if (options.backupAvailable) actions.push('Restore Backup');
        if (options.alternativeLocations.length > 0) actions.push('Choose Location');
        actions.push('Cancel');

        await vscode.window.showInformationMessage(message, ...actions);
    }

    private async showFileSystemErrorDialog(
        message: string, 
        actions: string[], 
        context: string, 
        metadata: any
    ): Promise<void> {
        logger.info(`Showing file system error dialog`, { context, metadata });
        
        const choice = await vscode.window.showErrorMessage(
            `🚨 ${message}`,
            ...actions
        );

        // Handle user choice (implementation would depend on specific actions)
        if (choice) {
            logger.info(`User selected action: ${choice}`, { context });
        }
    }

    private async showDiskCleanupSuggestions(diskInfo: DiskSpaceInfo): Promise<void> {
        const message = `💿 **Disk Cleanup Suggestions**\n\n` +
            `**Current Usage:** ${this.formatBytes(diskInfo.used)} of ${this.formatBytes(diskInfo.total)} (${diskInfo.percentage}%)\n` +
            `**Available:** ${this.formatBytes(diskInfo.available)}\n\n` +
            `**Cleanup Suggestions:**\n` +
            `• Clear temporary files\n` +
            `• Empty trash/recycle bin\n` +
            `• Remove old downloads\n` +
            `• Uninstall unused applications\n` +
            `• Move large files to external storage`;

        vscode.window.showInformationMessage(message, 'Open Disk Cleanup', 'OK');
    }

    private formatBytes(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for testing
export { FileSystemService as testableFileSystemService };
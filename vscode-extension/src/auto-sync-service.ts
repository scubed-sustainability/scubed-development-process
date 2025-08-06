/**
 * Auto-Sync Service for GitHub Integration
 * 🟢 GREEN PHASE: Implementation to make RED tests pass
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { logger } from './logger';

export interface AutoSyncConfig {
    enabled: boolean;
    owner: string;
    repo: string;
    stakeholderTeam?: string;
}

/**
 * Service to handle automatic syncing of requirements files to GitHub on save
 */
export class AutoSyncService {
    private fileWatcher: vscode.Disposable | null = null;
    private saveListener: vscode.Disposable | null = null;
    private syncInProgress = false;

    constructor(
        private context: vscode.ExtensionContext,
        private syncCommand: string = 'scubed.syncWithGitHub'
    ) {}

    /**
     * Initialize auto-sync service based on configuration
     */
    public async initialize(): Promise<void> {
        logger.logFunctionEntry('AutoSyncService.initialize');
        
        const config = this.getConfig();
        
        if (config.enabled) {
            await this.enableAutoSync();
            logger.info('Auto-sync enabled');
        } else {
            this.disableAutoSync();
            logger.info('Auto-sync disabled');
        }
        
        // Listen for configuration changes
        this.setupConfigurationListener();
        
        logger.logFunctionExit('AutoSyncService.initialize');
    }

    /**
     * Enable auto-sync by setting up file save listeners
     */
    private async enableAutoSync(): Promise<void> {
        // Dispose existing listeners first
        this.disableAutoSync();
        
        logger.info('Setting up auto-sync file save listeners');
        
        // Listen for document save events
        this.saveListener = vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
            await this.handleFileSave(document);
        });
        
        if (this.saveListener) {
            this.context.subscriptions.push(this.saveListener);
        }
    }

    /**
     * Disable auto-sync by removing listeners
     */
    private disableAutoSync(): void {
        if (this.saveListener) {
            this.saveListener.dispose();
            this.saveListener = null;
        }
        
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }
        
        logger.debug('Auto-sync listeners disabled');
    }

    /**
     * Handle file save events
     */
    private async handleFileSave(document: vscode.TextDocument): Promise<void> {
        try {
            // Only sync if auto-sync is enabled
            const config = this.getConfig();
            if (!config.enabled) {
                return;
            }

            // Prevent recursive sync calls
            if (this.syncInProgress) {
                logger.debug('Sync already in progress, skipping auto-sync');
                return;
            }

            // Only sync requirements files
            if (!this.isRequirementsFile(document.fileName)) {
                logger.debug(`File ${document.fileName} is not a requirements file, skipping sync`);
                return;
            }

            logger.info(`Auto-sync triggered for file: ${document.fileName}`);
            
            // Validate GitHub configuration before syncing
            if (!this.isValidGitHubConfig(config)) {
                logger.warn('GitHub configuration incomplete, cannot auto-sync');
                vscode.window.showWarningMessage(
                    'Auto-sync enabled but GitHub configuration is incomplete. Please configure GitHub settings.'
                );
                return;
            }

            // Trigger sync
            await this.triggerSync(document);
            
        } catch (error) {
            logger.error('Auto-sync failed', error as Error);
            this.handleSyncError(error as Error);
        }
    }

    /**
     * Trigger the actual sync operation
     */
    private async triggerSync(document: vscode.TextDocument): Promise<void> {
        this.syncInProgress = true;
        
        try {
            logger.logUserAction('Auto-sync triggered', { file: document.fileName });
            
            // Show subtle progress indication
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Window,
                title: 'Auto-syncing to GitHub...',
                cancellable: false
            }, async () => {
                // Execute the sync command
                await vscode.commands.executeCommand(this.syncCommand);
            });
            
            // Show success message (brief)
            vscode.window.setStatusBarMessage(
                '✅ Requirements auto-synced to GitHub', 
                3000
            );
            
            logger.info('Auto-sync completed successfully');
            
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Check if file is a requirements file that should trigger sync
     */
    private isRequirementsFile(filePath: string): boolean {
        const fileName = path.basename(filePath).toLowerCase();
        const dirName = path.basename(path.dirname(filePath)).toLowerCase();
        
        // Requirements files patterns
        const requirementPatterns = [
            'requirements.md',
            'requirements.txt',
            'requirement.md',
            'project-requirements.md'
        ];
        
        // Directory patterns that contain requirements
        const requirementDirs = [
            'requirements',
            'docs/requirements',
            'specification'
        ];
        
        // Check filename patterns
        if (requirementPatterns.includes(fileName)) {
            return true;
        }
        
        // Check if file is in requirements directory
        if (fileName.endsWith('.md') && requirementDirs.some(() => dirName.includes('requirement'))) {
            return true;
        }
        
        // Check file content patterns (for .md files)
        if (fileName.endsWith('.md') && this.hasRequirementsContent(fileName)) {
            return true;
        }
        
        return false;
    }

    /**
     * Basic check if markdown file likely contains requirements
     */
    private hasRequirementsContent(fileName: string): boolean {
        // Simple heuristic based on filename patterns
        // Real implementation could read file content for keyword matching
        return fileName.includes('requirement') || fileName.includes('spec');
    }

    /**
     * Get current auto-sync configuration
     */
    private getConfig(): AutoSyncConfig {
        const config = vscode.workspace.getConfiguration('scubed');
        
        return {
            enabled: config.get<boolean>('github.autoSync', false),
            owner: config.get<string>('github.owner', ''),
            repo: config.get<string>('github.repo', ''),
            stakeholderTeam: config.get<string>('github.stakeholderTeam', '')
        };
    }

    /**
     * Validate GitHub configuration is complete
     */
    private isValidGitHubConfig(config: AutoSyncConfig): boolean {
        return config.owner.length > 0 && config.repo.length > 0;
    }

    /**
     * Handle sync errors gracefully
     */
    private handleSyncError(error: Error): void {
        logger.error('Auto-sync error', error);
        
        // Show user-friendly error message
        const message = `Auto-sync failed: ${error.message}`;
        vscode.window.showErrorMessage(message, 'Open Settings', 'Disable Auto-sync')
            .then(action => {
                if (action === 'Open Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'scubed.github');
                } else if (action === 'Disable Auto-sync') {
                    const config = vscode.workspace.getConfiguration('scubed');
                    config.update('github.autoSync', false, vscode.ConfigurationTarget.Workspace);
                }
            });
    }

    /**
     * Setup configuration change listener
     */
    private setupConfigurationListener(): void {
        const configListener = vscode.workspace.onDidChangeConfiguration(async (event) => {
            if (event.affectsConfiguration('scubed.github.autoSync')) {
                logger.info('Auto-sync configuration changed, reinitializing');
                await this.initialize();
            }
        });
        
        this.context.subscriptions.push(configListener);
    }

    /**
     * Get sync status for debugging/testing
     */
    public getSyncStatus(): { enabled: boolean; inProgress: boolean; config: AutoSyncConfig } {
        return {
            enabled: this.saveListener !== null,
            inProgress: this.syncInProgress,
            config: this.getConfig()
        };
    }

    /**
     * Dispose of all listeners and resources
     */
    public dispose(): void {
        this.disableAutoSync();
        logger.info('Auto-sync service disposed');
    }
}

// Export for testing
export { AutoSyncService as testableAutoSyncService };
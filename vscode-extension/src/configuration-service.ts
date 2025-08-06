/**
 * Configuration Validation and Auto-Correction Service
 * 🟢 GREEN PHASE: Implementation for comprehensive configuration validation
 */

import * as vscode from 'vscode';
import { URL } from 'url';
import { logger } from './logger';

export interface ConfigurationIssue {
    key: string;
    value: any;
    issue: string;
    severity: 'error' | 'warning' | 'info';
    autoFixAvailable: boolean;
    autoFixDescription: string;
    suggestedValue?: any;
}

export interface ConfigurationHealth {
    overallStatus: 'healthy' | 'warnings' | 'errors';
    issues: ConfigurationIssue[];
    lastChecked: Date;
    autoFixesApplied: number;
}

export interface MigrationStep {
    from: string;
    to: string;
    description: string;
    valueTransform?: (oldValue: any) => any;
}

/**
 * Service for validating and auto-correcting VS Code configuration
 */
export class ConfigurationService {
    private healthStatus: ConfigurationHealth;
    private configurationWatcher: vscode.Disposable | null = null;
    private statusBarItem: vscode.StatusBarItem;

    // Configuration schema definitions
    private readonly configSchema = {
        'scubed.github.token': {
            type: 'string',
            required: true,
            validator: this.validateGitHubToken.bind(this),
            default: ''
        },
        'scubed.github.repository': {
            type: 'string',
            required: true,
            validator: this.validateRepositoryUrl.bind(this),
            default: ''
        },
        'scubed.github.autoSync': {
            type: 'boolean',
            required: false,
            default: true
        },
        'scubed.network.timeout': {
            type: 'number',
            required: false,
            validator: this.validateTimeout.bind(this),
            default: 30000
        },
        'scubed.network.retries': {
            type: 'number',
            required: false,
            validator: this.validateRetries.bind(this),
            default: 3
        },
        'scubed.templates.customPath': {
            type: 'string',
            required: false,
            validator: this.validateTemplatePath.bind(this),
            default: null
        }
    };

    // Configuration migration rules
    private readonly migrationRules: MigrationStep[] = [
        {
            from: 'scubed.githubToken',
            to: 'scubed.github.token',
            description: 'Migrate from flat to nested GitHub configuration'
        },
        {
            from: 'scubed.repositoryUrl',
            to: 'scubed.github.repository', 
            description: 'Migrate repository URL to new location'
        },
        {
            from: 'scubed.enableExperimentalFeatures',
            to: '', // Remove deprecated setting
            description: 'Remove deprecated experimental features setting'
        }
    ];

    constructor(private context: vscode.ExtensionContext) {
        // Initialize health status
        this.healthStatus = {
            overallStatus: 'healthy',
            issues: [],
            lastChecked: new Date(),
            autoFixesApplied: 0
        };

        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            99
        );
        this.statusBarItem.command = 'scubed.showConfigurationHealth';
        this.context.subscriptions.push(this.statusBarItem);
    }

    /**
     * Initialize configuration service
     */
    public async initialize(): Promise<void> {
        logger.logFunctionEntry('ConfigurationService.initialize');
        
        // Perform initial migration
        await this.performConfigurationMigration();
        
        // Validate current configuration
        await this.validateAllConfiguration();
        
        // Start real-time monitoring
        this.startConfigurationMonitoring();
        
        // Update status bar
        this.updateStatusBar();
        
        logger.info('ConfigurationService initialized');
    }

    /**
     * Validate all configuration settings
     */
    public async validateAllConfiguration(): Promise<ConfigurationHealth> {
        logger.logFunctionEntry('ConfigurationService.validateAllConfiguration');
        
        this.healthStatus.issues = [];
        this.healthStatus.lastChecked = new Date();

        for (const [key, schema] of Object.entries(this.configSchema)) {
            try {
                const issue = await this.validateConfigurationKey(key, schema);
                if (issue) {
                    this.healthStatus.issues.push(issue);
                }
            } catch (error: any) {
                logger.error(`Configuration validation failed for ${key}`, error);
                this.healthStatus.issues.push({
                    key,
                    value: null,
                    issue: `Validation error: ${error.message}`,
                    severity: 'error',
                    autoFixAvailable: false,
                    autoFixDescription: 'Manual intervention required'
                });
            }
        }

        // Determine overall status
        const errorCount = this.healthStatus.issues.filter(i => i.severity === 'error').length;
        const warningCount = this.healthStatus.issues.filter(i => i.severity === 'warning').length;

        if (errorCount > 0) {
            this.healthStatus.overallStatus = 'errors';
        } else if (warningCount > 0) {
            this.healthStatus.overallStatus = 'warnings';
        } else {
            this.healthStatus.overallStatus = 'healthy';
        }

        this.updateStatusBar();
        
        logger.info('Configuration validation completed', {
            status: this.healthStatus.overallStatus,
            issues: this.healthStatus.issues.length
        });

        return { ...this.healthStatus };
    }

    /**
     * Auto-fix configuration issues where possible
     */
    public async autoFixConfiguration(): Promise<number> {
        logger.logFunctionEntry('ConfigurationService.autoFixConfiguration');
        
        let fixesApplied = 0;
        const config = vscode.workspace.getConfiguration();

        for (const issue of this.healthStatus.issues) {
            if (!issue.autoFixAvailable) continue;

            try {
                if (issue.suggestedValue !== undefined) {
                    await config.update(issue.key, issue.suggestedValue, vscode.ConfigurationTarget.Global);
                    fixesApplied++;
                    logger.info(`Auto-fixed configuration: ${issue.key}`, {
                        oldValue: issue.value,
                        newValue: issue.suggestedValue
                    });
                } else if (issue.key.startsWith('scubed.') && issue.key in this.configSchema) {
                    // Apply default value
                    const defaultValue = (this.configSchema as any)[issue.key].default;
                    await config.update(issue.key, defaultValue, vscode.ConfigurationTarget.Global);
                    fixesApplied++;
                    logger.info(`Applied default value for ${issue.key}`, { defaultValue });
                }
            } catch (error: any) {
                logger.error(`Failed to auto-fix configuration ${issue.key}`, error);
            }
        }

        this.healthStatus.autoFixesApplied += fixesApplied;

        // Re-validate after fixes
        if (fixesApplied > 0) {
            await this.validateAllConfiguration();
            
            vscode.window.showInformationMessage(
                `✅ Applied ${fixesApplied} configuration auto-fixes`,
                'View Details'
            ).then(choice => {
                if (choice === 'View Details') {
                    this.showConfigurationHealth();
                }
            });
        }

        logger.info(`Configuration auto-fix completed`, { fixesApplied });
        return fixesApplied;
    }

    /**
     * Show configuration health dashboard
     */
    public async showConfigurationHealth(): Promise<void> {
        const health = await this.validateAllConfiguration();
        
        let message = `🔧 **S-cubed Configuration Health**\n\n`;
        message += `**Status:** ${this.getStatusEmoji(health.overallStatus)} ${health.overallStatus.toUpperCase()}\n`;
        message += `**Last Checked:** ${health.lastChecked.toLocaleString()}\n`;
        message += `**Issues Found:** ${health.issues.length}\n`;
        message += `**Auto-fixes Applied:** ${health.autoFixesApplied}\n\n`;

        if (health.issues.length === 0) {
            message += `✅ **All configuration settings are valid!**\n\n`;
            message += `Your S-cubed extension is properly configured and ready to use.`;
        } else {
            message += `**Issues:**\n`;
            health.issues.forEach(issue => {
                const emoji = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
                message += `${emoji} **${issue.key}:** ${issue.issue}\n`;
                if (issue.autoFixAvailable) {
                    message += `   🔧 Auto-fix: ${issue.autoFixDescription}\n`;
                }
                message += `\n`;
            });
        }

        const actions = [];
        if (health.issues.some(i => i.autoFixAvailable)) {
            actions.push('Auto-Fix Issues');
        }
        actions.push('Open Settings', 'Refresh', 'OK');

        const choice = await vscode.window.showInformationMessage(message, ...actions);
        
        await this.handleHealthAction(choice);
    }

    /**
     * Perform configuration migration for version updates
     */
    private async performConfigurationMigration(): Promise<void> {
        logger.logFunctionEntry('ConfigurationService.performConfigurationMigration');
        
        const config = vscode.workspace.getConfiguration();
        let migrationsApplied = 0;

        for (const migration of this.migrationRules) {
            try {
                const oldValue = config.get(migration.from);
                if (oldValue !== undefined) {
                    if (migration.to === '') {
                        // Remove deprecated setting
                        await config.update(migration.from, undefined, vscode.ConfigurationTarget.Global);
                        logger.info(`Removed deprecated setting: ${migration.from}`);
                    } else {
                        // Migrate to new location
                        const newValue = migration.valueTransform ? migration.valueTransform(oldValue) : oldValue;
                        await config.update(migration.to, newValue, vscode.ConfigurationTarget.Global);
                        await config.update(migration.from, undefined, vscode.ConfigurationTarget.Global);
                        logger.info(`Migrated configuration: ${migration.from} → ${migration.to}`, { value: newValue });
                    }
                    migrationsApplied++;
                }
            } catch (error: any) {
                logger.error(`Migration failed: ${migration.from} → ${migration.to}`, error);
            }
        }

        if (migrationsApplied > 0) {
            vscode.window.showInformationMessage(
                `🔄 Migrated ${migrationsApplied} configuration settings to new format`,
                'View Settings'
            ).then(choice => {
                if (choice === 'View Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'scubed');
                }
            });
        }

        logger.info(`Configuration migration completed`, { migrationsApplied });
    }

    /**
     * Start real-time configuration monitoring
     */
    private startConfigurationMonitoring(): void {
        this.configurationWatcher = vscode.workspace.onDidChangeConfiguration(async (e) => {
            // Check if any S-cubed settings changed
            const scubedKeys = Object.keys(this.configSchema);
            const hasScubedChanges = scubedKeys.some(key => e.affectsConfiguration(key));
            
            if (hasScubedChanges) {
                logger.info('S-cubed configuration changed, re-validating');
                await this.validateAllConfiguration();
                
                // Show notification for critical errors
                const criticalErrors = this.healthStatus.issues.filter(i => 
                    i.severity === 'error' && (i.key.includes('token') || i.key.includes('repository'))
                );
                
                if (criticalErrors.length > 0) {
                    vscode.window.showWarningMessage(
                        `⚠️ Configuration issues detected: ${criticalErrors.length} critical errors`,
                        'Fix Now', 'View Issues'
                    ).then(choice => {
                        if (choice === 'Fix Now') {
                            this.autoFixConfiguration();
                        } else if (choice === 'View Issues') {
                            this.showConfigurationHealth();
                        }
                    });
                }
            }
        });

        this.context.subscriptions.push(this.configurationWatcher);
    }

    /**
     * Validate individual configuration key
     */
    private async validateConfigurationKey(key: string, schema: any): Promise<ConfigurationIssue | null> {
        const config = vscode.workspace.getConfiguration();
        const value = config.get(key);

        // Check if required setting is missing
        if (schema.required && (value === undefined || value === null || value === '')) {
            return {
                key,
                value,
                issue: 'Required configuration setting is missing',
                severity: 'error',
                autoFixAvailable: schema.default !== undefined,
                autoFixDescription: `Set to default value: ${schema.default}`,
                suggestedValue: schema.default
            };
        }

        // Check data type
        if (value !== undefined && value !== null && typeof value !== schema.type) {
            let suggestedValue = value;
            
            // Try to convert to correct type
            if (schema.type === 'number' && typeof value === 'string') {
                const numValue = Number(value);
                if (!isNaN(numValue)) {
                    suggestedValue = numValue;
                }
            } else if (schema.type === 'boolean' && typeof value === 'string') {
                suggestedValue = value.toLowerCase() === 'true' || value === '1';
            }
            
            return {
                key,
                value,
                issue: `Value should be ${schema.type}, but got ${typeof value}`,
                severity: 'error',
                autoFixAvailable: suggestedValue !== value,
                autoFixDescription: `Convert to ${schema.type}: ${suggestedValue}`,
                suggestedValue
            };
        }

        // Run custom validator if available
        if (schema.validator && value !== undefined && value !== null) {
            try {
                const validationResult = await schema.validator(value);
                if (validationResult !== null) {
                    return validationResult;
                }
            } catch (error: any) {
                return {
                    key,
                    value,
                    issue: `Validation failed: ${error.message}`,
                    severity: 'error',
                    autoFixAvailable: false,
                    autoFixDescription: 'Manual correction required'
                };
            }
        }

        return null;
    }

    /**
     * GitHub token validator
     */
    private async validateGitHubToken(token: string): Promise<ConfigurationIssue | null> {
        if (!token || token.trim() === '') {
            return {
                key: 'scubed.github.token',
                value: token,
                issue: 'GitHub token is empty',
                severity: 'error',
                autoFixAvailable: false,
                autoFixDescription: 'Create and configure a GitHub personal access token'
            };
        }

        // Check token format
        if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
            return {
                key: 'scubed.github.token',
                value: token,
                issue: 'Token format appears invalid (should start with ghp_ or github_pat_)',
                severity: 'warning',
                autoFixAvailable: false,
                autoFixDescription: 'Verify token was copied correctly from GitHub'
            };
        }

        // Check token length (GitHub tokens are typically 40+ characters)
        if (token.length < 40) {
            return {
                key: 'scubed.github.token',
                value: token,
                issue: 'Token appears incomplete or truncated',
                severity: 'error',
                autoFixAvailable: false,
                autoFixDescription: 'Ensure complete token was copied from GitHub'
            };
        }

        return null;
    }

    /**
     * Repository URL validator
     */
    private async validateRepositoryUrl(url: string): Promise<ConfigurationIssue | null> {
        if (!url || url.trim() === '') {
            return {
                key: 'scubed.github.repository',
                value: url,
                issue: 'Repository URL is empty',
                severity: 'error',
                autoFixAvailable: false,
                autoFixDescription: 'Configure GitHub repository URL'
            };
        }

        try {
            const parsedUrl = new URL(url);
            
            // Check if it's a GitHub URL
            if (parsedUrl.hostname !== 'github.com') {
                return {
                    key: 'scubed.github.repository',
                    value: url,
                    issue: 'URL is not a GitHub repository',
                    severity: 'error',
                    autoFixAvailable: false,
                    autoFixDescription: 'Use a GitHub.com repository URL'
                };
            }

            // Check URL structure
            const pathParts = parsedUrl.pathname.split('/').filter(part => part);
            if (pathParts.length < 2) {
                return {
                    key: 'scubed.github.repository',
                    value: url,
                    issue: 'URL should include owner and repository name',
                    severity: 'error',
                    autoFixAvailable: false,
                    autoFixDescription: 'Use format: https://github.com/owner/repository'
                };
            }

            // Check for SSH format and suggest HTTPS conversion
            if (url.startsWith('git@github.com:')) {
                const httpsUrl = url.replace('git@github.com:', 'https://github.com/').replace('.git', '');
                return {
                    key: 'scubed.github.repository',
                    value: url,
                    issue: 'SSH format not supported for API calls',
                    severity: 'warning',
                    autoFixAvailable: true,
                    autoFixDescription: 'Convert to HTTPS format',
                    suggestedValue: httpsUrl
                };
            }

        } catch (error: any) {
            return {
                key: 'scubed.github.repository',
                value: url,
                issue: 'Invalid URL format',
                severity: 'error',
                autoFixAvailable: false,
                autoFixDescription: 'Enter a valid GitHub repository URL'
            };
        }

        return null;
    }

    /**
     * Timeout validator
     */
    private async validateTimeout(timeout: number): Promise<ConfigurationIssue | null> {
        if (timeout < 1000) {
            return {
                key: 'scubed.network.timeout',
                value: timeout,
                issue: 'Timeout too low (minimum 1 second)',
                severity: 'warning',
                autoFixAvailable: true,
                autoFixDescription: 'Set to minimum value (1000ms)',
                suggestedValue: 1000
            };
        }

        if (timeout > 300000) { // 5 minutes
            return {
                key: 'scubed.network.timeout',
                value: timeout,
                issue: 'Timeout too high (maximum 5 minutes)',
                severity: 'warning',
                autoFixAvailable: true,
                autoFixDescription: 'Set to maximum value (300000ms)',
                suggestedValue: 300000
            };
        }

        return null;
    }

    /**
     * Retries validator
     */
    private async validateRetries(retries: number): Promise<ConfigurationIssue | null> {
        if (!Number.isInteger(retries) || retries < 0) {
            return {
                key: 'scubed.network.retries',
                value: retries,
                issue: 'Retries must be a non-negative integer',
                severity: 'error',
                autoFixAvailable: true,
                autoFixDescription: 'Set to default value (3)',
                suggestedValue: 3
            };
        }

        if (retries > 10) {
            return {
                key: 'scubed.network.retries',
                value: retries,
                issue: 'Too many retries (maximum 10)',
                severity: 'warning',
                autoFixAvailable: true,
                autoFixDescription: 'Set to maximum value (10)',
                suggestedValue: 10
            };
        }

        return null;
    }

    /**
     * Template path validator
     */
    private async validateTemplatePath(path: string): Promise<ConfigurationIssue | null> {
        if (!path) return null; // Optional setting

        try {
            const uri = vscode.Uri.file(path);
            const stat = await vscode.workspace.fs.stat(uri);
            
            if (!(stat.type & vscode.FileType.Directory)) {
                return {
                    key: 'scubed.templates.customPath',
                    value: path,
                    issue: 'Path is not a directory',
                    severity: 'error',
                    autoFixAvailable: false,
                    autoFixDescription: 'Select a valid directory path'
                };
            }
        } catch (error: any) {
            return {
                key: 'scubed.templates.customPath',
                value: path,
                issue: 'Path does not exist or is not accessible',
                severity: 'error',
                autoFixAvailable: true,
                autoFixDescription: 'Reset to default (use bundled templates)',
                suggestedValue: null
            };
        }

        return null;
    }

    /**
     * Handle health dashboard actions
     */
    private async handleHealthAction(action: string | undefined): Promise<void> {
        switch (action) {
            case 'Auto-Fix Issues':
                await this.autoFixConfiguration();
                break;
                
            case 'Open Settings':
                await vscode.commands.executeCommand('workbench.action.openSettings', 'scubed');
                break;
                
            case 'Refresh':
                await this.validateAllConfiguration();
                await this.showConfigurationHealth();
                break;
        }
    }

    /**
     * Update status bar with configuration health
     */
    private updateStatusBar(): void {
        const { overallStatus, issues } = this.healthStatus;
        
        if (overallStatus === 'healthy') {
            this.statusBarItem.text = '$(check) Config OK';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = 'S-cubed configuration is healthy';
        } else if (overallStatus === 'warnings') {
            this.statusBarItem.text = `$(warning) Config (${issues.length})`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = `S-cubed configuration has ${issues.length} warnings`;
        } else {
            this.statusBarItem.text = `$(error) Config (${issues.length})`;
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            this.statusBarItem.tooltip = `S-cubed configuration has ${issues.length} errors`;
        }
        
        this.statusBarItem.show();
    }

    /**
     * Get configuration health
     */
    public getConfigurationHealth(): ConfigurationHealth {
        return { ...this.healthStatus };
    }

    /**
     * Helper methods
     */
    private getStatusEmoji(status: string): string {
        switch (status) {
            case 'healthy': return '✅';
            case 'warnings': return '⚠️';
            case 'errors': return '❌';
            default: return '❓';
        }
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        if (this.configurationWatcher) {
            this.configurationWatcher.dispose();
        }
        this.statusBarItem.dispose();
    }
}

// Export for testing
export { ConfigurationService as testableConfigurationService };
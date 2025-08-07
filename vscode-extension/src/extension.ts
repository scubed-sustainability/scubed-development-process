import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
// 🟢 GREEN: Remove axios dependency - use built-in fetch instead
import { GitHubService } from './github-service';
import { ValidationService } from './validation-service';
import { logger } from './logger';
import { getDisplayedVersion } from './version-utils';
import { resolveTemplatePath, TemplateNotFoundError } from './template-utils';
import { webviewTracker, createTrackedWebviewPanel } from './webview-tracker';
import { AutoSyncService } from './auto-sync-service';
import { StakeholderService } from './stakeholder-service';
import { StatusValidationService } from './status-validation-service';
import { RateLimitService } from './rate-limit-service';
import { NetworkService } from './network-service';
import { FileSystemService } from './file-system-service';
import { ConfigurationService } from './configuration-service';
import { GitHubWorkflowService } from './github-workflow-service';
// 🟢 GREEN: Lazy load tree providers for better performance

let gitHubService: GitHubService;
let validationService: ValidationService;
let autoSyncService: AutoSyncService;
let stakeholderService: StakeholderService;
let statusValidationService: StatusValidationService;
let rateLimitService: RateLimitService;
let networkService: NetworkService;
let fileSystemService: FileSystemService;
let configurationService: ConfigurationService;
let githubWorkflowService: GitHubWorkflowService;

export async function activate(context: vscode.ExtensionContext) {
    // Set up logger first
    logger.logExtensionEvent('Extension activation starting');
    
    // Use dynamic version from package.json (TDD fix)
    const currentVersion = getDisplayedVersion(context);
    logger.info(`S-cubed Extension ${currentVersion} activating...`);
    
    try {
        // Initialize services
        logger.info('Initializing services...');
        gitHubService = new GitHubService();
        logger.info('GitHubService created successfully');
        validationService = new ValidationService();
        logger.info('ValidationService created successfully');
        
        // Initialize auto-sync service (TDD Phase 4 implementation)
        autoSyncService = new AutoSyncService(context);
        await autoSyncService.initialize();
        logger.info('AutoSyncService created and initialized successfully');
        
        // Initialize stakeholder service (TDD Phase 4 implementation)
        stakeholderService = new StakeholderService(gitHubService);
        await stakeholderService.initialize();
        logger.info('StakeholderService created and initialized successfully');
        
        // Initialize status validation service (TDD Phase 4 implementation)
        statusValidationService = new StatusValidationService(gitHubService);
        logger.info('StatusValidationService created successfully');
        
        // Initialize error handling services (TDD Phase 5 implementation)
        rateLimitService = new RateLimitService();
        logger.info('RateLimitService created successfully');
        
        networkService = new NetworkService(context);
        await networkService.initialize();
        logger.info('NetworkService created and initialized successfully');
        
        fileSystemService = new FileSystemService(context);
        logger.info('FileSystemService created successfully');
        
        configurationService = new ConfigurationService(context);
        await configurationService.initialize();
        logger.info('ConfigurationService created and initialized successfully');
        
        // Initialize GitHub workflow service (TDD Phase 3 Epic 2)
        githubWorkflowService = new GitHubWorkflowService(
            context,
            gitHubService,
            networkService,
            rateLimitService
        );
        logger.info('GitHubWorkflowService created successfully');

        // Register commands
        logger.info('Registering extension commands...');
    const openTemplateGalleryCommand = vscode.commands.registerCommand('scubed.openTemplateGallery', openTemplateGallery);
    const checkForUpdatesCommand = vscode.commands.registerCommand('scubed.checkForUpdates', () => checkForUpdates(context));
    const showLogOutputCommand = vscode.commands.registerCommand('scubed.showLogOutput', () => logger.show());
    
    // GitHub integration commands
    const pushToGitHubCommand = vscode.commands.registerCommand('scubed.pushToGitHub', pushRequirementsToGitHub);
    const syncWithGitHubCommand = vscode.commands.registerCommand('scubed.syncWithGitHub', syncWithGitHub);
    const checkGitHubFeedbackCommand = vscode.commands.registerCommand('scubed.checkGitHubFeedback', checkGitHubFeedback);
    
    // Approval workflow commands
    const checkApprovalStatusCommand = vscode.commands.registerCommand('scubed.checkApprovalStatus', checkApprovalStatus);
    const triggerApprovalCheckCommand = vscode.commands.registerCommand('scubed.triggerApprovalCheck', triggerApprovalCheck);
    const requestReReviewCommand = vscode.commands.registerCommand('scubed.requestReReview', requestReReview);
    const moveToInDevelopmentCommand = vscode.commands.registerCommand('scubed.moveToInDevelopment', moveToInDevelopment);
    const viewRequirementsDashboardCommand = vscode.commands.registerCommand('scubed.viewRequirementsDashboard', viewRequirementsDashboard);
    
    // Error handling and configuration commands
    const showNetworkStatusCommand = vscode.commands.registerCommand('scubed.showNetworkStatus', () => networkService.checkConnectivity());
    const showConfigurationHealthCommand = vscode.commands.registerCommand('scubed.showConfigurationHealth', () => configurationService.showConfigurationHealth());
    
    // Template actions (Activity Bar integration)
    const useTemplateCommand = vscode.commands.registerCommand('scubed.useTemplate', useTemplate);

        // 🟢 GREEN: Lazy load Activity Bar tree providers for performance optimization
        logger.info('Lazy loading Activity Bar tree providers...');
        import('./tree-providers').then(treeProviders => {
            treeProviders.registerTreeProviders(context);
            logger.info('Activity Bar tree providers loaded and registered');
        }).catch(error => {
            logger.error('Failed to load tree providers', error);
        });

        logger.info('Adding subscriptions to context...');
        context.subscriptions.push(
        openTemplateGalleryCommand,
        checkForUpdatesCommand,
        showLogOutputCommand,
        pushToGitHubCommand,
        syncWithGitHubCommand,
        checkGitHubFeedbackCommand,
        checkApprovalStatusCommand,
        triggerApprovalCheckCommand,
        requestReReviewCommand,
        moveToInDevelopmentCommand,
        viewRequirementsDashboardCommand,
        showNetworkStatusCommand,
        showConfigurationHealthCommand,
        useTemplateCommand,
    );

    // Check for updates on startup if enabled
    const autoCheck = vscode.workspace.getConfiguration('scubed').get<boolean>('autoCheckUpdates', true);
    logger.debug('Auto-check updates setting:', autoCheck);
    if (autoCheck) {
        logger.info('Scheduling automatic update check in 5 seconds...');
        setTimeout(() => checkForUpdates(context, true), 5000);
    }

        // Show welcome message on first install
        const hasShownWelcome = context.globalState.get('scubed.hasShownWelcome', false);
        logger.debug('Has shown welcome message:', hasShownWelcome);
        if (!hasShownWelcome) {
            logger.info('Showing welcome message for first-time user');
            showWelcomeMessage(context);
        }
        
        logger.logExtensionEvent('Extension activation completed successfully');
        
    } catch (error) {
        logger.error('Extension activation failed', error as Error);
    }
}



async function openTemplateGallery() {
    logger.logFunctionEntry('openTemplateGallery');
    logger.logUserAction('Opening template gallery');
    
    try {
        // Create a trackable webview panel for the template gallery (TDD enhancement)
        const panel = createTrackedWebviewPanel(
            'scubedTemplateGallery',
            'S-cubed Template Gallery',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            },
            'templateGallery' // Tracking ID for tests
        );
        
        logger.info('Template gallery webview panel created');
        panel.webview.html = getTemplateGalleryHtml();

        // Handle messages from the webview (with tracking for tests)
        panel.webview.onDidReceiveMessage(async (message) => {
            logger.debug('Received message from template gallery webview', message);
            
            // Record message for testing (TDD enhancement)
            webviewTracker.recordMessage('templateGallery', message);
            
            switch (message.command) {
                case 'useTemplate':
                    logger.logUserAction('Template selected', { template: message.template });
                    await useTemplate(message.template);
                    panel.dispose(); // Close the gallery after selection
                    logger.debug('Template gallery panel disposed');
                    break;
                default:
                    logger.warn('Unknown command received from template gallery', message.command);
            }
        });
        
        logger.logFunctionExit('openTemplateGallery');
    } catch (error) {
        logger.error('Failed to open template gallery', error as Error);
    }
}

export async function useTemplate(templateType: string) {
    logger.logFunctionEntry('useTemplate', templateType);
    
    if (!vscode.workspace.workspaceFolders) {
        logger.warn('No workspace folder found when trying to apply template');
        vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    logger.debug('Using workspace root:', workspaceRoot);
    
    try {
        // Show information about the template being applied
        logger.info(`Applying template: ${templateType}`);
        vscode.window.showInformationMessage(`Applying ${templateType} template to your project...`);
        
        // Use the template type directly since we only have one template
        const actualTemplateName = templateType;
        logger.debug('Template type:', templateType, 'mapped to:', actualTemplateName);
        
        // Copy template files from the repository to the current workspace
        // Use improved template path resolution (TDD fix)
        let templatePath: string;
        try {
            templatePath = await resolveTemplatePath(actualTemplateName, __dirname);
            logger.info('Template resolved to:', templatePath);
        } catch (error) {
            if (error instanceof TemplateNotFoundError) {
                logger.error(`Template not found: ${actualTemplateName}`, error);
                vscode.window.showErrorMessage(`Template not found: ${actualTemplateName}. Please ensure the S-cubed templates are available.`);
                return;
            }
            throw error; // Re-throw unexpected errors
        }
        
        logger.info('Template resolved successfully, asking user for confirmation');
        // Ask user for confirmation before applying template
        const choice = await vscode.window.showWarningMessage(
            `Apply ${templateType} template? This will add template files to your current workspace.`,
            'Apply Template',
            'Cancel'
        );
        
        logger.debug('User choice for template application:', choice);
        if (choice !== 'Apply Template') {
            logger.info('User cancelled template application');
            return;
        }
        
        // Copy template files to workspace
        logger.info('Starting template file copy operation');
        logger.logFileOperation('copy', `${templatePath} -> ${workspaceRoot}`);
        
        await fs.copy(templatePath, workspaceRoot, {
            overwrite: false, // Don't overwrite existing files
            filter: (src: string) => {
                // Skip certain directories/files
                const relativePath = path.relative(templatePath, src);
                const fileName = path.basename(src);
                
                // Include template files and directories, but skip scripts and system files
                const shouldInclude = !relativePath.includes('node_modules') && 
                       !relativePath.includes('.git') &&
                       !relativePath.includes('scripts') && // Skip scripts directory
                       !relativePath.startsWith('.') &&
                       (relativePath === '' || // Include root directory
                        fileName.endsWith('.md') || // Include markdown files
                        fileName.endsWith('.json') || // Include JSON files
                        fileName.endsWith('.txt')); // Include text files
                       
                if (!shouldInclude) {
                    logger.debug('Skipping file during template copy:', relativePath);
                }
                return shouldInclude;
            }
        });
        
        logger.info(`Template ${templateType} applied successfully`);
        vscode.window.showInformationMessage(`✅ ${templateType} template applied successfully! Template files have been added to your workspace.`);
        
        logger.logFunctionExit('useTemplate', { success: true, templateType });
        
    } catch (error) {
        logger.error('Failed to apply template', error as Error, { templateType });
    }
}

function getTemplateGalleryHtml(): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>S-cubed Template Gallery</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                padding: 20px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .template-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 20px;
            }
            .template-card {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 20px;
                background: var(--vscode-sideBar-background);
            }
            .template-card h3 {
                margin-top: 0;
                color: var(--vscode-textLink-foreground);
            }
            .template-card p {
                margin: 10px 0;
                color: var(--vscode-descriptionForeground);
            }
            .use-template-btn {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
                margin-top: 10px;
            }
            .use-template-btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🚀 S-cubed Template Gallery</h1>
            <p>Choose from our curated collection of project templates</p>
        </div>
        
        <div class="template-grid">
            <div class="template-card">
                <h3>Requirements Template</h3>
                <p>Complete requirements gathering and documentation template with automated workflows.</p>
                <p><strong>Features:</strong> Discovery prompts, stakeholder management, GitHub integration</p>
                <button class="use-template-btn" onclick="useTemplate('requirements-template')">Use This Template</button>
            </div>
        </div>

        <script>
            function useTemplate(templateType) {
                // Send message to extension
                const vscode = acquireVsCodeApi();
                vscode.postMessage({
                    command: 'useTemplate',
                    template: templateType
                });
            }
        </script>
    </body>
    </html>`;
}

async function showWelcomeMessage(context: vscode.ExtensionContext) {
    const choice = await vscode.window.showInformationMessage(
        'Welcome to S-cubed Requirements Template! 🎉',
        'View Documentation',
        "Don't Show Again"
    );

    switch (choice) {
        case 'View Documentation':
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/scubed-sustainability/scubed-development-process'));
            break;
        case "Don't Show Again":
            context.globalState.update('scubed.hasShownWelcome', true);
            break;
    }
}

// 🟢 GREEN: Tree providers moved to separate tree-providers.ts file (Epic 3 implementation)

// Auto-update functionality
async function checkForUpdates(context: vscode.ExtensionContext, silent: boolean = false) {
    try {
        const config = vscode.workspace.getConfiguration('scubed');
        const updateUrl = config.get<string>('updateCheckUrl', 'https://github.com/scubed-sustainability/scubed-development-process/releases/latest');
        
        // Get current extension version
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        const packageJson = require('../package.json');
        const currentVersion = extension?.packageJSON.version || packageJson.version;
        
        if (!silent) {
            vscode.window.showInformationMessage('Checking for S-cubed extension updates...');
        }
        
        // Check for updates timing
        const lastCheck = context.globalState.get<number>('scubed.lastUpdateCheck', 0);
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Only check once per day for silent checks
        if (silent && (now - lastCheck) < oneDay) {
            return;
        }
        
        // Update last check time
        await context.globalState.update('scubed.lastUpdateCheck', now);
        
        try {
            // Check GitHub API for latest release using authenticated requests to avoid rate limiting
            const apiUrl = 'https://api.github.com/repos/scubed-sustainability/scubed-development-process/releases/latest';
            
            let headers: Record<string, string> = { 
                'User-Agent': 'S-cubed-Extension',
                'Accept': 'application/vnd.github.v3+json'
            };
            
            // Try to get GitHub authentication for higher rate limits
            try {
                const session = await vscode.authentication.getSession('github', ['repo'], { 
                    createIfNone: false // Don't prompt user during update checks
                });
                if (session) {
                    headers['Authorization'] = `token ${session.accessToken}`;
                    logger.debug('Using authenticated GitHub request for update check');
                }
            } catch (authError) {
                // Continue with unauthenticated request if authentication fails
                logger.debug('GitHub authentication not available for update check, using unauthenticated request');
            }
            
            // 🟢 GREEN: Use built-in fetch instead of axios for lighter bundle
            const response = await fetch(apiUrl, {
                headers,
                // Note: fetch doesn't have built-in timeout, but this is acceptable for update checks
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    const rateLimitError = await response.json().catch(() => ({}));
                    if (rateLimitError.message && rateLimitError.message.includes('rate limit')) {
                        throw new Error('GitHub API rate limit exceeded. The extension will retry automatically later.');
                    }
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            const latestVersion = data.tag_name?.replace('v', '') || packageJson.version;
            const downloadUrl = data.assets?.find((asset: any) => asset.name.endsWith('.vsix'))?.browser_download_url;
            const releaseUrl = data.html_url;
            
            if (compareVersions(latestVersion, currentVersion) > 0) {
                // New version available
                const message = `🚀 S-cubed Extension Update Available!\n\nCurrent: v${currentVersion}\nLatest: v${latestVersion}`;
                const choice = await vscode.window.showInformationMessage(
                    message,
                    'One-Click Update',
                    'Download Manually', 
                    'View Release Notes',
                    'Install Instructions'
                );
                
                if (choice === 'One-Click Update') {
                    // Show terminal command for easy update
                    const terminal = vscode.window.createTerminal('S-cubed Update');
                    terminal.sendText('curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash');
                    terminal.show();
                    vscode.window.showInformationMessage('🚀 Update command sent to terminal! Press Enter to run it.');
                } else if (choice === 'Download Manually' && downloadUrl) {
                    vscode.env.openExternal(vscode.Uri.parse(downloadUrl));
                } else if (choice === 'View Release Notes' && releaseUrl) {
                    vscode.env.openExternal(vscode.Uri.parse(releaseUrl));
                } else if (choice === 'Install Instructions') {
                    showUpdateInstructions(latestVersion, downloadUrl);
                }
            } else if (!silent) {
                // Up to date
                vscode.window.showInformationMessage(
                    `✅ S-cubed Extension is up to date (v${currentVersion})`
                );
            }
            
        } catch (apiError) {
            // Fallback to manual instructions if API fails
            logger.warn('Update check failed:', apiError);
            if (!silent) {
                const errorMsg = (apiError as Error).message || 'Unknown error';
                const isRateLimit = errorMsg.includes('rate limit');
                
                const message = isRateLimit 
                    ? `Current S-cubed extension version: v${currentVersion}\n\n⚠️ Update check temporarily unavailable due to GitHub rate limits.\nTry again later or check manually.`
                    : `Current S-cubed extension version: v${currentVersion}\n\n⚠️ Could not check for updates automatically.\nPlease check GitHub releases manually.`;
                
                const choice = await vscode.window.showWarningMessage(
                    message,
                    'Open GitHub Releases',
                    'Show Install Instructions'
                );
                
                if (choice === 'Open GitHub Releases') {
                    vscode.env.openExternal(vscode.Uri.parse(updateUrl));
                } else if (choice === 'Show Install Instructions') {
                    showUpdateInstructions();
                }
            }
        }
        
    } catch (error) {
        if (!silent) {
            vscode.window.showErrorMessage(`Failed to check for updates: ${error}`);
        }
    }
}

// Simple version comparison function
function compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(n => parseInt(n, 10));
    const bParts = b.split('.').map(n => parseInt(n, 10));
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aPart = aParts[i] || 0;
        const bPart = bParts[i] || 0;
        
        if (aPart > bPart) return 1;
        if (aPart < bPart) return -1;
    }
    
    return 0;
}

function showUpdateInstructions(latestVersion?: string, downloadUrl?: string) {
    const panel = vscode.window.createWebviewPanel(
        'scubedUpdateInstructions',
        'S-cubed Extension Update Instructions',
        vscode.ViewColumn.One,
        { enableScripts: false }
    );

    const versionInfo = latestVersion ? `<div class="update-info">
        <h2>🚀 Update Available: v${latestVersion}</h2>
        ${downloadUrl ? `<p><strong>Direct Download:</strong> <a href="${downloadUrl}">Download .vsix file</a></p>` : ''}
    </div>` : '';

    panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Update Instructions</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                padding: 20px;
                background: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                line-height: 1.6;
            }
            .update-info {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: center;
            }
            .update-info a {
                color: var(--vscode-button-foreground);
                text-decoration: underline;
            }
            .step {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                background: var(--vscode-sideBar-background);
            }
            .step h3 {
                margin-top: 0;
                color: var(--vscode-textLink-foreground);
            }
            code {
                background: var(--vscode-textCodeBlock-background);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Consolas', 'Monaco', monospace;
            }
            .recommended {
                background: var(--vscode-inputValidation-infoBackground);
                border-left: 4px solid var(--vscode-inputValidation-infoBorder);
                padding: 10px;
                margin: 15px 0;
            }
            .command {
                background: var(--vscode-textCodeBlock-background);
                padding: 10px;
                border-radius: 4px;
                font-family: 'Consolas', 'Monaco', monospace;
                margin: 10px 0;
            }
        </style>
    </head>
    <body>
        <h1>🔄 S-cubed Extension Update Instructions</h1>
        
        ${versionInfo}
        
        <div class="recommended">
            <strong>✨ Recommended:</strong> Use our one-click install script for the easiest experience!
        </div>
        
        <div class="step">
            <h3>Method 1: One-Click Install Script (Recommended)</h3>
            <p>Run this command in your terminal:</p>
            <div class="command">curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash</div>
            <p>This script will:</p>
            <ul>
                <li>Download the latest version automatically</li>
                <li>Uninstall the old version</li>
                <li>Install the new version</li>
                <li>Clean up temporary files</li>
            </ul>
        </div>
        
        <div class="step">
            <h3>Method 2: Manual Download & Install</h3>
            <ol>
                <li>Visit: <code>https://github.com/scubed-sustainability/scubed-development-process/releases/latest</code></li>
                <li>Download the <code>.vsix</code> file</li>
                <li>Go to Extensions view (<code>Cmd+Shift+X</code>)</li>
                <li>Find "S-cubed Development Process" and uninstall it</li>
                <li>Click "..." → "Install from VSIX..."</li>
                <li>Select the downloaded file</li>
                <li>Restart VS Code if prompted</li>
            </ol>
        </div>
        
        <div class="step">
            <h3>Method 3: Team Shared Link</h3>
            <p>Your team lead can share this link for easy access:</p>
            <div class="command">https://github.com/scubed-sustainability/scubed-development-process/releases/latest</div>
            <p>Everyone can bookmark this link to always get the latest version.</p>
        </div>
        
        <div class="step">
            <h3>🎉 Benefits of GitHub Releases</h3>
            <ul>
                <li><strong>Always Latest:</strong> No more sharing .vsix files manually</li>
                <li><strong>Version History:</strong> See what's new in each release</li>
                <li><strong>Team Access:</strong> Everyone gets the same version</li>
                <li><strong>Automatic Notifications:</strong> Extension checks for updates daily</li>
            </ul>
        </div>
    </body>
    </html>`;
}

// GitHub Integration Functions

async function pushRequirementsToGitHub() {
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Executing GitHub Workflow',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Starting complete GitHub integration workflow...' });
            
            // Execute complete workflow using the new service
            const workflowStatus = await githubWorkflowService.executeCompleteWorkflow();
            
            progress.report({ increment: 100, message: 'Workflow completed successfully!' });
            
            const choice = await vscode.window.showInformationMessage(
                `✅ GitHub workflow completed!\n` +
                `Issue #${workflowStatus.issueNumber} created and tracking initiated.`,
                'View Dashboard',
                'View on GitHub'
            );
            
            if (choice === 'View Dashboard') {
                await checkApprovalStatus();
            } else if (choice === 'View on GitHub') {
                const config = vscode.workspace.getConfiguration('scubed.github');
                const repository = config.get<string>('repository', '');
                if (repository && workflowStatus.issueNumber) {
                    const url = `${repository}/issues/${workflowStatus.issueNumber}`;
                    vscode.env.openExternal(vscode.Uri.parse(url));
                }
            }
        });
    } catch (error: any) {
        logger.error('GitHub workflow execution failed', error);
        vscode.window.showErrorMessage(`GitHub workflow failed: ${error.message}`);
    }
}

async function syncWithGitHub() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
        return;
    }

    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Syncing with GitHub',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Initializing GitHub connection...' });

            const initialized = await gitHubService.initialize();
            if (!initialized) {
                return;
            }

            progress.report({ increment: 50, message: 'Checking for updates...' });

            // Read project metadata to find GitHub issues
            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const projectJsonPath = path.join(workspaceRoot, 'project.json');

            if (await fs.pathExists(projectJsonPath)) {
                const projectData = await fs.readJson(projectJsonPath);
                
                if (projectData.github && projectData.github.issues) {
                    let updatesFound = 0;
                    
                    for (const issueData of projectData.github.issues) {
                        const updates = await gitHubService.checkForUpdates(issueData.number);
                        if (updates.length > 0) {
                            updatesFound += updates.length;
                        }
                    }

                    progress.report({ increment: 100, message: 'Sync complete!' });

                    if (updatesFound > 0) {
                        vscode.window.showInformationMessage(
                            `Found ${updatesFound} new updates on GitHub requirements.`,
                            'Check Feedback'
                        ).then(action => {
                            if (action === 'Check Feedback') {
                                checkGitHubFeedback();
                            }
                        });
                    } else {
                        vscode.window.showInformationMessage('No new updates found on GitHub.');
                    }
                } else {
                    vscode.window.showWarningMessage('No GitHub integration data found in project metadata.');
                }
            } else {
                vscode.window.showWarningMessage('No project.json file found. Initialize project first.');
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to sync with GitHub: ${error}`);
    }
}

async function checkGitHubFeedback() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
        return;
    }

    try {
        const initialized = await gitHubService.initialize();
        if (!initialized) {
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const projectJsonPath = path.join(workspaceRoot, 'project.json');

        if (!(await fs.pathExists(projectJsonPath))) {
            vscode.window.showWarningMessage('No project metadata found. Push requirements to GitHub first.');
            return;
        }

        const projectData = await fs.readJson(projectJsonPath);
        
        if (!projectData.github || !projectData.github.issues) {
            vscode.window.showWarningMessage('No GitHub integration data found. Push requirements to GitHub first.');
            return;
        }

        // Check each GitHub issue for updates
        const issueUpdates = [];
        
        for (const issueData of projectData.github.issues) {
            const updates = await gitHubService.checkForUpdates(issueData.number);
            if (updates.length > 0) {
                issueUpdates.push({
                    issue: issueData,
                    updates: updates
                });
            }
        }

        if (issueUpdates.length === 0) {
            vscode.window.showInformationMessage('No new feedback found on GitHub requirements.');
            return;
        }

        // Show feedback summary
        const feedbackSummary = issueUpdates.map(item => {
            const latestUpdate = item.updates[item.updates.length - 1];
            return {
                label: `Issue #${item.issue.number}: ${item.updates.length} new comment(s)`,
                description: `Latest: ${latestUpdate.user.login}`,
                detail: latestUpdate.body?.substring(0, 100) + '...',
                issue: item.issue
            };
        });

        const selectedFeedback = await vscode.window.showQuickPick(feedbackSummary, {
            placeHolder: 'Select feedback to view',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selectedFeedback) {
            // Open GitHub issue in browser
            const config = gitHubService.getConfig();
            if (config) {
                const issueUrl = `https://github.com/${config.owner}/${config.repo}/issues/${selectedFeedback.issue.number}`;
                vscode.env.openExternal(vscode.Uri.parse(issueUrl));
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to check GitHub feedback: ${error}`);
    }
}

// Helper Functions

async function findRequirementsFiles(workspaceRoot: string): Promise<string[]> {
    const requirementsFiles: string[] = [];
    
    try {
        // Common locations for requirements files
        const searchPaths = [
            'requirements.md',
            'docs/requirements.md',
            'docs/requirements/',
            'requirements/',
            'REQUIREMENTS.md'
        ];

        for (const searchPath of searchPaths) {
            const fullPath = path.join(workspaceRoot, searchPath);
            
            if (await fs.pathExists(fullPath)) {
                const stat = await fs.stat(fullPath);
                
                if (stat.isFile() && path.extname(fullPath) === '.md') {
                    requirementsFiles.push(fullPath);
                } else if (stat.isDirectory()) {
                    // Search for markdown files in directory
                    const files = await fs.readdir(fullPath);
                    for (const file of files) {
                        if (path.extname(file) === '.md') {
                            requirementsFiles.push(path.join(fullPath, file));
                        }
                    }
                }
            }
        }

        // Also search for any markdown files containing "requirement" in the name
        const allFiles = await fs.readdir(workspaceRoot);
        for (const file of allFiles) {
            if (file.toLowerCase().includes('requirement') && path.extname(file) === '.md') {
                const fullPath = path.join(workspaceRoot, file);
                if (!requirementsFiles.includes(fullPath)) {
                    requirementsFiles.push(fullPath);
                }
            }
        }

    } catch (error) {
        console.error('Error finding requirements files:', error);
    }

    return requirementsFiles;
}

async function updateProjectMetadata(issue: any, discussion: any) {
    if (!vscode.workspace.workspaceFolders) {
        return;
    }

    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const projectJsonPath = path.join(workspaceRoot, 'project.json');

        let projectData: any = {};
        
        if (await fs.pathExists(projectJsonPath)) {
            projectData = await fs.readJson(projectJsonPath);
        }

        // Initialize GitHub integration data
        if (!projectData.github) {
            projectData.github = {
                issues: [],
                discussions: []
            };
        }

        // Add issue data
        projectData.github.issues.push({
            number: issue.number,
            url: issue.html_url,
            title: issue.title,
            created: new Date().toISOString()
        });

        // Add discussion data if available
        if (discussion) {
            projectData.github.discussions.push({
                id: discussion.id,
                url: discussion.url,
                number: discussion.number,
                created: new Date().toISOString()
            });
        }

        await fs.writeJson(projectJsonPath, projectData, { spaces: 2 });
        
        vscode.window.showInformationMessage('Project metadata updated with GitHub integration info.');

    } catch (error) {
        console.error('Failed to update project metadata:', error);
    }
}

// Approval Workflow Functions

async function checkApprovalStatus() {
    try {
        // 🟢 GREEN: Updated to use GitHubWorkflowService (TDD implementation)
        await githubWorkflowService.showApprovalDashboard();
    } catch (error: any) {
        logger.error('Failed to check approval status', error);
        vscode.window.showErrorMessage(`Failed to check approval status: ${error.message}`);
    }
}

async function triggerApprovalCheck() {
    try {
        // 🟢 GREEN: Updated to use GitHubWorkflowService (TDD implementation)
        const workflowStatus = githubWorkflowService.getCurrentWorkflowStatus();
        if (!workflowStatus?.issueNumber) {
            vscode.window.showErrorMessage('No active workflow found. Please push requirements to GitHub first.');
            return;
        }

        const approvalStatus = await githubWorkflowService.getApprovalStatus();
        
        const message = `📊 **Approval Check Results**\n\n` +
            `**Approved:** ${approvalStatus.approvedCount}\n` +
            `**Changes Requested:** ${approvalStatus.changesRequestedCount}\n` +
            `**Pending:** ${approvalStatus.pendingCount}\n` +
            `**Total Reviewers:** ${approvalStatus.totalReviewers}`;
            
        await vscode.window.showInformationMessage(message, 'View Dashboard', 'OK');
        
    } catch (error: any) {
        logger.error('Failed to trigger approval check', error);
        vscode.window.showErrorMessage(`Failed to trigger approval check: ${error.message}`);
    }
}

async function requestReReview() {
    try {
        // 🟢 GREEN: Updated to use GitHubWorkflowService (TDD implementation)
        await githubWorkflowService.requestReReview();
    } catch (error: any) {
        logger.error('Failed to request re-review', error);
        vscode.window.showErrorMessage(`Failed to request re-review: ${error.message}`);
    }
}

async function moveToInDevelopment() {
    try {
        // 🟢 GREEN: Updated to use GitHubWorkflowService (TDD implementation)
        await githubWorkflowService.moveToInDevelopment();
    } catch (error: any) {
        logger.error('Failed to move to development', error);
        vscode.window.showErrorMessage(`Failed to move to development: ${error.message}`);
    }
}

async function viewRequirementsDashboard() {
    try {
        // 🟢 GREEN: Updated to use GitHubWorkflowService (TDD implementation)
        await githubWorkflowService.showApprovalDashboard();
    } catch (error: any) {
        logger.error('Failed to view requirements dashboard', error);
        vscode.window.showErrorMessage(`Failed to view requirements dashboard: ${error.message}`);
    }
}

export function deactivate() {
    // Cleanup services
    if (autoSyncService) {
        autoSyncService.dispose();
        logger.info('AutoSyncService disposed');
    }
    
    if (stakeholderService) {
        stakeholderService.clearCache();
        logger.info('StakeholderService cache cleared');
    }
    
    logger.logExtensionEvent('Extension deactivated');
}
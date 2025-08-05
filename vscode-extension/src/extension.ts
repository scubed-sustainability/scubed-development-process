import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as axios from 'axios';
import * as yauzl from 'yauzl';
import { GitHubService } from './github-service';
import { ValidationService } from './validation-service';

let gitHubService: GitHubService;
let validationService: ValidationService;

export function activate(context: vscode.ExtensionContext) {
    console.log('S-cubed Requirements Template extension is now active!');

    // Initialize services
    gitHubService = new GitHubService();
    validationService = new ValidationService();

    // Register commands
    const createProjectCommand = vscode.commands.registerCommand('scubed.createProject', createProject);
    const initializeProjectCommand = vscode.commands.registerCommand('scubed.initializeProject', initializeProject);
    const generatePromptsCommand = vscode.commands.registerCommand('scubed.generatePrompts', generatePrompts);
    const openTemplateGalleryCommand = vscode.commands.registerCommand('scubed.openTemplateGallery', openTemplateGallery);
    const checkForUpdatesCommand = vscode.commands.registerCommand('scubed.checkForUpdates', () => checkForUpdates(context));
    
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

    // Register tree data providers for the activity bar views
    const projectTemplatesProvider = new ProjectTemplatesProvider();
    const quickActionsProvider = new QuickActionsProvider();
    
    vscode.window.registerTreeDataProvider('scubed.projectTemplates', projectTemplatesProvider);
    vscode.window.registerTreeDataProvider('scubed.quickActions', quickActionsProvider);

    context.subscriptions.push(
        createProjectCommand,
        initializeProjectCommand,
        generatePromptsCommand,
        openTemplateGalleryCommand,
        checkForUpdatesCommand,
        pushToGitHubCommand,
        syncWithGitHubCommand,
        checkGitHubFeedbackCommand,
        checkApprovalStatusCommand,
        triggerApprovalCheckCommand,
        requestReReviewCommand,
        moveToInDevelopmentCommand,
        viewRequirementsDashboardCommand
    );

    // Check for updates on startup if enabled
    const autoCheck = vscode.workspace.getConfiguration('scubed').get<boolean>('autoCheckUpdates', true);
    if (autoCheck) {
        // Delay the check to avoid startup delays
        setTimeout(() => checkForUpdates(context, true), 5000);
    }

    // Show welcome message on first install
    const hasShownWelcome = context.globalState.get('scubed.hasShownWelcome', false);
    if (!hasShownWelcome) {
        showWelcomeMessage(context);
    }
}

async function createProject() {
    try {
        // Get project details from user
        const projectName = await vscode.window.showInputBox({
            prompt: 'Enter project name',
            placeHolder: 'my-awesome-project',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Project name is required';
                }
                if (!/^[a-z0-9-_]+$/i.test(value)) {
                    return 'Project name can only contain letters, numbers, hyphens, and underscores';
                }
                return null;
            }
        });

        if (!projectName) {
            return;
        }

        // Get project location
        const defaultPath = vscode.workspace.getConfiguration('scubed').get<string>('defaultProjectPath') || '';
        const folders = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Project Location',
            defaultUri: defaultPath ? vscode.Uri.file(defaultPath) : undefined
        });

        if (!folders || folders.length === 0) {
            return;
        }

        const projectPath = path.join(folders[0].fsPath, projectName);

        // Check if directory exists and is not empty
        if (await fs.pathExists(projectPath)) {
            const files = await fs.readdir(projectPath);
            if (files.length > 0) {
                const choice = await vscode.window.showWarningMessage(
                    `Directory ${projectPath} is not empty. Continue?`,
                    'Yes, Continue',
                    'Cancel'
                );
                if (choice !== 'Yes, Continue') {
                    return;
                }
            }
        }

        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Creating S-cubed Project',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Downloading template...' });
            
            // Download and extract template
            await downloadAndExtractTemplate(projectPath, progress);
            
            progress.report({ increment: 70, message: 'Initializing project...' });
            
            // Update project configuration
            await updateProjectConfig(projectPath, projectName);
            
            progress.report({ increment: 90, message: 'Opening project...' });
            
            // Open the new project
            const uri = vscode.Uri.file(projectPath);
            await vscode.commands.executeCommand('vscode.openFolder', uri, false);
            
            progress.report({ increment: 100, message: 'Complete!' });
        });

        // Show success message
        const choice = await vscode.window.showInformationMessage(
            `Project '${projectName}' created successfully! 🎉`,
            'Initialize Project',
            'Generate Prompts'
        );

        // Auto-run initialization if enabled
        if (vscode.workspace.getConfiguration('scubed').get<boolean>('autoInitialize')) {
            if (choice === 'Initialize Project') {
                await initializeProject();
            } else if (choice === 'Generate Prompts') {
                await generatePrompts();
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create project: ${error}`);
    }
}

async function downloadAndExtractTemplate(projectPath: string, progress: vscode.Progress<{ increment?: number; message?: string }>) {
    const config = vscode.workspace.getConfiguration('scubed');
    const templateSource = config.get<string>('templateSource') || 'https://github.com/scubed-sustainability/scubed-development-process/archive/refs/heads/main.zip';
    
    // Create project directory
    await fs.ensureDir(projectPath);
    
    // Download template
    const response = await axios.default.get(templateSource, { responseType: 'arraybuffer' });
    const zipBuffer = Buffer.from(response.data);
    
    progress.report({ increment: 30, message: 'Extracting template...' });
    
    // Extract zip file
    return new Promise<void>((resolve, reject) => {
        yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err: Error | null, zipfile?: yauzl.ZipFile) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!zipfile) {
                reject(new Error('Failed to read zip file'));
                return;
            }

            zipfile.readEntry();
            zipfile.on('entry', (entry: yauzl.Entry) => {
                // Skip directories and unwanted files
                if (/\/$/.test(entry.fileName) || 
                    entry.fileName.includes('.git/') ||
                    entry.fileName.endsWith('install.ps1')) {
                    zipfile.readEntry();
                    return;
                }

                // Remove the root folder from path (e.g., requirements-template-main/)
                const pathParts = entry.fileName.split('/');
                pathParts.shift(); // Remove first part
                const relativePath = pathParts.join('/');
                
                if (!relativePath) {
                    zipfile.readEntry();
                    return;
                }

                const outputPath = path.join(projectPath, relativePath);
                
                // Ensure directory exists
                fs.ensureDirSync(path.dirname(outputPath));
                
                zipfile.openReadStream(entry, (err: Error | null, readStream?: NodeJS.ReadableStream) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!readStream) {
                        zipfile.readEntry();
                        return;
                    }

                    const writeStream = fs.createWriteStream(outputPath);
                    readStream.pipe(writeStream);
                    writeStream.on('close', () => {
                        zipfile.readEntry();
                    });
                });
            });

            zipfile.on('end', () => {
                resolve();
            });

            zipfile.on('error', (err: Error) => {
                reject(err);
            });
        });
    });
}

async function updateProjectConfig(projectPath: string, projectName: string) {
    const projectJsonPath = path.join(projectPath, 'project.json');
    
    if (await fs.pathExists(projectJsonPath)) {
        const projectJson = await fs.readJson(projectJsonPath);
        projectJson.name = projectName;
        projectJson.created = new Date().toISOString().split('T')[0];
        projectJson.createdBy = 'S-cubed VS Code Extension';
        
        await fs.writeJson(projectJsonPath, projectJson, { spaces: 2 });
    }
}

async function initializeProject() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Initializing S-cubed Project',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Running initialization script...' });
            
            // Run the Python initialization script
            const initScriptPath = path.join(workspaceRoot, 'scripts', 'init_project.py');
            
            if (await fs.pathExists(initScriptPath)) {
                const terminal = vscode.window.createTerminal('S-cubed Initialize');
                terminal.sendText(`python "${initScriptPath}"`);
                terminal.show();
                
                progress.report({ increment: 100, message: 'Initialization complete!' });
            } else {
                throw new Error('Initialization script not found. Make sure you created the project from the S-cubed template.');
            }
        });

        vscode.window.showInformationMessage('Project initialized successfully! Check the terminal for details.');
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to initialize project: ${error}`);
    }
}

async function generatePrompts() {
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
        return;
    }

    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
    
    try {
        const terminal = vscode.window.createTerminal('S-cubed Generate Prompts');
        const scriptPath = path.join(workspaceRoot, 'scripts', 'generate_prompts.py');
        terminal.sendText(`python "${scriptPath}"`);
        terminal.show();

        vscode.window.showInformationMessage('Generating discovery prompts... Check the terminal for progress.');
        
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to generate prompts: ${error}`);
    }
}

async function openTemplateGallery() {
    // Create a webview panel for the template gallery
    const panel = vscode.window.createWebviewPanel(
        'scubedTemplateGallery',
        'S-cubed Template Gallery',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getTemplateGalleryHtml();
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
                <h3>AI-Enabled Development</h3>
                <p>Complete template with Claude integration, Microsoft Loop, and automated documentation workflows.</p>
                <p><strong>Features:</strong> Discovery prompts, Loop integration, automated docs</p>
                <button class="use-template-btn" onclick="useTemplate('ai-development')">Use This Template</button>
            </div>
            
            <div class="template-card">
                <h3>Minimal Requirements</h3>
                <p>Lightweight template focused on requirements gathering and documentation.</p>
                <p><strong>Features:</strong> Basic structure, requirements templates</p>
                <button class="use-template-btn" onclick="useTemplate('minimal')">Use This Template</button>
            </div>
            
            <div class="template-card">
                <h3>Enterprise Project</h3>
                <p>Full-featured template for large enterprise projects with compliance and governance.</p>
                <p><strong>Features:</strong> Compliance docs, governance, stakeholder management</p>
                <button class="use-template-btn" onclick="useTemplate('enterprise')">Use This Template</button>
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
        'Create New Project',
        'View Documentation',
        "Don't Show Again"
    );

    switch (choice) {
        case 'Create New Project':
            await createProject();
            break;
        case 'View Documentation':
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/scubed-sustainability/scubed-development-process'));
            break;
        case "Don't Show Again":
            context.globalState.update('scubed.hasShownWelcome', true);
            break;
    }
}

// Tree Data Providers for Activity Bar Views
class ProjectTemplatesProvider implements vscode.TreeDataProvider<TemplateItem> {
    getTreeItem(element: TemplateItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TemplateItem): Thenable<TemplateItem[]> {
        if (!element) {
            return Promise.resolve([
                new TemplateItem('Requirements Template', 'AI-powered requirements gathering', vscode.TreeItemCollapsibleState.None, {
                    command: 'scubed.createProject',
                    title: 'Create Project',
                    arguments: ['requirements']
                }),
                new TemplateItem('API Development', 'REST API development template', vscode.TreeItemCollapsibleState.None, {
                    command: 'scubed.createProject',
                    title: 'Create Project',
                    arguments: ['api']
                }),
                new TemplateItem('Data Pipeline', 'Data processing template', vscode.TreeItemCollapsibleState.None, {
                    command: 'scubed.createProject',
                    title: 'Create Project',
                    arguments: ['data']
                })
            ]);
        }
        return Promise.resolve([]);
    }
}

class QuickActionsProvider implements vscode.TreeDataProvider<ActionItem> {
    getTreeItem(element: ActionItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ActionItem): Thenable<ActionItem[]> {
        if (!element) {
            return Promise.resolve([
                new ActionItem('Create New Project', '$(add) Create from template', {
                    command: 'scubed.createProject',
                    title: 'Create New Project'
                }),
                new ActionItem('Initialize Project', '$(folder-opened) Setup current folder', {
                    command: 'scubed.initializeProject',
                    title: 'Initialize Project'
                }),
                new ActionItem('Generate Prompts', '$(comment-discussion) Create Claude prompts', {
                    command: 'scubed.generatePrompts',
                    title: 'Generate Prompts'
                }),
                new ActionItem('Template Gallery', '$(library) Browse templates', {
                    command: 'scubed.openTemplateGallery',
                    title: 'Open Gallery'
                }),
                new ActionItem('Check for Updates', '$(cloud-download) Update extension', {
                    command: 'scubed.checkForUpdates',
                    title: 'Check for Updates'
                })
            ]);
        }
        return Promise.resolve([]);
    }
}

class TemplateItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
        this.tooltip = description;
        this.description = description;
        this.iconPath = new vscode.ThemeIcon('file-directory');
    }
}

class ActionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly command?: vscode.Command
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = label;
        this.description = description;
        this.iconPath = new vscode.ThemeIcon('play');
    }
}

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
            // Check GitHub API for latest release
            const apiUrl = 'https://api.github.com/repos/scubed-sustainability/scubed-development-process/releases/latest';
            const response = await axios.default.get(apiUrl, {
                headers: { 'User-Agent': 'S-cubed-Extension' },
                timeout: 10000
            });
            
            const latestVersion = response.data.tag_name?.replace('v', '') || packageJson.version;
            const downloadUrl = response.data.assets?.find((asset: any) => asset.name.endsWith('.vsix'))?.browser_download_url;
            const releaseUrl = response.data.html_url;
            
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
            if (!silent) {
                const choice = await vscode.window.showWarningMessage(
                    `Current S-cubed extension version: v${currentVersion}\n\n⚠️ Could not check for updates automatically.\nPlease check GitHub releases manually.`,
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
    if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
        return;
    }

    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Pushing Requirements to GitHub',
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 0, message: 'Initializing GitHub connection...' });

            // Initialize GitHub service
            const initialized = await gitHubService.initialize();
            if (!initialized) {
                return;
            }

            progress.report({ increment: 20, message: 'Finding requirements files...' });

            // Find requirements files in the workspace
            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const requirementsFiles = await findRequirementsFiles(workspaceRoot);

            if (requirementsFiles.length === 0) {
                vscode.window.showWarningMessage('No requirements files found. Create a requirements document first.');
                return;
            }

            progress.report({ increment: 30, message: 'Processing requirements documents...' });

            // Let user select which file to push if multiple exist
            let selectedFile: string;
            if (requirementsFiles.length === 1) {
                selectedFile = requirementsFiles[0];
            } else {
                const fileOptions = requirementsFiles.map(file => ({
                    label: path.basename(file),
                    description: path.relative(workspaceRoot, file),
                    detail: file
                }));

                const selected = await vscode.window.showQuickPick(fileOptions, {
                    placeHolder: 'Select requirements file to push to GitHub'
                });

                if (!selected) {
                    return;
                }
                selectedFile = selected.detail;
            }

            progress.report({ increment: 40, message: 'Validating file structure...' });

            // Validate file structure before parsing
            const structureValidation = await validationService.validateFileStructure(selectedFile);
            if (!structureValidation.isValid) {
                const canProceed = await validationService.showValidationResults(structureValidation, path.basename(selectedFile));
                if (!canProceed) {
                    return;
                }
            }

            progress.report({ increment: 50, message: 'Parsing requirements document...' });

            // Parse the requirements file
            const requirementData = await gitHubService.parseRequirementsFile(selectedFile);
            if (!requirementData) {
                vscode.window.showErrorMessage('Failed to parse requirements file. Please check the file format.');
                return;
            }

            progress.report({ increment: 60, message: 'Validating requirements data...' });

            // Validate parsed requirements data
            const validation = await validationService.validateRequirements(requirementData);
            const canProceed = await validationService.showValidationResults(validation, requirementData.title);
            
            if (!canProceed) {
                vscode.window.showInformationMessage('Requirements push cancelled. Please fix the issues and try again.');
                return;
            }

            progress.report({ increment: 80, message: 'Creating GitHub issue and discussion...' });

            // Create GitHub issue
            const issue = await gitHubService.createRequirementIssue(requirementData);
            if (!issue) {
                return;
            }

            // Create GitHub discussion
            const discussion = await gitHubService.createRequirementDiscussion(requirementData, issue.number);

            progress.report({ increment: 100, message: 'Complete!' });

            // Show success message with options
            const action = await vscode.window.showInformationMessage(
                `Requirements pushed to GitHub successfully! 🎉\nIssue #${issue.number} created.`,
                'View Issue',
                'View Discussion',
                'Update Project Metadata'
            );

            if (action === 'View Issue') {
                vscode.env.openExternal(vscode.Uri.parse(issue.html_url));
            } else if (action === 'View Discussion' && discussion) {
                vscode.env.openExternal(vscode.Uri.parse(discussion.url));
            } else if (action === 'Update Project Metadata') {
                await updateProjectMetadata(issue, discussion);
            }
        });

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to push requirements to GitHub: ${error}`);
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
        if (!await gitHubService.initialize()) {
            return;
        }

        const issues = await gitHubService.getAllRequirementIssues();
        if (issues.length === 0) {
            vscode.window.showInformationMessage('No requirement issues found.');
            return;
        }

        const options = issues.map(issue => ({
            label: `#${issue.number}: ${issue.title}`,
            description: `Status: ${issue.status}`,
            detail: issue.approvalStatus ? 
                `${issue.approvalStatus.approvalCount}/${issue.approvalStatus.totalStakeholders} stakeholders approved` : 
                'Click to check approval status',
            issue
        }));

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select requirement to check approval status'
        });

        if (selected) {
            const approvalStatus = await gitHubService.checkApprovalStatus(selected.issue.number);
            
            if (approvalStatus.isApproved) {
                vscode.window.showInformationMessage(
                    `✅ Requirements #${selected.issue.number} APPROVED by all ${approvalStatus.totalStakeholders} stakeholders: ${approvalStatus.approvedBy.join(', ')}`
                );
            } else {
                vscode.window.showInformationMessage(
                    `⏳ Requirements #${selected.issue.number}: ${approvalStatus.approvalCount}/${approvalStatus.totalStakeholders} approved. Waiting for: ${approvalStatus.pendingApprovals.join(', ')}`
                );
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to check approval status: ${error}`);
    }
}

async function triggerApprovalCheck() {
    try {
        if (!await gitHubService.initialize()) {
            return;
        }

        const issues = await gitHubService.getAllRequirementIssues();
        const pendingIssues = issues.filter(issue => issue.status === 'pending-review');

        if (pendingIssues.length === 0) {
            vscode.window.showInformationMessage('No pending requirement issues found.');
            return;
        }

        const options = pendingIssues.map(issue => ({
            label: `#${issue.number}: ${issue.title}`,
            description: 'Pending review',
            issue
        }));

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select requirement to check for approval'
        });

        if (selected) {
            const success = await gitHubService.triggerApprovalCheck(selected.issue.number);
            if (success) {
                vscode.window.showInformationMessage('Approval check completed! Check GitHub for updates.');
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to trigger approval check: ${error}`);
    }
}

async function requestReReview() {
    try {
        if (!await gitHubService.initialize()) {
            return;
        }

        const issues = await gitHubService.getAllRequirementIssues();
        const pendingIssues = issues.filter(issue => issue.status === 'pending-review');

        if (pendingIssues.length === 0) {
            vscode.window.showInformationMessage('No pending requirement issues found.');
            return;
        }

        const options = pendingIssues.map(issue => ({
            label: `#${issue.number}: ${issue.title}`,
            description: issue.approvalStatus ? 
                `${issue.approvalStatus.approvalCount}/${issue.approvalStatus.totalStakeholders} approved` : 
                'Check approval status',
            issue
        }));

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select requirement for re-review request'
        });

        if (selected) {
            const success = await gitHubService.requestReReview(selected.issue.number);
            if (success) {
                vscode.window.showInformationMessage('Re-review requested! Stakeholders have been notified.');
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to request re-review: ${error}`);
    }
}

async function moveToInDevelopment() {
    try {
        if (!await gitHubService.initialize()) {
            return;
        }

        const issues = await gitHubService.getAllRequirementIssues();
        const approvedIssues = issues.filter(issue => issue.status === 'approved');

        if (approvedIssues.length === 0) {
            vscode.window.showInformationMessage('No approved requirement issues found.');
            return;
        }

        const options = approvedIssues.map(issue => ({
            label: `#${issue.number}: ${issue.title}`,
            description: 'Approved - Ready for development',
            issue
        }));

        const selected = await vscode.window.showQuickPick(options, {
            placeHolder: 'Select requirement to move to development'
        });

        if (selected) {
            const success = await gitHubService.moveToInDevelopment(selected.issue.number);
            if (success) {
                vscode.window.showInformationMessage('Requirements moved to In Development status!');
            }
        }

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to move to development: ${error}`);
    }
}

async function viewRequirementsDashboard() {
    try {
        if (!await gitHubService.initialize()) {
            return;
        }

        const issues = await gitHubService.getAllRequirementIssues();
        if (issues.length === 0) {
            vscode.window.showInformationMessage('No requirement issues found.');
            return;
        }

        // Create dashboard content
        const dashboardContent = [
            '# 📋 Requirements Dashboard',
            '',
            `**Total Requirements:** ${issues.length}`,
            '',
            '## Status Overview',
            `- 📝 Pending Review: ${issues.filter(i => i.status === 'pending-review').length}`,
            `- ✅ Approved: ${issues.filter(i => i.status === 'approved').length}`,
            `- 🚧 In Development: ${issues.filter(i => i.status === 'in-development').length}`,
            `- ❌ Rejected: ${issues.filter(i => i.status === 'rejected').length}`,
            '',
            '## Requirements List',
            ''
        ];

        // Group by status
        const statusGroups = {
            'pending-review': '📝 Pending Review',
            'approved': '✅ Approved', 
            'in-development': '🚧 In Development',
            'rejected': '❌ Rejected'
        };

        for (const [status, icon] of Object.entries(statusGroups)) {
            const statusIssues = issues.filter(issue => issue.status === status);
            if (statusIssues.length > 0) {
                dashboardContent.push(`### ${icon}`);
                dashboardContent.push('');
                
                for (const issue of statusIssues) {
                    let statusDetail = '';
                    if (issue.approvalStatus && status === 'pending-review') {
                        statusDetail = ` (${issue.approvalStatus.approvalCount}/${issue.approvalStatus.totalStakeholders} approved)`;
                    }
                    
                    dashboardContent.push(`- [#${issue.number}: ${issue.title}](${issue.url})${statusDetail}`);
                }
                dashboardContent.push('');
            }
        }

        dashboardContent.push('---');
        dashboardContent.push('*Dashboard generated by S-cubed VSCode Extension*');

        // Create and show document
        const doc = await vscode.workspace.openTextDocument({
            content: dashboardContent.join('\n'),
            language: 'markdown'
        });

        await vscode.window.showTextDocument(doc);

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to view requirements dashboard: ${error}`);
    }
}

export function deactivate() {}
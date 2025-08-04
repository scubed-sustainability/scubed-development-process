import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as axios from 'axios';
import * as yauzl from 'yauzl';

export function activate(context: vscode.ExtensionContext) {
    console.log('S-cubed Requirements Template extension is now active!');

    // Register commands
    const createProjectCommand = vscode.commands.registerCommand('scubed.createProject', createProject);
    const initializeProjectCommand = vscode.commands.registerCommand('scubed.initializeProject', initializeProject);
    const generatePromptsCommand = vscode.commands.registerCommand('scubed.generatePrompts', generatePrompts);
    const openTemplateGalleryCommand = vscode.commands.registerCommand('scubed.openTemplateGallery', openTemplateGallery);
    const checkForUpdatesCommand = vscode.commands.registerCommand('scubed.checkForUpdates', () => checkForUpdates(context));

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
        checkForUpdatesCommand
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
    const templateSource = config.get<string>('templateSource') || 'https://github.com/your-org/requirements-template/archive/refs/heads/main.zip';
    
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
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/your-org/requirements-template'));
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
        const currentVersion = extension?.packageJSON.version || '1.0.0';
        
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
            
            const latestVersion = response.data.tag_name?.replace('v', '') || '1.0.0';
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
                    terminal.sendText('curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/install-extension.sh | bash');
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
            <div class="command">curl -sSL https://raw.githubusercontent.com/avanishah/scubed-development-process/main/install-extension.sh | bash</div>
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
                <li>Visit: <code>https://github.com/avanishah/scubed-development-process/releases/latest</code></li>
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
            <div class="command">https://github.com/avanishah/scubed-development-process/releases/latest</div>
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

export function deactivate() {}
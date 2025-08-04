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

    context.subscriptions.push(
        createProjectCommand,
        initializeProjectCommand,
        generatePromptsCommand,
        openTemplateGalleryCommand
    );

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
            placeholder: 'my-awesome-project',
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
        yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!zipfile) {
                reject(new Error('Failed to read zip file'));
                return;
            }

            zipfile.readEntry();
            zipfile.on('entry', (entry) => {
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
                
                zipfile.openReadStream(entry, (err, readStream) => {
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

            zipfile.on('error', (err) => {
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

export function deactivate() {}
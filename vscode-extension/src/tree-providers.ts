/**
 * 🟢 GREEN PHASE: Activity Bar Tree Providers Implementation
 * Epic 3: Activity Bar Integration - Minimal implementation to pass tests
 */

import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logger } from './logger';

// Project Template Item for tree view
export class TemplateItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly templatePath?: string,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        
        this.tooltip = this.description || this.label;
        this.contextValue = 'templateItem';
        
        if (templatePath) {
            this.command = {
                command: 'scubed.useTemplate',
                title: 'Use This Template',
                arguments: [templatePath]
            };
        }
        
        // Set appropriate icon
        this.iconPath = new vscode.ThemeIcon('file-directory');
    }
}

// Quick Action Item for tree view
export class ActionItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly commandId?: string,
        public readonly category?: string
    ) {
        super(label, collapsibleState);
        
        this.contextValue = commandId ? 'actionItem' : 'actionCategory';
        
        if (commandId) {
            this.command = {
                command: commandId,
                title: this.label,
                arguments: []
            };
            
            // Set appropriate icons for different command types
            if (commandId.includes('github') || commandId.includes('GitHub')) {
                this.iconPath = new vscode.ThemeIcon('github');
            } else if (commandId.includes('template') || commandId.includes('Template')) {
                this.iconPath = new vscode.ThemeIcon('file-directory');
            } else if (commandId.includes('log') || commandId.includes('Log')) {
                this.iconPath = new vscode.ThemeIcon('output');
            } else {
                this.iconPath = new vscode.ThemeIcon('gear');
            }
        } else {
            // Category icons
            this.iconPath = new vscode.ThemeIcon('folder');
        }
    }
}

// Project Templates Tree Provider
export class ProjectTemplatesTreeProvider implements vscode.TreeDataProvider<TemplateItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TemplateItem | undefined | null | void> = new vscode.EventEmitter<TemplateItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TemplateItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {
        logger.info('ProjectTemplatesTreeProvider initialized');
    }

    refresh(): void {
        logger.info('Refreshing Project Templates tree view');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TemplateItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: TemplateItem): Promise<TemplateItem[]> {
        try {
            if (!element) {
                // Root level - load templates from registry
                return await this.loadTemplatesFromRegistry();
            } else {
                // Child level - return empty for now (GREEN phase minimal implementation)
                return [];
            }
        } catch (error: any) {
            logger.error('Error getting Project Templates children', error);
            return [];
        }
    }

    private async loadTemplatesFromRegistry(): Promise<TemplateItem[]> {
        try {
            // 🟢 GREEN: Minimal implementation - load from template-registry.json
            const extensionPath = vscode.extensions.getExtension('scubed-solutions.scubed-development-process')?.extensionPath;
            if (!extensionPath) {
                logger.warn('Extension path not found for template loading');
                return this.getDefaultTemplates();
            }

            const registryPath = path.join(extensionPath, 'template-registry.json');
            
            if (await fs.pathExists(registryPath)) {
                const registry = await fs.readJson(registryPath);
                const templates: TemplateItem[] = [];
                
                if (registry.templates && Array.isArray(registry.templates)) {
                    for (const template of registry.templates) {
                        templates.push(new TemplateItem(
                            template.name || template.title || 'Unknown Template',
                            vscode.TreeItemCollapsibleState.None,
                            template.path || template.url,
                            template.description || 'Template for project setup'
                        ));
                    }
                }
                
                logger.info(`Loaded ${templates.length} templates from registry`);
                return templates;
            } else {
                logger.warn('Template registry not found, using defaults');
                return this.getDefaultTemplates();
            }
        } catch (error: any) {
            logger.error('Error loading templates from registry', error);
            return this.getDefaultTemplates();
        }
    }

    private getDefaultTemplates(): TemplateItem[] {
        // 🟢 GREEN: Fallback default templates
        return [
            new TemplateItem(
                'API Requirements Template',
                vscode.TreeItemCollapsibleState.None,
                'templates/requirements-template',
                'Template for API project requirements'
            ),
            new TemplateItem(
                'Data Pipeline Template', 
                vscode.TreeItemCollapsibleState.None,
                'templates/data-pipeline-template',
                'Template for data processing pipeline requirements'
            ),
            new TemplateItem(
                'Mobile App Template',
                vscode.TreeItemCollapsibleState.None,
                'templates/mobile-app-template', 
                'Template for mobile application requirements'
            )
        ];
    }
}

// Quick Actions Tree Provider
export class QuickActionsTreeProvider implements vscode.TreeDataProvider<ActionItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ActionItem | undefined | null | void> = new vscode.EventEmitter<ActionItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ActionItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private actionCategories = [
        {
            name: 'GitHub Workflow',
            icon: 'github',
            actions: [
                { name: 'Push to GitHub', command: 'scubed.pushToGitHub' },
                { name: 'Check Approval Status', command: 'scubed.checkApprovalStatus' },
                { name: 'Request Re-Review', command: 'scubed.requestReReview' },
                { name: 'Move to Development', command: 'scubed.moveToInDevelopment' }
            ]
        },
        {
            name: 'Template Management',
            icon: 'file-directory',
            actions: [
                { name: 'Open Template Gallery', command: 'scubed.openTemplateGallery' },
                { name: 'Check for Updates', command: 'scubed.checkForUpdates' }
            ]
        },
        {
            name: 'Development Tools',
            icon: 'tools',
            actions: [
                { name: 'Show Extension Logs', command: 'scubed.showLogOutput' },
                { name: 'Show Network Status', command: 'scubed.showNetworkStatus' },
                { name: 'Show Configuration Health', command: 'scubed.showConfigurationHealth' }
            ]
        }
    ];

    constructor() {
        logger.info('QuickActionsTreeProvider initialized');
    }

    refresh(): void {
        logger.info('Refreshing Quick Actions tree view');
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ActionItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ActionItem): Promise<ActionItem[]> {
        try {
            if (!element) {
                // Root level - show categories
                return this.actionCategories.map(category => 
                    new ActionItem(
                        category.name,
                        vscode.TreeItemCollapsibleState.Expanded,
                        undefined,
                        category.name
                    )
                );
            } else {
                // Category level - show actions in category
                const category = this.actionCategories.find(cat => cat.name === element.category);
                if (category) {
                    return category.actions.map(action =>
                        new ActionItem(
                            action.name,
                            vscode.TreeItemCollapsibleState.None,
                            action.command,
                            element.category
                        )
                    );
                }
                return [];
            }
        } catch (error: any) {
            logger.error('Error getting Quick Actions children', error);
            return [];
        }
    }
}

// Tree provider registration utility
export function registerTreeProviders(context: vscode.ExtensionContext): void {
    try {
        // Register Project Templates tree provider
        const projectTemplatesProvider = new ProjectTemplatesTreeProvider();
        const projectTemplatesView = vscode.window.createTreeView('scubed.projectTemplates', {
            treeDataProvider: projectTemplatesProvider,
            showCollapseAll: true
        });
        
        context.subscriptions.push(projectTemplatesView);
        
        // Register Quick Actions tree provider  
        const quickActionsProvider = new QuickActionsTreeProvider();
        const quickActionsView = vscode.window.createTreeView('scubed.quickActions', {
            treeDataProvider: quickActionsProvider,
            showCollapseAll: true
        });
        
        context.subscriptions.push(quickActionsView);

        // Register refresh commands
        const refreshProjectTemplates = vscode.commands.registerCommand('scubed.refreshProjectTemplates', () => {
            projectTemplatesProvider.refresh();
        });
        
        const refreshQuickActions = vscode.commands.registerCommand('scubed.refreshQuickActions', () => {
            quickActionsProvider.refresh();
        });

        context.subscriptions.push(refreshProjectTemplates, refreshQuickActions);
        
        logger.info('Activity Bar tree providers registered successfully');
    } catch (error: any) {
        logger.error('Error registering tree providers', error);
        throw error;
    }
}
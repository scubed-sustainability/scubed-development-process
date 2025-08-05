import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as MarkdownIt from 'markdown-it';

export interface GitHubConfig {
    owner: string;
    repo: string;
    token?: string;
}

export interface RequirementData {
    title: string;
    summary: string;
    businessObjectives: string[];
    functionalRequirements: string[];
    acceptanceCriteria: string[];
    nonFunctionalRequirements: string[];
    stakeholders: string[];
    priority: 'low' | 'medium' | 'high';
    sourceFile: string;
}

export interface GitHubIssueResponse {
    number: number;
    html_url: string;
    id: number;
}

export interface GitHubDiscussionResponse {
    id: string;
    url: string;
    number: number;
}

export class GitHubService {
    private octokit: Octokit | null = null;
    private config: GitHubConfig | null = null;
    private md: MarkdownIt;

    constructor() {
        this.md = new (MarkdownIt as any)();
    }

    /**
     * Initialize GitHub service with authentication
     */
    async initialize(): Promise<boolean> {
        try {
            // Try to detect GitHub repository automatically
            const repoInfo = await this.detectGitHubRepository();
            
            if (!repoInfo) {
                vscode.window.showErrorMessage(
                    'Could not detect GitHub repository. Please ensure your project is connected to a GitHub repository or configure scubed.github.owner and scubed.github.repo in settings.'
                );
                return false;
            }

            // Authenticate with GitHub using VS Code's built-in authentication
            const session = await vscode.authentication.getSession('github', ['repo', 'write:discussion'], {
                createIfNone: true
            });

            if (!session) {
                vscode.window.showErrorMessage('GitHub authentication failed.');
                return false;
            }

            this.config = {
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                token: session.accessToken
            };

            this.octokit = new Octokit({
                auth: session.accessToken
            });

            // Test the connection
            await this.octokit.repos.get({
                owner: this.config.owner,
                repo: this.config.repo
            });

            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`GitHub initialization failed: ${error}`);
            return false;
        }
    }

    /**
     * Create a GitHub issue for requirements
     */
    async createRequirementIssue(requirement: RequirementData): Promise<GitHubIssueResponse | null> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            const issueBody = this.formatRequirementForIssue(requirement);
            const labels = [
                'requirement',
                `priority-${requirement.priority}`,
                'pending-review'
            ];

            const response = await this.octokit.issues.create({
                owner: this.config.owner,
                repo: this.config.repo,
                title: `[REQUIREMENT] ${requirement.title}`,
                body: issueBody,
                labels,
                assignees: requirement.stakeholders
            });

            return {
                number: response.data.number,
                html_url: response.data.html_url,
                id: response.data.id
            };

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create GitHub issue: ${error}`);
            return null;
        }
    }

    /**
     * Create a GitHub discussion for stakeholder collaboration
     * Note: GitHub Discussions require GraphQL API, so we'll create an issue comment instead for now
     */
    async createRequirementDiscussion(requirement: RequirementData, issueNumber: number): Promise<GitHubDiscussionResponse | null> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            // For now, add a comment to the issue to facilitate discussion
            // This can be enhanced with GraphQL API for real discussions later
            const discussionComment = this.formatRequirementForDiscussion(requirement, issueNumber);

            const response = await this.octokit.issues.createComment({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                body: discussionComment
            });

            // Return issue URL since we're using issue comments for discussion
            const issueUrl = `https://github.com/${this.config.owner}/${this.config.repo}/issues/${issueNumber}`;

            return {
                id: response.data.id.toString(),
                url: issueUrl,
                number: issueNumber
            };

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create GitHub discussion comment: ${error}`);
            return null;
        }
    }

    /**
     * Check for comments and updates on issues
     */
    async checkForUpdates(issueNumber: number): Promise<any[]> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            const comments = await this.octokit.issues.listComments({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
            });

            return comments.data;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return [];
        }
    }

    /**
     * Update an existing issue with new requirements
     */
    async updateRequirementIssue(issueNumber: number, requirement: RequirementData): Promise<boolean> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            const issueBody = this.formatRequirementForIssue(requirement);

            await this.octokit.issues.update({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                body: issueBody
            });

            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update GitHub issue: ${error}`);
            return false;
        }
    }

    /**
     * Format requirement data for GitHub issue
     */
    private formatRequirementForIssue(requirement: RequirementData): string {
        const sections = [
            '## 📋 Requirement Summary',
            requirement.summary,
            '',
            '## 🎯 Business Objectives',
            ...requirement.businessObjectives.map(obj => `- ${obj}`),
            '',
            '## ⚙️ Functional Requirements',
            ...requirement.functionalRequirements.map(req => `- ${req}`),
            '',
            '## ✅ Acceptance Criteria',
            ...requirement.acceptanceCriteria.map(criteria => `- [ ] ${criteria}`),
            '',
            '## 🔧 Non-Functional Requirements',
            ...requirement.nonFunctionalRequirements.map(req => `- ${req}`),
            '',
            '## 👥 Stakeholders',
            ...requirement.stakeholders.map(stakeholder => `@${stakeholder}`),
            '',
            `## 📊 Priority: ${requirement.priority.charAt(0).toUpperCase() + requirement.priority.slice(1)}`,
            '',
            '---',
            '**Auto-generated from VSCode S-cubed Extension**',
            `📂 Source: \`${requirement.sourceFile}\``
        ];

        return sections.join('\n');
    }

    /**
     * Format requirement data for GitHub discussion
     */
    private formatRequirementForDiscussion(requirement: RequirementData, issueNumber: number): string {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 5); // 5 days from now

        const sections = [
            '## 💬 **Stakeholder Review Requested**',
            '',
            `We need your input on the requirements for **${requirement.title}**.`,
            '',
            '### 🔍 Please Review:',
            '1. Are the business objectives complete and accurate?',
            '2. Are there any missing functional requirements?',
            '3. Do the acceptance criteria cover all scenarios?',
            '4. Any security, performance, or compliance considerations?',
            '',
            `**Deadline for feedback:** ${deadline.toLocaleDateString()}`,
            '',
            '### 👥 Stakeholder Input Needed',
            ...requirement.stakeholders.map(stakeholder => `@${stakeholder}`),
            '',
            'Please provide your feedback by adding comments to this issue. Your expertise is crucial for ensuring we build the right solution.',
            '',
            '---',
            '### 💡 How to Provide Feedback:',
            '- Add comments with specific suggestions',
            '- Use 👍 👎 reactions to show approval/concerns',
            '- Tag additional stakeholders if needed (@username)',
            '- Ask questions for clarification',
            '',
            '**When approved by all stakeholders, we\'ll move forward with implementation.**'
        ];

        return sections.join('\n');
    }

    /**
     * Parse requirements from markdown file
     */
    async parseRequirementsFile(filePath: string): Promise<RequirementData | null> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const fileName = path.basename(filePath);

            // Basic parsing - can be enhanced with more sophisticated parsing
            const lines = content.split('\n');
            let title = 'Untitled Requirement';
            let summary = '';
            const businessObjectives: string[] = [];
            const functionalRequirements: string[] = [];
            const acceptanceCriteria: string[] = [];
            const nonFunctionalRequirements: string[] = [];
            const stakeholders: string[] = [];
            let priority: 'low' | 'medium' | 'high' = 'medium';

            let currentSection = '';

            for (const line of lines) {
                const trimmed = line.trim();

                // Extract title from first heading
                if (trimmed.startsWith('# ') && !title.includes('Untitled')) {
                    title = trimmed.substring(2);
                    continue;
                }

                // Identify sections
                if (trimmed.toLowerCase().includes('business objective')) {
                    currentSection = 'business';
                    continue;
                }
                if (trimmed.toLowerCase().includes('functional requirement')) {
                    currentSection = 'functional';
                    continue;
                }
                if (trimmed.toLowerCase().includes('acceptance criteria')) {
                    currentSection = 'acceptance';
                    continue;
                }
                if (trimmed.toLowerCase().includes('non-functional') || trimmed.toLowerCase().includes('performance')) {
                    currentSection = 'nonfunctional';
                    continue;
                }
                if (trimmed.toLowerCase().includes('stakeholder')) {
                    currentSection = 'stakeholders';
                    continue;
                }
                if (trimmed.toLowerCase().includes('priority')) {
                    if (trimmed.toLowerCase().includes('high')) priority = 'high';
                    else if (trimmed.toLowerCase().includes('low')) priority = 'low';
                    continue;
                }

                // Extract content from lists
                if (trimmed.startsWith('- ')) {
                    const item = trimmed.substring(2);
                    switch (currentSection) {
                        case 'business':
                            businessObjectives.push(item);
                            break;
                        case 'functional':
                            functionalRequirements.push(item);
                            break;
                        case 'acceptance':
                            acceptanceCriteria.push(item.replace(/^\[.\]\s*/, '')); // Remove checkbox
                            break;
                        case 'nonfunctional':
                            nonFunctionalRequirements.push(item);
                            break;
                        case 'stakeholders':
                            stakeholders.push(item.replace('@', '')); // Remove @ if present
                            break;
                    }
                }

                // Extract summary from first paragraph
                if (!summary && trimmed.length > 0 && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
                    summary = trimmed;
                }
            }

            return {
                title,
                summary: summary || `Requirements for ${title}`,
                businessObjectives,
                functionalRequirements,
                acceptanceCriteria,
                nonFunctionalRequirements,
                stakeholders,
                priority,
                sourceFile: fileName
            };

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to parse requirements file: ${error}`);
            return null;
        }
    }

    /**
     * Auto-detect GitHub repository from various sources
     */
    private async detectGitHubRepository(): Promise<{owner: string, repo: string} | null> {
        // Method 1: Check VSCode settings first (manual override)
        const workspaceConfig = vscode.workspace.getConfiguration('scubed.github');
        const settingsOwner = workspaceConfig.get<string>('owner');
        const settingsRepo = workspaceConfig.get<string>('repo');
        
        if (settingsOwner && settingsRepo) {
            console.log('GitHub repo detected from VSCode settings');
            return { owner: settingsOwner, repo: settingsRepo };
        }

        // Method 2: Parse git remote origin URL
        const gitRemoteInfo = await this.parseGitRemoteOrigin();
        if (gitRemoteInfo) {
            console.log('GitHub repo detected from git remote origin');
            return gitRemoteInfo;
        }

        // Method 3: Check package.json repository field
        const packageJsonInfo = await this.parsePackageJsonRepository();
        if (packageJsonInfo) {
            console.log('GitHub repo detected from package.json');
            return packageJsonInfo;
        }

        // Method 4: Prompt user as last resort
        return await this.promptUserForRepository();
    }

    /**
     * Parse git remote origin URL to extract owner/repo
     */
    private async parseGitRemoteOrigin(): Promise<{owner: string, repo: string} | null> {
        if (!vscode.workspace.workspaceFolders) {
            return null;
        }

        try {
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const { exec } = require('child_process');
            
            return new Promise((resolve) => {
                exec('git remote get-url origin', { cwd: workspaceRoot }, (error: any, stdout: string) => {
                    if (error) {
                        resolve(null);
                        return;
                    }

                    const remoteUrl = stdout.trim();
                    const githubMatch = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
                    
                    if (githubMatch) {
                        resolve({
                            owner: githubMatch[1],
                            repo: githubMatch[2]
                        });
                    } else {
                        resolve(null);
                    }
                });
            });
        } catch (error) {
            return null;
        }
    }

    /**
     * Parse package.json repository field
     */
    private async parsePackageJsonRepository(): Promise<{owner: string, repo: string} | null> {
        if (!vscode.workspace.workspaceFolders) {
            return null;
        }

        try {
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const packageJsonPath = path.join(workspaceRoot, 'package.json');
            
            if (!(await fs.pathExists(packageJsonPath))) {
                return null;
            }

            const packageJson = await fs.readJson(packageJsonPath);
            const repository = packageJson.repository;
            
            if (!repository) {
                return null;
            }

            // Handle different repository formats
            let repoUrl: string;
            if (typeof repository === 'string') {
                repoUrl = repository;
            } else if (repository.url) {
                repoUrl = repository.url;
            } else {
                return null;
            }

            // Parse GitHub URL from repository field
            const githubMatch = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
            
            if (githubMatch) {
                return {
                    owner: githubMatch[1],
                    repo: githubMatch[2]
                };
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Prompt user for repository information as last resort
     */
    private async promptUserForRepository(): Promise<{owner: string, repo: string} | null> {
        const owner = await vscode.window.showInputBox({
            prompt: 'Enter GitHub repository owner/organization',
            placeHolder: 'e.g., microsoft, facebook, your-username',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Repository owner is required';
                }
                if (!/^[a-zA-Z0-9\-_.]+$/.test(value)) {
                    return 'Invalid owner name format';
                }
                return null;
            }
        });

        if (!owner) {
            return null;
        }

        const repo = await vscode.window.showInputBox({
            prompt: 'Enter GitHub repository name',
            placeHolder: 'e.g., vscode, react, project-name',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Repository name is required';
                }
                if (!/^[a-zA-Z0-9\-_.]+$/.test(value)) {
                    return 'Invalid repository name format';
                }
                return null;
            }
        });

        if (!repo) {
            return null;
        }

        // Offer to save settings for future use
        const saveChoice = await vscode.window.showInformationMessage(
            'Save repository settings for this workspace?',
            'Yes, Save to Workspace',
            'No, Just This Time'
        );

        if (saveChoice === 'Yes, Save to Workspace') {
            const config = vscode.workspace.getConfiguration('scubed.github');
            await config.update('owner', owner, vscode.ConfigurationTarget.Workspace);
            await config.update('repo', repo, vscode.ConfigurationTarget.Workspace);
            
            vscode.window.showInformationMessage(
                'Repository settings saved to workspace. Team members will use the same configuration!'
            );
        }

        return { owner, repo };
    }

    /**
     * Get current GitHub configuration
     */
    getConfig(): GitHubConfig | null {
        return this.config;
    }
}
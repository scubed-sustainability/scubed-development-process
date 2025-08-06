import { Octokit } from '@octokit/rest';
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as MarkdownIt from 'markdown-it';
import { logger } from './logger';

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
        logger.info('GitHubService constructor called');
        this.md = new (MarkdownIt as any)();
        logger.debug('MarkdownIt instance initialized');
    }

    /**
     * Initialize GitHub service with authentication
     */
    async initialize(): Promise<boolean> {
        logger.logFunctionEntry('GitHubService.initialize');
        try {
            // Try to detect GitHub repository automatically
            logger.info('Attempting to detect GitHub repository...');
            const repoInfo = await this.detectGitHubRepository();
            
            if (!repoInfo) {
                logger.warn('Could not detect GitHub repository from workspace');
                vscode.window.showErrorMessage(
                    'Could not detect GitHub repository. Please ensure your project is connected to a GitHub repository or configure scubed.github.owner and scubed.github.repo in settings.'
                );
                return false;
            }
            
            logger.info('GitHub repository detected:', repoInfo);

            // Authenticate with GitHub using VS Code's built-in authentication
            logger.info('Attempting GitHub authentication...');
            const session = await vscode.authentication.getSession('github', ['repo', 'write:discussion'], {
                createIfNone: true
            });

            if (!session) {
                logger.error('GitHub authentication failed - no session returned');
                vscode.window.showErrorMessage('GitHub authentication failed.');
                return false;
            }

            logger.info('GitHub authentication successful');
            this.config = {
                owner: repoInfo.owner,
                repo: repoInfo.repo,
                token: session.accessToken
            };

            logger.debug('Creating Octokit instance with authenticated session');
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

            // Filter out invalid assignees - only use valid GitHub usernames
            const validAssignees = requirement.stakeholders?.filter(assignee => 
                assignee && assignee.match(/^[a-zA-Z0-9]([a-zA-Z0-9-])*[a-zA-Z0-9]$/) && !assignee.includes('-')
            ) || [];

            const response = await this.octokit.issues.create({
                owner: this.config.owner,
                repo: this.config.repo,
                title: `[REQUIREMENT] ${requirement.title}`,
                body: issueBody,
                labels,
                assignees: validAssignees
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
     * Check approval status of a requirement issue
     */
    async checkApprovalStatus(issueNumber: number): Promise<{
        isApproved: boolean;
        approvalCount: number;
        totalStakeholders: number;
        approvedBy: string[];
        pendingApprovals: string[];
        stakeholders: string[];
    }> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            // Get issue details
            const issue = await this.octokit.issues.get({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber
            });

            // Extract stakeholders from issue body
            const stakeholderMatch = issue.data.body?.match(/## 👥 Stakeholders\n(.*?)(?=\n##|$)/s);
            if (!stakeholderMatch) {
                return {
                    isApproved: false,
                    approvalCount: 0,
                    totalStakeholders: 0,
                    approvedBy: [],
                    pendingApprovals: [],
                    stakeholders: []
                };
            }

            const stakeholders = stakeholderMatch[1]
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.startsWith('@'))
                .map(line => line.substring(1)); // Remove @ symbol

            if (stakeholders.length === 0) {
                return {
                    isApproved: false,
                    approvalCount: 0,
                    totalStakeholders: 0,
                    approvedBy: [],
                    pendingApprovals: [],
                    stakeholders: []
                };
            }

            // Get all comments
            const comments = await this.octokit.issues.listComments({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber
            });

            // Check for approval patterns in comments
            const approvalPatterns = [
                /✅.*approved?/i,
                /approved?.*✅/i,
                /lgtm/i,
                /looks good to me/i,
                /approve/i,
                /👍.*approve/i,
                /approve.*👍/i
            ];

            const approvedBy = new Set<string>();

            // Check comments for approvals
            for (const comment of comments.data) {
                const commentBody = comment.body?.toLowerCase();
                const author = comment.user?.login;

                if (author && commentBody && stakeholders.includes(author)) {
                    const hasApproval = approvalPatterns.some(pattern => pattern.test(commentBody));
                    if (hasApproval) {
                        approvedBy.add(author);
                    }
                }
            }

            // Check reactions (👍 as approval)
            const reactions = await this.octokit.reactions.listForIssue({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber
            });

            for (const reaction of reactions.data) {
                if (reaction.content === '+1' && reaction.user?.login && stakeholders.includes(reaction.user.login)) {
                    approvedBy.add(reaction.user.login);
                }
            }

            const approvedByArray = Array.from(approvedBy);
            const pendingApprovals = stakeholders.filter(stakeholder => !approvedBy.has(stakeholder));
            const isApproved = pendingApprovals.length === 0;

            return {
                isApproved,
                approvalCount: approvedByArray.length,
                totalStakeholders: stakeholders.length,
                approvedBy: approvedByArray,
                pendingApprovals,
                stakeholders
            };

        } catch (error) {
            console.error('Failed to check approval status:', error);
            return {
                isApproved: false,
                approvalCount: 0,
                totalStakeholders: 0,
                approvedBy: [],
                pendingApprovals: [],
                stakeholders: []
            };
        }
    }

    /**
     * Get all requirement issues with their approval status
     */
    async getAllRequirementIssues(): Promise<Array<{
        number: number;
        title: string;
        labels: string[];
        status: 'pending-review' | 'approved' | 'rejected' | 'in-development';
        approvalStatus: any;
        url: string;
        created_at: string;
        updated_at: string;
    }>> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            // Get all issues with 'requirement' label
            const issues = await this.octokit.issues.listForRepo({
                owner: this.config.owner,
                repo: this.config.repo,
                labels: 'requirement',
                state: 'open',
                sort: 'updated',
                direction: 'desc'
            });

            const requirementIssues = [];

            for (const issue of issues.data) {
                const labels = issue.labels.map(label => 
                    typeof label === 'string' ? label : label.name || ''
                );

                let status: 'pending-review' | 'approved' | 'rejected' | 'in-development' = 'pending-review';
                if (labels.includes('approved')) {
                    status = 'approved';
                } else if (labels.includes('rejected')) {
                    status = 'rejected';
                } else if (labels.includes('in-development')) {
                    status = 'in-development';
                }

                // Get approval status for pending issues
                let approvalStatus = null;
                if (status === 'pending-review') {
                    approvalStatus = await this.checkApprovalStatus(issue.number);
                }

                requirementIssues.push({
                    number: issue.number,
                    title: issue.title,
                    labels,
                    status,
                    approvalStatus,
                    url: issue.html_url,
                    created_at: issue.created_at,
                    updated_at: issue.updated_at
                });
            }

            return requirementIssues;

        } catch (error) {
            console.error('Failed to get requirement issues:', error);
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
     * Manually trigger approval check and update status
     */
    async triggerApprovalCheck(issueNumber: number): Promise<boolean> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            const approvalStatus = await this.checkApprovalStatus(issueNumber);
            
            if (approvalStatus.isApproved) {
                // Update labels
                await this.octokit.issues.removeLabel({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    issue_number: issueNumber,
                    name: 'pending-review'
                }).catch(() => {}); // Ignore if label doesn't exist

                await this.octokit.issues.addLabels({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    issue_number: issueNumber,
                    labels: ['approved', 'ready-for-development']
                });

                // Add approval confirmation comment
                await this.octokit.issues.createComment({
                    owner: this.config.owner,
                    repo: this.config.repo,
                    issue_number: issueNumber,
                    body: `## ✅ Requirements Approved!

**All stakeholder approvals received:**
${approvalStatus.approvedBy.join(', ')}

**Status:** APPROVED → Ready for Development

The requirements have been automatically moved to the "Approved" status and are ready for implementation.

---
🤖 *Manually triggered by S-cubed VSCode Extension*`
                });

                vscode.window.showInformationMessage(
                    `Requirements #${issueNumber} approved! All ${approvalStatus.totalStakeholders} stakeholders have given their approval.`
                );

                return true;
            } else {
                vscode.window.showInformationMessage(
                    `Requirements #${issueNumber} not yet fully approved. ${approvalStatus.approvalCount}/${approvalStatus.totalStakeholders} stakeholders have approved. Still waiting for: ${approvalStatus.pendingApprovals.join(', ')}`
                );
                return false;
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to check approval status: ${error}`);
            return false;
        }
    }

    /**
     * Request re-review from specific stakeholders
     */
    async requestReReview(issueNumber: number, stakeholders?: string[]): Promise<boolean> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            const approvalStatus = await this.checkApprovalStatus(issueNumber);
            const pendingStakeholders = stakeholders || approvalStatus.pendingApprovals;

            if (pendingStakeholders.length === 0) {
                vscode.window.showInformationMessage('All stakeholders have already approved this requirement.');
                return true;
            }

            await this.octokit.issues.createComment({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                body: `## 🔔 Review Reminder

${pendingStakeholders.map(s => `@${s}`).join(' ')}

Your review and approval is still needed for these requirements.

### ✅ How to Approve:
- Add a comment with "✅ Approved" or "LGTM"
- Use 👍 reaction on this issue
- Provide specific feedback if changes are needed

**Current Status:** ${approvalStatus.approvalCount}/${approvalStatus.totalStakeholders} stakeholders approved

---
🤖 *Re-review requested by S-cubed VSCode Extension*`
            });

            vscode.window.showInformationMessage(
                `Re-review requested from ${pendingStakeholders.length} stakeholder(s): ${pendingStakeholders.join(', ')}`
            );

            return true;

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to request re-review: ${error}`);
            return false;
        }
    }

    /**
     * Move approved requirements to development status
     */
    async moveToInDevelopment(issueNumber: number): Promise<boolean> {
        if (!this.octokit || !this.config) {
            throw new Error('GitHub service not initialized');
        }

        try {
            // Check if approved first
            const issue = await this.octokit.issues.get({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber
            });

            const labels = issue.data.labels.map(label => 
                typeof label === 'string' ? label : label.name || ''
            );

            if (!labels.includes('approved')) {
                vscode.window.showWarningMessage('Cannot move to development: Requirements not yet approved.');
                return false;
            }

            // Update labels
            await this.octokit.issues.removeLabel({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                name: 'ready-for-development'
            }).catch(() => {}); // Ignore if label doesn't exist

            await this.octokit.issues.addLabels({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                labels: ['in-development']
            });

            // Add status change comment
            await this.octokit.issues.createComment({
                owner: this.config.owner,
                repo: this.config.repo,
                issue_number: issueNumber,
                body: `## 🚧 Development Started

**Status:** Ready for Development → In Development

Development work has begun on these requirements.

---
🤖 *Status updated by S-cubed VSCode Extension*`
            });

            vscode.window.showInformationMessage(
                `Requirements #${issueNumber} moved to In Development status.`
            );

            return true;

        } catch (error) {
            vscode.window.showErrorMessage(`Failed to move to development: ${error}`);
            return false;
        }
    }

    /**
     * Get current GitHub configuration
     */
    getConfig(): GitHubConfig | null {
        return this.config;
    }
}
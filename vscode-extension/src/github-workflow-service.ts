/**
 * GitHub Workflow Service
 * 🟢 GREEN PHASE: Complete GitHub integration workflow implementation
 */

import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GitHubService } from './github-service';
import { logger } from './logger';
import { NetworkService } from './network-service';
import { RateLimitService } from './rate-limit-service';

export interface WorkflowStatus {
    stage: 'requirements' | 'github_push' | 'approval_tracking' | 'feedback_review' | 'development_ready';
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    issueNumber?: number;
    approvalCount: number;
    requiredApprovals: number;
    lastUpdated: Date;
    nextActions: string[];
}

export interface ApprovalSummary {
    totalReviewers: number;
    approvedCount: number;
    changesRequestedCount: number;
    pendingCount: number;
    reviewers: {
        login: string;
        state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
        submittedAt?: Date;
    }[];
}

export interface FeedbackItem {
    id: number;
    author: string;
    type: 'approval' | 'changes_requested' | 'question' | 'suggestion';
    content: string;
    timestamp: Date;
    resolved: boolean;
}

/**
 * Complete GitHub integration workflow service
 */
export class GitHubWorkflowService {
    private currentWorkflowStatus: WorkflowStatus | null = null;

    constructor(
        private context: vscode.ExtensionContext,
        private githubService: GitHubService,
        private networkService: NetworkService,
        private rateLimitService: RateLimitService
    ) {}

    /**
     * Execute complete requirements → GitHub → approval tracking workflow
     */
    public async executeCompleteWorkflow(): Promise<WorkflowStatus> {
        logger.logFunctionEntry('GitHubWorkflowService.executeCompleteWorkflow');

        try {
            // Step 1: Validate requirements file
            const requirementsFile = await this.findAndValidateRequirements();
            if (!requirementsFile) {
                throw new Error('No valid requirements file found');
            }

            // Step 2: Push requirements to GitHub
            const issueNumber = await this.pushRequirementsToGitHub(requirementsFile);
            
            // Step 3: Initialize approval tracking
            await this.initializeApprovalTracking(issueNumber);
            
            // Step 4: Set up monitoring
            await this.setupWorkflowMonitoring(issueNumber);

            this.currentWorkflowStatus = {
                stage: 'approval_tracking',
                status: 'in_progress',
                issueNumber,
                approvalCount: 0,
                requiredApprovals: await this.getRequiredApprovalCount(),
                lastUpdated: new Date(),
                nextActions: ['Monitor approval status', 'Check feedback', 'Respond to comments']
            };

            logger.info('Complete GitHub workflow initiated successfully', { issueNumber });
            return this.currentWorkflowStatus;

        } catch (error: any) {
            logger.error('GitHub workflow execution failed', error);
            this.currentWorkflowStatus = {
                stage: 'requirements',
                status: 'error',
                approvalCount: 0,
                requiredApprovals: 0,
                lastUpdated: new Date(),
                nextActions: ['Fix errors and retry']
            };
            throw error;
        }
    }

    /**
     * Find and validate requirements file
     */
    private async findAndValidateRequirements(): Promise<string | null> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a project first.');
            return null;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        
        // Look for requirements files
        const possibleFiles = [
            'requirements.md',
            'REQUIREMENTS.md', 
            'Requirements.md',
            'docs/requirements.md',
            'docs/REQUIREMENTS.md'
        ];

        for (const filename of possibleFiles) {
            const filePath = path.join(workspaceRoot, filename);
            try {
                if (await fs.pathExists(filePath)) {
                    const content = await fs.readFile(filePath, 'utf8');
                    if (await this.validateRequirementsContent(content, filePath)) {
                        return filePath;
                    }
                }
            } catch (error: any) {
                logger.warn(`Could not read requirements file: ${filePath}`, error);
            }
        }

        // No valid requirements file found, offer to create one
        const choice = await vscode.window.showInformationMessage(
            'No requirements file found. Would you like to create one?',
            'Create Requirements File',
            'Cancel'
        );

        if (choice === 'Create Requirements File') {
            return await this.createRequirementsTemplate(workspaceRoot);
        }

        return null;
    }

    /**
     * Validate requirements file content
     */
    private async validateRequirementsContent(content: string, filePath: string): Promise<boolean> {
        const validation = {
            hasTitle: /^#\s+.+$/m.test(content),
            hasFeatures: /##\s+(Feature|Features):/i.test(content),
            hasMinimumContent: content.length >= 100,
            hasListItems: /^-\s+.+$/m.test(content)
        };

        const issues = [];
        if (!validation.hasTitle) issues.push('Missing main title (# Title)');
        if (!validation.hasFeatures) issues.push('Missing features section (## Features:)');
        if (!validation.hasMinimumContent) issues.push('Content too short (minimum 100 characters)');
        if (!validation.hasListItems) issues.push('Missing list items (- Item)');

        if (issues.length > 0) {
            const choice = await vscode.window.showWarningMessage(
                `Requirements file validation issues:\n• ${issues.join('\n• ')}\n\nContinue anyway?`,
                'Fix Issues',
                'Continue Anyway',
                'Cancel'
            );

            if (choice === 'Fix Issues') {
                await vscode.window.showTextDocument(vscode.Uri.file(filePath));
                return false;
            } else if (choice === 'Continue Anyway') {
                return true;
            } else {
                return false;
            }
        }

        return true;
    }

    /**
     * Create requirements template
     */
    private async createRequirementsTemplate(workspaceRoot: string): Promise<string> {
        const template = `# Project Requirements

## Feature: [Feature Name]

### Business Objectives
- [Primary business goal]
- [Secondary business goal]

### Functional Requirements
- [Core functionality requirement]
- [User interaction requirement]
- [Data processing requirement]

### Acceptance Criteria
- [ ] [Testable criteria 1]
- [ ] [Testable criteria 2]
- [ ] [Testable criteria 3]

### Non-Functional Requirements
- Performance: [Response time requirements]
- Security: [Security requirements]
- Scalability: [Scale requirements]

### Stakeholders
- Product Owner: [Name]
- Technical Lead: [Name]
- QA Lead: [Name]

### Priority
- High/Medium/Low

### Notes
[Additional context or constraints]
`;

        const filePath = path.join(workspaceRoot, 'requirements.md');
        await fs.writeFile(filePath, template, 'utf8');
        
        await vscode.window.showTextDocument(vscode.Uri.file(filePath));
        
        vscode.window.showInformationMessage(
            'Requirements template created. Please fill in the details before pushing to GitHub.',
            'OK'
        );

        return filePath;
    }

    /**
     * Push requirements to GitHub with proper issue structure
     */
    private async pushRequirementsToGitHub(requirementsFile: string): Promise<number> {
        return await this.networkService.executeWithNetworkHandling(
            async () => {
                return await this.rateLimitService.executeWithProtection(
                    async () => {
                        const content = await fs.readFile(requirementsFile, 'utf8');
                        const title = this.extractTitle(content) || 'Requirements Review';
                        
                        const issueBody = `${content}\n\n---\n\n**Generated from:** \`${path.basename(requirementsFile)}\`\n**Extension:** S-cubed Development Process\n**Timestamp:** ${new Date().toISOString()}`;

                        const initialized = await this.githubService.initialize();
                        if (!initialized) {
                            throw new Error('GitHub service initialization failed');
                        }

                        // Create issue with proper labels and structure
                        const issue = await this.githubService.createIssue({
                            title: `Requirements Review: ${title}`,
                            body: issueBody,
                            labels: ['requirements', 'review-needed', 'scubed'],
                            assignees: await this.getDefaultAssignees()
                        });

                        logger.info('Requirements pushed to GitHub successfully', { 
                            issueNumber: issue.number,
                            url: issue.html_url 
                        });

                        // Show success message with link
                        const choice = await vscode.window.showInformationMessage(
                            `✅ Requirements pushed to GitHub successfully!\nIssue #${issue.number} created.`,
                            'View on GitHub',
                            'Continue Workflow'
                        );

                        if (choice === 'View on GitHub') {
                            vscode.env.openExternal(vscode.Uri.parse(issue.html_url));
                        }

                        return issue.number;
                    },
                    { 
                        cacheKey: 'github-push',
                        priority: 'high',
                        retries: 2
                    }
                );
            },
            {
                operationType: 'push-requirements',
                priority: 'high',
                maxRetries: 2,
                queueOnFailure: true
            }
        );
    }

    /**
     * Track approval status with real-time updates
     */
    public async getApprovalStatus(issueNumber?: number): Promise<ApprovalSummary> {
        const targetIssue = issueNumber || this.currentWorkflowStatus?.issueNumber;
        if (!targetIssue) {
            throw new Error('No issue number provided for approval tracking');
        }

        return await this.networkService.executeWithNetworkHandling(
            async () => {
                return await this.rateLimitService.executeWithProtection(
                    async () => {
                        const initialized = await this.githubService.initialize();
                        if (!initialized) {
                            throw new Error('GitHub service not initialized');
                        }

                        // Get issue comments and reactions
                        const comments = await this.githubService.getIssueComments(targetIssue);
                        const reactions = await this.githubService.getIssueReactions(targetIssue);

                        // Analyze comments for approval signals
                        const reviewers = new Map<string, {
                            login: string;
                            state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING';
                            submittedAt?: Date;
                        }>();

                        // Process reactions (thumbs up = approval, thumbs down = changes requested)
                        for (const reaction of reactions) {
                            if (reaction.content === '+1') {
                                reviewers.set(reaction.user.login, {
                                    login: reaction.user.login,
                                    state: 'APPROVED',
                                    submittedAt: new Date(reaction.created_at)
                                });
                            } else if (reaction.content === '-1') {
                                reviewers.set(reaction.user.login, {
                                    login: reaction.user.login,
                                    state: 'CHANGES_REQUESTED',
                                    submittedAt: new Date(reaction.created_at)
                                });
                            }
                        }

                        // Process comments for approval keywords
                        for (const comment of comments) {
                            const content = comment.body.toLowerCase();
                            if (content.includes('lgtm') || content.includes('approved') || content.includes('approve')) {
                                reviewers.set(comment.user.login, {
                                    login: comment.user.login,
                                    state: 'APPROVED',
                                    submittedAt: new Date(comment.created_at)
                                });
                            } else if (content.includes('changes requested') || content.includes('needs changes')) {
                                reviewers.set(comment.user.login, {
                                    login: comment.user.login,
                                    state: 'CHANGES_REQUESTED',
                                    submittedAt: new Date(comment.created_at)
                                });
                            } else if (!reviewers.has(comment.user.login)) {
                                reviewers.set(comment.user.login, {
                                    login: comment.user.login,
                                    state: 'COMMENTED',
                                    submittedAt: new Date(comment.created_at)
                                });
                            }
                        }

                        const reviewersList = Array.from(reviewers.values());
                        const approvedCount = reviewersList.filter(r => r.state === 'APPROVED').length;
                        const changesRequestedCount = reviewersList.filter(r => r.state === 'CHANGES_REQUESTED').length;
                        const pendingCount = reviewersList.filter(r => r.state === 'PENDING').length;

                        return {
                            totalReviewers: reviewersList.length,
                            approvedCount,
                            changesRequestedCount,
                            pendingCount,
                            reviewers: reviewersList
                        };
                    },
                    {
                        cacheKey: `approval-status-${targetIssue}`,
                        cacheDuration: 2 * 60 * 1000, // 2 minutes
                        priority: 'medium'
                    }
                );
            },
            {
                operationType: 'check-approval-status',
                priority: 'medium',
                maxRetries: 3
            }
        );
    }

    /**
     * Show approval status dashboard
     */
    public async showApprovalDashboard(): Promise<void> {
        if (!this.currentWorkflowStatus?.issueNumber) {
            vscode.window.showErrorMessage('No active workflow found. Please push requirements to GitHub first.');
            return;
        }

        try {
            const approvalStatus = await this.getApprovalStatus();
            
            let dashboardContent = `📊 **Requirements Approval Dashboard**\n\n`;
            dashboardContent += `**Issue:** #${this.currentWorkflowStatus.issueNumber}\n`;
            dashboardContent += `**Stage:** ${this.currentWorkflowStatus.stage}\n`;
            dashboardContent += `**Status:** ${this.currentWorkflowStatus.status}\n`;
            dashboardContent += `**Last Updated:** ${this.currentWorkflowStatus.lastUpdated.toLocaleString()}\n\n`;

            dashboardContent += `**Approval Progress:**\n`;
            dashboardContent += `✅ Approved: ${approvalStatus.approvedCount}\n`;
            dashboardContent += `❌ Changes Requested: ${approvalStatus.changesRequestedCount}\n`;
            dashboardContent += `⏳ Pending: ${approvalStatus.pendingCount}\n`;
            dashboardContent += `👥 Total Reviewers: ${approvalStatus.totalReviewers}\n\n`;

            if (approvalStatus.reviewers.length > 0) {
                dashboardContent += `**Reviewer Details:**\n`;
                for (const reviewer of approvalStatus.reviewers) {
                    const emoji = reviewer.state === 'APPROVED' ? '✅' : 
                                 reviewer.state === 'CHANGES_REQUESTED' ? '❌' : 
                                 reviewer.state === 'COMMENTED' ? '💬' : '⏳';
                    dashboardContent += `${emoji} **${reviewer.login}** - ${reviewer.state}`;
                    if (reviewer.submittedAt) {
                        dashboardContent += ` (${reviewer.submittedAt.toLocaleDateString()})`;
                    }
                    dashboardContent += `\n`;
                }
            }

            dashboardContent += `\n**Next Actions:**\n${this.currentWorkflowStatus.nextActions.map(action => `• ${action}`).join('\n')}`;

            const actions = ['View on GitHub', 'Refresh Status', 'Request Re-Review', 'OK'];
            const choice = await vscode.window.showInformationMessage(dashboardContent, ...actions);

            await this.handleDashboardAction(choice);

        } catch (error: any) {
            logger.error('Failed to show approval dashboard', error);
            vscode.window.showErrorMessage(`Failed to load approval status: ${error.message}`);
        }
    }

    /**
     * Handle stakeholder feedback and comments
     */
    public async getFeedbackItems(issueNumber?: number): Promise<FeedbackItem[]> {
        const targetIssue = issueNumber || this.currentWorkflowStatus?.issueNumber;
        if (!targetIssue) {
            throw new Error('No issue number provided for feedback collection');
        }

        return await this.networkService.executeWithNetworkHandling(
            async () => {
                return await this.rateLimitService.executeWithProtection(
                    async () => {
                        const initialized = await this.githubService.initialize();
                        if (!initialized) {
                            throw new Error('GitHub service not initialized');
                        }

                        const comments = await this.githubService.getIssueComments(targetIssue);
                        const feedbackItems: FeedbackItem[] = [];

                        for (const comment of comments) {
                            const type = this.categorizeFeedback(comment.body);
                            feedbackItems.push({
                                id: comment.id,
                                author: comment.user.login,
                                type,
                                content: comment.body,
                                timestamp: new Date(comment.created_at),
                                resolved: false // Would need additional logic to determine resolution
                            });
                        }

                        return feedbackItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                    },
                    {
                        cacheKey: `feedback-${targetIssue}`,
                        cacheDuration: 5 * 60 * 1000, // 5 minutes
                        priority: 'medium'
                    }
                );
            },
            {
                operationType: 'check-feedback',
                priority: 'medium'
            }
        );
    }

    /**
     * Request re-review with stakeholder selection
     */
    public async requestReReview(): Promise<void> {
        if (!this.currentWorkflowStatus?.issueNumber) {
            vscode.window.showErrorMessage('No active workflow found. Please push requirements to GitHub first.');
            return;
        }

        try {
            // Get list of potential reviewers
            const stakeholders = await this.getAvailableStakeholders();
            
            // Show stakeholder selection UI
            const selectedReviewers = await vscode.window.showQuickPick(
                stakeholders.map(s => ({
                    label: s.login,
                    description: s.name || s.login,
                    detail: s.role || 'Team Member'
                })),
                {
                    canPickMany: true,
                    placeHolder: 'Select stakeholders for re-review'
                }
            );

            if (!selectedReviewers || selectedReviewers.length === 0) {
                return;
            }

            // Post re-review comment
            const reviewerMentions = selectedReviewers.map(r => `@${r.label}`).join(' ');
            const reReviewComment = `🔄 **Re-Review Requested**\n\n` +
                `${reviewerMentions}, please review the updated requirements.\n\n` +
                `**Changes since last review:**\n` +
                `- Updated requirements document\n` +
                `- Addressed previous feedback\n\n` +
                `Please provide your approval with 👍 or request changes with 👎`;

            await this.githubService.createIssueComment(
                this.currentWorkflowStatus.issueNumber,
                reReviewComment
            );

            vscode.window.showInformationMessage(
                `✅ Re-review requested from ${selectedReviewers.length} stakeholders`,
                'View on GitHub'
            );

            // Update workflow status
            this.currentWorkflowStatus.status = 'in_progress';
            this.currentWorkflowStatus.lastUpdated = new Date();
            this.currentWorkflowStatus.nextActions = ['Monitor re-review responses', 'Address new feedback'];

        } catch (error: any) {
            logger.error('Failed to request re-review', error);
            vscode.window.showErrorMessage(`Failed to request re-review: ${error.message}`);
        }
    }

    /**
     * Validate requirements approval before development transition
     */
    public async validateForDevelopmentTransition(): Promise<{ canTransition: boolean; reason: string }> {
        if (!this.currentWorkflowStatus?.issueNumber) {
            return { canTransition: false, reason: 'No active workflow found' };
        }

        try {
            const approvalStatus = await this.getApprovalStatus();
            const requiredApprovals = await this.getRequiredApprovalCount();

            // Validation checks
            if (approvalStatus.changesRequestedCount > 0) {
                return { 
                    canTransition: false, 
                    reason: `${approvalStatus.changesRequestedCount} reviewer(s) requested changes` 
                };
            }

            if (approvalStatus.approvedCount < requiredApprovals) {
                return { 
                    canTransition: false, 
                    reason: `Need ${requiredApprovals - approvalStatus.approvedCount} more approvals (${approvalStatus.approvedCount}/${requiredApprovals})` 
                };
            }

            return { canTransition: true, reason: 'All validation checks passed' };

        } catch (error: any) {
            logger.error('Failed to validate development transition', error);
            return { canTransition: false, reason: `Validation failed: ${error.message}` };
        }
    }

    /**
     * Move requirements to development status
     */
    public async moveToInDevelopment(): Promise<void> {
        const validation = await this.validateForDevelopmentTransition();
        
        if (!validation.canTransition) {
            vscode.window.showWarningMessage(`Cannot move to development: ${validation.reason}`);
            return;
        }

        try {
            if (!this.currentWorkflowStatus?.issueNumber) {
                throw new Error('No active workflow found');
            }

            // Update issue with development label and comment
            await this.githubService.addIssueLabels(
                this.currentWorkflowStatus.issueNumber,
                ['in-development']
            );

            await this.githubService.removeIssueLabels(
                this.currentWorkflowStatus.issueNumber,
                ['review-needed']
            );

            const developmentComment = `🚀 **Moved to Development**\n\n` +
                `Requirements have been approved and are now in development.\n\n` +
                `**Approval Summary:**\n` +
                `- All required approvals received\n` +
                `- No outstanding change requests\n` +
                `- Requirements frozen for development\n\n` +
                `*Generated by S-cubed Extension*`;

            await this.githubService.createIssueComment(
                this.currentWorkflowStatus.issueNumber,
                developmentComment
            );

            // Update workflow status
            this.currentWorkflowStatus.stage = 'development_ready';
            this.currentWorkflowStatus.status = 'completed';
            this.currentWorkflowStatus.lastUpdated = new Date();
            this.currentWorkflowStatus.nextActions = ['Begin development work'];

            vscode.window.showInformationMessage(
                '✅ Requirements successfully moved to development!',
                'View on GitHub'
            );

        } catch (error: any) {
            logger.error('Failed to move to development', error);
            vscode.window.showErrorMessage(`Failed to move to development: ${error.message}`);
        }
    }

    /**
     * Get current workflow status
     */
    public getCurrentWorkflowStatus(): WorkflowStatus | null {
        return this.currentWorkflowStatus;
    }

    /**
     * Private helper methods
     */
    private extractTitle(content: string): string | null {
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return titleMatch ? titleMatch[1].trim() : null;
    }

    private async getDefaultAssignees(): Promise<string[]> {
        const config = vscode.workspace.getConfiguration('scubed.github');
        return config.get<string[]>('defaultAssignees', []);
    }

    private async getRequiredApprovalCount(): Promise<number> {
        const config = vscode.workspace.getConfiguration('scubed.github');
        return config.get<number>('requiredApprovals', 2);
    }

    private categorizeFeedback(content: string): 'approval' | 'changes_requested' | 'question' | 'suggestion' {
        const lowerContent = content.toLowerCase();
        
        if (lowerContent.includes('lgtm') || lowerContent.includes('approved') || lowerContent.includes('approve')) {
            return 'approval';
        }
        if (lowerContent.includes('changes') || lowerContent.includes('request') || lowerContent.includes('fix')) {
            return 'changes_requested';
        }
        if (lowerContent.includes('?') || lowerContent.includes('question') || lowerContent.includes('clarify')) {
            return 'question';
        }
        return 'suggestion';
    }

    private async getAvailableStakeholders(): Promise<Array<{login: string; name?: string; role?: string}>> {
        // Get team members from GitHub or configuration
        const config = vscode.workspace.getConfiguration('scubed.github');
        const configuredStakeholders = config.get<Array<{login: string; name?: string; role?: string}>>('stakeholders', []);
        
        if (configuredStakeholders.length > 0) {
            return configuredStakeholders;
        }

        // Fallback to repository collaborators
        try {
            const collaborators = await this.githubService.getRepositoryCollaborators();
            return collaborators.map(c => ({ login: c.login, name: c.name }));
        } catch (error) {
            logger.warn('Could not fetch repository collaborators', error as Error);
            return [];
        }
    }

    private async initializeApprovalTracking(issueNumber: number): Promise<void> {
        // Set up initial approval tracking
        logger.info('Approval tracking initialized', { issueNumber });
    }

    private async setupWorkflowMonitoring(issueNumber: number): Promise<void> {
        // Set up periodic monitoring (could use webhooks in future)
        logger.info('Workflow monitoring set up', { issueNumber });
    }

    private async handleDashboardAction(action: string | undefined): Promise<void> {
        switch (action) {
            case 'View on GitHub':
                if (this.currentWorkflowStatus?.issueNumber) {
                    const config = vscode.workspace.getConfiguration('scubed.github');
                    const repository = config.get<string>('repository', '');
                    if (repository) {
                        const url = `${repository}/issues/${this.currentWorkflowStatus.issueNumber}`;
                        vscode.env.openExternal(vscode.Uri.parse(url));
                    }
                }
                break;
                
            case 'Refresh Status':
                await this.showApprovalDashboard();
                break;
                
            case 'Request Re-Review':
                await this.requestReReview();
                break;
        }
    }
}

// Export for testing
export { GitHubWorkflowService as testableGitHubWorkflowService };
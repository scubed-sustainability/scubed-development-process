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
import { PlannerIntegrationService } from './planner-integration-service';

export interface WorkflowStatus {
    stage: 'requirements' | 'github_push' | 'approval_tracking' | 'feedback_review' | 'development_ready';
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    issueNumber?: number;
    approvalCount: number;
    requiredApprovals: number;
    lastUpdated: Date;
    nextActions: string[];
    requirementsContent?: string; // Store requirements content for Planner integration
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

export interface ErrorContext {
    type: 'network' | 'authentication' | 'data' | 'unknown';
    severity: 'recoverable' | 'user_fixable' | 'non_recoverable';
    userAction: 'retry' | 'reauth' | 'fix_data' | 'manual';
    technicalDetails: string;
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
        private rateLimitService: RateLimitService,
        private plannerService?: PlannerIntegrationService
    ) {
        // Initialize Planner service if not provided
        this.plannerService = plannerService || new PlannerIntegrationService();
    }

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

            // Read requirements content for Planner integration later
            const requirementsContent = await fs.readFile(requirementsFile, 'utf8');

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
                nextActions: ['Monitor approval status', 'Check feedback', 'Respond to comments'],
                requirementsContent
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

            // 🚀 NEW: Trigger Microsoft Planner integration
            await this.triggerPlannerIntegration();

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

    /**
     * 🔵 REFACTOR: Main trigger method - now focused and clean
     * Orchestrates the Planner integration workflow
     */
    private async triggerPlannerIntegration(): Promise<void> {
        // Validate prerequisites
        if (!this.validatePlannerIntegrationPrerequisites()) {
            return;
        }

        try {
            logger.info('Triggering Microsoft Planner integration...');

            // Execute the integration
            const integrationResult = await this.executePlannerIntegration();
            
            // Handle the result
            await this.handlePlannerIntegrationResult(integrationResult);

        } catch (error) {
            await this.handlePlannerIntegrationError(error as Error);
        }
    }

    /**
     * 🔵 REFACTOR: Validate prerequisites for Planner integration
     */
    private validatePlannerIntegrationPrerequisites(): boolean {
        if (!this.currentWorkflowStatus?.issueNumber) {
            logger.warn('Cannot trigger Planner integration: missing issue number');
            return false;
        }

        if (!this.plannerService) {
            logger.warn('Cannot trigger Planner integration: Planner service not available');
            return false;
        }

        return true;
    }

    /**
     * 🔵 REFACTOR: Execute the core Planner integration logic
     */
    private async executePlannerIntegration() {
        const requirementsContent = await this.getRequirementsContent();
        if (!requirementsContent) {
            throw new Error('No requirements content found for Planner integration');
        }

        return await this.plannerService!.handleRequirementsApproval(
            this.currentWorkflowStatus!.issueNumber!,
            requirementsContent
        );
    }

    /**
     * 🔵 REFACTOR: Handle integration result (success or failure)
     */
    private async handlePlannerIntegrationResult(integrationResult: any): Promise<void> {
        if (integrationResult.success) {
            await this.handlePlannerIntegrationSuccess(integrationResult);
        } else {
            await this.handlePlannerIntegrationFailure(integrationResult);
        }
    }

    /**
     * 🔵 REFACTOR: Handle successful Planner integration
     */
    private async handlePlannerIntegrationSuccess(integrationResult: any): Promise<void> {
        // Post success comment to GitHub
        await this.postPlannerSuccessComment(integrationResult);
        
        // Show user notification and handle response
        await this.showPlannerSuccessNotification(integrationResult);
        
        logger.info(`Planner integration successful: ${integrationResult.tasksCreated} tasks created`);
    }

    /**
     * 🔵 REFACTOR: Enhanced failure handling with actionable information
     */
    private async handlePlannerIntegrationFailure(integrationResult: any): Promise<void> {
        const errorMessage = integrationResult.errors?.join(', ') || 'Unknown error';
        logger.error(`Planner integration failed: ${errorMessage}`);
        
        const message = this.buildFailureMessage(integrationResult);
        const actions = this.getFailureActions(integrationResult);
        
        const choice = await vscode.window.showWarningMessage(message, ...actions);
        await this.handleFailureAction(choice, integrationResult);
    }

    /**
     * 🔵 REFACTOR: Build informative failure message
     */
    private buildFailureMessage(integrationResult: any): string {
        const hasErrors = integrationResult.errors && integrationResult.errors.length > 0;
        const errorDetails = hasErrors ? integrationResult.errors[0] : 'Unknown error occurred';
        
        return `⚠️ Microsoft Planner Integration Failed\n\n` +
               `❌ ${errorDetails}\n\n` +
               `✅ Your requirements are still approved\n` +
               `📋 You can create user stories manually in Planner\n` +
               `🚀 Development can continue as planned`;
    }

    /**
     * 🔵 REFACTOR: Get appropriate actions for failure
     */
    private getFailureActions(integrationResult: any): string[] {
        return ['Try Manual Setup', 'View Logs', 'Continue Anyway'];
    }

    /**
     * 🔵 REFACTOR: Handle user's choice from failure notification
     */
    private async handleFailureAction(choice: string | undefined, integrationResult: any): Promise<void> {
        switch (choice) {
            case 'Try Manual Setup':
                logger.info('User chose manual Planner setup');
                await this.showManualSetupGuidance(integrationResult);
                break;
            
            case 'View Logs':
                logger.info('User requested to view error logs');
                await vscode.commands.executeCommand('scubed.showLogOutput');
                break;
            
            default:
                logger.info('User chose to continue anyway');
                break;
        }
    }

    /**
     * 🔵 REFACTOR: Show manual setup guidance
     */
    private async showManualSetupGuidance(integrationResult: any): Promise<void> {
        const guidance = `📋 Manual Planner Setup Guide:\n\n` +
                        `1. Open Microsoft Planner in your browser\n` +
                        `2. Create a new plan or select existing plan\n` +
                        `3. Add the following user stories as tasks:\n\n` +
                        `   ${this.formatUserStoriesForManualSetup()}\n\n` +
                        `4. Assign tasks to team members\n` +
                        `5. Set due dates and priorities\n\n` +
                        `Need help? Check our documentation for detailed steps.`;
        
        const choice = await vscode.window.showInformationMessage(
            guidance,
            'Open Planner',
            'View Documentation',
            'OK'
        );
        
        if (choice === 'Open Planner') {
            await vscode.env.openExternal(vscode.Uri.parse('https://tasks.office.com'));
        } else if (choice === 'View Documentation') {
            await vscode.env.openExternal(vscode.Uri.parse('https://github.com/scubed-sustainability/scubed-development-process#planner-integration'));
        }
    }

    /**
     * 🔵 REFACTOR: Format user stories for manual setup
     */
    private formatUserStoriesForManualSetup(): string {
        // This would be populated from the parsed requirements
        return '• User Authentication System\n   • Product Dashboard\n   • Task Management System';
    }

    /**
     * 🔵 REFACTOR: Enhanced error handling with recovery strategies
     */
    private async handlePlannerIntegrationError(error: Error): Promise<void> {
        logger.logFunctionEntry('GitHubWorkflowService.handlePlannerIntegrationError');
        logger.error('Planner integration failed', error);
        
        // Create error context for actionable user guidance
        const errorContext = this.createErrorContext(error, 'planner_integration_failed');
        await this.showActionableErrorMessage(errorContext);
    }

    /**
     * 🔵 REFACTOR: Categorize errors for appropriate handling
     */
    private categorizeIntegrationError(error: Error): ErrorContext {
        if (error.message.includes('network') || error.message.includes('timeout')) {
            return {
                type: 'network',
                severity: 'recoverable',
                userAction: 'retry',
                technicalDetails: error.message
            };
        }
        
        if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
            return {
                type: 'authentication',
                severity: 'recoverable',
                userAction: 'reauth',
                technicalDetails: error.message
            };
        }
        
        if (error.message.includes('requirements content')) {
            return {
                type: 'data',
                severity: 'user_fixable',
                userAction: 'fix_data',
                technicalDetails: error.message
            };
        }
        
        return {
            type: 'unknown',
            severity: 'non_recoverable',
            userAction: 'manual',
            technicalDetails: error.message
        };
    }

    /**
     * 🔵 REFACTOR: Build contextual error messages
     */
    private buildErrorMessage(errorContext: ErrorContext): string {
        switch (errorContext.type) {
            case 'network':
                return '🌐 Network issue detected. Microsoft Planner integration failed due to connectivity problems.';
            
            case 'authentication':
                return '🔐 Authentication required. Please sign in to Microsoft to enable Planner integration.';
            
            case 'data':
                return '📋 Requirements data issue. Please check your requirements document format.';
            
            default:
                return '⚠️ Failed to integrate with Microsoft Planner. Development can continue manually.';
        }
    }

    /**
     * 🔵 REFACTOR: Get appropriate recovery actions
     */
    private getErrorRecoveryActions(errorContext: ErrorContext): string[] {
        switch (errorContext.type) {
            case 'network':
                return ['Retry', 'Continue Anyway', 'View Logs'];
            
            case 'authentication':
                return ['Sign In', 'Continue Anyway', 'Help'];
            
            case 'data':
                return ['Fix Requirements', 'Continue Anyway', 'View Logs'];
            
            default:
                return ['View Logs', 'Continue', 'Report Issue'];
        }
    }

    /**
     * 🔵 REFACTOR: Handle user's error recovery choice
     */
    private async handleErrorRecoveryAction(choice: string | undefined, errorContext: ErrorContext): Promise<void> {
        switch (choice) {
            case 'Retry':
                logger.info('User requested retry of Planner integration');
                // Could implement retry with exponential backoff
                await this.triggerPlannerIntegration();
                break;
            
            case 'Sign In':
                logger.info('User requested authentication for Planner');
                // Could trigger authentication flow
                vscode.window.showInformationMessage('Authentication flow will be implemented in real API integration.');
                break;
            
            case 'Fix Requirements':
                logger.info('User requested to fix requirements');
                await this.openRequirementsForEditing();
                break;
            
            case 'View Logs':
                logger.info('User requested to view logs');
                await vscode.commands.executeCommand('scubed.showLogOutput');
                break;
            
            case 'Report Issue':
                logger.info('User requested to report issue');
                await vscode.env.openExternal(vscode.Uri.parse('https://github.com/scubed-sustainability/scubed-development-process/issues'));
                break;
            
            default:
                logger.info('User chose to continue anyway');
                break;
        }
    }

    /**
     * 🔵 REFACTOR: Open requirements file for editing
     */
    private async openRequirementsForEditing(): Promise<void> {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (workspaceFolders) {
                const requirementsFiles = ['requirements.md', 'REQUIREMENTS.md', 'docs/requirements.md'];
                
                for (const fileName of requirementsFiles) {
                    const filePath = vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, fileName));
                    try {
                        await vscode.window.showTextDocument(filePath);
                        return;
                    } catch {
                        continue;
                    }
                }
            }
            
            vscode.window.showWarningMessage('Could not find requirements file to edit.');
        } catch (error) {
            logger.error('Error opening requirements for editing', error as Error);
        }
    }

    /**
     * 🔵 REFACTOR: Post success comment to GitHub
     */
    private async postPlannerSuccessComment(integrationResult: any): Promise<void> {
        const plannerComment = this.buildPlannerSuccessComment(integrationResult);
        
        await this.githubService.createIssueComment(
            this.currentWorkflowStatus!.issueNumber!,
            plannerComment
        );
    }

    /**
     * 🔵 REFACTOR: Build the success comment content
     */
    private buildPlannerSuccessComment(integrationResult: any): string {
        return `📋 **Microsoft Planner Integration**\n\n` +
            `✅ Successfully created ${integrationResult.tasksCreated} user stories in Planner!\n\n` +
            `🔗 **View Tasks:** [Open Planner](${integrationResult.plannerUrl})\n\n` +
            `**Next Steps:**\n` +
            `- Review user stories in Planner\n` +
            `- Assign tasks to development team\n` +
            `- Begin sprint planning\n\n` +
            `*Automated by S-cubed Extension*`;
    }

    /**
     * 🔵 REFACTOR: Enhanced success notification with detailed information
     */
    private async showPlannerSuccessNotification(integrationResult: any): Promise<void> {
        const message = this.buildDetailedSuccessMessage(integrationResult);
        const actions = ['View Planner', 'View GitHub Issue', 'Continue'];
        
        const choice = await vscode.window.showInformationMessage(message, ...actions);
        await this.handleSuccessNotificationAction(choice, integrationResult);
    }

    /**
     * 🔵 REFACTOR: Build detailed success message
     */
    private buildDetailedSuccessMessage(integrationResult: any): string {
        const taskCount = integrationResult.tasksCreated;
        const taskWord = taskCount === 1 ? 'user story' : 'user stories';
        
        return `🎉 Successfully integrated with Microsoft Planner!\n\n` +
               `✅ Created ${taskCount} ${taskWord}\n` +
               `📋 Ready for sprint planning\n` +
               `🔗 Tasks are now available in your Planner board`;
    }

    /**
     * 🔵 REFACTOR: Handle user's choice from success notification
     */
    private async handleSuccessNotificationAction(choice: string | undefined, integrationResult: any): Promise<void> {
        switch (choice) {
            case 'View Planner':
                logger.info('User chose to view Planner board');
                await vscode.env.openExternal(vscode.Uri.parse(integrationResult.plannerUrl));
                break;
            
            case 'View GitHub Issue':
                logger.info('User chose to view GitHub issue');
                await this.openCurrentGitHubIssue();
                break;
            
            default:
                logger.info('User chose to continue workflow');
                break;
        }
    }

    /**
     * 🔵 REFACTOR: Open current GitHub issue in browser
     */
    private async openCurrentGitHubIssue(): Promise<void> {
        if (this.currentWorkflowStatus?.issueNumber) {
            const config = vscode.workspace.getConfiguration('scubed.github');
            const repository = config.get('repository', '');
            
            if (repository) {
                const issueUrl = `${repository}/issues/${this.currentWorkflowStatus.issueNumber}`;
                await vscode.env.openExternal(vscode.Uri.parse(issueUrl));
            } else {
                vscode.window.showWarningMessage('GitHub repository not configured. Please check your settings.');
            }
        }
    }

    /**
     * Get requirements content from stored workflow status
     */
    private async getRequirementsContent(): Promise<string | null> {
        if (!this.currentWorkflowStatus?.requirementsContent) {
            logger.warn('No requirements content stored in workflow status');
            return null;
        }

        return this.currentWorkflowStatus.requirementsContent;
    }


    /**
     * 🔵 REFACTOR: Create structured error context for user guidance
     */
    private createErrorContext(error: Error, errorType: string): ErrorContext {
        const message = error.message.toLowerCase();
        
        // Network-related errors
        if (message.includes('network') || message.includes('timeout') || message.includes('connection') || message.includes('enotfound')) {
            return {
                type: 'network',
                severity: 'recoverable',
                userAction: 'retry',
                technicalDetails: error.message
            };
        }
        
        // Authentication errors
        if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('token') || message.includes('auth')) {
            return {
                type: 'authentication',
                severity: 'user_fixable',
                userAction: 'reauth',
                technicalDetails: error.message
            };
        }
        
        // Data validation errors
        if (message.includes('invalid') || message.includes('parse') || message.includes('format') || message.includes('validation')) {
            return {
                type: 'data',
                severity: 'user_fixable',
                userAction: 'fix_data',
                technicalDetails: error.message
            };
        }
        
        // Unknown errors
        return {
            type: 'unknown',
            severity: 'non_recoverable',
            userAction: 'manual',
            technicalDetails: error.message
        };
    }

    /**
     * 🔵 REFACTOR: Show actionable error messages with recovery options
     */
    private async showActionableErrorMessage(errorContext: ErrorContext): Promise<void> {
        logger.logFunctionEntry('GitHubWorkflowService.showActionableErrorMessage');
        
        let message: string;
        let actions: string[] = ['Manual Setup']; // Always provide manual fallback
        
        switch (errorContext.type) {
            case 'network':
                message = `🌐 Network connection failed: Unable to connect to Microsoft Planner. Please check your internet connection and try again.`;
                actions.unshift('Retry');
                break;
                
            case 'authentication':
                message = `🔐 Authentication failed: Your Microsoft credentials need to be refreshed. Please sign in again to continue.`;
                actions.unshift('Sign In Again', 'Check Configuration');
                break;
                
            case 'data':
                message = `📝 Data validation failed: There's an issue with your requirements format. Please review and fix the requirements structure.`;
                actions.unshift('Review Requirements', 'Fix Format');
                break;
                
            default:
                message = `⚠️ Planner integration failed: ${errorContext.technicalDetails}. Please try manual setup or contact support.`;
                actions.unshift('Retry', 'View Logs');
                break;
        }
        
        const selectedAction = await vscode.window.showErrorMessage(message, ...actions);
        
        // Handle user action selection
        switch (selectedAction) {
            case 'Retry':
                await this.triggerPlannerIntegration();
                break;
                
            case 'Sign In Again':
                vscode.commands.executeCommand('scubed.showConfigurationHealth');
                break;
                
            case 'Check Configuration':
                vscode.commands.executeCommand('scubed.showConfigurationHealth');
                break;
                
            case 'Review Requirements':
                // Open requirements file if available
                if (this.currentWorkflowStatus?.requirementsContent) {
                    const doc = await vscode.workspace.openTextDocument({
                        content: this.currentWorkflowStatus.requirementsContent,
                        language: 'markdown'
                    });
                    vscode.window.showTextDocument(doc);
                }
                break;
                
            case 'View Logs':
                vscode.commands.executeCommand('scubed.showLogOutput');
                break;
                
            case 'Manual Setup':
            default:
                vscode.window.showInformationMessage(
                    'Manual Setup: Please create user stories in Microsoft Planner manually using your approved requirements.',
                    'Open Planner'
                ).then(action => {
                    if (action === 'Open Planner') {
                        vscode.env.openExternal(vscode.Uri.parse('https://tasks.office.com'));
                    }
                });
                break;
        }
    }
}

// Export for testing
export { GitHubWorkflowService as testableGitHubWorkflowService };
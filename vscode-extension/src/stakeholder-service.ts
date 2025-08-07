/**
 * Stakeholder Selection Service
 * 🟢 GREEN PHASE: Implementation for stakeholder management and re-review UI
 */

import * as vscode from 'vscode';
import { Octokit } from '@octokit/rest';
import { logger } from './logger';
import { GitHubService } from './github-service';

export interface Stakeholder {
    login: string;
    name: string;
    role?: string;
    avatar_url?: string;
    email?: string;
}

export interface StakeholderTeam {
    name: string;
    members: Stakeholder[];
    description?: string;
}

export interface ReReviewRequest {
    issueNumber: number;
    selectedStakeholders: string[];
    reason?: string;
}

/**
 * Service to handle stakeholder management and re-review requests
 */
export class StakeholderService {
    private octokit: Octokit | null = null;
    private cachedStakeholders: Stakeholder[] = [];
    private lastCacheTime = 0;
    private readonly cacheValidityMs = 5 * 60 * 1000; // 5 minutes

    constructor(
        private gitHubService: GitHubService
    ) {}

    /**
     * Initialize stakeholder service with GitHub integration
     */
    public async initialize(): Promise<boolean> {
        logger.logFunctionEntry('StakeholderService.initialize');
        
        try {
            // Get GitHub client from service 
            const config = this.gitHubService.getConfig();
            if (config?.token) {
                this.octokit = new Octokit({
                    auth: config.token
                });
                logger.info('StakeholderService initialized successfully with GitHub token');
                return true;
            } else {
                logger.warn('GitHub service not configured, stakeholder features unavailable');
                return false;
            }
            
        } catch (error) {
            logger.error('Failed to initialize StakeholderService', error as Error);
            return false;
        }
    }

    /**
     * Show stakeholder selection UI for re-review
     */
    public async showStakeholderPicker(issueNumber: number): Promise<ReReviewRequest | null> {
        logger.logFunctionEntry('StakeholderService.showStakeholderPicker', issueNumber);
        
        try {
            // Get available stakeholders
            const stakeholders = await this.getTeamStakeholders();
            
            if (stakeholders.length === 0) {
                await this.handleNoStakeholders();
                return null;
            }

            // Show stakeholder selection UI
            const selected = await this.showStakeholderQuickPick(stakeholders);
            
            if (!selected || selected.length === 0) {
                logger.info('User cancelled stakeholder selection');
                return null;
            }

            // Get optional reason for re-review
            const reason = await this.getReReviewReason();

            const request: ReReviewRequest = {
                issueNumber,
                selectedStakeholders: selected.map(s => s.login),
                reason
            };

            logger.logUserAction('Stakeholder re-review requested', {
                issueNumber,
                stakeholders: selected.map(s => s.login)
            });

            return request;
            
        } catch (error) {
            logger.error('Failed to show stakeholder picker', error as Error);
            vscode.window.showErrorMessage(`Failed to load stakeholders: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Execute re-review request via GitHub API
     */
    public async executeReReview(request: ReReviewRequest): Promise<boolean> {
        logger.logFunctionEntry('StakeholderService.executeReReview', request);
        
        if (!this.octokit) {
            logger.error('GitHub client not initialized');
            return false;
        }

        try {
            const config = this.gitHubService.getConfig();
            if (!config) {
                throw new Error('GitHub configuration not available');
            }

            // Add reviewers to the issue/PR
            await this.addReviewers(config.owner, config.repo, request.issueNumber, request.selectedStakeholders);

            // Post comment mentioning stakeholders
            await this.postReReviewComment(config.owner, config.repo, request.issueNumber, request.selectedStakeholders, request.reason);

            // Update issue labels
            await this.updateIssueLabels(config.owner, config.repo, request.issueNumber);

            logger.info('Re-review request executed successfully');
            
            // Show success message
            const stakeholderNames = request.selectedStakeholders.join(', ');
            vscode.window.showInformationMessage(
                `✅ Re-review requested from ${stakeholderNames} for issue #${request.issueNumber}`
            );

            return true;
            
        } catch (error) {
            logger.error('Failed to execute re-review request', error as Error);
            vscode.window.showErrorMessage(`Failed to request re-review: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Get team stakeholders from GitHub
     */
    private async getTeamStakeholders(): Promise<Stakeholder[]> {
        // Return cached stakeholders if valid
        if (this.cachedStakeholders.length > 0 && Date.now() - this.lastCacheTime < this.cacheValidityMs) {
            return this.cachedStakeholders;
        }

        const config = vscode.workspace.getConfiguration('scubed');
        const stakeholderTeam = config.get<string>('github.stakeholderTeam', '');
        const owner = config.get<string>('github.owner', '');

        if (!stakeholderTeam || !owner || !this.octokit) {
            return [];
        }

        try {
            logger.info(`Fetching stakeholders from team: ${stakeholderTeam}`);
            
            // Get team members
            const { data: members } = await this.octokit.teams.listMembersInOrg({
                org: owner,
                team_slug: stakeholderTeam
            });

            // Convert to Stakeholder format
            this.cachedStakeholders = members.map(member => ({
                login: member.login,
                name: member.name || member.login,
                avatar_url: member.avatar_url,
                role: this.getStakeholderRole(member.login) // Get from config or default
            }));

            this.lastCacheTime = Date.now();
            
            logger.info(`Loaded ${this.cachedStakeholders.length} stakeholders`);
            return this.cachedStakeholders;
            
        } catch (error) {
            logger.error('Failed to fetch team stakeholders', error as Error);
            
            // Fallback to repository collaborators if team access fails
            return await this.getRepositoryCollaborators();
        }
    }

    /**
     * Fallback: Get repository collaborators as stakeholders
     */
    private async getRepositoryCollaborators(): Promise<Stakeholder[]> {
        if (!this.octokit) return [];

        const config = vscode.workspace.getConfiguration('scubed');
        const owner = config.get<string>('github.owner', '');
        const repo = config.get<string>('github.repo', '');

        if (!owner || !repo) return [];

        try {
            const { data: collaborators } = await this.octokit.repos.listCollaborators({
                owner,
                repo
            });

            return collaborators.map(collab => ({
                login: collab.login,
                name: collab.name || collab.login,
                avatar_url: collab.avatar_url,
                role: collab.permissions?.admin ? 'Admin' : 'Collaborator'
            }));
            
        } catch (error) {
            logger.error('Failed to fetch repository collaborators', error as Error);
            return [];
        }
    }

    /**
     * Show stakeholder selection quick pick UI
     */
    private async showStakeholderQuickPick(stakeholders: Stakeholder[]): Promise<Stakeholder[]> {
        const items = stakeholders.map(stakeholder => ({
            label: `$(person) ${stakeholder.name}`,
            description: `@${stakeholder.login}`,
            detail: stakeholder.role || 'Team Member',
            stakeholder
        }));

        const selected = await vscode.window.showQuickPick(items, {
            canPickMany: true,
            placeHolder: 'Select stakeholders for re-review',
            matchOnDescription: true,
            matchOnDetail: true,
            title: 'Request Re-Review from Stakeholders'
        });

        return selected ? selected.map(item => item.stakeholder) : [];
    }

    /**
     * Get optional reason for re-review
     */
    private async getReReviewReason(): Promise<string | undefined> {
        const reason = await vscode.window.showInputBox({
            prompt: 'Optional: Reason for re-review request',
            placeHolder: 'e.g., Updated requirements based on feedback',
            ignoreFocusOut: true
        });

        return reason || undefined;
    }

    /**
     * Handle case when no stakeholders are available
     */
    private async handleNoStakeholders(): Promise<void> {
        const config = vscode.workspace.getConfiguration('scubed');
        const stakeholderTeam = config.get<string>('github.stakeholderTeam', '');

        let message: string;
        let actions: string[];

        if (!stakeholderTeam) {
            message = 'No stakeholder team configured. Configure a GitHub team for stakeholder notifications.';
            actions = ['Configure Settings', 'Learn More'];
        } else {
            message = `No stakeholders found in team "${stakeholderTeam}". Check team name and permissions.`;
            actions = ['Check Settings', 'Use Manual Entry'];
        }

        const action = await vscode.window.showWarningMessage(message, ...actions);

        if (action === 'Configure Settings' || action === 'Check Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'scubed.github.stakeholderTeam');
        } else if (action === 'Learn More') {
            vscode.env.openExternal(vscode.Uri.parse('https://docs.github.com/en/organizations/organizing-members-into-teams'));
        } else if (action === 'Use Manual Entry') {
            // Could implement manual stakeholder entry here
            vscode.window.showInformationMessage('Manual stakeholder entry not yet implemented');
        }
    }

    /**
     * Get stakeholder role from configuration
     */
    private getStakeholderRole(login: string): string {
        const config = vscode.workspace.getConfiguration('scubed');
        const roles = config.get<{[key: string]: string}>('github.stakeholderRoles', {});
        return roles[login] || 'Stakeholder';
    }

    /**
     * Add reviewers to GitHub issue/PR
     */
    private async addReviewers(_owner: string, _repo: string, issueNumber: number, reviewers: string[]): Promise<void> {
        if (!this.octokit) return;

        try {
            // For issues, we can't add reviewers directly, but we can request review via PR
            // For now, we'll just mention them in comments
            logger.info(`Adding reviewers ${reviewers.join(', ')} to issue #${issueNumber}`);
            
        } catch (error) {
            logger.warn('Could not add reviewers directly', error as Error);
            // This is okay - we'll mention them in comments instead
        }
    }

    /**
     * Post re-review comment mentioning stakeholders
     */
    private async postReReviewComment(owner: string, repo: string, issueNumber: number, stakeholders: string[], reason?: string): Promise<void> {
        if (!this.octokit) return;

        const mentions = stakeholders.map(login => `@${login}`).join(' ');
        const reasonText = reason ? `\n\n**Reason:** ${reason}` : '';
        
        const commentBody = `🔄 **Re-Review Requested**

${mentions} - Your review is requested on this requirements document.${reasonText}

Please review the updated requirements and provide your approval or feedback.

---
*Requested via S-cubed VS Code Extension*`;

        await this.octokit.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body: commentBody
        });

        logger.info('Re-review comment posted successfully');
    }

    /**
     * Update issue labels for re-review
     */
    private async updateIssueLabels(owner: string, repo: string, issueNumber: number): Promise<void> {
        if (!this.octokit) return;

        try {
            // Add "re-review requested" label
            await this.octokit.issues.addLabels({
                owner,
                repo,
                issue_number: issueNumber,
                labels: ['re-review-requested']
            });

            logger.info('Issue labels updated for re-review');
            
        } catch (error) {
            logger.warn('Could not update issue labels', error as Error);
            // Non-critical error
        }
    }

    /**
     * Clear cached stakeholders (for testing)
     */
    public clearCache(): void {
        this.cachedStakeholders = [];
        this.lastCacheTime = 0;
    }
}

// Export for testing
export { StakeholderService as testableStakeholderService };
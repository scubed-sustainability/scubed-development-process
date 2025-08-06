/**
 * Status Validation Service
 * 🟢 GREEN PHASE: Implementation for status transition validation
 */

import * as vscode from 'vscode';
import { logger } from './logger';
import { GitHubService } from './github-service';

export interface ApprovalDetails {
    login: string;
    name: string;
    role?: string;
    approvedAt?: string;
    lastNotified?: string;
}

export interface ApprovalStatus {
    totalStakeholders: number;
    approvalCount: number;
    approvedBy: ApprovalDetails[];
    pendingApprovals: ApprovalDetails[];
    criticalStakeholders?: string[];
    isApproved: boolean;
    lastUpdated?: string;
}

export interface StatusValidationResult {
    canMoveToDevelopment: boolean;
    reason?: string;
    warnings: string[];
    approvalStatus: ApprovalStatus;
}

/**
 * Service to validate status transitions and approval requirements
 */
export class StatusValidationService {
    constructor(
        private gitHubService: GitHubService
    ) {}

    /**
     * Validate if requirements can be moved to development
     */
    public async validateMoveToInDevelopment(issueNumber: number): Promise<StatusValidationResult> {
        logger.logFunctionEntry('StatusValidationService.validateMoveToInDevelopment', issueNumber);
        
        try {
            // Get current approval status
            const approvalStatus = await this.getDetailedApprovalStatus(issueNumber);
            
            // Validate approval completeness
            const validation = this.validateApprovalCompleteness(approvalStatus);
            
            // Check for additional warnings
            const warnings = await this.getStatusWarnings(issueNumber, approvalStatus);
            
            const result: StatusValidationResult = {
                canMoveToDevelopment: validation.isValid,
                reason: validation.reason,
                warnings,
                approvalStatus
            };
            
            logger.info('Status validation completed', { 
                issueNumber, 
                canMove: result.canMoveToDevelopment,
                approvalCount: approvalStatus.approvalCount,
                totalStakeholders: approvalStatus.totalStakeholders
            });
            
            return result;
            
        } catch (error) {
            logger.error('Status validation failed', error as Error);
            
            return {
                canMoveToDevelopment: false,
                reason: `Validation failed: ${(error as Error).message}`,
                warnings: [],
                approvalStatus: {
                    totalStakeholders: 0,
                    approvalCount: 0,
                    approvedBy: [],
                    pendingApprovals: [],
                    isApproved: false
                }
            };
        }
    }

    /**
     * Show approval status to user with detailed breakdown
     */
    public async showApprovalStatus(validation: StatusValidationResult): Promise<boolean> {
        logger.logFunctionEntry('StatusValidationService.showApprovalStatus');
        
        const { approvalStatus } = validation;
        
        if (validation.canMoveToDevelopment) {
            return await this.showApprovedStatusDialog(approvalStatus);
        } else {
            return await this.showPendingApprovalDialog(validation);
        }
    }

    /**
     * Execute move to development after validation
     */
    public async executeMoveToInDevelopment(issueNumber: number): Promise<boolean> {
        logger.logFunctionEntry('StatusValidationService.executeMoveToInDevelopment', issueNumber);
        
        try {
            // Update issue status in GitHub
            const updated = await this.updateIssueStatus(issueNumber);
            
            if (updated) {
                vscode.window.showInformationMessage(
                    `✅ Requirements #${issueNumber} moved to In Development status!`
                );
                
                logger.logUserAction('Requirements moved to development', { issueNumber });
                return true;
            } else {
                vscode.window.showErrorMessage(
                    `Failed to update issue #${issueNumber} status in GitHub.`
                );
                return false;
            }
            
        } catch (error) {
            logger.error('Failed to execute move to development', error as Error);
            vscode.window.showErrorMessage(
                `Failed to move requirements to development: ${(error as Error).message}`
            );
            return false;
        }
    }

    /**
     * Get detailed approval status from GitHub
     */
    private async getDetailedApprovalStatus(issueNumber: number): Promise<ApprovalStatus> {
        // Use existing GitHubService method but enhance with details
        const basicStatus = await this.gitHubService.checkApprovalStatus(issueNumber);
        
        // Enhance with role information and timestamps
        const approvedBy: ApprovalDetails[] = basicStatus.approvedBy.map(login => ({
            login,
            name: this.getStakeholderName(login),
            role: this.getStakeholderRole(login),
            approvedAt: this.getApprovalTimestamp(issueNumber, login)
        }));
        
        const pendingApprovals: ApprovalDetails[] = basicStatus.pendingApprovals.map(login => ({
            login,
            name: this.getStakeholderName(login),
            role: this.getStakeholderRole(login),
            lastNotified: this.getLastNotificationTime(issueNumber, login)
        }));
        
        return {
            totalStakeholders: basicStatus.totalStakeholders,
            approvalCount: basicStatus.approvalCount,
            approvedBy,
            pendingApprovals,
            criticalStakeholders: this.getCriticalStakeholders(),
            isApproved: basicStatus.isApproved,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Validate approval completeness with business rules
     */
    private validateApprovalCompleteness(status: ApprovalStatus): { isValid: boolean; reason?: string } {
        // Check if all stakeholders have approved
        if (!status.isApproved) {
            const pendingCount = status.totalStakeholders - status.approvalCount;
            return {
                isValid: false,
                reason: `${pendingCount} stakeholder${pendingCount > 1 ? 's' : ''} still need to approve`
            };
        }
        
        // Check if critical stakeholders have approved
        if (status.criticalStakeholders && status.criticalStakeholders.length > 0) {
            const approvedLogins = status.approvedBy.map(a => a.login);
            const pendingCritical = status.criticalStakeholders.filter(
                critical => !approvedLogins.includes(critical)
            );
            
            if (pendingCritical.length > 0) {
                const criticalNames = pendingCritical.map(login => 
                    this.getStakeholderName(login)
                ).join(', ');
                
                return {
                    isValid: false,
                    reason: `Critical stakeholder${pendingCritical.length > 1 ? 's' : ''} must approve: ${criticalNames}`
                };
            }
        }
        
        return { isValid: true };
    }

    /**
     * Get status warnings for user
     */
    private async getStatusWarnings(issueNumber: number, status: ApprovalStatus): Promise<string[]> {
        const warnings: string[] = [];
        
        // Check for stale approvals
        const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
        const now = Date.now();
        
        for (const approval of status.approvedBy) {
            if (approval.approvedAt) {
                const approvalTime = new Date(approval.approvedAt).getTime();
                if (now - approvalTime > staleThreshold) {
                    warnings.push(`${approval.name}'s approval is more than 7 days old`);
                }
            }
        }
        
        // Check for inactive pending approvals
        for (const pending of status.pendingApprovals) {
            if (pending.lastNotified) {
                const notificationTime = new Date(pending.lastNotified).getTime();
                if (now - notificationTime > staleThreshold) {
                    warnings.push(`${pending.name} was last notified more than 7 days ago`);
                }
            }
        }
        
        return warnings;
    }

    /**
     * Show approved status dialog
     */
    private async showApprovedStatusDialog(status: ApprovalStatus): Promise<boolean> {
        const approversList = status.approvedBy.map(a => 
            `✅ ${a.name} (${a.role || 'Stakeholder'})`
        ).join('\n');
        
        const message = `🎉 **Requirements Fully Approved!**

**Approved by ${status.approvalCount}/${status.totalStakeholders} stakeholders:**
${approversList}

Ready to move to In Development?`;

        const choice = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            'Move to Development',
            'Cancel'
        );

        return choice === 'Move to Development';
    }

    /**
     * Show pending approval dialog
     */
    private async showPendingApprovalDialog(validation: StatusValidationResult): Promise<boolean> {
        const { approvalStatus, reason, warnings } = validation;
        
        const approvedList = approvalStatus.approvedBy.map(a => 
            `✅ ${a.name} (${a.role || 'Stakeholder'})`
        ).join('\n');
        
        const pendingList = approvalStatus.pendingApprovals.map(p => 
            `⏳ ${p.name} (${p.role || 'Stakeholder'})`
        ).join('\n');
        
        const warningText = warnings.length > 0 ? 
            `\n⚠️ **Warnings:**\n${warnings.map(w => `• ${w}`).join('\n')}\n` : '';
        
        const message = `📋 **Approval Status**

**Progress:** ${approvalStatus.approvalCount}/${approvalStatus.totalStakeholders} approved

**Approved:**
${approvedList || 'None yet'}

**Pending Approval:**
${pendingList || 'None'}
${warningText}
**Cannot move to development:** ${reason}`;

        const actions = ['Request Re-Review', 'View on GitHub', 'OK'];
        const choice = await vscode.window.showWarningMessage(message, { modal: true }, ...actions);

        if (choice === 'Request Re-Review') {
            vscode.commands.executeCommand('scubed.requestReReview');
        } else if (choice === 'View on GitHub') {
            const config = this.gitHubService.getConfig();
            if (config) {
                // Would need issue number - this is a simplified example
                vscode.env.openExternal(vscode.Uri.parse(`https://github.com/${config.owner}/${config.repo}/issues`));
            }
        }

        return false; // Don't proceed with move to development
    }

    /**
     * Update issue status in GitHub
     */
    private async updateIssueStatus(issueNumber: number): Promise<boolean> {
        try {
            // Use existing GitHubService method
            return await this.gitHubService.moveToInDevelopment(issueNumber);
            
        } catch (error) {
            logger.error('Failed to update issue status', error as Error);
            return false;
        }
    }

    /**
     * Get stakeholder name from login
     */
    private getStakeholderName(login: string): string {
        // This could be enhanced to fetch from GitHub API or configuration
        const names: { [key: string]: string } = {
            'alice': 'Alice Smith',
            'bob': 'Bob Johnson', 
            'carol': 'Carol Davis',
            'dave': 'Dave Wilson'
        };
        
        return names[login] || login;
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
     * Get approval timestamp (mock for now)
     */
    private getApprovalTimestamp(issueNumber: number, login: string): string {
        // This would fetch from GitHub API in real implementation
        return new Date().toISOString();
    }

    /**
     * Get last notification time (mock for now)
     */
    private getLastNotificationTime(issueNumber: number, login: string): string {
        // This would track notification history in real implementation
        return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days ago
    }

    /**
     * Get critical stakeholders from configuration
     */
    private getCriticalStakeholders(): string[] {
        const config = vscode.workspace.getConfiguration('scubed');
        return config.get<string[]>('github.criticalStakeholders', []);
    }
}

// Export for testing
export { StatusValidationService as testableStatusValidationService };
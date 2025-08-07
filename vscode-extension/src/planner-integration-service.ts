/**
 * Microsoft Planner Integration Service
 * 🟢 GREEN PHASE: Minimal implementation to pass tests
 * 
 * Handles automated user story creation from approved requirements
 */

import * as vscode from 'vscode';
import { logger } from './logger';

export interface UserStory {
    title: string;
    description: string;
    acceptanceCriteria: string[];
    priority: 'High' | 'Medium' | 'Low';
    estimatedHours?: number;
}

export interface PlannerConfig {
    planId: string;
    bucketName: string;
    assignedTo: string[];
}

export interface PlannerTask {
    title: string;
    plannerTaskId: string;
    description?: string;
    assignedTo?: string[];
}

export interface IntegrationResult {
    success: boolean;
    tasksCreated: number;
    plannerUrl: string;
    errors?: string[];
}

export interface GitHubActionsPayload {
    trigger: string;
    issueNumber: number;
    repository: any;
    userStories: UserStory[];
    plannerConfig: any;
    timestamp: string;
}

/**
 * Microsoft Planner Integration Service
 * Converts approved requirements into Planner user stories
 * 🔄 PIVOT: Now focuses on GitHub Actions integration instead of local auth
 */
export class PlannerIntegrationService {
    
    constructor() {
        logger.info('PlannerIntegrationService initialized for GitHub Actions integration');
    }

    /**
     * Parse functional requirements content into user stories
     * 🟢 GREEN: Minimal implementation using regex parsing
     */
    async parseRequirementsToUserStories(requirementsContent: string): Promise<UserStory[]> {
        logger.logFunctionEntry('PlannerIntegrationService.parseRequirementsToUserStories');
        
        try {
            const userStories: UserStory[] = [];
            
            // Find functional requirements section
            const functionalSection = this.extractFunctionalRequirementsSection(requirementsContent);
            if (!functionalSection) {
                logger.warn('No functional requirements section found');
                return [];
            }

            // Parse core features from the template format
            let featureMatches = null;
            
            // Try the enhanced template format (matches our actual template structure)
            featureMatches = functionalSection.match(/(\d+)\.\s\*\*([^*]+)\*\*\s*\n\s*-\s\*\*Description:\*\*\s*([^\n]+)\s*\n\s*-\s\*\*Acceptance Criteria:\*\*\s*([\s\S]*?)(?=\n\d+\.|##|$)/g);
            
            // If no match, try alternative format without newlines
            if (!featureMatches) {
                featureMatches = functionalSection.match(/(\d+)\.\s\*\*([^*]+)\*\*[\s\S]*?-\s\*\*Description:\*\*\s*([^\n]+)[\s\S]*?-\s\*\*Acceptance Criteria:\*\*([\s\S]*?)(?=\d+\.|##|$)/g);
            }
            
            // Try simpler format as fallback
            if (!featureMatches) {
                featureMatches = functionalSection.match(/\d+\.\s\*\*(.+?)\*\*[\s\S]*?Description:\*\*\s*(.+?)[\s\S]*?Acceptance Criteria:\*\*([\s\S]*?)(?=\d+\.|##|$)/g);
            }
            
            if (featureMatches) {
                for (const featureMatch of featureMatches) {
                    // Use exec to get match groups properly
                    const regex = /(\d+)\.\s\*\*([^*]+)\*\*[\s\S]*?-\s\*\*Description:\*\*\s*([^\n]+)[\s\S]*?-\s\*\*Acceptance Criteria:\*\*([\s\S]*?)(?=\d+\.|##|$)/;
                    const match = regex.exec(featureMatch);
                    
                    if (match) {
                        const [, number, title, description, criteriaText] = match;
                        
                        // Extract acceptance criteria
                        const acceptanceCriteria: string[] = [];
                        if (criteriaText) {
                            // Look for checkbox items
                            const criteriaMatches = criteriaText.match(/- \[ \] (.+)/g);
                            if (criteriaMatches) {
                                acceptanceCriteria.push(...criteriaMatches.map(c => c.replace('- [ ] ', '').trim()));
                            }
                        }

                        if (acceptanceCriteria.length === 0) {
                            // If no criteria found, create a default one
                            acceptanceCriteria.push('Implementation requirements to be defined');
                        }

                        userStories.push({
                            title: title.trim(),
                            description: description.trim(),
                            acceptanceCriteria,
                            priority: 'High', // Default priority
                            estimatedHours: this.estimateHours(acceptanceCriteria.length)
                        });
                        
                        logger.debug(`Parsed feature: ${title.trim()}`);
                    }
                }
            }

            logger.info(`Parsed ${userStories.length} user stories from requirements`);
            return userStories;
        } catch (error) {
            logger.error('Error parsing requirements to user stories', error as Error);
            throw error;
        }
    }

    /**
     * Create Microsoft Planner tasks from user stories
     * 🟢 GREEN: Minimal mock implementation for testing
     */
    async createPlannerTasks(userStories: UserStory[], config: PlannerConfig): Promise<PlannerTask[]> {
        logger.logFunctionEntry('PlannerIntegrationService.createPlannerTasks');
        
        try {
            const createdTasks: PlannerTask[] = [];
            
            // 🟢 GREEN: Mock implementation - in real implementation this would use Microsoft Graph API
            for (let i = 0; i < userStories.length; i++) {
                const story = userStories[i];
                const mockTask: PlannerTask = {
                    title: story.title,
                    plannerTaskId: `mock-task-${Date.now()}-${i}`, // Mock ID
                    description: this.formatTaskDescription(story),
                    assignedTo: config.assignedTo
                };
                
                createdTasks.push(mockTask);
                logger.info(`Created Planner task: ${story.title}`);
            }

            return createdTasks;
        } catch (error) {
            logger.error('Error creating Planner tasks', error as Error);
            throw error;
        }
    }

    /**
     * Handle requirements approval workflow trigger
     * 🟢 GREEN: Minimal integration point
     */
    async handleRequirementsApproval(issueNumber: number, requirementsContent: string): Promise<IntegrationResult> {
        logger.logFunctionEntry('PlannerIntegrationService.handleRequirementsApproval');
        
        try {
            // Parse user stories from requirements
            const userStories = await this.parseRequirementsToUserStories(requirementsContent);
            
            if (userStories.length === 0) {
                return {
                    success: false,
                    tasksCreated: 0,
                    plannerUrl: '',
                    errors: ['No user stories found in requirements']
                };
            }

            // Get Planner configuration
            const config = await this.getPlannerConfig();
            
            // Create Planner tasks
            const createdTasks = await this.createPlannerTasks(userStories, config);
            
            return {
                success: true,
                tasksCreated: createdTasks.length,
                plannerUrl: `https://tasks.office.com/plan/${config.planId}` // Mock URL
            };
        } catch (error) {
            logger.error('Error handling requirements approval', error as Error);
            return {
                success: false,
                tasksCreated: 0,
                plannerUrl: '',
                errors: [(error as Error).message]
            };
        }
    }


    /**
     * Private helper methods
     */
    private extractFunctionalRequirementsSection(content: string): string | null {
        // Find the start of functional requirements section
        const startMatch = content.match(/## 📋 Functional Requirements/);
        if (!startMatch) {
            return null;
        }
        
        const startIndex = startMatch.index!;
        
        // Find the next major section (## but not subsections ###)
        const remainingContent = content.substring(startIndex);
        const nextSectionMatch = remainingContent.match(/\n## (?!📋 Functional Requirements)/);
        
        if (nextSectionMatch) {
            // Extract from start to next major section
            const endIndex = startIndex + nextSectionMatch.index!;
            return content.substring(startIndex, endIndex);
        } else {
            // Extract from start to end of document
            return remainingContent;
        }
    }

    private estimateHours(acceptanceCriteriaCount: number): number {
        // Simple estimation: 2-3 hours per acceptance criteria
        return Math.max(4, acceptanceCriteriaCount * 2.5);
    }

    private formatTaskDescription(story: UserStory): string {
        let description = `**Description:** ${story.description}\n\n`;
        description += `**Acceptance Criteria:**\n`;
        story.acceptanceCriteria.forEach(criteria => {
            description += `- [ ] ${criteria}\n`;
        });
        description += `\n**Priority:** ${story.priority}`;
        if (story.estimatedHours) {
            description += `\n**Estimated Hours:** ${story.estimatedHours}`;
        }
        return description;
    }

    private async getPlannerConfig(): Promise<PlannerConfig> {
        // Get configuration from VS Code settings
        const config = vscode.workspace.getConfiguration('scubed.planner');
        return {
            planId: config.get('planId', 'default-plan-id'),
            bucketName: config.get('bucketName', 'Sprint Backlog'),
            assignedTo: config.get('defaultAssignees', [])
        };
    }

    /**
     * 🔄 PIVOT: GitHub Actions Integration Methods
     * These methods support GitHub Actions workflow instead of local authentication
     */

    /**
     * Prepare user stories for GitHub Actions workflow
     * Formats user stories as JSON that GitHub Actions can consume
     */
    async prepareUserStoriesForGitHubActions(requirementsContent: string): Promise<{userStories: UserStory[], metadata: any}> {
        logger.logFunctionEntry('PlannerIntegrationService.prepareUserStoriesForGitHubActions');
        
        try {
            // Parse user stories from requirements (reusing existing logic)
            const userStories = await this.parseRequirementsToUserStories(requirementsContent);
            
            // Add metadata for GitHub Actions
            const metadata = {
                totalStories: userStories.length,
                estimatedTotalHours: userStories.reduce((sum, story) => sum + (story.estimatedHours || 0), 0),
                priorities: userStories.reduce((counts: any, story) => {
                    counts[story.priority] = (counts[story.priority] || 0) + 1;
                    return counts;
                }, {}),
                generatedAt: new Date().toISOString()
            };
            
            logger.info(`Prepared ${userStories.length} user stories for GitHub Actions workflow`);
            return { userStories, metadata };
            
        } catch (error) {
            logger.error('Failed to prepare user stories for GitHub Actions', error as Error);
            throw error;
        }
    }

    /**
     * Generate GitHub Actions workflow input
     * Creates the JSON payload that will trigger the Planner integration action
     */
    generateGitHubActionsPayload(userStories: UserStory[], issueNumber: number, repositoryInfo: any): any {
        logger.logFunctionEntry('PlannerIntegrationService.generateGitHubActionsPayload');
        
        return {
            trigger: 'create-planner-tasks',
            issueNumber: issueNumber,
            repository: repositoryInfo,
            userStories: userStories,
            plannerConfig: {
                // These will be configured as GitHub repository secrets
                planId: '${{ secrets.PLANNER_PLAN_ID }}',
                bucketName: '${{ vars.PLANNER_BUCKET_NAME || \'Sprint Backlog\' }}',
                assignedTo: '${{ vars.PLANNER_DEFAULT_ASSIGNEES }}'
            },
            timestamp: new Date().toISOString()
        };
    }
}
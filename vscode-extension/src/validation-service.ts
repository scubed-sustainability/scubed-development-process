import * as vscode from 'vscode';
import { RequirementData } from './github-service';

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}

export class ValidationService {
    
    /**
     * Validate requirements data before pushing to GitHub
     */
    async validateRequirements(requirement: RequirementData): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // 1. Title validation
        if (!requirement.title || requirement.title.trim() === '' || requirement.title === 'Untitled Requirement') {
            errors.push({
                field: 'title',
                message: 'Title is required and cannot be empty',
                severity: 'error'
            });
        } else if (requirement.title.length < 5) {
            warnings.push({
                field: 'title',
                message: 'Title is very short',
                suggestion: 'Consider a more descriptive title (minimum 5 characters)'
            });
        } else if (requirement.title.length > 100) {
            warnings.push({
                field: 'title',
                message: 'Title is very long',
                suggestion: 'Consider shortening the title (maximum 100 characters recommended)'
            });
        }

        // 2. Summary validation
        if (!requirement.summary || requirement.summary.trim() === '') {
            errors.push({
                field: 'summary',
                message: 'Summary is required',
                severity: 'error'
            });
        } else if (requirement.summary.length < 10) {
            warnings.push({
                field: 'summary',
                message: 'Summary is very brief',
                suggestion: 'Provide more details about the requirement'
            });
        }

        // 3. Business Objectives validation
        if (!requirement.businessObjectives || requirement.businessObjectives.length === 0) {
            errors.push({
                field: 'businessObjectives',
                message: 'At least one business objective is required',
                severity: 'error'
            });
        } else {
            const emptyObjectives = requirement.businessObjectives.filter(obj => !obj || obj.trim() === '');
            if (emptyObjectives.length > 0) {
                warnings.push({
                    field: 'businessObjectives',
                    message: `${emptyObjectives.length} empty business objective(s) found`,
                    suggestion: 'Remove empty objectives or provide meaningful content'
                });
            }
        }

        // 4. Functional Requirements validation
        if (!requirement.functionalRequirements || requirement.functionalRequirements.length === 0) {
            errors.push({
                field: 'functionalRequirements',
                message: 'At least one functional requirement is required',
                severity: 'error'
            });
        } else {
            const emptyRequirements = requirement.functionalRequirements.filter(req => !req || req.trim() === '');
            if (emptyRequirements.length > 0) {
                warnings.push({
                    field: 'functionalRequirements',
                    message: `${emptyRequirements.length} empty functional requirement(s) found`,
                    suggestion: 'Remove empty requirements or provide meaningful content'
                });
            }
        }

        // 5. Acceptance Criteria validation
        if (!requirement.acceptanceCriteria || requirement.acceptanceCriteria.length === 0) {
            errors.push({
                field: 'acceptanceCriteria',
                message: 'At least one acceptance criterion is required',
                severity: 'error'
            });
        } else {
            const emptyAcceptance = requirement.acceptanceCriteria.filter(criteria => !criteria || criteria.trim() === '');
            if (emptyAcceptance.length > 0) {
                warnings.push({
                    field: 'acceptanceCriteria',
                    message: `${emptyAcceptance.length} empty acceptance criteria found`,
                    suggestion: 'Remove empty criteria or provide meaningful content'
                });
            }
        }

        // 6. Stakeholders validation (CRITICAL)
        if (!requirement.stakeholders || requirement.stakeholders.length === 0) {
            errors.push({
                field: 'stakeholders',
                message: 'At least one stakeholder is required for approval workflow',
                severity: 'error'
            });
        } else {
            // Validate GitHub usernames
            const invalidStakeholders: string[] = [];
            const validatedStakeholders: string[] = [];
            
            for (const stakeholder of requirement.stakeholders) {
                const cleanStakeholder = stakeholder.replace('@', '').trim();
                
                if (!cleanStakeholder) {
                    invalidStakeholders.push('(empty)');
                    continue;
                }
                
                // GitHub username validation rules
                if (!this.isValidGitHubUsername(cleanStakeholder)) {
                    invalidStakeholders.push(cleanStakeholder);
                } else {
                    validatedStakeholders.push(cleanStakeholder);
                }
            }

            if (invalidStakeholders.length > 0) {
                errors.push({
                    field: 'stakeholders',
                    message: `Invalid GitHub username(s): ${invalidStakeholders.join(', ')}`,
                    severity: 'error'
                });
            }

            if (validatedStakeholders.length === 0) {
                errors.push({
                    field: 'stakeholders',
                    message: 'No valid GitHub usernames found',
                    severity: 'error'
                });
            }

            // Check for duplicate stakeholders
            const uniqueStakeholders = new Set(validatedStakeholders);
            if (uniqueStakeholders.size < validatedStakeholders.length) {
                warnings.push({
                    field: 'stakeholders',
                    message: 'Duplicate stakeholders found',
                    suggestion: 'Remove duplicate entries'
                });
            }
        }

        // 7. Priority validation
        if (!requirement.priority || !['low', 'medium', 'high'].includes(requirement.priority)) {
            warnings.push({
                field: 'priority',
                message: 'Priority not specified or invalid',
                suggestion: 'Set priority to low, medium, or high'
            });
        }

        // 8. File structure validation
        if (!requirement.sourceFile) {
            warnings.push({
                field: 'sourceFile',
                message: 'Source file path not available',
                suggestion: 'Ensure file is saved properly'
            });
        }

        const isValid = errors.length === 0;

        return {
            isValid,
            errors,
            warnings
        };
    }

    /**
     * Validate GitHub username format
     */
    private isValidGitHubUsername(username: string): boolean {
        // GitHub username rules:
        // - 1-39 characters
        // - Can contain alphanumeric characters and hyphens
        // - Cannot start or end with hyphen
        // - Cannot have consecutive hyphens
        const githubUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]){0,37}[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
        
        return githubUsernameRegex.test(username) && 
               !username.includes('--') && // No consecutive hyphens
               username.length >= 1 && 
               username.length <= 39;
    }

    /**
     * Display validation results to user with actionable feedback
     */
    async showValidationResults(validation: ValidationResult, requirementTitle: string): Promise<boolean> {
        if (validation.isValid && validation.warnings.length === 0) {
            // All good - no need to show anything
            return true;
        }

        const messages: string[] = [];
        
        if (validation.errors.length > 0) {
            messages.push('❌ **ERRORS - Must be fixed before pushing:**');
            validation.errors.forEach(error => {
                messages.push(`  • **${error.field}**: ${error.message}`);
            });
            messages.push('');
        }

        if (validation.warnings.length > 0) {
            messages.push('⚠️ **WARNINGS - Recommended to fix:**');
            validation.warnings.forEach(warning => {
                messages.push(`  • **${warning.field}**: ${warning.message}`);
                if (warning.suggestion) {
                    messages.push(`    💡 *${warning.suggestion}*`);
                }
            });
        }

        const fullMessage = [
            `**Validation Results for:** ${requirementTitle}`,
            '',
            ...messages,
            '',
            validation.isValid 
                ? '✅ **Ready to push** (warnings are optional to fix)'
                : '🚫 **Cannot push** - Please fix errors first'
        ].join('\n');

        if (!validation.isValid) {
            // Critical errors - must be fixed
            const choice = await vscode.window.showErrorMessage(
                `Requirements validation failed! ${validation.errors.length} error(s) found.`,
                { modal: true, detail: fullMessage },
                'Fix Issues',
                'Cancel'
            );
            return choice === 'Fix Issues' ? false : false; // Don't proceed either way
        } else {
            // Only warnings - user can choose to proceed
            const choice = await vscode.window.showWarningMessage(
                `Requirements validation completed with ${validation.warnings.length} warning(s).`,
                { modal: true, detail: fullMessage },
                'Push Anyway',
                'Fix Warnings First',
                'Cancel'
            );
            
            return choice === 'Push Anyway';
        }
    }

    /**
     * Validate file format and structure before parsing
     */
    async validateFileStructure(filePath: string): Promise<ValidationResult> {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        try {
            const fs = require('fs-extra');
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Check for required sections
            const requiredSections = [
                { pattern: /#{1,3}\s*.*stakeholder/i, name: 'Stakeholders' },
                { pattern: /#{1,3}\s*.*business.*objective/i, name: 'Business Objectives' },
                { pattern: /#{1,3}\s*.*functional.*requirement/i, name: 'Functional Requirements' },
                { pattern: /#{1,3}\s*.*acceptance.*criteria/i, name: 'Acceptance Criteria' }
            ];

            for (const section of requiredSections) {
                if (!section.pattern.test(content)) {
                    errors.push({
                        field: 'structure',
                        message: `Missing required section: ${section.name}`,
                        severity: 'error'
                    });
                }
            }

            // Check for proper newline ending (critical for workflow parsing)
            if (!content.endsWith('\n')) {
                errors.push({
                    field: 'format',
                    message: 'File must end with a newline character',
                    severity: 'error'
                });
            }

            // Check for title
            if (!content.match(/^#\s+.+/m)) {
                errors.push({
                    field: 'title',
                    message: 'File must start with a title (# Title)',
                    severity: 'error'
                });
            }

        } catch (error) {
            errors.push({
                field: 'file',
                message: `Cannot read file: ${error}`,
                severity: 'error'
            });
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}
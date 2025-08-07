/**
 * TDD Unit Test: Microsoft Planner Integration
 * 🔴 RED PHASE: This test should FAIL initially
 * 
 * Tests the automated user story creation workflow:
 * GitHub Approval → Parse Requirements → Create Planner Tasks
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import { PlannerIntegrationService, UserStory, PlannerConfig } from '../../../src/planner-integration-service';

describe('🔴 Microsoft Planner Integration (TDD - RED Phase)', function() {
    
    it('should parse functional requirements into user stories', async function() {
        // 🔴 RED: This test documents the requirement and should FAIL
        const mockRequirementsContent = `
# Project Requirements

## 📋 Functional Requirements 🔴 **REQUIRED**

### Core Features
1. **User Registration & Login**
   - **Description:** Users can create accounts and authenticate
   - **Acceptance Criteria:**
     - [ ] Users can create accounts with email/password
     - [ ] Users can log in and log out successfully
     - [ ] Password reset functionality works

2. **Product Catalog**
   - **Description:** Display and search products
   - **Acceptance Criteria:**
     - [ ] Display products with images and descriptions
     - [ ] Search and filter functionality
     - [ ] Product detail pages load properly

3. **Shopping Cart & Checkout**
   - **Description:** Purchase workflow functionality
   - **Acceptance Criteria:**
     - [ ] Add/remove items from cart
     - [ ] Calculate totals with tax
     - [ ] Process payments securely
`;

        // Arrange: Mock service (doesn't exist yet - RED phase)
        let plannerService: PlannerIntegrationService;
        try {
            plannerService = new PlannerIntegrationService();
        } catch (error) {
            expect.fail(`PlannerIntegrationService should be available: ${error}`);
        }

        // Act: Parse requirements into user stories
        let userStories: UserStory[];
        try {
            userStories = await plannerService.parseRequirementsToUserStories(mockRequirementsContent);
        } catch (error) {
            expect.fail(`parseRequirementsToUserStories should work: ${error}`);
        }

        // Assert: Should extract 3 user stories
        expect(userStories).to.have.lengthOf(3);
        
        // Verify first user story structure
        expect(userStories[0].title).to.equal('User Registration & Login');
        expect(userStories[0].description).to.include('Users can create accounts and authenticate');
        expect(userStories[0].acceptanceCriteria).to.have.lengthOf(3);
        expect(userStories[0].acceptanceCriteria[0]).to.include('create accounts with email/password');
    });

    it('should create Microsoft Planner tasks from user stories', async function() {
        // 🔴 RED: Test Planner API integration
        const mockUserStories: UserStory[] = [
            {
                title: 'User Registration & Login',
                description: 'Users can create accounts and authenticate',
                acceptanceCriteria: [
                    'Users can create accounts with email/password',
                    'Users can log in and log out successfully',
                    'Password reset functionality works'
                ],
                priority: 'High',
                estimatedHours: 8
            }
        ];

        const mockConfig: PlannerConfig = {
            planId: 'test-plan-id',
            bucketName: 'Sprint Backlog',
            assignedTo: ['user1@company.com']
        };

        // Arrange: Mock service
        let plannerService: PlannerIntegrationService;
        try {
            plannerService = new PlannerIntegrationService();
        } catch (error) {
            expect.fail(`PlannerIntegrationService should be available: ${error}`);
        }

        // Act: Create Planner tasks
        let createdTasks;
        try {
            createdTasks = await plannerService.createPlannerTasks(mockUserStories, mockConfig);
        } catch (error) {
            expect.fail(`createPlannerTasks should work: ${error}`);
        }

        // Assert: Should create tasks successfully
        expect(createdTasks).to.have.lengthOf(1);
        expect(createdTasks[0].title).to.equal('User Registration & Login');
        expect(createdTasks[0].plannerTaskId).to.be.a('string');
    });

    it('should integrate with GitHub workflow completion', async function() {
        // 🔴 RED: Test workflow integration trigger
        const mockIssueNumber = 123;
        const mockRequirementsContent = 'Mock requirements with functional requirements section';

        // Arrange: Mock service
        let plannerService: PlannerIntegrationService;
        try {
            plannerService = new PlannerIntegrationService();
        } catch (error) {
            expect.fail(`PlannerIntegrationService should be available: ${error}`);
        }

        // Act: Trigger workflow integration
        let integrationResult;
        try {
            integrationResult = await plannerService.handleRequirementsApproval(mockIssueNumber, mockRequirementsContent);
        } catch (error) {
            expect.fail(`handleRequirementsApproval should work: ${error}`);
        }

        // Assert: Should complete workflow integration
        expect(integrationResult.success).to.be.true;
        expect(integrationResult.tasksCreated).to.be.greaterThan(0);
        expect(integrationResult.plannerUrl).to.be.a('string');
    });

    it('should handle Microsoft Graph authentication', async function() {
        // 🔴 RED: Test authentication flow
        const mockConfig = {
            clientId: 'test-client-id',
            tenantId: 'test-tenant-id',
            scopes: ['Tasks.ReadWrite', 'Group.Read.All']
        };

        // Arrange: Mock service
        let plannerService: PlannerIntegrationService;
        try {
            plannerService = new PlannerIntegrationService();
        } catch (error) {
            expect.fail(`PlannerIntegrationService should be available: ${error}`);
        }

        // Act: Test GitHub Actions payload generation with sample requirements
        const sampleRequirements = `
## 📋 Functional Requirements
1. **Test Feature**
   - **Description:** Test user story creation
   - **Acceptance Criteria:**
     - [ ] Feature works correctly
`;
        const userStories = await plannerService.parseRequirementsToUserStories(sampleRequirements);
        const payload = plannerService.generateGitHubActionsPayload(userStories, 123, { name: 'test-repo' });

        // Assert: Should generate proper GitHub Actions payload
        expect(payload.trigger).to.equal('create-planner-tasks');
        expect(payload.issueNumber).to.equal(123);
        expect(payload.userStories).to.be.an('array');
    });
});
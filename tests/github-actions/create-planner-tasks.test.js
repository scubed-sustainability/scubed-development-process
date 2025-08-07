/**
 * TDD Tests for GitHub Actions - Create Planner Tasks Workflow
 * 🔴 RED PHASE: These tests define what the GitHub Action should do
 * 
 * Tests the complete workflow:
 * Comment Trigger → Requirements Parsing → Planner Task Creation → Status Update
 */

const { expect } = require('chai');
const { describe, it, before, after } = require('mocha');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

describe('🔴 GitHub Actions - Create Planner Tasks Workflow (TDD RED)', function() {
    let workflowContent;
    let workflowPath;

    before(function() {
        // 🔴 RED: This will fail until we create the workflow file
        workflowPath = path.join(__dirname, '../../.github/workflows/create-planner-tasks.yml');
    });

    describe('📁 Workflow File Structure', function() {
        it('should have create-planner-tasks.yml workflow file', function() {
            // 🔴 RED: This test will fail until we create the file
            expect(fs.existsSync(workflowPath)).to.be.true;
        });

        it('should have valid YAML syntax', function() {
            // 🔴 RED: Will fail until valid YAML exists
            const content = fs.readFileSync(workflowPath, 'utf8');
            expect(() => yaml.load(content)).to.not.throw();
            workflowContent = yaml.load(content);
        });

        it('should have proper workflow name and triggers', function() {
            // 🔴 RED: Defines required workflow structure
            expect(workflowContent).to.have.property('name', 'Create Planner Tasks');
            expect(workflowContent).to.have.property('on');
            expect(workflowContent.on).to.have.property('issue_comment');
            expect(workflowContent.on.issue_comment.types).to.include('created');
        });
    });

    describe('🎯 Comment Trigger Logic', function() {
        it('should trigger only on /create-planner-tasks command', function() {
            // 🔴 RED: Should have conditional logic to check comment content
            expect(workflowContent.jobs).to.have.property('create-tasks');
            const createTasksJob = workflowContent.jobs['create-tasks'];
            
            // Should have condition to check for trigger comment
            expect(createTasksJob).to.have.property('if');
            expect(createTasksJob.if).to.include('/create-planner-tasks');
        });

        it('should only run on approved issues with requirements', function() {
            // 🔴 RED: Should check issue labels and content
            const condition = workflowContent.jobs['create-tasks'].if;
            expect(condition).to.include('approved');
            expect(condition).to.include('requirements');
        });

        it('should have permission to read issues and write comments', function() {
            // 🔴 RED: Workflow needs proper GitHub permissions
            const createTasksJob = workflowContent.jobs['create-tasks'];
            expect(createTasksJob).to.have.property('permissions');
            expect(createTasksJob.permissions).to.have.property('issues', 'write');
            expect(createTasksJob.permissions).to.have.property('contents', 'read');
        });
    });

    describe('🔧 Job Configuration', function() {
        it('should run on ubuntu-latest runner', function() {
            // 🔴 RED: Defines infrastructure requirements
            const createTasksJob = workflowContent.jobs['create-tasks'];
            expect(createTasksJob).to.have.property('runs-on', 'ubuntu-latest');
        });

        it('should have required environment variables', function() {
            // 🔴 RED: Defines required secrets and variables
            const createTasksJob = workflowContent.jobs['create-tasks'];
            expect(createTasksJob).to.have.property('env');
            
            const env = createTasksJob.env;
            expect(env).to.have.property('AZURE_CLIENT_ID', '${{ secrets.AZURE_CLIENT_ID }}');
            expect(env).to.have.property('AZURE_CLIENT_SECRET', '${{ secrets.AZURE_CLIENT_SECRET }}');
            expect(env).to.have.property('AZURE_TENANT_ID', '${{ secrets.AZURE_TENANT_ID }}');
            expect(env).to.have.property('PLANNER_PLAN_ID', '${{ secrets.PLANNER_PLAN_ID }}');
        });

        it('should have proper steps sequence', function() {
            // 🔴 RED: Defines required workflow steps
            const steps = workflowContent.jobs['create-tasks'].steps;
            expect(steps).to.be.an('array');
            expect(steps.length).to.be.greaterThan(4);

            // Step 1: Checkout code
            expect(steps[0]).to.have.property('uses', 'actions/checkout@v4');
            
            // Step 2: Setup Node.js
            expect(steps[1]).to.have.property('uses', 'actions/setup-node@v4');
            
            // Step 3: Parse requirements from issue
            expect(steps[2]).to.have.property('name', 'Parse Requirements');
            
            // Step 4: Authenticate with Microsoft Graph
            expect(steps[3]).to.have.property('name', 'Authenticate Microsoft Graph');
            
            // Step 5: Create Planner tasks
            expect(steps[4]).to.have.property('name', 'Create Planner Tasks');
        });
    });

    describe('📋 Requirements Parsing Step', function() {
        it('should extract requirements from GitHub issue body', function() {
            // 🔴 RED: Should have step that parses issue content
            const parseStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Parse Requirements'
            );
            
            expect(parseStep).to.exist;
            expect(parseStep).to.have.property('run');
            expect(parseStep.run).to.include('github.event.issue.body');
        });

        it('should validate requirements format', function() {
            // 🔴 RED: Should check for proper requirements structure
            const parseStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Parse Requirements'
            );
            
            expect(parseStep.run).to.include('Functional Requirements');
            expect(parseStep.run).to.include('Acceptance Criteria');
        });

        it('should output user stories as JSON', function() {
            // 🔴 RED: Should set output for next steps
            const parseStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Parse Requirements'
            );
            
            expect(parseStep).to.have.property('id', 'parse');
            expect(parseStep.run).to.include('echo "user-stories=');
            expect(parseStep.run).to.include('GITHUB_OUTPUT');
        });
    });

    describe('🔐 Authentication Step', function() {
        it('should authenticate with Azure service principal', function() {
            // 🔴 RED: Should use service principal for Graph API access
            const authStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Authenticate Microsoft Graph'
            );
            
            expect(authStep).to.exist;
            expect(authStep).to.have.property('run');
            expect(authStep.run).to.include('client_credentials');
            expect(authStep.run).to.include('graph.microsoft.com');
        });

        it('should handle authentication failures gracefully', function() {
            // 🔴 RED: Should have error handling for auth failures
            const authStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Authenticate Microsoft Graph'
            );
            
            expect(authStep.run).to.include('if [ $? -eq 0 ]');
            expect(authStep.run).to.include('echo "Authentication failed"');
        });

        it('should output access token for Planner API calls', function() {
            // 🔴 RED: Should provide token for subsequent steps
            const authStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Authenticate Microsoft Graph'
            );
            
            expect(authStep).to.have.property('id', 'auth');
            expect(authStep.run).to.include('access_token');
            expect(authStep.run).to.include('GITHUB_OUTPUT');
        });
    });

    describe('📝 Planner Task Creation Step', function() {
        it('should create tasks in Microsoft Planner via Graph API', function() {
            // 🔴 RED: Should make Graph API calls to create tasks
            const createStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Create Planner Tasks'
            );
            
            expect(createStep).to.exist;
            expect(createStep).to.have.property('run');
            expect(createStep.run).to.include('graph.microsoft.com/v1.0/planner/tasks');
            expect(createStep.run).to.include('POST');
        });

        it('should use authentication token from previous step', function() {
            // 🔴 RED: Should reference auth step output
            const createStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Create Planner Tasks'
            );
            
            expect(createStep.run).to.include('steps.auth.outputs.access_token');
            expect(createStep.run).to.include('Bearer');
        });

        it('should process user stories from parsing step', function() {
            // 🔴 RED: Should use parsed requirements
            const createStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Create Planner Tasks'
            );
            
            expect(createStep.run).to.include('steps.parse.outputs.user-stories');
        });

        it('should handle task creation errors and provide feedback', function() {
            // 🔴 RED: Should have comprehensive error handling
            const createStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Create Planner Tasks'
            );
            
            expect(createStep.run).to.include('error_count=0');
            expect(createStep.run).to.include('success_count=0');
            expect(createStep.run).to.include('if [ $response_code -eq 201 ]');
        });

        it('should post results back to GitHub issue as comment', function() {
            // 🔴 RED: Should provide user feedback
            const createStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Create Planner Tasks'
            );
            
            expect(createStep.run).to.include('gh api repos/${{ github.repository }}/issues');
            expect(createStep.run).to.include('/comments');
            expect(createStep.run).to.include('tasks created successfully');
        });
    });

    describe('🛡️ Security and Error Handling', function() {
        it('should mask sensitive information in logs', function() {
            // 🔴 RED: Should protect secrets in output
            const authStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Authenticate Microsoft Graph'
            );
            
            expect(authStep.run).to.include('echo "::add-mask::');
        });

        it('should continue workflow even if some tasks fail', function() {
            // 🔴 RED: Should be resilient to partial failures
            const createStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Create Planner Tasks'
            );
            
            expect(createStep).to.have.property('continue-on-error', true);
        });

        it('should provide meaningful error messages for troubleshooting', function() {
            // 🔴 RED: Should help users debug issues
            const steps = workflowContent.jobs['create-tasks'].steps;
            const hasErrorHandling = steps.some(step => 
                step.run && step.run.includes('echo "Error:') && step.run.includes('Please check')
            );
            
            expect(hasErrorHandling).to.be.true;
        });
    });

    describe('🎯 Integration Requirements', function() {
        it('should work with existing GitHub issue template format', function() {
            // 🔴 RED: Should parse the enhanced requirements template
            const parseStep = workflowContent.jobs['create-tasks'].steps.find(
                step => step.name === 'Parse Requirements'
            );
            
            expect(parseStep.run).to.include('## 📋 Functional Requirements');
            expect(parseStep.run).to.include('**Description:**');
            expect(parseStep.run).to.include('**Acceptance Criteria:**');
        });

        it('should respect repository configuration for Planner settings', function() {
            // 🔴 RED: Should use repository-specific Planner configuration
            const env = workflowContent.jobs['create-tasks'].env;
            expect(env).to.have.property('PLANNER_BUCKET_NAME', '${{ vars.PLANNER_BUCKET_NAME || \'Sprint Backlog\' }}');
            expect(env).to.have.property('PLANNER_DEFAULT_ASSIGNEES', '${{ vars.PLANNER_DEFAULT_ASSIGNEES }}');
        });

        it('should provide clear documentation for setup', function() {
            // 🔴 RED: Workflow should include setup comments
            const content = fs.readFileSync(workflowPath, 'utf8');
            expect(content).to.include('Required secrets:');
            expect(content).to.include('AZURE_CLIENT_ID');
            expect(content).to.include('Setup instructions:');
        });
    });
});

/**
 * 🔴 RED PHASE SUMMARY
 * 
 * These tests define exactly what our GitHub Action should do:
 * 1. ✅ Comment trigger detection (/create-planner-tasks)
 * 2. ✅ Requirements parsing from GitHub issue
 * 3. ✅ Service principal authentication with Azure
 * 4. ✅ Microsoft Graph API integration for Planner
 * 5. ✅ Error handling and user feedback
 * 6. ✅ Security best practices
 * 
 * Next: GREEN phase - implement the workflow file to make these tests pass
 */
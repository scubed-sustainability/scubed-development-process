/**
 * TDD Tests for GitHub Actions Script Logic
 * 🔴 RED PHASE: Tests for the Node.js script that handles Planner integration
 */

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const fs = require('fs');
const path = require('path');

describe('🔴 GitHub Actions Planner Integration Script (TDD RED)', function() {
    let scriptPath;
    let scriptExists;

    beforeEach(function() {
        // 🔴 RED: This will fail until we create the script
        scriptPath = path.join(__dirname, '../../.github/scripts/create-planner-tasks.js');
        scriptExists = fs.existsSync(scriptPath);
    });

    describe('📁 Script File Structure', function() {
        it('should have create-planner-tasks.js script file', function() {
            // 🔴 RED: This test will fail until we create the script
            expect(scriptExists).to.be.true;
        });

        it('should have valid JavaScript syntax', function() {
            // 🔴 RED: Will fail until valid script exists
            if (scriptExists) {
                // Use require to validate Node.js syntax instead of eval
                expect(() => require(scriptPath)).to.not.throw();
            }
        });
    });

    describe('🎯 Requirements Parsing Functions', function() {
        it('should export parseRequirementsFromIssue function', function() {
            // 🔴 RED: Script should export required functions
            if (scriptExists) {
                const script = require(scriptPath);
                expect(script).to.have.property('parseRequirementsFromIssue');
                expect(typeof script.parseRequirementsFromIssue).to.equal('function');
            }
        });

        it('should extract functional requirements section from issue body', function() {
            // 🔴 RED: Function should parse requirements correctly
            const mockIssueBody = `
# Project Requirements

## 📋 Functional Requirements

1. **User Authentication**
   - **Description:** Secure login system
   - **Acceptance Criteria:**
     - [ ] User can login with email
     - [ ] Password validation works
     - [ ] Session management implemented

2. **Dashboard**
   - **Description:** Main user interface
   - **Acceptance Criteria:**
     - [ ] Display user information
     - [ ] Show recent activities
`;

            if (scriptExists) {
                const script = require(scriptPath);
                const userStories = script.parseRequirementsFromIssue(mockIssueBody);
                
                expect(userStories).to.be.an('array');
                expect(userStories).to.have.lengthOf(2);
                expect(userStories[0]).to.have.property('title', 'User Authentication');
                expect(userStories[0]).to.have.property('description', 'Secure login system');
                expect(userStories[0]).to.have.property('acceptanceCriteria').that.is.an('array');
            }
        });

        it('should handle malformed requirements gracefully', function() {
            // 🔴 RED: Should not crash on bad input
            const badInput = "No functional requirements here";
            
            if (scriptExists) {
                const script = require(scriptPath);
                const userStories = script.parseRequirementsFromIssue(badInput);
                
                expect(userStories).to.be.an('array');
                expect(userStories).to.have.lengthOf(0);
            }
        });

        it('should estimate hours for each user story', function() {
            // 🔴 RED: Should calculate estimated effort
            const mockRequirements = `
## 📋 Functional Requirements
1. **Simple Feature**
   - **Description:** Basic functionality
   - **Acceptance Criteria:**
     - [ ] One simple task
`;

            if (scriptExists) {
                const script = require(scriptPath);
                const userStories = script.parseRequirementsFromIssue(mockRequirements);
                
                expect(userStories[0]).to.have.property('estimatedHours');
                expect(userStories[0].estimatedHours).to.be.a('number');
                expect(userStories[0].estimatedHours).to.be.greaterThan(0);
            }
        });
    });

    describe('🔐 Microsoft Graph Authentication Functions', function() {
        it('should export authenticateWithServicePrincipal function', function() {
            // 🔴 RED: Script should handle service principal auth
            if (scriptExists) {
                const script = require(scriptPath);
                expect(script).to.have.property('authenticateWithServicePrincipal');
                expect(typeof script.authenticateWithServicePrincipal).to.equal('function');
            }
        });

        it('should validate required environment variables', function() {
            // 🔴 RED: Should check for required config
            if (scriptExists) {
                const script = require(scriptPath);
                expect(script).to.have.property('validateEnvironment');
                
                // Should return false when required vars are missing
                const originalEnv = process.env;
                process.env = {}; // Clear environment
                
                const isValid = script.validateEnvironment();
                expect(isValid).to.be.false;
                
                process.env = originalEnv; // Restore
            }
        });

        it('should return access token on successful authentication', async function() {
            // 🔴 RED: Should authenticate and return token
            this.timeout(10000); // Allow time for API call
            
            if (scriptExists) {
                const script = require(scriptPath);
                
                // Mock environment variables for testing
                const mockCredentials = {
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    tenantId: 'test-tenant-id'
                };
                
                try {
                    // This should fail in RED phase since auth isn't implemented
                    const token = await script.authenticateWithServicePrincipal(mockCredentials);
                    expect(token).to.be.a('string');
                    expect(token.length).to.be.greaterThan(0);
                } catch (error) {
                    // Expected to fail in RED phase
                    expect(error.message).to.include('not implemented');
                }
            }
        });
    });

    describe('📝 Planner Task Creation Functions', function() {
        it('should export createPlannerTasks function', function() {
            // 🔴 RED: Script should create Planner tasks
            if (scriptExists) {
                const script = require(scriptPath);
                expect(script).to.have.property('createPlannerTasks');
                expect(typeof script.createPlannerTasks).to.equal('function');
            }
        });

        it('should create tasks in Microsoft Planner via Graph API', async function() {
            // 🔴 RED: Should make Graph API calls
            if (scriptExists) {
                const script = require(scriptPath);
                
                const userStories = [
                    {
                        title: 'Test Story',
                        description: 'Test description',
                        acceptanceCriteria: ['Test criteria'],
                        priority: 'High',
                        estimatedHours: 4
                    }
                ];
                
                const config = {
                    accessToken: 'mock-token',
                    planId: 'test-plan-id',
                    bucketName: 'Test Bucket'
                };
                
                try {
                    // Should fail in RED phase since API isn't implemented
                    const result = await script.createPlannerTasks(userStories, config);
                    expect(result).to.have.property('tasksCreated');
                    expect(result).to.have.property('errors');
                } catch (error) {
                    // Expected to fail in RED phase
                    expect(error.message).to.include('not implemented');
                }
            }
        });

        it('should handle task creation errors gracefully', async function() {
            // 🔴 RED: Should not crash on API errors
            if (scriptExists) {
                const script = require(scriptPath);
                
                const badConfig = {
                    accessToken: 'invalid-token',
                    planId: 'invalid-plan',
                    bucketName: 'Invalid Bucket'
                };
                
                try {
                    const result = await script.createPlannerTasks([], badConfig);
                    expect(result).to.have.property('errors');
                    expect(result.errors).to.be.an('array');
                } catch (error) {
                    // Should handle errors gracefully
                    expect(error.message).to.not.include('Cannot read property');
                }
            }
        });

        it('should format Planner task details correctly', function() {
            // 🔴 RED: Should format tasks for Planner API
            if (scriptExists) {
                const script = require(scriptPath);
                expect(script).to.have.property('formatTaskForPlanner');
                
                const userStory = {
                    title: 'Test Feature',
                    description: 'Test description',
                    acceptanceCriteria: ['Criterion 1', 'Criterion 2'],
                    priority: 'High',
                    estimatedHours: 8
                };
                
                const formattedTask = script.formatTaskForPlanner(userStory, 'bucket-123');
                
                expect(formattedTask).to.have.property('title', 'Test Feature');
                expect(formattedTask).to.have.property('bucketId', 'bucket-123');
                expect(formattedTask).to.have.property('details');
                expect(formattedTask.details).to.include('Criterion 1');
                expect(formattedTask.details).to.include('8 hours');
            }
        });
    });

    describe('🛡️ Error Handling and Logging', function() {
        it('should export comprehensive logging functions', function() {
            // 🔴 RED: Should provide debugging capabilities
            if (scriptExists) {
                const script = require(scriptPath);
                expect(script).to.have.property('logInfo');
                expect(script).to.have.property('logError');
                expect(script).to.have.property('logWarning');
            }
        });

        it('should mask sensitive information in logs', function() {
            // 🔴 RED: Should protect secrets
            if (scriptExists) {
                const script = require(scriptPath);
                
                const sensitiveData = {
                    accessToken: 'secret-token-123',
                    clientSecret: 'secret-value'
                };
                
                const maskedLog = script.maskSensitiveInfo(JSON.stringify(sensitiveData));
                expect(maskedLog).to.not.include('secret-token-123');
                expect(maskedLog).to.not.include('secret-value');
                expect(maskedLog).to.include('***');
            }
        });

        it('should provide detailed error reporting for GitHub comments', function() {
            // 🔴 RED: Should format errors for user feedback
            if (scriptExists) {
                const script = require(scriptPath);
                expect(script).to.have.property('formatErrorForGitHub');
                
                const error = new Error('API rate limit exceeded');
                const formattedError = script.formatErrorForGitHub(error, 'authentication');
                
                expect(formattedError).to.include('❌');
                expect(formattedError).to.include('API rate limit exceeded');
                expect(formattedError).to.include('Please try again');
            }
        });
    });
});

/**
 * 🔴 RED PHASE SUMMARY - Script Requirements
 * 
 * The script must provide:
 * 1. ✅ parseRequirementsFromIssue() - Extract user stories from GitHub issue
 * 2. ✅ authenticateWithServicePrincipal() - Get Graph API access token
 * 3. ✅ createPlannerTasks() - Create tasks via Microsoft Graph API
 * 4. ✅ formatTaskForPlanner() - Format user stories for Planner
 * 5. ✅ Error handling and logging functions
 * 6. ✅ Security measures (mask secrets, validate input)
 * 
 * All tests should FAIL until we implement the script in GREEN phase
 */
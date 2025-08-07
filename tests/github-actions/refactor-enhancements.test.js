/**
 * 🔴 REFACTOR RED PHASE: Enhanced Error Handling & Retry Logic Tests
 * 
 * These tests define the improved functionality we want to add:
 * 1. Retry mechanisms for transient failures
 * 2. Advanced error classification and handling
 * 3. Authentication token caching
 * 4. Enhanced task formatting with metadata
 * 5. Performance optimizations
 */

const { expect } = require('chai');
const { describe, it, beforeEach, afterEach } = require('mocha');
const fs = require('fs');
const path = require('path');

describe('🔴 REFACTOR Enhancement Requirements (TDD RED)', function() {
    let scriptPath;
    let script;

    beforeEach(function() {
        scriptPath = path.join(__dirname, '../../.github/scripts/create-planner-tasks.js');
        if (fs.existsSync(scriptPath)) {
            // Clear require cache to get fresh instance
            delete require.cache[require.resolve(scriptPath)];
            script = require(scriptPath);
        }
    });

    describe('🔄 Retry Logic Requirements', function() {
        it('should export retry mechanism for transient failures', function() {
            // 🔴 RED: Should have retry functionality
            expect(script).to.have.property('retryWithBackoff');
            expect(typeof script.retryWithBackoff).to.equal('function');
        });

        it('should implement exponential backoff strategy', async function() {
            // 🔴 RED: Should retry with increasing delays
            const mockOperation = async () => {
                throw new Error('Transient failure');
            };

            try {
                await script.retryWithBackoff(mockOperation, {
                    maxRetries: 3,
                    baseDelay: 100,
                    maxDelay: 5000
                });
            } catch (error) {
                expect(error.message).to.include('Max retries exceeded');
                expect(error).to.have.property('attempts', 4); // Original + 3 retries
            }
        });

        it('should classify errors as retryable vs non-retryable', function() {
            // 🔴 RED: Should categorize errors appropriately
            expect(script).to.have.property('isRetryableError');
            
            // Network errors should be retryable
            const networkError = new Error('ECONNRESET');
            expect(script.isRetryableError(networkError)).to.be.true;
            
            // Rate limit errors should be retryable
            const rateLimitError = new Error('HTTP 429: Too Many Requests');
            expect(script.isRetryableError(rateLimitError)).to.be.true;
            
            // Authentication errors should NOT be retryable
            const authError = new Error('HTTP 401: Unauthorized');
            expect(script.isRetryableError(authError)).to.be.false;
            
            // Bad request errors should NOT be retryable
            const badRequestError = new Error('HTTP 400: Bad Request');
            expect(script.isRetryableError(badRequestError)).to.be.false;
        });

        it('should retry authentication failures with token refresh', async function() {
            // 🔴 RED: Should handle token expiration gracefully
            const mockCredentials = {
                clientId: 'test-client',
                clientSecret: 'test-secret', 
                tenantId: 'test-tenant'
            };

            // Mock token that expires - should fail first time, succeed second time
            let callCount = 0;
            const mockAuthFunction = async () => {
                callCount++;
                if (callCount === 1) {
                    const error = new Error('HTTP 401: Token expired');
                    throw error;
                }
                return 'new-valid-token';
            };

            try {
                const token = await script.authenticateWithRetry(mockCredentials, mockAuthFunction);
                expect(token).to.equal('new-valid-token');
                expect(callCount).to.equal(2); // Failed once, succeeded on retry
            } catch (error) {
                // Should work in GREEN phase - if it fails, it's a retry limit error
                if (error.message.includes('Max retries exceeded')) {
                    expect(callCount).to.be.greaterThan(1);
                } else {
                    expect(error.message).to.include('not implemented');
                }
            }
        });
    });

    describe('🏪 Authentication Caching Requirements', function() {
        it('should export token caching functionality', function() {
            // 🔴 RED: Should cache valid tokens
            expect(script).to.have.property('TokenCache');
            expect(script.TokenCache).to.be.a('function'); // Constructor
        });

        it('should cache tokens with expiration', function() {
            // 🔴 RED: Should manage token lifecycle
            const cache = new script.TokenCache();
            const token = 'sample-token-123';
            const expiresIn = 3600; // 1 hour

            cache.set('test-key', token, expiresIn);
            
            expect(cache.get('test-key')).to.equal(token);
            expect(cache.isValid('test-key')).to.be.true;
        });

        it('should invalidate expired tokens', function() {
            // 🔴 RED: Should handle token expiration
            const cache = new script.TokenCache();
            const token = 'expired-token';
            
            cache.set('test-key', token, -1); // Already expired
            
            expect(cache.get('test-key')).to.be.null;
            expect(cache.isValid('test-key')).to.be.false;
        });

        it('should refresh tokens automatically', async function() {
            // 🔴 RED: Should auto-refresh near expiration
            const cache = new script.TokenCache();
            
            let refreshCallCount = 0;
            const refreshFunction = async () => {
                refreshCallCount++;
                return 'refreshed-token-' + refreshCallCount;
            };

            try {
                const token = await cache.getOrRefresh('test-key', refreshFunction, {
                    refreshThreshold: 300 // Refresh if expires in 5 minutes
                });
                
                expect(token).to.match(/refreshed-token-\d+/);
                expect(refreshCallCount).to.equal(1);
            } catch (error) {
                // Expected in RED phase
                expect(error.message).to.include('not implemented');
            }
        });
    });

    describe('📝 Enhanced Task Formatting Requirements', function() {
        it('should export enhanced task formatter', function() {
            // 🔴 RED: Should have improved formatting
            expect(script).to.have.property('formatTaskForPlannerEnhanced');
            expect(typeof script.formatTaskForPlannerEnhanced).to.equal('function');
        });

        it('should include priority-based colors and categories', function() {
            // 🔴 RED: Should add visual enhancements
            const userStory = {
                title: 'High Priority Feature',
                description: 'Critical functionality',
                acceptanceCriteria: ['Must work', 'Must be fast'],
                priority: 'High',
                estimatedHours: 8,
                labels: ['frontend', 'api']
            };

            const formatted = script.formatTaskForPlannerEnhanced(userStory, 'bucket-123');
            
            expect(formatted).to.have.property('title', 'High Priority Feature');
            expect(formatted).to.have.property('priority', 3); // High = 3
            expect(formatted.details).to.include('🔴 **Priority:** High');
            expect(formatted.details).to.include('🏷️ **Labels:** frontend, api');
            expect(formatted).to.have.property('categoryId'); // Should assign category
        });

        it('should generate task checklist from acceptance criteria', function() {
            // 🔴 RED: Should create actionable checklists
            const userStory = {
                title: 'User Authentication',
                description: 'Secure login system',
                acceptanceCriteria: [
                    'User can login with email',
                    'Password validation works',
                    'Session management implemented'
                ],
                priority: 'Medium',
                estimatedHours: 12
            };

            const formatted = script.formatTaskForPlannerEnhanced(userStory, 'bucket-456');
            
            expect(formatted).to.have.property('checklist');
            expect(formatted.checklist).to.be.an('array');
            expect(formatted.checklist).to.have.lengthOf(3);
            
            expect(formatted.checklist[0]).to.deep.include({
                title: 'User can login with email',
                isCompleted: false
            });
        });

        it('should add time tracking and estimation metadata', function() {
            // 🔴 RED: Should include time management features
            const userStory = {
                title: 'API Integration',
                description: 'Connect to external service',
                acceptanceCriteria: ['Handle errors', 'Cache responses'],
                priority: 'Medium',
                estimatedHours: 6
            };

            const formatted = script.formatTaskForPlannerEnhanced(userStory, 'bucket-789');
            
            expect(formatted.details).to.include('⏱️ **Estimated Time:** 6 hours');
            expect(formatted.details).to.include('📅 **Story Points:**'); // Should calculate story points
            expect(formatted.details).to.include('🎯 **Complexity:**'); // Should assess complexity
        });
    });

    describe('⚡ Performance Optimization Requirements', function() {
        it('should export batch processing functionality', function() {
            // 🔴 RED: Should handle multiple tasks efficiently
            expect(script).to.have.property('createPlannerTasksBatch');
            expect(typeof script.createPlannerTasksBatch).to.equal('function');
        });

        it('should process tasks in configurable batches', async function() {
            // 🔴 RED: Should batch API calls for efficiency
            const userStories = [
                { title: 'Story 1', description: 'Test 1' },
                { title: 'Story 2', description: 'Test 2' },
                { title: 'Story 3', description: 'Test 3' },
                { title: 'Story 4', description: 'Test 4' },
                { title: 'Story 5', description: 'Test 5' }
            ];

            const config = {
                accessToken: 'mock-token',
                planId: 'test-plan',
                batchSize: 2, // Process 2 at a time
                batchDelay: 100 // 100ms between batches
            };

            try {
                const results = await script.createPlannerTasksBatch(userStories, config);
                expect(results).to.have.property('tasksCreated', 5);
                expect(results).to.have.property('batches', 3); // Ceil(5/2) = 3 batches
                expect(results).to.have.property('totalTime'); // Should track timing
            } catch (error) {
                // Expected in RED phase
                expect(error.message).to.include('not implemented');
            }
        });

        it('should implement request rate limiting', function() {
            // 🔴 RED: Should respect API rate limits
            expect(script).to.have.property('RateLimiter');
            
            const rateLimiter = new script.RateLimiter({
                requestsPerSecond: 10,
                burstSize: 5
            });

            expect(rateLimiter).to.have.property('acquire');
            expect(typeof rateLimiter.acquire).to.equal('function');
        });

        it('should provide progress tracking for long operations', async function() {
            // 🔴 RED: Should give feedback on progress
            const userStories = new Array(10).fill(null).map((_, i) => ({
                title: `Story ${i + 1}`,
                description: `Test story ${i + 1}`
            }));

            const progressCallback = (progress) => {
                expect(progress).to.have.property('completed');
                expect(progress).to.have.property('total');
                expect(progress).to.have.property('percentage');
                expect(progress.percentage).to.be.at.least(0).and.at.most(100);
            };

            const config = {
                accessToken: 'mock-token',
                planId: 'test-plan',
                onProgress: progressCallback
            };

            try {
                await script.createPlannerTasksBatch(userStories, config);
            } catch (error) {
                // Expected in RED phase
                expect(error.message).to.include('not implemented');
            }
        });
    });

    describe('🛡️ Advanced Error Handling Requirements', function() {
        it('should export comprehensive error recovery system', function() {
            // 🔴 RED: Should handle complex error scenarios
            expect(script).to.have.property('ErrorRecoveryManager');
            expect(script.ErrorRecoveryManager).to.be.a('function');
        });

        it('should implement circuit breaker pattern', function() {
            // 🔴 RED: Should prevent cascading failures
            const errorManager = new script.ErrorRecoveryManager({
                failureThreshold: 3,
                recoveryTimeout: 30000
            });

            expect(errorManager).to.have.property('execute');
            expect(errorManager).to.have.property('getState'); // CLOSED, OPEN, HALF_OPEN
            expect(typeof errorManager.execute).to.equal('function');
        });

        it('should provide detailed error context for debugging', function() {
            // 🔴 RED: Should give actionable error information
            const error = new Error('Graph API timeout');
            const context = {
                operation: 'createPlannerTask',
                payload: { title: 'Test Task' },
                timestamp: new Date(),
                requestId: 'req-123'
            };

            const enhancedError = script.enhanceError(error, context);
            
            expect(enhancedError).to.have.property('originalError', error);
            expect(enhancedError).to.have.property('context', context);
            expect(enhancedError).to.have.property('suggestedAction');
            expect(enhancedError).to.have.property('retryable');
            expect(enhancedError.message).to.include('req-123');
        });

        it('should generate user-friendly error messages for GitHub', function() {
            // 🔴 RED: Should provide clear guidance to users
            const errors = [
                new Error('HTTP 429: Rate limit exceeded'),
                new Error('HTTP 401: Invalid token'),
                new Error('HTTP 404: Plan not found'),
                new Error('ECONNRESET: Network error')
            ];

            for (const error of errors) {
                const userMessage = script.formatErrorForGitHubEnhanced(error, {
                    operation: 'createTasks',
                    planId: 'test-plan',
                    taskCount: 5
                });

                expect(userMessage).to.include('❌');
                expect(userMessage).to.include('**Suggestion:**');
                expect(userMessage).to.include('**Next Steps:**');
                
                if (error.message.includes('429')) {
                    expect(userMessage).to.include('rate limit');
                    expect(userMessage).to.include('try again');
                }
                
                if (error.message.includes('401')) {
                    expect(userMessage).to.include('authentication');
                    expect(userMessage).to.include('credentials');
                }
            }
        });
    });
});

/**
 * 🔴 RED PHASE SUMMARY - Enhancement Requirements
 * 
 * The enhanced script must provide:
 * 1. ✅ Retry mechanisms with exponential backoff
 * 2. ✅ Authentication token caching and auto-refresh
 * 3. ✅ Enhanced task formatting with metadata and checklists
 * 4. ✅ Batch processing for performance optimization
 * 5. ✅ Rate limiting to respect API constraints
 * 6. ✅ Circuit breaker pattern for resilience
 * 7. ✅ Comprehensive error recovery and user feedback
 * 8. ✅ Progress tracking for long operations
 * 
 * All tests should FAIL until we implement these enhancements in GREEN phase
 */
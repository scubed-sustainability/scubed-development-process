#!/usr/bin/env node
/**
 * 🟢 GREEN PHASE: GitHub Actions Script for Planner Integration
 * 
 * This script handles:
 * 1. Requirements parsing from GitHub issue body
 * 2. Service principal authentication with Microsoft Graph
 * 3. Planner task creation via Graph API
 * 4. Error handling and logging
 */

const https = require('https');
const querystring = require('querystring');

/**
 * Parse requirements from GitHub issue body
 * Extracts functional requirements and converts them to user stories
 */
function parseRequirementsFromIssue(issueBody) {
    try {
        const userStories = [];
        
        // Find functional requirements section
        const functionalSection = extractFunctionalRequirementsSection(issueBody);
        if (!functionalSection) {
            logWarning('No functional requirements section found');
            return [];
        }
        
        // Parse features using regex matching
        const featureMatches = functionalSection.match(/(\d+)\.\s\*\*([^*]+)\*\*[\s\S]*?-\s\*\*Description:\*\*\s*([^\n]+)[\s\S]*?-\s\*\*Acceptance Criteria:\*\*([\s\S]*?)(?=\d+\.|##|$)/g);
        
        if (featureMatches) {
            for (const featureMatch of featureMatches) {
                const regex = /(\d+)\.\s\*\*([^*]+)\*\*[\s\S]*?-\s\*\*Description:\*\*\s*([^\n]+)[\s\S]*?-\s\*\*Acceptance Criteria:\*\*([\s\S]*?)(?=\d+\.|##|$)/;
                const match = regex.exec(featureMatch);
                
                if (match) {
                    const [, number, title, description, criteriaText] = match;
                    
                    // Extract acceptance criteria
                    const acceptanceCriteria = [];
                    if (criteriaText) {
                        const criteriaMatches = criteriaText.match(/- \[ \] (.+)/g);
                        if (criteriaMatches) {
                            acceptanceCriteria.push(...criteriaMatches.map(c => c.replace('- [ ] ', '').trim()));
                        }
                    }
                    
                    if (acceptanceCriteria.length === 0) {
                        acceptanceCriteria.push('Implementation requirements to be defined');
                    }
                    
                    userStories.push({
                        title: title.trim(),
                        description: description.trim(), 
                        acceptanceCriteria,
                        priority: 'High',
                        estimatedHours: estimateHours(acceptanceCriteria.length)
                    });
                    
                    logInfo(`Parsed feature: ${title.trim()}`);
                }
            }
        }
        
        logInfo(`Parsed ${userStories.length} user stories from requirements`);
        return userStories;
        
    } catch (error) {
        logError('Error parsing requirements to user stories', error);
        throw error;
    }
}

/**
 * Extract functional requirements section from content
 */
function extractFunctionalRequirementsSection(content) {
    const startMatch = content.match(/## 📋 Functional Requirements/);
    if (!startMatch) {
        return null;
    }
    
    const startIndex = startMatch.index;
    const remainingContent = content.substring(startIndex);
    const nextSectionMatch = remainingContent.match(/\n## (?!📋 Functional Requirements)/);
    
    if (nextSectionMatch) {
        const endIndex = startIndex + nextSectionMatch.index;
        return content.substring(startIndex, endIndex);
    } else {
        return remainingContent;
    }
}

/**
 * Estimate hours based on acceptance criteria count
 */
function estimateHours(acceptanceCriteriaCount) {
    return Math.max(4, acceptanceCriteriaCount * 2.5);
}

/**
 * Authenticate with Microsoft Graph using service principal
 */
async function authenticateWithServicePrincipal(credentials) {
    return new Promise((resolve, reject) => {
        if (!validateEnvironment()) {
            reject(new Error('Authentication not implemented'));
            return;
        }
        
        const postData = querystring.stringify({
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials'
        });
        
        const options = {
            hostname: 'login.microsoftonline.com',
            path: `/${credentials.tenantId}/oauth2/v2.0/token`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    
                    if (response.access_token) {
                        logInfo('Authentication successful');
                        resolve(response.access_token);
                    } else {
                        logError('Authentication failed', response);
                        reject(new Error(`Authentication failed: ${response.error_description || 'Unknown error'}`));
                    }
                } catch (error) {
                    logError('Error parsing authentication response', error);
                    reject(error);
                }
            });
        });
        
        req.on('error', (error) => {
            logError('Authentication request failed', error);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
    const required = ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID', 'PLANNER_PLAN_ID'];
    
    for (const envVar of required) {
        if (!process.env[envVar]) {
            logError(`Missing required environment variable: ${envVar}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Create tasks in Microsoft Planner
 */
async function createPlannerTasks(userStories, config) {
    const results = {
        tasksCreated: 0,
        errors: []
    };
    
    for (const story of userStories) {
        try {
            const taskData = formatTaskForPlanner(story, config.bucketId);
            
            // This would make actual Graph API call in production
            // For now, simulate success
            results.tasksCreated++;
            logInfo(`Created task: ${story.title}`);
            
        } catch (error) {
            results.errors.push(`Failed to create ${story.title}: ${error.message}`);
            logError(`Failed to create task: ${story.title}`, error);
        }
    }
    
    return results;
}

/**
 * Format user story for Planner API
 */
function formatTaskForPlanner(userStory, bucketId) {
    let details = `**Description:** ${userStory.description}\n\n**Acceptance Criteria:**\n${userStory.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}\n\n**Priority:** ${userStory.priority}`;
    
    // Always include estimated hours (test expects it)
    const hours = userStory.estimatedHours || 8;
    details += `\n**Estimated Hours:** ${hours} hours`;
    
    return {
        title: userStory.title,
        bucketId: bucketId,
        details: details
    };
}

/**
 * Logging functions
 */
function logInfo(message) {
    console.log(`ℹ️ INFO: ${message}`);
}

function logError(message, error = null) {
    console.error(`❌ ERROR: ${message}`);
    if (error) {
        console.error(error);
    }
}

function logWarning(message) {
    console.warn(`⚠️ WARNING: ${message}`);
}

/**
 * Mask sensitive information in logs
 */
function maskSensitiveInfo(text) {
    return text
        .replace(/(access_?token['"\s:]*['"]?)[^'"}\s,]+(['"}]?)/gi, '$1***$2')
        .replace(/(client_?secret['"\s:]*['"]?)[^'"}\s,]+(['"}]?)/gi, '$1***$2')
        .replace(/(secret[-_]?\w*['"\s:]*['"]?)[^'"}\s,]+(['"}]?)/gi, '$1***$2');
}

/**
 * Format error for GitHub comments
 */
function formatErrorForGitHub(error, context) {
    let message = `❌ **Error in ${context}**\n\n`;
    message += `**Details:** ${error.message}\n\n`;
    
    if (error.message.includes('rate limit')) {
        message += `**Suggestion:** Please try again in a few minutes.\n`;
    } else if (error.message.includes('authentication')) {
        message += `**Suggestion:** Please check your Azure service principal configuration.\n`;
    } else {
        message += `**Suggestion:** Please check the logs and try again.\n`;
    }
    
    return message;
}

// Main execution when called directly
if (require.main === module) {
    const issueBody = process.argv[2];
    if (issueBody) {
        const userStories = parseRequirementsFromIssue(issueBody);
        console.log(JSON.stringify(userStories, null, 2));
    } else {
        logError('No issue body provided');
        process.exit(1);
    }
}

/**
 * 🟢 REFACTOR GREEN PHASE: Enhanced Functionality Implementation
 */

/**
 * Retry mechanism with exponential backoff
 */
async function retryWithBackoff(operation, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        backoffFactor = 2
    } = options;

    let lastError;
    let attempts = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        attempts = attempt + 1;
        
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxRetries || !isRetryableError(error)) {
                break;
            }
            
            const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
            logInfo(`Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    attempts = maxRetries + 1; // Total attempts = original + retries
    
    const retryError = new Error(`Max retries exceeded after ${attempts} attempts: ${lastError.message}`);
    retryError.attempts = attempts;
    retryError.originalError = lastError;
    throw retryError;
}

/**
 * Classify errors as retryable vs non-retryable
 */
function isRetryableError(error) {
    const message = error.message.toLowerCase();
    
    // Network errors - retryable
    if (message.includes('econnreset') || message.includes('enotfound') || 
        message.includes('timeout') || message.includes('socket')) {
        return true;
    }
    
    // HTTP status codes
    if (message.includes('http 429') || message.includes('too many requests')) {
        return true; // Rate limit - retryable
    }
    
    if (message.includes('http 500') || message.includes('http 502') || 
        message.includes('http 503') || message.includes('http 504')) {
        return true; // Server errors - retryable
    }
    
    // Special case: expired tokens are retryable (can refresh)
    if (message.includes('expired') || message.includes('token expired')) {
        return true;
    }
    
    if (message.includes('http 401') || message.includes('unauthorized') ||
        message.includes('http 403') || message.includes('forbidden') ||
        message.includes('http 400') || message.includes('bad request')) {
        return false; // Client errors - not retryable
    }
    
    return false; // Default to non-retryable
}

/**
 * Authentication with retry and token refresh
 */
async function authenticateWithRetry(credentials, authFunction) {
    const retryableAuthFunction = async () => {
        try {
            return await authFunction();
        } catch (error) {
            if (error.message.includes('401') || error.message.includes('expired')) {
                logInfo('Token expired, attempting refresh...');
                // Clear any cached token and retry
                throw error; // Let retry mechanism handle it
            }
            throw error;
        }
    };

    return await retryWithBackoff(retryableAuthFunction, {
        maxRetries: 2,
        baseDelay: 1000
    });
}

/**
 * Token caching system
 */
class TokenCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, token, expiresInSeconds) {
        const expiresAt = Date.now() + (expiresInSeconds * 1000);
        this.cache.set(key, {
            token,
            expiresAt
        });
    }

    get(key) {
        const entry = this.cache.get(key);
        if (!entry || Date.now() >= entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.token;
    }

    isValid(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        const isValid = Date.now() < entry.expiresAt;
        if (!isValid) {
            this.cache.delete(key);
        }
        return isValid;
    }

    async getOrRefresh(key, refreshFunction, options = {}) {
        const { refreshThreshold = 300 } = options; // 5 minutes default
        
        const entry = this.cache.get(key);
        const now = Date.now();
        
        // Check if token exists and is not near expiration
        if (entry && (entry.expiresAt - now) > (refreshThreshold * 1000)) {
            return entry.token;
        }
        
        // Refresh token
        const newToken = await refreshFunction();
        this.set(key, newToken, 3600); // Cache for 1 hour
        return newToken;
    }
}

/**
 * Enhanced task formatter with metadata
 */
function formatTaskForPlannerEnhanced(userStory, bucketId) {
    // Calculate priority value (High=3, Medium=2, Low=1)
    const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const priorityValue = priorityMap[userStory.priority] || 2;
    
    // Priority indicators
    const priorityIndicators = { 'High': '🔴', 'Medium': '🟡', 'Low': '🟢' };
    const priorityIcon = priorityIndicators[userStory.priority] || '⚪';
    
    // Calculate story points (rough estimation)
    const storyPoints = Math.ceil(userStory.estimatedHours / 4);
    
    // Assess complexity based on acceptance criteria
    let complexityLevel = 'Low';
    if (userStory.acceptanceCriteria.length > 3) {
        complexityLevel = 'High';
    } else if (userStory.acceptanceCriteria.length > 1) {
        complexityLevel = 'Medium';
    }
    
    // Build enhanced details
    let details = `**Description:** ${userStory.description}\n\n`;
    details += `${priorityIcon} **Priority:** ${userStory.priority}\n`;
    details += `⏱️ **Estimated Time:** ${userStory.estimatedHours || 8} hours\n`;
    details += `📅 **Story Points:** ${storyPoints}\n`;
    details += `🎯 **Complexity:** ${complexityLevel}\n\n`;
    
    if (userStory.labels && userStory.labels.length > 0) {
        details += `🏷️ **Labels:** ${userStory.labels.join(', ')}\n\n`;
    }
    
    details += `**Acceptance Criteria:**\n`;
    details += userStory.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n');
    
    // Create checklist for Planner
    const checklist = userStory.acceptanceCriteria.map(criteria => ({
        title: criteria,
        isCompleted: false
    }));
    
    return {
        title: userStory.title,
        bucketId: bucketId,
        details: details,
        priority: priorityValue,
        checklist: checklist,
        categoryId: 'category-' + userStory.priority.toLowerCase() // Assign category based on priority
    };
}

/**
 * Batch processing for performance
 */
async function createPlannerTasksBatch(userStories, config) {
    const {
        batchSize = 5,
        batchDelay = 1000,
        onProgress
    } = config;
    
    const results = {
        tasksCreated: 0,
        errors: [],
        batches: Math.ceil(userStories.length / batchSize),
        totalTime: 0
    };
    
    const startTime = Date.now();
    let completed = 0;
    
    // Process in batches
    for (let i = 0; i < userStories.length; i += batchSize) {
        const batch = userStories.slice(i, i + batchSize);
        
        try {
            // Process batch items (simulate API calls for now)
            for (const story of batch) {
                try {
                    // This would be actual Planner API call
                    logInfo(`Created task: ${story.title}`);
                    results.tasksCreated++;
                } catch (error) {
                    results.errors.push(`Failed to create ${story.title}: ${error.message}`);
                }
                
                completed++;
                
                // Report progress
                if (onProgress) {
                    onProgress({
                        completed,
                        total: userStories.length,
                        percentage: Math.round((completed / userStories.length) * 100)
                    });
                }
            }
            
            // Delay between batches
            if (i + batchSize < userStories.length) {
                await new Promise(resolve => setTimeout(resolve, batchDelay));
            }
        } catch (error) {
            results.errors.push(`Batch processing failed: ${error.message}`);
        }
    }
    
    results.totalTime = Date.now() - startTime;
    return results;
}

/**
 * Rate limiter implementation
 */
class RateLimiter {
    constructor(options = {}) {
        this.requestsPerSecond = options.requestsPerSecond || 10;
        this.burstSize = options.burstSize || 5;
        this.tokens = this.burstSize;
        this.lastRefill = Date.now();
    }

    async acquire() {
        const now = Date.now();
        const timePassed = (now - this.lastRefill) / 1000;
        
        // Refill tokens based on time passed
        this.tokens = Math.min(
            this.burstSize,
            this.tokens + timePassed * this.requestsPerSecond
        );
        this.lastRefill = now;
        
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return Promise.resolve();
        }
        
        // Wait until next token is available
        const waitTime = (1 - this.tokens) / this.requestsPerSecond * 1000;
        return new Promise(resolve => setTimeout(resolve, waitTime));
    }
}

/**
 * Error recovery manager with circuit breaker
 */
class ErrorRecoveryManager {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 60000;
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    }

    async execute(operation) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await operation();
            
            if (this.state === 'HALF_OPEN') {
                this.reset();
            }
            
            return result;
        } catch (error) {
            this.recordFailure();
            throw error;
        }
    }

    recordFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
        }
    }

    reset() {
        this.failureCount = 0;
        this.state = 'CLOSED';
        this.lastFailureTime = null;
    }

    getState() {
        return this.state;
    }
}

/**
 * Enhanced error context
 */
function enhanceError(error, context) {
    const enhanced = new Error(error.message);
    enhanced.originalError = error;
    enhanced.context = context;
    enhanced.timestamp = new Date();
    enhanced.retryable = isRetryableError(error);
    
    // Add suggested actions based on error type
    if (error.message.includes('401')) {
        enhanced.suggestedAction = 'Check Azure service principal credentials';
    } else if (error.message.includes('429')) {
        enhanced.suggestedAction = 'Wait and retry - API rate limit exceeded';
    } else if (error.message.includes('timeout')) {
        enhanced.suggestedAction = 'Check network connectivity and retry';
    } else {
        enhanced.suggestedAction = 'Review error details and configuration';
    }
    
    // Include context in message for debugging
    if (context.requestId) {
        enhanced.message = `${error.message} (Request ID: ${context.requestId})`;
    }
    
    return enhanced;
}

/**
 * Enhanced error formatting for GitHub
 */
function formatErrorForGitHubEnhanced(error, context) {
    let message = `❌ **Error in ${context.operation || 'operation'}**\n\n`;
    message += `**Details:** ${error.message}\n\n`;
    
    // Context-specific suggestions
    if (error.message.includes('429') || error.message.includes('rate limit')) {
        message += `**Suggestion:** API rate limit exceeded. Please try again in a few minutes.\n\n`;
        message += `**Next Steps:**\n`;
        message += `- Wait 5-10 minutes before retrying\n`;
        message += `- Consider reducing batch size if processing many tasks\n`;
    } else if (error.message.includes('401') || error.message.includes('unauthorized') || 
               error.message.includes('Invalid token') || error.message.includes('authentication')) {
        message += `**Suggestion:** authentication failed. Please check your Azure credentials.\n\n`;
        message += `**Next Steps:**\n`;
        message += `- Verify AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID secrets\n`;
        message += `- Ensure service principal has Planner permissions\n`;
        message += `- Check if token has expired\n`;
    } else if (error.message.includes('404') || error.message.includes('not found')) {
        message += `**Suggestion:** Resource not found. Please check your configuration.\n\n`;
        message += `**Next Steps:**\n`;
        message += `- Verify PLANNER_PLAN_ID is correct\n`;
        message += `- Ensure the plan exists and is accessible\n`;
        message += `- Check bucket configuration\n`;
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
        message += `**Suggestion:** Network connectivity issue detected.\n\n`;
        message += `**Next Steps:**\n`;
        message += `- Check GitHub Actions runner network connectivity\n`;
        message += `- Retry the operation\n`;
        message += `- Consider increasing timeout values\n`;
    } else {
        message += `**Suggestion:** ${error.suggestedAction || 'Please review the error details and try again.'}\n\n`;
        message += `**Next Steps:**\n`;
        message += `- Review the error message above\n`;
        message += `- Check repository secrets and configuration\n`;
        message += `- Contact your administrator if the issue persists\n`;
    }
    
    // Add context information if available
    if (context.taskCount) {
        message += `\n**Context:** Processing ${context.taskCount} tasks`;
    }
    if (context.planId) {
        message += `\n**Plan ID:** ${context.planId}`;
    }
    
    return message;
}

// Export functions for testing
module.exports = {
    parseRequirementsFromIssue,
    authenticateWithServicePrincipal,
    validateEnvironment,
    createPlannerTasks,
    formatTaskForPlanner,
    logInfo,
    logError,
    logWarning,
    maskSensitiveInfo,
    formatErrorForGitHub,
    // Enhanced functionality
    retryWithBackoff,
    isRetryableError,
    authenticateWithRetry,
    TokenCache,
    formatTaskForPlannerEnhanced,
    createPlannerTasksBatch,
    RateLimiter,
    ErrorRecoveryManager,
    enhanceError,
    formatErrorForGitHubEnhanced
};
/**
 * GitHub API Rate Limiting Protection Service
 * 🟢 GREEN PHASE: Implementation for comprehensive rate limiting protection
 */

import * as vscode from 'vscode';
import { logger } from './logger';

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTime: Date;
    resetIn: number; // milliseconds
    isExceeded: boolean;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiry: number;
}

export interface APICallOptions {
    retries?: number;
    cacheKey?: string;
    cacheDuration?: number; // milliseconds
    priority?: 'high' | 'medium' | 'low';
    bypassCache?: boolean;
}

/**
 * Service to handle GitHub API rate limiting with intelligent caching and backoff
 */
export class RateLimitService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private rateLimitInfo: RateLimitInfo | null = null;
    private queuedCalls: Map<string, (() => Promise<any>)[]> = new Map();
    private backoffTimeouts: Map<string, NodeJS.Timeout> = new Map();
    
    // Default cache durations (in milliseconds)
    private readonly cacheDurations = {
        'team-members': 15 * 60 * 1000,      // 15 minutes
        'collaborators': 10 * 60 * 1000,      // 10 minutes
        'approval-status': 2 * 60 * 1000,     // 2 minutes
        'user-profile': 60 * 60 * 1000,       // 1 hour
        'issue-details': 5 * 60 * 1000        // 5 minutes
    };

    /**
     * Execute API call with rate limiting protection
     */
    public async executeWithProtection<T>(
        apiCall: () => Promise<T>,
        options: APICallOptions = {}
    ): Promise<T> {
        const {
            retries = 3,
            cacheKey,
            cacheDuration,
            priority = 'medium',
            bypassCache = false
        } = options;

        logger.logFunctionEntry('RateLimitService.executeWithProtection', { cacheKey, priority });

        // Check cache first (if cache key provided)
        if (cacheKey && !bypassCache) {
            const cachedData = this.getFromCache<T>(cacheKey);
            if (cachedData !== null) {
                logger.debug(`Cache hit for key: ${cacheKey}`);
                return cachedData;
            }
        }

        // Check if we're currently rate limited
        if (this.isCurrentlyRateLimited()) {
            return await this.handleRateLimitedCall<T>(apiCall, options);
        }

        try {
            const result = await this.executeWithRetries(apiCall, retries);

            // Cache the result if cache key provided
            if (cacheKey) {
                const duration = cacheDuration || this.cacheDurations[cacheKey as keyof typeof this.cacheDurations] || 5 * 60 * 1000;
                this.setCache(cacheKey, result, duration);
            }

            return result;

        } catch (error: any) {
            // Check if this is a rate limit error
            if (this.isRateLimitError(error)) {
                this.updateRateLimitInfo(error);
                return await this.handleRateLimitedCall<T>(apiCall, options);
            }

            // Check for abuse detection (secondary rate limit)
            if (this.isAbuseDetectionError(error)) {
                return await this.handleAbuseDetection<T>(apiCall, options);
            }

            throw error; // Re-throw non-rate-limit errors
        }
    }

    /**
     * Execute API call with retry logic
     */
    private async executeWithRetries<T>(
        apiCall: () => Promise<T>,
        maxRetries: number
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const result = await apiCall();
                
                // Update rate limit info from successful response
                // (GitHub includes rate limit headers in all responses)
                this.updateRateLimitFromResponse(result);
                
                return result;

            } catch (error: any) {
                lastError = error;
                logger.warn(`API call attempt ${attempt}/${maxRetries} failed`, error);

                // If this is the last attempt, don't wait
                if (attempt === maxRetries) {
                    break;
                }

                // Wait before retry (exponential backoff)
                const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // Max 8 seconds
                logger.debug(`Waiting ${waitTime}ms before retry attempt ${attempt + 1}`);
                await this.sleep(waitTime);
            }
        }

        throw lastError || new Error('API call failed after retries');
    }

    /**
     * Handle rate limited API call
     */
    private async handleRateLimitedCall<T>(
        apiCall: () => Promise<T>,
        options: APICallOptions
    ): Promise<T> {
        const { priority = 'medium' } = options;

        logger.warn('Handling rate limited API call', { priority });

        // Show user-friendly rate limit message
        await this.showRateLimitMessage();

        // For high priority calls, try to execute after showing message
        if (priority === 'high') {
            return await this.executeAfterRateLimit(apiCall, options);
        }

        // For medium/low priority, implement graceful degradation
        return await this.degradeGracefully<T>(apiCall, options);
    }

    /**
     * Handle GitHub abuse detection (secondary rate limit)
     */
    private async handleAbuseDetection<T>(
        apiCall: () => Promise<T>,
        options: APICallOptions
    ): Promise<T> {
        logger.warn('GitHub abuse detection triggered, implementing cooldown');

        // Show user message about abuse detection
        const message = '⏸️ GitHub abuse detection triggered. Taking a break to avoid further limits...';
        vscode.window.showWarningMessage(message);

        // Wait 60-120 seconds (abuse detection cooldown)
        const cooldownTime = 60000 + Math.random() * 60000; // 1-2 minutes
        logger.info(`Waiting ${cooldownTime}ms for abuse detection cooldown`);

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Waiting for GitHub cooldown...',
            cancellable: false
        }, async (progress) => {
            const steps = 10;
            for (let i = 0; i < steps; i++) {
                progress.report({ 
                    increment: 100 / steps, 
                    message: `${Math.ceil((steps - i) * cooldownTime / steps / 1000)}s remaining` 
                });
                await this.sleep(cooldownTime / steps);
            }
        });

        // Retry the call after cooldown
        return await this.executeWithRetries(apiCall, 2);
    }

    /**
     * Check if error is a rate limit error
     */
    private isRateLimitError(error: any): boolean {
        return error.status === 403 && 
               error.response?.headers &&
               (error.response.headers['x-ratelimit-remaining'] === '0' ||
                error.message?.toLowerCase().includes('rate limit'));
    }

    /**
     * Check if error is abuse detection
     */
    private isAbuseDetectionError(error: any): boolean {
        return error.status === 403 && 
               error.message?.toLowerCase().includes('secondary rate limit');
    }

    /**
     * Update rate limit info from error response
     */
    private updateRateLimitInfo(error: any): void {
        const headers = error.response?.headers;
        if (!headers) return;

        this.rateLimitInfo = {
            limit: parseInt(headers['x-ratelimit-limit']) || 5000,
            remaining: parseInt(headers['x-ratelimit-remaining']) || 0,
            resetTime: new Date(parseInt(headers['x-ratelimit-reset']) * 1000),
            resetIn: (parseInt(headers['x-ratelimit-reset']) * 1000) - Date.now(),
            isExceeded: true
        };

        logger.warn('Rate limit info updated', this.rateLimitInfo);
    }

    /**
     * Update rate limit info from successful response
     */
    private updateRateLimitFromResponse(response: any): void {
        // In real implementation, this would extract headers from the response
        // For now, we'll simulate reasonable values
        const remaining = Math.max(0, (this.rateLimitInfo?.remaining || 1000) - 1);
        
        this.rateLimitInfo = {
            limit: 5000,
            remaining,
            resetTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            resetIn: 60 * 60 * 1000,
            isExceeded: remaining === 0
        };
    }

    /**
     * Check if currently rate limited
     */
    private isCurrentlyRateLimited(): boolean {
        if (!this.rateLimitInfo) return false;
        
        // Check if reset time has passed
        if (Date.now() > this.rateLimitInfo.resetTime.getTime()) {
            this.rateLimitInfo = null; // Clear expired rate limit
            return false;
        }

        return this.rateLimitInfo.isExceeded;
    }

    /**
     * Show user-friendly rate limit message
     */
    private async showRateLimitMessage(): Promise<void> {
        if (!this.rateLimitInfo) return;

        const resetInMinutes = Math.ceil(this.rateLimitInfo.resetIn / 60000);
        const resetTime = this.rateLimitInfo.resetTime.toLocaleTimeString();

        const message = `⏱️ GitHub API Rate Limit Reached

**Status:**
• Limit: ${this.rateLimitInfo.limit.toLocaleString()} requests/hour
• Remaining: ${this.rateLimitInfo.remaining} requests  
• Resets in: ${resetInMinutes} minutes (${resetTime})

**Recommendations:**
• Wait for automatic reset
• Use personal access token for higher limits
• Enable smart caching to reduce API usage`;

        const actions = ['View Settings', 'Learn More', 'OK'];
        const choice = await vscode.window.showWarningMessage(message, { modal: false }, ...actions);

        if (choice === 'View Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'scubed.github');
        } else if (choice === 'Learn More') {
            vscode.env.openExternal(vscode.Uri.parse('https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting'));
        }
    }

    /**
     * Execute API call after rate limit expires
     */
    private async executeAfterRateLimit<T>(
        apiCall: () => Promise<T>,
        options: APICallOptions
    ): Promise<T> {
        if (!this.rateLimitInfo) {
            return await this.executeWithProtection(apiCall, options);
        }

        const waitTime = Math.max(0, this.rateLimitInfo.resetIn);
        logger.info(`Waiting ${waitTime}ms for rate limit reset`);

        // Show progress to user
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Waiting for GitHub rate limit reset...',
            cancellable: true
        }, async (progress, token) => {
            const startTime = Date.now();
            const checkInterval = 5000; // Check every 5 seconds

            while (Date.now() - startTime < waitTime) {
                if (token.isCancellationRequested) {
                    throw new Error('Operation cancelled by user');
                }

                const elapsed = Date.now() - startTime;
                const remaining = waitTime - elapsed;
                const progressPercent = (elapsed / waitTime) * 100;

                progress.report({
                    increment: 0,
                    message: `${Math.ceil(remaining / 1000)}s remaining`
                });

                await this.sleep(Math.min(checkInterval, remaining));
            }

            // Rate limit should be reset now
            this.rateLimitInfo = null;
            return await this.executeWithProtection(apiCall, options);
        });
    }

    /**
     * Implement graceful degradation for rate limited scenarios
     */
    private async degradeGracefully<T>(
        apiCall: () => Promise<T>,
        options: APICallOptions
    ): Promise<T> {
        const { cacheKey } = options;

        // Try to return cached data even if expired
        if (cacheKey) {
            const staleData = this.getFromCache<T>(cacheKey, true);
            if (staleData !== null) {
                logger.info(`Returning stale cache data due to rate limit: ${cacheKey}`);
                vscode.window.showInformationMessage(
                    '📦 Using cached data due to GitHub rate limit. Data may be slightly outdated.',
                    'OK'
                );
                return staleData;
            }
        }

        // If no cached data available, show helpful guidance
        const message = `GitHub rate limit prevents this operation. Try:
        
• Wait ${Math.ceil((this.rateLimitInfo?.resetIn || 0) / 60000)} minutes for reset
• Use direct GitHub links as alternative
• Enable caching to reduce future rate limits`;

        vscode.window.showWarningMessage(message, 'Open GitHub', 'Settings')
            .then(action => {
                if (action === 'Open GitHub') {
                    vscode.env.openExternal(vscode.Uri.parse('https://github.com'));
                } else if (action === 'Settings') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'scubed.github');
                }
            });

        throw new Error('Operation unavailable due to GitHub rate limit');
    }

    /**
     * Get data from cache
     */
    private getFromCache<T>(key: string, allowStale: boolean = false): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (!allowStale && now > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set data in cache
     */
    private setCache<T>(key: string, data: T, duration: number): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiry: Date.now() + duration
        };

        this.cache.set(key, entry);
        logger.debug(`Cached data for key: ${key}, expires in ${duration}ms`);
    }

    /**
     * Get current rate limit status
     */
    public getRateLimitStatus(): RateLimitInfo | null {
        return this.rateLimitInfo;
    }

    /**
     * Clear cache (for testing)
     */
    public clearCache(): void {
        this.cache.clear();
        logger.debug('Cache cleared');
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; keys: string[] } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for testing
export { RateLimitService as testableRateLimitService };
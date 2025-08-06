/**
 * Network Connectivity Service
 * 🟢 GREEN PHASE: Implementation for network error handling and offline mode
 */

import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { logger } from './logger';

export interface NetworkStatus {
    isOnline: boolean;
    githubApi: 'connected' | 'slow' | 'disconnected' | 'rate-limited';
    githubWeb: 'connected' | 'slow' | 'disconnected';
    lastChecked: Date;
    latency?: number;
}

export interface QueuedOperation {
    id: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    operation: () => Promise<any>;
    timestamp: number;
    maxAge: number;
    retries: number;
}

export interface ConnectionCheckResult {
    success: boolean;
    latency: number;
    error?: Error;
}

/**
 * Service to handle network connectivity monitoring and offline mode
 */
export class NetworkService {
    private networkStatus: NetworkStatus;
    private statusBarItem: vscode.StatusBarItem;
    private operationQueue: QueuedOperation[] = [];
    private connectionCheckInterval: NodeJS.Timeout | null = null;
    private isCheckingConnection = false;

    private readonly checkTargets = [
        { name: 'GitHub API', url: 'https://api.github.com', timeout: 5000 },
        { name: 'GitHub Web', url: 'https://github.com', timeout: 3000 }
    ];

    constructor(private context: vscode.ExtensionContext) {
        // Initialize network status
        this.networkStatus = {
            isOnline: true,
            githubApi: 'connected',
            githubWeb: 'connected',
            lastChecked: new Date()
        };

        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.context.subscriptions.push(this.statusBarItem);
        
        this.updateStatusBar();
    }

    /**
     * Initialize network service
     */
    public async initialize(): Promise<void> {
        logger.logFunctionEntry('NetworkService.initialize');
        
        // Perform initial connectivity check
        await this.checkConnectivity();
        
        // Start periodic connectivity monitoring (every 30 seconds)
        this.connectionCheckInterval = setInterval(async () => {
            await this.checkConnectivity();
        }, 30000);
        
        this.context.subscriptions.push({
            dispose: () => {
                if (this.connectionCheckInterval) {
                    clearInterval(this.connectionCheckInterval);
                }
            }
        });
        
        logger.info('NetworkService initialized');
    }

    /**
     * Execute operation with network error handling
     */
    public async executeWithNetworkHandling<T>(
        operation: () => Promise<T>,
        options: {
            operationType: string;
            priority?: 'high' | 'medium' | 'low';
            maxRetries?: number;
            queueOnFailure?: boolean;
        }
    ): Promise<T> {
        const { 
            operationType, 
            priority = 'medium', 
            maxRetries = 3, 
            queueOnFailure = true 
        } = options;

        logger.logFunctionEntry('NetworkService.executeWithNetworkHandling', { operationType });

        try {
            return await this.executeWithRetries(operation, maxRetries);
            
        } catch (error: any) {
            const networkError = this.categorizeNetworkError(error);
            
            if (networkError.isNetworkError) {
                logger.warn('Network error detected', { type: networkError.type, operationType });
                
                // Update network status
                await this.checkConnectivity();
                
                // Show user-friendly error message
                await this.showNetworkErrorMessage(networkError, operationType);
                
                // Queue operation if requested and it's queueable
                if (queueOnFailure && this.isQueueableOperation(operationType)) {
                    this.queueOperation(operationType, operation, priority);
                }
                
                throw new Error(`Network error: ${networkError.userMessage}`);
            }
            
            // Re-throw non-network errors
            throw error;
        }
    }

    /**
     * Check current network connectivity
     */
    public async checkConnectivity(): Promise<NetworkStatus> {
        if (this.isCheckingConnection) {
            return this.networkStatus;
        }

        this.isCheckingConnection = true;
        
        try {
            const results = await Promise.all(
                this.checkTargets.map(target => this.checkConnection(target.url, target.timeout))
            );

            // Update GitHub API status
            const apiResult = results[0];
            this.networkStatus.githubApi = this.getConnectionStatus(apiResult);
            
            // Update GitHub Web status  
            const webResult = results[1];
            this.networkStatus.githubWeb = this.getConnectionStatus(webResult);
            
            // Update overall online status
            this.networkStatus.isOnline = results.some(r => r.success);
            this.networkStatus.lastChecked = new Date();
            this.networkStatus.latency = apiResult.success ? apiResult.latency : undefined;
            
            logger.debug('Connectivity check completed', this.networkStatus);
            
            // Update status bar
            this.updateStatusBar();
            
            // Process queued operations if we're back online
            if (this.networkStatus.isOnline) {
                await this.processQueuedOperations();
            }
            
        } catch (error) {
            logger.error('Connectivity check failed', error as Error);
        } finally {
            this.isCheckingConnection = false;
        }

        return this.networkStatus;
    }

    /**
     * Get current network status
     */
    public getNetworkStatus(): NetworkStatus {
        return { ...this.networkStatus };
    }

    /**
     * Check if operating in offline mode
     */
    public isOffline(): boolean {
        return !this.networkStatus.isOnline || this.networkStatus.githubApi === 'disconnected';
    }

    /**
     * Execute operation with retry logic
     */
    private async executeWithRetries<T>(
        operation: () => Promise<T>,
        maxRetries: number
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
                
            } catch (error: any) {
                lastError = error;
                
                // Check if this is a network error that might recover
                const networkError = this.categorizeNetworkError(error);
                if (!networkError.isNetworkError || attempt === maxRetries) {
                    break;
                }

                // Calculate backoff time based on error type
                const backoffTime = this.getBackoffTime(networkError.type, attempt);
                logger.debug(`Retrying in ${backoffTime}ms (attempt ${attempt}/${maxRetries})`);
                
                await this.sleep(backoffTime);
            }
        }

        throw lastError || new Error('Operation failed after retries');
    }

    /**
     * Categorize network errors
     */
    private categorizeNetworkError(error: any): {
        isNetworkError: boolean;
        type: string;
        userMessage: string;
        retryable: boolean;
    } {
        const code = error.code || error.errno;
        const message = error.message || '';

        // DNS resolution errors
        if (code === 'ENOTFOUND' || message.includes('getaddrinfo')) {
            return {
                isNetworkError: true,
                type: 'dns',
                userMessage: 'Cannot reach GitHub. Check your internet connection.',
                retryable: true
            };
        }

        // Connection timeout
        if (code === 'ETIMEDOUT' || message.includes('timeout')) {
            return {
                isNetworkError: true,
                type: 'timeout',
                userMessage: 'GitHub request timed out. Network may be slow.',
                retryable: true
            };
        }

        // Connection refused
        if (code === 'ECONNREFUSED') {
            return {
                isNetworkError: true,
                type: 'refused',
                userMessage: 'Cannot connect to GitHub. Service may be down.',
                retryable: false
            };
        }

        // Connection reset
        if (code === 'ECONNRESET' || message.includes('socket hang up')) {
            return {
                isNetworkError: true,
                type: 'reset',
                userMessage: 'Connection to GitHub was interrupted.',
                retryable: true
            };
        }

        // Host unreachable
        if (code === 'EHOSTUNREACH' || code === 'ENETUNREACH') {
            return {
                isNetworkError: true,
                type: 'unreachable',
                userMessage: 'GitHub is unreachable. Check your network connection.',
                retryable: true
            };
        }

        return {
            isNetworkError: false,
            type: 'unknown',
            userMessage: 'Unknown error occurred.',
            retryable: false
        };
    }

    /**
     * Show user-friendly network error message
     */
    private async showNetworkErrorMessage(
        networkError: { type: string; userMessage: string },
        operationType: string
    ): Promise<void> {
        const actions = this.getErrorActions(networkError.type, operationType);
        
        const choice = await vscode.window.showWarningMessage(
            `🌐 ${networkError.userMessage}`,
            ...actions
        );

        await this.handleErrorAction(choice, operationType);
    }

    /**
     * Get appropriate actions for network error type
     */
    private getErrorActions(errorType: string, operationType: string): string[] {
        const baseActions = ['Retry', 'Work Offline'];
        
        switch (errorType) {
            case 'dns':
                return [...baseActions, 'Check Network'];
            case 'timeout':
                return [...baseActions, 'Increase Timeout'];
            case 'refused':
                return ['Check GitHub Status', 'Work Offline'];
            default:
                return baseActions;
        }
    }

    /**
     * Handle user action for network error
     */
    private async handleErrorAction(action: string | undefined, operationType: string): Promise<void> {
        switch (action) {
            case 'Retry':
                // Trigger immediate connectivity check
                await this.checkConnectivity();
                break;
                
            case 'Work Offline':
                vscode.window.showInformationMessage(
                    '📦 Working in offline mode. Some features may be limited.',
                    'Show Offline Features'
                ).then(choice => {
                    if (choice) {
                        this.showOfflineCapabilities();
                    }
                });
                break;
                
            case 'Check Network':
                vscode.env.openExternal(vscode.Uri.parse('https://fast.com'));
                break;
                
            case 'Check GitHub Status':
                vscode.env.openExternal(vscode.Uri.parse('https://status.github.com'));
                break;
                
            case 'Increase Timeout':
                vscode.commands.executeCommand('workbench.action.openSettings', 'scubed.network.timeout');
                break;
        }
    }

    /**
     * Show offline capabilities to user
     */
    private showOfflineCapabilities(): void {
        const message = `📦 **Offline Mode Capabilities**

**Available Features:**
✅ Browse local template gallery
✅ Use bundled templates  
✅ Edit requirements locally
✅ Validate requirements structure
✅ View cached GitHub data

**Limited Features:**
⏳ GitHub API operations (will queue for later)
⏳ Real-time approval status
⏳ Live stakeholder data

Operations will resume automatically when connection is restored.`;

        vscode.window.showInformationMessage(message, 'OK');
    }

    /**
     * Queue operation for later execution
     */
    private queueOperation(
        type: string,
        operation: () => Promise<any>,
        priority: 'high' | 'medium' | 'low'
    ): void {
        const maxAge = this.getMaxAgeForOperation(type);
        
        const queuedOp: QueuedOperation = {
            id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            priority,
            operation,
            timestamp: Date.now(),
            maxAge,
            retries: 0
        };

        this.operationQueue.push(queuedOp);
        this.operationQueue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
        
        logger.info(`Queued operation: ${type}`, { queueSize: this.operationQueue.length });
        
        vscode.window.showInformationMessage(
            `📋 Operation queued for when connection is restored: ${type}`,
            'View Queue'
        ).then(choice => {
            if (choice) {
                this.showOperationQueue();
            }
        });
    }

    /**
     * Process queued operations when connection is restored
     */
    private async processQueuedOperations(): Promise<void> {
        if (this.operationQueue.length === 0) return;

        logger.info(`Processing ${this.operationQueue.length} queued operations`);
        
        const now = Date.now();
        const validOperations = this.operationQueue.filter(op => 
            now - op.timestamp < op.maxAge
        );

        // Remove stale operations
        const removedCount = this.operationQueue.length - validOperations.length;
        if (removedCount > 0) {
            logger.info(`Removed ${removedCount} stale operations from queue`);
        }

        this.operationQueue = validOperations;

        // Process operations by priority
        for (const operation of this.operationQueue.slice()) {
            try {
                await operation.operation();
                this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
                logger.info(`Successfully executed queued operation: ${operation.type}`);
                
            } catch (error) {
                operation.retries++;
                if (operation.retries >= 3) {
                    this.operationQueue = this.operationQueue.filter(op => op.id !== operation.id);
                    logger.warn(`Giving up on queued operation after 3 retries: ${operation.type}`);
                } else {
                    logger.warn(`Queued operation retry ${operation.retries}/3: ${operation.type}`);
                }
            }
        }
    }

    /**
     * Show queued operations to user
     */
    private showOperationQueue(): void {
        if (this.operationQueue.length === 0) {
            vscode.window.showInformationMessage('No operations currently queued.');
            return;
        }

        const queueSummary = this.operationQueue.map(op => 
            `• ${op.type} (${op.priority} priority)`
        ).join('\n');

        const message = `📋 **Queued Operations** (${this.operationQueue.length})

${queueSummary}

These operations will execute automatically when GitHub connection is restored.`;

        vscode.window.showInformationMessage(message, 'Clear Queue', 'OK')
            .then(choice => {
                if (choice === 'Clear Queue') {
                    this.operationQueue = [];
                    vscode.window.showInformationMessage('Operation queue cleared.');
                }
            });
    }

    /**
     * Check connection to a specific URL
     */
    private async checkConnection(url: string, timeout: number): Promise<ConnectionCheckResult> {
        const startTime = Date.now();
        
        return new Promise((resolve) => {
            const parsedUrl = new URL(url);
            const isHttps = parsedUrl.protocol === 'https:';
            const client = isHttps ? https : http;

            const req = client.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: '/',
                method: 'HEAD',
                timeout: timeout,
                headers: {
                    'User-Agent': 'S-cubed-Extension-NetworkCheck'
                }
            }, (res) => {
                const latency = Date.now() - startTime;
                resolve({ success: true, latency });
                req.destroy();
            });

            req.on('error', (error) => {
                const latency = Date.now() - startTime;
                resolve({ success: false, latency, error });
            });

            req.on('timeout', () => {
                const latency = Date.now() - startTime;
                resolve({ 
                    success: false, 
                    latency, 
                    error: new Error('Connection timeout') 
                });
                req.destroy();
            });

            req.end();
        });
    }

    /**
     * Get connection status from check result
     */
    private getConnectionStatus(result: ConnectionCheckResult): 'connected' | 'slow' | 'disconnected' {
        if (!result.success) {
            return 'disconnected';
        }
        
        if (result.latency > 3000) {
            return 'slow';
        }
        
        return 'connected';
    }

    /**
     * Update status bar with current network status
     */
    private updateStatusBar(): void {
        const { githubApi, isOnline } = this.networkStatus;
        
        if (!isOnline) {
            this.statusBarItem.text = '$(globe) Offline Mode';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            this.statusBarItem.tooltip = 'No internet connection. Working in offline mode.';
        } else if (githubApi === 'disconnected') {
            this.statusBarItem.text = '$(globe) GitHub Unavailable';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'Cannot reach GitHub. Some features unavailable.';
        } else if (githubApi === 'slow') {
            this.statusBarItem.text = '$(globe) GitHub Slow';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'GitHub connection is slow. Operations may take longer.';
        } else if (githubApi === 'rate-limited') {
            this.statusBarItem.text = '$(clock) Rate Limited';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
            this.statusBarItem.tooltip = 'GitHub API rate limit reached. Some features temporarily unavailable.';
        } else {
            this.statusBarItem.text = '$(globe) GitHub Connected';
            this.statusBarItem.backgroundColor = undefined;
            this.statusBarItem.tooltip = `GitHub connection active. Latency: ${this.networkStatus.latency || 0}ms`;
        }
        
        this.statusBarItem.command = 'scubed.showNetworkStatus';
        this.statusBarItem.show();
    }

    /**
     * Utility functions
     */
    private getBackoffTime(errorType: string, attempt: number): number {
        const baseDelay = {
            'dns': 1000,
            'timeout': 2000,
            'reset': 1500,
            'unreachable': 3000
        }[errorType] || 1000;

        return Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
    }

    private getMaxAgeForOperation(type: string): number {
        const maxAges = {
            'sync-requirements': 300000, // 5 minutes
            'push-to-github': 600000,    // 10 minutes
            'check-approval': 180000,    // 3 minutes
            'update-status': 60000       // 1 minute
        };
        
        return maxAges[type as keyof typeof maxAges] || 180000;
    }

    private getPriorityValue(priority: string): number {
        return { high: 3, medium: 2, low: 1 }[priority] || 1;
    }

    private isQueueableOperation(type: string): boolean {
        const queueable = [
            'sync-requirements',
            'push-to-github', 
            'check-approval',
            'update-status'
        ];
        return queueable.includes(type);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        if (this.connectionCheckInterval) {
            clearInterval(this.connectionCheckInterval);
        }
        this.statusBarItem.dispose();
    }
}

// Export for testing
export { NetworkService as testableNetworkService };
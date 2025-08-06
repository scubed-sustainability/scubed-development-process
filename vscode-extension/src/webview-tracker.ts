/**
 * Webview Message Tracking for Testing
 * 🟢 GREEN PHASE: Making E2E tests work by enabling webview interaction tracking
 */

import * as vscode from 'vscode';

interface WebviewMessage {
    command: string;
    template?: string;
    timestamp: number;
}

interface WebviewPanelInfo {
    panel: vscode.WebviewPanel;
    messages: WebviewMessage[];
    isOpen: boolean;
}

/**
 * Global webview tracker for testing purposes
 * This allows tests to inspect webview state and messages
 */
class WebviewTracker {
    private static instance: WebviewTracker;
    private activePanels: Map<string, WebviewPanelInfo> = new Map();
    
    public static getInstance(): WebviewTracker {
        if (!WebviewTracker.instance) {
            WebviewTracker.instance = new WebviewTracker();
        }
        return WebviewTracker.instance;
    }

    /**
     * Register a webview panel for tracking
     */
    public trackPanel(panelId: string, panel: vscode.WebviewPanel): void {
        const panelInfo: WebviewPanelInfo = {
            panel,
            messages: [],
            isOpen: true
        };

        // Track panel disposal
        panel.onDidDispose(() => {
            if (this.activePanels.has(panelId)) {
                this.activePanels.get(panelId)!.isOpen = false;
            }
        });

        this.activePanels.set(panelId, panelInfo);
    }

    /**
     * Record a message received from webview
     */
    public recordMessage(panelId: string, message: any): void {
        const panelInfo = this.activePanels.get(panelId);
        if (panelInfo) {
            panelInfo.messages.push({
                command: message.command,
                template: message.template,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Check if a specific webview panel is open
     */
    public isPanelOpen(panelId: string): boolean {
        const panelInfo = this.activePanels.get(panelId);
        return panelInfo ? panelInfo.isOpen : false;
    }

    /**
     * Get messages received by a specific panel
     */
    public getPanelMessages(panelId: string): WebviewMessage[] {
        const panelInfo = this.activePanels.get(panelId);
        return panelInfo ? [...panelInfo.messages] : [];
    }

    /**
     * Get the latest message from a panel
     */
    public getLatestMessage(panelId: string): WebviewMessage | undefined {
        const messages = this.getPanelMessages(panelId);
        return messages.length > 0 ? messages[messages.length - 1] : undefined;
    }

    /**
     * Wait for a specific message to be received
     */
    public async waitForMessage(
        panelId: string, 
        command: string, 
        timeoutMs: number = 5000
    ): Promise<WebviewMessage | undefined> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            const messages = this.getPanelMessages(panelId);
            const matchingMessage = messages.find(msg => msg.command === command);
            if (matchingMessage) {
                return matchingMessage;
            }
            
            // Wait 100ms before checking again
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return undefined;
    }

    /**
     * Clear all tracked data (useful for tests)
     */
    public reset(): void {
        this.activePanels.clear();
    }

    /**
     * Get all currently tracked panels
     */
    public getActivePanels(): string[] {
        return Array.from(this.activePanels.keys()).filter(panelId => 
            this.isPanelOpen(panelId)
        );
    }
}

// Export singleton instance
export const webviewTracker = WebviewTracker.getInstance();

/**
 * Enhanced webview creation function with tracking
 */
export function createTrackedWebviewPanel(
    viewType: string,
    title: string,
    showOptions: vscode.ViewColumn | { viewColumn: vscode.ViewColumn; preserveFocus?: boolean },
    options?: vscode.WebviewPanelOptions & vscode.WebviewOptions,
    trackingId?: string
): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(viewType, title, showOptions, options);
    
    // Use provided trackingId or generate one from viewType
    const panelId = trackingId || viewType;
    webviewTracker.trackPanel(panelId, panel);
    
    return panel;
}
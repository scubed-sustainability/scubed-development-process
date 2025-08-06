import * as vscode from 'vscode';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    private logLevel: LogLevel = LogLevel.INFO;
    private readonly extensionName = 'S-cubed';

    private constructor() {
        this.outputChannel = vscode.window.createOutputChannel(this.extensionName);
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setLogLevel(level: LogLevel): void {
        this.logLevel = level;
        this.info(`Log level set to: ${LogLevel[level]}`);
    }

    public debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    public info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    public warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    public error(message: string, error?: Error, ...args: any[]): void {
        if (error) {
            this.log(LogLevel.ERROR, `${message}: ${error.message}`, error.stack, ...args);
        } else {
            this.log(LogLevel.ERROR, message, ...args);
        }
    }

    private log(level: LogLevel, message: string, ...args: any[]): void {
        if (level < this.logLevel) {
            return;
        }

        const timestamp = new Date().toISOString();
        const levelName = LogLevel[level].padEnd(5);
        const formattedMessage = `[${timestamp}] [${levelName}] ${message}`;
        
        // Log to console for development
        console.log(formattedMessage, ...args);
        
        // Log to VS Code output channel
        this.outputChannel.appendLine(formattedMessage);
        if (args.length > 0) {
            this.outputChannel.appendLine(`  Args: ${JSON.stringify(args, null, 2)}`);
        }

        // Show error messages to user
        if (level === LogLevel.ERROR) {
            vscode.window.showErrorMessage(`${this.extensionName}: ${message}`);
        }
    }

    public show(): void {
        this.outputChannel.show();
    }

    public clear(): void {
        this.outputChannel.clear();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }

    // Convenience methods for common operations
    public logFunctionEntry(functionName: string, ...args: any[]): void {
        this.debug(`→ Entering ${functionName}`, ...args);
    }

    public logFunctionExit(functionName: string, result?: any): void {
        this.debug(`← Exiting ${functionName}`, result ? { result } : undefined);
    }

    public logApiCall(method: string, url: string, data?: any): void {
        this.info(`🌐 API ${method} ${url}`, data ? { data } : undefined);
    }

    public logFileOperation(operation: string, filePath: string): void {
        this.debug(`📁 File ${operation}: ${filePath}`);
    }

    public logUserAction(action: string, details?: any): void {
        this.info(`👤 User action: ${action}`, details ? { details } : undefined);
    }

    public logExtensionEvent(event: string, details?: any): void {
        this.info(`🔌 Extension event: ${event}`, details ? { details } : undefined);
    }
}

// Export singleton instance
export const logger = Logger.getInstance();
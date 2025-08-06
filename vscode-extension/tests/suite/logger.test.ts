import * as assert from 'assert';
import * as vscode from 'vscode';
import { logger, Logger, LogLevel } from '../../src/logger';

suite('Logger Test Suite', () => {
    let testOutputChannel: vscode.OutputChannel;
    let originalConsoleLog: any;
    let logMessages: string[] = [];

    suiteSetup(() => {
        // Capture console.log calls for testing
        originalConsoleLog = console.log;
        console.log = (...args: any[]) => {
            logMessages.push(args.join(' '));
        };
    });

    suiteTeardown(() => {
        // Restore original console.log
        console.log = originalConsoleLog;
        if (testOutputChannel) {
            testOutputChannel.dispose();
        }
    });

    setup(() => {
        // Clear log messages before each test
        logMessages = [];
        logger.clear();
    });

    suite('Logger Singleton', () => {
        test('should return the same instance', () => {
            const logger1 = Logger.getInstance();
            const logger2 = Logger.getInstance();
            assert.strictEqual(logger1, logger2, 'Logger should be a singleton');
        });

        test('should return the exported logger instance', () => {
            const loggerInstance = Logger.getInstance();
            assert.strictEqual(logger, loggerInstance, 'Exported logger should be the singleton instance');
        });
    });

    suite('Log Levels', () => {
        test('should respect log level filtering', () => {
            logger.setLogLevel(LogLevel.WARN);
            
            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');
            
            // Only WARN and ERROR should be logged
            const warningLogs = logMessages.filter(msg => msg.includes('WARN') && msg.includes('Warning message'));
            const errorLogs = logMessages.filter(msg => msg.includes('ERROR') && msg.includes('Error message'));
            const debugLogs = logMessages.filter(msg => msg.includes('DEBUG'));
            const infoLogs = logMessages.filter(msg => msg.includes('INFO') && !msg.includes('Log level set'));
            
            assert.ok(warningLogs.length > 0, 'Warning message should be logged');
            assert.ok(errorLogs.length > 0, 'Error message should be logged');
            assert.strictEqual(debugLogs.length, 0, 'Debug message should not be logged');
            assert.strictEqual(infoLogs.length, 0, 'Info message should not be logged');
            
            // Reset to INFO level for other tests
            logger.setLogLevel(LogLevel.INFO);
        });

        test('should log level changes', () => {
            const initialLength = logMessages.length;
            logger.setLogLevel(LogLevel.DEBUG);
            
            const newLogs = logMessages.slice(initialLength);
            const levelChangeLogs = newLogs.filter(msg => msg.includes('Log level set to: DEBUG'));
            assert.ok(levelChangeLogs.length > 0, 'Log level change should be logged');
        });
    });

    suite('Logging Methods', () => {
        test('should format messages with timestamps and levels', () => {
            logger.info('Test info message');
            
            const infoLogs = logMessages.filter(msg => 
                msg.includes('INFO') && 
                msg.includes('Test info message') &&
                msg.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
            );
            
            assert.ok(infoLogs.length > 0, 'Info message should be formatted with timestamp and level');
        });

        test('should handle error objects', () => {
            const testError = new Error('Test error message');
            logger.error('Test error', testError);
            
            const errorLogs = logMessages.filter(msg => 
                msg.includes('ERROR') && 
                msg.includes('Test error: Test error message')
            );
            
            assert.ok(errorLogs.length > 0, 'Error with Error object should be logged correctly');
        });

        test('should log additional arguments', () => {
            logger.debug('Debug with args', { key: 'value' }, 123);
            
            const debugLogs = logMessages.filter(msg => 
                msg.includes('DEBUG') && 
                msg.includes('Debug with args')
            );
            
            assert.ok(debugLogs.length > 0, 'Debug message with arguments should be logged');
        });
    });

    suite('Convenience Methods', () => {
        test('should log function entry', () => {
            logger.logFunctionEntry('testFunction', 'arg1', 'arg2');
            
            const entryLogs = logMessages.filter(msg => 
                msg.includes('DEBUG') && 
                msg.includes('→ Entering testFunction')
            );
            
            assert.ok(entryLogs.length > 0, 'Function entry should be logged');
        });

        test('should log function exit', () => {
            logger.logFunctionExit('testFunction', { result: 'success' });
            
            const exitLogs = logMessages.filter(msg => 
                msg.includes('DEBUG') && 
                msg.includes('← Exiting testFunction')
            );
            
            assert.ok(exitLogs.length > 0, 'Function exit should be logged');
        });

        test('should log API calls', () => {
            logger.logApiCall('GET', 'https://api.github.com/repos/test/repo', { param: 'value' });
            
            const apiLogs = logMessages.filter(msg => 
                msg.includes('INFO') && 
                msg.includes('🌐 API GET https://api.github.com/repos/test/repo')
            );
            
            assert.ok(apiLogs.length > 0, 'API call should be logged');
        });

        test('should log file operations', () => {
            logger.logFileOperation('read', '/path/to/file.txt');
            
            const fileLogs = logMessages.filter(msg => 
                msg.includes('DEBUG') && 
                msg.includes('📁 File read: /path/to/file.txt')
            );
            
            assert.ok(fileLogs.length > 0, 'File operation should be logged');
        });

        test('should log user actions', () => {
            logger.logUserAction('Template selected', { template: 'ai-development' });
            
            const userLogs = logMessages.filter(msg => 
                msg.includes('INFO') && 
                msg.includes('👤 User action: Template selected')
            );
            
            assert.ok(userLogs.length > 0, 'User action should be logged');
        });

        test('should log extension events', () => {
            logger.logExtensionEvent('Extension activated', { version: '1.0.48' });
            
            const eventLogs = logMessages.filter(msg => 
                msg.includes('INFO') && 
                msg.includes('🔌 Extension event: Extension activated')
            );
            
            assert.ok(eventLogs.length > 0, 'Extension event should be logged');
        });
    });

    suite('Output Channel Integration', () => {
        test('should create and show output channel', () => {
            // This test verifies the logger can show its output channel
            // In a real VS Code environment, this would open the Output panel
            assert.doesNotThrow(() => {
                logger.show();
            }, 'Logger show method should not throw');
        });

        test('should clear output channel', () => {
            logger.info('Test message before clear');
            assert.doesNotThrow(() => {
                logger.clear();
            }, 'Logger clear method should not throw');
        });
    });

    suite('Command Integration', () => {
        test('showLogOutput command should be registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('scubed.showLogOutput'), 'showLogOutput command should be registered');
        });

        test('showLogOutput command should be executable', async () => {
            // This test verifies the command exists and can be executed
            // In actual VS Code, this would open the output channel
            await assert.doesNotReject(async () => {
                await vscode.commands.executeCommand('scubed.showLogOutput');
            }, 'showLogOutput command should be executable');
        });
    });
});
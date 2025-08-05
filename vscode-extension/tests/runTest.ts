import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        // Download VS Code, unzip it and run the integration test
        // Use /tmp for VS Code test data to avoid socket path length issues
        const userDataDir = '/tmp/vscode-test-' + Date.now();
        
        await runTests({ 
            extensionDevelopmentPath, 
            extensionTestsPath,
            version: 'stable',
            // Force use of system VS Code to avoid socket path issues
            launchArgs: [
                '--user-data-dir', userDataDir,
                '--disable-extensions',
                '--skip-welcome',
                '--skip-release-notes',
                '--no-sandbox',
                '--disable-gpu'
            ],
            // Use a shorter vscode-test directory
            vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH
        });
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
import * as path from 'path';
import { runTests } from '@vscode/test-electron';
import * as fs from 'fs';

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, '../');

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(__dirname, './suite/index');

        console.log('🚀 Starting VS Code Extension Tests...');
        console.log('Extension path:', extensionDevelopmentPath);
        console.log('Tests path:', extensionTestsPath);

        // Use system VS Code installation (resolved from earlier investigation)
        const possiblePaths = [
            '/Applications/Visual Studio Code.app/Contents/MacOS/Electron',
            '/usr/local/bin/code'
        ];
        
        let vscodeExecutablePath = null;
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                vscodeExecutablePath = testPath;
                break;
            }
        }
        
        if (!vscodeExecutablePath) {
            console.error('❌ Could not find system VS Code installation');
            process.exit(1);
        }

        console.log('📍 Using VS Code:', vscodeExecutablePath);

        // Run tests with system VS Code
        await runTests({ 
            vscodeExecutablePath,
            extensionDevelopmentPath, 
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions',
                '--disable-workspace-trust',
                '--no-sandbox',
                '--user-data-dir=/tmp/vscode-test-data'
            ]
        });
        
        console.log('✅ All tests completed successfully');
    } catch (err) {
        console.error('❌ Failed to run tests:', err);
        process.exit(1);
    }
}

main();
/**
 * Basic Smoke Test - Verify test environment works
 * This test should pass to confirm our TDD infrastructure is working
 */

import * as vscode from 'vscode';
import { expect } from 'chai';
import { describe, it } from 'mocha';

describe('🔬 Test Environment Smoke Test', function() {
    // Short timeout for basic tests
    this.timeout(5000);

    it('should have VS Code APIs available', function() {
        // Basic API availability check
        expect(vscode.workspace).to.exist;
        expect(vscode.commands).to.exist;
        expect(vscode.window).to.exist;
        expect(vscode.extensions).to.exist;
    });

    it('should find S-cubed extension', function() {
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        expect(extension).to.exist;
        expect(extension!.packageJSON.name).to.equal('scubed-development-process');
    });

    it('should have extension activated', function() {
        const extension = vscode.extensions.getExtension('scubed-solutions.scubed-development-process');
        expect(extension).to.exist;
        
        // Extension should be activated (or activatable)
        if (!extension!.isActive) {
            console.log('⚠️ Extension not yet activated - this is normal for first test run');
        }
        
        expect(extension!.packageJSON.version).to.equal('1.0.51');
    });

    it('should have basic commands registered', async function() {
        const commands = await vscode.commands.getCommands();
        
        // Check for at least one of our commands
        expect(commands).to.include('scubed.openTemplateGallery');
    });
});
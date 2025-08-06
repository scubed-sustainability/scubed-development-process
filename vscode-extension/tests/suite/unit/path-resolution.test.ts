/**
 * TDD Unit Test: Template Path Resolution Logic
 * 🔴 RED PHASE: This test should FAIL initially
 */

import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as path from 'path';
import * as fs from 'fs-extra';
import { resolveTemplatePath, TemplateNotFoundError } from '../../../src/template-utils';

describe('🔴 Template Path Resolution Logic (TDD - RED Phase)', function() {
    
    it('should resolve template paths with proper fallback logic', async function() {
        // 🔴 RED: This test documents the requirement and should FAIL
        
        const templateName = 'requirements-template';
        const mockExtensionPath = '/mock/extension/path';
        
        // Test the path resolution logic that should be extracted from extension.ts
        try {
            // Mock file exists to simulate bundled template exists
            const mockFileExists = async (filePath: string) => filePath.includes('templates/requirements-template');
            
            const resolvedPath = await resolveTemplatePath(templateName, mockExtensionPath, mockFileExists);
            
            // Should try bundled templates first, then fallback to repository
            expect(resolvedPath).to.be.a('string');
            expect(resolvedPath).to.include(templateName);
            
        } catch (error: any) {
            expect.fail(`resolveTemplatePath should work now: ${error.message}`);
        }
    });

    it('should prioritize bundled templates over repository templates', async function() {
        // 🔴 RED: Test prioritization logic
        
        const templateName = 'requirements-template';
        const mockExtensionPath = '/mock/extension/path';
        
        // Mock file system to simulate different template locations
        const mockFileExists = (filePath: string) => {
            // Simulate bundled template exists
            if (filePath.includes('templates/requirements-template')) {
                return true;
            }
            return false;
        };
        
        try {
            const resolvedPath = await resolveTemplatePath(templateName, mockExtensionPath, mockFileExists);
            
            // Should prefer bundled templates (shorter path)
            expect(resolvedPath).to.include('templates/requirements-template');
            expect(resolvedPath).to.not.include('../..');  // Shouldn't use repository fallback
            
        } catch (error: any) {
            expect.fail(`Template prioritization should work: ${error.message}`);
        }
    });

    it('should handle missing templates gracefully', async function() {
        // 🔴 RED: Test error handling
        
        const templateName = 'nonexistent-template';
        const mockExtensionPath = '/mock/extension/path';
        
        // Mock file system where no templates exist
        const mockFileExists = () => false;
        
        try {
            await resolveTemplatePath(templateName, mockExtensionPath, mockFileExists);
            expect.fail('Should have thrown TemplateNotFoundError');
            
        } catch (error: any) {
            // Should be a specific TemplateNotFoundError, not generic error
            expect(error.message).to.include('Template not found');
            expect(error.templateName).to.equal(templateName);
        }
    });
});

// resolveTemplatePath is now imported from template-utils.ts - GREEN phase complete!
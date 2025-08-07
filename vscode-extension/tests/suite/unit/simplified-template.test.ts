/**
 * TDD Test: Simplified Template Structure
 * 🔴 RED PHASE: Test for exactly the required sections only
 */

import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs-extra';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { resolveTemplatePath } from '../../../src/template-utils';

describe('🔴 TDD: Simplified Template Structure (RED Phase)', function() {
    this.timeout(5000);
    
    const templateName = 'requirements-template';
    
    describe('Required Sections Only', function() {
        
        it('🔴 SHOULD FAIL: template should contain exactly 6 required sections', async function() {
            // RED PHASE: This should fail until we simplify the template
            const extensionPath = path.join(__dirname, '..', '..', '..');
            
            try {
                const templatePath = await resolveTemplatePath(templateName, extensionPath);
                const requirementsPath = path.join(templatePath, 'requirements.md');
                const content = await fs.readFile(requirementsPath, 'utf-8');
                
                // Exactly these 6 required sections from GitHub issue requirements
                const requiredSections = [
                    'Requirement Title',
                    'Requirement Summary', 
                    'Business Objectives',
                    'Functional Requirements',
                    'Acceptance Criteria',
                    'Stakeholders'
                ];
                
                // Check each required section exists
                for (const section of requiredSections) {
                    expect(content).to.include(section); // Will fail if not present
                }
                
                // Count total sections (should only be 6)
                const sectionMatches = content.match(/^##\s+/gm) || [];
                expect(sectionMatches.length).to.equal(6); // Will fail if more sections exist
                
                // Should NOT contain these optional sections anymore
                const forbiddenSections = [
                    'Technical Requirements',
                    'Security Requirements', 
                    'User Experience Requirements',
                    'Testing Requirements',
                    'Overview',
                    'Goals',
                    'Timeline'
                ];
                
                for (const forbidden of forbiddenSections) {
                    expect(content).to.not.include(forbidden); // Will fail if these still exist
                }
                
            } catch (error) {
                console.log(`   ⚠️ Template simplification test: ${(error as Error).message}`);
                throw error; // Let the test fail as expected in RED phase
            }
        });
        
        it('🔴 SHOULD FAIL: template should have concise structure without complex guidance', async function() {
            // RED PHASE: Template should be simplified, not verbose
            const extensionPath = path.join(__dirname, '..', '..', '..');
            
            try {
                const templatePath = await resolveTemplatePath(templateName, extensionPath);
                const requirementsPath = path.join(templatePath, 'requirements.md');
                const content = await fs.readFile(requirementsPath, 'utf-8');
                
                // Should be much shorter than current template (current ~5.7KB)
                expect(content.length).to.be.lessThan(2000); // Will fail if still verbose
                
                // Should not contain verbose guidance sections
                expect(content).to.not.include('📝 Template Guide');
                expect(content).to.not.include('What to include:');
                expect(content).to.not.include('**Example:**');
                
                // Should have simple, clean section headers
                expect(content).to.include('# Project Requirements');
                
            } catch (error) {
                console.log(`   ⚠️ Template simplification test: ${(error as Error).message}`);
                throw error;
            }
        });
        
        it('🔴 SHOULD FAIL: README should reflect simplified template', async function() {
            // RED PHASE: README should describe the simplified template
            const extensionPath = path.join(__dirname, '..', '..', '..');
            
            try {
                const templatePath = await resolveTemplatePath(templateName, extensionPath);
                const readmePath = path.join(templatePath, 'README.md');
                const content = await fs.readFile(readmePath, 'utf-8');
                
                // Should mention the 6 required sections
                expect(content).to.include('6 required sections');
                expect(content).to.include('Requirement Title');
                expect(content).to.include('Stakeholders');
                
                // Should not mention optional sections anymore
                expect(content).to.not.include('Optional Sections');
                expect(content).to.not.include('Technical Requirements');
                
            } catch (error) {
                console.log(`   ⚠️ README simplification test: ${(error as Error).message}`);
                throw error;
            }
        });
    });
    
    describe('Template Content Quality', function() {
        
        it('🔴 DESIGN TEST: simplified template should be user-friendly', function() {
            // RED PHASE: Document what the simplified template should achieve
            
            const designGoals = [
                'Only 6 required sections (no optional sections)',
                'Concise section descriptions',
                'Clear placeholder format',
                'Under 2KB total size',
                'Easy to complete in 10-15 minutes'
            ];
            
            // This test documents our simplification goals
            expect(designGoals.length).to.equal(5);
            
            console.log('   📋 Simplified template design goals:');
            designGoals.forEach(goal => console.log(`      - ${goal}`));
        });
    });
});
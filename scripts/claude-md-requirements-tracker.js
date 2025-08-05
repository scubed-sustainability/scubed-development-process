#!/usr/bin/env node

/**
 * CLAUDE.MD REQUIREMENTS TRACKER
 * 
 * This script analyzes CLAUDE.md for requirements and checks if they're
 * implemented in the pre-release validation script.
 * 
 * Usage: node scripts/claude-md-requirements-tracker.js
 * 
 * This helps ensure pre-release-validation.sh stays synchronized
 * with CLAUDE.md requirements.
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(color, ...args) {
    console.log(color + args.join(' ') + colors.reset);
}

function extractRequirements() {
    log(colors.blue, '\n🔍 CLAUDE.MD REQUIREMENTS ANALYSIS\n');
    
    try {
        // Read CLAUDE.md
        const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
        const claudeMdContent = fs.readFileSync(claudeMdPath, 'utf8');
        
        // Read pre-release validation script
        const validationScriptPath = path.join(__dirname, 'pre-release-validation.sh');
        const validationScriptContent = fs.readFileSync(validationScriptPath, 'utf8');
        
        log(colors.bold, '📋 Extracting Requirements from CLAUDE.md...');
        
        // Extract different types of requirements
        const requirements = {
            mandatory: [],
            critical: [],
            commands: [],
            tests: [],
            percentages: [],
            files: []
        };
        
        // Split into lines for analysis
        const lines = claudeMdContent.split('\n');
        
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // Look for MANDATORY, REQUIRED, CRITICAL, MUST patterns
            if (line.match(/\*\*(MANDATORY|REQUIRED|CRITICAL|MUST)\*\*/i)) {
                requirements.mandatory.push({ line: lineNum, text: line.trim() });
            }
            
            // Look for npm commands
            if (line.match(/npm run (test|lint|typecheck|validate-ux|build|compile)/)) {
                const command = line.match(/npm run (\w+)/)[1];
                requirements.commands.push({ line: lineNum, command: command, text: line.trim() });
            }
            
            // Look for percentage requirements
            if (line.match(/(\d+)%/)) {
                const percentage = line.match(/(\d+)%/)[1];
                requirements.percentages.push({ line: lineNum, percentage: percentage, text: line.trim() });
            }
            
            // Look for file requirements
            if (line.match(/\*\*File\*\*:|File.*:|\.md|\.js|\.ts|\.json/)) {
                requirements.files.push({ line: lineNum, text: line.trim() });
            }
            
            // Look for test requirements
            if (line.match(/test|Test|TEST/) && line.match(/must|MUST|should|SHOULD/)) {
                requirements.tests.push({ line: lineNum, text: line.trim() });
            }
        });
        
        // Analyze validation script coverage
        log(colors.bold, '\n🔍 Checking Validation Script Coverage...');
        
        let issues = 0;
        let covered = 0;
        
        // Check mandatory requirements
        log(colors.bold, '\n📋 MANDATORY REQUIREMENTS:');
        requirements.mandatory.forEach(req => {
            log(colors.blue, `  Line ${req.line}: ${req.text}`);
            
            // Check if this requirement is addressed in the validation script
            if (req.text.includes('UX TESTING FRAMEWORK') && validationScriptContent.includes('UX TESTING FRAMEWORK')) {
                log(colors.green, '    ✅ Validated by script');
                covered++;
            } else if (req.text.includes('95% test coverage') && validationScriptContent.includes('95')) {
                log(colors.green, '    ✅ Validated by script');
                covered++;
            } else if (req.text.includes('CLAUDE.md') && validationScriptContent.includes('CLAUDE.md')) {
                log(colors.green, '    ✅ Validated by script');
                covered++;
            } else {
                log(colors.yellow, '    ⚠️  May need validation script update');
                issues++;
            }
        });
        
        // Check command requirements
        log(colors.bold, '\n🔧 COMMAND REQUIREMENTS:');
        requirements.commands.forEach(req => {
            log(colors.blue, `  Line ${req.line}: npm run ${req.command}`);
            
            if (validationScriptContent.includes(`npm run ${req.command}`) || 
                validationScriptContent.includes(req.command)) {
                log(colors.green, '    ✅ Command validated by script');
                covered++;
            } else {
                log(colors.yellow, '    ⚠️  Command not validated by script');
                issues++;
            }
        });
        
        // Check percentage requirements
        log(colors.bold, '\n📊 PERCENTAGE REQUIREMENTS:');
        requirements.percentages.forEach(req => {
            log(colors.blue, `  Line ${req.line}: ${req.percentage}% - ${req.text}`);
            
            if (validationScriptContent.includes(req.percentage)) {
                log(colors.green, '    ✅ Percentage validated by script');
                covered++;
            } else {
                log(colors.yellow, '    ⚠️  Percentage not validated by script');
                issues++;
            }
        });
        
        // Check critical file requirements
        log(colors.bold, '\n📁 CRITICAL FILE REQUIREMENTS:');
        const criticalFiles = [
            'UX-TESTING-PREVENTION-FRAMEWORK.md',
            'PRE-RELEASE-VALIDATION-SYSTEM.md',
            'vscode-extension/scripts/validate-ux.js',
            'vscode-extension/tests/suite/ux-validation.test.ts',
            'scripts/pre-release-validation.sh'
        ];
        
        criticalFiles.forEach(file => {
            log(colors.blue, `  Required: ${file}`);
            
            if (validationScriptContent.includes(file) || validationScriptContent.includes(file.split('/').pop())) {
                log(colors.green, '    ✅ File validated by script');
                covered++;
            } else {
                log(colors.yellow, '    ⚠️  File not validated by script');
                issues++;
            }
        });
        
        // Check for new requirements that might be missing
        log(colors.bold, '\n🔍 POTENTIAL NEW REQUIREMENTS:');
        const newRequirementPatterns = [
            /NEVER.*use/gi,
            /ALWAYS.*run/gi,
            /MUST.*be/gi,
            /REQUIRED.*for/gi,
            /CRITICAL.*that/gi
        ];
        
        let potentialNew = 0;
        lines.forEach((line, index) => {
            newRequirementPatterns.forEach(pattern => {
                if (pattern.test(line) && !validationScriptContent.includes(line.substring(0, 30))) {
                    log(colors.yellow, `  Line ${index + 1}: ${line.trim()}`);
                    potentialNew++;
                }
            });
        });
        
        if (potentialNew === 0) {
            log(colors.green, '  ✅ No obvious new requirements detected');
        }
        
        // Generate recommendations
        log(colors.bold, '\n💡 RECOMMENDATIONS:');
        
        if (issues === 0) {
            log(colors.green, '✅ Validation script appears to cover all CLAUDE.md requirements');
        } else {
            log(colors.yellow, `⚠️  ${issues} potential gaps found between CLAUDE.md and validation script`);
            log(colors.blue, '\n🔧 Suggested Actions:');
            log(colors.blue, '1. Review flagged requirements above');
            log(colors.blue, '2. Update pre-release-validation.sh to validate missing requirements');
            log(colors.blue, '3. Add new validation functions for uncovered commands/percentages');
            log(colors.blue, '4. Test the updated validation script');
            log(colors.blue, '5. Update validation script documentation');
        }
        
        // Summary
        log(colors.bold, '\n📊 SUMMARY:');
        log(colors.green, `✅ Requirements Covered: ${covered}`);
        log(colors.yellow, `⚠️  Potential Issues: ${issues}`);
        log(colors.blue, `📋 Total Requirements Analyzed: ${covered + issues}`);
        
        // Check file timestamps
        const claudeMdStats = fs.statSync(claudeMdPath);
        const scriptStats = fs.statSync(validationScriptPath);
        
        log(colors.bold, '\n⏰ FILE TIMESTAMPS:');
        log(colors.blue, `CLAUDE.md: ${claudeMdStats.mtime.toISOString()}`);
        log(colors.blue, `pre-release-validation.sh: ${scriptStats.mtime.toISOString()}`);
        
        if (claudeMdStats.mtime > scriptStats.mtime) {
            log(colors.yellow, '⚠️  CLAUDE.md is newer than validation script - consider updating script');
        } else {
            log(colors.green, '✅ Validation script is up to date with CLAUDE.md');
        }
        
        // Exit with appropriate code
        if (issues > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
        
    } catch (error) {
        log(colors.red, '❌ Error analyzing CLAUDE.md requirements:', error.message);
        process.exit(1);
    }
}

// Run the analysis
extractRequirements();
#!/usr/bin/env node

/**
 * UX VALIDATION SCRIPT
 * 
 * This script prevents UX bugs by validating package.json configuration
 * before commits. It enforces the critical testing principles from CLAUDE.md.
 * 
 * Run: node scripts/validate-ux.js
 * Exit code 0 = success, 1 = validation failed
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

function validateUX() {
    log(colors.blue, '\n🔍 Running UX Validation...\n');
    
    let errors = 0;
    let warnings = 0;
    
    try {
        // Read package.json
        const packageJsonPath = path.join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const commands = packageJson.contributes?.commands || [];
        const commandPaletteMenus = packageJson.contributes?.menus?.commandPalette || [];
        const views = packageJson.contributes?.views || {};
        const viewContainers = packageJson.contributes?.viewsContainers?.activitybar || [];
        
        // CRITICAL TEST 1: Command Palette Accessibility
        log(colors.bold, '📋 Validating Command Palette Accessibility...');
        
        const menuCommands = new Set(commandPaletteMenus.map(menu => menu.command));
        const missingCommands = commands.filter(cmd => !menuCommands.has(cmd.command));
        
        if (missingCommands.length > 0) {
            log(colors.red, '❌ CRITICAL ERROR: Commands missing from Command Palette menu:');
            missingCommands.forEach(cmd => {
                log(colors.red, `   - ${cmd.command}: "${cmd.title}"`);
            });
            log(colors.red, '\n   Users cannot access these commands via Cmd+Shift+P!');
            log(colors.yellow, '\n   Fix: Add entries to contributes.menus.commandPalette in package.json\n');
            errors++;
        } else {
            log(colors.green, '✅ All commands accessible via Command Palette');
        }
        
        // CRITICAL TEST 2: Menu Entries Reference Valid Commands
        log(colors.bold, '🔗 Validating Menu Entry References...');
        
        const definedCommands = new Set(commands.map(cmd => cmd.command));
        const invalidMenuEntries = commandPaletteMenus.filter(menu => !definedCommands.has(menu.command));
        
        if (invalidMenuEntries.length > 0) {
            log(colors.red, '❌ ERROR: Command Palette entries reference undefined commands:');
            invalidMenuEntries.forEach(menu => {
                log(colors.red, `   - ${menu.command}`);
            });
            errors++;
        } else {
            log(colors.green, '✅ All menu entries reference valid commands');
        }
        
        // CRITICAL TEST 3: Activity Bar Configuration
        log(colors.bold, '📱 Validating Activity Bar Configuration...');
        
        if (viewContainers.length === 0) {
            log(colors.yellow, '⚠️  WARNING: No activity bar containers defined');
            warnings++;
        } else {
            let activityBarOK = true;
            viewContainers.forEach(container => {
                const containerViews = views[container.id] || [];
                if (containerViews.length === 0) {
                    log(colors.red, `❌ ERROR: Activity bar container '${container.id}' has no views`);
                    activityBarOK = false;
                    errors++;
                }
            });
            
            if (activityBarOK) {
                log(colors.green, '✅ Activity bar configuration complete');
            }
        }
        
        // CRITICAL TEST 4: Command Categories and Consistency
        log(colors.bold, '🏷️  Validating Command Categories...');
        
        const categoryIssues = [];
        commands.forEach(cmd => {
            if (!cmd.category) {
                categoryIssues.push(`${cmd.command}: missing category`);
            } else if (cmd.category !== 'S-cubed') {
                categoryIssues.push(`${cmd.command}: inconsistent category '${cmd.category}' (should be 'S-cubed')`);
            }
            
            if (!cmd.title) {
                categoryIssues.push(`${cmd.command}: missing title`);
            }
        });
        
        if (categoryIssues.length > 0) {
            log(colors.red, '❌ ERROR: Command category/title issues:');
            categoryIssues.forEach(issue => {
                log(colors.red, `   - ${issue}`);
            });
            errors++;
        } else {
            log(colors.green, '✅ All commands have proper categories and titles');
        }
        
        // CRITICAL TEST 5: Essential Commands Accessibility
        log(colors.bold, '🚀 Validating Essential Commands...');
        
        const essentialCommands = [
            'scubed.openTemplateGallery', 
            'scubed.checkForUpdates'
        ];
        
        const essentialIssues = [];
        essentialCommands.forEach(essentialCmd => {
            const menuEntry = commandPaletteMenus.find(menu => menu.command === essentialCmd);
            if (!menuEntry) {
                essentialIssues.push(`${essentialCmd}: not in Command Palette`);
            } else if (menuEntry.when && menuEntry.when !== 'true') {
                essentialIssues.push(`${essentialCmd}: requires workspace (when: '${menuEntry.when}') but should be always available`);
            }
        });
        
        if (essentialIssues.length > 0) {
            log(colors.red, '❌ ERROR: Essential command accessibility issues:');
            essentialIssues.forEach(issue => {
                log(colors.red, `   - ${issue}`);
            });
            errors++;
        } else {
            log(colors.green, '✅ All essential commands properly accessible');
        }
        
        // SUMMARY
        log(colors.bold, '\n📊 UX Validation Summary:');
        log(colors.blue, `   Commands defined: ${commands.length}`);
        log(colors.blue, `   Command Palette entries: ${commandPaletteMenus.length}`);
        log(colors.blue, `   Activity bar containers: ${viewContainers.length}`);
        
        if (errors > 0) {
            log(colors.red, `\n❌ VALIDATION FAILED: ${errors} error(s), ${warnings} warning(s)`);
            log(colors.red, '\nUX issues must be fixed before committing!');
            log(colors.yellow, '\nRemember: Test what users see and can do, not just internal configuration.\n');
            process.exit(1);
        } else if (warnings > 0) {
            log(colors.yellow, `\n⚠️  VALIDATION PASSED WITH WARNINGS: ${warnings} warning(s)`);
            log(colors.green, '\nCommit allowed, but consider addressing warnings.\n');
            process.exit(0);
        } else {
            log(colors.green, '\n✅ UX VALIDATION PASSED: All user experience requirements met!\n');
            process.exit(0);
        }
        
    } catch (error) {
        log(colors.red, '❌ VALIDATION ERROR:', error.message);
        process.exit(1);
    }
}

// Run validation
validateUX();
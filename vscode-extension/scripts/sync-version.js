#!/usr/bin/env node
/**
 * Sync version from package.json to template-registry.json
 * This eliminates the need to manually update versions in multiple places
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const registryPath = path.join(__dirname, '../template-registry.json');

try {
    // Read package.json version
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const version = packageJson.version;
    
    console.log(`📦 Found version ${version} in package.json`);
    
    // Read template registry
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    
    // Update all template versions
    let updatedCount = 0;
    registry.templates.forEach(template => {
        if (template.version !== version) {
            template.version = version;
            updatedCount++;
        }
    });
    
    // Update metadata version
    if (registry.metadata.version !== version) {
        registry.metadata.version = version;
        registry.metadata.lastUpdated = new Date().toISOString().split('T')[0];
        updatedCount++;
    }
    
    if (updatedCount > 0) {
        // Write back to file
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
        console.log(`✅ Updated ${updatedCount} version references to ${version}`);
        console.log(`📅 Updated lastUpdated to ${registry.metadata.lastUpdated}`);
    } else {
        console.log(`✅ All versions already match ${version}`);
    }
    
} catch (error) {
    console.error('❌ Error syncing versions:', error.message);
    process.exit(1);
}
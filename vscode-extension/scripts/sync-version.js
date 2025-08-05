#!/usr/bin/env node
/**
 * Sync version from package.json to template-registry.json
 * This eliminates the need to manually update versions in multiple places
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const registryPath = path.join(__dirname, '../template-registry.json');
const readmePath = path.join(__dirname, '../../README.md');

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
    
    // Update README.md version references
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    let readmeUpdated = false;
    
    // Update version references in README examples (like release script examples)
    const versionExampleRegex = /# 1\.0\.\d+ → 1\.0\.\d+/g;
    const currentMajorMinor = version.split('.').slice(0, 2).join('.');
    const exampleVersion = `${currentMajorMinor}.${parseInt(version.split('.')[2]) - 1}`;
    const newVersionExample = `# ${exampleVersion} → ${version}`;
    
    if (versionExampleRegex.test(readmeContent)) {
        readmeContent = readmeContent.replace(versionExampleRegex, newVersionExample);
        readmeUpdated = true;
    }
    
    // Check if current version is already in changelog
    if (!readmeContent.includes(`## ${version}`)) {
        // Add new version entry at the top of changelog (only if it's a new version)
        const changelogStart = readmeContent.indexOf('# 📈 Changelog');
        if (changelogStart !== -1) {
            const insertPos = readmeContent.indexOf('\n\n## ', changelogStart) + 1;
            if (insertPos > 0) {
                const today = new Date().toISOString().split('T')[0];
                const newEntry = `\n## ${version}\n- 🔄 Version sync update - ${today}\n- ✨ Latest features and improvements\n`;
                readmeContent = readmeContent.slice(0, insertPos) + newEntry + readmeContent.slice(insertPos);
                readmeUpdated = true;
            }
        }
    }
    
    if (updatedCount > 0) {
        // Write back to registry file
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
        console.log(`✅ Updated ${updatedCount} version references to ${version}`);
        console.log(`📅 Updated lastUpdated to ${registry.metadata.lastUpdated}`);
    } else {
        console.log(`✅ All versions already match ${version}`);
    }
    
    if (readmeUpdated) {
        fs.writeFileSync(readmePath, readmeContent);
        console.log(`✅ Updated README.md with version ${version}`);
    }
    
} catch (error) {
    console.error('❌ Error syncing versions:', error.message);
    process.exit(1);
}
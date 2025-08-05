#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { isValidGitHubUsername } = require('../../shared/utils/validation-utils');

// Test the issue template parsing with the same logic used in GitHub workflows
function parseStakeholdersFromContent(content) {
    console.log('🔍 Parsing stakeholders from content...\n');
    
    // Split content into lines
    const lines = content.split('\n');
    let stakeholders = [];
    let inStakeholdersSection = false;
    
    console.log('📋 Content preview:');
    console.log(content.substring(0, 200) + '...\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if we're entering stakeholders section - more flexible regex
        if (line.match(/^#{1,3}\s*(👥\s*)?stakeholders?/i)) {
            console.log(`✅ Found stakeholders section at line ${i + 1}: "${line}"`);
            inStakeholdersSection = true;
            continue;
        }
        
        // Check if we're leaving stakeholders section (new header)
        if (inStakeholdersSection && line.startsWith('#')) {
            console.log(`📍 Left stakeholders section at line ${i + 1}: "${line}"`);
            inStakeholdersSection = false;
            continue;
        }
        
        // Extract stakeholders if we're in the section
        if (inStakeholdersSection && line.startsWith('@')) {
            const username = line.substring(1).trim();
            if (username) {
                stakeholders.push(username);
                console.log(`👤 Found stakeholder: @${username}`);
            }
        }
    }
    
    console.log(`\n📊 Summary: Found ${stakeholders.length} stakeholders`);
    return stakeholders;
}

// GitHub username validation is now imported from shared utilities

// Test all issue templates
async function testIssueTemplates() {
    console.log('🧪 TESTING ISSUE TEMPLATE STAKEHOLDER PARSING\n');
    console.log('='.repeat(80));
    
    const templateDir = path.join(__dirname, '../../.github/ISSUE_TEMPLATE');
    const templates = [
        'requirement-markdown.md',
        'requirement-example.md'
    ];
    
    let totalTests = 0;
    let passedTests = 0;
    
    for (const template of templates) {
        totalTests++;
        console.log(`\n📋 Testing template: ${template}`);
        console.log('-'.repeat(50));
        
        try {
            const filePath = path.join(templateDir, template);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Test stakeholder parsing
            const stakeholders = parseStakeholdersFromContent(content);
            
            if (stakeholders.length === 0) {
                console.log('❌ FAILED: No stakeholders found!');
                continue;
            }
            
            // Validate each stakeholder username
            let validStakeholders = 0;
            let invalidStakeholders = [];
            
            for (const stakeholder of stakeholders) {
                if (isValidGitHubUsername(stakeholder)) {
                    validStakeholders++;
                    console.log(`✅ Valid username: @${stakeholder}`);
                } else {
                    invalidStakeholders.push(stakeholder);
                    console.log(`❌ Invalid username: @${stakeholder}`);
                }
            }
            
            // Check for file ending with newline
            const endsWithNewline = content.endsWith('\n');
            console.log(`📝 File ends with newline: ${endsWithNewline ? '✅' : '❌'}`);
            
            // Overall test result
            const testPassed = stakeholders.length > 0 && 
                              invalidStakeholders.length === 0 && 
                              endsWithNewline;
            
            if (testPassed) {
                console.log(`\n🎉 PASSED: Template has ${validStakeholders} valid stakeholders and proper formatting`);
                passedTests++;
            } else {
                console.log(`\n❌ FAILED: Issues found with template`);
                if (invalidStakeholders.length > 0) {
                    console.log(`   - Invalid usernames: ${invalidStakeholders.join(', ')}`);
                }
                if (!endsWithNewline) {
                    console.log(`   - File doesn't end with newline`);
                }
            }
            
        } catch (error) {
            console.log(`❌ ERROR reading template: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 ISSUE TEMPLATE TEST RESULTS: ${passedTests}/${totalTests} templates passed`);
    
    if (passedTests === totalTests) {
        console.log('✅ All issue templates are properly formatted for stakeholder parsing!');
        console.log('🚀 Templates ready for production use.');
    } else {
        console.log('❌ Some templates need fixes before they can be used reliably.');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test templates by creating actual GitHub issues');
    console.log('2. Verify workflow triggers correctly');
    console.log('3. Confirm stakeholder notifications work');
    console.log('='.repeat(80));
}

// Additional test for common edge cases
function testEdgeCases() {
    console.log('\n🔍 TESTING EDGE CASES\n');
    
    const edgeCases = [
        {
            name: 'Multiple stakeholder formats',
            content: `# Test\n\n## Stakeholders\n@user1\n@user-name\n@user123\n`
        },
        {
            name: 'Stakeholders with emoji header',
            content: `# Test\n\n## 👥 Stakeholders\n@avani-shah-s3\n`
        },
        {
            name: 'Empty stakeholders section',
            content: `# Test\n\n## Stakeholders\n\n## Priority\nHigh\n`
        },
        {
            name: 'No newline at end',
            content: `# Test\n\n## Stakeholders\n@user1`
        }
    ];
    
    edgeCases.forEach((testCase, index) => {
        console.log(`📋 Edge Case ${index + 1}: ${testCase.name}`);
        const stakeholders = parseStakeholdersFromContent(testCase.content);
        const endsWithNewline = testCase.content.endsWith('\n');
        console.log(`   Stakeholders found: ${stakeholders.length}`);
        console.log(`   Ends with newline: ${endsWithNewline}`);
        console.log('');
    });
}

// Run all tests
testIssueTemplates().then(() => {
    testEdgeCases();
}).catch(console.error);
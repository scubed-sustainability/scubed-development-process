/**
 * Shared validation utilities for S-cubed development process
 * CommonJS version for Node.js tests
 */

/**
 * Validate GitHub username format according to official GitHub rules
 * @param {string} username - The username to validate (without @ prefix)
 * @returns {boolean} - True if valid GitHub username
 */
function isValidGitHubUsername(username) {
    // GitHub username rules:
    // - 1-39 characters
    // - Can contain alphanumeric characters and hyphens
    // - Cannot start or end with hyphen
    // - Cannot have consecutive hyphens
    const githubUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]){0,37}[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
    
    return githubUsernameRegex.test(username) && 
           !username.includes('--') && // No consecutive hyphens
           username.length >= 1 && 
           username.length <= 39;
}

/**
 * Extract and validate stakeholders from markdown content
 * @param {string} content - Markdown content to parse
 * @returns {Object} - {stakeholders: string[], valid: boolean, errors: string[]}
 */
function extractStakeholdersFromMarkdown(content) {
    const lines = content.split('\n');
    let stakeholders = [];
    let inStakeholdersSection = false;
    let errors = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if we're entering stakeholders section - flexible regex
        if (line.match(/^#{1,3}\s*(👥\s*)?stakeholders?/i)) {
            inStakeholdersSection = true;
            continue;
        }
        
        // Check if we're leaving stakeholders section (new header)
        if (inStakeholdersSection && line.startsWith('#')) {
            inStakeholdersSection = false;
            continue;
        }
        
        // Extract stakeholders if we're in the section
        if (inStakeholdersSection && line.startsWith('@')) {
            const username = line.substring(1).trim();
            if (username) {
                if (isValidGitHubUsername(username)) {
                    stakeholders.push(username);
                } else {
                    errors.push(`Invalid GitHub username: ${username}`);
                }
            }
        }
    }
    
    return {
        stakeholders,
        valid: errors.length === 0,
        errors
    };
}

// CommonJS export for Node.js tests
module.exports = {
    isValidGitHubUsername,
    extractStakeholdersFromMarkdown
};
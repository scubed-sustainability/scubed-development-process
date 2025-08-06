/**
 * Test Data Fixtures for S-cubed Extension TDD
 * Provides consistent test data for reproducible testing
 */

// ============================================================================
// REQUIREMENTS FILE FIXTURES
// ============================================================================

export const VALID_REQUIREMENTS_MD = `# Project Requirements

## 📋 Overview
This is a sample project for testing requirements validation.

## 👥 Stakeholders
- **Project Manager**: john-doe - john@example.com
- **Developer**: jane-smith - jane@example.com
- **Client**: client-user - client@example.com

## 📋 Functional Requirements

### Core Features
1. **User Authentication**
   - Description: Users can log in and log out
   - Acceptance Criteria:
     - [ ] User can create account
     - [ ] User can log in with valid credentials
     - [ ] User can log out

2. **Data Management**
   - Description: Users can manage their data
   - Acceptance Criteria:
     - [ ] User can create new records
     - [ ] User can edit existing records
     - [ ] User can delete records

## 🔧 Technical Requirements
- **Frontend**: React
- **Backend**: Node.js
- **Database**: PostgreSQL

## ✅ Approval
- [ ] john-doe approval
- [ ] jane-smith approval
- [ ] client-user approval
`;

export const INVALID_REQUIREMENTS_MD = `# Incomplete Requirements

This requirements file is missing required sections.

## Some Random Section
Content without proper stakeholder format.
`;

export const REQUIREMENTS_WITH_INVALID_STAKEHOLDERS = `# Project Requirements

## 👥 Stakeholders
- **Project Manager**: invalid@username - john@example.com
- **Developer**: user_with_underscores - jane@example.com
- **Client**: 123numbers - client@example.com

## 📋 Functional Requirements
Basic requirements here.
`;

// ============================================================================
// GITHUB API RESPONSE FIXTURES
// ============================================================================

export const GITHUB_USER_RESPONSE = {
    login: 'john-doe',
    id: 12345,
    name: 'John Doe',
    email: 'john@example.com',
    public_repos: 10,
    followers: 5
};

export const GITHUB_REPO_RESPONSE = {
    id: 67890,
    name: 'test-repo',
    full_name: 'john-doe/test-repo',
    owner: GITHUB_USER_RESPONSE,
    private: false,
    html_url: 'https://github.com/john-doe/test-repo',
    permissions: {
        admin: true,
        push: true,
        pull: true
    }
};

export const GITHUB_ISSUE_RESPONSE = {
    id: 11111,
    number: 123,
    title: 'User Authentication Requirement',
    body: 'Requirement details here',
    state: 'open',
    html_url: 'https://github.com/john-doe/test-repo/issues/123',
    assignees: [GITHUB_USER_RESPONSE],
    labels: [
        { name: 'requirement', color: 'blue' },
        { name: 'pending-approval', color: 'yellow' }
    ]
};

export const GITHUB_RATE_LIMIT_RESPONSE = {
    message: 'API rate limit exceeded',
    documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
};

export const GITHUB_NOT_FOUND_RESPONSE = {
    message: 'Not Found',
    documentation_url: 'https://docs.github.com/rest'
};

// ============================================================================
// EXTENSION CONFIGURATION FIXTURES
// ============================================================================

export const VALID_GITHUB_CONFIG = {
    token: 'ghp_test_token_1234567890',
    owner: 'john-doe',
    repo: 'test-repo',
    enableNotifications: true,
    autoSync: false
};

export const INVALID_GITHUB_CONFIG = {
    token: 'invalid_token_format',
    owner: 'invalid@owner',
    repo: '',
    enableNotifications: true,
    autoSync: false
};

export const MISSING_GITHUB_CONFIG = {
    token: '',
    owner: '',
    repo: '',
    enableNotifications: false,
    autoSync: false
};

// ============================================================================
// TEMPLATE FIXTURES
// ============================================================================

export const REQUIREMENTS_TEMPLATE_STRUCTURE = {
    'README.md': `# Requirements Template

This template provides structure for project requirements.

## Usage
1. Fill out requirements.md
2. Review with stakeholders
3. Get approvals
`,
    'requirements.md': VALID_REQUIREMENTS_MD,
    'scripts/setup.py': `# Setup script for requirements template
print("Setting up requirements template...")
`
};

export const EMPTY_TEMPLATE_STRUCTURE = {
    'README.md': '# Empty Template\n\nThis template has minimal content.'
};

// ============================================================================
// WORKSPACE FIXTURES
// ============================================================================

export const WORKSPACE_FILES = {
    'package.json': JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project for S-cubed extension'
    }, null, 2),
    'README.md': '# Test Project\n\nThis is a test project for S-cubed extension testing.',
    'src/index.js': 'console.log("Hello, world!");',
    '.gitignore': 'node_modules/\n.env\n*.log'
};

export const GIT_REPOSITORY_STRUCTURE = {
    ...WORKSPACE_FILES,
    '.git/config': `[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
[remote "origin"]
	url = https://github.com/john-doe/test-repo.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
`
};

// ============================================================================
// ERROR SCENARIO FIXTURES
// ============================================================================

export const NETWORK_ERROR = new Error('ECONNREFUSED: Connection refused');
export const FILE_PERMISSION_ERROR = new Error('EACCES: permission denied');
export const DISK_FULL_ERROR = new Error('ENOSPC: no space left on device');
export const FILE_NOT_FOUND_ERROR = new Error('ENOENT: no such file or directory');

// ============================================================================
// USER INTERACTION FIXTURES
// ============================================================================

export const DIALOG_RESPONSES = {
    APPLY_TEMPLATE: 'Apply Template',
    CANCEL: 'Cancel',
    YES: 'Yes',
    NO: 'No',
    OK: 'OK'
};

export const INPUT_RESPONSES = {
    VALID_GITHUB_TOKEN: 'ghp_valid_token_1234567890',
    INVALID_GITHUB_TOKEN: 'invalid_token',
    VALID_REPO_OWNER: 'john-doe',
    INVALID_REPO_OWNER: 'invalid@owner',
    VALID_REPO_NAME: 'test-repo',
    EMPTY_INPUT: ''
};

// ============================================================================
// VALIDATION RESULT FIXTURES
// ============================================================================

export const VALIDATION_SUCCESS_RESULT = {
    isValid: true,
    errors: [],
    warnings: [],
    stakeholders: ['john-doe', 'jane-smith', 'client-user'],
    requirements: [
        {
            title: 'User Authentication',
            description: 'Users can log in and log out',
            criteria: [
                'User can create account',
                'User can log in with valid credentials',
                'User can log out'
            ]
        }
    ]
};

export const VALIDATION_ERROR_RESULT = {
    isValid: false,
    errors: [
        'Missing stakeholders section',
        'Invalid GitHub username format: invalid@username'
    ],
    warnings: [
        'Some acceptance criteria are not checked'
    ],
    stakeholders: [],
    requirements: []
};

// ============================================================================
// LOGGING FIXTURES
// ============================================================================

export const LOG_MESSAGES = {
    EXTENSION_ACTIVATED: 'S-cubed Extension v1.0.51 activating...',
    COMMAND_EXECUTED: 'Executing command: scubed.openTemplateGallery',
    TEMPLATE_APPLIED: 'Template requirements-template applied successfully',
    GITHUB_API_CALL: 'Making GitHub API call to /user/repos',
    VALIDATION_STARTED: 'Starting requirements validation',
    ERROR_OCCURRED: 'Error occurred during operation'
};

// ============================================================================
// VS CODE MOCK DATA
// ============================================================================

export const MOCK_EXTENSION_CONTEXT = {
    subscriptions: [],
    extensionPath: '/mock/extension/path',
    globalState: new Map(),
    workspaceState: new Map(),
    extensionUri: { scheme: 'file', path: '/mock/extension/path' },
    environmentVariableCollection: new Map(),
    storageUri: { scheme: 'file', path: '/mock/storage' },
    globalStorageUri: { scheme: 'file', path: '/mock/global-storage' }
};

export const MOCK_WORKSPACE_FOLDER = {
    uri: { scheme: 'file', fsPath: '/mock/workspace' },
    name: 'mock-workspace',
    index: 0
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a requirements file with specified stakeholders
 * @param stakeholders - Array of GitHub usernames
 * @returns Requirements markdown content
 */
export function createRequirementsWithStakeholders(stakeholders: string[]): string {
    const stakeholderLines = stakeholders.map(username => 
        `- **Stakeholder**: ${username} - ${username}@example.com`
    ).join('\n');
    
    return `# Project Requirements

## 👥 Stakeholders
${stakeholderLines}

## 📋 Functional Requirements
- Basic requirement for testing

## ✅ Approval
${stakeholders.map(username => `- [ ] ${username} approval`).join('\n')}
`;
}

/**
 * Creates GitHub API response for repository with specified permissions
 * @param permissions - Permission object
 * @returns GitHub repository response
 */
export function createGitHubRepoResponse(permissions: any) {
    return {
        ...GITHUB_REPO_RESPONSE,
        permissions
    };
}

/**
 * Creates workspace structure with specified files
 * @param files - Object with filename -> content mapping
 * @returns Workspace structure object
 */
export function createWorkspaceStructure(files: Record<string, string>) {
    return {
        ...WORKSPACE_FILES,
        ...files
    };
}
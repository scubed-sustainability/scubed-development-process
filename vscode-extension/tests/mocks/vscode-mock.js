/**
 * VS Code API Mock for Unit Testing
 * Enables testing without VS Code runtime dependency
 */

// Mock VS Code workspace configuration
const mockWorkspaceConfiguration = {
    get: (key, defaultValue) => {
        // Mock configuration values for testing
        const mockConfig = {
            'scubed.planner.planId': 'test-plan-id',
            'scubed.planner.bucketName': 'Sprint Backlog', 
            'scubed.planner.defaultAssignees': ['user1@company.com'],
            'scubed.github.defaultAssignees': ['reviewer1', 'reviewer2'],
            'scubed.github.requiredApprovals': 2,
            'scubed.github.repository': 'https://github.com/test/repo'
        };
        
        return mockConfig[key] !== undefined ? mockConfig[key] : defaultValue;
    }
};

// Mock VS Code workspace
const mockWorkspace = {
    getConfiguration: (section) => mockWorkspaceConfiguration,
    workspaceFolders: [{
        uri: { fsPath: '/mock/workspace' },
        name: 'mock-workspace',
        index: 0
    }]
};

// Mock VS Code window
const mockWindow = {
    showErrorMessage: (...args) => {
        console.log('❌ Mock Error Message:', args.join(' '));
        return Promise.resolve('OK');
    },
    showWarningMessage: (...args) => {
        console.log('⚠️ Mock Warning Message:', args.join(' '));
        return Promise.resolve('OK');
    },
    showInformationMessage: (...args) => {
        console.log('ℹ️ Mock Info Message:', args.join(' '));
        return Promise.resolve('OK');
    },
    showQuickPick: (items, options) => {
        console.log('🔍 Mock Quick Pick:', items.length, 'items');
        return Promise.resolve(items[0]); // Return first item
    },
    showTextDocument: (uri) => {
        console.log('📄 Mock Show Text Document:', uri.toString());
        return Promise.resolve({});
    }
};

// Mock VS Code URI
const mockUri = {
    file: (path) => ({ 
        fsPath: path,
        toString: () => `file://${path}`,
        scheme: 'file',
        path: path
    }),
    parse: (uri) => ({
        toString: () => uri,
        scheme: uri.split(':')[0],
        path: uri.split('://')[1]
    })
};

// Mock VS Code environment
const mockEnv = {
    openExternal: (uri) => {
        console.log('🌐 Mock Open External:', uri.toString());
        return Promise.resolve(true);
    }
};

// Mock VS Code extensions
const mockExtensions = {
    getExtension: (id) => ({
        extensionPath: '/mock/extension/path',
        isActive: true
    })
};

// Mock VS Code TreeItemCollapsibleState
const mockTreeItemCollapsibleState = {
    None: 0,
    Collapsed: 1,
    Expanded: 2
};

// Mock VS Code ThemeIcon
class MockThemeIcon {
    constructor(id) {
        this.id = id;
    }
}

// Complete VS Code mock object
const vscode = {
    workspace: mockWorkspace,
    window: mockWindow,
    Uri: mockUri,
    env: mockEnv,
    extensions: mockExtensions,
    TreeItemCollapsibleState: mockTreeItemCollapsibleState,
    ThemeIcon: MockThemeIcon
};

module.exports = vscode;
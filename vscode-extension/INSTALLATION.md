# S-cubed VS Code Extension Installation Guide

## For Team Distribution

### Option 1: Install from VSIX File (Recommended for Internal Distribution)

1. **Build the Extension**
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   npx vsce package
   ```

2. **Distribute the VSIX File**
   - Share the generated `.vsix` file with your team
   - Team members can install via:
     - VS Code Command Palette: "Extensions: Install from VSIX..."
     - Command line: `code --install-extension scubed-requirements-template-1.0.0.vsix`

### Option 2: Publish to VS Code Marketplace

1. **Setup Publisher Account**
   - Create account at https://marketplace.visualstudio.com/manage
   - Get Personal Access Token from Azure DevOps

2. **Publish Extension**
   ```bash
   npx vsce login your-publisher-name
   npx vsce publish
   ```

### Option 3: Private Extension Gallery

For enterprise environments, consider using a private extension gallery:
- Azure DevOps Extensions
- Open VSX Registry
- Internal package registry

## Development Setup

### Prerequisites
- Node.js 16+ and npm
- VS Code 1.74.0+
- Python 3.7+ (for template scripts)

### Build from Source

1. **Clone and Setup**
   ```bash
   git clone [your-repo]
   cd requirements-template/vscode-extension
   npm install
   ```

2. **Compile TypeScript**
   ```bash
   npm run compile
   # or for development
   npm run watch
   ```

3. **Test Extension**
   - Press F5 in VS Code to launch Extension Development Host
   - Test commands in the development window

4. **Package Extension**
   ```bash
   npm install -g vsce
   vsce package
   ```

## Configuration

### User Settings
Add to VS Code `settings.json`:

```json
{
  "scubed.templateSource": "https://github.com/your-org/requirements-template/archive/refs/heads/main.zip",
  "scubed.defaultProjectPath": "C:\\Projects",
  "scubed.autoInitialize": true,
  "scubed.enableLoopIntegration": true
}
```

### Workspace Settings
For team-wide settings, add to `.vscode/settings.json` in your projects:

```json
{
  "scubed.templateSource": "https://internal-git.company.com/templates/requirements-template/archive/main.zip",
  "scubed.enableLoopIntegration": false
}
```

## Deployment Scripts

### Windows Deployment Script
```powershell
# deploy-extension.ps1
param(
    [string]$VsixPath = "scubed-requirements-template-1.0.0.vsix",
    [string[]]$TargetMachines = @("localhost")
)

foreach ($machine in $TargetMachines) {
    Write-Host "Installing extension on $machine..."
    if ($machine -eq "localhost") {
        code --install-extension $VsixPath
    } else {
        # Remote installation logic
        Copy-Item $VsixPath "\\$machine\c$\temp\"
        Invoke-Command -ComputerName $machine -ScriptBlock {
            code --install-extension "C:\temp\$using:VsixPath"
        }
    }
}
```

### Linux/Mac Deployment Script
```bash
#!/bin/bash
# deploy-extension.sh

VSIX_FILE="scubed-requirements-template-1.0.0.vsix"
INSTALL_USERS=("user1" "user2" "user3")

for user in "${INSTALL_USERS[@]}"; do
    echo "Installing extension for $user..."
    sudo -u $user code --install-extension "$VSIX_FILE"
done
```

## Team Onboarding

### Quick Start for New Team Members

1. **Install Extension**
   - Download VSIX from team shared drive
   - Install via VS Code: `Ctrl+Shift+P` → "Extensions: Install from VSIX..."

2. **Create First Project**
   - `Ctrl+Shift+P` → "S-cubed: Create New Project from Template"
   - Follow the setup wizard

3. **Configure Settings**
   - Set default project path
   - Configure template source if using internal repository

### Training Materials

Create these resources for your team:
- **Demo Video**: Record a 5-minute walkthrough
- **Quick Reference Card**: Print-friendly command cheat sheet  
- **FAQ Document**: Common issues and solutions
- **Best Practices Guide**: Team-specific workflows

## Troubleshooting

### Common Issues

**Extension not appearing in Command Palette**
- Check if extension is enabled: `Ctrl+Shift+X` → Search "S-cubed"
- Reload VS Code window: `Ctrl+Shift+P` → "Developer: Reload Window"

**Template download fails**
- Verify internet connection
- Check template source URL in settings
- Ensure firewall allows VS Code network access

**Python scripts not running**
- Verify Python is installed and in PATH
- Check Python version (3.7+ required)
- Install required dependencies: `pip install -r requirements.txt`

### Support Channels

- **Internal IT**: Extension installation issues
- **Development Team**: Template customization
- **Project Leads**: Workflow and process questions

## Updates and Maintenance

### Updating the Extension
1. Build new version with updated version number
2. Test thoroughly in development environment
3. Package and distribute new VSIX
4. Notify team of new features/changes

### Template Updates
- Extension automatically downloads latest template
- Team can update template source URL in settings
- Consider versioning strategy for breaking changes

---

🚀 **Get your team productive with AI-assisted development!**
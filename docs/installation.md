# 📦 Installation Guide

Complete installation instructions for the S-cubed Development Process toolkit.

## 🚀 **Quick Installation (Recommended)**

### **Prerequisites**
1. **Install VS Code** - [Download from official site](https://code.visualstudio.com/)
2. **Install VS Code CLI** (required for automated installation)
   - Open VS Code → Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Run: **"Shell Command: Install 'code' command in PATH"**
   - Restart your terminal

### **One-Click Installation**
```bash
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash
```

**What this does:**
- Downloads the latest release automatically
- Installs the extension in VS Code
- Verifies installation success
- Shows you how to get started

---

## 🛠️ **Alternative Installation Methods**

### **Method 2: Manual Download & Install**

1. **Download Extension**
   - Visit: [Latest Release](https://github.com/scubed-sustainability/scubed-development-process/releases/latest)
   - Download the `.vsix` file

2. **Install in VS Code**
   - Open VS Code
   - Go to Extensions (`Cmd+Shift+X` / `Ctrl+Shift+X`)
   - Click "..." menu → "Install from VSIX..."
   - Select the downloaded `.vsix` file
   - Restart VS Code

### **Method 3: Build from Source**

#### **Prerequisites for Building**
- **Node.js 16+** and npm
- **Git** for cloning the repository

#### **Build Steps**
```bash
# Clone repository
git clone https://github.com/scubed-sustainability/scubed-development-process.git
cd scubed-development-process

# Build extension
./scripts/build-extension.sh        # Linux/Mac
# OR
.\scripts\build-extension.ps1       # Windows

# Install the generated .vsix file manually in VS Code
```

---

## ✅ **Verify Installation**

### **1. Check Extension is Active**
- Look for **"SCubed"** in the Activity Bar (left sidebar)
- If you don't see it, restart VS Code

### **2. Test Commands**
- Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- Type "S-cubed" - you should see available commands:
  - **S-cubed: Create New Project from Template**
  - **S-cubed: Initialize Current Project**
  - **S-cubed: Generate Discovery Prompts**
  - **S-cubed: Help**

### **3. Create Your First Project**
1. Run: **"S-cubed: Create New Project from Template"**
2. Choose a template
3. Select project location
4. Follow the setup prompts

---

## 🔧 **Configuration**

### **Extension Settings**
Access via VS Code Settings → Extensions → S-cubed:

```json
{
  "scubed.templateSource": "https://github.com/scubed-sustainability/scubed-development-process/archive/refs/heads/main.zip",
  "scubed.defaultProjectPath": "/path/to/your/projects",
  "scubed.autoInitialize": true,
  "scubed.enableLoopIntegration": true,
  "scubed.autoCheckUpdates": true,
  "scubed.githubToken": "" // Optional: for GitHub integration
}
```

### **Setting Descriptions**
- **templateSource** - URL to project templates archive
- **defaultProjectPath** - Default location for new projects
- **autoInitialize** - Run setup tasks automatically after project creation
- **enableLoopIntegration** - Enable Microsoft Loop integration features
- **autoCheckUpdates** - Check for extension updates on VS Code startup
- **githubToken** - Personal access token for GitHub API (optional)

### **GitHub Integration Setup**
For full GitHub workflow features:

1. **Create Personal Access Token**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create token with `repo` and `workflow` permissions
   - Copy the token

2. **Configure in VS Code**
   - Open Settings → Extensions → S-cubed
   - Paste token in "GitHub Token" field
   - OR set environment variable: `GITHUB_TOKEN=your_token`

---

## 🌍 **Team Installation**

### **For Team Leaders**
Share this installation link with your team:
```
https://github.com/scubed-sustainability/scubed-development-process/releases/latest
```

### **Deployment Script for Teams**
Create a team setup script:
```bash
#!/bin/bash
# team-setup.sh
echo "🚀 Setting up S-cubed for the team..."

# Install extension for all team members
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash

# Configure team-specific settings
code --install-extension ms-vscode.vscode-json  # For better config editing
echo "✅ S-cubed setup complete! Check VS Code activity bar for SCubed icon."
```

### **Enterprise Deployment**
For organizations using VS Code in enterprise environments:

1. **Download .vsix file** from releases
2. **Deploy via SCCM/Intune** or similar tools
3. **Configure organization-wide settings** via VS Code settings.json
4. **Set up team templates** in shared repositories

---

## 🔄 **Updates**

### **Automatic Updates** (Default)
- Extension checks for updates on VS Code startup
- Notifications appear when updates are available
- Click "Update" to install latest version

### **Manual Updates**
```bash
# Re-run installation script
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash

# Or download latest .vsix and install manually
```

### **Update Notifications**
The extension will notify you about:
- 🟢 **Minor updates** - Bug fixes and improvements
- 🟡 **Feature updates** - New capabilities
- 🔴 **Breaking changes** - Important compatibility updates

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Extension Not Appearing**
```bash
# Check if VS Code CLI is installed
code --version

# If not found, install VS Code CLI:
# VS Code → Command Palette → "Shell Command: Install 'code' command in PATH"
```

#### **Commands Not Working**
1. **Reload VS Code window**: `Cmd+R` / `Ctrl+R`
2. **Check extension is enabled**: Extensions → Search "S-cubed" → Enable
3. **Open workspace folder**: Some commands require an active workspace

#### **Template Download Fails**
1. **Check internet connection**
2. **Verify templateSource URL** in settings
3. **Check firewall/proxy settings**
4. **Try manual template download**

#### **GitHub Integration Issues**
1. **Verify GitHub token** has correct permissions
2. **Check token expiration** in GitHub settings
3. **Test API access**: Visit https://api.github.com/user with token

### **Log Collection**
For debugging issues:

1. **Open VS Code Developer Tools**
   - Help → Toggle Developer Tools
   - Check Console tab for errors

2. **Check Extension Logs**
   - View → Output → Select "S-cubed" from dropdown

3. **Collect System Info**
   - Help → About → Copy system information

### **Get Help**
- **GitHub Issues**: [Report bugs](https://github.com/scubed-sustainability/scubed-development-process/issues)
- **Documentation**: Check README and docs/ folder
- **Command Help**: Run "S-cubed: Help" command in VS Code

---

## 🎯 **Next Steps**

After installation:

1. **📚 Read the [Quick Start Guide](../README.md#quick-start)**
2. **🎨 Create your first project** using "S-cubed: Create New Project from Template"
3. **⚙️ Configure settings** for your workflow preferences
4. **👥 Set up GitHub integration** for team collaboration
5. **🤖 Explore AI integration** with Claude prompts

---

**You're all set! Start building amazing projects with AI-powered development workflows.** 🚀
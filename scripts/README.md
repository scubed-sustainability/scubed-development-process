# Scripts Directory

This directory contains all build, deployment, and release automation scripts for the S-cubed Development Process project.

## 🚀 Release & Deployment

### `release.sh`
**Fully automated release system** - handles the complete release workflow.
```bash
./scripts/release.sh patch "Fix some bug"     # 1.0.8 → 1.0.9
./scripts/release.sh minor "Add new feature"  # 1.0.8 → 1.1.0
./scripts/release.sh major "Breaking change"  # 1.0.8 → 2.0.0
```

**What it does:**
- Commits any unstaged changes
- Bumps version in package.json
- Syncs version across all files
- Creates git tag
- Pushes to GitHub
- Waits for GitHub Actions to create release

### `quick-release.sh`
**Convenience wrapper** for the release script.
```bash
./scripts/quick-release.sh patch "Commit message"
```

### `deploy-to-server.sh`
**Internal server deployment** for teams with private servers.
```bash
SERVER_HOST="internal.company.com" ./scripts/deploy-to-server.sh
```

## 🔨 Build Scripts

### `build-extension.sh` (Linux/macOS)
**Builds the VS Code extension** from source.
```bash
./scripts/build-extension.sh
```

**What it does:**
- Installs dependencies
- Syncs versions automatically
- Compiles TypeScript
- Packages as .vsix file

### `build-extension.ps1` (Windows)
**Windows version** of the build script.
```powershell
.\scripts\build-extension.ps1
```

## 📦 Installation

### `install-extension.sh`
**One-click installation script** for team distribution.
```bash
curl -sSL https://raw.githubusercontent.com/scubed-sustainability/scubed-development-process/main/scripts/install-extension.sh | bash
```

**What it does:**
- Downloads latest release automatically
- Uninstalls old version
- Installs new version
- Cleans up temporary files

## 🔄 Usage from NPM Scripts

You can also run these via npm scripts from the `vscode-extension` directory:

```bash
cd vscode-extension

# Quick releases
npm run release:patch   # Calls ../scripts/release.sh patch
npm run release:minor   # Calls ../scripts/release.sh minor  
npm run release:major   # Calls ../scripts/release.sh major

# Build
npm run build          # Includes version sync + compile
```

## 📁 Organization Benefits

- **Clean root directory** - No script clutter
- **Logical grouping** - All automation in one place
- **Easy maintenance** - Clear script organization
- **Better documentation** - Centralized script docs
- **Version control** - Proper tracking of script changes

## 🛠️ Development

When adding new scripts:
1. Add to this `scripts/` directory
2. Make executable: `chmod +x scripts/your-script.sh`
3. Update this README with description
4. Add npm script if needed (in `vscode-extension/package.json`)
5. Update main README if user-facing
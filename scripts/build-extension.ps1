# S-cubed Requirements Template - VS Code Extension Builder (Windows)
# This script builds and packages the VS Code extension for distribution

Write-Host "🚀 Building S-cubed Requirements Template Extension" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "vscode-extension")) {
    Write-Host "❌ Error: vscode-extension directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the requirements-template root directory" -ForegroundColor Yellow
    exit 1
}

try {
    # Navigate to extension directory
    Set-Location vscode-extension

    Write-Host "📦 Installing dependencies..." -ForegroundColor Green
    npm install

    Write-Host "🔨 Compiling TypeScript..." -ForegroundColor Green
    npm run compile

    Write-Host "📋 Installing VSCE (VS Code Extension manager)..." -ForegroundColor Green
    try {
        npm install -g vsce
    } catch {
        Write-Host "VSCE already installed or installation failed - continuing..." -ForegroundColor Yellow
    }

    Write-Host "📦 Packaging extension..." -ForegroundColor Green
    vsce package

    # Get the generated VSIX file name
    $vsixFile = Get-ChildItem *.vsix | Select-Object -First 1

    if ($vsixFile) {
        Write-Host ""
        Write-Host "✅ Extension built successfully!" -ForegroundColor Green
        Write-Host "📄 Package: $($vsixFile.Name)" -ForegroundColor White
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Cyan
        Write-Host "1. Distribute $($vsixFile.Name) to your team" -ForegroundColor White
        Write-Host "2. Install via VS Code: Extensions → Install from VSIX..." -ForegroundColor White
        Write-Host "3. See INSTALLATION.md for detailed deployment instructions" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Ready for team distribution!" -ForegroundColor Green
    } else {
        Write-Host "❌ Error: No VSIX file was generated" -ForegroundColor Red
        exit 1
    }

} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Return to original directory
    Set-Location ..
}
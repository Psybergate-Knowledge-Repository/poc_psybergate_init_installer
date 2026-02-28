#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

Write-Host ""
Write-Host "  Psybergate Initialiser - Setup" -ForegroundColor DarkYellow
Write-Host "  ================================" -ForegroundColor DarkYellow
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed (v18+ required)." -ForegroundColor Red
    Write-Host "Install it from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed." -ForegroundColor Red
    Write-Host "Install Node.js (includes npm) from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Configure npm to use GitHub Packages for @psybergate-knowledge-repository scope
$NPMRC = "$env:USERPROFILE\.npmrc"

# Remove any existing entries for this scope/registry to avoid duplicates
if (Test-Path $NPMRC) {
    $lines = Get-Content $NPMRC | Where-Object {
        $_ -notmatch "npm\.pkg\.github\.com" -and
        $_ -notmatch "@psybergate-knowledge-repository:registry"
    }
    Set-Content $NPMRC $lines
}

Add-Content $NPMRC "//npm.pkg.github.com/:_authToken=$Token"
Add-Content $NPMRC "@psybergate-knowledge-repository:registry=https://npm.pkg.github.com"

Write-Host "npm configured for GitHub Packages." -ForegroundColor Green
Write-Host ""

# Check Spring Boot CLI
if (Get-Command spring -ErrorAction SilentlyContinue) {
    $springVersion = spring --version
    Write-Host "Spring Boot CLI found: $springVersion" -ForegroundColor Green
} else {
    Write-Host "Warning: Spring Boot CLI is not installed (spring command not found)." -ForegroundColor Yellow
    Write-Host "Install it before running the generator: https://docs.spring.io/spring-boot/docs/current/reference/html/cli.html" -ForegroundColor Yellow
}
Write-Host ""

# Install the CLI
Write-Host "Installing @psybergate-knowledge-repository/initialiser..." -ForegroundColor Cyan
npm install -g @psybergate-knowledge-repository/initialiser

Write-Host ""
Write-Host "Done! Run 'psybergate-init' to create a new project." -ForegroundColor Green
Write-Host ""

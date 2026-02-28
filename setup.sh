#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "  Psybergate Initialiser — Setup"
echo "  ================================"
echo ""

# Accept token as argument or prompt for it
TOKEN="${1:-}"
if [ -z "$TOKEN" ]; then
  read -rsp "Enter your Psybergate install token: " TOKEN
  echo ""
fi

if [ -z "$TOKEN" ]; then
  echo "Error: No token provided."
  exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed (v18+ required)."
  echo "Install it from: https://nodejs.org"
  exit 1
fi

# Configure npm to use GitHub Packages for @psybergate-knowledge-repository scope
NPMRC="$HOME/.npmrc"

# Remove any existing entries for this scope/registry to avoid duplicates
if [ -f "$NPMRC" ]; then
  grep -v "npm.pkg.github.com" "$NPMRC" > "$NPMRC.tmp" 2>/dev/null || true
  grep -v "@psybergate-knowledge-repository:registry" "$NPMRC.tmp" > "$NPMRC" 2>/dev/null || true
  rm -f "$NPMRC.tmp"
fi

echo "//npm.pkg.github.com/:_authToken=$TOKEN" >> "$NPMRC"
echo "@psybergate-knowledge-repository:registry=https://npm.pkg.github.com" >> "$NPMRC"

echo ""
echo "npm configured for GitHub Packages."
echo ""

# Check Spring Boot CLI
if command -v spring &> /dev/null; then
  echo "Spring Boot CLI found: $(spring --version)"
else
  echo "Warning: Spring Boot CLI is not installed (spring command not found)."
  echo "Install it before running the generator: https://docs.spring.io/spring-boot/docs/current/reference/html/cli.html"
fi
echo ""

# Install the CLI
echo "Installing @psybergate-knowledge-repository/initialiser..."
npm install -g @psybergate-knowledge-repository/initialiser

echo ""
echo "Done! Run 'psybergate-init' to create a new project."
echo ""

#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const token = process.argv[2];

if (!token) {
  console.error('\nError: Install token required.');
  console.error('Usage: npx psybergate-install <token>\n');
  process.exit(1);
}

console.log('\n  Psybergate Initialiser - Setup');
console.log('  ================================\n');

// Check Node version
const nodeVersion = parseInt(process.versions.node.split('.')[0]);
if (nodeVersion < 18) {
  console.error(`Error: Node.js 18+ required (you have ${process.versions.node}).`);
  console.error('Install it from: https://nodejs.org');
  process.exit(1);
}

// Configure ~/.npmrc
const npmrc = join(homedir(), '.npmrc');
let lines = [];

if (existsSync(npmrc)) {
  lines = readFileSync(npmrc, 'utf8')
    .split('\n')
    .filter(l => !l.includes('npm.pkg.github.com') && !l.includes('@psybergate-knowledge-repository:registry'));
}

lines.push(`//npm.pkg.github.com/:_authToken=${token}`);
lines.push('@psybergate-knowledge-repository:registry=https://npm.pkg.github.com');
writeFileSync(npmrc, lines.join('\n') + '\n');

console.log('npm configured for GitHub Packages.');

// Check Spring Boot CLI
try {
  const version = execSync('spring --version', { stdio: 'pipe' }).toString().trim();
  console.log(`Spring Boot CLI found: ${version}`);
} catch {
  console.warn('Warning: Spring Boot CLI not found (optional).');
  console.warn('Install from: https://docs.spring.io/spring-boot/docs/current/reference/html/cli.html');
}

// Install the CLI
console.log('\nInstalling @psybergate-knowledge-repository/initialiser...');
execSync('npm install -g @psybergate-knowledge-repository/initialiser', { stdio: 'inherit' });

console.log("\nDone! Run 'psybergate-init' to create a new project.\n");

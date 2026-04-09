#!/usr/bin/env node

import https from 'https';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

const ORANGE = '\x1b[38;2;255;165;0m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BOLD = '\x1b[1m';

const GITHUB_CLIENT_ID = 'Ov23lil2axwgTdsRN1BX';
const GITHUB_SCOPE = 'read:packages';
const CREDENTIALS_PATH = join(homedir(), '.psybergate', 'credentials.json');

// -- HTTP helpers -------------------------------------------------------------

function post(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
          Accept: 'application/json',
          ...headers,
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8'))));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      { hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: 'GET', headers },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8'))));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openBrowser(url) {
  const [cmd, ...args] =
    process.platform === 'win32'
      ? ['cmd', '/c', 'start', '', url]
      : process.platform === 'darwin'
        ? ['open', url]
        : ['xdg-open', url];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref();
}

// -- Credential cache ---------------------------------------------------------

function saveCredentials(username, token) {
  try {
    mkdirSync(join(homedir(), '.psybergate'), { recursive: true });
    writeFileSync(CREDENTIALS_PATH, JSON.stringify({ username, token }, null, 2) + '\n', { mode: 0o600 });
  } catch {
    // best-effort
  }
}

// -- Device flow --------------------------------------------------------------

function renderBox(lines) {
  process.stdout.write('\x1b[2J\x1b[H');
  process.stdout.write(`${ORANGE}PSYBERGATE INSTALLER - GITHUB AUTH${RESET}\n\n`);
  process.stdout.write(`${ORANGE}+- Device Flow${RESET}\n`);
  for (const line of lines) process.stdout.write(`|  ${line}\n`);
  process.stdout.write(`${ORANGE}+${RESET}\n`);
}

async function runDeviceFlow() {
  renderBox([`${DIM}Requesting device code from GitHub...${RESET}`]);

  const deviceCode = await post(
    'https://github.com/login/device/code',
    `client_id=${GITHUB_CLIENT_ID}&scope=${encodeURIComponent(GITHUB_SCOPE)}`,
  );

  if (deviceCode.error) {
    throw new Error(`Device code request failed: ${deviceCode.error_description ?? deviceCode.error}`);
  }

  openBrowser('https://github.com/login/device');

  let interval = deviceCode.interval ?? 5;
  const expiresAt = Date.now() + deviceCode.expires_in * 1000;

  renderBox([
    `Open:  ${ORANGE}${deviceCode.verification_uri}${RESET}`,
    `Code:  ${ORANGE}${deviceCode.user_code}${RESET}`,
    ``,
    `${DIM}Your browser should open automatically.${RESET}`,
    `${DIM}Waiting for you to authorise...${RESET}`,
  ]);

  while (Date.now() < expiresAt) {
    await sleep(interval * 1000);

    const poll = await post(
      'https://github.com/login/oauth/access_token',
      [
        `client_id=${GITHUB_CLIENT_ID}`,
        `device_code=${deviceCode.device_code}`,
        'grant_type=urn:ietf:params:oauth:grant-type:device_code',
      ].join('&'),
    );

    if (poll.access_token) {
      renderBox([
        `Open:  ${ORANGE}${deviceCode.verification_uri}${RESET}`,
        `Code:  ${ORANGE}${deviceCode.user_code}${RESET}`,
        ``,
        `${GREEN}Authorised! Resolving username...${RESET}`,
      ]);

      const user = await get('https://api.github.com/user', {
        Authorization: `Bearer ${poll.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'psybergate-installer',
      });

      renderBox([
        `Open:  ${ORANGE}${deviceCode.verification_uri}${RESET}`,
        `Code:  ${ORANGE}${deviceCode.user_code}${RESET}`,
        ``,
        `${GREEN}Authorised as ${user.login}${RESET}`,
      ]);

      await sleep(800);
      saveCredentials(user.login, poll.access_token);
      return poll.access_token;
    }

    if (poll.error === 'slow_down') { interval = (poll.interval ?? interval) + 5; continue; }
    if (poll.error === 'authorization_pending') continue;
    if (poll.error === 'expired_token') {
      renderBox([`${RED}Device code expired. Please re-run and try again.${RESET}`]);
      throw new Error('GitHub device code expired');
    }

    renderBox([`${RED}Auth error: ${poll.error_description ?? poll.error}${RESET}`]);
    throw new Error(`GitHub auth failed: ${poll.error}`);
  }

  renderBox([`${RED}Timed out waiting for authorisation.${RESET}`]);
  throw new Error('GitHub device flow timed out');
}

// -- Main ---------------------------------------------------------------------

process.stdout.write('\x1b[2J\x1b[H');
console.log(`${ORANGE}${BOLD}  Psybergate Installer${RESET}`);
console.log(`${DIM}  Authenticating with GitHub to configure npm for GitHub Packages...${RESET}\n`);

const nodeVersion = parseInt(process.versions.node.split('.')[0]);
if (nodeVersion < 18) {
  console.error(`${RED}Error: Node.js 18+ required (you have ${process.versions.node}).${RESET}`);
  console.error('Install it from: https://nodejs.org');
  process.exit(1);
}

let token;
try {
  token = await runDeviceFlow();
} catch (err) {
  console.error(`\n${RED}Auth failed: ${err.message}${RESET}`);
  process.exit(1);
}

process.stdout.write('\x1b[2J\x1b[H');
console.log(`${ORANGE}${BOLD}  Psybergate Installer${RESET}\n`);

const npmrc = join(homedir(), '.npmrc');
let lines = [];
if (existsSync(npmrc)) {
  lines = readFileSync(npmrc, 'utf8')
    .split('\n')
    .filter((l) => !l.includes('npm.pkg.github.com') && !l.includes('@psybergate-knowledge-repository:registry'));
}
lines.push(`//npm.pkg.github.com/:_authToken=${token}`);
lines.push('@psybergate-knowledge-repository:registry=https://npm.pkg.github.com');
writeFileSync(npmrc, lines.join('\n') + '\n');

console.log(`${GREEN}npm configured for GitHub Packages${RESET}`);
console.log(`${GREEN}Credentials saved to ~/.psybergate/credentials.json${RESET}`);

const PACKAGE = '@psybergate-knowledge-repository/initialiser@latest';

console.log(`\n${DIM}Installing ${PACKAGE} (stable channel)...${RESET}`);
try {
  // --force skips cleanup of the old package directory, avoiding EPERM errors
  // on Windows when files from the previous install are still locked.
  execSync(`npm install -g ${PACKAGE} --force`, { stdio: 'inherit' });
} catch {
  console.error(`\n${RED}Installation failed.${RESET}`);
  console.error(`Try running manually:\n  npm install -g ${PACKAGE} --force`);
  console.error(`If that still fails, close any terminals that may be using psybergate-init and try again.`);
  process.exit(1);
}

console.log(`\n${GREEN}${BOLD}Done!${RESET} Run ${ORANGE}psybergate-init${RESET} to create a new project.\n`);

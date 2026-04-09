# Psybergate Installer

Sets up your machine to use the Psybergate Project Initialiser CLI.

## Usage

```bash
npx github:Psybergate-Knowledge-Repository/poc_psybergate_init_installer
```

A browser window will open and ask you to authorise with GitHub. Once authorised, the installer will:

1. Configure `~/.npmrc` for GitHub Packages
2. Install `psybergate-init` globally

Then run:

```bash
psybergate-init
```

## Requirements

- Node.js 18+
- A GitHub account that is a member of the Psybergate organisation

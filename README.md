# Psybergate Initialiser — Install Scripts

Public install scripts for the **Psybergate Project Initialiser** — an internal CLI tool that scaffolds production-ready full-stack projects with Angular (Nx) + Spring Boot, complete with auth, PostgreSQL, and Psybergate conventions baked in.

---

> **This is the install/distribution repo only.**
> For full documentation, usage instructions, and your install token, see the private repo:
> **[poc_psybergate_project_initialiser](https://github.com/Psybergate-Knowledge-Repository/poc_psybergate_project_initialiser)**
> *(Psybergate org members only)*

---

## Install

### Windows (PowerShell)

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/Psybergate-Knowledge-Repository/poc_psybergate_init_installer/main/setup.ps1))) -Token "YOUR_INSTALL_TOKEN"
```

### macOS / Linux / Git Bash

```bash
bash <(curl -s https://raw.githubusercontent.com/Psybergate-Knowledge-Repository/poc_psybergate_init_installer/main/setup.sh) YOUR_INSTALL_TOKEN
```

> Your install token is available in the private repo README.

---

Once installed, run:

```bash
psybergate-init
```

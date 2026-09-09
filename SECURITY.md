# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 4.0.x   | ✅ Active support  |
| < 4.0   | ❌ No longer supported |

## Reporting a Vulnerability

If you discover a security vulnerability in NexoAccManager, please report it responsibly.

### How to report

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. Email: **security@nexoaccmanager.dev** (or send a private [GitHub Security Advisory](https://github.com/Nxxo31/NexoAccManager/security/advisories/new))
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 7 days
- **Fix or mitigation**: depends on severity (critical: 7 days, high: 14 days, medium: 30 days)

### Security measures in NexoAccManager

- **AES-256-GCM encryption** — All cookies encrypted with hardware-derived keys
- **Sandbox active** — `contextIsolation: true` + `sandbox: true` + `nodeIntegration: false`
- **Zero network egress** — No servers, no cloud, no telemetry, no tracking
- **IPC whitelist** — Only explicit `contextBridge` channels are exposed to the renderer
- **Branded type invariant** — `EncryptedString` branded type prevents plaintext leaks at compile time
- **CSP enforced** — Content Security Policy restricts connections to `*.roblox.com` only

## Scope

The following are **in scope** for vulnerability reports:
- Cookie or credential exposure
- IPC boundary bypass
- Renderer→main process privilege escalation
- Local data leaks (SQLite database contents)

The following are **out of scope**:
- Roblox's own API vulnerabilities (report to Roblox)
- Social engineering attacks
- Physical access to the user's device

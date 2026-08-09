# Migration Guide — v4.x → v5.0.0

> **Audience:** developers and integrators upgrading a NexoAccManager (NAM)
> checkout or downstream fork from the v4.x line to v5.0.0.
> **Scope:** three breaking-ish changes — i18n consolidation, `account:control`
> WebSocket-only transport, and the SQLite schema status. Each section includes
> the why, the before/after, and what to do if you have local modifications.

NAM follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html). The
major bump to 5.0.0 is driven by the **removal** of the `i18next` /
`react-i18next` stack (a public API surface that downstream forks may have
extended) and the **WS-only** contract for `account:control`. End-user data
(SQLite store, encrypted credentials, themes, key bindings) is **not** affected
and requires no migration.

---

## 1. i18n consolidation — custom `t()` is the sole system

### What changed and why

Prior to v5.0.0 the repository carried **two parallel** translation systems:

| System | Location | Status in v4.x |
|--------|----------|----------------|
| Custom flat resolver | `src/config/i18n.ts` — `t(key, vars)` | Live; used by every renderer component. **255 leaf keys × 3 locales** (ES/EN/PT) with ES fallback. |
| `i18next` + `react-i18next` | `src/application/i18n.ts`, `src/application/locales/{es,en,pt}.json`, `import './i18n'` in `App.tsx` | Dead code. Initialized by `App.tsx`, but **zero** `useTranslation()` / `i18n.t()` callers existed in the codebase. Per-locale JSON carried 102 leaf keys, only 44 of which overlapped with the live system. |

The duplicate stack inflated the bundle, drifted from the live keys, and made
the documented key count unreliable (the long-standing “247 keys × 3 locales”
claim was wrong on both axes — the live system has 255 leaf keys, the dead one
had 102). v5.0.0 keeps the **custom `t(key, vars)`** resolver as the single
source of truth and deletes the `i18next`/`react-i18next` stack entirely.

### Before (v4.x)

```ts
// src/application/App.tsx — side-effect initializer for the dead system
import './i18n'; // no-op at runtime (no consumers), but kept bundle weight

// src/application/i18n.ts — initialized i18next with the JSON resources
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';
import pt from './locales/pt.json';
i18n.use(initReactI18next).init({ resources: { es: es, en: en, pt: pt }, fallbackLng: 'es' });

// src/application/locales/es.json — duplicate translations
{ "accounts": { "add": "Añadir cuenta", "delete": "Eliminar" } }
```

### After (v5.0.0)

```ts
// src/application/App.tsx — the side-effect import is gone; the custom
// resolver is imported where it is used (component-local):
import { t } from '../config/i18n';

// src/config/i18n.ts — sole system: flat keys, single-brace placeholders, ES fallback
export function t(key: string, vars?: Record<string, string | number>): string {
  // resolves against translations.es / translations.en / translations.pt
  // substitutes {name} / {count} / {current} / {max} / {fps} / {region}
}
```

The placeholder syntax is **single-brace** (`{name}`), not `i18next`'s
double-brace (`{{name}}`). All 9 interpolation call sites verified against the
live templates (see [i18n interpolation audit](#3-i18n-interpolation-audit)
below; 0 missing keys).

### Migration steps for downstream forks

1. `git merge` / `git rebase` v5.0.0. The deletion of `src/application/i18n.ts`,
   `src/application/locales/*.json`, and the `import './i18n'` line in
   `App.tsx` will surface as straightforward conflicts — accept the v5.0.0 side
   (removals) unless you had a *real* `useTranslation()` caller, in which case
   port that caller to `import { t } from '../../config/i18n'`.
2. Remove `i18next` and `react-i18next` from `package.json`:
   ```bash
   npm uninstall i18next react-i18next
   ```
3. If you added custom keys to `application/locales/*.json`, port them to the
   matching `translations.<locale>` object in `src/config/i18n.ts`. Use
   single-brace placeholders inside the string value:
   ```ts
   // wrong (i18next style)
   friends: { online: '{{count}} amigos en línea' }
   // right (NAM custom style)
   'friends.onlineCount': '{count} amigos en línea',
   ```
4. Audit: `grep -rn "useTranslation\|i18n.t\|i18next\|react-i18next" src` should
   return zero hits after the migration.
5. Verify the build: `npm run build` exit 0 and LSP `live_diagnostics` 0
   errors on any file that previously imported the dead system.

### End-user data

No end-user action. The on-disk `language` preference in the SQLite `settings`
table (values `es` / `en` / `pt`) is read unchanged by the custom resolver.

---

## 2. `account:control` — WebSocket-only transport

### What changed and why

`account:control` (launch / kill / status / refresh-cookie for a Roblox
account driven by the desktop app) went through two transports:

- **v4.0.x — v4.0.8:** an HTTP bridge (`LocalApiService`) hit the control
  surface over `http://127.0.0.1`. A *smart-polling fallback* masked WS failures
  by falling back to HTTP polling when the WebSocket was unavailable.
- **v4.2.0:** the HTTP smart-polling fallback was removed and a persistent
  WebSocket became the canonical transport (`ControlWebSocketService`).
- **v5.0.0:** the WebSocket now also **buffers and resends** pending commands
  on reconnect, so a transient socket drop no longer silently loses a launch
  / kill. The control surface is now **WS-only**.

### Before (v4.0.x — v4.0.8)

```ts
// ControlWebSocketService mixed transports; HTTP bridge as fallback
if (ws.readyState !== WebSocket.OPEN) {
  // smart-polling fallback → http://127.0.0.1:<port>/control
  await localApi.post('/control', payload);
}
// a command issued while the socket was down was silently lost
```

### After (v5.0.0)

```ts
// src/infrastructure/external/ControlWebSocketService.ts
// ws://127.0.0.1:<port>/control is the only transport.
// Smart-polling fallback and http:// paths are gone (grep: 0 hits).
//
// On send():
//   - if socket is OPEN  → send immediately
//   - if socket is closed → push the command onto a pending buffer
// On 'open' (reconnect):
//   - drain the pending buffer in order, then resume normal operation
```

### Migration steps for downstream forks

1. If you forked `ControlWebSocketService` and re-added the HTTP smart-polling
   fallback, remove it; the WS path is now authoritative.
2. Any downstream caller that previously dispatched commands through
   `LocalApiService` for `account:control` must be migrated to the
   `controlWs.send(...)` path. The renderer surface (`window.api.account.*`)
   is unchanged — the IPC contract on the renderer side is identical.
3. The new resend-on-reconnect buffer is best-effort and ordered: commands are
   replayed in the order they were enqueued. If your fork added an idempotency
   key, keep it; the buffer does not deduplicate.

### End-user data

No end-user action. The control port is loopback (`127.0.0.1`); cookie flow
through the WS payload is unchanged (cookies never leave the main process).

---

## 3. SQLite schema — no migration required

### What changed and why

**Nothing.** The on-disk schema for v5.0.0 is byte-identical to v4.0.0 and
later. The four tables created by `src/infrastructure/database/DatabaseManager`
are created with `CREATE TABLE IF NOT EXISTS` and no `ALTER TABLE` statements
were added between v4.0.0 and v5.0.0.

```sql
-- schema initialization, unchanged since v4.0.0
CREATE TABLE IF NOT EXISTS accounts        (...);  -- credentials, AES-256-GCM
CREATE TABLE IF NOT EXISTS recent_games    (...);
CREATE TABLE IF NOT EXISTS favorite_games  (...);
CREATE TABLE IF NOT EXISTS settings        (...);  -- key/value: language, theme, etc.
```

### Migration steps for downstream forks

1. **None required.** Open the existing `userData/nexoaccmanager.db`; the
   `IF NOT EXISTS` guard will skip creation for tables that already exist.
2. The `pragmas` block (`journal_mode = WAL`, `foreign_keys = ON`) is also
   unchanged.

### End-user data

Encrypted credentials (`accounts` rows) are read back with the same
`EncryptedString` branded-type contract in `CryptoService`; no re-encryption
pass is needed.

---

## 4. i18n interpolation audit (v5.0.0 verification)

The task explicitly asked to confirm no missing keys in the five components
that use interpolation. Programmatic audit of `src/config/i18n.ts` against
`t()` call sites in the five files returned **0 missing keys** — 124 total
`t()` calls, 9 of which use interpolation. The verified keys and their live
templates (single-brace placeholders):

| Component | t() call site | Template in `config/i18n.ts` |
|---|---|---|
| `AccountsView.tsx` | `t('accounts.launched', { name: selected.username })` | `'{name} lanzado'` |
| `AccountsView.tsx` | `t('accounts.deleteConfirmBody', { name: account.username })` | `'¿Estás seguro de que quieres eliminar la cuenta {name}?\\nEsta acción no se puede deshacer.'` |
| `ServersView.tsx` | `t('servers.count', { count: servers.length })` | `'{count} servidores'` |
| `ServersView.tsx` | `t('servers.region', { region: region.region })` | `'Región: {region}'` |
| `ServersView.tsx` | `t('servers.players', { current: ..., max: ... })` | `'{current}/{max} jugadores'` |
| `ServersView.tsx` | `t('servers.fps', { fps: String(s.fps) })` | `'{fps} FPS'` |
| `FriendsView.tsx` | `t('friends.onlineCount', { count: ... })` | `'{count} amigos en línea'` |
| `GamesView.tsx` | `t('games.count', { count: results.length })` | `'{count} juegos'` |
| `AddAccountModal.tsx` | `t('modal.accountsAdded', { count: String(added) })` | `'{count} cuentas agregadas'` |

Every placeholder (`{name}`, `{count}`, `{current}`, `{max}`, `{fps}`,
`{region}`) has a matching key passed in the `vars` argument — no orphan keys,
no missing templates.

---

## Quick checklist for the upgrade

- [ ] `git merge v5.0.0` (or rebase onto the v5.0.0 tag).
- [ ] `npm install` — drops `i18next` / `react-i18next` from the install tree.
- [ ] `grep -rn "useTranslation\|i18n.t\|i18next\|react-i18next" src` → 0 hits.
- [ ] `grep -rn "smart-polling\|localApi.*\/control\|http://.*control" src` → 0 hits.
- [ ] Remove any custom `application/locales/*.json` keys, port them to
      `src/config/i18n.ts` with single-brace placeholders.
- [ ] Re-point any `LocalApiService` `account:control` caller at the WS service.
- [ ] Open the existing SQLite DB once to confirm `IF NOT EXISTS` re-attaches
      without errors.
- [ ] `npm run build` exit 0; LSP `live_diagnostics` 0 errors on modified files.
- [ ] `gitleaks detect` on the staged diff → 0 findings.

---

*Generated as part of the NexoAccManager v5.0.0 release prep.*

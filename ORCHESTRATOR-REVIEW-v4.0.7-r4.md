# Orchestrator Review — NexoAccManager v4.0.7 (Ronda 4)

**Reviewer:** Perfil orchestrator (subagent)
**Fecha:** 2026-07-26
**Branch:** main
**Commit revisado:** `14951f1` — `fix(security+v4.0.7): eliminar exfiltración cookies, fix CSRF, restaurar login handlers seguros, sincronizar preload+types`
**Stack:** Electron 30 + React 18 + TS 5 + Mantine v7 + framer-motion 12

## Fases ejecutadas

### ✅ Fase 1 — Revisión de código + arquitectura

**8 categorías de corrección validadas** sobre el diff de 11 archivos (605 insertions, 59 deletions):

| Categoría | Archivo | Veredicto |
|-----------|---------|-----------|
| **EXT-001** (CSRF token) | `RobloxHttp.ts` | ✅ `validateStatus: () => true` ya no entra al catch; `extractCsrfToken()` lee del response real. El token ahora sí se obtiene del camino de éxito. |
| **EXT-002** (cookie en Error) | `RobloxHttp.ts` | ✅ Eliminado `err.cookie = cookie`. Ahora `throw new Error(...)` limpio. |
| **F-001** (`cookie:refresh-real`) | `advancedHandlers.ts`, `preload/index.ts` | ✅ Handler eliminado en main y canal eliminado en preload. Comentarios explicativos preservados. |
| **F-002** (`roblox:shuffle-jobid`) | `robloxHandlers.ts`, `preload/index.ts` | ✅ Handler cookie-based eliminado. Reemplazado por `roblox:shuffleJobIdByAccount` que resuelve cookie vía `accountRepo.getById + decrypt`. |
| **F-003** (`roblox:vip-servers`) | `robloxHandlers.ts`, `preload/index.ts` | ✅ Idem F-002. Reemplazado por `roblox:vipServersByAccount`. |
| **R-001** (`account:login-browser`) | `accountHandlers.ts`, `preload/index.ts` | ✅ Handler restaurado. Flujo seguro: render invoca `loginBrowser()` → main procesa cookie vía Chromium aislado → cifra + guarda → render recibe SOLO `accountId`. |
| **R-002** (`account:login`) | `accountHandlers.ts`, `preload/index.ts` | ✅ Handler restaurado. Flujo seguro: render envía user:pass → main ejecuta `loginUserPass` → cifra + guarda → render recibe SOLO `accountId`. |
| **R-003** (sync window-api.d.ts) | `window-api.d.ts` | ✅ Tipos alineados con preload real. `loginBrowser`/`login` retornan `{ accountId }`, no `{ cookie }`. Marcado "Auto-generated from preload/index.ts — DO NOT EDIT MANUALLY". |

**Limpieza en renderer:**
- `AddAccountModal.tsx`:333 ya no desestructura `result.data.cookie` — solo cuenta `added++` (la cuenta se creó en main).
- `useAccounts.ts`:43 ya no pasa la cookie del `loginBrowser` por `addAccount` — solo recarga lista con `loadAccounts()` (la cuenta ya está en DB).

**Reglas de seguridad mantenidas:**
- ✅ Ningún handler residual en `src/infrastructure/ipc/handlers/` acepta `cookie: string` como parámetro destructurado (excepto `account:add` y `account:check` — legítimos: el usuario pega la cookie manualmente y el main la cifra de inmediato, nunca vuelve a salir).
- ✅ `presence.*` en `window-api.d.ts` sigue exponiendo `(userId, cookie: string)` — confirmado que NO hay handler `presence:*` en main y NO hay llamadas en renderer. El tipo es dead code pero no vulnerable (no es alcanzable).

**Sin regresiones arquitectónicas:**
- Patrón `ok(data)`/`err(message)` preservado en todos los handlers nuevos.
- Helper `makeEncryptedString(encrypt(cookie))` reutilizado (no se duplicó).
- `csrfCache` preservado (no se introdujo segundo cache de tokens).

### ✅ Fase 2 — Revisión de documentación

`PROJECT.md`:
- ✅ Header actualizado: `# Última actualización: 2026-07-26 (v4.0.7 — Security fixes: CSRF, cookie exfiltration, IPC sync)`
- ✅ Versión: `4.0.7 (Clean/Hexagonal Architecture — Mantine v7 UI — Security hardening)`
- ✅ Sección "Dev Handoff v4.0.7 (2026-07-26)" presente (línea 760) con los 6 checkboxes `[x]` marcados, cada uno con descripción específica de EXT/F/R.
- ✅ Verificación post-corrección documentada con 6 resultados (tsc, build, lint, vitest, E2E, IPC sync).
- ✅ Commit realizado referenciado.
- ✅ Contenido original (DT-6, v4.0.4 Dev Handoff, Batch 3, Batch 1, arquitectura, gap analysis, etc.) preservado íntegro — el amend restauró PROJECT.md correctamente.

### ✅ Fase 3 — Revisión de tests

| Suite | Resultado |
|-------|-----------|
| `tests/unit/CryptoService.test.ts` | 11/11 pasando (356ms) |
| `tests/unit/Account.test.ts` | 10/10 pasando (12ms) |
| `tests/unit/DomainFactories.test.ts` | 15/15 pasando (19ms) |
| `tests/e2e-electron/smoke.spec.ts` | 4/4 pasando |
| `tests/e2e-electron/accounts.spec.ts` | 2/2 pasando |
| **TOTAL** | **42/42 tests pasando (36 unit + 6 E2E)** |

Sin regresiones. Los tests E2E validan navegación paneles + Accordion Settings + AddAccountModal — todo el flujo UI sigue funcional.

### ✅ Fase 4 — Análisis de resultados

| Verificación | Comando | Resultado |
|--------------|---------|-----------|
| TypeScript | `npx tsc --noEmit` | ✅ 0 errores |
| Lint | `npm run lint` | ✅ 0 errores, 48 warnings (+2 vs baseline 46 por vars `userId`/`username` no usadas en handlers restaurados — menores) |
| Unit tests | `npx vitest run` | ✅ 36/36 pasando (1.70s) |
| Build | `npm run build` | ✅ AppImage + Snap generados; renderer/main/preload bundles OK |
| E2E | `xvfb-run npx playwright test` | ✅ 6/6 pasando (14.9s) |
| **IPC sync** (script custom) | extractor de `ipcMain.handle` vs `ipcRenderer.invoke` | ✅ **91 handlers = 91 canales preload — 0 mismatches** |
| **Exfiltración** (audit F-family) | grep `cookie: string` en destructured payloads de handlers | ✅ Ningún handler cookie-based residual |
| **LSP** | (limpio de fábrica por tsc verde) | ✅ |

### ✅ Fase 5 — Decisión de despliegue

**Veredicto:** ✅ **APROBAR** el push a `origin/main`.

Todas las puertas de calidad pasaron. Las correcciones de seguridad son correctas, completas y no introducen regresiones. La superficie de exfiltración de cookies quedó cerrada. El flujo IPC está sincronizado (0 mismatches). Las pruebas unit y E2E confirman estabilidad.

### ✅ Fase 6 — Ejecución de despliegue

```
$ git push origin main
To https://github.com/Nxxo31/NexoAccManager.git
   7b185e4..14951f1  main -> main
===PUSH EXIT: 0===
```

**Push exitoso.** Commit `14951f1` ahora en `origin/main`. Branch local sincronizada con remote.

### ✅ Fase 7 — Post-deploy + feedback al dev

**Resultado del despliegue:**
- Commit `14951f1` publicado en `origin/main` (github.com/Nxxo31/NexoAccManager)
- Branch local `main` limpia, sin commits sin publicar.
- Artefactos en `release/`: AppImage + Snap generados localmente.

---

## Feedback al dev (constructivo)

### 👍 Lo que estuvo bien
1. **Comentarios explicativos 临床**: cada handler restaurado/eliminado tiene un comentario con la referencia al ID de la auditoría (EXT-001, F-002, R-001, etc.) y por qué el flujo nuevo es seguro. Esto hace que futuras revisiones tracen directamente al hallazgo original.
2. **Extracción de helper** `extractCsrfToken` en `RobloxHttp.ts` — el código quedó más legible que el original monolítico en el catch.
3. **Renderer cleanup completo**: no solo restauraste los handlers de main, también actualizaste `useAccounts.ts` (eliminó paso intermedio `addAccount(cookie)` post-login) y `AddAccountModal.tsx` (eliminó desestructuración de `cookie` del IpcResult). Sin ese cleanup, los handlers estarían restaurados pero el renderer seguiría traficando cookies — el fix habría estado incompleto.
4. **Justificación de `presence.*` en PROJECT.md**: documentó explícitamente por qué esos tipos muertos no son vulnerables (no son alcanzables). Buena práctica defensiva.
5. **Amend commit** con mensaje claro: `fix(security+v4.0.7): ...` enumera las 4 categorías de acción. Cumple el estándar "informative enough to search history".

### 🔧 Sugerencias (opcionales, no bloqueantes)
1. **Lint +2 warnings**: En `accountHandlers.ts:313` las vars `userId`/`username` del destructuring `const { cookie, userId, username } = await loginBrowser()` no se usan porque el handler re-valida con `verifyCookie(cookie)` que retorna `info.userId`/`info.username`. Considera `const { /* userId, username, */ cookie } = await loginBrowser()` (comentario que no rompe el destructor) o simplemente no desestructurarlos: `const loginResult = await loginBrowser(); const cookie = loginResult.cookie;`. Reduce el噪音 visual en el baseline.
2. **`presence.*` en `window-api.d.ts`**: los 3 métodos `presence.get/recentGames/robuxBalance` que toman `cookie: string` son unreachable en cualquier sentido (no hay handler, no hay caller). Es legítimo dejarlos para documentación futura, pero considerar marcarlos `@deprecated` con comentario "// No handler in main — not reachable. For future implementation only" para que un próximo dev no intente llamarlos y se confunda.
3. **Marcador "Auto-generated" en `window-api.d.ts`**: el header dice `// Auto-generated from preload/index.ts — DO NOT EDIT MANUALLY` pero el diff muestra edición manual del archivo. Si existe un script generador, conviene usarlo para regenerar a partir del preload real; si no existe, considerar cambiar el comentario a `// Hand-maintained mirror of preload/index.ts — keep in sync manually` para que el siguiente editor sepa la verdad.

### ✅ Estado de la ronda 4
- **8/8 categorías de auditoría** corregidas y verificadas.
- **0 regresiones** introducidas.
- **Codificación de seguridad**: la regla fundamental "las cookies nunca abandonan el main process" ahora se cumple en todos los flujos.
- **Calidad pre-merge**: todas las puertas pasaron (tsc 0, lint 0, vitest 36/36, E2E 6/6, build exitoso, IPC sync 0 mismatch).

**Listo para release v4.0.7 dentro del canal `main`.**

---

_Archivo generado por el perfil orchestrator. Evidencia: commit `14951f1` publicado en `origin/main` el 2026-07-26._

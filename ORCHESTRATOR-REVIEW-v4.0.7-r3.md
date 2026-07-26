# Orchestrator Review v4.0.7 — Ronda 3 (rechazado)

**Fecha:** 2026-07-26
**Reviewer:** orchestrator (subagent)
**Commit revisado:** `7b17cf3 fix(security+v4.0.7): eliminar exfiltración cookies, fix CSRF, restaurar login handlers seguros, sincronizar preload+types`
**Branch:** `main` (local, NO pusheado)
**Veredicto:** ⛔ **NO APROBADO para despliegue** — devolver al dev con diagnóstico específico

---

## Resumen ejecutivo

El trabajo técnico de código está **correcto y completo** — las 8 categorías del diagnóstico v4.0.7 están resueltas y la suite de verificación pasa limpia (tsc 0 errors, build OK, lint baseline intacto, vitest 36/36, playwright 6/6). El blocker es de documentación: el `PROJECT.md` fue reemplazado por el Dev Handoff en lugar de anexarse, destruyendo 91% del roadmap/status del proyecto.

## Resultado por fase

| Fase | Resultado | Notas |
|------|-----------|-------|
| 1. Código + arquitectura | ✅ PASS | 8/8 categorías corregidas correctamente |
| 2. Documentación | ⛔ BLOCKER | PROJECT.md destruido (758→69 líneas) |
| 3. Tests | ✅ PASS | Vitest 36/36, Playwright 6/6 |
| 4. Análisis resultados | ✅ PASS | tsc 0 errors, build 3/3 OK, lint 0 errors/48 warnings baseline, sync IPC 91↔91 drift=0, cero exfiltración cookie |
| 5. Decisión | ⛔ RECHAZADO | Ver diagnóstico específico |
| 6. Despliegue | ⏸️ SKIPPED | Push NO ejecutado (origin/main sin commit 7b17cf3) |
| 7. Feedback | 📝 Este documento | |

## Evidencia técnica (Fase 4 — verificación independiente)

```
+----------------------+----------+------------------------+------+
| Comando              | Resultado | Count                | exit |
+----------------------+----------+------------------------+------+
| tsc --noEmit         | PASS     | 0 errors               | 0    |
| build (vite+electron)| PASS     | 3/3 builds + packaging | 0    |
| lint                 | PASS     | 0 errors, 48 warnings  | 0    |
| vitest run           | PASS     | 36/36 tests            | 0    |
| playwright (electron)| PASS     | 6/6 E2E                | 0    |
+----------------------+----------+------------------------+------+
```

- Lint: 48 warnings preexistentes (todas `@typescript-eslint/no-unused-vars` y `no-explicit-any`). Ninguno en archivos tocados por esta auditoría.
- Vitest: 3 archivos de test (`/tests/unit/`), 36 tests en 1.42s.
- Playwright: 6 tests Electron en 14.9s (`accounts.spec.ts`, `smoke.spec.ts`).
- Sync IPC: preload↔main = 91↔91 channels, **cero drift runtime**, **cero zombies**.
- Cookie boundary audit: sólo `account:add` y `account:check` reciben `cookie: string` del renderer (ambos legítimos — import one-shot). LoginHandlers devuelven `{ accountId }`, nunca cookie. byAccount resuelve cookies internamente vía `accountRepo.getById` + `decrypt`.

## Validación Fase 1 — corrección de las 8 categorías

| Categoría | Skill ref | Implementación | Estado |
|------------|-----------|-----------------|--------|
| EXT-001 CSRF token | `secure-electron-ipc` §1 | `getCsrfToken` ahora usa `validateStatus: () => true` y extrae token del success path (header `x-csrf-token`). Eliminado el catch-block approach que nunca encontraba el token. | ✅ |
| EXT-002 cookie en errores | §2 | Eliminada asignación `err.cookie = cookie`. Ahora lanza `Error('No se pudo obtener CSRF token')` limpio. | ✅ |
| F-001 cookie:refresh-real | §3 | Handler `cookie:refresh-real` removido de `advancedHandlers.ts:93` y preload. Comentario documentando la eliminación. | ✅ |
| F-002 roblox:shuffleJobid | §3 | Handler `roblox:shuffle-jobid` removido. Reemplazado por `roblox:shuffleJobIdByAccount` ({placeId, accountId}) que resuelve cookie internamente. | ✅ |
| F-003 roblox:vip-servers | §3 | Handler `roblox:vip-servers` removido. Reemplazado por `roblox:vipServersByAccount` ({placeId, accountId}). | ✅ |
| R-001 account:login-browser | §4 | Handler restaurado usando `loginBrowser()`, cifra cookie con `encrypt()` y guarda en `accountRepo`. Devuelve solo `accountId`. | ✅ |
| R-002 account:login | §4 | Handler restaurado usando `loginUserPass()`, mismo flujo seguro (cifrar+guardar+devolver accountId). | ✅ |
| R-003 sync window-api.d.ts | §5 | preload↔d.ts sincronizado para channels críticos (loginBrowser, login, byAccount). return type de login es `IpcResult<{ accountId: string }>`. | ✅ parcial — ver deuda técnica |
| TS2345 useAccounts.ts | §6 | 4 instancias corregidas con `result.error ?? 'Error desconocido'`. | ✅ |

## Diagnóstico específico — 3 items a corregir

### 🔴 1. BLOCKER — PROJECT.md destruido (758 → 69 líneas)

El commit reemplazó el archivo de roadmap del proyecto con el Dev Handoff en lugar de anexarlo.

**Antes del commit (757 líneas, 55 KB):** PROJECT.md contenía:
- Historial de versiones
- Próximos pasos (Sección 🔵)
- Estado de features (Developer Mode: ⚠️ Stub)
- Decisiones de arquitectura (hexagonal ports, IPCAdapter split)
- Protocolo de desarrollo anti-sesgo semántico
- Estado de handlers legacy eliminados
- Deuda técnica pendiente

**Después del commit (69 líneas, 5.5 KB):** Solo contiene el Dev Handoff v4.0.7 con su checklist.

**Acción requerida:**
```bash
# Restaurar el contenido original y anexar el Dev Handoff al final
cd /home/sebas/proyectos/NexoAccManager
git show 7b17cf3^:PROJECT.md > PROJECT.md.original
# Editar PROJECT.md.original para anexar al final el Dev Handoff v4.0.7 (las 22 líneas de
# la sección "## Dev Handoff v4.0.7 (2026-07-26)" que están en el commit actual)
# Hacer commit enmendado:
git add PROJECT.md
git commit --amend --no-edit
```

Skill relevante: `agent-instructions-management` — *"PROJECT.md es el archivo de estado del
proyecto, fuente de verdad del roadmap y estado actual"*.

### 🟡 2. MEDIUM — `window-api.d.ts` parcialmente stale (deuda técnica, no bloqueante)

El d.ts conserva namespaces zombie que ya no están en preload:
- `account.friends.{list,requests,respond}` (líneas 23-27) — todos toman `cookie: string` del renderer.
- `account.blocked.{list,block,unblock}` (líneas 28-32) — todos `cookie: string`.
- `account.follow`, `account.unfollow` (líneas 33-34) — `cookie: string`.
- `presence` namespace entero (líneas 52-56) — todos `cookie: string`.

Y omite namespaces que el preload SÍ expone:
- `theme` (preload l.76-79) no declarado en d.ts.
- `captcha` (preload l.82-84) no declarado en d.ts.

Y duplica:
- `shuffleJobIdByAccount` (d.ts l.48 + l.156), `vipServersByAccount` (d.ts l.49 + l.158).

**Impacto:** cero runtime/today (`tsc --noEmit` pasa limpio porque el renderer no llama a los
zombies). Pero viola el contrato "d.ts = espejo de preload" del skill `secure-electron-ipc` §7
y es trampa de tipos para código renderer futuro.

**Acción requerida:** regenerar `window-api.d.ts` desde `src/preload/index.ts` (el propio
archivo declara "Auto-generated from preload/index.ts — DO NOT EDIT MANUALLY" en línea 2).

### 🟡 3. LOW — Archivos de auditoría mezclados en commit de fix

`audit-react-ux.md` (95 líneas) y `research-lua-executor.md` (272 líneas) son outputs de
investigación y deberían haber ido en commit separado (`docs:`) en lugar de en el
commit `fix(security+v4.0.7)`. No bloqueante pero ripple de ruido en el changelog.

**Acción recomendada (opcional si se quiere limpiar el historial):**
```bash
git reset --soft HEAD~1
git restore --staged audit-react-ux.md research-lua-executor.md
git commit -m "fix(security+v4.0.7): ..." # solo los archivos de security
git add audit-react-ux.md research-lua-executor.md
git commit -m "docs: añadir audit React UX + research Lua executor"
```

## Lo que está correcto (feedback positivo al dev)

- ✅ **Todas las correcciones de código son técnicamente impecables.** Security fix del CSRF,
  eliminación de handlers inseguros, byAccount replacements, login handlers seguros —
  todo sigue el skill `secure-electron-ipc` letra por letra.
- ✅ **Cero regresiones en tests.** Vitest y Playwright pasando sin touch.
- ✅ **Cero exfiltración cookie** confirmada por audit grep en renderer (`src/application/`).
- ✅ **Sync preload↔main = 91↔91, cero zombies.** No hay hangs invisibles.
- ✅ **Return types de login handlers correctos** (`{ accountId }`, no cookie).
- ✅ **TS2345 corregidos** con el patrón recomendado por el skill (`?? 'Error desconocido'`).
- ✅ **Commit message claro y descriptivo**.
- ✅ **Checklist con ✅ y fecha correcta** (2026-07-26) en el Dev Handoff.

## Próximos pasos sugeridos para el dev

1. **Hoy (blocker):** Restaurar PROJECT.md original y anexar la sección `## Dev Handoff v4.0.7 (2026-07-26)` al final. Commit enmendado.
2. **Esta semana (deuda técnica):** Regenerar `window-api.d.ts` desde `src/preload/index.ts`
   para eliminar zombies y duplicaciones. Commit separado `chore(types): regenerar window-api.d.ts`.
3. **Opcional:** Separar `audit-react-ux.md` y `research-lua-executor.md` en commit `docs:`.
4. **Próximo sprint (no bloqueante):** Skill §8 recommenda añadir tests de regresión para cookie
   boundary (test walk-preload que afirme que ningún método acepta `cookie: string` excepto
   `account.add`/`account.check`).

Una vez corregido el BLOCKER (#1), el orchestrator puede re-ejecutar la ronda 4 en
<5 minutos y aprobar el push a origin/main.

---

*Generado por orchestrator subagent — proceso de revisión en 7 fases del
profile-execution-protocol.*

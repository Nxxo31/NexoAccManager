# Contributing to Nxxo31 Projects

## 🚀 Quick Start

1. Fork el repo
2. `git checkout -b feature/tu-feature`
3. Implementa siguiendo los **3-Layer Verification Gates**
4. `git commit -m "feat: descripción breve en español"`
5. Abre un PR con el template completo

## 📋 Reglas de Commit

### Formato
```
<type>: <descripción en español>

<body opcional con detalles>
```

### Types
| Type | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Bug fix |
| `refactor` | Refactor sin cambio de comportamiento |
| `docs` | Solo documentación |
| `chore` | Mantenimiento (deps, configs) |
| `test` | Tests nuevos o corregidos |
| `perf` | Mejora de rendimiento |

### Reglas
- Commits **atómicos** — un cambio lógico por commit
- Mensaje en **español** (body puede ser técnico en inglés)
- **No** mentions of "AI generated" en commits
- Verificación **antes** de commit: typecheck → lint → build → test

## 🛡️ 3-Layer Verification Gates

Todo PR debe pasar los 3 layers antes de merge:

### Layer 1 — Compile (determinístico)
```bash
# TypeScript
npx tsc --noEmit && npm run lint && npm run build

# Go
go vet ./... && go build ./... && go test ./...

# Python
python -m py_compile src/ && pytest --tb=short
```

### Layer 2 — Runtime (verificación funcional)
- Start del sistema (servidor, CLI, app)
- Curl/interact con endpoints reales
- Browser: `browser_navigate` + `browser_console` (0 errors)
- Verificar datos reales (no mock)

### Layer 3 — Adversarial (robustez)
- Boundary cases (vacío, nulo, máximo, mínimo)
- Idempotencia (ejecutar 2x → mismo resultado)
- Concurrencia (race conditions)

## 🔀 Workflow de Branches

```
main          ← solo PRs aprobados, siempre verde
├── feature/xxx   ← nueva funcionalidad
├── fix/xxx       ← bug fix
├── refactor/xxx  ← refactor
└── docs/xxx      ← solo documentación
```

## 📝 Issue Workflow

1. **Abrir issue** antes de implementar (feature o bug)
2. Asignar labels: `enhancement`, `bug`, `documentation`
3. Linkear el issue en el PR (`Closes #N`)
4. Mover a "In Progress" en el project board

## 🔐 Seguridad

- **Nunca** commitear secrets, API keys, tokens, o `.env`
- Usar `.env.example` para variables de entorno
- `.env` siempre en `.gitignore`

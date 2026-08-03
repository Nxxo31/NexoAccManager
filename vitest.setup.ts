// Vitest setup — mocks globales de módulos nativos/Electron que rompen bajo node.
//
// Estos mocks se aplican ANTES de que cada test importe su SUT, de modo que
// `import { ... } from 'electron'` no intente cargar el runtime de Electron
// (que no existe en un worker de vitest under node).

import { vi } from 'vitest';

// ── electron ──────────────────────────────────────────────────────────────
// DatabaseManager usa `app.getPath('userData')`; RobloxAuthService usa
// `session.fromPartition`, `BrowserWindow`. Solo se mockea lo necesario para
// que los módulos importen sin error. Los tests que ejercitan lógica que toca
// electron reemplazan estos stubs con `vi.mocked(...).mockReturnValue(...)`.
vi.mock('electron', () => {
  const app = {
    getPath: vi.fn(() => '/tmp/nexoacc-test-userdata'),
    on: vi.fn(),
  };
  return {
    app,
    session: {
      fromPartition: vi.fn(),
    },
    BrowserWindow: vi.fn(),
  };
});

// ── better-sqlite3 ─────────────────────────────────────────────────────────
// AccountRepositoryImpl usa `getDb()` que devuelve una instancia de
// better-sqlite3. Cada test del repositorio provee su propio stub de `getDb`
// vía `vi.mock('./DatabaseManager', ...)` dentro del test. Este mock global
// existiría si un import transitorio tocara better-sqlite3 directamente.
vi.mock('better-sqlite3', () => {
  const Database = vi.fn();
  return { default: Database };
});

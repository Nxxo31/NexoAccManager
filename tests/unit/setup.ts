/**
 * Vitest setup — se ejecuta antes de cada test file.
 * Configura el entorno para tests de Electron app en Node puro.
 */

// Silenciar console.error/noise en tests (se puede habilitar seletivamente)
const origError = console.error;
const origWarn = console.warn;

// En tests esperaríamos errores controlados — filter del noise de Electron
console.error = (...args: unknown[]) => {
  const msg = String(args[0] || '');
  // Filtrar noise conocido de Electron window.api en browser mode
  if (msg.includes('window.api') || msg.includes('api is undefined')) return;
  origError(...args);
};

console.warn = (...args: unknown[]) => {
  const msg = String(args[0] || '');
  if (msg.includes('Electron Deprecation')) return;
  origWarn(...args);
};

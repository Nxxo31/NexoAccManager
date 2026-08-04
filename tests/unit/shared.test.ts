// Tests unitarios para src/infrastructure/ipc/handlers/shared.ts
// B-6: cubre ok/err/errMsg/safeResolve — helpers puros del patrón IpcResult.
//
// Runner: node --experimental-strip-types --test tests/unit/*.test.ts
// No requiere vitest/jest — usa node:test (builtin en Node 22+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ok, err, errMsg, safeResolve } from '/home/sebas/proyectos/NexoAccManager/src/infrastructure/ipc/handlers/shared.ts';

// ============================================================================
// ok() — construye el success branch del IpcResult union
// ============================================================================

test('ok() returns {success:true, data} for primitive data', () => {
  const result = ok(42);
  assert.equal(result.success, true);
  // En tiempo de ejecución, acceder a .data directamente — si el tipo es incorrecto, fallará claramente
  assert.equal(result.data, 42);
});

test('ok() preserves object identity in data field', () => {
  const payload = { id: 'abc', items: [1, 2, 3] };
  const result = ok(payload);
  assert.equal(result.success, true);
  // Strict equality — mismo objeto
  assert.equal(result.data, payload);
});

test('ok() handles null data (explicit success with no payload)', () => {
  const result = ok(null);
  assert.equal(result.success, true);
  assert.equal(result.data, null);
});

test('ok() handles undefined data (IPC void ack)', () => {
  const result = ok(undefined);
  assert.equal(result.success, true);
  assert.equal(result.data, undefined);
});

test('ok() preserves array data', () => {
  const arr = ['a', 'b', 'c'];
  const result = ok(arr);
  assert.equal(result.success, true);
  // Deep equality para arrays
  assert.deepEqual(result.data, ['a', 'b', 'c']);
});

// ============================================================================
// err() — construye el error branch del IpcResult union
// ============================================================================

test('err() returns {success:false, error} with the provided message', () => {
  const result = err('something went wrong');
  assert.equal(result.success, false);
  assert.equal(result.error, 'something went wrong');
});

test('err() discriminates from ok() in success field', () => {
  const good = ok('x');
  const bad = err('fail');
  // TypeScript narrowing works via the success field; here we assert runtime.
  if (good.success) {
    assert.equal(good.data, 'x');
  } else {
    assert.fail('ok() unexpectedly produced error branch');
  }
  if (!bad.success) {
    assert.ok(bad.error.length > 0);
  } else {
    assert.fail('err() unexpectedly produced success branch');
  }
});

test('err() preserves empty-string error messages (caller may pass empty)', () => {
  const result = err('');
  assert.equal(result.success, false);
  assert.equal(result.error, '');
});

// ============================================================================
// errMsg() — normaliza unknown caught values a string estable
// ============================================================================

test('errMsg() extracts message from Error instances', () => {
  const e = new Error('boom');
  assert.equal(errMsg(e), 'boom');
});

test('errMsg() stringifies non-Error primitives', () => {
  assert.equal(errMsg('literal string'), 'literal string');
  assert.equal(errMsg(42), '42');
  assert.equal(errMsg(true), 'true');
  assert.equal(errMsg(null), 'null');
  assert.equal(errMsg(undefined), 'undefined');
});

test('errMsg() stringifies plain objects via Object.toString', () => {
  // {foo:'bar'}.toString() → '[object Object]'
  assert.equal(errMsg({ foo: 'bar' }), '[object Object]');
});

test('errMsg() handles objects with a custom toString()', () => {
  const custom = { toString() { return 'custom-failure'; } };
  assert.equal(errMsg(custom), 'custom-failure');
});

test('errMsg() does NOT use stack (only message) for Error', () => {
  const e = new Error('clean');
  // Stack contains "clean" too, but errMsg should return the message itself,
  // not the multi-line stack trace.
  assert.equal(errMsg(e), 'clean');
  // Aseguramos que no contenga saltos de línea (stack traces sí los tienen)
  assert.equal(errMsg(e).includes('\n'), false, 'errMsg must not include stack lines');
});

// ============================================================================
// safeResolve() — bloquea path traversal, permite rutas hijas legítimas
// ============================================================================

test('safeResolve() returns the resolved path when relativePath stays inside root', () => {
  const root = '/tmp/nx-test-root';
  const result = safeResolve(root, 'subdir/file.txt');
  assert.notEqual(result, null);
  // El path absoluto resultante debe empezar con rootResolved + sep
  assert.equal(result!.startsWith('/tmp/nx-test-root/'), true);
});

test('safeResolve() returns the root itself when relativePath is "." or empty', () => {
  const root = '/tmp/nx-test-root';
  const dot = safeResolve(root, '.');
  const empty = safeResolve(root, '');
  assert.notEqual(dot, null);
  assert.notEqual(empty, null);
});

test('safeResolve() blocks "../" escape attempts', () => {
  const root = '/tmp/nx-test-root';
  const result = safeResolve(root, '../../../etc/passwd');
  assert.equal(result, null, 'paths escaping root must return null');
});

test('safeResolve() blocks absolute paths outside root', () => {
  const root = '/tmp/nx-test-root';
  // Caller passes '/etc/passwd' as "relative" — resolve uses it as absolute.
  const result = safeResolve(root, '/etc/passwd');
  assert.equal(result, null, 'absolute paths outside root must return null');
});

test('safeResolve() allows nested subpaths but not siblings of root', () => {
  const root = '/tmp/nx-test-root';
  // Sibling directory: /tmp/nx-test-other — escape attempt
  assert.equal(safeResolve(root, '../nx-test-other/file'), null);
  // Deep legitimate path
  const deep = safeResolve(root, 'a/b/c/d.txt');
  assert.notEqual(deep, null);
  assert.equal(deep!.startsWith('/tmp/nx-test-root/a/b/c/'), true);
});

test('safeResolve() handles Windows-style backslash traversal (POSIX node:path)', () => {
  // node:path on POSIX treats backslashes as path characters, not separators.
  // '../' is the canonical escape vector on POSIX. We only assert POSIX semantics here.
  const root = '/tmp/nx-test-root';
  // On POSIX, '..\\..\\..\\etc' is a filename with literal backslashes, not a traversal.
  // safeResolve should return a path (not null) because no '..' or '/' sequences are present as separators.
  const result = safeResolve(root, '..\\\\..\\\\..\\\\etc');
  assert.notEqual(result, null);
  // The returned path will be root + the weird filename
  assert.equal(result!.startsWith('/tmp/nx-test-root/'), true);
});

test('safeResolve() rejects path that starts with root prefix but is sibling', () => {
  // Prefix-only check is a classic bug: '/tmp/nx-test-root-evil' starts with
  // '/tmp/nx-test-root' (string startsWith) but is NOT a child. safeResolve must
  // guard against this by appending path.sep to the root before comparison.
  const root = '/tmp/nx-test-root';
  const result = safeResolve(root, '../nx-test-root-evil/file');
  assert.equal(result, null, 'must reject sibling whose name starts with root');
});

// ============================================================================
// Contract: ok/err round-trip + union discrimination
// ============================================================================

test('IpcResult union: handlers can pattern-match cleanly', () => {
  // Simulates the renderer's result handler code path:
  //   if (result.success) { /* result.data } else { /* result.error */ }
  const happy = ok({ value: 1 });
  const sad = err('denied');

  if (happy.success) {
    assert.equal(happy.data.value, 1);
  } else {
    assert.fail('happy path must enter success branch');
  }

  if (!sad.success) {
    assert.equal(typeof sad.error, 'string');
  } else {
    assert.fail('sad path must enter error branch');
  }
});
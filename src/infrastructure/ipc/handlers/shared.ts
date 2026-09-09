// Shared IPC helpers — Result pattern + error formatting
// Mandatory shape per AGENTS.md:
//   { success: true, data: T } | { success: false, error: string }
// Handlers must never throw without catch — all errors become err(...).

import * as path from 'node:path';

export type IpcResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): IpcResult<T> {
  return { success: true, data };
}

export function err(error: string): IpcResult {
  return { success: false, error };
}

/** Normalize unknown caught values into a stable string message. */
export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/**
 * Resolve `relativePath` against `root` and refuse escapes.
 * Returns the resolved absolute path on success, or null on escape attempt.
 */
export function safeResolve(root: string, relativePath: string): string | null {
  const resolved = path.resolve(root, relativePath);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    return null; // attempted path traversal
  }
  return resolved;
}

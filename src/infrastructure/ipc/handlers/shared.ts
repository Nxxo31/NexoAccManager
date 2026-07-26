// Shared IPC helpers — Result pattern + error formatting
// Mandatory shape per AGENTS.md:
//   { success: true, data: T } | { success: false, error: string }
// Handlers must never throw without catch — all errors become err(...).

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

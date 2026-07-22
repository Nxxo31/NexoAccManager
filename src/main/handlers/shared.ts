// Shared IPC types and helpers — used by main.ts and handler modules

export interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T): IpcResult<T> {
  return { success: true, data };
}

export function err(message: string): IpcResult {
  return { success: false, error: message };
}

// Validators
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidPlaceId(value: unknown): value is string {
  return isNonEmptyString(value) && /^\d{1,20}$/.test(value.trim());
}

export function isValidJobId(value: unknown): value is string {
  if (value === undefined || value === null) return true;
  return isNonEmptyString(value) && /^[a-zA-Z0-9\-]{1,100}$/.test(String(value).trim());
}

export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

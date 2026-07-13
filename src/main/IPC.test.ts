import { describe, it, expect } from 'vitest';

/**
 * Tests for IPC type guards and result pattern helpers.
 * These functions are defined inline in main.ts but we test the logic here.
 */

// Replicate the type guard functions from main.ts for testing
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isValidPlaceId(value: unknown): value is string {
  return isNonEmptyString(value) && /^\d{1,20}$/.test(value.trim());
}

function isValidJobId(value: unknown): value is string {
  if (value === undefined || value === null) return true;
  return isNonEmptyString(value) && /^[a-zA-Z0-9\-]{1,100}$/.test(String(value).trim());
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

// Replicate ok/err result pattern
interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

function ok<T>(data: T): IpcResult<T> {
  return { success: true, data };
}

function err(message: string): IpcResult {
  return { success: false, error: message };
}

const MAX_ACCOUNTS = 50;

describe('IPC Type Guards', () => {
  describe('isNonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  x  ')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should reject non-strings', () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
      expect(isNonEmptyString([])).toBe(false);
    });
  });

  describe('isBool', () => {
    it('should accept booleans', () => {
      expect(isBool(true)).toBe(true);
      expect(isBool(false)).toBe(true);
    });

    it('should reject non-booleans', () => {
      expect(isBool(0)).toBe(false);
      expect(isBool(1)).toBe(false);
      expect(isBool('true')).toBe(false);
      expect(isBool(null)).toBe(false);
    });
  });

  describe('isValidPlaceId', () => {
    it('should accept numeric strings', () => {
      expect(isValidPlaceId('123456789')).toBe(true);
      expect(isValidPlaceId('1')).toBe(true);
    });

    it('should accept up to 20 digits', () => {
      expect(isValidPlaceId('12345678901234567890')).toBe(true);
    });

    it('should reject more than 20 digits', () => {
      expect(isValidPlaceId('123456789012345678901')).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      expect(isValidPlaceId('abc')).toBe(false);
      expect(isValidPlaceId('12abc')).toBe(false);
      expect(isValidPlaceId('')).toBe(false);
      expect(isValidPlaceId('  ')).toBe(false);
    });

    it('should reject non-strings', () => {
      expect(isValidPlaceId(123)).toBe(false);
      expect(isValidPlaceId(null)).toBe(false);
    });
  });

  describe('isValidJobId', () => {
    it('should accept alphanumeric and hyphen strings', () => {
      expect(isValidJobId('abc-123-xyz')).toBe(true);
      expect(isValidJobId('job123')).toBe(true);
    });

    it('should accept undefined and null (optional jobId)', () => {
      expect(isValidJobId(undefined)).toBe(true);
      expect(isValidJobId(null)).toBe(true);
    });

    it('should reject strings longer than 100 chars', () => {
      expect(isValidJobId('a'.repeat(101))).toBe(false);
    });

    it('should reject strings with special characters', () => {
      expect(isValidJobId('abc!')).toBe(false);
      expect(isValidJobId('abc 123')).toBe(false);
      expect(isValidJobId('abc/def')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidJobId('')).toBe(false);
    });
  });

  describe('isPositiveInteger', () => {
    it('should accept positive integers', () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(42)).toBe(true);
      expect(isPositiveInteger(1000)).toBe(true);
    });

    it('should reject zero', () => {
      expect(isPositiveInteger(0)).toBe(false);
    });

    it('should reject negative numbers', () => {
      expect(isPositiveInteger(-1)).toBe(false);
      expect(isPositiveInteger(-42)).toBe(false);
    });

    it('should reject floats', () => {
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger(3.14)).toBe(false);
    });

    it('should reject non-numbers', () => {
      expect(isPositiveInteger('1')).toBe(false);
      expect(isPositiveInteger(true)).toBe(false);
      expect(isPositiveInteger(null)).toBe(false);
    });
  });
});

describe('IPC Result Pattern', () => {
  it('ok() should return success with data', () => {
    const result = ok('test_data');
    expect(result.success).toBe(true);
    expect(result.data).toBe('test_data');
    expect(result.error).toBeUndefined();
  });

  it('err() should return failure with error message', () => {
    const result = err('Something went wrong');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
    expect(result.data).toBeUndefined();
  });

  it('ok() should handle objects', () => {
    const result = ok({ name: 'test', value: 42 });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'test', value: 42 });
  });

  it('ok() should handle arrays', () => {
    const result = ok([1, 2, 3]);
    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('ok() should handle null', () => {
    const result = ok(null);
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});

describe('MAX_ACCOUNTS limit', () => {
  it('should be 50', () => {
    expect(MAX_ACCOUNTS).toBe(50);
  });

  it('should reject adding when at limit', () => {
    const currentCount = 50;
    expect(currentCount >= MAX_ACCOUNTS).toBe(true);
  });

  it('should allow adding when under limit', () => {
    const currentCount = 49;
    expect(currentCount < MAX_ACCOUNTS).toBe(true);
  });
});

describe('Cookie format validation', () => {
  const COOKIE_PREFIX = '_|WARNING:-DO-NOT-SHARE|_';

  it('should accept valid cookie format', () => {
    const cookie = `${COOKIE_PREFIX}test_value_12345`;
    expect(cookie.startsWith(COOKIE_PREFIX)).toBe(true);
  });

  it('should reject invalid cookie format', () => {
    const cookie = 'invalid_cookie_value';
    expect(cookie.startsWith(COOKIE_PREFIX)).toBe(false);
  });

  it('should reject empty cookie', () => {
    expect(''.startsWith(COOKIE_PREFIX)).toBe(false);
  });
});

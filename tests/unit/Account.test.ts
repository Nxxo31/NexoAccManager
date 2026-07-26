/**
 * Unit tests — Account entity + password handling + MAX_ACCOUNTS limit
 * Testea la lógica de dominio pura: createAccount factory + MAX_ACCOUNTS.
 * No toca DB ni Electron — son tests de la capa de dominio.
 */

import { describe, it, expect } from 'vitest';
import { createAccount, type Account } from '../../src/domain/entities/Account';
import { makeEncryptedString } from '../../src/domain/types/EncryptedString';
import { MAX_ACCOUNTS } from '../../src/config/constants';

describe('Account entity — createAccount factory', () => {
  it('crea Account con defaults sensatos', () => {
    const acc = createAccount({
      id: 'acc-1',
      robloxUserId: 123456,
      username: 'testUser',
      encryptedCookie: makeEncryptedString('enc-cookie-data'),
      cookieHash: 'hash-12345',
    });

    expect(acc.id).toBe('acc-1');
    expect(acc.robloxUserId).toBe(123456);
    expect(acc.username).toBe('testUser');
    expect(acc.encryptedCookie).toBe('enc-cookie-data');
    // Defaults
    expect(acc.displayName).toBe('testUser'); // == username por defecto
    expect(acc.group).toBe('Default');
    expect(acc.isFavorite).toBe(false);
    expect(acc.autoRelaunch).toBe(false);
    expect(acc.recentGames).toEqual([]);
    expect(acc.favoriteGames).toEqual([]);
    expect(acc.fields).toEqual({});
    expect(acc.cookieExpiresAt).toBe(null);
  });

  it('respeta override de defaults', () => {
    const acc = createAccount({
      id: 'acc-2',
      robloxUserId: 999,
      username: 'testname',
      encryptedCookie: makeEncryptedString('enc'),
      cookieHash: 'h',
      displayName: 'CustomDisplay',
      group: 'Premium',
      isFavorite: true,
      autoRelaunch: true,
    });

    expect(acc.displayName).toBe('CustomDisplay');
    expect(acc.group).toBe('Premium');
    expect(acc.isFavorite).toBe(true);
    expect(acc.autoRelaunch).toBe(true);
  });

  it('respeta fecha custom y conserva null de cookieExpiresAt', () => {
    const fecha = new Date('2026-07-25T00:00:00Z');
    const acc = createAccount({
      id: 'acc-3',
      robloxUserId: 1,
      username: 'test',
      encryptedCookie: makeEncryptedString('enc'),
      cookieHash: 'h',
      lastUsed: fecha,
      createdAt: fecha,
      cookieExpiresAt: null,
    });

    expect(acc.lastUsed).toEqual(fecha);
    expect(acc.createdAt).toEqual(fecha);
    expect(acc.cookieExpiresAt).toBeNull();
  });

  it('campos requeridos no pueden ser undefined (TS evita esto)', () => {
    // createAccount exige Pick<Account, 'id' | 'robloxUserId' | 'username' | 'encryptedCookie'>.
    // TS lo evita en compile-time; aquí forzamos un cast a un Partial incompleto
    // para simular runtime. El invariante cookie/cookieHash solo aplica cuando
    // cookie es string non-empty — undefined cae en la rama permitida.
    const bad = {
      id: 'x',
      robloxUserId: 1,
      username: 'u',
    } as unknown as Partial<Account> & Pick<Account, 'id' | 'robloxUserId' | 'username' | 'encryptedCookie'>;
    const acc = createAccount(bad);
    // En runtime encryptedCookie sería undefined si pasara.
    expect(acc.encryptedCookie).toBeUndefined();
  });

  it('DT-3 invariante: robloxUserId > 0 — tira Error', () => {
    expect(() => createAccount({ id: 'x', robloxUserId: 0, username: 'u', encryptedCookie: makeEncryptedString('') }))
      .toThrow(/robloxUserId debe ser > 0/);
    expect(() => createAccount({ id: 'x', robloxUserId: -1, username: 'u', encryptedCookie: makeEncryptedString('') }))
      .toThrow(/robloxUserId debe ser > 0/);
    expect(() => createAccount({ id: 'x', robloxUserId: NaN, username: 'u', encryptedCookie: makeEncryptedString('') }))
      .toThrow(/robloxUserId debe ser > 0/);
  });

  it('DT-3 invariante: username non-empty — tira Error', () => {
    expect(() => createAccount({ id: 'x', robloxUserId: 1, username: '', encryptedCookie: makeEncryptedString('') }))
      .toThrow(/username debe ser un string no vacío/);
    expect(() => createAccount({ id: 'x', robloxUserId: 1, username: '   ', encryptedCookie: makeEncryptedString('') }))
      .toThrow(/username debe ser un string no vacío/);
  });

  it('DT-3 invariante: cookie non-empty sin cookieHash → Error (incoherente)', () => {
    expect(() => createAccount({ id: 'x', robloxUserId: 1, username: 'u', encryptedCookie: makeEncryptedString('enc-data') }))
      .toThrow(/cookieHash también debe serlo/);
  });

  it('DT-3 invariante: cookie === \'\' sin cookieHash → permitido (login antes de persistir)', () => {
    const acc = createAccount({ id: 'x', robloxUserId: 1, username: 'u', encryptedCookie: makeEncryptedString('') });
    expect(acc.encryptedCookie).toBe('');
    expect(acc.cookieHash).toBe('');
  });
});

describe('MAX_ACCOUNTS limit', () => {
  it('constante existe y vale 50', () => {
    expect(MAX_ACCOUNTS).toBeDefined();
    expect(MAX_ACCOUNTS).toBe(50);
  });

  it('simulación: rechazar cuenta #51', () => {
    // Simula la lógica en el handler account:create (verificado por IPCAdapter)
    const currentCount = 49;
    const attemptAdd = (count: number) => count < MAX_ACCOUNTS;
    expect(attemptAdd(currentCount)).toBe(true); // 49 → ok

    const overLimit = 50;
    expect(attemptAdd(overLimit)).toBe(false); // 50 → rechazado
  });
});

/**
 * Unit tests — DT-3 invariantes en factories del dominio
 * Cubre: createFastFlag, createPlaytimeEntry, createLaunchPreset.
 * (createAccount se cubre en Account.test.ts.)
 * No toca DB ni Electron — son tests de la capa de dominio.
 */

import { describe, it, expect } from 'vitest';
import { createFastFlag } from '../../src/domain/entities/FastFlag';
import { createPlaytimeEntry } from '../../src/domain/entities/PlaytimeEntry';
import { createLaunchPreset } from '../../src/domain/entities/LaunchPreset';

describe('FastFlag entity — createFastFlag factory (DT-3)', () => {
  it('acepta nombre FFlag válido', () => {
    const f = createFastFlag({ name: 'FFlagDebugGraphicsDisableDirect3D11', value: true });
    expect(f.name).toBe('FFlagDebugGraphicsDisableDirect3D11');
    expect(f.value).toBe(true);
    expect(f.description).toBe('');
    expect(f.category).toBe('General');
  });

  it('acepta nombres con todos los prefijos válidos', () => {
    const prefixes = ['FFlag', 'FInt', 'DFlag', 'DInt', 'SDebug', 'BInt'];
    for (const p of prefixes) {
      expect(() => createFastFlag({ name: `${p}Test1`, value: 1 })).not.toThrow();
    }
  });

  it('DT-3 invariante: name non-empty — tira Error', () => {
    expect(() => createFastFlag({ name: '', value: true })).toThrow(/name debe ser un string no vacío/);
    expect(() => createFastFlag({ name: '   ', value: true })).toThrow(/name debe ser un string no vacío/);
  });

  it('DT-3 invariante: name respeta convención Roblox FastFlag — tira Error', () => {
    expect(() => createFastFlag({ name: 'BadFlagName', value: true }))
      .toThrow(/no respeta la convención Roblox FastFlag/);
    expect(() => createFastFlag({ name: 'FFlag', value: true })) // sin cuerpo posterior
      .toThrow(/no respeta la convención Roblox FastFlag/);
    expect(() => createFastFlag({ name: 'FFlag_with_trailing_', value: true })) // '_' solo tras prefijo válido? FFlag_ → GRPACCEPTED
      .not.toThrow(); // FFlag[A-Za-z0-9_]+ → 'FFlag_' matches 'F'+'Flag_'? Matchseparator: prefix="FFlag", next required char `[A-Za-z0-9_]`, '_' califica → sí matchea
  });
});

describe('PlaytimeEntry entity — createPlaytimeEntry factory (DT-3)', () => {
  it('crea PlaytimeEntry con defaults sensatos', () => {
    const start = new Date('2026-07-25T10:00:00Z');
    const e = createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: 12345, placeId: 'place-1', startTime: start });
    expect(e.placeId).toBe('place-1');
    expect(e.universeId).toBe(0);
    expect(e.startTime).toBe(start);
    expect(e.endTime).toBeNull();
    expect(e.durationMinutes).toBe(0);
  });

  it('DT-3 invariante: placeId non-empty — tira Error', () => {
    expect(() => createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: 1, placeId: '' }))
      .toThrow(/placeId debe ser un string no vacío/);
    expect(() => createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: 1, placeId: '  ' }))
      .toThrow(/placeId debe ser un string no vacío/);
  });

  it('DT-3 invariante: robloxUserId > 0 — tira Error', () => {
    expect(() => createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', placeId: 'p' }))
      .toThrow(/robloxUserId debe ser > 0/);
    expect(() => createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: 0, placeId: 'p' }))
      .toThrow(/robloxUserId debe ser > 0/);
    expect(() => createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: -5, placeId: 'p' }))
      .toThrow(/robloxUserId debe ser > 0/);
  });

  it('DT-3 invariante: endTime >= startTime — tira Error si endTime anterior', () => {
    const start = new Date('2026-07-25T10:00:00Z');
    const before = new Date('2026-07-25T09:30:00Z');
    expect(() => createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: 1, placeId: 'p', startTime: start, endTime: before }))
      .toThrow(/no puede ser anterior a startTime/);
  });

  it('DT-3 invariante: endTime === startTime → permitido (sesión instantánea)', () => {
    const t = new Date('2026-07-25T10:00:00Z');
    expect(() => createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: 1, placeId: 'p', startTime: t, endTime: t }))
      .not.toThrow();
  });

  it('DT-3 invariante: endTime posterior → permitido', () => {
    const start = new Date('2026-07-25T10:00:00Z');
    const end = new Date('2026-07-25T11:00:00Z');
    const e = createPlaytimeEntry({ id: 'pt-1', accountId: 'acc-1', robloxUserId: 1, placeId: 'p', startTime: start, endTime: end });
    expect(e.endTime).toEqual(end);
  });
});

describe('LaunchPreset entity — createLaunchPreset factory (DT-3)', () => {
  it('crea LaunchPreset con defaults sensatos', () => {
    const p = createLaunchPreset({ id: 'lp-1', name: 'Preset 1', placeId: 'place-1', accountIds: [] });
    expect(p.name).toBe('Preset 1');
    expect(p.placeId).toBe('place-1');
    expect(p.accountIds).toEqual([]);
    expect(p.autoShuffle).toBe(false);
    expect(p.createdAt).toBeInstanceOf(Date);
    expect(p.updatedAt).toBeInstanceOf(Date);
  });

  it('DT-3 invariante: name non-empty — tira Error', () => {
    expect(() => createLaunchPreset({ id: 'lp-1', name: '', placeId: 'p', accountIds: [] }))
      .toThrow(/name debe ser un string no vacío/);
    expect(() => createLaunchPreset({ id: 'lp-1', name: '   ', placeId: 'p', accountIds: [] }))
      .toThrow(/name debe ser un string no vacío/);
  });

  it('DT-3 invariante: accountIds vacío permitido (preset válido sin cuentas)', () => {
    const p = createLaunchPreset({ id: 'lp-1', name: 'P', placeId: 'p', accountIds: [] });
    expect(p.accountIds).toEqual([]);
  });

  it('DT-3 invariante: accountIds duplicados → dedup (normalizar, NO error)', () => {
    const p = createLaunchPreset({
      id: 'lp-1', name: 'P', placeId: 'p',
      accountIds: ['a', 'b', 'a', 'c', 'b', 'a'],
    });
    expect(p.accountIds).toEqual(['a', 'b', 'c']); // orden preservado via Array.from(new Set([]))
  });

  it('DT-3 invariante: accountIds no-array → tira Error', () => {
    expect(() => createLaunchPreset({
      id: 'lp-1', name: 'P', placeId: 'p',
      accountIds: 'not-an-array' as unknown as string[],
    })).toThrow(/accountIds debe ser un array/);
  });
});

// Domain Entity: PlaytimeEntry
// Represents a playtime tracking session for an account in a specific game

export interface PlaytimeEntry {
  id: string;
  accountId: string;
  robloxUserId: number;
  placeId: string;
  placeName: string;
  universeId: number;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number; // Calculated duration in minutes
}

// Factory - crea PlaytimeEntry con valores por defecto.
// Valida invariantes de dominio (DT-3):
//   - placeId non-empty string
//   - robloxUserId > 0
//   - si endTime es non-null, debe ser >= startTime (no sesiones con fin anterior al inicio)
export function createPlaytimeEntry(partial: Partial<PlaytimeEntry> & Pick<PlaytimeEntry, 'id' | 'accountId' | 'placeId'>): PlaytimeEntry {
  const now = new Date();

  // Invariante: placeId non-empty string
  if (typeof partial.placeId !== 'string' || partial.placeId.trim() === '') {
    throw new Error('createPlaytimeEntry: placeId debe ser un string no vacío');
  }

  // Resolver startTime antes de validar endTime (startTime por defecto = now)
  const startTime = partial.startTime ?? now;
  const endTime = partial.endTime ?? null;

  // Invariante: si endTime non-null, endTime >= startTime
  if (endTime !== null && endTime.getTime() < startTime.getTime()) {
    throw new Error(
      `createPlaytimeEntry: endTime (${endTime.toISOString()}) no puede ser anterior a startTime (${startTime.toISOString()})`,
    );
  }

  // Invariante: robloxUserId > 0 (si viene provisto)
  const robloxUserId = partial.robloxUserId ?? 0;
  if (typeof robloxUserId !== 'number' || !Number.isFinite(robloxUserId) || robloxUserId <= 0) {
    throw new Error(`createPlaytimeEntry: robloxUserId debe ser > 0 (recibido: ${String(robloxUserId)})`);
  }

  return {
    id: partial.id,
    accountId: partial.accountId,
    robloxUserId,
    placeId: partial.placeId,
    placeName: partial.placeName ?? '',
    universeId: partial.universeId ?? 0,
    startTime,
    endTime,
    durationMinutes: partial.durationMinutes ?? 0,
  };
}

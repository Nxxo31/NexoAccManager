// Domain Entity: PlaytimeEntry
// Represents a playtime tracking session for an account in a specific game

export interface PlaytimeEntry {
  id: string;
  accountId: string;
  placeId: string;
  placeName: string;
  universeId: number;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number; // Calculated duration in minutes
}

// Factory - crea PlaytimeEntry con valores por defecto
export function createPlaytimeEntry(partial: Partial<PlaytimeEntry> & Pick<PlaytimeEntry, 'id' | 'accountId' | 'placeId'>): PlaytimeEntry {
  const now = new Date();
  return {
    id: partial.id,
    accountId: partial.accountId,
    placeId: partial.placeId,
    placeName: partial.placeName ?? '',
    universeId: partial.universeId ?? 0,
    startTime: partial.startTime ?? now,
    endTime: partial.endTime ?? null,
    durationMinutes: partial.durationMinutes ?? 0,
  };
}
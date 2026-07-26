// Domain Entity: LaunchPreset
// Represents a saved launch configuration for Roblox

export interface LaunchPreset {
  id: string;
  name: string;
  placeId: string;
  accountIds: string[]; // Array of account IDs
  autoShuffle: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Factory - crea LaunchPreset con valores por defecto.
// Valida invariantes de dominio (DT-3):
//   - name non-empty string
//   - accountIds array (puede ser vacío — preset válido sin cuentas)
//   - accountIds sin duplicados — si hay dupes se dedup con Set (normalizar, NO tirar error)
export function createLaunchPreset(partial: Partial<LaunchPreset> & Pick<LaunchPreset, 'id' | 'name' | 'placeId' | 'accountIds'>): LaunchPreset {
  const now = new Date();

  // Invariante: name non-empty string
  if (typeof partial.name !== 'string' || partial.name.trim() === '') {
    throw new Error('createLaunchPreset: name debe ser un string no vacío');
  }

  // Invariante: accountIds array — normalizar (dedup) sin error
  const rawIds = partial.accountIds;
  if (!Array.isArray(rawIds)) {
    throw new Error('createLaunchPreset: accountIds debe ser un array');
  }
  const accountIds = Array.from(new Set(rawIds));

  return {
    id: partial.id,
    name: partial.name,
    placeId: partial.placeId,
    accountIds,
    autoShuffle: partial.autoShuffle ?? false,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

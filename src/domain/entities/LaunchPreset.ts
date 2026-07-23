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

// Factory - crea LaunchPreset con valores por defecto
export function createLaunchPreset(partial: Partial<LaunchPreset> & Pick<LaunchPreset, 'id' | 'name' | 'placeId' | 'accountIds'>): LaunchPreset {
  const now = new Date();
  return {
    id: partial.id,
    name: partial.name,
    placeId: partial.placeId,
    accountIds: partial.accountIds,
    autoShuffle: partial.autoShuffle ?? false,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}
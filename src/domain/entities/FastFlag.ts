// Domain Entity: FastFlag
// Represents a Roblox ClientAppSettings flag

export interface FastFlag {
  name: string;
  value: string | number | boolean;
  description?: string;
  category?: string;
}

export function createFastFlag(partial: Partial<FastFlag> & Pick<FastFlag, 'name' | 'value'>): FastFlag {
  return {
    name: partial.name,
    value: partial.value,
    description: partial.description ?? '',
    category: partial.category ?? 'General',
  };
}
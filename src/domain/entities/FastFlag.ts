// Domain Entity: FastFlag
// Represents a Roblox ClientAppSettings flag

export interface FastFlag {
  name: string;
  value: string | number | boolean;
  description?: string;
  category?: string;
}

// Convención de nombres de Roblox FastFlag:
//   FFlag* (boolean), FInt* (int), DFlag* (debug bool), DInt* (debug int),
//   SDebug* (string debug), BInt* (boundary int).
// Fuente: ClientAppSettings.json — Roblox runtime resuelve nombres con estos prefijos.
const FAST_FLAG_NAME_REGEX = /^(FFlag|FInt|DFlag|DInt|SDebug|BInt)[A-Za-z0-9_]+$/;

// Factory — crea FastFlag con defaults sensatos.
// Valida invariantes de dominio (DT-3):
//   - name non-empty string
//   - name debe respetar la convención Roblox (regex FAST_FLAG_NAME_REGEX)
export function createFastFlag(partial: Partial<FastFlag> & Pick<FastFlag, 'name' | 'value'>): FastFlag {
  // Invariante: name non-empty string
  if (typeof partial.name !== 'string' || partial.name.trim() === '') {
    throw new Error('createFastFlag: name debe ser un string no vacío');
  }
  // Invariante: name respeta convención Roblox FastFlag
  if (!FAST_FLAG_NAME_REGEX.test(partial.name)) {
    throw new Error(
      `createFastFlag: name "${partial.name}" no respeta la convención Roblox FastFlag. ` +
      'Debe empezar con uno de: FFlag, FInt, DFlag, DInt, SDebug, BInt seguido de [A-Za-z0-9_]+',
    );
  }

  return {
    name: partial.name,
    value: partial.value,
    description: partial.description ?? '',
    category: partial.category ?? 'General',
  };
}

// Domain Branded Type: EncryptedString
// Marca un string como "cifrado" a nivel de tipos. El dominio tipifica que
// `EncryptedString` es un valor que pasó por CryptoService.encrypt() y NO es
// texto plano. Esto evita que callers pasen credenciales descifradas a
// entidades de dominio por accidente.
//
// El branded type NO añade comprobación runtime — es una invariant de tipos.
// El único productor válido de EncryptedString es el CryptoService en
// infraestructura (vía makeEncryptedString en el boundary de DB, o
// directamente al envolver encrypt()).

declare const encryptedBrand: unique symbol;

export type EncryptedString = string & { readonly _brand: typeof encryptedBrand };

/**
 * Convierte un string plano (proveniente de la DB o de encrypt()) en
 * EncryptedString. Debe usarse ÚNICAMENTE en el boundary de infraestructura:
 * - AccountRepositoryImpl al leer `encrypted_cookie` / `password` de SQLite
 * - IPCAdapter / LocalApiService al envolver `encrypt(...)` antes de persistir
 *
 * NO usar en código de dominio ni en renderer — renderer nunca debe tener
 * credenciales cifradas ni descifradas en la mano.
 */
export function makeEncryptedString(s: string): EncryptedString {
  return s as EncryptedString;
}

/**
 * Comprobación runtime placeholder. En producción actual todo string
 * proveniente de la DB se trata como EncryptedString en el boundary.
 * Reservado para futura verificación con tagged prefix MAC si se añade.
 */
export function isEncryptedString(s: string): s is EncryptedString {
  return typeof s === 'string' && s.length >= 0;
}

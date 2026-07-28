// Domain Branded Type: EncryptedString
// Marks a string as "encrypted" at the type level. Domain convention:
// `EncryptedString` is a value that has passed through CryptoService.encrypt()
// and is NOT plaintext. This prevents callers from passing raw credentials to
// domain entities by accident.
//
// The only valid producer of EncryptedString is makeEncryptedString() below,
// called at the infrastructure boundary (AccountRepositoryImpl reading from
// SQLite, or IPCAdapter/LocalApiService wrapping encrypt()). The unique symbol
// is deliberately NOT exported — keeping it private preserves the invariant.
//
// DO NOT use in domain code or renderer — the renderer must never hold
// encrypted or decrypted credentials.
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

// The unique symbol is private by design — see comment block above.
// `declare const` is compile-time only; no runtime reference needed.
export {};

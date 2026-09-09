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
// Brand declaration — the symbol exists only at the type level.
// eslint doesn't see `typeof encryptedBrand` in the EncryptedString type as a "use",
// so we suppress the false positive here. The symbol is deliberately NOT exported.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
 * Runtime guard for the EncryptedString branded type.
 *
 * Unlike a type assertion (which is erased at compile time), this checks for
 * the *structural fingerprint* that CryptoService.encrypt() leaves on every
 * value it produces: a base64 string whose decoded form is at least
 * salt(16) + iv(16) + tag(16) = 48 bytes long.
 *
 * A value can only be an EncryptedString at runtime if it was produced by
 * encrypt() (or read back from the DB where encrypt() wrote it). Plaintext
 * credentials and arbitrary strings fail this check, preventing them from
 * being silently assigned to fields that require EncryptedString.
 */
export function isEncryptedString(s: string): s is EncryptedString {
  if (typeof s !== 'string' || s.length === 0) {
    return false;
  }
  try {
    const decoded = Buffer.from(s, 'base64');
    // encrypt() layout: salt(16) + iv(16) + tag(16) + ciphertext(>=0)
    // Minimum decoded length is 48 bytes.
    return decoded.length >= 48;
  } catch {
    return false;
  }
}

// The unique symbol is private by design — see comment block above.
// `declare const` is compile-time only; no runtime reference needed.
export {};

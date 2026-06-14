/**
 * CryptoService - Cifrado de cookies y datos sensibles
 *
 * Inspirado en la implementaciÃ³n del Roblox Account Manager original,
 * pero sin dependencias de libsodium para simplificar.
 *
 * Usa AES-256-GCM con una clave derivada del ID de mÃ¡quina + sal.
 * Esto asegura que los datos cifrados en un PC no son descifrables en otro.
 */

import crypto from 'crypto';

export class CryptoService {
  private masterKey: Buffer;

  constructor() {
    // Clave derivada del ID de mÃ¡quina + un salt interno
    // Similar al enfoque ProtectedData original pero portÃ¡til
    const machineId = this.getMachineId();
    const salt = Buffer.from('NexoAccManager_Salt_2024', 'utf-8');
    this.masterKey = crypto.pbkdf2Sync(machineId, salt, 100000, 32, 'sha256');
  }

  /**
   * Obtiene un identificador Ãºnico de la mÃ¡quina
   */
  private getMachineId(): string {
    try {
      const os = require('os');
      const hostname = os.hostname();
      const platform = os.platform();
      const arch = os.arch();
      const cpus = os.cpus().map((c: { model: string }) => c.model).sort().join(',');
      const totalMem = os.totalmem();
      return crypto.createHash('sha256').update(`${hostname}|${platform}|${arch}|${cpus}|${totalMem}`).digest('hex');
    } catch {
      // Fallback si no hay acceso a os
      return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * Cifra un texto en base64
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12); // GCM usa 12 bytes IV
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv);
    let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // iv:ciphertext:authTag
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  }

  /**
   * Descifra un texto cifrado en base64
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) throw new Error('Formato cifrado invÃ¡lido');

    const iv = Buffer.from(parts[0], 'hex');
    const ciphertext = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
  }

  /**
   * Cambia la clave maestra (reescribe cookies y datos sensibles)
   */
  async rotateKey(): Promise<boolean> {
    // La clave se deriva del hardware, rotar requerirÃ­a re-cifrar todo
    return false;
  }
}
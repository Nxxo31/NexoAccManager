/**
 * Servicio de autenticación para manejo de JWT y licencia
 */
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../storage/DatabaseManager';

/** 
 * Licencia del usuario para control de planes y límites
 */
export interface LicenseData {
  plan: 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  accountLimit: number;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING';
  currentPeriodEnd: string; // ISO date string
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  license: LicenseData;
  iat: number;
  exp: number;
}

export class AuthService {
  private db: DatabaseManager;
  private jwtSecret: string;

  constructor(db: DatabaseManager) {
    this.db = db;
    // In production, this should come from environment variables
    this.jwtSecret = process.env.JWT_SECRET || 'nexojwtsecretkey_' + uuidv4();
  }

  /**
   * Genera un JWT para el usuario basado en su licencia
   */
  generateToken(userId: string, email: string, license: LicenseData): string {
    const payload: JwtPayload = {
      userId,
      email,
      license,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 días
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Verifica y decodifica un JWT
   * @returns El payload si es válido, null si no lo es
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return payload;
    } catch (error) {
      console.error('Error verifying JWT:', error);
      return null;
    }
  }

  /**
   * Obtiene la licencia del usuario desde el almacenamiento
   * Nota: La implementación real usará electron-store en el renderer
   */
  async getLicenseFromStorage(): Promise<LicenseData | null> {
    // Placeholder - se implementará con electron-store en el renderer
    return null;
  }

  /**
   * Guarda la licencia del usuario en el almacenamiento
   * Nota: La implementación real usará electron-store en el renderer
   */
  async saveLicenseToStorage(license: LicenseData): Promise<void> {
    // Placeholder - se implementará con electron-store en el renderer
  }

  /**
   * Verifica si la licencia actual permite agregar más cuentas
   */
  async canAddAccount(currentAccountCount: number): Promise<boolean> {
    const license = await this.getLicenseFromStorage();
    if (!license) {
      // Si no hay licencia, asumimos plan gratuito (5 cuentas)
      return currentAccountCount < 5;
    }
    return currentAccountCount < license.accountLimit;
  }

  /**
   * Obtiene el plan actual del usuario
   */
  async getCurrentPlan(): Promise<'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'> {
    const license = await this.getLicenseFromStorage();
    if (!license) {
      return 'FREE';
    }
    return license.plan;
  }

  /**
   * Renueva el token si está próximo a expirar (dentro de 24 horas)
   */
  async refreshTokenIfNeeded(currentToken: string): Promise<string | null> {
    const payload = this.verifyToken(currentToken);
    if (!payload) {
      return null;
    }

    // Renovar si falta menos de 24 horas para expirar
    const twentyFourHoursInSeconds = 24 * 60 * 60;
    if (payload.exp - Math.floor(Date.now() / 1000) < twentyFourHoursInSeconds) {
      // Generar nuevo token con los mismos datos
      return this.generateToken(payload.userId, payload.email, payload.license);
    }

    return null; // No necesita renovación
  }
}
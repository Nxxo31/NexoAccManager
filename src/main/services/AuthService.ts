/**
 * Servicio de autenticación para manejo de JWT y licencia
 */
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseManager } from '../storage/DatabaseManager';
import { LicenseService } from '../core/LicenseService';

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
  private licenseService: LicenseService;

  constructor(db: DatabaseManager) {
    this.db = db;
    this.licenseService = new LicenseService(db);
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
   */
  async getLicenseFromStorage(): Promise<LicenseData | null> {
    const settings = this.licenseService.getSettings();
    // Map LicenseSettings to LicenseData
    return {
      plan: settings.plan,
      accountLimit: settings.accountLimit,
      status: settings.status as LicenseData['status'], // Assume compatible
      currentPeriodEnd: settings.currentPeriodEnd ?? new Date().toISOString(), // fallback
      stripeCustomerId: settings.stripeCustomerId,
      stripeSubscriptionId: settings.stripeSubscriptionId,
    };
  }

  /**
   * Guarda la licencia del usuario en el almacenamiento
   */
  async saveLicenseToStorage(license: LicenseData): Promise<void> {
    await this.licenseService.setSettings({
      plan: license.plan,
      accountLimit: license.accountLimit,
      status: license.status,
      currentPeriodEnd: license.currentPeriodEnd,
      stripeCustomerId: license.stripeCustomerId,
      stripeSubscriptionId: license.stripeSubscriptionId,
    });
  }

  /**
   * Verifica si la licencia actual permite agregar más cuentas
   */
  async canAddAccount(currentAccountCount: number): Promise<boolean> {
    const settings = this.licenseService.getSettings();
    return currentAccountCount < settings.accountLimit;
  }

  /**
   * Obtiene el plan actual del usuario
   */
  async getCurrentPlan(): Promise<'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'> {
    return this.licenseService.getSettings().plan;
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

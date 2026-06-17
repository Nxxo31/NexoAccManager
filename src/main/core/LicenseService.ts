import { DatabaseManager } from '../storage/DatabaseManager';

export type Plan = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING' | 'TRIAL';

export interface LicenseSettings {
  plan: Plan;
  accountLimit: number;
  status: LicenseStatus;
  currentPeriodEnd?: string; // ISO string
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

const DEFAULT_LICENSE: LicenseSettings = {
  plan: 'FREE',
  accountLimit: 5,
  status: 'ACTIVE',
};

export class LicenseService {
  private readonly db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  getSettings(): LicenseSettings {
    try {
      const plan = this.db.getSetting('plan') as Plan || DEFAULT_LICENSE.plan;
      const accountLimit = Number(this.db.getSetting('accountLimit')) || DEFAULT_LICENSE.accountLimit;
      const status = this.db.getSetting('licenseStatus') as LicenseStatus || DEFAULT_LICENSE.status;
      const currentPeriodEnd = this.db.getSetting('currentPeriodEnd');
      const stripeCustomerId = this.db.getSetting('stripeCustomerId');
      const stripeSubscriptionId = this.db.getSetting('stripeSubscriptionId');

      return {
        plan,
        accountLimit,
        status,
        ...(currentPeriodEnd !== undefined ? { currentPeriodEnd } : {}),
        ...(stripeCustomerId !== undefined ? { stripeCustomerId } : {}),
        ...(stripeSubscriptionId !== undefined ? { stripeSubscriptionId } : {}),
      };
    } catch (e) {
      console.error('Error loading license settings, using defaults:', e);
      return DEFAULT_LICENSE;
    }
  }

  setSettings(settings: Partial<LicenseSettings>): LicenseSettings {
    const current = this.getSettings();
    const merged = { ...current, ...settings };

    // Validate and store each setting individually
    if (merged.plan !== undefined) {
      this.db.setSetting('plan', merged.plan);
    }
    if (merged.accountLimit !== undefined) {
      this.db.setSetting('accountLimit', merged.accountLimit.toString());
    }
    if (merged.status !== undefined) {
      this.db.setSetting('licenseStatus', merged.status);
    }
    if (merged.currentPeriodEnd !== undefined) {
      this.db.setSetting('currentPeriodEnd', merged.currentPeriodEnd);
    }
    if (merged.stripeCustomerId !== undefined) {
      this.db.setSetting('stripeCustomerId', merged.stripeCustomerId);
    }
    if (merged.stripeSubscriptionId !== undefined) {
      this.db.setSetting('stripeSubscriptionId', merged.stripeSubscriptionId);
    }

    return merged;
  }

  // Convenience methods
  getPlan(): Plan {
    return this.getSettings().plan;
  }

  getAccountLimit(): number {
    return this.getSettings().accountLimit;
  }

  isActive(): boolean {
    const status = this.getSettings().status;
    return status === 'ACTIVE' || status === 'TRIAL';
  }

  isExpired(): boolean {
    return this.getSettings().status === 'EXPIRED';
  }
}

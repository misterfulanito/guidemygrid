// src/types/license.types.ts

export type LicenseTier = 'free' | 'pro';

export interface LicenseStatus {
  tier: LicenseTier;
  isActive: boolean;
  expiresAt?: string;       // ISO 8601, solo para Pro con suscripción
}

export interface FeatureGate {
  feature: string;
  requiredTier: LicenseTier;
  isAllowed: (license: LicenseStatus) => boolean;
}

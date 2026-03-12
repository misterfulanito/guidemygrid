// src/types/license.types.ts

export type LicenseTier = 'free' | 'pro';

export interface LicenseStatus {
  tier: LicenseTier;
  isActive: boolean;
  expiresAt?: string;       // ISO 8601, only for Pro subscription
}

export interface FeatureGate {
  feature: string;
  requiredTier: LicenseTier;
  isAllowed: (license: LicenseStatus) => boolean;
}

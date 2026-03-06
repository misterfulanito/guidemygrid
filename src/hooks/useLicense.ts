// src/hooks/useLicense.ts
import { LicenseStatus } from '../types';

// MVP: plugin es gratuito. Todo el mundo es Free tier.
// Post-MVP: implementar uxp.entitlement.checkStatus()
export function useLicense(): LicenseStatus {
  return {
    tier: 'free',
    isActive: true,
  };
}

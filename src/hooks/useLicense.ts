// src/hooks/useLicense.ts
import { LicenseStatus } from '../types';

// MVP: plugin is free. Everyone is on the Free tier.
// Post-MVP: implement uxp.entitlement.checkStatus()
export function useLicense(): LicenseStatus {
  return {
    tier: 'free',
    isActive: true,
  };
}

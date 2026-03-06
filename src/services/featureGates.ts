// src/services/featureGates.ts
import { LicenseStatus } from '../types';

export const gates = {
  canUseRows: (l: LicenseStatus) => l.tier === 'pro',
  canUseMoreThan12Columns: (l: LicenseStatus) => l.tier === 'pro',
  canSaveMoreThan3Presets: (l: LicenseStatus, currentCount: number) =>
    l.tier === 'pro' || currentCount < 3,
  canApplyToSelection: (l: LicenseStatus) => l.tier === 'pro',
};

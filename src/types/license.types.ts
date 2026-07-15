/*
 * GuideMyGrid
 * Copyright (c) 2026 Huriata Bonilla Peña. All Rights Reserved.
 *
 * This file is published for viewing and reference only. No permission is
 * granted to use, copy, modify, or distribute this software without the prior
 * written consent of the copyright holder. See the LICENSE file for details.
 */

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

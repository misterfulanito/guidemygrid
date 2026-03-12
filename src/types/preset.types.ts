// src/types/preset.types.ts

import { GridConfig } from './grid.types';

export type PresetId = string; // UUID v4

export interface Preset {
  id: PresetId;
  name: string;             // User-visible name
  description?: string;     // Optional: preset description
  config: GridConfig;       // Full configuration snapshot
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  isBuiltIn: boolean;       // true for built-in presets (not editable)
}

export interface PresetsStorage {
  version: number;          // For future migrations (initially 1)
  presets: Preset[];
}

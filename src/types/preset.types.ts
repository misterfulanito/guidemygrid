// src/types/preset.types.ts

import { GridConfig } from './grid.types';

export type PresetId = string; // UUID v4

export interface Preset {
  id: PresetId;
  name: string;             // Nombre visible al usuario
  description?: string;     // Opcional: descripción del preset
  config: GridConfig;       // Snapshot completo de la configuración
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  isBuiltIn: boolean;       // true para presets pre-incluidos (no editables)
}

export interface PresetsStorage {
  version: number;          // Para migraciones futuras (inicialmente 1)
  presets: Preset[];
}

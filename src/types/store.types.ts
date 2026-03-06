// src/types/store.types.ts

import {
  GridConfig,
  ColumnConfig,
  RowConfig,
  MarginsConfig,
  ApplyTarget,
  ApplyMode,
} from './grid.types';
import { Preset, PresetId } from './preset.types';

export interface GridStore {
  config: GridConfig;
  setColumnConfig: (config: Partial<ColumnConfig>) => void;
  setRowConfig: (config: Partial<RowConfig>) => void;
  setMarginsConfig: (config: Partial<MarginsConfig>) => void;
  setApplyTarget: (target: ApplyTarget) => void;
  setApplyMode: (mode: ApplyMode) => void;
  resetToDefaults: () => void;
  loadFromPreset: (preset: Preset) => void;
}

export interface PresetsStore {
  presets: Preset[];
  addPreset: (name: string, config: GridConfig) => void;
  updatePreset: (id: PresetId, updates: Partial<Pick<Preset, 'name' | 'description'>>) => void;
  deletePreset: (id: PresetId) => void;
  applyPreset: (id: PresetId) => void;
}

export interface UIStore {
  activeTab: 'grid' | 'presets';
  isApplying: boolean;
  lastError: string | null;
  lastSuccess: boolean;
  setActiveTab: (tab: UIStore['activeTab']) => void;
  setApplying: (state: boolean) => void;
  setError: (message: string | null) => void;
  setSuccess: (state: boolean) => void;
}

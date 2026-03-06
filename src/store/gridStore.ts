// src/store/gridStore.ts
import { create } from 'zustand';
import { GridStore, DEFAULT_GRID_CONFIG, Preset } from '../types';

export const useGridStore = create<GridStore>((set) => ({
  config: DEFAULT_GRID_CONFIG,

  setColumnConfig: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        columns: { ...state.config.columns, ...partial },
      },
    })),

  setRowConfig: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        rows: { ...state.config.rows, ...partial },
      },
    })),

  setMarginsConfig: (partial) =>
    set((state) => ({
      config: {
        ...state.config,
        margins: { ...state.config.margins, ...partial },
      },
    })),

  setApplyTarget: (target) =>
    set((state) => ({ config: { ...state.config, applyTarget: target } })),

  setApplyMode: (mode) =>
    set((state) => ({ config: { ...state.config, applyMode: mode } })),

  resetToDefaults: () => set({ config: DEFAULT_GRID_CONFIG }),

  loadFromPreset: (preset: Preset) =>
    set({ config: preset.config }),
}));

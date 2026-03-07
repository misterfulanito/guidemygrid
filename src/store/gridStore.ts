// src/store/gridStore.ts
import { create } from 'zustand';
import { GridStore, DEFAULT_GRID_CONFIG, Preset } from '../types';

const LS_BORDER_GUIDES = 'gmg_borderGuides';
const LS_LINKED_MARGINS = 'gmg_linkedMargins';

function readBool(key: string, defaultVal: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return defaultVal;
    return v === 'true';
  } catch {
    return defaultVal;
  }
}

export const useGridStore = create<GridStore>((set) => ({
  config: DEFAULT_GRID_CONFIG,
  borderGuides: readBool(LS_BORDER_GUIDES, true),
  linkedMargins: readBool(LS_LINKED_MARGINS, false),

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

  setBorderGuides: (v) => {
    try { localStorage.setItem(LS_BORDER_GUIDES, String(v)); } catch { /* noop */ }
    set({ borderGuides: v });
  },

  setLinkedMargins: (v) => {
    try { localStorage.setItem(LS_LINKED_MARGINS, String(v)); } catch { /* noop */ }
    set({ linkedMargins: v });
  },

  resetToDefaults: () => set({ config: DEFAULT_GRID_CONFIG }),

  loadFromPreset: (preset: Preset) =>
    set({ config: preset.config }),
}));

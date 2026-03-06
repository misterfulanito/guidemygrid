// src/store/presetsStore.ts
import { create } from 'zustand';
import { PresetsStore, Preset, GridConfig } from '../types';
import { presetStorage } from '../services/presetStorage';
import { useGridStore } from './gridStore';

export const usePresetsStore = create<PresetsStore>((set, get) => ({
  presets: presetStorage.load(),

  addPreset: (name: string, config: GridConfig) => {
    const preset: Preset = {
      id: crypto.randomUUID(),
      name,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false,
    };
    const presets = [...get().presets, preset];
    presetStorage.save(presets);
    set({ presets });
  },

  updatePreset: (id, updates) => {
    const presets = get().presets.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    presetStorage.save(presets);
    set({ presets });
  },

  deletePreset: (id) => {
    // No se puede eliminar presets built-in
    const presets = get().presets.filter((p) => p.id !== id || p.isBuiltIn);
    presetStorage.save(presets);
    set({ presets });
  },

  applyPreset: (id) => {
    const preset = get().presets.find((p) => p.id === id);
    if (preset) {
      useGridStore.getState().loadFromPreset(preset);
    }
  },
}));

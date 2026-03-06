// src/services/presetStorage.ts
import { Preset, PresetsStorage } from '../types';
import { DEFAULT_GRID_CONFIG, DEFAULT_COLUMN_CONFIG, DEFAULT_ROW_CONFIG } from '../types';

const STORAGE_KEY = 'guidemygrid_presets';
const CURRENT_VERSION = 1;

export const presetStorage = {
  load(): Preset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [...builtInPresets];
      const data: PresetsStorage = JSON.parse(raw);
      if (data.version !== CURRENT_VERSION) {
        return migrate(data);
      }
      return [...builtInPresets, ...data.presets];
    } catch {
      return [...builtInPresets];
    }
  },

  save(presets: Preset[]): void {
    const userPresets = presets.filter((p) => !p.isBuiltIn);
    const data: PresetsStorage = { version: CURRENT_VERSION, presets: userPresets };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },
};

// Presets pre-incluidos (siempre disponibles, no cuentan para el límite Free)
const builtInPresets: Preset[] = [
  {
    id: 'built-in-12col',
    name: '12-col Web',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    config: {
      ...DEFAULT_GRID_CONFIG,
      columns: { ...DEFAULT_COLUMN_CONFIG, columns: 12, gutter: 24, marginLeft: 80, marginRight: 80 },
    },
  },
  {
    id: 'built-in-8pt',
    name: '8pt Grid',
    isBuiltIn: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    config: {
      ...DEFAULT_GRID_CONFIG,
      rows: { ...DEFAULT_ROW_CONFIG, enabled: true, rowHeight: 'fixed', rowHeightValue: 8, rows: 20 },
    },
  },
];

function migrate(_data: PresetsStorage): Preset[] {
  // Migraciones futuras si cambia el schema
  return [...builtInPresets];
}

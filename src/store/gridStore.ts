// src/store/gridStore.ts
import { create } from 'zustand';
import { GridStore } from '../types';

export const useGridStore = create<GridStore>((set) => ({
  columns: { count: '', gutter: '' },

  setColumns: (partial) =>
    set((state) => ({ columns: { ...state.columns, ...partial } })),

  rows: { count: '', gutter: '' },
  setRows: (partial) =>
    set((state) => ({ rows: { ...state.rows, ...partial } })),
}));

// src/types/store.types.ts

export interface ColumnsState {
  count: string;  // '' or numeric string
  gutter: string; // '' or numeric string
}

export interface GridStore {
  columns: ColumnsState;
  setColumns: (partial: Partial<ColumnsState>) => void;
}

export interface UIStore {
  guidesVisible: boolean;
  isApplying: boolean;
  lastError: string | null;
  setGuidesVisible: (v: boolean) => void;
  setApplying: (state: boolean) => void;
  setError: (message: string | null) => void;
}

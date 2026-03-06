// src/types/grid.types.ts

export type WidthMode = 'auto' | 'fixed';
export type GuideOrientation = 'horizontal' | 'vertical';
export type ApplyTarget = 'canvas' | 'selection';
export type ApplyMode = 'replace' | 'add';

export interface ColumnConfig {
  enabled: boolean;
  columns: number;          // 1–24
  columnWidth: WidthMode;   // 'auto' o valor fijo
  columnWidthValue: number; // px, usado solo si columnWidth === 'fixed'
  gutter: number;           // px entre columnas
  marginLeft: number;       // offset desde borde izquierdo
  marginRight: number;      // offset desde borde derecho
}

export interface RowConfig {
  enabled: boolean;
  rows: number;             // 1–100
  rowHeight: WidthMode;
  rowHeightValue: number;   // px, usado solo si rowHeight === 'fixed'
  gutter: number;           // px entre filas
  marginTop: number;
  marginBottom: number;
}

export interface MarginsConfig {
  enabled: boolean;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GridConfig {
  columns: ColumnConfig;
  rows: RowConfig;
  margins: MarginsConfig;
  applyTarget: ApplyTarget;
  applyMode: ApplyMode;
}

export interface GuidePosition {
  position: number;         // px desde el origen del documento/selección
  orientation: GuideOrientation;
}

export interface GeneratedGuides {
  vertical: number[];       // posiciones x absolutas (px)
  horizontal: number[];     // posiciones y absolutas (px)
}

export const DEFAULT_COLUMN_CONFIG: ColumnConfig = {
  enabled: true,
  columns: 12,
  columnWidth: 'auto',
  columnWidthValue: 80,
  gutter: 20,
  marginLeft: 0,
  marginRight: 0,
};

export const DEFAULT_ROW_CONFIG: RowConfig = {
  enabled: false,
  rows: 8,
  rowHeight: 'auto',
  rowHeightValue: 80,
  gutter: 0,
  marginTop: 0,
  marginBottom: 0,
};

export const DEFAULT_MARGINS_CONFIG: MarginsConfig = {
  enabled: false,
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: DEFAULT_COLUMN_CONFIG,
  rows: DEFAULT_ROW_CONFIG,
  margins: DEFAULT_MARGINS_CONFIG,
  applyTarget: 'canvas',
  applyMode: 'replace',
};

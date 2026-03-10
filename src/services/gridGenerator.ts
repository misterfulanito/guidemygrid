// src/services/gridGenerator.ts

export class GridGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GridGenerationError';
  }
}

/**
 * Generate vertical guide positions for a column grid.
 * Returns absolute X positions (left and right edge of each column).
 */
export function generateColumnGuides(params: {
  columns: number;
  gutter: number;
  containerWidth: number;
  offsetX: number;
}): number[] {
  const { columns, gutter, containerWidth, offsetX } = params;

  if (columns <= 0 || containerWidth <= 0) return [];

  const columnWidth = (containerWidth - (columns - 1) * gutter) / columns;

  if (columnWidth <= 0) {
    throw new GridGenerationError(
      `Gutter too large: column width would be ${Math.round(columnWidth)}px`
    );
  }

  const positions: number[] = [];
  for (let i = 0; i < columns; i++) {
    const left = offsetX + i * (columnWidth + gutter);
    const right = left + columnWidth;
    positions.push(Math.round(left * 100) / 100);
    positions.push(Math.round(right * 100) / 100);
  }

  return [...new Set(positions)].sort((a, b) => a - b);
}

/**
 * Generate horizontal guide positions for a row grid.
 * Returns absolute Y positions (top and bottom edge of each row).
 */
export function generateRowGuides(params: {
  rows: number;
  gutter: number;
  containerHeight: number;
  offsetY: number;
}): number[] {
  const { rows, gutter, containerHeight, offsetY } = params;

  if (rows <= 0 || containerHeight <= 0) return [];

  const rowHeight = (containerHeight - (rows - 1) * gutter) / rows;

  if (rowHeight <= 0) {
    throw new GridGenerationError(
      `Gutter too large: row height would be ${Math.round(rowHeight)}px`
    );
  }

  const positions: number[] = [];
  for (let i = 0; i < rows; i++) {
    const top = offsetY + i * (rowHeight + gutter);
    const bottom = top + rowHeight;
    positions.push(Math.round(top * 100) / 100);
    positions.push(Math.round(bottom * 100) / 100);
  }

  return [...new Set(positions)].sort((a, b) => a - b);
}

/**
 * Generate guide positions for margin offsets.
 * left/right → vertical (X), top/bottom → horizontal (Y).
 * Only generates a guide for fields with a positive value.
 */
export function generateMarginGuides(params: {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  containerWidth: number;
  containerHeight: number;
  offsetX: number;
  offsetY: number;
}): { vertical: number[]; horizontal: number[] } {
  const { top, bottom, left, right, containerWidth, containerHeight, offsetX, offsetY } = params;
  const vertical: number[] = [];
  const horizontal: number[] = [];

  if (left != null && left > 0)     vertical.push(Math.round((offsetX + left) * 100) / 100);
  if (right != null && right > 0)   vertical.push(Math.round((offsetX + containerWidth - right) * 100) / 100);
  if (top != null && top > 0)       horizontal.push(Math.round((offsetY + top) * 100) / 100);
  if (bottom != null && bottom > 0) horizontal.push(Math.round((offsetY + containerHeight - bottom) * 100) / 100);

  return {
    vertical: [...new Set(vertical)].sort((a, b) => a - b),
    horizontal: [...new Set(horizontal)].sort((a, b) => a - b),
  };
}

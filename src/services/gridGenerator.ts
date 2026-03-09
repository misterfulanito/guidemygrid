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

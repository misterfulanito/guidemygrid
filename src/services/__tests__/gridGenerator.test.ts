import { generateGuides, GridGenerationError } from '../gridGenerator';
import {
  DEFAULT_GRID_CONFIG,
  DEFAULT_COLUMN_CONFIG,
  DEFAULT_ROW_CONFIG,
  GridConfig,
} from '../../types';

// Helper para config de columnas limpia
function colConfig(overrides: Partial<typeof DEFAULT_COLUMN_CONFIG> = {}) {
  return {
    ...DEFAULT_GRID_CONFIG,
    columns: { ...DEFAULT_COLUMN_CONFIG, ...overrides },
    rows: { ...DEFAULT_ROW_CONFIG, enabled: false },
    margins: { ...DEFAULT_GRID_CONFIG.margins, enabled: false },
  } as GridConfig;
}

function rowConfig(overrides: Partial<typeof DEFAULT_ROW_CONFIG> = {}) {
  return {
    ...DEFAULT_GRID_CONFIG,
    columns: { ...DEFAULT_COLUMN_CONFIG, enabled: false },
    rows: { ...DEFAULT_ROW_CONFIG, enabled: true, ...overrides },
    margins: { ...DEFAULT_GRID_CONFIG.margins, enabled: false },
  } as GridConfig;
}

describe('generateGuides - columnas', () => {
  test('12 columnas auto, sin márgenes, sin gutter → guías deduplicadas', () => {
    const guides = generateGuides(
      colConfig({ enabled: true, columns: 12, columnWidth: 'auto', gutter: 0, marginLeft: 0, marginRight: 0 }),
      { width: 1200, height: 800 }
    );
    // gutter=0 → col i right == col i+1 left → dedup: [0, 100, 200, ..., 1200] = 13 posiciones
    expect(guides.vertical).toHaveLength(13);
    expect(guides.vertical[0]).toBe(0);
    expect(guides.vertical[1]).toBe(100); // 1200/12 = 100
    expect(guides.vertical[12]).toBe(1200);
    expect(guides.horizontal).toHaveLength(0);
  });

  test('columnas fijas de 100px, 3 columnas → posiciones exactas', () => {
    const guides = generateGuides(
      colConfig({ enabled: true, columns: 3, columnWidth: 'fixed', columnWidthValue: 100, gutter: 20, marginLeft: 0, marginRight: 0 }),
      { width: 360, height: 800 }
    );
    // col 0: [0, 100], col 1: [120, 220], col 2: [240, 340]
    expect(guides.vertical).toEqual([0, 100, 120, 220, 240, 340]);
  });

  test('márgenes superan el ancho → lanza GridGenerationError', () => {
    expect(() =>
      generateGuides(
        colConfig({ enabled: true, marginLeft: 700, marginRight: 700 }),
        { width: 1000, height: 800 }
      )
    ).toThrow(GridGenerationError);
  });

  test('gutter demasiado grande → lanza GridGenerationError', () => {
    // 2 columnas, gutter=1000px en 300px de ancho disponible → ancho negativo
    expect(() =>
      generateGuides(
        colConfig({ enabled: true, columns: 2, columnWidth: 'auto', gutter: 1000, marginLeft: 0, marginRight: 0 }),
        { width: 300, height: 800 }
      )
    ).toThrow(GridGenerationError);
  });

  test('con offsetX de selección → posiciones absolutas correctas', () => {
    const guides = generateGuides(
      colConfig({ enabled: true, columns: 2, columnWidth: 'auto', gutter: 0, marginLeft: 0, marginRight: 0 }),
      { width: 200, height: 100, offsetX: 50 }
    );
    // col 0: left=50, right=150. col 1: left=150 (dedup), right=250 → [50, 150, 250]
    expect(guides.vertical[0]).toBe(50);
    expect(guides.vertical[1]).toBe(150);
    expect(guides.vertical[2]).toBe(250);
    expect(guides.vertical).toEqual([50, 150, 250]);
  });

  test('columnas deshabilitadas → array vertical vacío', () => {
    const guides = generateGuides(
      colConfig({ enabled: false }),
      { width: 1200, height: 800 }
    );
    expect(guides.vertical).toHaveLength(0);
    expect(guides.horizontal).toHaveLength(0);
  });

  test('márgenes L/R aplicados correctamente con auto width', () => {
    const guides = generateGuides(
      colConfig({ enabled: true, columns: 2, columnWidth: 'auto', gutter: 0, marginLeft: 80, marginRight: 80 }),
      { width: 1920, height: 1080 }
    );
    // anchoDisponible = 1920 - 80 - 80 = 1760, colWidth = 880
    // col 0: [80, 960], col 1: [960, 1840]
    expect(guides.vertical[0]).toBe(80);
    expect(guides.vertical[guides.vertical.length - 1]).toBe(1840);
  });
});

describe('generateGuides - filas', () => {
  test('4 filas auto, sin márgenes, sin gutter → guías deduplicadas', () => {
    const guides = generateGuides(
      rowConfig({ rows: 4, rowHeight: 'auto', gutter: 0, marginTop: 0, marginBottom: 0 }),
      { width: 1200, height: 800 }
    );
    // gutter=0 → fila i bottom == fila i+1 top → dedup: [0, 200, 400, 600, 800] = 5 posiciones
    expect(guides.horizontal).toHaveLength(5);
    expect(guides.horizontal[0]).toBe(0);
    expect(guides.horizontal[1]).toBe(200); // 800/4 = 200
    expect(guides.horizontal[4]).toBe(800);
  });

  test('filas fijas de 50px, 3 filas → posiciones exactas', () => {
    const guides = generateGuides(
      rowConfig({ rows: 3, rowHeight: 'fixed', rowHeightValue: 50, gutter: 10, marginTop: 0, marginBottom: 0 }),
      { width: 1200, height: 600 }
    );
    // row 0: [0, 50], row 1: [60, 110], row 2: [120, 170]
    expect(guides.horizontal).toEqual([0, 50, 60, 110, 120, 170]);
  });

  test('márgenes verticales superan altura → lanza GridGenerationError', () => {
    expect(() =>
      generateGuides(
        rowConfig({ marginTop: 600, marginBottom: 600 }),
        { width: 1200, height: 800 }
      )
    ).toThrow(GridGenerationError);
  });

  test('con offsetY → posiciones absolutas correctas', () => {
    const guides = generateGuides(
      rowConfig({ rows: 1, rowHeight: 'auto', gutter: 0, marginTop: 0, marginBottom: 0 }),
      { width: 200, height: 100, offsetY: 30 }
    );
    expect(guides.horizontal[0]).toBe(30);
    expect(guides.horizontal[1]).toBe(130);
  });
});

describe('generateGuides - márgenes simples', () => {
  test('márgenes simples generan 4 guías (2 h + 2 v)', () => {
    const config: GridConfig = {
      ...DEFAULT_GRID_CONFIG,
      columns: { ...DEFAULT_COLUMN_CONFIG, enabled: false },
      rows: { ...DEFAULT_ROW_CONFIG, enabled: false },
      margins: { enabled: true, top: 40, right: 40, bottom: 40, left: 40 },
    };
    const guides = generateGuides(config, { width: 1000, height: 800 });
    expect(guides.horizontal).toEqual([40, 760]); // top=40, bottom=800-40=760
    expect(guides.vertical).toEqual([40, 960]);   // left=40, right=1000-40=960
  });
});

describe('generateGuides - deduplicación y orden', () => {
  test('posiciones duplicadas se eliminan', () => {
    // 2 columnas, gutter=0 → col 0 right == col 1 left == misma posición
    const guides = generateGuides(
      colConfig({ enabled: true, columns: 2, columnWidth: 'auto', gutter: 0, marginLeft: 0, marginRight: 0 }),
      { width: 200, height: 100 }
    );
    // col 0: [0, 100], col 1: [100, 200] → 100 duplicado → [0, 100, 200]
    expect(guides.vertical).toEqual([0, 100, 200]);
  });

  test('resultados siempre ordenados de menor a mayor', () => {
    const guides = generateGuides(
      colConfig({ enabled: true, columns: 3, columnWidth: 'fixed', columnWidthValue: 50, gutter: 10, marginLeft: 0, marginRight: 0 }),
      { width: 500, height: 100 }
    );
    const sorted = [...guides.vertical].sort((a, b) => a - b);
    expect(guides.vertical).toEqual(sorted);
  });
});

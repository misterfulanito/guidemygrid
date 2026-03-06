# Technical Decisions — GuideMyGrid

**Estado:** ✅ Completo
**Creado:** 2026-03-06T16:41:30Z
**Última actualización:** 2026-03-06T18:27:46Z

---

## Índice

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Features del MVP](#3-features-del-mvp)
4. [Arquitectura del Plugin](#4-arquitectura-del-plugin)
5. [Interfaces TypeScript](#5-interfaces-typescript)
6. [Estado Global — Zustand Store](#6-estado-global--zustand-store)
7. [Servicio gridGenerator](#7-servicio-gridgenerator)
8. [UXP APIs — Comunicación con Photoshop](#8-uxp-apis--comunicación-con-photoshop)
9. [Especificaciones de Componentes](#9-especificaciones-de-componentes)
10. [Persistencia — localStorage UXP](#10-persistencia--localstorage-uxp)
11. [Freemium — Gating de Features](#11-freemium--gating-de-features)
12. [Manejo de Errores](#12-manejo-de-errores)
13. [Build y Configuración](#13-build-y-configuración)
14. [manifest.json — Configuración UXP](#14-manifestjson--configuración-uxp)
15. [Performance Targets](#15-performance-targets)
16. [Testing Strategy](#16-testing-strategy)
17. [Release — Adobe Exchange](#17-release--adobe-exchange)
18. [Competidores](#18-competidores)
19. [Plan de Implementación](#19-plan-de-implementación)
20. [Riesgos y Mitigaciones](#20-riesgos-y-mitigaciones)

---

## 1. Visión General

### 1.1 Descripción

GuideMyGrid es un plugin para Adobe Photoshop que permite a diseñadores, UXers y profesionales de marketing generar retículas y líneas guía con configuraciones sencillas y poderosas. El usuario define columnas, filas y márgenes desde una UI intuitiva; el plugin genera automáticamente todas las líneas guía en el documento activo.

### 1.2 Problema que Resuelve

Configurar retículas en Photoshop de forma nativa es lento y repetitivo:
- Hay que agregar cada línea guía manualmente (View → New Guide)
- No existe un sistema de presets nativo
- El diálogo nativo no calcula automáticamente posiciones con gutters
- No hay forma de aplicar un grid a una selección activa (solo al canvas completo)

GuideMyGrid automatiza este proceso: el usuario configura una vez y aplica con un clic.

### 1.3 Usuario Objetivo

| Perfil | Necesidad Principal | Feature Prioritaria |
|--------|---------------------|---------------------|
| Diseñador gráfico | Retículas consistentes entre documentos | Presets reutilizables |
| UX/UI Designer | Grids 8pt / 12-column estándar | Column grid con gutter |
| Equipo de Marketing | Plantillas de marca aplicadas rápido | Presets compartibles (post-MVP) |
| Motion Designer | Guías de composición para keyframes | Row grid + márgenes |

### 1.4 Scope MVP

- **Modalidad:** MVP
- **Timeline estimado:** 6-8 semanas
- **Target inicial:** Adobe Photoshop 22.0+
- **Plataformas:** macOS y Windows (UXP es cross-platform)

### 1.5 Decisión: MVP vs Modo Turbo

**Elegido: MVP** porque:
- El mercado de plugins de Photoshop necesita validación rápida
- Los competidores (GuideGuide) llevan años y tienen usuarios establecidos
- Una propuesta de valor clara (presets + row grid) es suficiente para diferenciar en MVP
- El modelo freemium valida la disposición a pagar antes de invertir en features Pro

**Deuda técnica aceptada en MVP:**
- Sin sincronización de presets entre máquinas (post-MVP: backend)
- Sin historial de grids aplicados
- Sin importación/exportación de presets entre usuarios

---

## 2. Stack Tecnológico

### 2.1 Plugin SDK: UXP

| Atributo | Valor |
|----------|-------|
| Tecnología | UXP (Unified Extensibility Platform) |
| Versión mínima PS | Photoshop 22.0 (enero 2021) |
| Runtime | V8 (JS engine) + APIs nativas PS |
| Modelo de panel | Panel flotante persistente en PS |

**Justificación sobre CEP:**
- UXP es el sucesor oficial de CEP. Adobe desactivará CEP en 2025-2026.
- UXP tiene acceso directo a APIs nativas de PS sin iframes ni puentes ExtendScript.
- El rendimiento de UXP es significativamente superior para manipulación de documentos.
- Adobe UXP Developer Tool permite hot-reload durante desarrollo.

### 2.2 Frontend: React 18 + TypeScript

| Atributo | Valor |
|----------|-------|
| Framework | React 18.2+ |
| Lenguaje | TypeScript 5.x (strict mode) |
| Componentes UI | Adobe Spectrum Web Components (incluidos en UXP) |
| Routing | No necesario (SPA de panel único) |

**Justificación:**
- UXP incluye React en su runtime — no se suma peso extra al bundle.
- TypeScript es crítico para trabajar con las APIs de PS (tipado de documentos, layers, guides).
- Adobe Spectrum asegura que la UI se vea nativa dentro del ecosistema Adobe (dark/light mode automático, fuentes Photoshop).

**Decisión: No usar Tailwind ni CSS-in-JS**
- Adobe Spectrum ya provee todos los componentes necesarios (inputs, sliders, buttons, tabs).
- Agregar un sistema de CSS externo crea conflictos con los estilos de Spectrum.
- Solo se usan CSS Modules para estilos muy específicos no cubiertos por Spectrum.

### 2.3 Estado Global: Zustand

| Atributo | Valor |
|----------|-------|
| Librería | Zustand 4.x |
| Justificación | API mínima, sin boilerplate, compatible con React 18 concurrent |
| Alternativas descartadas | Redux (excesivo para este scope), Jotai (menos maduro) |

### 2.4 Build: Webpack 5

| Atributo | Valor |
|----------|-------|
| Herramienta | Webpack 5 |
| Template base | `@adobe/create-ccweb-add-on` o template UXP de Adobe |
| Dev Tool | Adobe UXP Developer Tool (GUI) |
| Output | Bundle único `/dist/index.js` + `/dist/index.html` |

**Nota:** UXP no soporta módulos ES nativos en runtime. Todo debe ser bundleado. El entry point final es un HTML que carga el JS bundle.

### 2.5 Distribución y Auto-Update

**Decisión:** Distribución fuera de Adobe Exchange — control total de precios, sin proceso de review, updates inmediatos.

#### Formato de instalación: `.ccx`

El `.ccx` es el formato nativo de UXP. No requiere ejecutable separado:
```
1. Usuario descarga guidemygrid-v1.0.0.ccx desde web/GitHub
2. Doble-clic en el .ccx → CC Desktop lo instala automáticamente
3. El plugin aparece en Photoshop → Plugins → GuideMyGrid
```

**Trade-off aceptado:** sin Adobe Exchange, el plugin no aparece en el marketplace oficial. La adquisición depende del canal propio (sitio web, comunidades de diseñadores, Product Hunt, etc.).

#### Auto-Update: GitHub Releases API

El plugin verifica actualizaciones contra la GitHub Releases API en cada carga del panel. Falla silenciosamente si no hay red.

```typescript
// src/services/updateChecker.ts
const PLUGIN_VERSION = '1.0.0'; // Sincronizar con manifest.json en cada release
const GITHUB_REPO = '{owner}/guidemygrid';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes?: string;
}

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!response.ok) return null;

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, '');
    const hasUpdate = compareVersions(latestVersion, PLUGIN_VERSION) > 0;
    const ccxAsset = release.assets?.find((a: any) => a.name.endsWith('.ccx'));

    return {
      hasUpdate,
      latestVersion,
      downloadUrl: ccxAsset?.browser_download_url ?? release.html_url,
      releaseNotes: release.body,
    };
  } catch {
    return null; // Falla silenciosa — nunca bloquear si no hay red
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}
```

**Componente `UpdateBanner.tsx`:**
- Se muestra en la parte superior del panel si `hasUpdate === true`
- Mensaje: "Nueva versión vX.Y.Z disponible → Descargar"
- El botón abre `downloadUrl` en el browser del sistema
- El usuario descarga el `.ccx` → doble-clic → CC Desktop actualiza
- El banner se puede cerrar; no reaparece hasta la próxima sesión de PS

**Flujo de release para el desarrollador:**
```
1. Desarrollar cambios
2. Actualizar PLUGIN_VERSION en updateChecker.ts + version en manifest.json + package.json
3. npm run build
4. Empaquetar: zip -r guidemygrid-v1.1.0.ccx dist/
5. Crear GitHub Release con tag "v1.1.0" + adjuntar el .ccx
6. Los usuarios ven el banner en su próxima sesión de PS → descargan → instalan
```

**Permiso de red requerido en manifest.json:**
```json
"network": { "domains": ["https://api.github.com"] }
```

#### Sin Backend (MVP)

| Dato | Almacenamiento |
|------|---------------|
| Presets del usuario | `localStorage` UXP |
| Configuración del plugin | `localStorage` UXP |
| Verificación de updates | GitHub Releases API (solo lectura) |
| Licencias Pro | **No en MVP** — plugin gratuito |

**Monetización post-MVP:**
- License keys vía Gumroad o LemonSqueezy (ambos tienen API de validación de keys)
- `manifest.json` requerirá agregar el dominio del proveedor de licencias a `network.domains`
- El campo `LicenseTier` ya está en las interfaces TypeScript — solo falta la lógica de verificación

### 2.6 Dependencias de Producción

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "webpack": "^5.88.0",
    "webpack-cli": "^5.1.0",
    "ts-loader": "^9.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "css-loader": "^6.8.0",
    "style-loader": "^3.3.0"
  }
}
```

**Sin estas dependencias:** no se agrega lodash, axios, ni date-fns. El plugin es minimalista.

---

## 3. Features del MVP

### 3.1 Grid de Columnas

| Campo | Tipo | Rango | Default | Notas |
|-------|------|-------|---------|-------|
| columns | number | 1–24 | 12 | Número de columnas |
| columnWidth | 'auto' \| number | px | 'auto' | 'auto' = distribuir equitativamente |
| gutter | number | 0–200 | 20 | Espacio entre columnas (px) |
| marginLeft | number | 0–500 | 0 | Offset desde borde izquierdo (px) |
| marginRight | number | 0–500 | 0 | Offset desde borde derecho (px) |

**Lógica de cálculo:**
```
anchoDisponible = documentWidth - marginLeft - marginRight
anchoPorColumna = (anchoDisponible - (gutter * (columns - 1))) / columns
```

Cada columna genera 2 guías verticales: borde izquierdo y borde derecho.
El gutter es el espacio entre el borde derecho de una columna y el borde izquierdo de la siguiente.

### 3.2 Grid de Filas

| Campo | Tipo | Rango | Default | Notas |
|-------|------|-------|---------|-------|
| rows | number | 1–100 | 0 (desactivado) | Número de filas |
| rowHeight | 'auto' \| number | px | 'auto' | |
| rowGutter | number | 0–200 | 0 | Espacio entre filas (px) |
| marginTop | number | 0–500 | 0 | Offset desde borde superior (px) |
| marginBottom | number | 0–500 | 0 | Offset desde borde inferior (px) |

**Lógica de cálculo:**
```
altoDisponible = documentHeight - marginTop - marginBottom
altoPorFila = (altoDisponible - (rowGutter * (rows - 1))) / rows
```

### 3.3 Márgenes Globales

Los márgenes se configuran como parte de ColumnGrid y RowGrid. Sin embargo, se ofrece una sección "Márgenes" independiente que genera 4 guías simples (top, right, bottom, left) sin grid asociado. Útil para definir área segura de contenido.

| Campo | Default |
|-------|---------|
| top | 0 px |
| right | 0 px |
| bottom | 0 px |
| left | 0 px |

### 3.4 Presets

- El usuario puede guardar la configuración actual como preset con un nombre.
- Los presets se listan en un panel "Presets" y se pueden aplicar con un clic.
- **Free:** máximo 3 presets guardados.
- **Pro:** presets ilimitados.
- Los presets persisten en `localStorage` del plugin.

### 3.5 Aplicación a Photoshop

| Opción | Descripción |
|--------|-------------|
| Aplicar al canvas | Las guías se calculan respecto al ancho/alto del documento |
| Aplicar a selección | Las guías se calculan respecto al bounding box de la selección activa |
| Reemplazar guías | Elimina todas las guías existentes antes de aplicar |
| Agregar a existentes | Agrega las nuevas guías sin eliminar las actuales |

### 3.6 Límites Free vs Pro

| Feature | Free | Pro |
|---------|------|-----|
| Columnas máximas | 12 | 24 |
| Filas | ❌ | ✅ |
| Presets guardados | 3 | Ilimitados |
| Presets de comunidad | ❌ | ✅ (post-MVP) |
| Aplicar a selección | ❌ | ✅ |
| Exportar presets | ❌ | ✅ (post-MVP) |

---

## 4. Arquitectura del Plugin

### 4.1 Estructura de Carpetas

```
guidemygrid/
├── manifest.json               # Configuración UXP del plugin
├── index.html                  # Entry point HTML del panel
├── package.json
├── webpack.config.js
├── tsconfig.json
│
├── src/
│   ├── index.tsx               # React root: monta <App />
│   │
│   ├── App.tsx                 # Layout principal: tabs + panels
│   │
│   ├── components/
│   │   ├── ColumnGrid/
│   │   │   ├── ColumnGrid.tsx  # Panel de configuración de columnas
│   │   │   ├── ColumnGrid.module.css
│   │   │   └── index.ts
│   │   ├── RowGrid/
│   │   │   ├── RowGrid.tsx     # Panel de configuración de filas
│   │   │   ├── RowGrid.module.css
│   │   │   └── index.ts
│   │   ├── Margins/
│   │   │   ├── Margins.tsx     # Panel de márgenes simples
│   │   │   └── index.ts
│   │   ├── Presets/
│   │   │   ├── Presets.tsx     # Lista y gestión de presets
│   │   │   ├── PresetItem.tsx  # Fila de preset individual
│   │   │   └── index.ts
│   │   └── shared/
│   │       ├── NumberInput.tsx # Input numérico con label
│   │       ├── Toggle.tsx      # Toggle enable/disable
│   │       ├── ProBadge.tsx    # Badge "Pro" para features gateadas
│   │       └── ApplyButton.tsx # Botón principal de aplicación
│   │
│   ├── hooks/
│   │   ├── usePhotoshop.ts     # Acceso a documento PS activo
│   │   ├── useDocument.ts      # Ancho/alto/selección del documento
│   │   └── useLicense.ts       # Verificación de licencia Pro
│   │
│   ├── services/
│   │   ├── gridGenerator.ts    # Cálculo de posiciones de guías
│   │   ├── photoshopBridge.ts  # Wrapper sobre UXP APIs de PS
│   │   └── presetStorage.ts    # CRUD de presets en localStorage
│   │
│   ├── store/
│   │   ├── index.ts            # Exportaciones del store
│   │   ├── gridStore.ts        # Estado de ColumnGrid + RowGrid + Margins
│   │   ├── presetsStore.ts     # Estado de presets guardados
│   │   └── uiStore.ts          # Estado de UI (tab activo, loading, errors)
│   │
│   └── types/
│       ├── grid.types.ts       # GridConfig, ColumnConfig, RowConfig, etc.
│       ├── preset.types.ts     # Preset, PresetId
│       ├── photoshop.types.ts  # DocumentInfo, GuideInfo, Selection
│       └── license.types.ts    # LicenseStatus, LicenseTier
│
└── dist/                       # Output del build (gitignored)
    ├── index.html
    └── index.js
```

### 4.2 Flujo de Datos

```
Usuario interactúa con UI
        │
        ▼
  React Component
  (ColumnGrid, etc.)
        │ dispatch action
        ▼
  Zustand Store
  (gridStore.ts)
        │ getState()
        ▼
  gridGenerator.ts
  (calcula posiciones)
        │ positions[]
        ▼
  photoshopBridge.ts
  (llama UXP APIs)
        │ require('photoshop')
        ▼
  Adobe Photoshop
  (crea guías en documento)
```

### 4.3 Separación de Responsabilidades

| Capa | Responsabilidad | No hace |
|------|----------------|---------|
| Components | UI, inputs del usuario, feedback visual | Cálculos, llamadas a PS |
| Store (Zustand) | Estado reactivo de la configuración | Lógica de cálculo, I/O |
| gridGenerator | Algoritmo puro: config → posiciones | Estado, I/O |
| photoshopBridge | Abstracción sobre UXP APIs | Cálculos, estado |
| presetStorage | CRUD localStorage | Validación de negocio |
| hooks | Conectar PS con React reactivamente | Lógica de negocio |

**Principio clave:** `gridGenerator.ts` es una función pura. Toma `GridConfig` y devuelve `GuidePosition[]`. No toca ni store ni APIs de PS. Esto hace que sea 100% testeable sin mocks de Adobe.

---

## 5. Interfaces TypeScript

### 5.1 Configuración de Grid

```typescript
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
```

### 5.2 Presets

```typescript
// src/types/preset.types.ts

export type PresetId = string; // UUID v4

export interface Preset {
  id: PresetId;
  name: string;             // Nombre visible al usuario
  description?: string;     // Opcional: descripción del preset
  config: GridConfig;       // Snapshot completo de la configuración
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
  isBuiltIn: boolean;       // true para presets pre-incluidos (no editables)
}

export interface PresetsStorage {
  version: number;          // Para migraciones futuras (inicialmente 1)
  presets: Preset[];
}
```

### 5.3 Documento Photoshop

```typescript
// src/types/photoshop.types.ts

export interface DocumentInfo {
  id: number;
  name: string;
  width: number;            // px
  height: number;           // px
  resolution: number;       // ppp (dots per inch)
  hasSelection: boolean;
}

export interface SelectionBounds {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface GuideInfo {
  position: number;         // px
  orientation: GuideOrientation;
}

export interface DocumentContext {
  document: DocumentInfo;
  selection: SelectionBounds | null;
  guides: GuideInfo[];
}
```

### 5.4 Licencias

```typescript
// src/types/license.types.ts

export type LicenseTier = 'free' | 'pro';

export interface LicenseStatus {
  tier: LicenseTier;
  isActive: boolean;
  expiresAt?: string;       // ISO 8601, solo para Pro con suscripción
}

export interface FeatureGate {
  feature: string;
  requiredTier: LicenseTier;
  isAllowed: (license: LicenseStatus) => boolean;
}
```

### 5.5 Store Types

```typescript
// src/types/store.types.ts

export interface GridStore {
  config: GridConfig;
  // Actions
  setColumnConfig: (config: Partial<ColumnConfig>) => void;
  setRowConfig: (config: Partial<RowConfig>) => void;
  setMarginsConfig: (config: Partial<MarginsConfig>) => void;
  setApplyTarget: (target: ApplyTarget) => void;
  setApplyMode: (mode: ApplyMode) => void;
  resetToDefaults: () => void;
  loadFromPreset: (preset: Preset) => void;
}

export interface PresetsStore {
  presets: Preset[];
  // Actions
  addPreset: (name: string, config: GridConfig) => void;
  updatePreset: (id: PresetId, updates: Partial<Pick<Preset, 'name' | 'description'>>) => void;
  deletePreset: (id: PresetId) => void;
  applyPreset: (id: PresetId) => void;
}

export interface UIStore {
  activeTab: 'grid' | 'presets';
  isApplying: boolean;
  lastError: string | null;
  lastSuccess: boolean;
  // Actions
  setActiveTab: (tab: UIStore['activeTab']) => void;
  setApplying: (state: boolean) => void;
  setError: (message: string | null) => void;
  setSuccess: (state: boolean) => void;
}
```

### 5.6 Defaults

```typescript
// src/types/grid.types.ts (continuación)

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
```

---

## 6. Estado Global — Zustand Store

### 6.1 gridStore.ts

```typescript
// src/store/gridStore.ts
import { create } from 'zustand';
import { GridStore, GridConfig, DEFAULT_GRID_CONFIG, Preset } from '../types';

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
```

### 6.2 presetsStore.ts

```typescript
// src/store/presetsStore.ts
import { create } from 'zustand';
import { PresetsStore, Preset, PresetId, GridConfig } from '../types';
import { presetStorage } from '../services/presetStorage';
import { useGridStore } from './gridStore';

export const usePresetsStore = create<PresetsStore>((set, get) => ({
  presets: presetStorage.load(),

  addPreset: (name, config) => {
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
    const presets = get().presets.filter((p) => p.id !== id);
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
```

### 6.3 uiStore.ts

```typescript
// src/store/uiStore.ts
import { create } from 'zustand';
import { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'grid',
  isApplying: false,
  lastError: null,
  lastSuccess: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setApplying: (state) => set({ isApplying: state }),
  setError: (message) => set({ lastError: message, lastSuccess: false }),
  setSuccess: (state) => set({ lastSuccess: state, lastError: null }),
}));
```

### 6.4 Reglas de Store

- **No lógica de cálculo en el store.** El store solo guarda estado y dispara acciones.
- **No llamadas a APIs de PS en el store.** Toda comunicación con PS pasa por `photoshopBridge.ts`.
- **Persistencia en localStorage no es responsabilidad del store.** Es responsabilidad de `presetStorage.ts`, llamado desde las acciones del store.
- El store de UI (`uiStore.ts`) nunca debe tener lógica de negocio — solo estado visual.

---

## 7. Servicio gridGenerator

### 7.1 Contrato

```typescript
// src/services/gridGenerator.ts

export function generateGuides(
  config: GridConfig,
  context: { width: number; height: number; offsetX?: number; offsetY?: number }
): GeneratedGuides
```

**Parámetros:**
- `config`: configuración completa del grid
- `context.width`: ancho disponible (canvas o selección)
- `context.height`: alto disponible (canvas o selección)
- `context.offsetX`: desplazamiento horizontal (0 si es canvas, left si es selección)
- `context.offsetY`: desplazamiento vertical (0 si es canvas, top si es selección)

**Retorna:** `GeneratedGuides` con arrays de posiciones absolutas en px.

### 7.2 Algoritmo — Columnas

```
ENTRADA: columns, gutter, marginLeft, marginRight, width, offsetX

1. anchoDisponible = width - marginLeft - marginRight
2. Si anchoDisponible <= 0 → error: "Márgenes superan el ancho del documento"
3. Si columnWidth === 'fixed':
     anchoPorColumna = columnWidthValue
   Sino:
     anchoPorColumna = (anchoDisponible - gutter * (columns - 1)) / columns
4. Si anchoPorColumna <= 0 → error: "El gutter o número de columnas es demasiado grande"
5. Para cada columna i (0 a columns-1):
     x_izq = offsetX + marginLeft + i * (anchoPorColumna + gutter)
     x_der = x_izq + anchoPorColumna
     vertical.push(x_izq, x_der)
6. Retornar vertical[] (deduplicado y ordenado)
```

### 7.3 Algoritmo — Filas

```
ENTRADA: rows, rowGutter, marginTop, marginBottom, height, offsetY

(análogo al de columnas pero en eje Y)

1. altoDisponible = height - marginTop - marginBottom
2. Si rowHeight === 'fixed':
     altoPorFila = rowHeightValue
   Sino:
     altoPorFila = (altoDisponible - rowGutter * (rows - 1)) / rows
3. Para cada fila i (0 a rows-1):
     y_top = offsetY + marginTop + i * (altoPorFila + rowGutter)
     y_bot = y_top + altoPorFila
     horizontal.push(y_top, y_bot)
```

### 7.4 Algoritmo — Márgenes Simples

```
Si margins.enabled:
  horizontal.push(offsetY + margins.top)
  horizontal.push(offsetY + height - margins.bottom)
  vertical.push(offsetX + margins.left)
  vertical.push(offsetX + width - margins.right)
```

### 7.5 Implementación Completa

```typescript
// src/services/gridGenerator.ts

import { GridConfig, GeneratedGuides } from '../types';

export class GridGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GridGenerationError';
  }
}

export function generateGuides(
  config: GridConfig,
  context: { width: number; height: number; offsetX?: number; offsetY?: number }
): GeneratedGuides {
  const { width, height, offsetX = 0, offsetY = 0 } = context;
  const vertical: number[] = [];
  const horizontal: number[] = [];

  // --- Columnas ---
  if (config.columns.enabled) {
    const { columns, gutter, marginLeft, marginRight, columnWidth, columnWidthValue } = config.columns;
    const availableWidth = width - marginLeft - marginRight;

    if (availableWidth <= 0) {
      throw new GridGenerationError(
        `Los márgenes (${marginLeft + marginRight}px) superan el ancho del documento (${width}px)`
      );
    }

    const colWidth =
      columnWidth === 'fixed'
        ? columnWidthValue
        : (availableWidth - gutter * (columns - 1)) / columns;

    if (colWidth <= 0) {
      throw new GridGenerationError(
        `El gutter o número de columnas genera columnas de ancho negativo`
      );
    }

    for (let i = 0; i < columns; i++) {
      const left = offsetX + marginLeft + i * (colWidth + gutter);
      const right = left + colWidth;
      vertical.push(Math.round(left * 100) / 100);
      vertical.push(Math.round(right * 100) / 100);
    }
  }

  // --- Filas ---
  if (config.rows.enabled) {
    const { rows, gutter, marginTop, marginBottom, rowHeight, rowHeightValue } = config.rows;
    const availableHeight = height - marginTop - marginBottom;

    if (availableHeight <= 0) {
      throw new GridGenerationError(
        `Los márgenes verticales superan la altura del documento`
      );
    }

    const rHeight =
      rowHeight === 'fixed'
        ? rowHeightValue
        : (availableHeight - gutter * (rows - 1)) / rows;

    if (rHeight <= 0) {
      throw new GridGenerationError(
        `El gutter o número de filas genera filas de alto negativo`
      );
    }

    for (let i = 0; i < rows; i++) {
      const top = offsetY + marginTop + i * (rHeight + gutter);
      const bottom = top + rHeight;
      horizontal.push(Math.round(top * 100) / 100);
      horizontal.push(Math.round(bottom * 100) / 100);
    }
  }

  // --- Márgenes simples ---
  if (config.margins.enabled) {
    const { top, right, bottom, left } = config.margins;
    horizontal.push(offsetY + top);
    horizontal.push(offsetY + height - bottom);
    vertical.push(offsetX + left);
    vertical.push(offsetX + width - right);
  }

  return {
    vertical: [...new Set(vertical)].sort((a, b) => a - b),
    horizontal: [...new Set(horizontal)].sort((a, b) => a - b),
  };
}
```

---

## 8. UXP APIs — Comunicación con Photoshop

### 8.1 photoshopBridge.ts — Wrapper Completo

```typescript
// src/services/photoshopBridge.ts

// UXP provee estos módulos via require() — no son npm packages
const photoshop = require('photoshop');
const app = photoshop.app;

export class PhotoshopBridge {

  // --- Documento activo ---

  async getActiveDocument(): Promise<DocumentInfo | null> {
    const doc = app.activeDocument;
    if (!doc) return null;
    return {
      id: doc.id,
      name: doc.name,
      width: doc.width,
      height: doc.height,
      resolution: doc.resolution,
      hasSelection: await this.hasActiveSelection(),
    };
  }

  // --- Selección ---

  async getSelectionBounds(): Promise<SelectionBounds | null> {
    const doc = app.activeDocument;
    if (!doc) return null;

    // batchPlay para obtener bounds de selección
    const result = await photoshop.core.executeAsModal(async () => {
      return await photoshop.action.batchPlay(
        [{ _obj: 'get', _target: [{ _property: 'selection' }, { _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
        {}
      );
    }, { commandName: 'Get Selection' });

    if (!result?.[0]?.selection) return null;
    const sel = result[0].selection;
    return {
      top: sel.top._value,
      left: sel.left._value,
      bottom: sel.bottom._value,
      right: sel.right._value,
      width: sel.right._value - sel.left._value,
      height: sel.bottom._value - sel.top._value,
    };
  }

  private async hasActiveSelection(): Promise<boolean> {
    const bounds = await this.getSelectionBounds();
    return bounds !== null;
  }

  // --- Guías ---

  async getAllGuides(): Promise<GuideInfo[]> {
    const doc = app.activeDocument;
    if (!doc) return [];
    return doc.guides.map((g: any) => ({
      position: g.position,
      orientation: g.direction === 'horizontal' ? 'horizontal' : 'vertical',
    }));
  }

  async clearAllGuides(): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.action.batchPlay(
        [{ _obj: 'clearGuides', _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
        {}
      );
    }, { commandName: 'Clear Guides' });
  }

  async addGuide(position: number, orientation: GuideOrientation): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.action.batchPlay(
        [{
          _obj: 'set',
          _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'targetEnum' }],
          to: {
            _obj: 'guide',
            position: { _unit: 'pixelsUnit', _value: position },
            orientation: orientation === 'vertical' ? { _enum: 'orientation', _value: 'vertical' } : { _enum: 'orientation', _value: 'horizontal' },
          },
        }],
        {}
      );
    }, { commandName: 'Add Guide' });
  }

  // --- Aplicación de grids ---

  async applyGuides(guides: GeneratedGuides, mode: ApplyMode): Promise<void> {
    const doc = app.activeDocument;
    if (!doc) throw new Error('No hay documento activo en Photoshop');

    await photoshop.core.executeAsModal(async () => {
      if (mode === 'replace') {
        await photoshop.action.batchPlay(
          [{ _obj: 'clearGuides' }],
          {}
        );
      }

      // Agregar guías verticales
      for (const x of guides.vertical) {
        await photoshop.action.batchPlay(
          [{
            _obj: 'set',
            _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'targetEnum' }],
            to: {
              _obj: 'guide',
              position: { _unit: 'pixelsUnit', _value: x },
              orientation: { _enum: 'orientation', _value: 'vertical' },
            },
          }],
          {}
        );
      }

      // Agregar guías horizontales
      for (const y of guides.horizontal) {
        await photoshop.action.batchPlay(
          [{
            _obj: 'set',
            _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'targetEnum' }],
            to: {
              _obj: 'guide',
              position: { _unit: 'pixelsUnit', _value: y },
              orientation: { _enum: 'orientation', _value: 'horizontal' },
            },
          }],
          {}
        );
      }
    }, { commandName: 'Apply GuideMyGrid' });
  }
}

export const photoshopBridge = new PhotoshopBridge();
```

### 8.2 Notas Críticas sobre batchPlay

- **Todas las operaciones que modifican el documento deben ir dentro de `executeAsModal`.**
  UXP requiere que las operaciones de escritura al documento estén envueltas en un contexto modal. Sin esto, Photoshop lanzará un error de permisos.

- **`executeAsModal` bloquea la UI de PS** mientras ejecuta. Mantener las operaciones cortas.

- **Unidades:** UXP trabaja en píxeles (`pixelsUnit`) pero el documento puede estar en cm/pulgadas. Siempre especificar `_unit: 'pixelsUnit'` explícitamente.

- **No usar `app.activeDocument.guides.add()`** directamente. La API de alto nivel de UXP para guías no está completamente implementada en todas las versiones de PS. Usar `batchPlay` es más confiable.

### 8.3 Hook useDocument

```typescript
// src/hooks/useDocument.ts
import { useState, useEffect } from 'react';
import { photoshopBridge } from '../services/photoshopBridge';
import { DocumentInfo } from '../types';

export function useDocument() {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      const doc = await photoshopBridge.getActiveDocument();
      setDocument(doc);
      setLoading(false);
    };

    refresh();

    // Escuchar cambios de documento activo
    // UXP soporta eventos de PS via photoshop.action.addNotificationListener
    const photoshop = require('photoshop');
    const listener = () => refresh();
    photoshop.action.addNotificationListener(['select', 'open', 'close'], listener);

    return () => {
      photoshop.action.removeNotificationListener(['select', 'open', 'close'], listener);
    };
  }, []);

  return { document, loading };
}
```

---

## 9. Especificaciones de Componentes

### 9.1 App.tsx — Layout Principal

```
┌─────────────────────────────────────────┐
│  GuideMyGrid              🔄 Refresh    │
├─────────────────────────────────────────┤
│  [Grid] [Presets]                       │ ← Tabs (Spectrum Tabs)
├─────────────────────────────────────────┤
│                                         │
│  Tab: Grid                              │
│  ┌─────────────────────────────────┐   │
│  │  ☑ Columnas                     │   │
│  │  ... ColumnGrid panel ...        │   │
│  ├─────────────────────────────────┤   │
│  │  ☑ Filas                [PRO]   │   │
│  │  ... RowGrid panel ...           │   │
│  ├─────────────────────────────────┤   │
│  │  ☐ Márgenes Simples             │   │
│  │  ... Margins panel ...           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Aplicar a: [Canvas ▼]  Modo: [Reem ▼] │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     ▶ Aplicar Grid              │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 9.2 ColumnGrid.tsx — Props y Estado

```typescript
interface ColumnGridProps {
  isPro: boolean;
}

// El componente lee del store, no recibe props de config
// Solo necesita isPro para el gate de >12 columnas
```

**Campos del panel:**
- Toggle "Columnas" (enable/disable sección)
- Número de columnas (Spectrum NumberField, 1–12 Free / 1–24 Pro)
- Ancho: Radio "Auto" / "Fijo" + NumberField para px
- Gutter (NumberField, px)
- Margen izquierdo (NumberField, px)
- Margen derecho (NumberField, px)

### 9.3 RowGrid.tsx

Igual que ColumnGrid pero para filas. Toda la sección tiene un `<ProBadge />` si el usuario es Free, y los inputs están deshabilitados.

### 9.4 Presets.tsx

```
┌─────────────────────────────────────────┐
│  Mis Presets              [+ Guardar]   │
├─────────────────────────────────────────┤
│  🏷 12-col Web Standard           [▶] [✕] │
│  🏷 8pt iOS Grid                  [▶] [✕] │
│  🏷 Póster A4                     [▶] [✕] │
│                                         │
│  [3/3 presets] ─── Necesitas Pro para  │
│  guardar más.         [Ir a Pro →]      │
└─────────────────────────────────────────┘
```

**Presets built-in (Free):** no se muestran en el contador de 3.

### 9.5 Shared: NumberInput.tsx

```typescript
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;   // 'px', '%'
  disabled?: boolean;
}
```

Usa `<sp-textfield type="number">` de Adobe Spectrum. El `suffix` se muestra como texto decorativo.

### 9.6 Shared: ProBadge.tsx

Badge visual que indica que una feature requiere Pro. Al hacer clic, abre el modal de upgrade (o URL al marketplace de Adobe Exchange).

---

## 10. Persistencia — localStorage UXP

### 10.1 Schema de localStorage

```typescript
// Clave: 'guidemygrid_presets'
const STORAGE_KEY = 'guidemygrid_presets';

// Valor: PresetsStorage serializado a JSON
{
  "version": 1,
  "presets": [
    {
      "id": "uuid-v4",
      "name": "12-col Web Standard",
      "config": { ... },
      "createdAt": "2026-03-06T12:00:00Z",
      "updatedAt": "2026-03-06T12:00:00Z",
      "isBuiltIn": false
    }
  ]
}
```

### 10.2 presetStorage.ts

```typescript
// src/services/presetStorage.ts
import { Preset, PresetsStorage } from '../types';

const STORAGE_KEY = 'guidemygrid_presets';
const CURRENT_VERSION = 1;

export const presetStorage = {
  load(): Preset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return builtInPresets;
      const data: PresetsStorage = JSON.parse(raw);
      if (data.version !== CURRENT_VERSION) {
        return migrate(data);
      }
      return [...builtInPresets, ...data.presets];
    } catch {
      return builtInPresets;
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

function migrate(data: PresetsStorage): Preset[] {
  // Migraciones futuras si cambia el schema
  return builtInPresets;
}
```

### 10.3 Limitaciones de localStorage en UXP

- Tamaño máximo: ~5MB por plugin (suficiente para cientos de presets)
- No es compartida entre diferentes plugins de Adobe
- No persiste si el usuario desinstala el plugin
- No se sincroniza entre máquinas (aceptado en MVP)

---

## 11. Freemium — Gating de Features

### 11.1 Verificación de Licencia

UXP provee `require('uxp').entitlement` para verificar si el usuario tiene una licencia activa en Adobe Exchange.

```typescript
// src/hooks/useLicense.ts
import { useState, useEffect } from 'react';
import { LicenseStatus } from '../types';

export function useLicense(): LicenseStatus {
  const [status, setStatus] = useState<LicenseStatus>({ tier: 'free', isActive: true });

  useEffect(() => {
    async function checkLicense() {
      try {
        const uxp = require('uxp');
        // El entitlement API de UXP devuelve el estado de la licencia de Adobe Exchange
        const entitlement = await uxp.entitlement.checkStatus();
        setStatus({
          tier: entitlement.status === 'paid' ? 'pro' : 'free',
          isActive: true,
        });
      } catch {
        // Si falla la verificación, se asume Free (no bloquear por error de red)
        setStatus({ tier: 'free', isActive: true });
      }
    }
    checkLicense();
  }, []);

  return status;
}
```

### 11.2 Feature Gates

```typescript
// src/services/featureGates.ts
import { LicenseStatus } from '../types';

export const gates = {
  canUseRows: (l: LicenseStatus) => l.tier === 'pro',
  canUseMoreThan12Columns: (l: LicenseStatus) => l.tier === 'pro',
  canSaveMoreThan3Presets: (l: LicenseStatus, currentCount: number) =>
    l.tier === 'pro' || currentCount < 3,
  canApplyToSelection: (l: LicenseStatus) => l.tier === 'pro',
};
```

### 11.3 Principio de Degradación Gratuita

Si el usuario tiene Pro y baja a Free, sus presets guardados no se eliminan. Simplemente no puede crear nuevos. Si tiene un grid de 24 columnas y baja a Free, la UI muestra el valor en gris (readonly) y un badge Pro.

---

## 12. Manejo de Errores

### 12.1 Categorías de Error

| Categoría | Ejemplo | Acción |
|-----------|---------|--------|
| Sin documento activo | PS abierto sin documento | Mensaje en UI: "Abre un documento en Photoshop" |
| Error de cálculo | Márgenes > ancho | Mensaje inline en el campo responsable |
| Error de PS API | executeAsModal fallido | Toast de error + log a consola |
| Sin licencia | Feature Pro en cuenta Free | ProBadge + redirect a Exchange |
| localStorage lleno | >5MB de presets | Notificar y no guardar |

### 12.2 Estrategia

- **Errores de cálculo:** validados en `gridGenerator.ts` antes de llamar a PS. Se muestran inline cerca del campo que los causó.
- **Errores de PS API:** capturados en `photoshopBridge.ts`, propagados al store via `uiStore.setError()`. Se muestran como toast.
- **No hay reintentos automáticos.** Si PS falla, el usuario vuelve a intentar.
- **No hay Sentry ni logging remoto en MVP** (el plugin es local, sin backend).

### 12.3 Error Boundary

```typescript
// src/components/shared/ErrorBoundary.tsx
// Captura errores de render de React y muestra un fallback genérico
// Evita que un crash de componente mate todo el panel
```

---

## 13. Build y Configuración

### 13.1 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 13.2 webpack.config.js

```javascript
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  // UXP provee photoshop y uxp como módulos externos — no bundlear
  externals: {
    photoshop: 'photoshop',
    uxp: 'uxp',
    os: 'os',
    fs: 'fs',
    path: 'path',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.module\.css$/,
        use: ['style-loader', { loader: 'css-loader', options: { modules: true } }],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html' }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'manifest.json', to: '.' }],
    }),
  ],
  mode: 'development',
};
```

**Crítico:** `photoshop`, `uxp`, `os`, `fs`, `path` deben estar en `externals`. UXP los provee en runtime. Si Webpack los bundlea, el plugin no funciona.

### 13.3 Scripts npm

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "test": "jest"
  }
}
```

### 13.4 Flujo de Desarrollo

```
1. npm run dev          → Watch mode, genera dist/ en caliente
2. Adobe UXP Dev Tool   → Cargar plugin desde dist/
                          (Add Plugin → seleccionar manifest.json en dist/)
3. Photoshop            → El panel aparece en Plugins → GuideMyGrid
4. Editar código        → Webpack reconstruye → Recargar en UXP Dev Tool (botón Reload)
```

No hay hot module replacement real en UXP. Cada cambio requiere reload manual del plugin en la UXP Developer Tool.

---

## 14. manifest.json — Configuración UXP

```json
{
  "manifestVersion": 5,
  "id": "com.guidemygrid.plugin",
  "name": "GuideMyGrid",
  "version": "1.0.0",
  "main": "index.html",
  "host": [
    {
      "app": "PS",
      "minVersion": "22.0.0"
    }
  ],
  "entrypoints": [
    {
      "type": "panel",
      "id": "guidemygrid-panel",
      "label": {
        "default": "GuideMyGrid"
      },
      "minimumSize": { "width": 240, "height": 400 },
      "maximumSize": { "width": 400, "height": 800 },
      "preferredDockedSize": { "width": 280, "height": 600 },
      "icons": [
        { "width": 23, "height": 23, "path": "icons/icon-23.png", "scale": [1, 2], "theme": ["all"] }
      ]
    }
  ],
  "icons": [
    { "width": 23, "height": 23, "path": "icons/icon-23.png", "scale": [1, 2], "theme": ["all"] },
    { "width": 96, "height": 96, "path": "icons/icon-96.png", "scale": [1, 2], "theme": ["all"] }
  ],
  "requiredPermissions": {
    "launchProcess": false,
    "localFileSystem": "plugin",
    "network": {
      "domains": ["https://api.github.com"]
    },
    "allowCodeGenerationFromStrings": false
  }
}
```

**Notas:**
- `"localFileSystem": "plugin"` da acceso solo al directorio del plugin, no al sistema de archivos del usuario. Suficiente para localStorage.
- `"network": { "domains": ["https://api.github.com"] }` — requerido para el check de updates vía GitHub Releases API.
- `manifestVersion: 5` es el más reciente soportado por PS 22+.
- **Al agregar licencias post-MVP** (ej. LemonSqueezy): agregar `"https://api.lemonsqueezy.com"` a `domains`.

---

## 15. Performance Targets

| Operación | Target | Máximo Aceptable |
|-----------|--------|------------------|
| Carga inicial del panel | < 300ms | 500ms |
| Cálculo de guías (gridGenerator) | < 5ms | 20ms |
| Aplicar guías a PS (batchPlay) | < 1s (24 cols + 24 filas = 96 guías) | 3s |
| Cargar presets desde localStorage | < 10ms | 50ms |
| Guardar preset | < 20ms | 100ms |

**Límites de guías:**
- 24 columnas × 2 guías + 100 filas × 2 guías = máximo 248 guías en una aplicación
- Adobe Photoshop no tiene límite documentado de guías, pero > 500 guías empieza a degradar PS
- En MVP: máximo 24 cols + 100 rows = 248 guías. Aceptable.

**Optimizaciones:**
- `executeAsModal` con todas las guías en un solo bloque (no una llamada por guía)
- Redondear posiciones a 2 decimales para evitar guías casi-duplicadas
- Deduplicar posiciones antes de enviar a PS

---

## 16. Testing Strategy

### 16.1 Lo Que Se Puede Testear

| Módulo | Tipo de test | Herramienta |
|--------|-------------|-------------|
| `gridGenerator.ts` | Unit tests puros | Jest |
| Zustand stores | Unit tests con testing-library | Jest + @testing-library/react |
| `presetStorage.ts` | Unit con mock de localStorage | Jest |
| Components | Snapshot + interaction | Jest + React Testing Library |
| `photoshopBridge.ts` | **No testeable automáticamente** | Manual en PS |

### 16.2 Por Qué photoshopBridge No Se Puede Testear Automáticamente

UXP APIs (`require('photoshop')`) solo existen en el runtime de Photoshop. No hay emulador oficial. El testing de integración se hace manualmente en PS durante desarrollo.

### 16.3 Tests Críticos — gridGenerator

```typescript
// src/services/__tests__/gridGenerator.test.ts

describe('generateGuides - columns', () => {
  test('12 columnas auto, sin márgenes, sin gutter', () => {
    const guides = generateGuides(
      { ...DEFAULT_GRID_CONFIG, columns: { enabled: true, columns: 12, columnWidth: 'auto', columnWidthValue: 0, gutter: 0, marginLeft: 0, marginRight: 0 } },
      { width: 1200, height: 800 }
    );
    // 12 columnas × 2 guías = 24 posiciones verticales
    expect(guides.vertical).toHaveLength(24);
    expect(guides.vertical[0]).toBe(0);
    expect(guides.vertical[1]).toBe(100); // 1200/12 = 100
  });

  test('lanza error si márgenes superan ancho', () => {
    expect(() => generateGuides(
      { ...DEFAULT_GRID_CONFIG, columns: { ...DEFAULT_COLUMN_CONFIG, enabled: true, marginLeft: 700, marginRight: 700 } },
      { width: 1000, height: 800 }
    )).toThrow(GridGenerationError);
  });

  test('guías con offset de selección', () => {
    const guides = generateGuides(
      { ...DEFAULT_GRID_CONFIG, columns: { enabled: true, columns: 2, columnWidth: 'auto', columnWidthValue: 0, gutter: 0, marginLeft: 0, marginRight: 0 } },
      { width: 200, height: 100, offsetX: 50 }
    );
    expect(guides.vertical[0]).toBe(50);  // 50 + 0
    expect(guides.vertical[1]).toBe(150); // 50 + 100
  });
});
```

---

## 17. Release — Distribución Directa (sin Adobe Exchange)

### 17.1 Proceso de Publicación

```
1. npm run build                        → Genera dist/ optimizado
2. Empaquetar en .ccx:
   cd dist && zip -r ../guidemygrid-v1.0.0.ccx . && cd ..
3. Crear GitHub Release:
   - Tag: v1.0.0 (sincronizar con manifest.json + PLUGIN_VERSION en updateChecker.ts)
   - Adjuntar guidemygrid-v1.0.0.ccx como asset del release
   - Escribir release notes (aparecerán en el UpdateBanner del plugin)
4. Actualizar página de descarga (web propia o README del repo)
5. Publicación inmediata — sin review de Adobe
```

**Instalación para el usuario final:**
```
1. Descargar guidemygrid-v1.0.0.ccx desde la web/GitHub
2. Doble-clic en el archivo .ccx
3. Creative Cloud Desktop muestra diálogo de confirmación de instalación
4. Aceptar → plugin disponible en Photoshop → Plugins → GuideMyGrid
```

### 17.2 Proceso de Update para Usuarios Existentes

```
El plugin detecta la nueva versión (GitHub Releases API)
  → Muestra UpdateBanner: "Nueva versión v1.1.0 disponible → Descargar"
  → Usuario hace clic → descarga el nuevo .ccx
  → Doble-clic en el .ccx → CC Desktop reemplaza la versión anterior
  → Sus presets y configuraciones se preservan (migración de localStorage)
```

### 17.3 Checklist de Release

Antes de cada release, verificar:
- [ ] `PLUGIN_VERSION` en `src/services/updateChecker.ts` actualizado
- [ ] `"version"` en `manifest.json` actualizado
- [ ] `"version"` en `package.json` actualizado (los tres deben coincidir)
- [ ] Función `migrate()` en `presetStorage.ts` actualizada si cambia el schema
- [ ] `CURRENT_VERSION` en `presetStorage.ts` incrementado si cambia el schema
- [ ] `npm run build` exitoso sin errores
- [ ] Testing manual en PS macOS + Windows
- [ ] Release notes escritas en el GitHub Release

### 17.4 Versioning

```
1.0.0 → MVP inicial (gratuito)
1.x.0 → Features post-MVP (row grid, apply to selection)
1.x.x → Bugfixes y mejoras menores
2.0.0 → Monetización (sistema de license keys) o soporte multi-app Adobe
```

**Regla:** Si el schema de localStorage cambia (rompe backward compat), incrementar MINOR. Si solo hay cambios de lógica/UI, PATCH es suficiente.


## 18. Competidores

| Plugin | Precio | Fortaleza | Debilidad | Diferenciador GuideMyGrid |
|--------|--------|-----------|-----------|--------------------------|
| GuideGuide | Free/$45/yr | Más conocido, UI conocida | Solo columnas, no filas, UI dated | Filas + márgenes + UI Spectrum moderna |
| Grids for Designers | $49 pago único | Robusto, muchas opciones | Curva de aprendizaje, caro | Más simple, freemium accesible |
| Grid Systems | Gratuito | Gratis | Sin mantenimiento (última actualización 2019) | Mantenido, soporte PS moderno |

**Propuesta de valor diferencial:**
1. UI moderna (Adobe Spectrum, dark mode nativo de PS)
2. Grid de filas (ningún competidor gratuito lo tiene)
3. Aplicar a selección activa (no solo canvas)
4. Presets built-in útiles desde el día 1

[Análisis completo → docs/reference/competitive-analysis.md]

---

## 19. Plan de Implementación

### Semana 1: Setup + Core Engine

**Objetivo:** Plugin cargable en PS con gridGenerator funcionando.

- [ ] Inicializar proyecto con template UXP + React + TypeScript
- [ ] Configurar Webpack con externals correctos
- [ ] Setup Adobe UXP Developer Tool
- [ ] Implementar `gridGenerator.ts` con tests
- [ ] Implementar `photoshopBridge.ts` básico (clearGuides + addGuide)
- [ ] Verificar que se puede aplicar guías simples a PS

### Semana 2: UI Base — ColumnGrid

**Objetivo:** El usuario puede configurar y aplicar un grid de columnas.

- [ ] Layout principal `App.tsx` con tabs Spectrum
- [ ] `ColumnGrid.tsx` completo con todos los inputs
- [ ] Integración Zustand store ↔ ColumnGrid
- [ ] Botón "Aplicar" funcional end-to-end
- [ ] `useDocument.ts` para mostrar dimensiones del doc activo

### Semana 3: RowGrid + Margins

**Objetivo:** Filas y márgenes funcionales.

- [ ] `RowGrid.tsx` completo
- [ ] `Margins.tsx`
- [ ] Applytar target: canvas vs selección (`getSelectionBounds`)
- [ ] Modo replace vs add

### Semana 4: Presets

**Objetivo:** Sistema de presets completo.

- [ ] `presetStorage.ts`
- [ ] `Presets.tsx` + `PresetItem.tsx`
- [ ] Guardar preset con nombre desde configuración actual
- [ ] Aplicar preset (carga config en store)
- [ ] Presets built-in incluidos

### Semana 5: Freemium + Polish

**Objetivo:** Gating de features Pro + UX refinada.

- [ ] `useLicense.ts` con UXP entitlement
- [ ] `ProBadge.tsx` y gates en UI
- [ ] Límite de 3 presets Free
- [ ] Validación de inputs (mínimos, máximos)
- [ ] Mensajes de error inline

### Semana 6: Testing + Release

**Objetivo:** QA completo y publicación en Exchange.

- [ ] Tests unitarios de `gridGenerator.ts` (100% cobertura)
- [ ] Testing manual en PS macOS + Windows
- [ ] Testing con documentos en pulgadas, cm, px
- [ ] Iconos del plugin (23px y 96px)
- [ ] Build de producción + empaquetado `.ccx`
- [ ] Publicación en Adobe Exchange

---

## 20. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| UXP API de guías no funciona en todas las versiones PS | Media | Alto | Probar en PS 22, 23, 24, 25 en semana 1 |
| `executeAsModal` lento con muchas guías | Media | Medio | Benchmark con 248 guías en semana 1 |
| Review de Adobe Exchange tarda > 2 semanas | Alta | Bajo | Enviar en semana 5, no esperar a semana 6 |
| `uxp.entitlement` no disponible en versiones PS antiguas | Baja | Medio | Degradar a Free si falla, no bloquear |
| Conflictos entre CSS de Spectrum y CSS Modules | Baja | Bajo | Usar solo componentes Spectrum, CSS mínimo |
| localStorage corrupto por crash de PS | Baja | Medio | try/catch en load(), fallback a built-ins |

---

**Estado:** ✅ Arquitectura completa. Lista para iniciar implementación.

**Próximo paso:** `/oden:prd grid-columns` → Crear PRD del módulo de columnas y empezar pipeline de features.

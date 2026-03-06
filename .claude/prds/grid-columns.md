---
name: grid-columns
description: Panel de configuración de columnas que genera líneas guía verticales en Photoshop, distribuido fuera de Adobe Exchange con auto-update vía GitHub Releases
status: backlog
created: 2026-03-06T18:02:57Z
updated: 2026-03-06T18:27:46Z
competitive_analysis: true
market_research: true
subagents_used: context-analyzer, prd-interviewer
---

# PRD: Grid de Columnas (grid-columns)

## 📊 Executive Summary

El grid de columnas es la feature core de GuideMyGrid. Permite al usuario configurar un sistema de columnas (número, ancho, gutter, márgenes) y aplicarlas como líneas guía en el documento activo de Photoshop con un clic. Es la razón principal por la que un diseñador instalaría el plugin en lugar de seguir usando el diálogo nativo de PS.

**Propuesta de valor diferencial vs competencia:**
- Adobe Spectrum UI moderna (dark mode nativo, look and feel de PS)
- Preset built-in "12-col / 24px gutter / 80px margins" (Bootstrap/Material estándar)
- Flujo sin fricciones: configure → aplique → continúe diseñando
- Actualizaciones silenciosas vía Creative Cloud sin intervención del usuario

---

## 🎯 Problem Statement

### Problema Principal

Crear un grid de columnas en Photoshop de forma nativa requiere:
1. Abrir View → New Guide Layout (o escribir manualmente cada guía)
2. Si se quiere cambiar el grid, eliminar las guías antiguas y repetir
3. No hay forma de guardar configuraciones como presets reutilizables
4. Los cálculos de gutter + columnas + márgenes son manuales y propensos a error

**Resultado:** Los diseñadores pierden 5-15 minutos por documento en configuración de grids. Equipos con múltiples miembros tienen inconsistencias en sus grids.

### ¿Por qué ahora?

- Adobe migró a UXP, lo que permite plugins con UI moderna integrada al look de PS
- GuideGuide (el competidor líder) no ha tenido update significativo desde 2021, su UI es outdated
- El mercado de UX/UI designers en PS sigue creciendo con el posicionamiento de PS como herramienta de prototipado

### Competitive Landscape

| Plugin | Fortaleza | Debilidad | Oportunidad |
|--------|-----------|-----------|-------------|
| **GuideGuide** | El más conocido, freemium | UI fechada (CEP), solo columnas en Free | UI moderna + row grid en Pro |
| **Grids for Designers** | Muy robusto, muchas opciones | $49 de pago, curva de aprendizaje | Más accesible (freemium) |
| **Grid Systems** | Gratuito | Sin mantenimiento desde ~2019, no soporta PS moderno | Actualizado, soporte garantizado |
| **New Guide Layout** (nativo PS) | Sin instalación | No guarda presets, cálculos manuales | Reemplazar este flujo es el objetivo |

**Punto clave:** Ningún plugin gratuito/freemium de columnas tiene UI UXP moderna. GuideGuide sigue en CEP. Esta es la ventana de oportunidad.

---

## 👥 User Stories & Personas

### Persona 1: UX/UI Designer — Ana

- Diseña pantallas en PS (sí, aún hay muchos)
- Usa 12-col Bootstrap o Material en sus proyectos web
- Quiere aplicar el mismo grid en múltiples documentos con un clic
- Frustración: cada vez que abre un nuevo documento tiene que reconfigurar el grid

**Story:** "Como UX Designer, quiero guardar mi grid de 12 columnas favorito como preset y aplicarlo a cualquier documento nuevo en un clic, para no perder tiempo reconfigurando en cada proyecto."

**Acceptance Criteria:**
- [ ] Puedo configurar 12 columnas, 24px gutter, 80px márgenes
- [ ] Puedo guardar esa configuración como preset "12-col Web Standard"
- [ ] Al abrir un nuevo documento, aplico el preset en < 3 clics
- [ ] El panel muestra el ancho calculado de cada columna en tiempo real

### Persona 2: Diseñador Gráfico — Marco

- Crea piezas editoriales, pósters, materiales de marketing
- Sus grids varían por proyecto (4-col, 6-col, márgenes grandes)
- Quiere aplicar grids y luego ajustar manualmente algunas guías
- No quiere que el plugin borre sus guías manuales accidentalmente

**Story:** "Como diseñador gráfico, quiero poder elegir si el plugin reemplaza mis guías actuales o añade las nuevas encima, para no perder mi trabajo manual."

**Acceptance Criteria:**
- [ ] Existen dos modos claramente diferenciados: "Reemplazar" y "Agregar"
- [ ] El modo seleccionado persiste entre sesiones (no resetea a default)
- [ ] Antes de "Reemplazar", hay confirmación clara en el botón (ej. "Reemplazar guías")

### Persona 3: Motion Designer — Lucía

- Usa PS para composiciones, keyframe artworks
- Necesita precisión: grids de 8 columnas con medidas exactas en px
- Quiere ver el cálculo antes de aplicar para validar que es correcto

**Story:** "Como motion designer, quiero ver el ancho calculado de cada columna antes de aplicar para confirmar que el grid es matemáticamente correcto."

**Acceptance Criteria:**
- [ ] El panel muestra en tiempo real el ancho de cada columna basado en la configuración
- [ ] Si los márgenes o el gutter son demasiado grandes, el panel muestra un error claro antes de intentar aplicar
- [ ] Los valores aceptan decimales (para precisión en 4K y Retina)

---

## ⚙️ Requirements

### Functional Requirements

#### FR-1: Configuración de Columnas

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-1.1 | El usuario puede configurar el número de columnas (Free: 1-12, Pro: 1-24) | P0 |
| FR-1.2 | El usuario puede elegir ancho de columna: Auto (distribuye equitativamente) o Fijo (px manual) | P0 |
| FR-1.3 | El usuario puede configurar el gutter entre columnas en px | P0 |
| FR-1.4 | El usuario puede configurar margen izquierdo y derecho en px | P0 |
| FR-1.5 | El panel muestra en tiempo real el ancho calculado de columna (basado en doc activo) | P1 |
| FR-1.6 | El panel muestra un error inline si la configuración es inválida (margins > doc width, etc.) | P0 |

#### FR-2: Aplicación a Photoshop

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-2.1 | Botón "Aplicar" aplica las guías al documento activo de PS | P0 |
| FR-2.2 | Modo "Reemplazar": elimina todas las guías existentes antes de aplicar | P0 |
| FR-2.3 | Modo "Agregar": añade guías sin eliminar las existentes | P0 |
| FR-2.4 | Si no hay documento activo, el botón está deshabilitado con mensaje explicativo | P0 |
| FR-2.5 | El botón "Aplicar" se activa solo (no hay preview live) — el usuario es quien decide cuándo aplicar | P0 |

#### FR-3: Presets

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-3.1 | Preset built-in: "12-col Web Standard" (12 cols, 24px gutter, 80px márgenes) incluido por defecto | P0 |
| FR-3.2 | El usuario puede guardar la configuración actual con un nombre personalizado | P0 |
| FR-3.3 | Free: máximo 3 presets guardados por el usuario (los built-in no cuentan) | P0 |
| FR-3.4 | Pro: presets ilimitados | P1 |
| FR-3.5 | Los presets persisten entre sesiones de PS (localStorage UXP) | P0 |

#### FR-4: Indicadores Visuales

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| FR-4.1 | El panel muestra el ancho y alto del documento activo | P1 |
| FR-4.2 | Si el usuario es Free e intenta usar >12 columnas, aparece ProBadge y el input se bloquea en 12 | P0 |
| FR-4.3 | El cálculo de ancho de columna se muestra junto al input de gutter/márgenes | P1 |

### Non-Functional Requirements

#### NFR-1: Auto-Update Strategy

> **Decisión:** El plugin se distribuye **fuera de Adobe Exchange** como archivo `.ccx` descargable desde GitHub Releases o web propia. El mecanismo de auto-update es propio: el plugin consulta la GitHub Releases API en cada carga y muestra un banner si hay versión nueva.

**Flujo de update para el usuario:**
```
Plugin carga → consulta api.github.com/repos/{owner}/guidemygrid/releases/latest
  → Compara version del release con PLUGIN_VERSION hardcodeado
  → Si hay update: muestra UpdateBanner en el panel
  → Usuario hace clic en "Descargar" → descarga el .ccx desde GitHub
  → Doble-clic en el .ccx → CC Desktop instala la nueva versión
  → Presets y configuración preservados (migración de localStorage)
```

| ID | Requisito | Detalle |
|----|-----------|---------|
| NFR-1.1 | El plugin consulta GitHub Releases API al cargar el panel | GET `https://api.github.com/repos/{owner}/guidemygrid/releases/latest`. Implementado en `updateChecker.ts`. |
| NFR-1.2 | Si hay versión nueva, muestra `UpdateBanner` no intrusivo | El banner incluye número de versión, release notes breves y botón "Descargar" que abre el .ccx en el browser. |
| NFR-1.3 | Falla silenciosa si no hay red o GitHub no responde | `try/catch` en `checkForUpdates()`. El panel carga normalmente sin el banner. Nunca bloquear al usuario. |
| NFR-1.4 | `PLUGIN_VERSION`, `manifest.json version` y `package.json version` deben estar sincronizados | Checklist de release. Si no coinciden, el update check puede dar falsos positivos. |
| NFR-1.5 | `manifest.json` requiere `"network": { "domains": ["https://api.github.com"] }` | Sin este permiso, UXP bloquea la llamada HTTP. |

#### NFR-2: Schema Versioning (Backward Compatibility)

El principal riesgo técnico del update es que un cambio en `ColumnConfig` rompa presets guardados de versiones anteriores.

| Regla | Detalle |
|-------|---------|
| Toda nueva propiedad en `ColumnConfig` o `Preset` debe ser opcional en TypeScript | `newField?: string` con default en la función `migrate()` |
| Al agregar un campo nuevo, incrementar `CURRENT_VERSION` en `presetStorage.ts` | Dispara automáticamente la función `migrate()` en el próximo load |
| La función `migrate()` debe manejar todas las versiones anteriores, no solo la inmediatamente anterior | Para usuarios que saltaron varias versiones |
| Nunca eliminar un campo en un PATCH o MINOR — solo en MAJOR | Evitar datos silenciosamente perdidos |

**Ejemplo de migración correcta (v1 → v2, se añade `alignColumns`):**
```typescript
// presetStorage.ts
const CURRENT_VERSION = 2;

function migrate(data: PresetsStorage): Preset[] {
  if (data.version === 1) {
    return data.presets.map(p => ({
      ...p,
      config: {
        ...p.config,
        columns: {
          ...p.config.columns,
          alignColumns: 'left' as const // default para presets v1
        }
      },
      updatedAt: new Date().toISOString()
    }));
  }
  return builtInPresets; // versión desconocida → fallback seguro
}
```

#### NFR-3: Performance

| Operación | Target | Máximo |
|-----------|--------|--------|
| Aplicar grid (24 cols + guías) | < 1s | 3s |
| Cargar presets al abrir panel | < 50ms | 100ms |
| Cálculo de columnas (gridGenerator) | < 5ms | 20ms |
| Render inicial del panel | < 300ms | 500ms |

#### NFR-4: Compatibilidad PS

| Versión PS | Estado |
|------------|--------|
| Photoshop 22.0 (2021) | Mínimo soportado |
| Photoshop 23.x - 25.x | Soportado |
| Photoshop 26.x+ | Soportado (UXP API estable) |

Probar en PS 22, 23, 24 y 25 antes del release. Especialmente `executeAsModal` y `batchPlay` para guías.

#### NFR-5: Accesibilidad

- Todos los inputs tienen `label` correcto para screen readers
- El foco de teclado sigue un orden lógico (tab order)
- Los mensajes de error se anuncian vía ARIA live regions
- Colores cumplen WCAG AA en tema dark y light de PS

---

## 📈 Success Criteria

### Métricas de Adopción (primeros 60 días post-launch)

| Métrica | Target | Cómo medir |
|---------|--------|------------|
| Instalaciones totales | 200+ | Adobe Exchange dashboard |
| Usuarios activos (aplican grid ≥1 vez) | 60% de instalaciones | No hay analytics en MVP, estimado |
| Conversión Free → Pro | 5%+ | Adobe Exchange revenue dashboard |
| Rating en Exchange | ≥ 4.0/5 | Adobe Exchange reviews |

### Métricas de Producto

| Métrica | Target |
|---------|--------|
| Tiempo desde abrir panel hasta aplicar grid (primera vez) | < 60 segundos |
| Tasa de error al aplicar grid (grid generation error) | < 2% de los intentos |
| Presets guardados promedio por usuario Pro | ≥ 3 |

### Métricas Técnicas

| Métrica | Target |
|---------|--------|
| Crash rate del plugin | < 1% de sesiones |
| Tiempo de aplicación de guías | < 1s en documentos típicos (hasta 5000px ancho) |
| Zero data loss en updates | 100% — los presets migran correctamente entre versiones |

---

## 🚧 Constraints & Assumptions

### Technical Constraints

- **UXP runtime:** `require('photoshop')` y `require('uxp')` son los únicos accesos a PS y Adobe services.
- **executeAsModal obligatorio:** Todas las operaciones de escritura al documento deben ir en `executeAsModal`. Sin esto, PS lanza error de permisos.
- **Sin red en MVP:** `manifest.json` tiene `network.domains: []`. No se pueden hacer llamadas HTTP.
- **localStorage límite:** ~5MB por plugin. Más que suficiente para cientos de presets.
- **Unidades:** batchPlay trabaja en `pixelsUnit` explícitamente, independientemente de las unidades del documento.

### Freemium Constraints

- Free: máximo 12 columnas. El gate se aplica en UI (input bloqueado) + lógica (`gridGenerator` ignora valores > 12 en Free) — doble protección.
- La verificación de licencia (`uxp.entitlement`) puede fallar por problemas de red; en ese caso, se trata al usuario como Free (no bloquear por error de red).

### Assumptions

- Los usuarios tienen Creative Cloud Desktop instalado y configurado para recibir actualizaciones de plugins.
- Los usuarios de PS 22+ tienen UXP habilitado (viene por defecto desde PS 22.0).
- El documento activo siempre está en modo píxeles o con unidades configuradas (el plugin convierte todo a px internamente).

---

## ❌ Out of Scope (MVP)

| Feature | Razón | Consideración futura |
|---------|-------|---------------------|
| Preview live (actualización de guías en tiempo real al mover sliders) | Complejidad de throttle + latencia de batchPlay. GuideGuide tampoco lo tiene. | Post-MVP si hay demanda |
| Aplicar grid a una selección activa | Feature Pro, fuera del scope de este PRD | Definir en PRD grid-apply-to-selection |
| Detección inteligente de guías existentes del plugin | Técnicamente complejo (PS no soporta metadata en guías). Modo replace/add es suficiente | Revisar si UXP lo habilita en PS 27+ |
| Notificación in-plugin de "nueva versión disponible" | CC Desktop ya lo hace. Redundante. | No necesario |
| Exportar/compartir presets entre usuarios | Requiere backend. Out of scope MVP. | Definir en PRD preset-sharing |
| Grid de columnas para múltiples artboards simultáneos | PS no tiene artboards nativos (eso es XD/Figma) | No aplica |

---

## 🔗 Dependencies

### Internas

| Dependencia | Descripción | Estado |
|-------------|-------------|--------|
| `gridGenerator.ts` | Función pura de cálculo de posiciones. Este PRD asume que está implementada. | Pendiente (Semana 1) |
| `photoshopBridge.ts` | Wrapper de UXP APIs. Necesario para `applyGuides()` y `clearAllGuides()`. | Pendiente (Semana 1) |
| `gridStore.ts` | Zustand store para ColumnConfig. | Pendiente (Semana 2) |
| `presetsStore.ts` + `presetStorage.ts` | Sistema de presets y localStorage. | Pendiente (Semana 4) |
| `useLicense.ts` | Para gate de >12 columnas y presets limitados. | Pendiente (Semana 5) |
| `useDocument.ts` | Para mostrar ancho/alto del doc y calcular ancho de columna en tiempo real. | Pendiente (Semana 2) |

### Externas

| Dependencia | Descripción |
|-------------|-------------|
| Adobe UXP Runtime | Incluido en PS 22+. Sin instalación adicional. |
| Adobe Exchange | Para distribución y gestión de actualizaciones. Requiere cuenta de Adobe Developer. |
| Creative Cloud Desktop | Mecanismo de auto-update para usuarios finales. Instalado con cualquier producto CC. |

---

## 💡 Research Insights

### Decisión: Apply Manual vs Live Preview

**Elegido: Apply manual (botón).** Razones:
1. GuideGuide — el competidor con más usuarios — usa este modelo. Los usuarios ya están familiarizados.
2. Live preview requiere throttling + manejo de estados intermedios de batchPlay. Complejidad innecesaria para MVP.
3. El riesgo de "guías parpadeando" mientras el usuario arrastra un slider es peor UX que hacer clic en un botón.

### Decisión: Auto-Update vía Adobe Exchange

**No implementar mecanismo propio.** Adobe Exchange + Creative Cloud Desktop ya proveen:
- Notificación de "plugin update available" en CC Desktop
- Auto-update silencioso si el usuario lo habilita (opción en CC Preferences)
- Zero trabajo adicional del desarrollador más allá de publicar nueva versión

**Lo que SÍ es responsabilidad del desarrollador:**
- Mantener `CURRENT_VERSION` en `presetStorage.ts` actualizado
- Implementar la función `migrate()` correctamente para cada cambio de schema
- Nunca hacer propiedades existentes non-optional sin incrementar MAJOR version

### Decisión: Preset Built-in

**Elegido: "12-col / 24px gutter / 80px márgenes"** porque:
- Es el estándar de Bootstrap 5 (el sistema de grid más usado en web)
- Material Design usa 12 columnas con 24px gutter
- Los UX/UI Designers lo reconocerán instantáneamente
- Proporciona valor desde el primer uso sin necesidad de configurar nada

---

## 📋 Next Steps

1. **Validar con stakeholders** — Confirmar que los límites Free/Pro son correctos (12 col / 3 presets).
2. **Crear Epic:** `/oden:epic grid-columns` — Descomponer en tasks de implementación.
3. **Semana 1:** Implementar `gridGenerator.ts` + tests + `photoshopBridge.ts` básico.
4. **Semana 2:** Implementar `ColumnGrid.tsx` + integración end-to-end.
5. **Preparar Adobe Developer Console:** Crear la listing en Exchange antes del Semana 6 para no bloquearse en review.

---

**Generado con:** Investigación de contexto técnico + brainstorming interactivo (Oden Forge)
**Próximo comando:** `/oden:epic grid-columns`

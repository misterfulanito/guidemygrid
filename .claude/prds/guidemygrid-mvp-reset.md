---
name: guidemygrid-mvp-reset
status: in-progress
created: 2026-03-08T01:31:52Z
updated: 2026-03-08T01:31:52Z
---

# PRD — GuideMyGrid MVP Reset

## Objetivo

Reescribir el plugin desde cero con el mínimo de features funcionales y sin deuda técnica de la versión anterior.

## Alcance del MVP

### Qué incluye
- Generación de guías de columnas dentro de la selección activa (marquee) o del canvas si no hay selección
- Campo Gutter, habilitado solo cuando Quantity > 0
- Campo Width (calculado, siempre deshabilitado)
- Botón "Add guides" deshabilitado hasta que Quantity tenga valor
- Botón "Remove" elimina TODAS las guías (del plugin o del usuario)
- Eye toggle muestra/oculta todas las guías del documento
- Texto de versión del plugin

### Qué NO incluye
- Rows
- Margins con inputs configurables
- Position offset
- Toolbar de alineación
- Múltiples tabs (Custom, Saved, Presets)
- Border guides toggle
- Linked margins toggle
- Apply mode (replace vs add)
- Iconos SVG en botones

## Comportamiento detallado

### Inputs
- **Quantity**: numérico, vacío por defecto, placeholder "Quantity"
- **Width**: deshabilitado, calculado automáticamente, placeholder "Width"
- **Gutter**: deshabilitado si Quantity está vacío o es 0, placeholder "Gutter"
- Si el campo se borra, debe mostrar el placeholder

### Cálculo de Width
`Width = (containerWidth - (Quantity - 1) * Gutter) / Quantity`
- containerWidth = ancho de la selección activa, o ancho del canvas si no hay selección
- Gutter = 0 si está vacío

### Generación de guías
- Con selección marquee activa: guías dentro de los bounds de la selección
- Sin selección: guías en todo el canvas
- Las guías son verticales (columnas)

### Add guides
- Deshabilitado si Quantity está vacío o vacío
- Al hacer clic: genera guías de columnas y las aplica al documento activo
- Siempre reemplaza las guías existentes del plugin (no acumula)

### Remove
- Elimina TODAS las guías del documento activo (sin importar origen)
- Siempre disponible (no se deshabilita)

### Eye toggle
- Alterna visibilidad de todas las guías del documento

## Diseño de referencia

Pencil: "GuideForge - Plugin - MVP" (archivo GuideMyGrid)

### Tokens de diseño
- Font: PT Sans
- Background panel: #1A1A1A
- Background toolbar/tabbar: #212121
- Background input: #2D2D2D
- Background input disabled (gutter): #3D3D3D
- Accent: #FF6B35
- Text primary: #FFFFFF
- Text placeholder/secondary: #777777
- Text placeholder disabled: #555555
- Version text: #555555

### Layout
- Width total: 320px
- Tab bar: 36px alto, "Grid" label con underline naranja, eye icon naranja a la derecha
- Content: padding 16px, solo sección Columns
- Columns header: icon columns-3 (naranja) + label "Columns" bold
- Inputs row: [Quantity] [Width] [Gutter] — flex row, gap 8px, cada uno flex:1
- Bottom bar: 52px alto, [Add guides (flex:1)] [Remove button]
- Version bar: 28px alto, centrado, "GuideMyGrid v{VERSION}"

### Botones
- Add guides: bg #FF6B35, texto dark #0D0D0D, "+" text prefix, PT Sans 12px bold
- Remove: bg #2D2D2D, texto blanco, "Remove" label, PT Sans 12px bold
- Sin iconos SVG en botones — texto plano o prefijo de texto

## Stack técnico
- React 18 + TypeScript
- CSS Modules
- Zustand (estado mínimo)
- UXP (Photoshop plugin)
- Webpack 5

## Restricciones UXP conocidas
- SVG dentro de `<button>` no renderiza — usar texto plano
- `display: grid` tiene bugs — usar flexbox
- `input type="number"` renderiza stepper nativo — usar `type="text" inputMode="numeric"`
- CSS custom properties deben definirse en `:root, body, #root`
- HTML width/height en SVG se ignoran — usar CSS class

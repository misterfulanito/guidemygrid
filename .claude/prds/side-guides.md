---
name: side-guides
status: backlog
created: 2026-03-10T22:52:09Z
updated: 2026-03-10T22:52:09Z
---

# PRD: Side Guides — Líneas en Bordes y Centro

## Problema

El usuario necesita crear guías en posiciones absolutas del canvas (bordes y centro) de forma inmediata, sin tener que ingresar valores numéricos manualmente. Los flujos actuales (Columns, Rows, Margins) requieren configuración y clic en "Add Guides". Para posiciones estándar como bordes y centros, eso es fricción innecesaria.

## Solución

Una barra de 6 botones de acción rápida que crean guías de forma inmediata al hacer clic. Sin configuración, sin "Add Guides" — un clic = una guía.

## Usuarios objetivo

Diseñadores y UXers que trabajan con Photoshop y necesitan establecer rápidamente guías de referencia en posiciones canónicas del documento o selección activa.

## Funcionalidades

### Barra de Side Guides

6 botones de acción inmediata:

| Posición | Icono (Lucide) | Guía generada |
|---|---|---|
| Izquierda | `AlignStartVertical` | Vertical en x=0 (o borde izq de selección) |
| Centro vertical | `AlignCenterVertical` | Vertical en x=width/2 |
| Derecha | `AlignEndVertical` | Vertical en x=width |
| Arriba | `AlignStartHorizontal` | Horizontal en y=0 (o borde sup de selección) |
| Centro horizontal | `AlignCenterHorizontal` | Horizontal en y=height/2 |
| Abajo | `AlignEndHorizontal` | Horizontal en y=height |

### Comportamiento

- **Acción inmediata**: clic → guía creada, sin botón "Add Guides"
- **Context-aware**: si hay selección activa en Photoshop, usa las dimensiones y posición de la selección; si no hay selección, usa el canvas completo
- **Modo additive**: no borra guías existentes — agrega la nueva
- **Feedback visual**: botón briefly active state al hacer clic

### Iconografía

- Librería: **lucide-react**
- Instalar como dependencia del proyecto
- Los 6 iconos: `AlignStartVertical`, `AlignCenterVertical`, `AlignEndVertical`, `AlignStartHorizontal`, `AlignCenterHorizontal`, `AlignEndHorizontal`
- Los iconos existentes (sección icons en GridPanel) también migrar a lucide-react para consistencia

### UI

- Barra ubicada debajo del tab bar y el eye button, encima de la sección Margins
- Mismos estilos que el diseño actual: fondo `#1A1A1A`, botones `#2D2D2D`, hover `#3D3D3D`, icono `#FFF`
- Layout: flexbox, 6 botones iguales distribuidos en el ancho del panel

## Fuera de scope (este epic)

- Guías en posiciones arbitrarias (tercios, cuartos, etc.)
- Configuración de cantidad de guías por posición
- Deshacer guías individuales creadas con side guides

## Diseño de referencia

Frame en Pencil: `GuideForge - Side Guides` (ID: `DtubC`)

## Versión objetivo

v1.5.0

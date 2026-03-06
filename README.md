# GuideMyGrid

**Plugin de Adobe Photoshop para generar retículas y líneas guía con precisión.**

Configura columnas, filas y márgenes en segundos — sin hacer cálculos manualmente.

<br>

[![Version](https://img.shields.io/github/v/release/misterfulanito/guidemygrid?label=versión&style=flat-square&color=0066cc)](https://github.com/misterfulanito/guidemygrid/releases/latest)
[![Photoshop](https://img.shields.io/badge/Photoshop-22.0%2B-blue?style=flat-square&logo=adobe-photoshop&logoColor=white)](https://github.com/misterfulanito/guidemygrid/releases/latest)
[![Platform](https://img.shields.io/badge/plataforma-macOS%20%7C%20Windows-lightgrey?style=flat-square)](https://github.com/misterfulanito/guidemygrid/releases/latest)
[![License](https://img.shields.io/badge/licencia-MIT-green?style=flat-square)](LICENSE)

---

## ¿Qué es GuideMyGrid?

GuideMyGrid es un plugin UXP para Adobe Photoshop que genera automáticamente líneas guía basadas en una retícula configurable. Ideal para diseñadores UX, diseñadores gráficos y equipos de marketing que trabajan con sistemas de diseño y grids de columnas.

En lugar de calcular y colocar cada guía a mano, defines tu retícula una vez y el plugin la aplica al documento en un clic.

---

## Características

### Grid de columnas
Configura la cantidad de columnas, el gutter entre ellas y los márgenes laterales. El plugin calcula y coloca todas las guías verticales automáticamente.

### Grid de filas
Define filas con espaciado configurable para crear una retícula de baseline o una cuadrícula modular completa.

### Márgenes independientes
Establece márgenes superiores, inferiores, izquierdo y derecho de forma independiente, sin que afecten al cálculo de las columnas.

### Modo Replace / Add
- **Reemplazar**: borra las guías existentes y aplica las nuevas (flujo de trabajo limpio)
- **Añadir**: suma las nuevas guías sobre las existentes (para combinar retículas)

### Presets
Guarda tus configuraciones más usadas con nombre propio y recupéralas en cualquier documento. Incluye dos presets predefinidos listos para usar:
- **12-col Web** — retícula de 12 columnas con gutter 24px y márgenes 80px (compatible con Bootstrap y Material Design)
- **8pt Grid** — retícula de filas fijas de 8px, el estándar para sistemas de diseño

### Aviso de actualización
Cuando hay una nueva versión disponible, el plugin muestra un aviso en la parte superior del panel con un enlace directo a la descarga.

---

## Instalación

### Requisitos
- Adobe Photoshop 22.0 o superior
- Creative Cloud Desktop instalado

### Pasos

1. Ve a la sección **[Releases](https://github.com/misterfulanito/guidemygrid/releases/latest)** de este repositorio
2. Descarga el archivo `guidemygrid-vX.X.X.ccx` de la última versión
3. **Doble-clic** en el archivo `.ccx` — Creative Cloud Desktop abrirá un diálogo de confirmación
4. Acepta la instalación
5. Abre Photoshop y ve a **Plugins → GuideMyGrid**

> El plugin aparece como panel flotante. Puedes acoplarlo junto a tus otros paneles de Photoshop.

---

## Cómo usarlo

### 1. Configura tu retícula

En la pestaña **Grid**, activa las secciones que necesites con el toggle de cada una:

| Sección | Qué configura |
|---------|--------------|
| **Márgenes** | Offset desde cada borde del documento (Top, Right, Bottom, Left) |
| **Columnas** | Número de columnas, gutter y margen lateral |
| **Filas** | Número de filas y espaciado vertical |

Los inputs usan **píxeles** y se aplican sobre las dimensiones reales del documento activo.

### 2. Elige el modo de aplicación

- **Reemplazar** — limpia las guías existentes antes de aplicar (recomendado para empezar)
- **Añadir** — acumula guías (útil para combinar una retícula de columnas con una de baseline)

### 3. Aplica

Clic en **Aplicar guías**. Las guías aparecen en el documento al instante.

Si no tienes ningún documento abierto en Photoshop, el botón se desactiva automáticamente.

### 4. Guarda como preset (opcional)

Si vas a reutilizar esta configuración, ve a la pestaña **Saved**, escribe un nombre y haz clic en **Guardar**. El preset persiste entre sesiones de Photoshop.

---

## Casos de uso típicos

- **Landing pages y webs** — retícula de 12 columnas con el margen del diseño sistema
- **Apps móviles** — retícula de 4 u 8 columnas a partir de las guías de plataforma
- **Materiales impresos** — retícula modular con columnas y filas de módulo fijo
- **Sistemas de diseño** — baseline grid de 8pt para consistencia tipográfica
- **Anuncios y banners** — márgenes de seguridad estandarizados por formato

---

## Desarrollo local

### Requisitos
- Node.js 18 o superior
- npm

### Setup

```bash
git clone https://github.com/misterfulanito/guidemygrid.git
cd guidemygrid
npm install
```

### Comandos

```bash
npm run build      # Build de producción → dist/
npm run dev        # Watch mode para desarrollo
npm test           # Tests unitarios (Jest)
npm run type-check # Verificar TypeScript sin compilar
```

### Empaquetar .ccx para distribución

```bash
npm run build
cd dist && zip -r ../guidemygrid-vX.X.X.ccx . && cd ..
```

### Cargar en Photoshop durante desarrollo

En Photoshop: **Plugins → Development → Load Unsigned Plugin** → selecciona la carpeta `dist/`.

---

## Stack técnico

| Tecnología | Uso |
|-----------|-----|
| [UXP](https://developer.adobe.com/photoshop/uxp/) | Runtime del plugin (APIs de Photoshop) |
| React 18 | UI del panel |
| TypeScript | Tipado estático |
| Zustand | State management |
| Webpack 5 | Build y bundling |
| Jest | Tests unitarios |

---

## Arquitectura

```
src/
├── components/
│   ├── ColumnGrid/     # Panel principal (GridPanel)
│   ├── Presets/        # Panel de presets guardados
│   └── shared/         # Componentes reutilizables (NumberInput, Toggle…)
├── services/
│   ├── gridGenerator.ts     # Lógica pura de cálculo de guías (sin UXP)
│   ├── photoshopBridge.ts   # Comunicación con PS via executeAsModal + batchPlay
│   ├── presetStorage.ts     # Persistencia via localStorage
│   └── updateChecker.ts     # Consulta GitHub API para versiones nuevas
├── store/              # Zustand stores (grid, presets, UI)
├── hooks/              # useDocument (dimensiones del doc activo)
└── types/              # Interfaces TypeScript compartidas
```

La lógica de cálculo (`gridGenerator.ts`) está completamente desacoplada de UXP, lo que permite testearla con Jest sin dependencias de Photoshop.

---

## Contribuir

1. Fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Haz tus cambios y añade tests si aplica
4. Abre un Pull Request con descripción del cambio

Para bugs o sugerencias, abre un [Issue](https://github.com/misterfulanito/guidemygrid/issues).

---

## Licencia

MIT — libre para uso personal y comercial. Ver [LICENSE](LICENSE) para más detalles.

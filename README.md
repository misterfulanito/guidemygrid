# GuideMyGrid

**Adobe Photoshop plugin for generating grids and guide lines with precision.**

Set up columns, rows, and margins in seconds — no manual calculations required.

<br>

[![Version](https://img.shields.io/github/v/release/misterfulanito/guidemygrid?label=version&style=flat-square&color=0066cc)](https://github.com/misterfulanito/guidemygrid/releases/latest)
[![Photoshop](https://img.shields.io/badge/Photoshop-22.0%2B-blue?style=flat-square&logo=adobe-photoshop&logoColor=white)](https://github.com/misterfulanito/guidemygrid/releases/latest)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey?style=flat-square)](https://github.com/misterfulanito/guidemygrid/releases/latest)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

## What is GuideMyGrid?

GuideMyGrid is a UXP plugin for Adobe Photoshop that automatically generates guide lines based on a configurable grid. Ideal for UX designers, graphic designers, and marketing teams who work with design systems and column grids.

Instead of calculating and placing each guide by hand, you define your grid once and the plugin applies it to the document in one click.

---

## Features

### Column Grid
Configure the number of columns, the gutter between them, and the side margins. The plugin calculates and places all vertical guides automatically.

### Row Grid
Define rows with configurable spacing to create a baseline grid or a complete modular grid.

### Independent Margins
Set top, bottom, left, and right margins independently, without affecting the column calculation.

### Side Guides bar
A quick-access toolbar with 6 buttons that place single guide lines at key positions on the document canvas:

- **Left** — places a vertical guide at the left margin offset
- **Right** — places a vertical guide at the right margin offset
- **Top** — places a horizontal guide at the top margin offset
- **Bottom** — places a horizontal guide at the bottom margin offset
- **Center H** — places a horizontal guide at the vertical center of the canvas
- **Center V** — places a vertical guide at the horizontal center of the canvas

Each button respects the current Apply Mode (Replace / Add) and requires an open document.

### Replace / Add Mode
- **Replace**: clears existing guides and applies the new ones (clean workflow)
- **Add**: adds the new guides on top of existing ones (for combining grids)

### Presets
Save your most-used configurations with a custom name and restore them in any document. Includes two predefined presets ready to use:
- **12-col Web** — 12-column grid with 24px gutter and 80px margins (compatible with Bootstrap and Material Design)
- **8pt Grid** — fixed row grid of 8px, the standard for design systems

### Update Notice
When a new version is available, the plugin displays a notice at the top of the panel with a direct link to the download.

---

## Installation

### Requirements
- Adobe Photoshop 22.0 or higher
- Creative Cloud Desktop installed

### Steps

1. Go to the **[Releases](https://github.com/misterfulanito/guidemygrid/releases/latest)** section of this repository
2. Download the `guidemygrid-vX.X.X.ccx` file from the latest release
3. **Double-click** the `.ccx` file — Creative Cloud Desktop will open a confirmation dialog
4. Accept the installation
5. Open Photoshop and go to **Plugins → GuideMyGrid**

> The plugin appears as a floating panel. You can dock it alongside your other Photoshop panels.

---

## How to use it

### 1. Configure your grid

In the **Grid** tab, enable the sections you need using each section's toggle:

| Section | What it configures |
|---------|-------------------|
| **Margins** | Offset from each document edge (Top, Right, Bottom, Left) |
| **Columns** | Number of columns, gutter, and side margin |
| **Rows** | Number of rows and vertical spacing |

Inputs use **pixels** and are applied against the actual dimensions of the active document.

### 2. Choose the apply mode

- **Replace** — clears existing guides before applying (recommended to start fresh)
- **Add** — accumulates guides (useful for combining a column grid with a baseline grid)

### 3. Apply

Click **Apply guides**. The guides appear in the document instantly.

If you have no document open in Photoshop, the button is automatically disabled.

### 4. Save as a preset (optional)

If you plan to reuse this configuration, go to the **Saved** tab, type a name, and click **Save**. The preset persists across Photoshop sessions.

---

## Typical use cases

- **Landing pages and websites** — 12-column grid with the design system margin
- **Mobile apps** — 4 or 8-column grid based on platform guidelines
- **Print materials** — modular grid with fixed-module columns and rows
- **Design systems** — 8pt baseline grid for typographic consistency
- **Ads and banners** — standardized safety margins per format

---

## Local development

### Requirements
- Node.js 18 or higher
- npm

### Setup

```bash
git clone https://github.com/misterfulanito/guidemygrid.git
cd guidemygrid
npm install
```

### Commands

```bash
npm run build      # Production build → dist/
npm run dev        # Watch mode for development
npm test           # Unit tests (Jest)
npm run type-check # Check TypeScript without compiling
```

### Package .ccx for distribution

```bash
npm run build
cd dist && zip -r ../guidemygrid-vX.X.X.ccx . && cd ..
```

### Load in Photoshop during development

In Photoshop: **Plugins → Development → Load Unsigned Plugin** → select the `dist/` folder.

---

## Tech stack

| Technology | Usage |
|-----------|-------|
| [UXP](https://developer.adobe.com/photoshop/uxp/) | Plugin runtime (Photoshop APIs) |
| React 18 | Panel UI |
| TypeScript | Static typing |
| Zustand | State management |
| Webpack 5 | Build and bundling |
| Jest | Unit tests |

---

## Architecture

```
src/
├── components/
│   ├── ColumnGrid/     # Main panel (GridPanel)
│   ├── Presets/        # Saved presets panel
│   └── shared/         # Reusable components (NumberInput, Toggle...)
├── services/
│   ├── gridGenerator.ts     # Pure guide calculation logic (no UXP)
│   ├── photoshopBridge.ts   # Communication with PS via executeAsModal + batchPlay
│   ├── presetStorage.ts     # Persistence via localStorage
│   └── updateChecker.ts     # Queries GitHub API for new versions
├── store/              # Zustand stores (grid, presets, UI)
├── hooks/              # useDocument (active document dimensions)
└── types/              # Shared TypeScript interfaces
```

The calculation logic (`gridGenerator.ts`) is completely decoupled from UXP, which allows testing it with Jest without any Photoshop dependencies.

---

## Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-improvement`
3. Make your changes and add tests if applicable
4. Open a Pull Request with a description of the change

For bugs or suggestions, open an [Issue](https://github.com/misterfulanito/guidemygrid/issues).

---

## License

MIT — free for personal and commercial use. See [LICENSE](LICENSE) for more details.

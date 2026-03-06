# GuideMyGrid

Plugin de Adobe Photoshop para generar retículas y líneas guía con precisión.

[![Latest Release](https://img.shields.io/github/v/release/misterfulanito/guidemygrid?label=descargar&style=flat-square)](https://github.com/misterfulanito/guidemygrid/releases/latest)

---

## Instalación

1. Ve a [Releases](https://github.com/misterfulanito/guidemygrid/releases/latest) y descarga `guidemygrid-vX.X.X.ccx`
2. Doble-clic en el archivo `.ccx` — Creative Cloud Desktop lo instalará automáticamente
3. Abre Photoshop → **Plugins → GuideMyGrid**

**Requisitos:** Photoshop 22.0 o superior · Creative Cloud Desktop

---

## Qué incluye

- **Grid de columnas** — configura cantidad, gutter y márgenes
- **Grid de filas** — configura cantidad y espaciado
- **Márgenes** — define márgenes independientes para cada lado del documento
- **Modo Replace / Add** — reemplaza o añade guías sobre las existentes
- **Presets** — guarda y reutiliza configuraciones (built-ins: 12-col Web, 8pt Grid)
- **Actualización automática** — el plugin avisa cuando hay una versión nueva

---

## Desarrollo local

```bash
npm install
npm run build      # Producción → dist/
npm test           # Tests unitarios

# Empaquetar .ccx
cd dist && zip -r ../guidemygrid-v1.0.0.ccx . && cd ..
```

**Stack:** React 18 · TypeScript · Zustand · Webpack · UXP (Adobe)

---

## Licencia

MIT

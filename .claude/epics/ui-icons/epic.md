---
name: ui-icons
status: in-progress
progress: 0%
created: 2026-03-12T21:24:35Z
updated: 2026-03-12T21:29:01Z
---

# Epic: ui-icons — Graphic Corrections & Native UI System

## Overview

Redesign all icons and button styles in GuideMyGrid to achieve a consistent, native-feeling UI inside the Adobe Photoshop UXP panel. This epic covers the Side Guides bar icon prototypes, section icons for Margins/Columns/Rows, guide management controls, and a unified button design system.

## Target version: v1.6.0

## Work Streams

### Stream 1 — Side Guides icon prototypes
Test and validate new SVG icons for the 6 guide position buttons.
Files: `src/components/SideGuidesBar/`

### Stream 2 — Section icons
Add icons for Margins, Columns, and Rows section headers.
Files: `src/components/ColumnGrid/`, `src/components/shared/`

### Stream 3 — Guide management icons
Add show/hide guides toggle icon and delete guides button icon.
Files: `src/components/ColumnGrid/GridPanel.tsx`

### Stream 4 — Button UI standardization
Unify border-radius, padding, states (hover, active, disabled, loading) and color tokens across all button types.
Files: `src/styles/tokens.css`, `src/components/SideGuidesBar/SideGuidesBar.module.css`, `src/components/ColumnGrid/GridPanel.module.css`

## Tasks Created

- 001: Test new left-guide icon & square button style
- 002: New icons for Margins, Columns, and Rows
- 003: Icons for show/hide guides and delete guides
- 004: Button UI standardization — native Adobe system
github: https://github.com/misterfulanito/guidemygrid/issues/38

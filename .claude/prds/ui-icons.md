---
name: ui-icons
description: Graphic corrections and native-feeling UI icon system for GuideMyGrid
status: in-progress
created: 2026-03-12T21:24:35Z
updated: 2026-03-12T21:24:35Z
---

# PRD: UI Icons & Native Design System

## Problem

The current GuideMyGrid UI uses custom SVG icons that feel inconsistent and do not look native inside the Adobe Photoshop panel environment. Icon sizing, stroke weight, and button styling are inconsistent across sections (Side Guides, Margins, Columns, Rows, guide controls).

## Goal

Redesign the icon set and button system to feel native to Adobe's UXP panel aesthetic. All interactive controls — guide position buttons, section controls, and guide management actions — should use a unified visual language.

## Scope

1. New icon prototypes for guide position buttons (Side Guides bar)
2. Icons for Margins, Rows, and Columns section headers/controls
3. Icons for show/hide guides and delete guides actions
4. Button UI standardization (shape, radius, states) to match Adobe native feel

## Success Criteria

- Icons are visually consistent in size, stroke weight, and style
- Buttons feel native inside the Photoshop UXP panel
- All icons render correctly in UXP (no fill artifacts, no invisible SVGs)
- Active, hover, and disabled states are clear and accessible

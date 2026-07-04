# Phase 1: Foundation & macOS Installer Rework - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 1-Foundation & macOS Installer Rework
**Areas discussed:** Branch strategy, Installer feel, Quit-PS guard, Success feedback, Design

---

## Branch Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Merge both into this branch | Merge origin/main into epic/ui-icons — keeps UI work and adds installer work | ✓ |
| Start fresh from main | New branch off origin/main; epic/ui-icons parked separately | |
| Let me explain | Freeform alternative plan | |

**User's choice:** Merge both into this branch
**Notes:** None further requested — settled in one round.

---

## Installer Feel

| Option | Description | Selected |
|--------|-------------|----------|
| Small confirmation dialog | "Install GuideMyGrid?" with Install button | ✓ |
| Fully silent | No window at all, just copies files | |
| Let me explain | Freeform alternative | |

**User's choice:** Small confirmation dialog

| Option | Description | Selected |
|--------|-------------|----------|
| "Install GuideMyGrid" | Clear, matches product name | ✓ |
| Just "GuideMyGrid" | Shorter, could be confused with the plugin itself | |
| Let me explain | Freeform alternative | |

**User's choice:** "Install GuideMyGrid"
**Notes:** None further requested — settled in one round.

---

## Quit-PS Guard

| Option | Description | Selected |
|--------|-------------|----------|
| Hard block | Refuse to proceed until Photoshop is quit | ✓ |
| Warn but allow | Show a warning but let the user proceed anyway | |
| Let me explain | Freeform alternative | |

**User's choice:** Hard block
**Notes:** None further requested — settled in one round.

---

## Success Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| "Installed! Open Photoshop" dialog | Confirms success, tells user what to do next | ✓ |
| Nothing | Installer quits/closes silently | |
| Let me explain | Freeform alternative | |

**User's choice:** "Installed! Open Photoshop" dialog
**Notes:** None further requested — settled in one round.

---

## Design

**Initial framing:** Asked what "Design" meant given the user built the icon system in epic/ui-icons.

| Option | Description | Selected |
|--------|-------------|----------|
| Visual branding of the installer itself | Should match GuideMyGrid's visual identity | (superseded by freeform) |
| Let me explain | Freeform | ✓ |

**User's choice (freeform):** "Follow the designs that is already created. Same icons, colors, and UI. Do not change it."
**Notes:** Interpreted as a hard constraint — reuse existing icons/colors/UI verbatim, do not design anything new for the installer's visual chrome.

---

## Claude's Discretion

- Exact merge conflict resolution mechanics between epic/ui-icons and origin/main
- Directory structure implementation details within `distribution/photoshop/macos/` and `release/`
- Exact wording of dialog copy beyond the captured intent
- Technical choice of installer-building tool (osacompile + ad-hoc codesign + create-dmg, per STACK.md research)

## Deferred Ideas

None — discussion stayed within this phase's scope.

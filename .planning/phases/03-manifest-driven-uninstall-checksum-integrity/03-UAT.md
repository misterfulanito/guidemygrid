---
status: complete
phase: 03-manifest-driven-uninstall-checksum-integrity
source: [03-VERIFICATION.md]
started: 2026-07-07T16:05:27Z
updated: 2026-07-07T16:46:30Z
---

## Current Test

[testing complete]

## Tests

### 1. Push the branch and confirm `macos-ccx-verify.yml` goes green on GitHub Actions
expected: Job `verify-macos-ccx` completes and reports success (builds .ccx, asserts no requiredPermissions, asserts no retired scripts present)
result: pass

### 2. Reconcile the pre-existing Windows CI failure against the phase's own "both green" validation bar
expected: Confirm this is accepted as out-of-scope/pre-existing (consistent with REQUIREMENTS.md marking WIN-05 "deferred") rather than a Phase 3 regression
result: issue
reported: "There is a minor bug. The plugin is not detecting the document or the canvas until the user makes a marquee selection. This is a friction because it is not meant to do that, the Top, Left, Right, Margins are not clickable and they should be. All the other fields are available but nothing happens if the Add Guides button is clicked on. As I said, the only way to make it run is using the marquee or a selection tool, which is not good."
severity: major

### 3. Confirm plain-language quality of VERIFY.md and review depth of 03-SECURITY-REVIEW.md
expected: Both documents read as clear, accurate, and appropriately scoped for a self-described non-technical audience
result: pass

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Panel detects the active document/canvas as soon as a document is open in Photoshop, without requiring a selection"
  status: failed
  reason: "User reported: plugin does not detect the document/canvas until a marquee/select-all selection is made; Top/Left/Right/Bottom margin fields and Add Guides are inert until then. Confirmed after reinstalling the plugin (rules out stale install). User confirms this is a regression vs previous builds. NOT a Phase 3 regression: git log shows src/hooks/useDocument.ts and src/services/photoshopBridge.ts have not been touched by any 03-* commit (last change was adcd15e, a pre-phase-3 refactor). Reported during Test 2 but unrelated to that test's actual subject (Windows CI); logged here because it surfaced during UAT."
  severity: major
  test: 2
  root_cause: "photoshopBridge.getActiveDocument() (src/services/photoshopBridge.ts:14) calls hasActiveSelection() -> getSelectionBounds(), which wraps a batchPlay call in photoshop.core.executeAsModal(). On initial panel mount, UXP has not yet granted the panel modal scope, so executeAsModal can throw. The exception is not caught locally in getActiveDocument()/hasActiveSelection(), so it bubbles up and is caught by useDocument.ts's refresh() catch block, which sets `document` to null even though a document is genuinely open. A later 'select' notification (e.g. Cmd+A) re-triggers refresh(); by then modal scope is available and it succeeds — matching the screenshots exactly (no-doc message with doc open, then 'Selection: 1000 x 1000 px' after select-all)."
  artifacts:
    - path: "src/services/photoshopBridge.ts:14-25"
      issue: "getActiveDocument() lets a getSelectionBounds()/executeAsModal() failure reject the whole call instead of degrading gracefully"
    - path: "src/hooks/useDocument.ts:21-39"
      issue: "refresh()'s catch sets document to null on ANY error from getActiveDocument(), including selection-check-only failures"
  missing:
    - "Wrap the hasActiveSelection() call inside getActiveDocument() in its own try/catch defaulting to hasSelection: false, so a modal-scope timing failure only affects selection state, not document presence"
  regression_confirmed: true
  out_of_phase_scope: true

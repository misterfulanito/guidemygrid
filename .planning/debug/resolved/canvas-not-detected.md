---
status: resolved
trigger: "The issue continues, when the document opens, the plugin doesn't detect the canvas size by default. How do you recommend to discuss or resolve this problem? If there is not a way to solve this, what other alternatives do we have?"
created: 2026-07-07T17:21:12Z
updated: 2026-07-07T19:05:55Z
---

## Current Focus
<!-- OVERWRITE on each update - always reflects NOW -->

hypothesis: RESOLVED. New/never-saved documents (File > New) created while the panel is docked were not being reliably detected. The final shipped solution is a LAYERED, defense-in-depth document-detection reliability improvement — NOT a single mechanism and NOT a pure UX workaround. All layers ship together and were confirmed working as a whole in real Photoshop after a proper rebuild (`npm run package`) + uninstall/reinstall of the regenerated .ccx: (1) a 'make' event listener in useDocument.ts, (2) a 1s poll fallback (documentWatcher.ts) re-reading app.activeDocument.id, (3) an app.documents[last] fallback (a different API surface than app.activeDocument) in both readActiveDocumentId and getActiveDocument, and (4) a dismissible, self-clearing DocumentHintBanner as the last-resort safety net. Individual attribution between the 'make' event listener and the 1s poll is NOT established — both fire simultaneously and either/both may be catching the new document. Both remain in place intentionally (belt and suspenders); this is fine and needs no further resolution.
test: n/a — confirmed working in production.
expecting: n/a — confirmed working in production.
next_action: DONE. Human UAT CONFIRMED in real Photoshop (correctly-built + reinstalled .ccx): File > New now auto-detects the canvas and populates Canvas W/H with no manual action; the banner's × dismiss works; File > Open remains unaffected. Session finalized and archived to .planning/debug/resolved/.
reasoning_checkpoint:
  hypothesis: "New-document (File > New) detection was unreliable while the panel is docked. The correct fix is a layered set of detection signals stacked together — 'make' event listener + 1s poll of app.activeDocument.id + app.documents[last] fallback (a different API surface) — with a dismissible, self-clearing hint banner as the last-resort safety net if all detection paths fail."
  confirming_evidence:
    - "Human UAT (correctly-built + reinstalled .ccx): File > New now auto-detects the canvas and populates Canvas W/H WITHOUT any manual selection. Confirmed working."
    - "The banner's × dismiss button was confirmed working."
    - "File > Open (existing document) confirmed unaffected / still working."
    - "The two earlier 'still broken' human-verify reports (make-event-only fix; polling-only fix — recorded in Eliminated) were FALSE NEGATIVES: the user was testing a stale pre-session .ccx build both times (confirmed via file mtime), NOT the actual fixed code. They are testing-environment artifacts, not genuine falsifications of the individual mechanisms."
  falsification_test: "n/a — resolved and confirmed in production. Would only reopen if File > New regressed to non-detection, or File > Open regressed, on a correctly-built install."
  fix_rationale: "Because the two earlier 'eliminated' mechanisms were never validly tested (stale builds), none of the detection layers were genuinely falsified. Rather than pick one, the shipped fix keeps ALL of them stacked — the 'make' event (fast path), the 1s poll (event-taxonomy-independent fallback), and the app.documents[last] fallback (different API surface) — plus the dismissible banner as a guaranteed last-resort safety net. Defense in depth: if any single layer misses, another catches it, and the banner covers the case where all fail."
  blind_spots: "Exact credit between the 'make' event listener and the 1s poll cannot be attributed — both are active simultaneously. This is intentional (belt and suspenders) and requires no further work. Banner conditional/dismiss/reset behavior has no component-render test infra (no @testing-library/react) and was human-verify only."
tdd_checkpoint: null

## Symptoms
<!-- Written during gathering, then immutable -->

expected: When a document opens (specifically: creating a new document via File > New) while the panel is already open/docked, the panel should automatically detect the document and populate the Canvas width/height fields without any manual action.
actual: The panel shows the top-level empty state "Open a document in Photoshop to get started." even though a document is open, with a "Canvas:" label rendered blank/empty beneath it (see attached screenshot in conversation). This is a stronger failure than "wrong dimensions" — it looks like the document is not detected at all, not just its size.
errors: None reported/observed by the user directly (no visible error toast); console-level [GMG] error logs not yet checked.
reproduction: Create a new document (File > New) in Photoshop while the GuideMyGrid panel is already open/docked.
started: User reports this started AFTER the 03-05 gap-closure fix (getActiveDocument() hasActiveSelection try/catch hardening) shipped — i.e. a regression, not a pre-existing issue. Note for investigator: 03-05's SUMMARY claims scope was confined to photoshopBridge.ts only (useDocument.ts untouched) — this timing correlation should be verified, not assumed; the "started after 03-05" report may reflect that the old make-a-selection workaround is no longer being reflexively used, unmasking a pre-existing new-document race instead of an actual code regression. Confirm which via evidence before concluding either way.

## Eliminated
<!-- APPEND only - prevents re-investigating after /clear -->

- hypothesis: "Adding 'make' to useDocument.ts's listened event set is sufficient to fix new-document detection."
  evidence: "User ran the human-verify steps in real Photoshop with the fix applied (npm run build + reload). File > New with the panel already docked still does NOT auto-populate Canvas W/H. File > Open (existing document) works fine, as it did before the fix. So 'make' being present in the listener list did not resolve the File > New case — either 'make' is not the event Photoshop actually dispatches for File > New, or the event fires but app.activeDocument is not yet populated/consistent at that moment (a worse race than for 'open'), or UXP silently rejects/no-ops an unrecognized event name during addNotificationListener registration."
  timestamp: 2026-07-07T17:34:00Z
- hypothesis: "Polling app.activeDocument.id every 1s (event-name-independent) will eventually detect a brand-new document and auto-populate the canvas."
  evidence: "User re-verified in real Photoshop with the polling fix applied (npm run build + reload). File > New still does NOT auto-populate Canvas W/H, even given up to ~1s for the poll to catch it. File > Open still works. This falsifies BOTH candidate mechanisms considered so far (missing/wrong event name, AND simple activeDocument-population race) — app.activeDocument appears to stay non-truthy for a new document via BOTH an event trigger and a plain timed re-read. User's own read: 'Maybe it's not possible by default,' i.e. this may be a genuine UXP/host limitation for freshly-created (never-saved) documents specifically, not a timing bug we can out-wait."
  timestamp: 2026-07-07T18:20:00Z

## Evidence
<!-- APPEND only - facts discovered during investigation -->

- timestamp: 2026-07-07T17:21:12Z
  checked: src/services/photoshopBridge.ts getActiveDocument() (post-03-05 fix)
  found: width/height/resolution are read synchronously off app.activeDocument (no executeAsModal/batchPlay involved) — only the hasSelection sub-check goes through executeAsModal via getSelectionBounds(). The function returns null only when `app.activeDocument` itself is falsy (line: `if (!doc) return null;`), a line 03-05 did not touch.
  implication: The reported failure (whole document not detected, not just wrong size) points at app.activeDocument being falsy/stale at read time, or at the calling hook/component layer — not at the hasSelection try/catch that 03-05 added.
- timestamp: 2026-07-07T17:21:12Z
  checked: src/hooks/useDocument.ts
  found: Listens for photoshop.action events ['select','open','close','set','deselect','selectAllWithMask'], debounces 150ms, then calls getActiveDocument(). This file was confirmed untouched by 03-05 (per 03-05-SUMMARY.md's explicit scope statement).
  implication: If this hook is unchanged, the regression (if real, not just unmasking) must come from how its output is consumed, or from a race that predates 03-05 and was previously hidden by the make-a-selection workaround.
- timestamp: 2026-07-07T17:21:12Z
  checked: src/App.tsx and src/components/ColumnGrid/GridPanel.tsx grep for useDocument usage
  found: Both App.tsx (`const { document } = useDocument();`) and GridPanel.tsx (`const { document, selection } = useDocument();`) call the useDocument() hook independently. Since useDocument is a plain hook (not backed by shared/global state e.g. Zustand), each call site mounts its OWN state, debounce timer, and event listener pair.
  implication: Untested but high-priority hypothesis — App.tsx's copy and GridPanel's copy of useDocument() can resolve independently and inconsistently, which would explain the screenshot showing App's "no document" empty state simultaneously with GridPanel's blank "Canvas:" label. This needs confirmation before assuming it's the root cause.
- timestamp: 2026-07-07T17:26:12Z
  checked: The "two independent instances disagree" hypothesis against the actual screenshot
  found: ELIMINATED as the cause. The screenshot shows BOTH the App "Open a document..." banner AND GridPanel's blank "Canvas:" label at the same time. GridPanel's contextDims is '' precisely because `document` is falsy (GridPanel.tsx:171-173). So both useDocument() instances AGREE document is null — they are not disagreeing. The real question is why getActiveDocument() yields null while a document is genuinely open.
  implication: The failure is that refresh() never re-runs after the new document is created, so app.activeDocument is never re-read. Points at the notification-event subscription, not at instance divergence.
- timestamp: 2026-07-07T17:26:12Z
  checked: src/hooks/useDocument.ts line 50 events array vs. how File > New is dispatched by Photoshop
  found: events = ['select','open','close','set','deselect','selectAllWithMask']. Creating a new document via File > New dispatches the Photoshop 'make' event (make a 'document' object — ScriptListener 'Mk  '), which is NOT in the list. 'open' only covers opening an EXISTING file, not File > New. Adobe UXP docs (action.addNotificationListener) confirm document-altering events flow through action listeners.
  implication: With the panel already docked, File > New fires only 'make' → no listener fires → no debounced refresh → document stays null. The known "make a selection" workaround fires 'set'/'select'/'selectAllWithMask' (all listened) → refresh runs → document detected. This fully explains the symptom, the workaround, and why 03-05 (which never touched useDocument.ts's event list) did not resolve it.
- timestamp: 2026-07-07T17:26:12Z
  checked: Interaction of listening for 'make' with the plugin's own guide creation
  found: applyGuides()/addGuide() create guides via _obj:'make' inside executeAsModal. Listening for 'make' means our own guide creation will also trigger a debounced refresh(). refresh() is idempotent (re-reads active document) and debounced 150ms, and runs AFTER the modal completes — no nesting/feedback issue, only a negligible extra read.
  implication: Adding 'make' is safe; the extra refresh on guide application is harmless.
- timestamp: 2026-07-07T18:02:23Z
  checked: Jest test infra (package.json) for ability to test the real hook behavior
  found: No @testing-library/react and no react-test-renderer installed; jest testEnvironment is 'node' (no jsdom). Rendering the useDocument hook to observe the poll firing is not feasible without adding test infrastructure.
  implication: Extract the poll into a pure, UXP-agnostic module (startDocumentWatcher) so the REAL detection behavior — a document id appearing after mount with NO notification event → onChange fires — can be unit-tested directly with fake timers, without React or the photoshop module. This is what the prior 'make' test could not do (it only asserted a constant).
- timestamp: 2026-07-07T18:02:23Z
  checked: New fix — startDocumentWatcher poll wired into useDocument + regression tests
  found: Full suite 39/39 passing (was 34; +5 watcher tests including the exact File > New scenario "doc appears with no event → onChange fires"). tsc --noEmit clean. Event listeners retained as a best-effort fast path. Poll interval 1000ms; reads app.activeDocument.id synchronously (no modal), fires the same debounced refresh() on id change.
  implication: The fix no longer depends on guessing Photoshop's event taxonomy. It covers both live directions at once: (A) no/wrong event name for File > New, and (B) activeDocument-population race — the poll re-reads app.activeDocument until it becomes truthy. Requires human UAT in real Photoshop to confirm app.activeDocument actually becomes truthy on File > New (the one blind spot).
- timestamp: 2026-07-07T18:41:15Z
  checked: releases/GuideMyGrid-v0.1.0.ccx mtime vs. this debug session's commit/edit timestamps, after the user reported the banner fix "not visible" and showed the OLD pre-session message ("Open a document in Photoshop to get started.") in a screenshot
  found: releases/GuideMyGrid-v0.1.0.ccx has mtime 2026-07-07 10:00 local. The earliest fix in THIS session (03-05, unrelated gap-closure, separate from this debug session) committed at 11:05 local; this debug session's first fix ('make' event) landed later still. The user's install steps were "uninstall and reinstall using GuideMyGrid-v0.1.0.ccx" (the existing file already in releases/, not confirmed freshly regenerated) plus a separate `npm run dev` (webpack --watch to dist/ — irrelevant to a CC-Desktop-installed .ccx, which runs its own static installed copy, not the live dist/ folder).
  implication: CRITICAL METHODOLOGY GAP — every human-verify round in this session (the 'make' event fix AND the polling fix, both currently in "Eliminated") may have been tested against a build that predates ALL of this session's code changes, including 03-05. Both "eliminated" entries above are therefore UNRELIABLE and must not be treated as confirmed falsifications until re-tested against a properly rebuilt + repackaged + reinstalled .ccx. The banner fix itself has not yet been validly tested either. Correct verification requires `npm run package` (rebuilds dist/ AND regenerates the .ccx from current source) followed by uninstall-old / install-new-ccx via Creative Cloud Desktop — `npm run dev` alone does not update what Photoshop has installed. [SUPERSEDED: this poll was subsequently human-verified to FAIL in real Photoshop — see Eliminated #2. Pivoted to the UX banner fix below.]
- timestamp: 2026-07-07T18:32:27Z
  checked: UX-level fix implemented — DocumentHintBanner + bonus app.documents fallback
  found: |
    Applied the agreed UX mitigation plus an opportunistic detection bonus, all self-verified:
    - NEW src/components/shared/DocumentHintBanner.tsx — dismissible hint (UpdateBanner.tsx shape:
      functional component, onDismiss prop, inline styles, × button; styled subtle via design tokens).
      Copy: "No canvas detected. Open a document and make a selection to add guides." — reads correctly
      whether NO document is open or a document is open-but-undetected (indistinguishable from the API).
    - src/App.tsx — replaced the misleading static `.noDoc` div with the banner. Dismiss state is a local
      useState; a useEffect+useRef resets dismissed→false on document null→non-null so the hint returns
      fresh next time it is needed. Banner auto-hides via the existing `!document` condition, so making a
      selection (fires 'set'/'select' → refresh() → document non-null) clears it with no new logic.
    - src/App.module.css — removed the now-dead `.noDoc` rule.
    - BONUS (different API surface than app.activeDocument): useDocument.readActiveDocumentId now falls back
      to photoshop.app.documents[last].id when activeDocument is null (so the watcher still fires), and
      photoshopBridge.getActiveDocument() falls back to app.documents[last] to resolve real dimensions.
      If app.documents surfaces the File > New doc, real auto-detection is restored; if not, the banner is
      the guaranteed fallback — pure upside, no downside.
    Verification: tsc --noEmit clean; full jest suite 40/40 (was 39; +1 test locking the getActiveDocument
    app.documents fallback). `npm run lint` is non-functional in this repo (no ESLint config file present —
    pre-existing), so it was not used as a gate.
  implication: The fix ships regardless of the host limitation. The only thing UAT can add is whether the
    bonus app.documents check happens to make File > New auto-populate the canvas (nice-to-have) — and
    whether app.documents might report a not-yet-ready dimension for a brand-new doc (the one risk UAT checks).
- timestamp: 2026-07-07T19:05:55Z
  checked: Human UAT in real Photoshop against a CORRECTLY rebuilt + reinstalled .ccx (npm run package to
    regenerate dist/ AND the .ccx, then uninstall old / reinstall the regenerated .ccx via Creative Cloud Desktop)
  found: |
    CONFIRMED WORKING as a whole:
    - File > New now AUTO-DETECTS the canvas and populates Canvas W/H with NO manual action. One or both of
      the 'make' event listener and the 1s documentWatcher poll are catching it — exact credit cannot be
      attributed because both are active simultaneously (which is fine).
    - The dismissible banner's × button works (confirmed).
    - File > Open (existing document) is unaffected / still working (confirmed).
    - RESOLVES the two prior "still broken" reports: both (make-event-only, and polling-only, recorded in
      Eliminated) were FALSE NEGATIVES — the user was testing a stale pre-session .ccx build both times
      (confirmed via file mtime), not the actual fixed code. They are testing-environment artifacts, NOT
      genuine falsifications of the individual mechanisms.
  implication: Both Eliminated entries must be read as stale-build testing artifacts, not valid falsifications.
    The shipped fix is the combined, layered solution ('make' event + 1s poll fallback + app.documents[last]
    fallback + dismissible banner safety net), all stacked together and confirmed working as a whole. Individual
    attribution between the event listener and the poll is not established; both remain in place (belt and
    suspenders). Session resolved.

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: |
  New / never-saved documents created via File > New while the panel was already
  docked were not being reliably detected — the panel showed a misleading empty
  state and blank Canvas W/H fields even though a document was open. The original
  detection relied on a notification-event set (useDocument.ts) that did NOT include
  the event Photoshop dispatches for document creation ('make'), and app.activeDocument
  could be non-truthy/stale at read time for a brand-new document. File > Open (fires
  'open') and the make-a-selection path (fires 'set'/'select') always worked, which is
  why the failure was specific to freshly-created documents.

  IMPORTANT — honest framing of the earlier "eliminated" attempts: the two prior
  human-verify reports that appeared to falsify the individual fixes (adding a 'make'
  listener — Eliminated #1; and the 1s startDocumentWatcher poll — Eliminated #2) were
  later found to be FALSE NEGATIVES. In both cases the user was testing a stale,
  pre-session .ccx build (confirmed via file mtime), not the actual fixed code. Those
  Eliminated entries are testing-environment artifacts, NOT genuine falsifications of
  the individual mechanisms. Neither the 'make' listener nor the poll was ever validly
  ruled out. On a correctly rebuilt + reinstalled build, File > New auto-detects the
  canvas.
fix: |
  SHIPPED and CONFIRMED WORKING in real Photoshop (after `npm run package` to
  regenerate the .ccx + uninstall-old / reinstall-new via Creative Cloud Desktop).
  A layered, defense-in-depth document-detection reliability improvement — all layers
  stacked together and confirmed working as a whole. Individual attribution between the
  'make' event listener and the 1s poll is NOT established (both fire simultaneously and
  either/both may be catching the new document); both remain in place intentionally —
  belt and suspenders, not a problem to resolve further.

  Detection layers (in order of how they fire):
  - src/hooks/useDocument.ts — 'make' event listener added to the notification set
    (catches the event Photoshop dispatches for File > New; fast path).
  - src/services/documentWatcher.ts — 1s poll fallback that re-reads app.activeDocument.id
    on an interval and fires the same debounced refresh() on change (event-taxonomy-
    independent fallback). Wired into useDocument.ts.
  - app.documents[last] fallback (a different API surface than app.activeDocument):
    useDocument.readActiveDocumentId() falls back to app.documents[last].id when
    activeDocument is null, and src/services/photoshopBridge.ts getActiveDocument()
    falls back to app.documents[last] to resolve the real dimensions.
  Last-resort safety net (only seen if ALL detection paths fail):
  - NEW src/components/shared/DocumentHintBanner.tsx — dismissible, self-clearing hint
    banner following UpdateBanner.tsx's shape (functional component, onDismiss prop,
    inline styles, × dismiss button), styled subtly via the panel design tokens. Copy
    reads correctly whether no document is open OR a document is open-but-undetected.
  - src/App.tsx — replaced the misleading static `.noDoc` div ("Open a document…", wrong
    for File > New where a document IS open) with the banner. Dismiss state is a local
    useState; a useEffect+useRef resets dismissed→false on document null→non-null so the
    hint returns fresh next time. The banner auto-hides via the existing `!document`
    condition once detection resolves.
  - src/App.module.css — removed the now-dead `.noDoc` rule.
  Tests:
  - src/__tests__/documentWatcher.test.ts (NEW) — watcher poll behavior incl. the exact
    File > New scenario (doc id appears with no notification event → onChange fires).
  - src/__tests__/useDocument.events.test.ts (NEW) — event-listener wiring.
  - src/__tests__/photoshopBridge.getActiveDocument.test.ts — extended mock with an
    app.documents getter + test locking the app.documents[last] fallback.
verification: |
  SELF-VERIFIED: tsc --noEmit clean; full jest suite 40/40 passing. `npm run lint` is
  non-functional in this repo (no ESLint config file — pre-existing) so it was not used
  as a gate. Banner conditional/dismiss/reset behavior has no component-render test infra
  (no @testing-library/react) and was human-verify only.
  HUMAN UAT CONFIRMED (2026-07-07) in real Photoshop against a correctly rebuilt +
  reinstalled .ccx:
  1. File > New while the panel is docked → the canvas is AUTO-DETECTED and Canvas W/H
     populate with NO manual action. (One or both of the 'make' listener and the 1s poll
     are catching it; exact credit not attributable — both active simultaneously.)
  2. The × dismiss button on the banner works.
  3. File > Open (existing document) → unaffected, still works.
  NOTE: the two prior "still broken" reports were FALSE NEGATIVES from testing a stale
  pre-session .ccx build (confirmed via mtime), not genuine falsifications.
files_changed:
  - src/App.tsx (replaced the misleading `.noDoc` div with DocumentHintBanner; local dismiss state reset on document null→non-null)
  - src/App.module.css (removed the now-dead `.noDoc` rule)
  - src/components/shared/DocumentHintBanner.tsx (NEW — dismissible no-canvas-detected hint; last-resort safety net)
  - src/hooks/useDocument.ts ('make' event listener + documentWatcher poll wiring + readActiveDocumentId app.documents[last] fallback)
  - src/services/documentWatcher.ts (NEW — 1s poll fallback that re-reads app.activeDocument.id and fires onChange)
  - src/services/photoshopBridge.ts (getActiveDocument falls back to app.documents[last] to resolve dimensions)
  - src/__tests__/photoshopBridge.getActiveDocument.test.ts (added app.documents mock + fallback test)
  - src/__tests__/documentWatcher.test.ts (NEW — watcher poll incl. the File > New no-event scenario)
  - src/__tests__/useDocument.events.test.ts (NEW — event-listener wiring)

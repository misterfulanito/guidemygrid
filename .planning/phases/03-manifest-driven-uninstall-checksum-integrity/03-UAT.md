---
status: testing
phase: 03-manifest-driven-uninstall-checksum-integrity
source: [03-VERIFICATION.md]
started: 2026-07-07T16:05:27Z
updated: 2026-07-07T16:05:27Z
---

## Current Test

number: 1
name: Push the branch and confirm macos-ccx-verify.yml goes green on GitHub Actions
expected: |
  Job builds the .ccx, extracts it, finds no requiredPermissions, finds none of the
  seven retired script names — reports success
awaiting: user response

## Tests

### 1. Push the branch and confirm `macos-ccx-verify.yml` goes green on GitHub Actions
expected: Job `verify-macos-ccx` completes and reports success (builds .ccx, asserts no requiredPermissions, asserts no retired scripts present)
result: [pending]

### 2. Reconcile the pre-existing Windows CI failure against the phase's own "both green" validation bar
expected: Confirm this is accepted as out-of-scope/pre-existing (consistent with REQUIREMENTS.md marking WIN-05 "deferred") rather than a Phase 3 regression
result: [pending]

### 3. Confirm plain-language quality of VERIFY.md and review depth of 03-SECURITY-REVIEW.md
expected: Both documents read as clear, accurate, and appropriately scoped for a self-described non-technical audience
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

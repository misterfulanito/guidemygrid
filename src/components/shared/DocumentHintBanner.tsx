// src/components/shared/DocumentHintBanner.tsx
//
// Dismissible hint shown when GuideMyGrid has no detected canvas. This covers
// BOTH "no document is open at all" AND "a document is open but Photoshop never
// notified us of it" (e.g. File > New while the panel is docked) — the two are
// indistinguishable from the UXP API (both make app.activeDocument falsy), so the
// copy is deliberately generic and actionable for either case.
//
// Shape follows src/components/shared/UpdateBanner.tsx (functional component,
// onDismiss prop, inline styles, × dismiss button); styled as a subtle hint using
// the panel design tokens rather than a loud announcement colour.
import React from 'react';

interface DocumentHintBannerProps {
  onDismiss: () => void;
}

const bannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '5px 12px',
  background: 'var(--gmg-bg-toolbar)',
  borderBottom: '1px solid var(--gmg-border)',
  color: 'var(--gmg-text-secondary)',
  fontSize: 11,
  flexShrink: 0,
};

const dismissStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--gmg-text-secondary)',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: '0 2px',
  opacity: 0.8,
  flexShrink: 0,
};

export function DocumentHintBanner({ onDismiss }: DocumentHintBannerProps) {
  return (
    <div style={bannerStyle}>
      <span>No canvas detected. Open a document and make a selection to add guides.</span>
      <button style={dismissStyle} onClick={onDismiss} title="Dismiss">×</button>
    </div>
  );
}

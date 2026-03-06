// src/components/shared/UpdateBanner.tsx
import React from 'react';
import { UpdateInfo } from '../../services/updateChecker';

interface UpdateBannerProps {
  info: UpdateInfo;
  onDismiss: () => void;
}

const bannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '6px 10px',
  background: 'var(--spectrum-global-color-blue-400, #2680eb)',
  color: '#fff',
  fontSize: 11,
};

const linkStyle: React.CSSProperties = {
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'underline',
  cursor: 'pointer',
  flexShrink: 0,
};

const dismissStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: '0 2px',
  opacity: 0.8,
  flexShrink: 0,
};

export function UpdateBanner({ info, onDismiss }: UpdateBannerProps) {
  const openRelease = () => {
    // UXP shell.openExternal for URLs
    try {
      const shell = require('uxp').shell;
      shell.openExternal(info.downloadUrl);
    } catch {
      // Fallback silently in non-UXP env
    }
  };

  return (
    <div style={bannerStyle}>
      <span>Nueva versión disponible: <strong>{info.latestVersion}</strong></span>
      <span style={linkStyle} onClick={openRelease}>Descargar</span>
      <button style={dismissStyle} onClick={onDismiss} title="Cerrar">×</button>
    </div>
  );
}

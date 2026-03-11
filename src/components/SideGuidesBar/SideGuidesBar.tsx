// src/components/SideGuidesBar/SideGuidesBar.tsx
import React, { useState } from 'react';
import { generateSideGuide } from '../../services/gridGenerator';
import { photoshopBridge } from '../../services/photoshopBridge';
import styles from './SideGuidesBar.module.css';

interface SideGuidesBarProps {
  containerWidth: number;
  containerHeight: number;
  offsetX: number;
  offsetY: number;
  disabled?: boolean;
}

// SVG from design (guide-left): vertical bar + left-pointing chevron
function IconGuideLeft() {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M6 20.67V6.67M13 10.67L10 13.67L13 16.67" />
    </svg>
  );
}

// Other guide buttons (center-v, right, top, center-h, bottom)
// will be added here once guide-left is validated.

export function SideGuidesBar({ containerWidth, containerHeight, offsetX, offsetY, disabled }: SideGuidesBarProps) {
  const [loading, setLoading] = useState(false);

  const handleGuideLeft = async () => {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const { position, orientation } = generateSideGuide('left', {
        containerWidth, containerHeight, offsetX, offsetY,
      });
      await photoshopBridge.addGuide(position, orientation);
    } catch {
      // silencioso — no bloquea UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.bar}>
      <button
        className={`${styles.btn} ${loading ? styles.btnLoading : ''}`}
        disabled={disabled || loading}
        onClick={handleGuideLeft}
      >
        <span className={styles.iconWrap}>
          <IconGuideLeft />
        </span>
      </button>
    </div>
  );
}

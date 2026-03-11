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

// SVG icon: vertical bar (guide line) + left-pointing chevron
// Uses <line>/<polyline> — more reliable than <path> in UXP
function IconGuideLeft() {
  return (
    <svg
      className={styles.btnIcon}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      xmlns="http://www.w3.org/2000/svg"
      style={{ pointerEvents: 'none' }}
    >
      <line x1="3" y1="2" x2="3" y2="14" />
      <polyline points="7,5 4.5,8 7,11" />
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
    } catch (err) {
      console.error('[GMG] guide-left failed:', err);
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
        <IconGuideLeft />
      </button>
    </div>
  );
}

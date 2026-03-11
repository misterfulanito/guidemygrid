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

// SVG icon: vertical bar + left-pointing chevron
// fill="currentColor" — UXP only supports filled shapes reliably inside buttons
function IconGuideLeft() {
  return (
    <svg
      className={styles.btnIcon}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      style={{ pointerEvents: 'none' }}
    >
      {/* Vertical bar — replaces <line> */}
      <rect x="2" y="2" width="1.5" height="12" />
      {/* Left-pointing chevron — replaces <polyline>, drawn as filled shape */}
      <path d="M8 5L5.5 8L8 11L7 11L4.5 8L7 5Z" />
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

  const isDisabled = disabled || loading;

  return (
    <div className={styles.bar}>
      <div
        className={`${styles.btn} ${loading ? styles.btnLoading : ''} ${isDisabled ? styles.btnDisabled : ''}`}
        onClick={!isDisabled ? handleGuideLeft : undefined}
        role="button"
        aria-label="Add left guide"
      >
        <IconGuideLeft />
      </div>
    </div>
  );
}

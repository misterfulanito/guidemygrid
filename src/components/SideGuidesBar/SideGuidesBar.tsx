// src/components/SideGuidesBar/SideGuidesBar.tsx
import React, { useState } from 'react';
import { generateSideGuide, SideGuideType } from '../../services/gridGenerator';
import { photoshopBridge } from '../../services/photoshopBridge';
import styles from './SideGuidesBar.module.css';

interface SideGuidesBarProps {
  containerWidth: number;
  containerHeight: number;
  offsetX: number;
  offsetY: number;
  disabled?: boolean;
}

// ── Icons ─────────────────────────────────────────────────────────────────

const iconProps = {
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  style: { pointerEvents: 'none' as const },
};

const strokeProps = {
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function IconLeft() {
  return (
    <svg className={styles.btnIcon} viewBox="0 0 10 18" {...iconProps}>
      <path d="M1 17V1M9 5.57143L5.57143 9L9 12.4286" {...strokeProps} />
    </svg>
  );
}

function IconCenterV() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconSquare}`} viewBox="0 0 18 18" {...iconProps}>
      <path d="M9 17V1M17 5.57143L13.5714 9L17 12.4286M1 5.57143L4.42857 9L1 12.4286" {...strokeProps} />
    </svg>
  );
}

function IconRight() {
  return (
    <svg className={styles.btnIcon} viewBox="0 0 10 18" {...iconProps}>
      <path d="M9 17V1M1 5.57143L4.42857 9L1 12.4286" {...strokeProps} />
    </svg>
  );
}

function IconTop() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconWide}`} viewBox="0 0 18 10" {...iconProps}>
      <path d="M17 0.999999L1 1M5.57143 9L9 5.57143L12.4286 9" {...strokeProps} />
    </svg>
  );
}

function IconBottom() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconWide}`} viewBox="0 0 18 10" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <path d="M17 7.99989C17.5523 7.99989 18 8.4476 18 8.99989C17.9999 9.55212 17.5522 9.99989 17 9.99989H1C0.447753 9.99989 5.9902e-05 9.55212 0 8.99989C2.41411e-08 8.4476 0.447716 7.99989 1 7.99989H17Z" fill="currentColor" />
      <path d="M11.7217 0.292858C12.1122 -0.0975963 12.7452 -0.0976427 13.1357 0.292858C13.5261 0.68337 13.5262 1.31643 13.1357 1.70692L9.70703 5.13563C9.51951 5.32309 9.26516 5.4286 9 5.4286C8.73484 5.4286 8.48049 5.32309 8.29297 5.13563L4.86426 1.70692C4.47385 1.31643 4.47388 0.683369 4.86426 0.292858C5.25476 -0.0976423 5.88779 -0.0975954 6.27832 0.292858L9 3.01454L11.7217 0.292858Z" fill="currentColor" />
    </svg>
  );
}

function IconCenterH() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconSquare}`} viewBox="0 0 18 18" {...iconProps}>
      <path d="M17 9L1 9M5.57143 1L9 4.42857L12.4286 1M5.57143 17L9 13.5714L12.4286 17" {...strokeProps} />
    </svg>
  );
}

// ── Button config ──────────────────────────────────────────────────────────

const BUTTONS: { type: SideGuideType; Icon: () => React.ReactElement; label: string; align?: string }[] = [
  { type: 'left',     Icon: IconLeft,    label: 'Add left guide' },
  { type: 'center-v', Icon: IconCenterV, label: 'Add vertical center guide',    align: 'center' },
  { type: 'right',    Icon: IconRight,   label: 'Add right guide',              align: 'right' },
  { type: 'top',      Icon: IconTop,     label: 'Add top guide',                align: 'top' },
  { type: 'bottom',   Icon: IconBottom,  label: 'Add bottom guide',             align: 'bottom' },
  { type: 'center-h', Icon: IconCenterH, label: 'Add horizontal center guide',  align: 'center' },
];

// ── Component ──────────────────────────────────────────────────────────────

export function SideGuidesBar({ containerWidth, containerHeight, offsetX, offsetY, disabled }: SideGuidesBarProps) {
  const [loading, setLoading] = useState<SideGuideType | null>(null);

  const handleClick = async (type: SideGuideType) => {
    if (disabled || loading !== null) return;
    setLoading(type);
    try {
      const { position, orientation } = generateSideGuide(type, {
        containerWidth, containerHeight, offsetX, offsetY,
      });
      await photoshopBridge.addGuide(position, orientation);
    } catch (err) {
      console.error(`[GMG] guide-${type} failed:`, err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.bar}>
      {BUTTONS.map(({ type, Icon, label, align }) => {
        const isLoading = loading === type;
        const isDisabled = disabled || loading !== null;
        const alignClass = align ? (styles as Record<string, string>)[`btnAlign${align.charAt(0).toUpperCase() + align.slice(1)}`] : '';
        return (
          <div
            key={type}
            className={`${styles.btn} ${alignClass} ${isLoading ? styles.btnLoading : ''} ${isDisabled ? styles.btnDisabled : ''}`}
            onClick={!isDisabled ? () => handleClick(type) : undefined}
            role="button"
            aria-label={label}
          >
            <Icon />
          </div>
        );
      })}
    </div>
  );
}

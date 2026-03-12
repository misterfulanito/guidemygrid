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
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function IconLeft() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconLeft}`} viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      {/* Arrow path only — border/frame handled by button CSS */}
      <path d="M8.88394 9.72954C9.28685 9.35181 9.30727 8.71897 8.92954 8.31606C8.55181 7.91315 7.91897 7.89273 7.51606 8.27046L8.2 9L8.88394 9.72954ZM5 12L4.31606 11.2705C4.11441 11.4595 4 11.7236 4 12C4 12.2764 4.11441 12.5405 4.31606 12.7295L5 12ZM7.51606 15.7295C7.91897 16.1073 8.55181 16.0869 8.92954 15.6839C9.30727 15.281 9.28685 14.6482 8.88394 14.2705L8.2 15L7.51606 15.7295ZM11 13C11.5523 13 12 12.5523 12 12C12 11.4477 11.5523 11 11 11V12V13ZM1 0H0V24H1H2V0H1Z" fill="currentColor" />
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
    <svg className={`${styles.btnIcon} ${styles.btnIconWide}`} viewBox="0 0 18 10" {...iconProps}>
      {/* Mirror of IconTop: bar at bottom (y=9), chevron pointing down */}
      <path d="M1 9H17M5.57143 1L9 4.42857L12.4286 1" {...strokeProps} />
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

// ── Divider ────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <svg viewBox="0 0 1 17" width="1" height="17" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none', flexShrink: 0 }}>
      <path d="M0.5 0.5V16.5" stroke="#2D2D2D" strokeLinecap="round" />
    </svg>
  );
}

// ── Bar items (order matches Pencil design) ────────────────────────────────

type BarItem =
  | { kind: 'button'; type: SideGuideType; Icon: () => React.ReactElement; label: string; align?: string }
  | { kind: 'divider' };

const BAR_ITEMS: BarItem[] = [
  { kind: 'button', type: 'left',     Icon: IconLeft,    label: 'Add left guide' },
  { kind: 'button', type: 'right',    Icon: IconRight,   label: 'Add right guide',             align: 'right' },
  { kind: 'button', type: 'top',      Icon: IconTop,     label: 'Add top guide',               align: 'top' },
  { kind: 'button', type: 'bottom',   Icon: IconBottom,  label: 'Add bottom guide',            align: 'bottom' },
  { kind: 'divider' },
  { kind: 'button', type: 'center-h', Icon: IconCenterH, label: 'Add horizontal center guide', align: 'center' },
  { kind: 'button', type: 'center-v', Icon: IconCenterV, label: 'Add vertical center guide',   align: 'center' },
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
      {BAR_ITEMS.map((item, i) => {
        if (item.kind === 'divider') {
          return <Divider key={`divider-${i}`} />;
        }
        const { type, Icon, label, align } = item;
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

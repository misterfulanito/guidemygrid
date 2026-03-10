// src/components/SideGuidesBar/SideGuidesBar.tsx
import React, { useState } from 'react';
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  type LucideIcon,
} from 'lucide-react';
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

const BUTTONS: { type: SideGuideType; Icon: LucideIcon }[] = [
  { type: 'left',     Icon: AlignStartVertical },
  { type: 'center-v', Icon: AlignCenterVertical },
  { type: 'right',    Icon: AlignEndVertical },
  { type: 'top',      Icon: AlignStartHorizontal },
  { type: 'center-h', Icon: AlignCenterHorizontal },
  { type: 'bottom',   Icon: AlignEndHorizontal },
];

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
    } catch {
      // silencioso — no bloquea UI
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.bar}>
      {BUTTONS.map(({ type, Icon }) => (
        <button
          key={type}
          className={`${styles.btn} ${loading === type ? styles.btnLoading : ''}`}
          disabled={disabled || loading !== null}
          onClick={() => handleClick(type)}
        >
          <span className={styles.iconWrap}>
            <Icon size={16} strokeWidth={1.5} />
          </span>
        </button>
      ))}
    </div>
  );
}

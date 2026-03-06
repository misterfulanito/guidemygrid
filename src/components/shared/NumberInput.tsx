// src/components/shared/NumberInput.tsx
import React, { useId } from 'react';
import styles from './NumberInput.module.css';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;   // 'px', '%'
  disabled?: boolean;
}

export function NumberInput({ label, value, onChange, min, max, step = 1, suffix, disabled }: NumberInputProps) {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    if (min !== undefined) val = Math.max(min, val);
    if (max !== undefined) val = Math.min(max, val);
    onChange(val);
  };

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
        {/* sp-textfield es el componente nativo de Adobe Spectrum en UXP */}
        <sp-textfield
          id={id}
          type="number"
          value={String(value)}
          min={min !== undefined ? String(min) : undefined}
          max={max !== undefined ? String(max) : undefined}
          step={String(step)}
          disabled={disabled || undefined}
          onInput={handleChange}
          class={styles.input}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
    </div>
  );
}

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
  suffix?: string;
  disabled?: boolean;
  /** compact: label shown as placeholder inside input (default: false = label above) */
  compact?: boolean;
}

export function NumberInput({
  label, value, onChange, min, max, step = 1, suffix, disabled, compact = false,
}: NumberInputProps) {
  const id = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    if (min !== undefined) val = Math.max(min, val);
    if (max !== undefined) val = Math.min(max, val);
    onChange(val);
  };

  if (compact) {
    return (
      <div className={`${styles.compactWrapper} ${disabled ? styles.compactDisabled : ''}`}>
        <input
          id={id}
          type="number"
          className={styles.compactInput}
          value={value}
          placeholder={label}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleChange}
        />
        {suffix && <span className={styles.compactSuffix}>{suffix}</span>}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.inputRow}>
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

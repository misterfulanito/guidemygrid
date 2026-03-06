// src/components/shared/Toggle.tsx
import React from 'react';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <sp-switch
      checked={checked || undefined}
      onClick={() => onChange(!checked)}
    >
      {label}
    </sp-switch>
  );
}

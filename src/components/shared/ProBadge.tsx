// src/components/shared/ProBadge.tsx
import React from 'react';

interface ProBadgeProps {
  message?: string; // default: "Feature Pro"
}

export function ProBadge({ message = 'Feature Pro' }: ProBadgeProps) {
  return (
    <sp-badge
      variant="informative"
      title="Disponible en la versión Pro"
      style={{ cursor: 'default', fontSize: '10px' }}
    >
      PRO
    </sp-badge>
  );
}

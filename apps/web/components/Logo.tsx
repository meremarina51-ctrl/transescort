'use client';

import { useState } from 'react';

const SITE_NAME = 'LuxEscortia';

export default function Logo({ className = '' }: { className?: string }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <span className={`font-display inline-flex font-bold ${className}`}>
      {Array.from(SITE_NAME).map((letter, i) => (
        <span
          key={`${i}-${letter}`}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          style={{
            color: hovered === i ? 'var(--accent-light)' : 'var(--accent-primary)',
            textShadow:
              hovered === i
                ? '0 0 14px rgba(108,92,231,0.85), 0 0 28px rgba(162,155,254,0.4)'
                : 'none',
            transition: 'color 120ms ease-out, text-shadow 120ms ease-out',
          }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

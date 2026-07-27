'use client';

import { useState } from 'react';

const SITE_NAME = 'TransEscort';

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
            color: hovered === i ? 'var(--crimson-light)' : 'var(--crimson-primary)',
            textShadow:
              hovered === i
                ? '0 0 14px rgba(201,168,106,0.85), 0 0 28px rgba(227,196,143,0.4)'
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

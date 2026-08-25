import type { ReactNode } from 'react';

interface IProps {
  children: ReactNode;
  className?: string;
}

/** Full-viewport centered placeholder — loading spinners, access-denied cards, empty/error states. */
export function FullScreenState({ children, className = '' }: IProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-[#0a0a0a] ${className}`}>{children}</div>
  );
}

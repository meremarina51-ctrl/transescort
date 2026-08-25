import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface Props {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  modal?: ReactNode;
}

export const AuthCard = ({ title, subtitle, children, modal }: Props) => {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 py-16">
        <div className="card w-full max-w-md p-8">
          <h1 className={`text-center font-display text-2xl font-bold ${subtitle ? 'mb-2' : 'mb-6'}`}>{title}</h1>
          {subtitle ? <p className="mb-6 text-center font-body text-sm text-white/40">{subtitle}</p> : null}
          {children}
        </div>
      </main>
      <Footer />
      {modal}
    </div>
  );
};

import { Header } from './Header';
import { Footer } from './Footer';

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 py-16 md:py-24">
        <h1 className="mb-8 font-display text-2xl font-bold md:text-3xl">{title}</h1>
        <div className="space-y-4 font-body text-sm leading-relaxed text-white/50 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}

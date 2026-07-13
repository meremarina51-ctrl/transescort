'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function ContactsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/contact/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as { message?: string | string[] }));
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="mx-auto w-full max-w-[560px] flex-1 px-6 py-16 md:py-24">
        <h1 className="mb-4 text-center font-display text-2xl font-bold">Контакты</h1>
        <p className="mb-10 text-center font-body text-sm leading-relaxed text-white/40">
          Оставьте сообщение — мы ответим на указанный вами email.
        </p>

        <div className="card p-8 md:p-10">
          {success && (
            <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-body text-sm text-emerald-200/90">
              Сообщение отправлено. Спасибо!
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 font-body text-sm text-red-200/90">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-wide text-white/35">Имя</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Как к вам обращаться"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-wide text-white/35">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-2 block font-body text-xs uppercase tracking-wide text-white/35">Сообщение</label>
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input resize-y"
                placeholder="Текст обращения..."
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary mt-2 w-full disabled:opacity-50">
              {loading ? 'Отправка…' : 'Отправить'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

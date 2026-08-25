'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/api-url';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function ContactsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setSuccess] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/contact/message'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({} as { message?: string | string[] }));
        const msgRaw = errorData.message;
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось отправить сообщение';
        
        throw new Error(msg);
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Не удалось отправить сообщение');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Контакты" subtitle="Оставьте сообщение — мы передадим его администратору. Ответ придёт на указанный вами email.">
      {isSuccess ? (
        <p className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 font-body text-sm text-emerald-400" role="status">
          Сообщение отправлено. Спасибо!
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
            Имя
          </label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
            Сообщение
          </label>
          <textarea
            id="contact-message"
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Текст обращения..."
            className="input min-h-[140px] resize-y"
          />
        </div>

        <FormError error={errorMessage} />

        <SubmitButton isLoading={isLoading} loadingText="Отправка…" text="Отправить" />
      </form>
    </AuthCard>
  );
}

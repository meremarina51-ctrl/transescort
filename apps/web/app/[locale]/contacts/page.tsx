'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiUrl } from '@/lib/api-url';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormError } from '@/components/auth/FormError';
import { SubmitButton } from '@/components/auth/SubmitButton';

export default function ContactsPage() {
  const t = useTranslations('contactsPage');
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
        const msg = Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || t('errorDefault');

        throw new Error(msg);
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || t('errorDefault'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title={t('title')} subtitle={t('subtitle')}>
      {isSuccess ? (
        <p className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 font-body text-sm text-emerald-400" role="status">
          {t('success')}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="contact-name" className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
            {t('nameLabel')}
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
            placeholder={t('namePlaceholder')}
            className="input"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">
            {t('emailLabel')}
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
            {t('messageLabel')}
          </label>
          <textarea
            id="contact-message"
            required
            minLength={10}
            maxLength={5000}
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('messagePlaceholder')}
            className="input min-h-[140px] resize-y"
          />
        </div>

        <FormError error={errorMessage} />

        <SubmitButton isLoading={isLoading} loadingText={t('sending')} text={t('send')} />
      </form>
    </AuthCard>
  );
};

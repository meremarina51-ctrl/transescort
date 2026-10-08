import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SUPPORT_EMAIL } from './constants';
import { FC } from 'react';

export const ContactBlock: FC = () => {
  const t = useTranslations('support.contact');

  return (
    <div className="mt-10 border-t border-white/[0.06] pt-8">
      <h2 className="mb-2 font-display text-base font-semibold text-white">{t('title')}</h2>
      <p className="font-body text-sm leading-relaxed text-white/55">
        {t('description')}
      </p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:shadow-lg hover:shadow-accent/30"
      >
        <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
      </a>
    </div>
  );
};

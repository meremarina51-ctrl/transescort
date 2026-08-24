import { Mail } from 'lucide-react';
import { SUPPORT_EMAIL } from './constants';
import { FC } from 'react';

export const ContactBlock: FC = () => (
  <div className="mt-10 border-t border-white/[0.06] pt-8">
    <h2 className="mb-2 font-display text-base font-semibold text-white">Связь с нами</h2>
    <p className="font-body text-sm leading-relaxed text-white/55">
      Если вопрос не удалось решить из справки выше — напишите нам, и мы ответим как можно скорее.
    </p>
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:shadow-lg hover:shadow-accent/30"
    >
      <Mail className="h-4 w-4" /> {SUPPORT_EMAIL}
    </a>
  </div>
);

import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/lib/routes';

export const SUPPORT_EMAIL = 'escortia@yandex.ru';

type SupportT = {
  (key: string): string;
  rich: (key: string, values: Record<string, (chunks: React.ReactNode) => React.ReactNode>) => React.ReactNode;
};

const linkTag = (href: string) => ({
  link: (chunks: React.ReactNode) => (
    <Link href={href} className="text-accent underline-offset-2 hover:underline">
      {chunks}
    </Link>
  ),
});

export const getPerformerSection = (t: SupportT) => ({
  title: t('performer.title'),
  body: t.rich('performer.body', linkTag(ROUTES.CABINET_LISTING)),
});

export const getCatalogSection = (t: SupportT) => ({
  title: t('catalog.title'),
  body: t.rich('catalog.body', linkTag(ROUTES.CATALOG)),
});

export const getReviewsSection = (t: SupportT) => ({
  title: t('reviews.title'),
  body: t('reviews.body'),
});

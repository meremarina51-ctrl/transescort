'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BarChart3, Eye, Heart, HeartCrack, MessageCircle } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { authFetch } from '@/lib/auth-fetch';
import { ROUTES } from '@/lib/routes';

interface ViewStats {
  totalViews: number;
  last7Days: number;
  last30Days: number;
  daily: { date: string; count: number }[];
}

interface FavoriteStats {
  current: number;
  added7Days: number;
  added30Days: number;
  removed7Days: number;
  removed30Days: number;
}

interface ContactStats {
  totalClicks: number;
  last7Days: number;
  last30Days: number;
  platformSelected: number;
  telegramSelected: number;
}

interface Stats {
  views: ViewStats;
  favorites: FavoriteStats;
  contacts: ContactStats;
}

const ACCENT = '#6C5CE7';
const SKY = '#38bdf8';
const EMERALD = '#34d399';
const RED = '#f87171';

const AXIS_TICK = { fill: 'rgba(255,255,255,0.35)', fontSize: 11 };
const TOOLTIP_STYLE = {
  background: '#161616',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
};
const LEGEND_STYLE = { fontSize: 12, color: 'rgba(255,255,255,0.6)' };

function formatShortDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

function StatTile({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 text-white/40">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
        <span className="font-body text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mt-4 p-6">
      <p className="mb-4 font-body text-xs uppercase tracking-wide text-white/40">{title}</p>
      {children}
    </div>
  );
}

export default function StatsPage() {
  const t = useTranslations('cabinet.stats');
  const locale = useLocale();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [noListing, setNoListing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/listings/me/stats');
        if (res.status === 404) {
          setNoListing(true);
          return;
        }
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(data?.message || t('errorDefault'));
        setStats(data);
      } catch (err: any) {
        setError(err.message || t('errorDefault'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const favoritesBarData = stats
    ? [
        { period: t('last7Days'), [t('added')]: stats.favorites.added7Days, [t('removed')]: stats.favorites.removed7Days },
        { period: t('last30Days'), [t('added')]: stats.favorites.added30Days, [t('removed')]: stats.favorites.removed30Days },
      ]
    : [];

  const contactsPieData = stats
    ? [
        { name: t('platformChannel'), value: stats.contacts.platformSelected },
        { name: t('telegramChannel'), value: stats.contacts.telegramSelected },
      ]
    : [];
  const contactsTotal = stats ? stats.contacts.platformSelected + stats.contacts.telegramSelected : 0;

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">{t('title')}</h1>

      {loading ? (
        <p className="font-body text-sm text-white/40">{t('loading')}</p>
      ) : noListing ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <BarChart3 className="h-8 w-8 text-white/25" strokeWidth={1.4} />
          <h2 className="font-body text-sm font-medium text-white/60">{t('noListingTitle')}</h2>
          <p className="max-w-sm font-body text-sm text-white/35">
            {t('noListingDescription')}
          </p>
          <Link href={ROUTES.CABINET_LISTING} className="btn-primary mt-2">
            {t('createListing')}
          </Link>
        </div>
      ) : error ? (
        <p className="font-body text-sm text-red-400">{error}</p>
      ) : stats ? (
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-white/35">{t('viewsHeading')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile icon={Eye} label={t('totalViews')} value={stats.views.totalViews} />
              <StatTile icon={Eye} label={t('last7Days')} value={stats.views.last7Days} />
              <StatTile icon={Eye} label={t('last30Days')} value={stats.views.last30Days} />
            </div>
            <p className="mt-3 font-body text-xs text-white/25">
              {t('viewsFootnote')}
            </p>

            <ChartCard title={t('viewsChartTitle')}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.views.daily} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatShortDate(d, locale)}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(d) => new Date(d as string).toLocaleDateString(locale, { day: '2-digit', month: 'long' })}
                    formatter={(value: any) => [value, t('viewsTooltipLabel')]}
                  />
                  <Area type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} fill="url(#viewsGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div>
            <h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-white/35">{t('favoritesHeading')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile icon={Heart} label={t('favoritesCurrent')} value={stats.favorites.current} />
              <StatTile icon={Heart} label={t('favoritesAdded7')} value={stats.favorites.added7Days} />
              <StatTile icon={Heart} label={t('favoritesAdded30')} value={stats.favorites.added30Days} />
              <StatTile icon={HeartCrack} label={t('favoritesRemoved7')} value={stats.favorites.removed7Days} />
              <StatTile icon={HeartCrack} label={t('favoritesRemoved30')} value={stats.favorites.removed30Days} />
            </div>

            <ChartCard title={t('favoritesChartTitle')}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={favoritesBarData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="period" tick={{ ...AXIS_TICK, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey={t('added')} fill={EMERALD} radius={[6, 6, 0, 0]} />
                  <Bar dataKey={t('removed')} fill={RED} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div>
            <h2 className="mb-3 font-body text-xs font-semibold uppercase tracking-wide text-white/35">{t('contactsHeading')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatTile icon={MessageCircle} label={t('contactsTotalClicks')} value={stats.contacts.totalClicks} />
              <StatTile icon={MessageCircle} label={t('last7Days')} value={stats.contacts.last7Days} />
              <StatTile icon={MessageCircle} label={t('last30Days')} value={stats.contacts.last30Days} />
            </div>

            <ChartCard title={t('contactsChartTitle')}>
              {contactsTotal === 0 ? (
                <p className="font-body text-xs text-white/30">{t('noData')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={contactsPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                      <Cell fill={ACCENT} />
                      <Cell fill={SKY} />
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <p className="font-body text-xs text-white/25">{t('purchasesFootnote')}</p>
        </div>
      ) : null}
    </>
  );
}

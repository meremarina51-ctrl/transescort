import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ListingGallery } from '@/components/ListingGallery';
import { apiUrl } from '@/lib/api-url';

interface ListingDetail {
  id: string;
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  breastSize: number | null;
  type: string | null;
  figure: string | null;
  temperament: string | null;
  hairColor: string | null;
  eyeColor: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  photos: string[];
  videoUrl: string | null;
}

async function getListing(slug: string): Promise<ListingDetail | null> {
  try {
    const res = await fetch(apiUrl(`/catalog/${slug}`), { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const VITALS: { key: keyof ListingDetail; label: string; suffix?: string }[] = [
  { key: 'age', label: 'Возраст' },
  { key: 'height', label: 'Рост', suffix: 'см' },
  { key: 'weight', label: 'Вес', suffix: 'кг' },
  { key: 'breastSize', label: 'Грудь' },
  { key: 'city', label: 'Город' },
];

const OTHER_PARAMS: { key: keyof ListingDetail; label: string }[] = [
  { key: 'type', label: 'Тип' },
  { key: 'figure', label: 'Фигура' },
  { key: 'temperament', label: 'Темперамент' },
  { key: 'hairColor', label: 'Волосы' },
  { key: 'eyeColor', label: 'Глаза' },
  { key: 'country', label: 'Страна' },
];

export default async function ListingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const vitals = VITALS.filter((row) => listing[row.key]).map((row) => ({
    label: row.label,
    value: `${listing[row.key]}${row.suffix ? ` ${row.suffix}` : ''}`,
  }));
  const otherParams = OTHER_PARAMS.filter((row) => listing[row.key]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />
      <main className="flex-1">
        <ListingGallery
          name={listing.name || 'Без имени'}
          photos={listing.photos}
          videoUrl={listing.videoUrl}
          vitals={vitals}
          bio={listing.bio}
        />
      </main>
      <Footer />
    </div>
  );
}

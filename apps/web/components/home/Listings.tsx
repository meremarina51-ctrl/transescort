import { CatalogListing } from "@/app/catalog/catalog.types";
import { formatPrice } from "@/lib/format";
import { ROUTES, catalogListing } from "@/lib/routes";
import { ImageOff } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface IProps {
    listings: CatalogListing[];
}

export const Listings: FC<IProps> = ({ listings }) => (
    <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="mb-12 flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-extrabold md:text-4xl">Исполнители</h2>
                <Link href={ROUTES.CATALOG} className="font-body text-sm font-medium text-accent hover:underline">
                    Показать все &rarr;
                </Link>
            </div>

            {listings.length === 0 ? (
                <p className="font-body text-sm text-white/40">Пока нет опубликованных анкет</p>
            ) : (
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
                    {listings.map((listing) => (
                        <Link
                            key={listing.id}
                            href={catalogListing(listing.slug ?? listing.id)}
                            className="card group overflow-hidden"
                        >
                            {listing.photos[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={listing.photos[0]}
                                    alt={listing.name ?? ''}
                                    className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex aspect-[3/4] w-full items-center justify-center bg-white/[0.03]">
                                    <ImageOff className="h-8 w-8 text-white/15" strokeWidth={1.4} />
                                </div>
                            )}
                            <div className="p-3">
                                <h3 className="font-display text-sm font-bold group-hover:text-accent transition-colors">
                                    {listing.name || 'Без имени'}
                                </h3>
                                <p className="mt-1 font-body text-xs text-white/40">
                                    {[listing.age ? `${listing.age} лет` : null, listing.city].filter(Boolean).join(' · ')}
                                </p>
                                {listing.priceHour ? (
                                    <p className="mt-1 font-body text-xs font-semibold text-accent">
                                        {formatPrice(listing.priceHour)} / час
                                    </p>
                                ) : null}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    </section>
);

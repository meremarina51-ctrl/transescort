import { FC } from "react";
import { Star } from "lucide-react";
import { MOCK_REVIEWS } from "./constants";

export const Reviews: FC = () => (
  <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <h2 className="mb-12 text-center font-display text-2xl font-extrabold md:text-4xl">Отзывы</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="card p-6">
                <div className="mb-2 flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? 'fill-accent text-accent' : 'text-white/15'}`}
                    />
                  ))}
                </div>
                <p className="font-body text-sm leading-relaxed text-white/60">{r.text}</p>
                <p className="mt-4 font-body text-xs text-white/30">
                  {r.name} &middot; {new Date(r.date).toLocaleDateString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
);

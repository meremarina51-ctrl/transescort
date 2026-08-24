import { FC } from "react";
import { FEATURES } from "./constants";

export const Benefits: FC = () => (
    <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {FEATURES.map(({ Icon, title, text }) => (
                    <div key={title} className="card group p-6">
                        <Icon className="mb-4 h-9 w-9 text-accent" strokeWidth={1.4} />
                        <h3 className="font-display text-base font-bold group-hover:text-accent transition-colors">
                            {title}
                        </h3>
                        <p className="mt-2 font-body text-sm leading-relaxed text-white/40">{text}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

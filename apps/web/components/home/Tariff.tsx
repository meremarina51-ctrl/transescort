import { MOCK_TARIFFS } from "./constants";

export const Tariff = () => (
    <section id="pricing" className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 text-center md:px-10">
            <h2 className="font-display text-2xl font-extrabold md:text-4xl">Тарифы</h2>
            <p className="mt-3 font-body text-white/40">Выберите тариф, который подходит именно вам</p>

            <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
                {MOCK_TARIFFS.map((tariff) => (
                    <div key={tariff.id} className="card p-8">
                        <h3 className="font-display text-lg font-bold">{tariff.name}</h3>
                        <p className="mt-2 font-display text-3xl font-extrabold text-accent">{tariff.price}</p>
                        <ul className="mt-6 space-y-2 font-body text-sm text-white/45">
                            {tariff.features.map((f) => (
                                <li key={f}>&bull; {f}</li>
                            ))}
                        </ul>
                        <button type="button" disabled className="btn-secondary mt-8 w-full cursor-not-allowed opacity-40">
                            Выбрать
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

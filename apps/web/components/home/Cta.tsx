import { FC } from "react";
import { HomeCtaButtons } from "../HomeCtaButtons";

export const Cta: FC = () => (
    <section className="border-t border-white/[0.04] py-20 md:py-28">
        <div className="mx-auto max-w-[700px] px-6 text-center md:px-10">
            <h2 className="font-display text-2xl font-extrabold md:text-4xl">Готовы начать?</h2>
            <p className="mx-auto mt-4 max-w-md font-body text-white/40">
                Создайте аккаунт за 30 секунд и получите доступ к платформе
            </p>
            <HomeCtaButtons />
        </div>
    </section>
);

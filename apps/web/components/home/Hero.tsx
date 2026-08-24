import { FC } from "react";
import Image from 'next/image';
import Link from "next/link";
import { ROUTES } from '@/lib/routes';

export const Hero: FC = () => (
    <section id="about" className="relative overflow-hidden py-20 sm:py-28 md:py-36 lg:py-44">
        <Image
            src="/hero-bg-v2.png"
            alt=""
            fill
            priority
            className="object-cover object-[73%_15%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]" />
        <div
            className="pointer-events-none absolute inset-0"
            style={{
                background:
                    'radial-gradient(60% 50% at 30% 0%, rgba(108,92,231,0.22), transparent 70%)',
            }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-10">
            <div className="max-w-xl text-left">
                <h1 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">
                    Платформа <span className="text-accent">проверенных</span> анкет
                </h1>
                <p className="mt-5 font-body text-base text-[#C9CDD3] md:text-lg">
                    Сервис по подбору моделей для досуга в Москве и Московской области
                </p>
                <div className="mt-10">
                    <Link href={ROUTES.CATALOG} className="btn-primary">
                        Перейти в каталог
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

"use client";

import { useEffect, useState } from "react";
import { Check, ToggleLeft } from "lucide-react";
import { CtaMode } from "@/lib/enums";
import { authFetch } from "@/lib/auth-fetch";
import { parseBody } from "@/lib/parse-body";
import { FormError } from "@/components/auth/FormError";

export default function AdminSettingsPage() {
    const [ctaMode, setCtaMode] = useState<CtaMode | null>(null);
    const [isLoading, setLoading] = useState(true);
    const [isSaving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await authFetch('/settings/cta-mode');
                const data = await parseBody(res);

                setCtaMode(res.ok && data?.value ? data.value : CtaMode.Account);
            } catch (e) {
                setCtaMode(CtaMode.Account);
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleChangeMode = async (mode: CtaMode) => {
        if (mode === ctaMode || isSaving) return;

        const previous = ctaMode;
        setCtaMode(mode);
        setSaving(true);
        setSaved(false);
        setErrorMessage('');

        try {
            const res = await authFetch('/admin/settings/cta-mode', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: mode }),
            });

            const data = await parseBody(res);

            if (!res.ok) throw new Error(data?.message || 'Не удалось обновить режим');

            setSaved(true);
        } catch (error: any) {
            setCtaMode(previous);
            setErrorMessage(error.message || 'Не удалось обновить режим');
        } finally {
            setSaving(false);
        }
    };

    const isAccountMode = ctaMode === CtaMode.Account;

    const ctaButtonBaseClass = "min-w-[200px] rounded-[10px] border px-4 py-2 font-body text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
    const activeButtonClass = `${ctaButtonBaseClass} border-accent/25 bg-accent/10 text-accent hover:bg-accent/20`;
    const inactiveButtonClass = `${ctaButtonBaseClass} border-white/10 bg-white/[0.02] text-white/30`;

    return (
        <>
            <h1 className="mb-2 font-display text-2xl font-bold">Настройки</h1>
            <p className="mb-6 font-body text-white/40">Общие параметры платформы.</p>

            <div className="card p-6">
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/[0.04]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/10 text-accent rounded-full">
                            <ToggleLeft className="h-6 w-6" strokeWidth={1.4} />
                        </div>
                        <div className="flex flex-col">
                            <p className="font-body uppercase text-white/40">CTA на лендинге</p>
                            <p className="font-body text-white/40">Какие кнопки показывать на публичном лендинге</p>
                        </div>
                    </div>

                    {saved ? (
                        <div className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-body text-[10px] font-medium text-emerald-400">
                            <Check className="h-3 w-3" />
                            Сохранено
                        </div>
                    ) : null}
                </div>

                {isLoading ? (
                    <p className="pt-6 font-body text-sm text-white/40">Загрузка…</p>
                ) : (
                    <div className="pt-6 flex flex-col gap-5">
                        <div className="flex flex-col gap-3">
                            <p className="font-body uppercase text-white/40">Режим CTA</p>
                            <div className="flex items-center gap-3">
                                <button
                                    disabled={isSaving}
                                    className={isAccountMode ? activeButtonClass : inactiveButtonClass}
                                    onClick={() => handleChangeMode(CtaMode.Account)}
                                >
                                    Аккаунт
                                </button>
                                <button
                                    disabled={isSaving}
                                    className={!isAccountMode ? activeButtonClass : inactiveButtonClass}
                                    onClick={() => handleChangeMode(CtaMode.Telegram)}
                                >
                                    Telegram
                                </button>
                            </div>
                            <FormError error={errorMessage} />
                        </div>
                        <p className="font-body text-white/40">
                            <span className="font-bold">Аккаунт</span> — на лендинге показываются кнопки «Создать аккаунт» и «Перейти в каталог». <span className="font-bold">Telegram</span> — только кнопка «Связаться с нами в Telegram».
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

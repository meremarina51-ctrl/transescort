export const YANDEX_METRIKA_IDS = [112110673, 112110529];

/** Fire-and-forget — analytics must never throw or block the calling UI action. */
export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    for (const id of YANDEX_METRIKA_IDS) (window as any).ym?.(id, 'reachGoal', goal, params);
  } catch {}
}

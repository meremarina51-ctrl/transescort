export const YANDEX_METRIKA_ID = 112110673;

/** Fire-and-forget — analytics must never throw or block the calling UI action. */
export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    (window as any).ym?.(YANDEX_METRIKA_ID, 'reachGoal', goal, params);
  } catch {}
}

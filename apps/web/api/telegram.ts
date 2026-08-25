import { apiUrl } from "@/lib/api-url";

export async function getTelegramBotUsername(): Promise<string | null> {
  try {
    const res = await fetch(apiUrl('/telegram/bot-info'), { cache: 'no-store' });
    
    if (!res.ok) return null;

    const data = await res.json();
    
    return data.username ?? null;
  } catch {
    return null;
  }
};

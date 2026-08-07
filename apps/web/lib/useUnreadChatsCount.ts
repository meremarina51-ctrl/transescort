'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { getChatSocket } from '@/lib/chat-socket';

async function fetchUnreadTotal(): Promise<number> {
  const res = await authFetch('/chat/conversations');
  if (!res.ok) return 0;
  const data = await res.json();
  return (data ?? []).reduce((sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount || 0), 0);
}

/**
 * Total unread messages across all of the current user's chats — shown as a badge next to
 * the "Чаты"/"Сообщения" nav item. Refreshes on new messages (socket) and whenever this tab
 * marks something read (the `chat:activity` event, dispatched by ChatsPage).
 */
export function useUnreadChatsCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    let cancelled = false;
    const refresh = () => {
      fetchUnreadTotal()
        .then((total) => {
          if (!cancelled) setCount(total);
        })
        .catch(() => {});
    };

    refresh();

    const socket = getChatSocket();
    socket.on('message:new', refresh);
    socket.on('conversation:read', refresh);
    window.addEventListener('chat:activity', refresh);

    return () => {
      cancelled = true;
      socket.off('message:new', refresh);
      socket.off('conversation:read', refresh);
      window.removeEventListener('chat:activity', refresh);
    };
  }, [user]);

  return count;
}

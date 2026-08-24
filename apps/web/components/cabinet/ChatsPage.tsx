'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCheck, ChevronLeft, ChevronRight, Loader2, MessageSquare, Plus, Search, Send, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { getChatSocket } from '@/lib/chat-socket';
import { ReportButton } from '@/components/ReportButton';
import { Role } from '@/lib/enums';
import { catalogListing } from '@/lib/routes';

interface ConversationParticipant {
  id: string;
  login: string;
  fullName: string | null;
  role: Role;
  listing: { slug: string; photo: string | null } | null;
}

interface ConversationSummary {
  id: string;
  otherUser: ConversationParticipant;
  lastMessage: { body: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

const ROLE_LABELS: Record<Role, string> = {
  [Role.Client]: 'Клиент',
  [Role.Performer]: 'Исполнитель',
  [Role.Admin]: 'Админ',
};

function initial(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

function ParticipantAvatar({ user, className }: { user: ConversationParticipant; className: string }) {
  const label = user.fullName || user.login;
  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/10 font-body font-semibold text-accent ${className}`}
    >
      {user.listing?.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.listing.photo} alt={label} className="h-full w-full object-cover" />
      ) : (
        initial(label)
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/** Date + time shown on every message bubble — not just the once-per-day separator, so it's unambiguous even at a glance. */
function formatMessageStamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  return `${date}, ${formatTime(iso)}`;
}

function formatListTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? formatTime(iso)
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

function isSameDay(isoA: string, isoB: string): boolean {
  return new Date(isoA).toDateString() === new Date(isoB).toDateString();
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Сегодня';
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function ParticipantHeaderInfo({ user }: { user: ConversationParticipant }) {
  const content = (
    <>
      <ParticipantAvatar user={user} className="h-9 w-9 text-sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold text-white group-hover:text-accent">
          {user.fullName || user.login}
        </p>
        <p className="font-body text-xs text-white/35">
          @{user.login} · {ROLE_LABELS[user.role] ?? user.role}
        </p>
      </div>
    </>
  );

  if (user.listing) {
    return (
      <Link
        href={catalogListing(user.listing.slug)}
        title="Открыть анкету"
        className="group flex min-w-0 flex-1 items-center gap-3"
      >
        {content}
      </Link>
    );
  }
  return <div className="flex min-w-0 flex-1 items-center gap-3">{content}</div>;
}

async function parseBody(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const LIST_COLLAPSED_KEY = 'cabinet-chats-list-collapsed';

/** Shared by /cabinet/chats (performer nav) and /cabinet/messages (client nav) — same feature, two labels. */
export function ChatsPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [listCollapsed, setListCollapsed] = useState(false);

  useEffect(() => {
    setListCollapsed(localStorage.getItem(LIST_COLLAPSED_KEY) === '1');
  }, []);

  const toggleListCollapsed = () => {
    setListCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(LIST_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [otherUserReadAt, setOtherUserReadAt] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const [startOpen, setStartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ConversationParticipant[]>([]);
  const [searching, setSearching] = useState(false);
  const [startError, setStartError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await authFetch('/chat/conversations');
      const data = await parseBody(res);
      if (res.ok) setConversations(data ?? []);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const socket = getChatSocket();

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.conversationId === activeIdRef.current) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        if (msg.senderId !== user?.id) {
          authFetch(`/chat/conversations/${msg.conversationId}/read`, { method: 'POST' })
            .then(() => window.dispatchEvent(new Event('chat:activity')))
            .catch(() => {});
        }
      }
      loadConversations();
    };

    const handleRead = (payload: { conversationId: string; readAt: string }) => {
      if (payload.conversationId === activeIdRef.current) {
        setOtherUserReadAt(payload.readAt);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('conversation:read', handleRead);
    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('conversation:read', handleRead);
    };
  }, [loadConversations, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (id: string) => {
    setActiveId(id);
    setMessages([]);
    setOtherUserReadAt(null);
    setLoadingMessages(true);
    setSendError('');
    try {
      const res = await authFetch(`/chat/conversations/${id}/messages`);
      const data = await parseBody(res);
      if (res.ok) {
        setMessages(data?.messages ?? []);
        setOtherUserReadAt(data?.otherUserReadAt ?? null);
      }
      await authFetch(`/chat/conversations/${id}/read`, { method: 'POST' });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
      window.dispatchEvent(new Event('chat:activity'));
    } finally {
      setLoadingMessages(false);
    }
  };

  const pendingConversationId = useRef<string | null>(null);
  useEffect(() => {
    pendingConversationId.current = new URLSearchParams(window.location.search).get('c');
  }, []);

  useEffect(() => {
    const id = pendingConversationId.current;
    if (id && conversations.some((c) => c.id === id)) {
      pendingConversationId.current = null;
      window.history.replaceState(null, '', window.location.pathname);
      openConversation(id);
    }
  }, [conversations]);

  const sendMessage = () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    setSending(true);
    setSendError('');
    getChatSocket().emit('message:send', { conversationId: activeId, body }, (ack: { ok?: boolean; error?: string }) => {
      setSending(false);
      if (ack?.error) {
        setSendError(ack.error);
      } else {
        setDraft('');
      }
    });
  };

  useEffect(() => {
    if (!startOpen) return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`/chat/users/search?q=${encodeURIComponent(q)}`);
        const data = await parseBody(res);
        if (res.ok) setSearchResults(data ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, startOpen]);

  const openStart = () => {
    setStartOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setStartError('');
  };

  const startConversationWith = async (login: string) => {
    setStartError('');
    try {
      const res = await authFetch('/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось начать чат');
      setConversations((prev) => (prev.some((c) => c.id === data.id) ? prev.map((c) => (c.id === data.id ? data : c)) : [data, ...prev]));
      setStartOpen(false);
      openConversation(data.id);
    } catch (err: any) {
      setStartError(err.message || 'Не удалось начать чат');
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold">Чаты</h1>

      <div className="relative flex h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border border-white/[0.08]">
        <div
          className={`min-w-0 flex-col overflow-hidden border-r border-white/[0.06] transition-[width] duration-200 sm:flex-shrink-0 ${
            activeId ? 'hidden sm:flex' : 'flex w-full'
          } ${listCollapsed ? 'sm:w-0 sm:border-r-0' : 'sm:flex sm:w-80'}`}
        >
          <div className="flex w-full flex-shrink-0 items-center justify-between border-b border-white/[0.06] p-4 sm:w-80">
            <h2 className="font-body text-sm font-semibold uppercase tracking-wide text-white/50">Диалоги</h2>
            <button
              type="button"
              onClick={openStart}
              aria-label="Новый чат"
              title="Новый чат"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-white transition-all hover:shadow-lg hover:shadow-accent/30"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="w-full flex-1 overflow-y-auto sm:w-80">
            {loadingConversations ? (
              <p className="p-4 font-body text-sm text-white/40">Загрузка…</p>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <MessageSquare className="h-6 w-6 text-white/20" strokeWidth={1.4} />
                <p className="font-body text-xs text-white/35">Пока нет диалогов — начните новый через «+»</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className={`flex w-full items-start gap-3 border-b border-white/[0.04] p-4 text-left transition-colors hover:bg-white/[0.03] ${
                    activeId === c.id ? 'bg-white/[0.05]' : ''
                  }`}
                >
                  <ParticipantAvatar user={c.otherUser} className="h-10 w-10 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-body text-sm font-semibold text-white">
                        {c.otherUser.fullName || c.otherUser.login}
                      </p>
                      {c.lastMessage ? (
                        <span className="flex-shrink-0 font-body text-[11px] text-white/30">
                          {formatListTime(c.lastMessage.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-body text-xs text-white/40">
                        {c.lastMessage ? c.lastMessage.body : 'Нет сообщений'}
                      </p>
                      {c.unreadCount > 0 ? (
                        <span className="flex h-5 min-w-[1.25rem] flex-shrink-0 items-center justify-center rounded-full bg-accent px-1.5 font-body text-[10px] font-bold text-white">
                          {c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleListCollapsed}
          aria-label={listCollapsed ? 'Показать список диалогов' : 'Скрыть список диалогов'}
          title={listCollapsed ? 'Показать список диалогов' : 'Скрыть список диалогов'}
          className={`absolute top-1/2 z-10 hidden h-16 w-5 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-white/10 bg-[#141414] text-white/40 transition-[left] duration-200 hover:text-white sm:flex ${
            listCollapsed ? 'left-0' : 'left-80'
          }`}
        >
          {listCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className={`min-w-0 flex-1 flex-col sm:flex ${activeId ? 'flex' : 'hidden'}`}>
          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <MessageSquare className="h-8 w-8 text-white/15" strokeWidth={1.2} />
              <p className="font-body text-sm text-white/30">Выберите диалог слева или начните новый</p>
            </div>
          ) : (
            <>
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-white/[0.06] p-4">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="font-body text-lg text-white/50 hover:text-white sm:hidden"
                  aria-label="Назад к списку"
                >
                  ‹
                </button>
                <ParticipantHeaderInfo user={activeConversation.otherUser} />
                <ReportButton
                  targetType="user"
                  targetId={activeConversation.otherUser.id}
                  label=""
                  className="flex-shrink-0 rounded-full p-2 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-red-400"
                />
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMessages ? (
                  <p className="font-body text-sm text-white/40">Загрузка…</p>
                ) : messages.length === 0 ? (
                  <p className="font-body text-sm text-white/30">Сообщений пока нет — напишите первым</p>
                ) : (
                  messages.map((m, i) => {
                    const own = m.senderId === user?.id;
                    const prev = messages[i - 1];
                    const showDateSeparator = !prev || !isSameDay(prev.createdAt, m.createdAt);
                    return (
                      <div key={m.id}>
                        {showDateSeparator ? (
                          <div className="mb-3 flex justify-center">
                            <span className="rounded-full bg-white/[0.06] px-3 py-1 font-body text-[11px] text-white/40">
                              {formatDateSeparator(m.createdAt)}
                            </span>
                          </div>
                        ) : null}
                        <div className={`group flex items-end gap-1 ${own ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 font-body text-sm ${
                              own ? 'bg-accent text-white' : 'bg-white/[0.06] text-white/90'
                            }`}
                          >
                            <p className="whitespace-pre-line break-words">{m.body}</p>
                            <p
                              className={`mt-1 flex items-center justify-end gap-1 text-right text-[10px] ${own ? 'text-white/70' : 'text-white/30'}`}
                            >
                              {formatMessageStamp(m.createdAt)}
                              {own ? (
                                otherUserReadAt && new Date(m.createdAt) <= new Date(otherUserReadAt) ? (
                                  <CheckCheck className="h-3 w-3 flex-shrink-0" aria-label="Прочитано" />
                                ) : (
                                  <Check className="h-3 w-3 flex-shrink-0" aria-label="Не прочитано" />
                                )
                              ) : null}
                            </p>
                          </div>
                          {!own ? (
                            <ReportButton
                              targetType="message"
                              targetId={m.id}
                              label=""
                              className="flex-shrink-0 rounded-full p-1.5 text-white/0 opacity-0 transition-opacity hover:bg-white/[0.06] hover:text-red-400 group-hover:text-white/25 group-hover:opacity-100"
                            />
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {user?.messagingRestricted ? (
                <p className="flex-shrink-0 border-t border-white/[0.06] p-4 font-body text-sm text-orange-400">
                  Отправка сообщений ограничена администрацией.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex flex-shrink-0 items-center gap-2 border-t border-white/[0.06] p-4"
                >
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Написать сообщение..."
                    maxLength={4000}
                    className="input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-white transition-all hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50"
                    aria-label="Отправить"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              )}
              {sendError ? <p className="flex-shrink-0 px-4 pb-3 font-body text-xs text-red-400">{sendError}</p> : null}
            </>
          )}
        </div>
      </div>

      {startOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setStartOpen(false)} />
          <div className="card relative flex max-h-[80vh] w-full flex-col p-6 !rounded-b-none sm:max-w-sm sm:!rounded-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Новый чат</h2>
              <button type="button" onClick={() => setStartOpen(false)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-3 flex-shrink-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по логину..."
                autoFocus
                className="input !pl-10"
              />
            </div>

            {startError ? <p className="mb-3 flex-shrink-0 font-body text-sm text-red-400">{startError}</p> : null}

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {searching ? (
                <p className="p-2 font-body text-xs text-white/35">Поиск…</p>
              ) : searchQuery.trim() && searchResults.length === 0 ? (
                <p className="p-2 font-body text-xs text-white/35">Никого не нашли по этому логину</p>
              ) : (
                searchResults.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => startConversationWith(u.login)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-body text-sm font-semibold text-accent">
                      {initial(u.fullName || u.login)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-medium text-white">{u.fullName || u.login}</p>
                      <p className="font-body text-xs text-white/35">
                        @{u.login} · {ROLE_LABELS[u.role] ?? u.role}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Plus, Search, Send, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';
import { getChatSocket } from '@/lib/chat-socket';

interface ConversationParticipant {
  id: string;
  login: string;
  fullName: string | null;
  role: 'client' | 'performer' | 'admin';
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

const ROLE_LABELS: Record<string, string> = { client: 'Клиент', performer: 'Исполнитель', admin: 'Админ' };

function initial(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatListTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString()
    ? formatTime(iso)
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
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
          authFetch(`/chat/conversations/${msg.conversationId}/read`, { method: 'POST' }).catch(() => {});
        }
      }
      loadConversations();
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [loadConversations, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (id: string) => {
    setActiveId(id);
    setMessages([]);
    setLoadingMessages(true);
    setSendError('');
    try {
      const res = await authFetch(`/chat/conversations/${id}/messages`);
      const data = await parseBody(res);
      if (res.ok) setMessages(data ?? []);
      await authFetch(`/chat/conversations/${id}/read`, { method: 'POST' });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    } finally {
      setLoadingMessages(false);
    }
  };

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
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-body text-sm font-semibold text-accent">
                    {initial(c.otherUser.fullName || c.otherUser.login)}
                  </div>
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
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-body text-sm font-semibold text-accent">
                  {initial(activeConversation.otherUser.fullName || activeConversation.otherUser.login)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-semibold text-white">
                    {activeConversation.otherUser.fullName || activeConversation.otherUser.login}
                  </p>
                  <p className="font-body text-xs text-white/35">
                    @{activeConversation.otherUser.login} ·{' '}
                    {ROLE_LABELS[activeConversation.otherUser.role] ?? activeConversation.otherUser.role}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {loadingMessages ? (
                  <p className="font-body text-sm text-white/40">Загрузка…</p>
                ) : messages.length === 0 ? (
                  <p className="font-body text-sm text-white/30">Сообщений пока нет — напишите первым</p>
                ) : (
                  messages.map((m) => {
                    const own = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 font-body text-sm ${
                            own ? 'bg-accent text-white' : 'bg-white/[0.06] text-white/90'
                          }`}
                        >
                          <p className="whitespace-pre-line break-words">{m.body}</p>
                          <p className={`mt-1 text-right text-[10px] ${own ? 'text-white/70' : 'text-white/30'}`}>
                            {formatTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

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
              {sendError ? <p className="flex-shrink-0 px-4 pb-3 font-body text-xs text-red-400">{sendError}</p> : null}
            </>
          )}
        </div>
      </div>

      {startOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setStartOpen(false)} />
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

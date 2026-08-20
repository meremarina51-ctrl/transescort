'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  MessageSquareOff,
  MessageSquareText,
  Search,
  Send,
  ShieldOff,
  Trash2,
  Unlink2,
  UserCog,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';

const PAGE_SIZE = 20;

interface AdminUser {
  id: string;
  login: string;
  fullName: string | null;
  role: 'client' | 'performer' | 'admin';
  status: 'active' | 'suspended';
  email: string | null;
  phone: string | null;
  createdAt: string;
  messagingRestrictedAt: string | null;
  telegramUsername: string | null;
  telegramLinkedAt: string | null;
}

interface TelegramBotClient {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  ageConfirmedAt: string | null;
  rulesAcceptedAt: string | null;
  blockedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
}

const ROLE_LABELS: Record<AdminUser['role'], string> = {
  client: 'Клиент',
  performer: 'Исполнитель',
  admin: 'Админ',
};

async function parseBody(res: Response) {
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function StatusBadge({ status }: { status: AdminUser['status'] }) {
  return status === 'active' ? (
    <span className="badge border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">Активен</span>
  ) : (
    <span className="badge border border-red-500/25 bg-red-500/10 text-red-400">Заблокирован</span>
  );
}

function RowActions({
  user,
  isSelf,
  busy,
  // onEdit,
  onToggleStatus,
  onToggleMessagingRestriction,
  onUnlinkTelegram,
  onResetPassword,
  onRemove,
}: {
  user: AdminUser;
  isSelf: boolean;
  busy: boolean;
  // onEdit: () => void;
  onToggleStatus: () => void;
  onToggleMessagingRestriction: () => void;
  onUnlinkTelegram: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  const restricted = Boolean(user.messagingRestrictedAt);
  return (
    <div className="flex items-center gap-1">
      {/* <button
        type="button"
        onClick={onEdit}
        title="Просмотр / редактирование"
        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <Pencil className="h-4 w-4" />
      </button> */}
      {user.telegramLinkedAt ? (
        <button
          type="button"
          onClick={onUnlinkTelegram}
          disabled={busy}
          title={`Отвязать Telegram${user.telegramUsername ? ` (@${user.telegramUsername})` : ''}`}
          className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Unlink2 className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onToggleMessagingRestriction}
        disabled={isSelf || busy}
        title={
          isSelf
            ? 'Нельзя изменить своё ограничение'
            : restricted
              ? 'Снять ограничение на отправку сообщений'
              : 'Ограничить отправку сообщений'
        }
        className={`rounded-lg p-2 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30 ${
          restricted ? 'text-orange-400 hover:text-orange-300' : 'text-white/40 hover:text-white'
        }`}
      >
        {restricted ? <MessageSquareOff className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onResetPassword}
        disabled={isSelf || busy}
        title={isSelf ? 'Нельзя сбросить пароль своего аккаунта' : 'Сбросить пароль'}
        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <KeyRound className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onToggleStatus}
        disabled={isSelf || busy}
        title={isSelf ? 'Нельзя изменить свой статус' : user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : user.status === 'active' ? (
          <Ban className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={isSelf || busy}
        title={isSelf ? 'Нельзя удалить свой аккаунт' : 'Удалить'}
        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function TelegramClientRow({
  client,
  busy,
  onBlock,
  onUnblock,
  onDelete,
}: {
  client: TelegramBotClient;
  busy: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onDelete: () => void;
}) {
  const blocked = Boolean(client.blockedAt);
  const gated = Boolean(client.ageConfirmedAt && client.rulesAcceptedAt);
  return (
    <tr className="border-b border-white/[0.04] last:border-0">
      <td className="whitespace-nowrap px-4 py-3">
        <p className="font-body text-sm font-medium text-white">
          {client.telegramUsername ? `@${client.telegramUsername}` : 'Без username'}
        </p>
        <p className="font-body text-xs text-white/35">id {client.telegramId}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {gated ? (
          <span className="badge border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">Подтверждён</span>
        ) : (
          <span className="badge border border-white/10 bg-white/[0.06] text-white/50">Ожидает подтверждения</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {blocked ? (
          <span className="badge border border-red-500/25 bg-red-500/10 text-red-400" title={client.blockedReason ?? undefined}>
            Заблокирован
          </span>
        ) : (
          <span className="badge border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">Активен</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
        {new Date(client.createdAt).toLocaleDateString('ru-RU')}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={blocked ? onUnblock : onBlock}
            disabled={busy}
            title={blocked ? 'Снять блокировку' : 'Заблокировать доступ к боту'}
            className={`rounded-lg p-2 transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30 ${
              blocked ? 'text-emerald-400 hover:text-emerald-300' : 'text-white/40 hover:text-red-400'
            }`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : blocked ? <ShieldOff className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            title="Удалить"
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-end gap-3">
      <span className="font-body text-xs text-white/35">
        Страница {page} из {totalPages}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Предыдущая страница"
          className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Следующая страница"
          className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  // const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  // const [editFullName, setEditFullName] = useState('');
  // const [editEmail, setEditEmail] = useState('');
  // const [editPhone, setEditPhone] = useState('');
  // const [editSaving, setEditSaving] = useState(false);
  // const [editError, setEditError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [usersPage, setUsersPage] = useState(1);

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetResult, setResetResult] = useState<{ login: string; password: string } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  const [telegramClients, setTelegramClients] = useState<TelegramBotClient[]>([]);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramLoadError, setTelegramLoadError] = useState('');
  const [telegramActionError, setTelegramActionError] = useState('');
  const [telegramActionId, setTelegramActionId] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<TelegramBotClient | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [telegramDeleteTarget, setTelegramDeleteTarget] = useState<TelegramBotClient | null>(null);
  const [telegramPage, setTelegramPage] = useState(1);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await authFetch('/admin/users');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить пользователей');
      setUsers(data ?? []);
    } catch (err: any) {
      setLoadError(err.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const loadTelegramClients = async () => {
    setTelegramLoading(true);
    setTelegramLoadError('');
    try {
      const res = await authFetch('/admin/telegram-clients');
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось загрузить пользователей Telegram-бота');
      setTelegramClients(data ?? []);
    } catch (err: any) {
      setTelegramLoadError(err.message || 'Не удалось загрузить пользователей Telegram-бота');
    } finally {
      setTelegramLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadTelegramClients();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.login, u.fullName, u.email, u.phone].some((field) => field?.toLowerCase().includes(q)));
  }, [users, search]);

  useEffect(() => {
    setUsersPage(1);
  }, [search]);

  const usersTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedUsers = filtered.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);

  const telegramTotalPages = Math.max(1, Math.ceil(telegramClients.length / PAGE_SIZE));
  const paginatedTelegramClients = telegramClients.slice((telegramPage - 1) * PAGE_SIZE, telegramPage * PAGE_SIZE);

  // const openEdit = (u: AdminUser) => {
  //   setEditingUser(u);
  //   setEditFullName(u.fullName ?? '');
  //   setEditEmail(u.email ?? '');
  //   setEditPhone(u.phone ?? '');
  //   setEditError('');
  // };

  // const closeEdit = () => setEditingUser(null);

  // const submitEdit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!editingUser) return;
  //   setEditSaving(true);
  //   setEditError('');
  //   try {
  //     const res = await authFetch(`/admin/users/${editingUser.id}`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ fullName: editFullName, email: editEmail, phone: editPhone }),
  //     });
  //     const data = await parseBody(res);
  //     if (!res.ok) {
  //       const msgRaw = data?.message;
  //       throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось сохранить изменения');
  //     }
  //     setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
  //     setEditingUser(null);
  //   } catch (err: any) {
  //     setEditError(err.message || 'Не удалось сохранить изменения');
  //   } finally {
  //     setEditSaving(false);
  //   }
  // };

  const toggleStatus = async (u: AdminUser) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    setActionError('');
    setActionId(u.id);
    try {
      const res = await authFetch(`/admin/users/${u.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось изменить статус');
      setUsers((prev) => prev.map((row) => (row.id === data.id ? data : row)));
    } catch (err: any) {
      setActionError(err.message || 'Не удалось изменить статус');
    } finally {
      setActionId(null);
    }
  };

  const toggleMessagingRestriction = async (u: AdminUser) => {
    const restricted = !u.messagingRestrictedAt;
    setActionError('');
    setActionId(u.id);
    try {
      const res = await authFetch(`/admin/users/${u.id}/messaging-restriction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restricted }),
      });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось изменить ограничение');
      setUsers((prev) => prev.map((row) => (row.id === data.id ? data : row)));
    } catch (err: any) {
      setActionError(err.message || 'Не удалось изменить ограничение');
    } finally {
      setActionId(null);
    }
  };

  const unlinkTelegram = async (u: AdminUser) => {
    setActionError('');
    setActionId(u.id);
    try {
      const res = await authFetch(`/admin/users/${u.id}/telegram-unlink`, { method: 'PATCH' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось отвязать Telegram');
      setUsers((prev) => prev.map((row) => (row.id === data.id ? data : row)));
    } catch (err: any) {
      setActionError(err.message || 'Не удалось отвязать Telegram');
    } finally {
      setActionId(null);
    }
  };

  const openResetPassword = (u: AdminUser) => {
    setResetTarget(u);
    setResetError('');
  };

  const closeResetPassword = () => setResetTarget(null);

  const confirmResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    setResetError('');
    try {
      const res = await authFetch(`/admin/users/${resetTarget.id}/reset-password`, { method: 'PATCH' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось сбросить пароль');
      setResetResult({ login: resetTarget.login, password: data.temporaryPassword });
      setResetTarget(null);
      setResetCopied(false);
    } catch (err: any) {
      setResetError(err.message || 'Не удалось сбросить пароль');
    } finally {
      setResetting(false);
    }
  };

  const copyResetPassword = () => {
    if (!resetResult) return;
    navigator.clipboard.writeText(resetResult.password).then(() => {
      setResetCopied(true);
      setTimeout(() => setResetCopied(false), 2000);
    });
  };

  const openDelete = (u: AdminUser) => {
    setDeleteTarget(u);
    setDeleteError('');
  };

  const closeDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await authFetch(`/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await parseBody(res);
      if (!res.ok) throw new Error(data?.message || 'Не удалось удалить пользователя');
      setUsers((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Не удалось удалить пользователя');
    } finally {
      setDeleting(false);
    }
  };

  const setTelegramClientBlocked = async (id: string, blocked: boolean, reason?: string) => {
    setTelegramActionError('');
    setTelegramActionId(id);
    try {
      const res = await authFetch(`/admin/telegram-clients/${id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocked, reason }),
      });
      const data = await parseBody(res);
      if (!res.ok) {
        const msgRaw = data?.message;
        throw new Error(Array.isArray(msgRaw) ? msgRaw.join('; ') : msgRaw || 'Не удалось изменить блокировку');
      }
      setTelegramClients((prev) => prev.map((row) => (row.id === data.id ? data : row)));
      setBlockTarget(null);
      setBlockReason('');
    } catch (err: any) {
      setTelegramActionError(err.message || 'Не удалось изменить блокировку');
    } finally {
      setTelegramActionId(null);
    }
  };

  const openBlock = (client: TelegramBotClient) => {
    setBlockTarget(client);
    setBlockReason('');
    setTelegramActionError('');
  };

  const confirmDeleteTelegramClient = async () => {
    if (!telegramDeleteTarget) return;
    setTelegramActionError('');
    setTelegramActionId(telegramDeleteTarget.id);
    try {
      const res = await authFetch(`/admin/telegram-clients/${telegramDeleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await parseBody(res);
        throw new Error(data?.message || 'Не удалось удалить пользователя Telegram-бота');
      }
      setTelegramClients((prev) => prev.filter((row) => row.id !== telegramDeleteTarget.id));
      setTelegramDeleteTarget(null);
    } catch (err: any) {
      setTelegramActionError(err.message || 'Не удалось удалить пользователя Telegram-бота');
    } finally {
      setTelegramActionId(null);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Пользователи</h1>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по логину, имени, email..."
            className="input !pl-10"
          />
        </div>
      </div>

      {actionError ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-body text-sm text-red-400">
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      ) : loadError ? (
        <p className="font-body text-sm text-red-400">{loadError}</p>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <UserCog className="h-8 w-8 text-white/25" strokeWidth={1.4} />
          <p className="font-body text-sm text-white/40">{search ? 'Ничего не найдено' : 'Пользователей пока нет'}</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                <th className="px-4 py-3 font-medium">Пользователь</th>
                <th className="px-4 py-3 font-medium">Роль</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Контакты</th>
                <th className="px-4 py-3 font-medium">Регистрация</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const busy = actionId === u.id;
                return (
                  <tr key={u.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">
                      <p className="font-body text-sm font-medium text-white">{u.fullName || u.login}</p>
                      <p className="font-body text-xs text-white/35">@{u.login}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="badge border border-white/10 bg-white/[0.06] text-white/60">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
                      {[u.email, u.phone].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-body text-xs text-white/40">
                      {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex justify-end">
                        <RowActions
                          user={u}
                          isSelf={isSelf}
                          busy={busy}
                          // onEdit={() => openEdit(u)}
                          onToggleStatus={() => toggleStatus(u)}
                          onToggleMessagingRestriction={() => toggleMessagingRestriction(u)}
                          onUnlinkTelegram={() => unlinkTelegram(u)}
                          onResetPassword={() => openResetPassword(u)}
                          onRemove={() => openDelete(u)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 pb-3">
            <Pagination page={usersPage} totalPages={usersTotalPages} onChange={setUsersPage} />
          </div>
        </div>
      )}

      <div className="mb-4 mt-10 flex items-center gap-2">
        <h2 className="font-display text-xl font-bold">Пользователи Telegram-бота</h2>
        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 font-body text-xs text-white/50">{telegramClients.length}</span>
      </div>

      {telegramActionError ? (
        <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-body text-sm text-red-400">
          {telegramActionError}
        </p>
      ) : null}

      {telegramLoading ? (
        <p className="font-body text-sm text-white/40">Загрузка…</p>
      ) : telegramLoadError ? (
        <p className="font-body text-sm text-red-400">{telegramLoadError}</p>
      ) : telegramClients.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Send className="h-8 w-8 text-white/25" strokeWidth={1.4} />
          <p className="font-body text-sm text-white/40">Пока никто не писал через Telegram-бота</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wide text-white/35">
                <th className="px-4 py-3 font-medium">Telegram</th>
                <th className="px-4 py-3 font-medium">Гейт 18+/правила</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Первое обращение</th>
                <th className="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTelegramClients.map((client) => (
                <TelegramClientRow
                  key={client.id}
                  client={client}
                  busy={telegramActionId === client.id}
                  onBlock={() => openBlock(client)}
                  onUnblock={() => setTelegramClientBlocked(client.id, false)}
                  onDelete={() => {
                    setTelegramDeleteTarget(client);
                    setTelegramActionError('');
                  }}
                />
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-3">
            <Pagination page={telegramPage} totalPages={telegramTotalPages} onChange={setTelegramPage} />
          </div>
        </div>
      )}

      {/* {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={closeEdit} />
          <div className="card relative max-h-[90vh] w-full max-w-md overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">@{editingUser.login}</h2>
              <button type="button" onClick={closeEdit} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Имя</label>
                <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>
              <div>
                <label className="mb-1 block font-body text-xs uppercase tracking-wide text-white/40">Телефон</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+7 999 123-45-67"
                  className="input"
                />
              </div>

              {editError ? <p className="font-body text-sm text-red-400">{editError}</p> : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeEdit} className="btn-secondary">
                  Отмена
                </button>
                <button type="submit" disabled={editSaving} className="btn-primary disabled:opacity-50">
                  {editSaving ? 'Сохраняем…' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null} */}

      {resetTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={resetting ? undefined : closeResetPassword} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <KeyRound className="h-6 w-6 text-accent" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Сбросить пароль?</h2>
            <p className="font-body text-sm text-white/40">
              Пользователю «{resetTarget.fullName || resetTarget.login}» (@{resetTarget.login}) будет выдан новый временный
              пароль, все текущие сессии завершатся.
            </p>

            {resetError ? <p className="mt-4 font-body text-sm text-red-400">{resetError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={closeResetPassword} disabled={resetting} className="btn-secondary disabled:opacity-50">
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmResetPassword}
                disabled={resetting}
                className="btn-primary disabled:opacity-50"
              >
                {resetting ? 'Сбрасываем…' : 'Сбросить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {resetResult ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setResetResult(null)} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Новый пароль для @{resetResult.login}</h2>
              <button type="button" onClick={() => setResetResult(null)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 font-body text-sm text-white/40">
              Скопируйте и передайте пароль пользователю — повторно он показан не будет.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0a0a0a] px-4 py-3">
              <span className="flex-1 select-all break-all font-mono text-sm text-white">{resetResult.password}</span>
              <button
                type="button"
                onClick={copyResetPassword}
                title="Скопировать"
                className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {resetCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => setResetResult(null)} className="btn-primary">
                Готово
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={deleting ? undefined : closeDelete} />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Удалить пользователя?</h2>
            <p className="font-body text-sm text-white/40">
              Аккаунт «{deleteTarget.fullName || deleteTarget.login}» (@{deleteTarget.login}) будет удалён без
              возможности восстановления.
            </p>

            {deleteError ? <p className="mt-4 font-body text-sm text-red-400">{deleteError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button type="button" onClick={closeDelete} disabled={deleting} className="btn-secondary disabled:opacity-50">
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {blockTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setBlockTarget(null)} />
          <div className="card relative w-full p-6 !rounded-b-none sm:max-w-sm sm:!rounded-2xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Заблокировать доступ к боту</h2>
              <button type="button" onClick={() => setBlockTarget(null)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 font-body text-sm text-white/40">
              {blockTarget.telegramUsername ? `@${blockTarget.telegramUsername}` : `id ${blockTarget.telegramId}`} больше не
              сможет писать через бота ни одному исполнителю.
            </p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Причина — необязательно (спам, жалоба, нарушение правил)"
              rows={3}
              maxLength={500}
              className="input resize-none text-sm"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBlockTarget(null)}
                disabled={telegramActionId === blockTarget.id}
                className="btn-secondary disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => setTelegramClientBlocked(blockTarget.id, true, blockReason.trim() || undefined)}
                disabled={telegramActionId === blockTarget.id}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {telegramActionId === blockTarget.id ? 'Блокируем…' : 'Заблокировать'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {telegramDeleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={telegramActionId === telegramDeleteTarget.id ? undefined : () => setTelegramDeleteTarget(null)}
          />
          <div className="card relative w-full p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center !rounded-b-none sm:max-w-sm sm:!rounded-2xl sm:pb-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" strokeWidth={1.6} />
            </div>
            <h2 className="mb-2 font-display text-lg font-bold">Удалить пользователя Telegram-бота?</h2>
            <p className="font-body text-sm text-white/40">
              {telegramDeleteTarget.telegramUsername ? `@${telegramDeleteTarget.telegramUsername}` : `id ${telegramDeleteTarget.telegramId}`} и
              вся переписка с исполнителями будут удалены без возможности восстановления.
            </p>

            {telegramActionError ? <p className="mt-4 font-body text-sm text-red-400">{telegramActionError}</p> : null}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setTelegramDeleteTarget(null)}
                disabled={telegramActionId === telegramDeleteTarget.id}
                className="btn-secondary disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmDeleteTelegramClient}
                disabled={telegramActionId === telegramDeleteTarget.id}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-2.5 font-body text-sm font-semibold text-white transition-all hover:bg-red-600 disabled:opacity-50"
              >
                {telegramActionId === telegramDeleteTarget.id ? 'Удаляем…' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

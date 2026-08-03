'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, CheckCircle2, Loader2, Search, Trash2, UserCog } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { authFetch } from '@/lib/auth-fetch';

interface AdminUser {
  id: string;
  login: string;
  fullName: string | null;
  role: 'client' | 'performer' | 'admin';
  status: 'active' | 'suspended';
  email: string | null;
  phone: string | null;
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
  onRemove,
}: {
  user: AdminUser;
  isSelf: boolean;
  busy: boolean;
  // onEdit: () => void;
  onToggleStatus: () => void;
  onRemove: () => void;
}) {
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

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.login, u.fullName, u.email, u.phone].some((field) => field?.toLowerCase().includes(q)));
  }, [users, search]);

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
              {filtered.map((u) => {
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
                          onRemove={() => openDelete(u)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEdit} />
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

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={deleting ? undefined : closeDelete} />
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
    </>
  );
}

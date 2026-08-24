'use client';

/**
 * Global auth state for client components.
 * Source of truth in the browser is localStorage (accessToken, refreshToken, user JSON).
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { disconnectChatSocket } from '@/lib/chat-socket';
import { Role } from '@/lib/enums';

interface User {
  id: string;
  login: string;
  fullName: string | null;
  role: Role;
  messagingRestricted: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  privateAreaHref: string;
  privateAreaLabel: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const guestAuthValue: AuthContextType = {
  user: null,
  loading: false,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
  privateAreaHref: '/login',
  privateAreaLabel: 'Войти',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initAttempted = useRef(false);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await authFetch('/auth/me');
      if (!res.ok) return;
      const fresh = await res.json();
      const updated: User = {
        id: fresh.id,
        login: fresh.login,
        fullName: fresh.fullName,
        role: fresh.role,
        messagingRestricted: Boolean(fresh.messagingRestricted),
      };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    } catch {
      // stale cache is better than crashing
    }
  }, []);

  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    try {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        refreshUser();
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback((token: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    disconnectChatSocket();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  }, [router]);

  const privateAreaHref = user ? '/cabinet' : '/login';
  const privateAreaLabel = user ? 'Личный кабинет' : 'Войти';

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshUser, privateAreaHref, privateAreaLabel }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export function useAuthOrGuest(): AuthContextType {
  return useContext(AuthContext) ?? guestAuthValue;
}

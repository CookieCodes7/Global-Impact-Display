import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
  avatar?: string;
  bio?: string;
  plan?: 'free' | 'pro';
  joinedAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'mp_user';

function deriveInitials(name: string) {
  const words = name.trim().split(' ');
  return words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = async (email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 800));
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const existing: AuthUser = JSON.parse(stored);
      if (existing.email.toLowerCase() === email.toLowerCase()) {
        setUser(existing);
        return;
      }
    }
    const name = email.split('@')[0];
    const initials = name.slice(0, 2).toUpperCase();
    setUser({ name, email: email.toLowerCase(), initials, plan: 'free', joinedAt: new Date().toISOString() });
  };

  const signup = async (name: string, email: string, _password: string) => {
    await new Promise(r => setTimeout(r, 900));
    setUser({
      name: name.trim(),
      email: email.toLowerCase(),
      initials: deriveInitials(name),
      plan: 'free',
      joinedAt: new Date().toISOString(),
    });
  };

  const logout = () => setUser(null);

  const updateProfile = (updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (updates.name) next.initials = deriveInitials(updates.name);
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tracex_token'));
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('tracex_user');
    if (cached) {
      try { return JSON.parse(cached); } catch { return null; }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => !localStorage.getItem('tracex_token'));

  const refreshUser = async () => {
    if (!localStorage.getItem('tracex_token')) {
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
      localStorage.setItem('tracex_user', JSON.stringify(u));
    } catch (err) {
      const cached = localStorage.getItem('tracex_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token || !!user,
        login,
        logout,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

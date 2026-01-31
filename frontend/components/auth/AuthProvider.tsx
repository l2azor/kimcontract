'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthCompany, authApi } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  company: AuthCompany | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser, company: AuthCompany) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<AuthCompany | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 저장된 토큰 확인
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      if (response.success) {
        setUser({
          id: response.data.id,
          email: response.data.email,
          role: response.data.role,
        });
        setCompany(response.data.company);
      }
    } catch {
      // 토큰이 유효하지 않으면 로그아웃
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setCompany(null);
    }
  };

  const login = (token: string, userData: AuthUser, companyData: AuthCompany) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setCompany(companyData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCompany(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

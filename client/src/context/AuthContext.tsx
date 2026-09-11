import React, { createContext, useContext, useState, useEffect } from 'react';
import { SafeUser, SignupPayload, LoginPayload } from '../types/auth.types.js';
import { authService } from '../services/auth.service.js';

interface AuthContextType {
  user: SafeUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
    } catch (_err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const signup = async (payload: SignupPayload) => {
    const data = await authService.signup(payload);
    setUser(data.user);
  };

  const login = async (payload: LoginPayload) => {
    const data = await authService.login(payload);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signup,
        login,
        logout,
        refetchUser: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

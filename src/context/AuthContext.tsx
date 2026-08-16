import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';

interface SessionTerminatedState {
  isTerminated: boolean;
  message: string;
  device?: string;
  time?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string; previousSessionTerminated?: boolean; previousDevice?: string }>;
  logout: () => Promise<void>;
  sessionTerminated: SessionTerminatedState;
  dismissSessionTerminatedModal: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mandal_auth_token';
const USER_KEY = 'mandal_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionTerminated, setSessionTerminated] = useState<SessionTerminatedState>({
    isTerminated: false,
    message: '',
  });

  const handleSessionKickedOut = useCallback((message?: string, device?: string, time?: string) => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    setSessionTerminated({
      isTerminated: true,
      message: message || 'तुमचे खाते इतर डिव्हाइसवर लॉग इन झाले आहे. सुरक्षेसाठी हे सत्र आपोआप बंद करण्यात आले आहे.',
      device: device || 'Another device / browser',
      time: time ? new Date(time).toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString('mr-IN'),
    });
  }, []);

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers(options.headers || {});
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        const clone = response.clone();
        try {
          const data = await clone.json();
          if (data.code === 'SESSION_TERMINATED_BY_NEW_LOGIN') {
            handleSessionKickedOut(data.error, data.lastLoginDevice, data.lastLoginAt);
          }
        } catch {
          // ignore
        }
      }
      return response;
    } catch (err) {
      throw err;
    }
  }, [handleSessionKickedOut]);

  // Periodic heartbeat session verification
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function checkSession() {
      if (!token) return;
      try {
        const res = await authFetch('/api/auth/verify-session');
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.code === 'SESSION_TERMINATED_BY_NEW_LOGIN') {
            handleSessionKickedOut(data.error, data.lastLoginDevice, data.lastLoginAt);
          }
        } else if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setUser(prev => ({ ...prev, ...data.user }));
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
        }
      } catch (err) {
        console.warn('Session verification warning:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();
    const interval = setInterval(checkSession, 5000); // 5-second heartbeat for instant detection of another device login

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, authFetch, handleSessionKickedOut]);

  const login = async (phone: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'लॉगिन अयशस्वी झाले (Login failed)' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setSessionTerminated({ isTerminated: false, message: '' });

      return {
        success: true,
        previousSessionTerminated: data.previousSessionTerminated,
        previousDevice: data.previousDevice,
      };
    } catch (err: any) {
      return { success: false, error: 'सर्व्हरशी संपर्क होऊ शकला नाही: ' + err.message };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setToken(null);
    }
  };

  const dismissSessionTerminatedModal = () => {
    setSessionTerminated({ isTerminated: false, message: '' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        logout,
        sessionTerminated,
        dismissSessionTerminatedModal,
        authFetch,
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

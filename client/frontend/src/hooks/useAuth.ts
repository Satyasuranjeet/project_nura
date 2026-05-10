import { useCallback, useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { UserProfile } from '../types';

export function useAuth() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem(api.TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const user = await api.getMe();
      const today = new Date().toISOString().split('T')[0];
      if (user.lastLoginDate !== today) {
        const updated = await api.updateMe({ freeChatsToday: 3, lastLoginDate: today });
        setProfile(updated);
      } else {
        setProfile(user);
      }
    } catch {
      localStorage.removeItem(api.TOKEN_KEY);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    localStorage.setItem(api.TOKEN_KEY, token);
    setProfile(user);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { token, user } = await api.register(email, password, displayName);
    localStorage.setItem(api.TOKEN_KEY, token);
    setProfile(user);
  };

  const logout = () => {
    localStorage.removeItem(api.TOKEN_KEY);
    setProfile(null);
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem(api.TOKEN_KEY);
    if (!token) return;
    try {
      const user = await api.getMe();
      setProfile(user);
    } catch {
      // token may have expired — keep current state
    }
  }, []);

  return { profile, loading, login, register, logout, updateProfile, refreshProfile };
}


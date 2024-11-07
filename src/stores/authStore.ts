import { create } from 'zustand';
import { api } from '../lib/api';
import { useGuestStore } from './guestStore';
import type { User } from '@supabase/supabase-js';

interface GuestUser {
  id: string;
  email: string;
  isGuest: true;
}

interface AuthState {
  user: (User | GuestUser) | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,
  initialized: false,

  initialize: async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.setToken(token);
        // TODO: Implement user profile endpoint
        set({ initialized: true, loading: false });
      } else {
        set({ initialized: true, loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Authentication failed',
        loading: false,
        initialized: true
      });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement auth endpoints
      const token = 'dummy-token';
      api.setToken(token);
      localStorage.setItem('token', token);
      set({ loading: false });
      useGuestStore.getState().clearAll();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign in failed',
        loading: false 
      });
      throw error;
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // TODO: Implement auth endpoints
      const token = 'dummy-token';
      api.setToken(token);
      localStorage.setItem('token', token);
      set({ loading: false });
      useGuestStore.getState().clearAll();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign up failed',
        loading: false 
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      api.setToken(null);
      localStorage.removeItem('token');
      set({ user: null, loading: false });
      useGuestStore.getState().clearAll();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Sign out failed',
        loading: false 
      });
      throw error;
    }
  },

  continueAsGuest: () => {
    const guestUser: GuestUser = {
      id: `guest-${Date.now()}`,
      email: 'guest@wordzy.app',
      isGuest: true
    };
    set({ user: guestUser, loading: false });
  }
}));
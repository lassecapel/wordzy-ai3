import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  defaultLanguage: string;
  colorScheme: string;
  setDefaultLanguage: (language: string) => void;
  setColorScheme: (scheme: string) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      defaultLanguage: 'en',
      colorScheme: 'default',
      setDefaultLanguage: (language) => set({ defaultLanguage: language }),
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    {
      name: 'config-storage',
    }
  )
);
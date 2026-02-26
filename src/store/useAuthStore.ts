import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isInitialized: boolean;

  setUser: (user: AuthUser | null) => void;
  setInitialized: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setInitialized: () => set({ isInitialized: true }),
    }),
    {
      name: 'meshi-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user — isInitialized resets to false each launch
      partialize: (state) => ({ user: state.user }),
    }
  )
);

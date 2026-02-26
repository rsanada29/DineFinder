import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  // Device-level preferences (per device, not per account)
  displayName: string;
  photoUri: string;
  notifications: boolean;
  locationEnabled: boolean;
  darkMode: boolean;

  setDisplayName: (name: string) => void;
  setPhotoUri: (uri: string) => void;
  setNotifications: (v: boolean) => void;
  setLocationEnabled: (v: boolean) => void;
  setDarkMode: (v: boolean) => void;
  reset: () => void;
}

const DEFAULTS = {
  displayName: '',
  photoUri: '',
  notifications: true,
  locationEnabled: true,
  darkMode: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setDisplayName: (name) => set({ displayName: name }),
      setPhotoUri: (uri) => set({ photoUri: uri }),
      setNotifications: (v) => set({ notifications: v }),
      setLocationEnabled: (v) => set({ locationEnabled: v }),
      setDarkMode: (v) => set({ darkMode: v }),
      reset: () => set(DEFAULTS),
    }),
    {
      name: 'meshi-user-prefs',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

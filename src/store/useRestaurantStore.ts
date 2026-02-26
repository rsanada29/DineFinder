import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Restaurant, Filters } from '../types';
import { fetchNearbyRestaurants, fetchPlaceById } from '../services/googlePlaces';
import { getUserLocation } from '../services/location';
import { saveUserSavedRestaurants, loadUserSavedRestaurants } from '../services/auth';
import { useAuthStore } from './useAuthStore';

const DEFAULT_RADIUS = 20000;
const MAX_RADIUS = 50000;
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface RestaurantState {
  restaurants: Restaurant[];
  saved: Restaurant[];
  skipped: string[];
  filters: Filters;
  isLoading: boolean;
  userLat: number;
  userLng: number;
  searchRadius: number;

  fetchRestaurants: () => Promise<void>;
  expandAndReload: () => Promise<void>;
  loadSaved: () => Promise<void>;
  resetSkipped: () => void;
  swipeRight: (restaurant: Restaurant) => void;
  swipeLeft: (restaurantId: string) => void;
  removeSaved: (restaurantId: string) => void;
  setFilters: (filters: Filters) => void;
  logout: () => void;
}

const DEFAULT_FILTERS: Filters = {
  maxDistance: 20,
  genres: ['All'],
  sort: 'distance',
  priceLevels: [1, 2, 3, 4],
  mealTime: 'all',
};

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set, get) => ({
      restaurants: [],
      saved: [],
      skipped: [],
      filters: DEFAULT_FILTERS,
      isLoading: false,
      userLat: -37.8136,
      userLng: 144.9631,
      searchRadius: DEFAULT_RADIUS,

      fetchRestaurants: async () => {
        set({ isLoading: true });
        try {
          const coords = await getUserLocation();
          const data = await fetchNearbyRestaurants(coords.lat, coords.lng, DEFAULT_RADIUS);
          set({ restaurants: data, userLat: coords.lat, userLng: coords.lng, skipped: [], searchRadius: DEFAULT_RADIUS });
        } finally {
          set({ isLoading: false });
        }
      },

      // Called when the deck runs out — expands radius and resets left-swiped
      expandAndReload: async () => {
        const { userLat, userLng, searchRadius } = get();
        const newRadius = Math.min(Math.round(searchRadius * 1.5), MAX_RADIUS);
        set({ isLoading: true, skipped: [], searchRadius: newRadius });
        try {
          const data = await fetchNearbyRestaurants(userLat, userLng, newRadius);
          set({ restaurants: data });
        } finally {
          set({ isLoading: false });
        }
      },

      // Load saved restaurants on login (AsyncStorage per-user → Firestore fallback)
      // Then refresh any entries older than 30 days from the Places API.
      loadSaved: async () => {
        const uid = useAuthStore.getState().user?.uid;
        if (!uid) return;
        try {
          let saved: Restaurant[] = [];
          // 1. Try user-specific AsyncStorage first (most reliable)
          const localData = await AsyncStorage.getItem(`meshi-saved-${uid}`);
          if (localData) {
            const parsed = JSON.parse(localData) as Restaurant[];
            if (parsed.length > 0) saved = parsed;
          }
          // 2. Fallback to Firestore
          if (saved.length === 0) {
            const firestoreSaved = await loadUserSavedRestaurants(uid);
            if (firestoreSaved.length > 0) saved = firestoreSaved;
          }
          if (saved.length > 0) set({ saved });

          // 3. Refresh stale entries in the background (>30 days old or no timestamp)
          const now = Date.now();
          const stale = saved.filter((r) => !r.fetchedAt || now - r.fetchedAt > CACHE_MAX_AGE_MS);
          if (stale.length > 0) {
            const { userLat, userLng } = get();
            // Refresh up to 10 at a time to avoid excessive API calls
            const toRefresh = stale.slice(0, 10);
            const refreshed = await Promise.all(
              toRefresh.map((r) => fetchPlaceById(r.id, userLat, userLng))
            );
            const refreshMap = new Map<string, Restaurant>();
            refreshed.forEach((r) => { if (r) refreshMap.set(r.id, r); });

            if (refreshMap.size > 0) {
              set((state) => {
                const updated = state.saved.map((r) => refreshMap.get(r.id) ?? r);
                // Sync updated data
                AsyncStorage.setItem(`meshi-saved-${uid}`, JSON.stringify(updated)).catch(console.warn);
                saveUserSavedRestaurants(uid, updated).catch(console.warn);
                return { saved: updated };
              });
              console.log(`[MeshiMatch] Refreshed ${refreshMap.size}/${toRefresh.length} stale saved restaurants`);
            }
          }
        } catch (e) {
          console.warn('Failed to load saved restaurants:', e);
        }
      },

      resetSkipped: () => set({ skipped: [] }),

      swipeRight: (restaurant) => {
        set((state) => {
          if (state.saved.find((r) => r.id === restaurant.id)) return state;
          const stamped = { ...restaurant, fetchedAt: restaurant.fetchedAt ?? Date.now() };
          const newSaved = [...state.saved, stamped];
          // Sync in background to both AsyncStorage (per-user) and Firestore
          const uid = useAuthStore.getState().user?.uid;
          if (uid) {
            AsyncStorage.setItem(`meshi-saved-${uid}`, JSON.stringify(newSaved)).catch(console.warn);
            saveUserSavedRestaurants(uid, newSaved).catch(console.warn);
          }
          return { saved: newSaved };
        });
      },

      swipeLeft: (restaurantId) => {
        set((state) => ({
          skipped: [...state.skipped, restaurantId],
        }));
      },

      removeSaved: (restaurantId) => {
        set((state) => {
          const newSaved = state.saved.filter((r) => r.id !== restaurantId);
          // Sync in background
          const uid = useAuthStore.getState().user?.uid;
          if (uid) {
            AsyncStorage.setItem(`meshi-saved-${uid}`, JSON.stringify(newSaved)).catch(console.warn);
            saveUserSavedRestaurants(uid, newSaved).catch(console.warn);
          }
          return { saved: newSaved };
        });
      },

      setFilters: (filters) => set({ filters }),

      logout: () => {
        // Save current user's data to their own AsyncStorage before clearing
        const uid = useAuthStore.getState().user?.uid;
        const { saved } = get();
        if (uid && saved.length > 0) {
          AsyncStorage.setItem(`meshi-saved-${uid}`, JSON.stringify(saved)).catch(console.warn);
          saveUserSavedRestaurants(uid, saved).catch(console.warn);
        }
        set({
          saved: [],
          skipped: [],
          restaurants: [],
          filters: DEFAULT_FILTERS,
          searchRadius: DEFAULT_RADIUS,
        });
      },
    }),
    {
      name: 'meshi-restaurants',
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 4) {
          // v3→v4: genre (string) → genres (string[])
          const filters = (state.filters ?? {}) as Record<string, unknown>;
          if ('genre' in filters && !('genres' in filters)) {
            const old = filters.genre as string;
            filters.genres = old && old !== 'All' ? [old] : ['All'];
            delete filters.genre;
          }
          state.filters = filters;
        }
        if (version < 5) {
          // v4→v5: add fetchedAt to existing saved restaurants (null = will be refreshed on next load)
          const saved = (state.saved ?? []) as Record<string, unknown>[];
          saved.forEach((r) => { if (!r.fetchedAt) r.fetchedAt = undefined; });
          state.saved = saved;
        }
        return state as RestaurantState;
      },
      // Only persist saved restaurants and filter preferences
      // restaurants/skipped/loading state reset on each app launch
      partialize: (state) => ({
        saved: state.saved,
        filters: state.filters,
      }),
    }
  )
);

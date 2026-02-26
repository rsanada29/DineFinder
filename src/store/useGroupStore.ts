import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Group, Restaurant } from '../types';
import { db, isFirebaseConfigured } from '../services/firebase';
import { useAuthStore } from './useAuthStore';

function getCurrentUserId(): string {
  return useAuthStore.getState().user?.uid ?? 'user_demo';
}

function getCurrentUserProfile(): { name: string; photoUri?: string } {
  const { useUserStore } = require('./useUserStore');
  const { displayName, photoUri } = useUserStore.getState();
  const email = useAuthStore.getState().user?.email ?? '';
  const profile: { name: string; photoUri?: string } = {
    name: displayName || email.split('@')[0] || 'User',
  };
  if (photoUri) profile.photoUri = photoUri;
  return profile;
}

// Remove all undefined values recursively (Firestore rejects undefined)
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(obj));
}

async function firestoreCreateGroup(group: Group): Promise<void> {
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'groups', group.id), stripUndefined(group as unknown as Record<string, unknown>));
}

// Debounced Firestore swipe writer — batches rapid swipes into a single write per group
const pendingSwipeWrites = new Map<string, { userId: string; timer: ReturnType<typeof setTimeout> }>();

function debouncedFirestoreUpdateSwipes(
  groupId: string,
  userId: string,
  getLatestIds: () => string[]
): void {
  if (!db) return;
  const key = `${groupId}:${userId}`;
  const existing = pendingSwipeWrites.get(key);
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(async () => {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db!, 'groups', groupId), {
        [`swipes.${userId}`]: getLatestIds(),
      });
    } catch (e) {
      console.warn('[MeshiMatch] Firestore swipe write failed:', e);
    } finally {
      // Only remove pending flag after the write completes (or fails)
      pendingSwipeWrites.delete(key);
    }
  }, 2000); // batch writes every 2 seconds

  pendingSwipeWrites.set(key, { userId, timer });
}

async function firestoreFindGroupByCode(code: string): Promise<Group | null> {
  if (!db) return null;
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  const q = query(collection(db, 'groups'), where('code', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as Group;
}

async function firestoreJoinGroup(groupId: string, userId: string, swipes: string[]): Promise<void> {
  if (!db) return;
  const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayUnion(userId),
    [`swipes.${userId}`]: swipes,
  });
}

async function firestoreLeaveGroup(groupId: string, userId: string): Promise<void> {
  if (!db) return;
  const { doc, updateDoc, arrayRemove, deleteField } = await import('firebase/firestore');
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayRemove(userId),
    [`swipes.${userId}`]: deleteField(),
    [`memberProfiles.${userId}`]: deleteField(),
  });
}

async function firestoreDeleteGroup(groupId: string): Promise<void> {
  if (!db) return;
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'groups', groupId));
}

async function firestoreUpdateMemberProfile(
  groupId: string,
  userId: string,
  profile: { name: string; photoUri?: string }
): Promise<void> {
  if (!db) return;
  const { doc, updateDoc } = await import('firebase/firestore');
  // Firestore doesn't accept undefined — only include photoUri if it has a value
  const clean: { name: string; photoUri?: string } = { name: profile.name };
  if (profile.photoUri) clean.photoUri = profile.photoUri;
  await updateDoc(doc(db, 'groups', groupId), {
    [`memberProfiles.${userId}`]: clean,
  });
}

function generateCode(): string {
  return 'MESH-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function computeMatches(group: Group, allRestaurants: Restaurant[]): Restaurant[] {
  const memberIds = group.members;
  // Need at least 2 members to have a "match"
  if (memberIds.length < 2) return [];

  const sets = memberIds.map((m) => new Set(group.swipes[m] ?? []));
  const intersection = [...sets[0]].filter((id) =>
    sets.slice(1).every((s) => s.has(id))
  );

  return intersection
    .map((id) => allRestaurants.find((r) => r.id === id))
    .filter((r): r is Restaurant => r !== undefined);
}

interface GroupState {
  groups: Group[];
  currentUserId: string;

  createGroup: (name: string) => Group;
  joinGroup: (code: string) => Promise<Group | null>;
  leaveGroup: (groupId: string) => void;
  deleteGroup: (groupId: string) => void;
  addSwipe: (groupId: string, restaurantId: string) => void;
  removeSwipe: (groupId: string, restaurantId: string) => void;
  getGroupMatches: (groupId: string, allRestaurants: Restaurant[]) => Restaurant[];
  subscribeToGroup: (groupId: string) => (() => void) | undefined;
  loadGroups: () => Promise<void>;
  logout: () => void;
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      currentUserId: 'user_demo',

      createGroup: (name: string) => {
        const userId = getCurrentUserId();
        const profile = getCurrentUserProfile();
        // Pre-populate swipes with already-saved restaurant IDs
        const { useRestaurantStore } = require('./useRestaurantStore');
        const savedIds = useRestaurantStore.getState().saved.map((r: Restaurant) => r.id);
        const newGroup: Group = {
          id: `group_${Date.now()}`,
          name,
          code: generateCode(),
          members: [userId],
          swipes: { [userId]: savedIds },
          memberProfiles: { [userId]: profile },
          createdAt: Date.now(),
          createdBy: userId,
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        if (isFirebaseConfigured) firestoreCreateGroup(newGroup).catch(console.warn);
        return newGroup;
      },

      leaveGroup: (groupId: string) => {
        const userId = getCurrentUserId();
        const group = get().groups.find((g) => g.id === groupId);
        const remainingMembers = (group?.members ?? []).filter((m) => m !== userId);
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        }));
        if (isFirebaseConfigured) {
          if (remainingMembers.length === 0) {
            // Last member leaving — delete the entire group document
            firestoreDeleteGroup(groupId).catch(console.warn);
          } else {
            firestoreLeaveGroup(groupId, userId).catch(console.warn);
          }
        }
      },

      deleteGroup: (groupId: string) => {
        // deleteGroup now behaves the same as leaveGroup
        // (keeps group for other members, only deletes from Firestore if no one remains)
        get().leaveGroup(groupId);
      },

      joinGroup: async (code: string) => {
        const userId = getCurrentUserId();
        const profile = getCurrentUserProfile();

        // 1. Check local groups first
        const localGroup = get().groups.find((g) => g.code === code);
        if (localGroup) {
          if (localGroup.members.includes(userId)) return localGroup;
          const savedIds = (await import('./useRestaurantStore')).useRestaurantStore.getState().saved.map((r) => r.id);
          const updated: Group = {
            ...localGroup,
            members: [...localGroup.members, userId],
            swipes: { ...localGroup.swipes, [userId]: savedIds },
            memberProfiles: { ...localGroup.memberProfiles, [userId]: profile },
          };
          set((state) => ({
            groups: state.groups.map((g) => (g.id === localGroup.id ? updated : g)),
          }));
          if (isFirebaseConfigured) {
            firestoreJoinGroup(localGroup.id, userId, savedIds).catch(console.warn);
            firestoreUpdateMemberProfile(localGroup.id, userId, profile).catch(console.warn);
          }
          return updated;
        }

        // 2. Search Firestore for the group by code
        if (!isFirebaseConfigured) return null;
        const firestoreGroup = await firestoreFindGroupByCode(code);
        if (!firestoreGroup) return null;

        const savedIds = (await import('./useRestaurantStore')).useRestaurantStore.getState().saved.map((r) => r.id);
        if (firestoreGroup.members.includes(userId)) {
          // Already a member — just add to local store, update profile
          const updated: Group = {
            ...firestoreGroup,
            memberProfiles: { ...firestoreGroup.memberProfiles, [userId]: profile },
          };
          set((state) => ({ groups: [...state.groups, updated] }));
          firestoreUpdateMemberProfile(firestoreGroup.id, userId, profile).catch(console.warn);
          return updated;
        }

        const joined: Group = {
          ...firestoreGroup,
          members: [...firestoreGroup.members, userId],
          swipes: { ...firestoreGroup.swipes, [userId]: savedIds },
          memberProfiles: { ...firestoreGroup.memberProfiles, [userId]: profile },
        };
        set((state) => ({ groups: [...state.groups, joined] }));
        firestoreJoinGroup(joined.id, userId, savedIds).catch(console.warn);
        firestoreUpdateMemberProfile(joined.id, userId, profile).catch(console.warn);
        return joined;
      },

      addSwipe: (groupId: string, restaurantId: string) => {
        const userId = getCurrentUserId();
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            const current = g.swipes[userId] ?? [];
            if (current.includes(restaurantId)) return g;
            return { ...g, swipes: { ...g.swipes, [userId]: [...current, restaurantId] } };
          }),
        }));
        if (isFirebaseConfigured) {
          debouncedFirestoreUpdateSwipes(groupId, userId, () => {
            const group = get().groups.find((g) => g.id === groupId);
            return group?.swipes[userId] ?? [];
          });
        }
      },

      removeSwipe: (groupId: string, restaurantId: string) => {
        const userId = getCurrentUserId();
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return {
              ...g,
              swipes: {
                ...g.swipes,
                [userId]: (g.swipes[userId] ?? []).filter((id) => id !== restaurantId),
              },
            };
          }),
        }));
        if (isFirebaseConfigured) {
          debouncedFirestoreUpdateSwipes(groupId, userId, () => {
            const group = get().groups.find((g) => g.id === groupId);
            return group?.swipes[userId] ?? [];
          });
        }
      },

      getGroupMatches: (groupId: string, allRestaurants: Restaurant[]) => {
        const group = get().groups.find((g) => g.id === groupId);
        if (!group) return [];
        return computeMatches(group, allRestaurants);
      },

      subscribeToGroup: (groupId: string) => {
        if (!db || !isFirebaseConfigured) return undefined;

        let unsubscribe: (() => void) | null = null;

        import('firebase/firestore').then(({ doc, onSnapshot }) => {
          unsubscribe = onSnapshot(doc(db!, 'groups', groupId), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data() as Group;
            const userId = getCurrentUserId();
            set((state) => ({
              groups: state.groups.map((g) => {
                if (g.id !== groupId) return g;
                // Always keep the current user's local swipes as source of truth.
                // Subscriptions sync other members' data only — local addSwipe/removeSwipe
                // handle our own swipes and write them to Firestore via debounce.
                const localUserSwipes = g.swipes[userId];
                const swipes = { ...data.swipes };
                if (localUserSwipes !== undefined) {
                  swipes[userId] = localUserSwipes;
                }
                return { ...g, ...data, swipes };
              }),
            }));
          });
        });

        // Return cleanup function
        return () => { unsubscribe?.(); };
      },

      loadGroups: async () => {
        const uid = useAuthStore.getState().user?.uid;
        if (!uid) return;
        try {
          // 1. Load local cache first for instant UI (optimistic)
          const localData = await AsyncStorage.getItem(`meshi-groups-${uid}`);
          if (localData) {
            const parsed = JSON.parse(localData) as Group[];
            if (parsed.length > 0) {
              set({ groups: parsed });
            }
          }
          // 2. Fetch latest from Firestore to reflect member joins/leaves,
          //    but preserve the current user's local swipes (may be ahead of Firestore).
          if (db) {
            const { collection, query, where, getDocs } = await import('firebase/firestore');
            const q = query(collection(db, 'groups'), where('members', 'array-contains', uid));
            const snap = await getDocs(q);
            const remoteGroups = snap.empty ? [] : snap.docs.map((d) => d.data() as Group);
            set((state) => {
              const localMap = new Map(state.groups.map((g) => [g.id, g]));
              const merged = remoteGroups.map((rg) => {
                const local = localMap.get(rg.id);
                if (local?.swipes[uid] && local.swipes[uid].length > (rg.swipes[uid]?.length ?? 0)) {
                  return { ...rg, swipes: { ...rg.swipes, [uid]: local.swipes[uid] } };
                }
                return rg;
              });
              return { groups: merged };
            });
            // Cache the merged result
            const latestGroups = get().groups;
            await AsyncStorage.setItem(`meshi-groups-${uid}`, JSON.stringify(latestGroups));
          }
        } catch (e) {
          console.warn('Failed to load groups:', e);
        }
      },

      logout: () => {
        // Save groups to user-specific AsyncStorage before clearing
        const uid = useAuthStore.getState().user?.uid;
        const { groups } = get();
        if (uid && groups.length > 0) {
          AsyncStorage.setItem(`meshi-groups-${uid}`, JSON.stringify(groups)).catch(console.warn);
        }
        set({ groups: [] });
      },
    }),
    {
      name: 'meshi-groups',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist groups; currentUserId is always user_demo
      partialize: (state) => ({
        groups: state.groups,
      }),
    }
  )
);

// Update current user's profile in all groups they belong to (call after name/photo change)
export function updateMemberProfileInGroups(profile: { name: string; photoUri?: string }): void {
  const userId = getCurrentUserId();
  const { groups } = useGroupStore.getState();
  const userGroups = groups.filter((g) => g.members.includes(userId));

  if (userGroups.length === 0) return;

  // Update local state
  useGroupStore.setState((state) => ({
    groups: state.groups.map((g) => {
      if (!g.members.includes(userId)) return g;
      return {
        ...g,
        memberProfiles: { ...g.memberProfiles, [userId]: profile },
      };
    }),
  }));

  // Update Firestore
  if (isFirebaseConfigured) {
    userGroups.forEach((g) => {
      firestoreUpdateMemberProfile(g.id, userId, profile).catch(console.warn);
    });
  }
}

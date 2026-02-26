import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, LogBox } from 'react-native';

// Suppress noisy Firebase internal warnings that don't affect functionality
LogBox.ignoreLogs([
  'Using maximum backoff delay',
  'Write stream exhausted',
  '@firebase/firestore',
  'SafeAreaView has been deprecated',
]);
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, auth, isFirebaseConfigured } from '../src/services/auth';
import { useAuthStore } from '../src/store/useAuthStore';
import { useRestaurantStore } from '../src/store/useRestaurantStore';
import { useGroupStore } from '../src/store/useGroupStore';
import { useUserStore } from '../src/store/useUserStore';
import { getUserProfile, saveUserProfile } from '../src/services/auth';
import { COLORS } from '../src/constants/mockData';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isInitialized, setUser, setInitialized } = useAuthStore();
  const setDisplayName = useUserStore((s) => s.setDisplayName);
  const setPhotoUri = useUserStore((s) => s.setPhotoUri);
  const setDarkMode = useUserStore((s) => s.setDarkMode);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Firebase not configured (development only) — no user, redirect to login.
      setInitialized();
      return;
    }

    // Firebase mode — onAuthStateChanged is the source of truth
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setInitialized();
    });

    return unsub;
  }, []);

  // Route once auth state is known
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Access stores directly to avoid hook timing issues with persist middleware
      useRestaurantStore.getState().loadSaved();
      useGroupStore.getState().loadGroups();
      useRestaurantStore.getState().fetchRestaurants();
      // Load user profile: try per-user AsyncStorage first, then Firestore
      AsyncStorage.getItem(`meshi-profile-${user.uid}`).then((local) => {
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.displayName) setDisplayName(parsed.displayName);
          if (parsed.photoUri) setPhotoUri(parsed.photoUri);
        }
      }).catch(console.warn);
      getUserProfile(user.uid).then(async (profile) => {
        let resolvedName: string;
        let resolvedPhoto: string | undefined;
        if (profile?.name) {
          resolvedName = profile.name;
        } else {
          // Backfill: create Firestore profile for accounts that don't have one
          resolvedName = user.displayName || user.email?.split('@')[0] || 'User';
          await saveUserProfile(user.uid, {
            name: resolvedName,
            email: user.email ?? '',
          });
        }
        setDisplayName(resolvedName);
        if (profile?.photoUri) { setPhotoUri(profile.photoUri); resolvedPhoto = profile.photoUri; }
        else if (user.photoURL) { setPhotoUri(user.photoURL); resolvedPhoto = user.photoURL; }
        // Restore per-user dark mode preference
        if (profile?.darkMode !== undefined) setDarkMode(profile.darkMode);
        // Cache profile locally so it persists across logout/login even if Firestore is slow
        AsyncStorage.setItem(`meshi-profile-${user.uid}`, JSON.stringify({
          displayName: resolvedName,
          photoUri: resolvedPhoto || undefined,
        })).catch(console.warn);
      }).catch(console.warn);
      router.replace('/(tabs)');
    } else if (user && !inAuthGroup) {
      const { restaurants, fetchRestaurants } = useRestaurantStore.getState();
      if (restaurants.length === 0) fetchRestaurants();
    }
  }, [isInitialized, user, segments]);

  return null;
}

export default function RootLayout() {
  const darkMode = useUserStore((s) => s.darkMode);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <AuthGate />
      {!isInitialized ? (
        // Show spinner while Firebase checks auth state
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFAF5' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="group/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      )}
    </GestureHandlerRootView>
  );
}

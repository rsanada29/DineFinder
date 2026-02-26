import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from './firebase';
import { useUserStore } from '../store/useUserStore';
import { useGroupStore } from '../store/useGroupStore';

// User profile

export async function saveUserProfile(uid: string, data: { name: string; email: string }): Promise<void> {
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', uid), { ...data, createdAt: Date.now() }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<{ name: string; photoUri?: string; darkMode?: boolean } | null> {
  if (!db) return null;
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as { name: string; photoUri?: string; darkMode?: boolean };
}

export async function updateUserProfile(uid: string, data: Partial<{ name: string; photoUri: string; darkMode: boolean }>): Promise<void> {
  if (!db) return;
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'users', uid), data);
}

// Saved restaurants (synced per-user via Firestore)

export async function saveUserSavedRestaurants(
  uid: string,
  saved: import('../types').Restaurant[]
): Promise<void> {
  if (!db) return;
  const { doc, setDoc } = await import('firebase/firestore');
  // Strip undefined values before writing — Firestore rejects them
  const clean = JSON.parse(JSON.stringify(saved));
  await setDoc(doc(db, 'users', uid, 'data', 'saved'), { restaurants: clean }, { merge: false });
}

export async function loadUserSavedRestaurants(
  uid: string
): Promise<import('../types').Restaurant[]> {
  if (!db) return [];
  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'users', uid, 'data', 'saved'));
  if (!snap.exists()) return [];
  return (snap.data().restaurants ?? []) as import('../types').Restaurant[];
}

// Email + password auth

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured. Please add your Firebase credentials to .env');
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await saveUserProfile(credential.user.uid, { name: name.trim() || email.split('@')[0], email: email.trim() });
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured. Please add your Firebase credentials to .env');
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);

  // Backfill profile for older accounts that don't have one yet
  const profile = await getUserProfile(credential.user.uid);
  if (!profile) {
    await saveUserProfile(credential.user.uid, {
      name: credential.user.displayName || email.split('@')[0],
      email: email.trim(),
    });
  }
  return credential.user;
}

export async function resetPassword(email: string): Promise<void> {
  if (!auth) throw new Error('Firebase is not configured.');
  await sendPasswordResetEmail(auth, email.trim());
}

// Google sign-in

export async function signInWithGoogleCredential(idToken: string): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured.');
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  const name = result.user.displayName ?? result.user.email?.split('@')[0] ?? 'User';
  const photoUri = result.user.photoURL ?? '';

  const profile = await getUserProfile(result.user.uid);
  if (!profile) {
    await saveUserProfile(result.user.uid, {
      name,
      email: result.user.email ?? '',
    });
    if (photoUri) await updateUserProfile(result.user.uid, { photoUri });
  } else {
    // Only set Google photo if user has no photo yet — don't overwrite custom photos
    if (photoUri && !profile.photoUri) {
      await updateUserProfile(result.user.uid, { photoUri });
    }
  }
  return result.user;
}

// Apple sign-in

export async function signInWithApple(): Promise<User> {
  if (!auth) throw new Error('Firebase is not configured.');

  const AppleAuthentication = await import('expo-apple-authentication');
  const Crypto = await import('expo-crypto');

  const nonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonce
  );

  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!appleCredential.identityToken) {
    throw new Error('Apple Sign-In failed — no identity token received.');
  }

  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({
    idToken: appleCredential.identityToken,
    rawNonce: nonce,
  });
  const result = await signInWithCredential(auth, credential);

  // Apple only gives the name on the very first sign-in
  const profile = await getUserProfile(result.user.uid);
  if (!profile) {
    const fullName = appleCredential.fullName;
    const name = fullName
      ? [fullName.givenName, fullName.familyName].filter(Boolean).join(' ')
      : null;
    await saveUserProfile(result.user.uid, {
      name: name || result.user.email?.split('@')[0] || 'User',
      email: result.user.email ?? '',
    });
  }

  return result.user;
}

// Delete account

export async function deleteAccount(): Promise<void> {
  if (!auth?.currentUser) throw new Error('Not signed in.');
  const uid = auth.currentUser.uid;

  // Leave all groups first so Firestore docs get cleaned up
  const groupState = useGroupStore.getState();
  const userGroups = groupState.groups.filter((g) => g.members.includes(uid));
  for (const group of userGroups) {
    groupState.leaveGroup(group.id);
  }

  // Remove Firestore data
  if (db) {
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', uid, 'data', 'saved')).catch(console.warn);
    await deleteDoc(doc(db, 'users', uid)).catch(console.warn);
  }

  // Clear local state
  useUserStore.getState().reset();

  // Clear per-user AsyncStorage keys
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.multiRemove([
    `meshi-saved-${uid}`,
    `meshi-groups-${uid}`,
    `meshi-profile-${uid}`,
  ]).catch(console.warn);

  // Delete the auth account last since it invalidates the user object
  const { deleteUser } = await import('firebase/auth');
  await deleteUser(auth.currentUser!);
}

// Sign out

export async function signOut(): Promise<void> {
  if (auth) {
    // Persist dark mode pref before we lose the uid
    const uid = auth.currentUser?.uid;
    const { darkMode } = useUserStore.getState();
    if (uid) {
      await updateUserProfile(uid, { darkMode }).catch(console.warn);
    }
    useGroupStore.getState().logout();
    await firebaseSignOut(auth);
    useUserStore.getState().reset();
  }
}

// Re-exports for convenience
export { onAuthStateChanged, auth, isFirebaseConfigured };

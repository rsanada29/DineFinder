import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as ImagePicker from 'expo-image-picker';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signUpWithEmail, signInWithGoogleCredential, signInWithApple, updateUserProfile, isFirebaseConfigured } from '../../src/services/auth';
import { useUserStore } from '../../src/store/useUserStore';
import { COLORS } from '../../src/constants/mockData';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CONFIGURED = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
);

// Google sign-in (needs its own component because of the hook)
function GoogleSignInButton({ onError }: { onError: (msg: string) => void }) {
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) handleGoogleToken(id_token);
    } else if (response?.type === 'error') {
      onError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }, [response, onError]);

  async function handleGoogleToken(idToken: string) {
    setGoogleLoading(true);
    try {
      await signInWithGoogleCredential(idToken);
    } catch (e: any) {
      onError(e?.message ?? 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.googleBtn, (googleLoading || !request) && styles.disabledBtn]}
      onPress={() => { setGoogleLoading(true); promptAsync(); }}
      disabled={googleLoading || !request}
      activeOpacity={0.85}
    >
      {googleLoading ? (
        <ActivityIndicator color="#444" />
      ) : (
        <>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// Apple sign-in
function AppleSignInButton({ onError }: { onError: (msg: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAvailable);
  }, []);

  if (!available) return null;

  async function handleApple() {
    setLoading(true);
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        onError(e?.message ?? 'Apple sign-in failed.');
      }
      setLoading(false);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.appleBtn, loading && styles.disabledBtn]}
      onPress={handleApple}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Text style={styles.appleIcon}></Text>
          <Text style={styles.appleBtnText}>Continue with Apple</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// Email/password register form
function FirebaseRegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const setStoreDisplayName = useUserStore((s) => s.setDisplayName);
  const setStorePhotoUri = useUserStore((s) => s.setPhotoUri);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleRegister() {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must contain both letters and numbers.'); return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    try {
      const user = await signUpWithEmail(email, password, name);
      // Save display name and photo to local store
      if (name.trim()) setStoreDisplayName(name.trim());
      if (photoUri) {
        setStorePhotoUri(photoUri);
        updateUserProfile(user.uid, { photoUri }).catch(console.warn);
      }
    } catch (e: any) {
      setError(parseError(e));
      setLoading(false);
    }
  }

  function parseError(e: any): string {
    const code = e?.code ?? '';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
    if (code === 'auth/invalid-email') return 'Invalid email address.';
    if (code === 'auth/weak-password') return 'Password must be at least 8 characters with letters and numbers.';
    return e?.message ?? 'Something went wrong. Please try again.';
  }

  return (
    <>
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Optional profile photo */}
      <TouchableOpacity onPress={pickPhoto} style={styles.photoPicker} activeOpacity={0.8}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderEmoji}>📷</Text>
          </View>
        )}
        <Text style={styles.photoHint}>{photoUri ? 'Tap to change photo' : 'Add profile photo (optional)'}</Text>
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>User Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Alex"
          placeholderTextColor="#bbb"
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor="#bbb"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password * (min 8 chars, letters + numbers)</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#bbb"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            returnKeyType="next"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          placeholderTextColor="#bbb"
          secureTextEntry={!showPassword}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.disabledBtn]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
      </TouchableOpacity>

      {/* Social sign-in buttons */}
      {(GOOGLE_CONFIGURED || true) && (
        <>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          {GOOGLE_CONFIGURED && <GoogleSignInButton onError={setError} />}
          <AppleSignInButton onError={setError} />
        </>
      )}
    </>
  );
}

// Main screen
export default function RegisterScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.logoSection}>
            <Image source={require('../../assets/icon.png')} style={styles.logoIcon} />
            <Text style={styles.appName}>DineFinder</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create your account</Text>

            {isFirebaseConfigured ? (
              <FirebaseRegisterForm />
            ) : (
              <View style={styles.devWarning}>
                <Text style={styles.devWarningTitle}>⚠️ Firebase not configured</Text>
                <Text style={styles.devWarningText}>
                  Add your Firebase credentials to .env to enable sign-up.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.switchLink}>Log In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsNote}>
            By creating an account you agree to our Terms of Service and Privacy Policy.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  content: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 20, gap: 20 },
  logoSection: { alignItems: 'center', gap: 6, paddingTop: 10 },
  logoIcon: { width: 64, height: 64, borderRadius: 14 },
  appName: { fontSize: 26, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f5f0eb',
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#2D2D2D', marginBottom: 4 },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  errorText: { color: '#CC0000', fontSize: 13 },
  devWarning: {
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE082',
    gap: 6,
  },
  devWarningTitle: { fontSize: 14, fontWeight: '700', color: '#795548' },
  devWarningText: { fontSize: 13, color: '#795548', lineHeight: 20 },
  inputGroup: { gap: 5 },
  label: { fontSize: 12, fontWeight: '600', color: '#666' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#2D2D2D',
    backgroundColor: '#FAFAFA',
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeIcon: { fontSize: 18 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 4,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#eee' },
  dividerText: { fontSize: 13, color: '#aaa', fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingVertical: 15,
    gap: 10,
    backgroundColor: 'white',
  },
  googleIcon: { fontSize: 16, fontWeight: '900', color: '#4285F4', width: 22, textAlign: 'center' },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: '#333' },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 15,
    gap: 10,
    backgroundColor: '#000',
  },
  appleIcon: { fontSize: 18, color: 'white' },
  appleBtnText: { fontSize: 15, fontWeight: '700', color: 'white' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 14, color: '#888' },
  switchLink: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  termsNote: { fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 16 },
  photoPicker: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F0EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E0DB',
    borderStyle: 'dashed',
  },
  photoPlaceholderEmoji: {
    fontSize: 28,
  },
  photoHint: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
});

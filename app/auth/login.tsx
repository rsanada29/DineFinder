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
  Alert,
  Keyboard,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithEmail, signInWithGoogleCredential, signInWithApple, resetPassword, isFirebaseConfigured } from '../../src/services/auth';
import { COLORS } from '../../src/constants/mockData';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CONFIGURED = Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

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
  }, [response]);

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

// Email/password login
function FirebaseLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
    } catch (e: any) {
      setError(parseError(e));
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError('Enter your email first, then tap Forgot Password.');
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert('Email sent', `Password reset instructions sent to ${email}`);
    } catch (e: any) {
      setError(parseError(e));
    }
  }

  function parseError(e: any): string {
    const code = e?.code ?? '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Incorrect email or password.';
    if (code === 'auth/user-not-found') return 'No account found with this email.';
    if (code === 'auth/invalid-email') return 'Invalid email address.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please try again later.';
    return e?.message ?? 'Something went wrong. Please try again.';
  }

  return (
    <>
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
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
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#bbb"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput]}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.disabledBtn]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryBtnText}>Log In</Text>}
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
export default function LoginScreen() {
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
            <Text style={styles.tagline}>Your next favourite meal awaits</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>

            {isFirebaseConfigured ? (
              <FirebaseLoginForm />
            ) : (
              <View style={styles.devWarning}>
                <Text style={styles.devWarningTitle}>⚠️ Firebase not configured</Text>
                <Text style={styles.devWarningText}>
                  Add your Firebase credentials to .env to enable authentication.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.switchLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#FFFAF5' },
  content: { paddingHorizontal: 28, paddingBottom: 40, paddingTop: 20, gap: 24 },
  logoSection: { alignItems: 'center', gap: 6, paddingTop: 20 },
  logoIcon: { width: 72, height: 72, borderRadius: 16 },
  appName: { fontSize: 28, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#888' },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    gap: 16,
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
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#555' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2D2D2D',
    backgroundColor: '#FAFAFA',
  },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeIcon: { fontSize: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
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
});

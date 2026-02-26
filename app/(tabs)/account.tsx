import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useUserStore } from '../../src/store/useUserStore';
import { useRestaurantStore } from '../../src/store/useRestaurantStore';
import { useGroupStore } from '../../src/store/useGroupStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { signOut, updateUserProfile, deleteAccount } from '../../src/services/auth';
import { updateMemberProfileInGroups } from '../../src/store/useGroupStore';
import { COLORS } from '../../src/constants/mockData';
import { useTheme } from '../../src/constants/theme';
import LegalModal from '../../src/components/LegalModal';

function Row({
  icon,
  label,
  right,
  onPress,
  theme,
}: {
  icon: string;
  label: string;
  right: React.ReactNode;
  onPress?: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  const rowStyle = [styles.row, { borderBottomColor: theme.divider }];
  if (onPress) {
    return (
      <TouchableOpacity style={rowStyle} onPress={onPress} activeOpacity={0.6}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowIcon}>{icon}</Text>
          <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        </View>
        {right}
      </TouchableOpacity>
    );
  }
  return (
    <View style={rowStyle}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      </View>
      {right}
    </View>
  );
}

export default function AccountScreen() {
  const theme = useTheme();
  const {
    displayName,
    photoUri,
    notifications,
    locationEnabled,
    darkMode,
    setDisplayName,
    setPhotoUri,
    setNotifications,
    setLocationEnabled,
    setDarkMode,
    reset: resetUserPrefs,
  } = useUserStore();

  const authUser = useAuthStore((s) => s.user);
  const restaurantLogout = useRestaurantStore((s) => s.logout);
  const groupLogout = useGroupStore((s) => s.logout);

  const [contactVisible, setContactVisible] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);

  const pickPhoto = async () => {
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
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      // Save to Firestore so it persists across logout/login
      if (authUser?.uid) {
        updateUserProfile(authUser.uid, { photoUri: uri }).catch(console.warn);
        // Cache locally
        AsyncStorage.setItem(`meshi-profile-${authUser.uid}`, JSON.stringify({
          displayName: displayName || 'User',
          photoUri: uri,
        })).catch(console.warn);
        // Update photo in all groups
        updateMemberProfileInGroups({ name: displayName || 'User', photoUri: uri });
      }
    }
  };

  const handleContactSubmit = async () => {
    if (!contactEmail.trim() || !contactMessage.trim()) {
      Alert.alert('Required Fields', 'Please fill in your email and message.');
      return;
    }
    const subject = encodeURIComponent(contactSubject.trim() || 'DineFinder Enquiry');
    const body = encodeURIComponent(
      `Name: ${displayName}\nEmail: ${contactEmail.trim()}\n\n${contactMessage.trim()}`
    );
    const url = `mailto:ryoma.s0729@gmail.com?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(url);
      setContactVisible(false);
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
    } catch {
      Alert.alert(
        'No Mail App',
        'Could not open a mail app. Please send your message to ryoma.s0729@gmail.com directly.',
      );
    }
  };

  const handleRateApp = async () => {
    const url = Platform.OS === 'ios'
      ? 'itms-apps://itunes.apple.com/app/id'
      : 'market://details?id=com.meshimatch.app';
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        '⭐ Rate DineFinder',
        'Thank you for using DineFinder! The app will be available on the App Store soon — we\'d love your review when it\'s live.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              restaurantLogout();
              await deleteAccount();
              // auth listener in _layout.tsx will redirect to /auth/login
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Unknown error';
              // Firebase requires recent login for account deletion
              if (msg.includes('requires-recent-login')) {
                Alert.alert(
                  'Re-authentication Required',
                  'For security, please log out and log back in, then try deleting your account again.',
                );
              } else {
                Alert.alert('Error', `Failed to delete account: ${msg}`);
              }
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          // Save profile + preferences to Firestore before clearing
          if (authUser?.uid) {
            await updateUserProfile(authUser.uid, { darkMode }).catch(console.warn);
            const profileData = JSON.stringify({ displayName, photoUri });
            await AsyncStorage.setItem(`meshi-profile-${authUser.uid}`, profileData).catch(console.warn);
          }
          restaurantLogout();
          groupLogout();
          setDisplayName('');
          setPhotoUri('');
          await signOut();
          // signOut() calls reset() → clears darkMode etc.
          // auth listener in _layout.tsx will redirect to /auth/login
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Account</Text>

        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          {/* Avatar */}
          <TouchableOpacity onPress={pickPhoto} style={styles.avatarContainer} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🍙</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              onBlur={() => {
                if (authUser?.uid && displayName.trim()) {
                  updateUserProfile(authUser.uid, { name: displayName.trim() }).catch(console.warn);
                  // Cache locally so it survives logout/login
                  AsyncStorage.setItem(`meshi-profile-${authUser.uid}`, JSON.stringify({
                    displayName: displayName.trim(),
                    photoUri: photoUri || undefined,
                  })).catch(console.warn);
                  // Update name in all groups
                  const groupProfile: { name: string; photoUri?: string } = { name: displayName.trim() };
                  if (photoUri) groupProfile.photoUri = photoUri;
                  updateMemberProfileInGroups(groupProfile);
                }
              }}
              style={[styles.nameInput, { color: theme.text }]}
              placeholder="Enter your name"
              placeholderTextColor={theme.subtext}
            />
            {authUser?.email ? (
              <Text style={[styles.emailText, { color: theme.subtext }]}>{authUser.email}</Text>
            ) : (
              <Text style={[styles.editHint, { color: theme.subtext }]}>Tap photo to change</Text>
            )}
          </View>
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Row
            icon="🔔"
            label="Notifications"
            theme={theme}
            onPress={() => setNotifications(!notifications)}
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="white"
              />
            }
          />
          <Row
            icon="📍"
            label="Location"
            theme={theme}
            onPress={() => setLocationEnabled(!locationEnabled)}
            right={
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="white"
              />
            }
          />
          <Row
            icon="🌙"
            label="Dark Mode"
            theme={theme}
            onPress={() => {
              const newValue = !darkMode;
              setDarkMode(newValue);
              if (authUser?.uid) updateUserProfile(authUser.uid, { darkMode: newValue }).catch(console.warn);
            }}
            right={
              <Switch
                value={darkMode}
                onValueChange={(v) => {
                  setDarkMode(v);
                  if (authUser?.uid) updateUserProfile(authUser.uid, { darkMode: v }).catch(console.warn);
                }}
                trackColor={{ false: '#ddd', true: COLORS.primary }}
                thumbColor="white"
              />
            }
          />
        </View>

        {/* Info links */}
        <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Row
            icon="📋"
            label="Terms of Service"
            theme={theme}
            onPress={() => setLegalType('terms')}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <Row
            icon="🔒"
            label="Privacy Policy"
            theme={theme}
            onPress={() => setLegalType('privacy')}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <Row
            icon="💬"
            label="Contact Us"
            theme={theme}
            onPress={() => setContactVisible(true)}
            right={<Text style={styles.chevron}>›</Text>}
          />
          <Row
            icon="⭐"
            label="Rate App"
            theme={theme}
            onPress={handleRateApp}
            right={<Text style={styles.chevron}>›</Text>}
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.subtext }]}>DineFinder v1.0.0</Text>
      </ScrollView>

      {/* Contact Us Modal */}
      <Modal
        visible={contactVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setContactVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
            <TouchableOpacity onPress={() => setContactVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Contact Us</Text>
            <TouchableOpacity onPress={handleContactSubmit}>
              <Text style={styles.modalSend}>Send</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Your Name</Text>
            <View style={[styles.fieldBox, { backgroundColor: theme.card, borderColor: theme.inputBorder }]}>
              <Text style={[styles.fieldValue, { color: theme.text }]}>{displayName}</Text>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Email *</Text>
            <TextInput
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="your@email.com"
              placeholderTextColor={theme.subtext}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.fieldInput, { backgroundColor: theme.card, borderColor: theme.inputBorder, color: theme.text }]}
            />

            <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Subject</Text>
            <TextInput
              value={contactSubject}
              onChangeText={setContactSubject}
              placeholder="e.g. Bug report, Feature request..."
              placeholderTextColor={theme.subtext}
              style={[styles.fieldInput, { backgroundColor: theme.card, borderColor: theme.inputBorder, color: theme.text }]}
            />

            <Text style={[styles.fieldLabel, { color: theme.subtext }]}>Message *</Text>
            <TextInput
              value={contactMessage}
              onChangeText={setContactMessage}
              placeholder="Tell us what's on your mind..."
              placeholderTextColor={theme.subtext}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={[styles.fieldInput, styles.fieldTextarea, { backgroundColor: theme.card, borderColor: theme.inputBorder, color: theme.text }]}
            />

            <TouchableOpacity style={styles.sendBtn} onPress={handleContactSubmit}>
              <Text style={styles.sendBtnText}>✉️  Send Message</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Legal Modals */}
      {legalType && (
        <LegalModal
          visible={true}
          onClose={() => setLegalType(null)}
          type={legalType}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarEmoji: { fontSize: 30 },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cameraIcon: { fontSize: 13 },
  profileInfo: { flex: 1 },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    padding: 0,
  },
  emailText: {
    fontSize: 12,
    marginTop: 3,
  },
  editHint: {
    fontSize: 12,
    marginTop: 2,
  },
  settingsCard: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: { fontSize: 20 },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.skip,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.skip,
  },
  deleteBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textDecorationLine: 'underline',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSend: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  fieldBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldValue: {
    fontSize: 14,
  },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  fieldTextarea: {
    height: 120,
    paddingTop: 12,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});

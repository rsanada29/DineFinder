import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../constants/mockData';
import { useUserStore } from '../store/useUserStore';

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export default function OnboardingModal({ visible, onComplete }: Props) {
  const { setDisplayName, setPhotoUri } = useUserStore();
  const [name, setLocalName] = useState('');
  const [photoUri, setLocalPhotoUri] = useState<string | null>(null);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalPhotoUri(result.assets[0].uri);
    }
  };

  const handleStart = () => {
    const trimmed = name.trim();
    if (trimmed) setDisplayName(trimmed);
    if (photoUri) setPhotoUri(photoUri);
    onComplete();
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image source={require('../../assets/icon.png')} style={styles.logoIcon} />
            <Text style={styles.appName}>DineFinder</Text>
            <Text style={styles.tagline}>Discover your next favourite meal</Text>
          </View>

          {/* Profile setup */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Set up your profile</Text>

            {/* Avatar picker */}
            <TouchableOpacity onPress={pickPhoto} style={styles.avatarBtn} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarEmoji}>🍙</Text>
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Text style={styles.cameraIcon}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to add a photo</Text>

            {/* Name input */}
            <TextInput
              value={name}
              onChangeText={setLocalName}
              placeholder="Your name (optional)"
              placeholderTextColor="#aaa"
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleStart}
              autoFocus
            />
          </View>

          {/* Features preview */}
          <View style={styles.features}>
            {[
              { icon: '🔍', text: 'Discover restaurants near you' },
              { icon: '❤️', text: 'Save your favourites' },
              { icon: '👥', text: 'Match with friends as a group' },
            ].map(({ icon, text }) => (
              <View key={text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{icon}</Text>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Text style={styles.startText}>Get Started 🚀</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF5',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 24,
  },
  logoSection: {
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f5f0eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    alignSelf: 'flex-start',
  },
  avatarBtn: {
    position: 'relative',
    marginTop: 4,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraIcon: { fontSize: 14 },
  avatarHint: {
    fontSize: 12,
    color: '#aaa',
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2D2D2D',
  },
  features: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  startBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  startText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

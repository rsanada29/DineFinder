import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  visible: boolean;
  photoUri: string;
  attribution?: string;
  onClose: () => void;
}

export default function PhotoViewerModal({ visible, photoUri, attribution, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.container}>
          <Image source={{ uri: photoUri }} style={styles.image} />
          {!!attribution && (
            <Text style={styles.attribution}>📷 {attribution}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    gap: 8,
  },
  image: {
    width: SCREEN_W - 32,
    height: (SCREEN_W - 32) * 0.75,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  attribution: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

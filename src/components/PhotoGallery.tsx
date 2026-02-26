import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

interface Props {
  photos: string[];
  attributions?: string[];
  isActive: boolean;
}

export default function PhotoGallery({ photos, attributions, isActive }: Props) {
  const [idx, setIdx] = useState(0);
  const count = photos.length;
  const current = photos[idx] ?? photos[0];
  const currentAttribution = attributions?.[idx];

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(count - 1, i + 1));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image source={{ uri: current }} style={styles.image} />

      {!!currentAttribution && (
        <View style={styles.attribution}>
          <Text style={styles.attributionText} numberOfLines={1}>
            📷 {currentAttribution}
          </Text>
        </View>
      )}

      {count > 1 && isActive && (
        <>
          {/* Dot indicators */}
          <View style={styles.dots}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === idx ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>

          {/* Tap zones */}
          <Pressable onPress={prev} style={styles.leftZone} />
          <Pressable onPress={next} style={styles.rightZone} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  attribution: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: '60%',
    zIndex: 6,
  },
  attributionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 9,
  },
  dots: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    zIndex: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: 'white',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  leftZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '30%',
    height: '60%',
    zIndex: 7,
  },
  rightZone: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '30%',
    height: '60%',
    zIndex: 7,
  },
});

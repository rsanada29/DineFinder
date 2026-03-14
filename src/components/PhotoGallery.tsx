import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';

const TAP_THROTTLE_MS = 200;

interface Props {
  photos: string[];
  attributions?: string[];
  isActive: boolean;
}

export default function PhotoGallery({ photos, attributions, isActive }: Props) {
  const [idx, setIdx] = useState(0);
  const lastTapRef = useRef(0);
  const count = photos.length;
  const current = photos[idx] ?? photos[0];
  const currentAttribution = attributions?.[idx];

  const throttledSetIdx = (updater: (i: number) => number) => {
    const now = Date.now();
    if (now - lastTapRef.current < TAP_THROTTLE_MS) return;
    lastTapRef.current = now;
    setIdx(updater);
  };

  const prev = () => throttledSetIdx((i) => Math.max(0, i - 1));
  const next = () => throttledSetIdx((i) => Math.min(count - 1, i + 1));

  // Reset index when photos change (new restaurant card)
  useEffect(() => { setIdx(0); }, [photos]);

  // Preload adjacent images
  useEffect(() => {
    if (count <= 1) return;
    if (idx > 0) Image.prefetch(photos[idx - 1]);
    if (idx < count - 1) Image.prefetch(photos[idx + 1]);
  }, [idx, photos, count]);

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

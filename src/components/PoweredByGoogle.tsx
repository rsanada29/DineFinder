import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  style?: object;
}

export default function PoweredByGoogle({ style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>
        Powered by <Text style={styles.g}>G</Text>
        <Text style={styles.o1}>o</Text>
        <Text style={styles.o2}>o</Text>
        <Text style={styles.g}>g</Text>
        <Text style={styles.l}>l</Text>
        <Text style={styles.e}>e</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    color: '#999',
  },
  g: { color: '#4285F4' },
  o1: { color: '#EA4335' },
  o2: { color: '#FBBC05' },
  l: { color: '#4285F4' },
  e: { color: '#EA4335' },
});

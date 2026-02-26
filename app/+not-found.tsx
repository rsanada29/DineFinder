import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.title}>This page doesn't exist</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFAF5',
    gap: 16,
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  link: {
    marginTop: 8,
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useRestaurantStore } from '../../src/store/useRestaurantStore';
import { useTheme } from '../../src/constants/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabLayout() {
  const savedCount = useRestaurantStore((s) => s.saved.length);
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: theme.background, borderTopColor: theme.divider }],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🍽️" label="Discover" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👥" label="Groups" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }) => (
            <View>
              <TabIcon emoji="❤️" label="Saved" focused={focused} />
              {savedCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{savedCount > 99 ? '99+' : savedCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 0,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
    paddingTop: 6,
    minWidth: 60,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
  },
  labelActive: {
    color: '#FF6B35',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF6B35',
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
});

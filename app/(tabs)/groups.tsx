import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroupStore } from '../../src/store/useGroupStore';
import { useRestaurantStore } from '../../src/store/useRestaurantStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useUserStore } from '../../src/store/useUserStore';
import { getUserProfile } from '../../src/services/auth';
import { COLORS } from '../../src/constants/mockData';
import { useTheme } from '../../src/constants/theme';
import type { Group } from '../../src/types';

interface MemberProfile {
  name: string;
  photoUri?: string;
}

interface GroupCardProps {
  group: Group;
  matches: number;
  memberProfiles: Record<string, MemberProfile>;
  currentUserId: string;
  myName: string;
  myPhoto: string;
  onPress: () => void;
  onDelete: () => void;
}

function GroupCard({ group, matches, memberProfiles, currentUserId, myName, myPhoto, onPress, onDelete }: GroupCardProps) {
  const theme = useTheme();

  function getPhoto(uid: string): string | undefined {
    if (uid === currentUserId) return myPhoto || undefined;
    return group.memberProfiles?.[uid]?.photoUri || memberProfiles[uid]?.photoUri;
  }
  function getName(uid: string): string {
    if (uid === currentUserId) return myName || 'You';
    return group.memberProfiles?.[uid]?.name || memberProfiles[uid]?.name || 'Member';
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: matches > 0 ? COLORS.primary : theme.cardBorder },
        matches > 0 && styles.cardMatchBorder,
      ]}
    >
      {/* Tappable card body for navigation */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.cardBody}>
        {matches > 0 && (
          <View style={styles.matchBadge}>
            <Text style={styles.matchBadgeText}>{matches} matches!</Text>
          </View>
        )}
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{group.name}</Text>
        </View>
        <View style={styles.membersRow}>
          {group.members.slice(0, 5).map((uid, i) => {
            const photo = getPhoto(uid);
            const name = getName(uid);
            return photo ? (
              <Image key={uid} source={{ uri: photo }} style={[styles.avatarImage, { marginLeft: i > 0 ? -6 : 0 }]} />
            ) : (
              <View key={uid} style={[styles.avatarFallback, { marginLeft: i > 0 ? -6 : 0 }]}>
                <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            );
          })}
          <Text style={[styles.memberCount, { color: theme.subtext }]}>{group.members.length} members</Text>
        </View>
        <View style={styles.codeRow}>
          <Text style={[styles.code, { backgroundColor: theme.codeBg, color: theme.subtext }]}>{group.code}</Text>
        </View>
      </TouchableOpacity>

      {/* Delete button — outside the navigation touchable to avoid nesting */}
      <TouchableOpacity
        onPress={onDelete}
        style={styles.deleteBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function GroupsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { groups, createGroup, joinGroup, leaveGroup, deleteGroup, getGroupMatches } = useGroupStore();
  const currentUserId = useAuthStore((s) => s.user?.uid) ?? '';
  const myDisplayName = useUserStore((s) => s.displayName);
  const myPhotoUri = useUserStore((s) => s.photoUri);
  const restaurants = useRestaurantStore((s) => s.restaurants);
  const saved = useRestaurantStore((s) => s.saved);
  // Combine restaurants + saved for match lookup (saved may include restaurants not in current search)
  const allRestaurants = useMemo(() => {
    const map = new Map(restaurants.map((r) => [r.id, r]));
    saved.forEach((r) => { if (!map.has(r.id)) map.set(r.id, r); });
    return [...map.values()];
  }, [restaurants, saved]);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({});

  // Subscribe to real-time Firestore updates for all groups
  useEffect(() => {
    const unsubs = groups.map((g) => useGroupStore.getState().subscribeToGroup(g.id));
    return () => { unsubs.forEach((unsub) => unsub?.()); };
  }, [groups.map((g) => g.id).join(',')]);

  // Fetch profiles for all group members (fallback for groups without memberProfiles)
  const allMemberIds = useMemo(
    () => [...new Set(groups.flatMap((g) => g.members))],
    [groups]
  );

  useEffect(() => {
    allMemberIds.forEach((uid) => {
      if (uid === currentUserId) return;
      if (memberProfiles[uid]) return;
      // Only skip if a group profile already has a photo for this member
      if (groups.some((g) => g.memberProfiles?.[uid]?.photoUri)) return;
      getUserProfile(uid).then((profile) => {
        if (profile) {
          setMemberProfiles((prev) => ({ ...prev, [uid]: profile }));
        }
      }).catch(console.warn);
    });
  }, [allMemberIds.join(',')]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createGroup(newName.trim());
    setNewName('');
    setCreating(false);
  };

  const [joinLoading, setJoinLoading] = useState(false);

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    setJoinLoading(true);
    try {
      const result = await joinGroup(code);
      if (!result) {
        Alert.alert('Group Not Found', `No group found with code "${code}"`);
      } else {
        setJoinCode('');
        setJoining(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleDelete = (group: Group) => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => leaveGroup(group.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={[styles.title, { color: theme.text }]}>Group Match</Text>
            <Text style={[styles.subtitle, { color: theme.subtext }]}>Swipe together and find where everyone wants to eat!</Text>

            {creating ? (
              <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.formTitle, { color: theme.text }]}>New Group</Text>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Group name (e.g. Friday Dinner 🍕)"
                  placeholderTextColor={theme.subtext}
                  style={[styles.input, { borderColor: theme.inputBorder, color: theme.text }]}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
                <View style={styles.formBtns}>
                  <TouchableOpacity
                    onPress={() => setCreating(false)}
                    style={[styles.formBtn, styles.cancelBtn]}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    style={[styles.formBtn, styles.createBtn]}
                  >
                    <Text style={styles.createText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : joining ? (
              <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                <Text style={[styles.formTitle, { color: theme.text }]}>Join Group</Text>
                <TextInput
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="Code (e.g. MESH-7K2X)"
                  placeholderTextColor={theme.subtext}
                  style={[styles.input, { fontFamily: 'monospace', borderColor: theme.inputBorder, color: theme.text }]}
                  autoCapitalize="characters"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleJoin}
                />
                <View style={styles.formBtns}>
                  <TouchableOpacity
                    onPress={() => setJoining(false)}
                    style={[styles.formBtn, styles.cancelBtn]}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleJoin}
                    style={[styles.formBtn, styles.createBtn, joinLoading && styles.disabledBtn]}
                    disabled={joinLoading}
                  >
                    {joinLoading ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.createText}>Join</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={() => setCreating(true)}
                  style={[styles.headerBtn, styles.headerBtnPrimary]}
                >
                  <Text style={styles.headerBtnPrimaryText}>＋ New Group</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setJoining(true)}
                  style={[styles.headerBtn, styles.headerBtnOutline]}
                >
                  <Text style={styles.headerBtnOutlineText}>Join with Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No groups yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Create a group and invite your friends!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            matches={getGroupMatches(item.id, allRestaurants).length}
            memberProfiles={memberProfiles}
            currentUserId={currentUserId}
            myName={myDisplayName}
            myPhoto={myPhotoUri}
            onPress={() => router.push(`/group/${item.id}`)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  headerBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  headerBtnPrimary: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBtnPrimaryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  headerBtnOutline: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'white',
  },
  headerBtnOutlineText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  formBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 2,
    borderColor: '#ddd',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  createBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  createText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  cardMatchBorder: {
    borderWidth: 2,
  },
  cardBody: {
    flex: 1,
    padding: 18,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  matchBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTopRow: {
    marginBottom: 8,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f5f0eb',
  },
  deleteIcon: {
    fontSize: 18,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarInitial: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  memberCount: {
    fontSize: 12,
    marginLeft: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  code: {
    fontSize: 11,
    fontFamily: 'monospace',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});

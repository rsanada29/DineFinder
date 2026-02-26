import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGroupStore } from '../../src/store/useGroupStore';
import { useRestaurantStore } from '../../src/store/useRestaurantStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useUserStore } from '../../src/store/useUserStore';
import { getUserProfile } from '../../src/services/auth';
import StarRating from '../../src/components/StarRating';
import PoweredByGoogle from '../../src/components/PoweredByGoogle';
import PhotoViewerModal from '../../src/components/PhotoViewerModal';
import { COLORS, GENRES } from '../../src/constants/mockData';
import { useTheme } from '../../src/constants/theme';
import { getOpenStatus, getWalkingMinutes } from '../../src/utils/hours';
import type { Restaurant } from '../../src/types';

const SORT_OPTIONS = [
  { key: 'distance', label: 'Nearest' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'reviews', label: 'Most Reviewed' },
  { key: 'priceAsc', label: 'Price: Low to High' },
  { key: 'priceDesc', label: 'Price: High to Low' },
] as const;

const PRICE_LEVELS = [
  { level: 1, label: '~$20' },
  { level: 2, label: '$20–40' },
  { level: 3, label: '$50–100' },
  { level: 4, label: '$100~' },
] as const;

interface MemberProfile {
  name: string;
  photoUri?: string;
}

interface MatchCardProps {
  restaurant: Restaurant;
  theme: ReturnType<typeof useTheme>;
  onRemove?: () => void;
}

function MatchCard({ restaurant: r, theme, onRemove }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<{ uri: string; attribution?: string } | null>(null);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
  const status = r.hours ? getOpenStatus(r.hours) : null;
  return (
    <View style={[styles.matchCard, { backgroundColor: theme.card }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded((v) => !v)}>
        <View style={styles.matchRow}>
          <Image source={{ uri: r.photos[0] }} style={styles.matchImage} />
          <View style={styles.matchInfo}>
            <View style={styles.matchHeader}>
              <Text style={styles.matchLabel}>MATCH</Text>
              <View style={[styles.genreTag, { backgroundColor: theme.tagBg }]}>
                <Text style={styles.genreText}>{r.genre}</Text>
              </View>
              {onRemove && (
                <TouchableOpacity onPress={onRemove} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.removeIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.matchName, { color: theme.text }]}>{r.name}</Text>
            <StarRating rating={r.rating} size={12} />
            <Text style={[styles.matchMeta, { color: theme.subtext }]}>
              🚶 {getWalkingMinutes(r.distance)}min · {r.distance}km　{r.price}
            </Text>
            {status && status.label ? (
              <Text style={[styles.matchStatus, { color: status.isOpen ? '#4ADE80' : '#F87171' }]}>
                {status.label}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded details */}
      {expanded && (
        <View style={[styles.matchExpanded, { borderTopColor: theme.divider }]}>
          {/* Photo gallery */}
          {r.photos.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchPhotoScroll}>
              {r.photos.map((photo, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => setViewerPhoto({ uri: photo, attribution: r.photoAttributions?.[i] })}
                >
                  <Image source={{ uri: photo }} style={styles.matchPhotoThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {!!r.address && (
            <Text style={[styles.matchDetailText, { color: theme.subtext }]}>📍 {r.address}</Text>
          )}
          {!!r.phone && (
            <Text style={[styles.matchDetailText, { color: theme.subtext }]}>📞 {r.phone}</Text>
          )}
          {!!r.hours && (
            <Text style={[styles.matchDetailText, { color: theme.subtext }]}>🕐 {r.hours}</Text>
          )}
          <Text style={[styles.matchDetailText, { color: theme.subtext }]}>
            ⭐ {r.rating} ({r.reviews.toLocaleString()} reviews)
          </Text>
        </View>
      )}

      <View style={[styles.matchActions, { borderTopColor: theme.divider }]}>
        {!!r.phone && (
          <TouchableOpacity
            style={[styles.matchAction, styles.matchActionBorder, { borderRightColor: theme.divider }]}
            onPress={() => Linking.openURL(`tel:${r.phone}`)}
          >
            <Text style={[styles.matchActionText, { color: COLORS.primary }]}>📞 Call</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.matchAction}
          onPress={() => Linking.openURL(mapsUrl)}
        >
          <Text style={[styles.matchActionText, { color: COLORS.maps }]}>🗺️ Navigate</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Viewer */}
      {viewerPhoto && (
        <PhotoViewerModal
          visible
          photoUri={viewerPhoto.uri}
          attribution={viewerPhoto.attribution}
          onClose={() => setViewerPhoto(null)}
        />
      )}
    </View>
  );
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { groups, getGroupMatches, removeSwipe } = useGroupStore();
  const currentUserId = useAuthStore((s) => s.user?.uid) ?? '';
  const myDisplayName = useUserStore((s) => s.displayName);
  const myPhotoUri = useUserStore((s) => s.photoUri);
  const restaurants = useRestaurantStore((s) => s.restaurants);
  const saved = useRestaurantStore((s) => s.saved);
  const allRestaurants = useMemo(() => {
    const map = new Map(restaurants.map((r) => [r.id, r]));
    saved.forEach((r) => { if (!map.has(r.id)) map.set(r.id, r); });
    return [...map.values()];
  }, [restaurants, saved]);
  const [showMatches, setShowMatches] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [matchSort, setMatchSort] = useState<typeof SORT_OPTIONS[number]['key']>('distance');
  const [matchGenres, setMatchGenres] = useState<string[]>(['All']);
  const [matchMaxDistance, setMatchMaxDistance] = useState(20);
  const [matchPriceLevels, setMatchPriceLevels] = useState<number[]>([1, 2, 3, 4]);
  const [fetchedProfiles, setFetchedProfiles] = useState<Record<string, MemberProfile>>({});

  const group = groups.find((g) => g.id === id);

  // Subscribe to real-time Firestore updates for this group
  useEffect(() => {
    if (!id) return;
    const { subscribeToGroup } = useGroupStore.getState();
    const unsub = subscribeToGroup(id);
    return () => { unsub?.(); };
  }, [id]);

  // Fetch member profiles from Firestore for members missing a photo in group data
  useEffect(() => {
    if (!group) return;
    group.members.forEach((uid) => {
      if (uid === currentUserId) return;
      if (fetchedProfiles[uid]) return;
      // Only skip if the group profile already has a photo
      if (group.memberProfiles?.[uid]?.photoUri) return;
      getUserProfile(uid).then((profile) => {
        if (profile) {
          setFetchedProfiles((prev) => ({ ...prev, [uid]: profile }));
        }
      }).catch(console.warn);
    });
  }, [group?.members.join(',')]);

  function getMemberName(uid: string): string {
    if (uid === currentUserId) return myDisplayName || 'You';
    return group?.memberProfiles?.[uid]?.name
      || fetchedProfiles[uid]?.name
      || 'Member';
  }

  function getMemberPhoto(uid: string): string | undefined {
    if (uid === currentUserId) return myPhotoUri || undefined;
    return group?.memberProfiles?.[uid]?.photoUri
      || fetchedProfiles[uid]?.photoUri;
  }

  if (!group) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.subtext }]}>Group not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const matches = getGroupMatches(group.id, allRestaurants);
  const totalRestaurants = Math.max(allRestaurants.length, 20);

  const copyCode = async () => {
    await Clipboard.setStringAsync(group.code);
    Alert.alert('Copied!', `${group.code} copied to clipboard`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.groupName, { color: theme.text }]}>{group.name}</Text>

        {/* Code */}
        <View style={styles.codeRow}>
          <Text style={[styles.code, { backgroundColor: theme.codeBg, color: theme.subtext }]}>{group.code}</Text>
          <TouchableOpacity onPress={copyCode} style={styles.copyBtn}>
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Members progress */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.subtext }]}>Members ({group.members.length})</Text>
          {group.members.map((memberId) => {
            const swiped = (group.swipes[memberId] ?? []).length;
            const pct = Math.min(100, (swiped / totalRestaurants) * 100);
            const photo = getMemberPhoto(memberId);
            const name = getMemberName(memberId);
            return (
              <View key={memberId} style={styles.memberRow}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.memberAvatarImage} />
                ) : (
                  <View style={styles.memberAvatarFallback}>
                    <Text style={styles.memberAvatarInitial}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {name}
                      {memberId === currentUserId ? ' (You)' : ''}
                    </Text>
                    <Text style={[styles.memberSwipedCount, { color: theme.subtext }]}>{swiped} saved</Text>
                  </View>
                  <View style={[styles.progressBg, { backgroundColor: theme.chipBg }]}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Match button */}
        <TouchableOpacity
          onPress={() => setShowMatches((v) => !v)}
          style={[
            styles.matchBtn,
            matches.length === 0 && styles.matchBtnDisabled,
          ]}
          disabled={matches.length === 0}
        >
          <Text style={styles.matchBtnText}>
            {matches.length > 0
              ? `🎉 ${matches.length} Matches!`
              : 'No matches yet — keep swiping!'}
          </Text>
        </TouchableOpacity>

        {/* Matches list */}
        {showMatches && matches.length > 0 && (() => {
          // Filter
          let filtered = matches;
          if (!matchGenres.includes('All')) filtered = filtered.filter((r) => matchGenres.includes(r.genre));
          filtered = filtered.filter((r) => matchPriceLevels.includes(r.priceLevel));
          filtered = filtered.filter((r) => r.distance <= matchMaxDistance);

          // Sort
          const sorted = [...filtered].sort((a, b) => {
            switch (matchSort) {
              case 'rating': return b.rating - a.rating;
              case 'reviews': return b.reviews - a.reviews;
              case 'priceAsc': return a.priceLevel - b.priceLevel;
              case 'priceDesc': return b.priceLevel - a.priceLevel;
              default: return a.distance - b.distance;
            }
          });

          const togglePrice = (level: number) => {
            setMatchPriceLevels((prev) => {
              const set = new Set(prev);
              if (set.has(level)) {
                if (set.size <= 1) return prev;
                set.delete(level);
              } else { set.add(level); }
              return [...set];
            });
          };

          const toggleGenre = (g: string) => {
            setMatchGenres((prev) => {
              if (g === 'All') return ['All'];
              const without = prev.filter((x) => x !== 'All');
              const has = without.includes(g);
              if (has) {
                const next = without.filter((x) => x !== g);
                return next.length === 0 ? ['All'] : next;
              }
              return [...without, g];
            });
          };

          const resetFilters = () => {
            setMatchGenres(['All']);
            setMatchMaxDistance(20);
            setMatchPriceLevels([1, 2, 3, 4]);
            setMatchSort('distance');
          };

          const isFiltered = !matchGenres.includes('All') || matchMaxDistance < 20 || matchPriceLevels.length < 4 || matchSort !== 'distance';

          return (
            <View style={styles.matchesList}>
              {/* Header row with filter toggle */}
              <View style={styles.matchesHeader}>
                <Text style={[styles.sectionTitle, { color: theme.subtext, marginBottom: 0 }]}>
                  Restaurants everyone liked ({sorted.length}/{matches.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFilter((v) => !v)}
                  style={[styles.filterToggle, showFilter && styles.filterToggleActive]}
                >
                  <Text style={[styles.filterToggleText, showFilter && styles.filterToggleTextActive]}>
                    Filter {isFiltered ? '●' : ''}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Expandable filter panel */}
              {showFilter && (
                <View style={[styles.filterPanel, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                  {/* Category (multi-select) */}
                  <View style={styles.filterSection}>
                    <Text style={[styles.filterLabel, { color: theme.subtext }]}>Category</Text>
                    <View style={styles.filterChips}>
                      {GENRES.map((g) => {
                        const isActive = matchGenres.includes(g);
                        return (
                          <TouchableOpacity
                            key={g}
                            onPress={() => toggleGenre(g)}
                            style={[styles.filterChip, isActive && styles.filterChipActive]}
                          >
                            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{g}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Distance */}
                  <View style={styles.filterSection}>
                    <Text style={[styles.filterLabel, { color: theme.subtext }]}>Distance: within {matchMaxDistance}km</Text>
                    <Slider
                      style={{ width: '100%', height: 40 }}
                      minimumValue={0.5}
                      maximumValue={20}
                      step={0.5}
                      value={matchMaxDistance}
                      onValueChange={(v) => setMatchMaxDistance(Math.round(v * 2) / 2)}
                      minimumTrackTintColor={COLORS.primary}
                      maximumTrackTintColor="#ddd"
                      thumbTintColor={COLORS.primary}
                    />
                    <View style={styles.sliderLabels}>
                      <Text style={styles.sliderLabel}>0.5km</Text>
                      <Text style={styles.sliderLabel}>20km</Text>
                    </View>
                  </View>

                  {/* Sort */}
                  <View style={styles.filterSection}>
                    <Text style={[styles.filterLabel, { color: theme.subtext }]}>Sort By</Text>
                    {SORT_OPTIONS.map((s) => (
                      <TouchableOpacity
                        key={s.key}
                        onPress={() => setMatchSort(s.key)}
                        style={[styles.radioRow, matchSort === s.key && styles.radioRowActive]}
                      >
                        <View style={[styles.radio, matchSort === s.key && styles.radioFilled]}>
                          {matchSort === s.key && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.radioLabel, { color: theme.text }, matchSort === s.key && styles.radioLabelActive]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Price */}
                  <View style={styles.filterSection}>
                    <Text style={[styles.filterLabel, { color: theme.subtext }]}>Price Range</Text>
                    <View style={styles.priceRow}>
                      {PRICE_LEVELS.map(({ level, label }) => (
                        <TouchableOpacity
                          key={level}
                          onPress={() => togglePrice(level)}
                          style={[styles.priceBtn, matchPriceLevels.includes(level) && styles.priceBtnActive]}
                        >
                          <Text style={[styles.priceBtnText, matchPriceLevels.includes(level) && styles.priceBtnTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Reset */}
                  {isFiltered && (
                    <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                      <Text style={styles.resetBtnText}>Reset Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {sorted.length === 0 ? (
                <Text style={[styles.noFilterResults, { color: theme.subtext }]}>
                  No matches for this filter
                </Text>
              ) : (
                sorted.map((r) => (
                  <MatchCard
                    key={r.id}
                    restaurant={r}
                    theme={theme}
                    onRemove={() => {
                      Alert.alert(
                        'Remove Match',
                        `Remove "${r.name}" from your matches?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Remove',
                            style: 'destructive',
                            onPress: () => removeSwipe(group.id, r.id),
                          },
                        ]
                      );
                    }}
                  />
                ))
              )}
            </View>
          );
        })()}
        {/* Google attribution */}
        {matches.length > 0 && <PoweredByGoogle style={{ marginTop: 16 }} />}
      </ScrollView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 16,
  },
  backBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  backLink: { padding: 8 },
  backLinkText: { color: COLORS.primary },
  groupName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtn: {},
  copyText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  memberAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  memberAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  memberInfo: { flex: 1 },
  memberNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
  },
  memberSwipedCount: {
    fontSize: 12,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  matchBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  matchBtnDisabled: {
    backgroundColor: '#ddd',
    shadowOpacity: 0,
    elevation: 0,
  },
  matchBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  matchesList: {
    gap: 12,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterToggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f0e8e0',
  },
  filterToggleActive: {
    backgroundColor: COLORS.primary,
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterToggleTextActive: {
    color: 'white',
  },
  filterPanel: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f0e8e0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: 'white',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    color: '#999',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  radioRowActive: {
    backgroundColor: '#FFF0E8',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFilled: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 13,
  },
  radioLabelActive: {
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priceBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f0e8e0',
    alignItems: 'center',
  },
  priceBtnActive: {
    backgroundColor: COLORS.primary,
  },
  priceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  priceBtnTextActive: {
    color: 'white',
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  noFilterResults: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
  },
  matchCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 0,
  },
  matchRow: {
    flexDirection: 'row',
  },
  matchImage: {
    width: 100,
    height: 120,
    resizeMode: 'cover',
  },
  matchInfo: {
    flex: 1,
    padding: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  matchLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  genreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  matchName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  matchMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  matchStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  removeBtn: {
    marginLeft: 'auto',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 11,
    color: '#999',
    fontWeight: '700',
  },
  matchExpanded: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  matchPhotoScroll: {
    marginBottom: 6,
  },
  matchPhotoThumb: {
    width: 100,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: 'cover',
  },
  matchDetailText: {
    fontSize: 12,
    lineHeight: 18,
  },
  matchActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  matchAction: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  matchActionBorder: {
    borderRightWidth: 1,
  },
  matchActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

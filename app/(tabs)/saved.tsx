import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRestaurantStore } from '../../src/store/useRestaurantStore';
import SavedItem from '../../src/components/SavedItem';
import PoweredByGoogle from '../../src/components/PoweredByGoogle';
import { COLORS, GENRES } from '../../src/constants/mockData';
import { useTheme } from '../../src/constants/theme';

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

export default function SavedScreen() {
  const saved = useRestaurantStore((s) => s.saved);
  const removeSaved = useRestaurantStore((s) => s.removeSaved);
  const theme = useTheme();
  const [showFilter, setShowFilter] = useState(false);
  const [genres, setGenres] = useState<string[]>(['All']);
  const [sort, setSort] = useState<typeof SORT_OPTIONS[number]['key']>('distance');
  const [maxDistance, setMaxDistance] = useState(20);
  const [priceLevels, setPriceLevels] = useState<number[]>([1, 2, 3, 4]);

  const togglePrice = (level: number) => {
    setPriceLevels((prev) => {
      const set = new Set(prev);
      if (set.has(level)) {
        if (set.size <= 1) return prev;
        set.delete(level);
      } else { set.add(level); }
      return [...set];
    });
  };

  const toggleGenre = (g: string) => {
    setGenres((prev) => {
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
    setGenres(['All']);
    setMaxDistance(20);
    setPriceLevels([1, 2, 3, 4]);
    setSort('distance');
  };

  const isFiltered = !genres.includes('All') || maxDistance < 20 || priceLevels.length < 4 || sort !== 'distance';

  const filtered = saved
    .filter((r) => genres.includes('All') || genres.includes(r.genre))
    .filter((r) => priceLevels.includes(r.priceLevel))
    .filter((r) => r.distance <= maxDistance)
    .slice()
    .sort((a, b) => {
      switch (sort) {
        case 'rating': return b.rating - a.rating;
        case 'reviews': return b.reviews - a.reviews;
        case 'priceAsc': return a.priceLevel - b.priceLevel;
        case 'priceDesc': return b.priceLevel - a.priceLevel;
        default: return a.distance - b.distance;
      }
    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.text }]}>Saved</Text>
              <Text style={[styles.count, { color: theme.subtext }]}>{filtered.length}/{saved.length} places</Text>
            </View>

            {/* Filter toggle */}
            <View style={styles.filterHeaderRow}>
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
                      const isActive = genres.includes(g);
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
                  <Text style={[styles.filterLabel, { color: theme.subtext }]}>Distance: within {maxDistance}km</Text>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0.5}
                    maximumValue={20}
                    step={0.5}
                    value={maxDistance}
                    onValueChange={(v) => setMaxDistance(Math.round(v * 2) / 2)}
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
                      onPress={() => setSort(s.key)}
                      style={[styles.radioRow, sort === s.key && styles.radioRowActive]}
                    >
                      <View style={[styles.radio, sort === s.key && styles.radioFilled]}>
                        {sort === s.key && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.radioLabel, { color: theme.text }, sort === s.key && styles.radioLabelActive]}>
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
                        style={[styles.priceBtn, priceLevels.includes(level) && styles.priceBtnActive]}
                      >
                        <Text style={[styles.priceBtnText, priceLevels.includes(level) && styles.priceBtnTextActive]}>
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
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {saved.length === 0 ? 'No saved places yet' : 'No matches for this filter'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              {saved.length === 0 ? 'Swipe right to save\nrestaurants you like!' : 'Try adjusting your filters'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <SavedItem restaurant={item} onRemove={removeSaved} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={saved.length > 0 ? <PoweredByGoogle style={{ marginTop: 16 }} /> : null}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 20,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  count: {
    fontSize: 14,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 12,
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
    marginBottom: 16,
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
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 22,
  },
});

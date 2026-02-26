import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRestaurantStore } from '../../src/store/useRestaurantStore';
import { parseTimeRanges } from '../../src/utils/hours';
import { useGroupStore } from '../../src/store/useGroupStore';
import SwipeDeck from '../../src/components/SwipeDeck';
import FilterModal from '../../src/components/FilterModal';
import PoweredByGoogle from '../../src/components/PoweredByGoogle';
import { COLORS } from '../../src/constants/mockData';
import { useTheme } from '../../src/constants/theme';
import type { Restaurant } from '../../src/types';

export default function DiscoverScreen() {
  const { swipeRight, swipeLeft, filters, setFilters, isLoading, fetchRestaurants,
          restaurants, saved, skipped } = useRestaurantStore();
  const { groups, addSwipe } = useGroupStore();
  const theme = useTheme();
  const [showFilter, setShowFilter] = useState(false);

  const filteredRestaurants = useMemo(() => {
    const savedIds = new Set(saved.map((r) => r.id));
    const skippedSet = new Set(skipped);

    function servesLunch(hours: string): boolean {
      if (!hours || /^closed$/i.test(hours.trim())) return false;
      const ranges = parseTimeRanges(hours);
      if (ranges.length === 0) return true; // unknown hours → don't filter out
      // Any range opens before 3 PM (900 min)
      return ranges.some((r) => r.open < 900);
    }
    function servesDinner(hours: string): boolean {
      if (!hours || /^closed$/i.test(hours.trim())) return false;
      const ranges = parseTimeRanges(hours);
      if (ranges.length === 0) return true;
      // Any range closes after 5 PM (1020 min) or past midnight (close <= 180)
      return ranges.some((r) => r.close >= 1020 || r.close <= 180);
    }

    let list = restaurants.filter((r) => {
      if (savedIds.has(r.id) || skippedSet.has(r.id)) return false;
      if (r.distance > filters.maxDistance) return false;
      if (!filters.genres.includes('All') && !filters.genres.includes(r.genre)) return false;
      if (!filters.priceLevels.includes(r.priceLevel)) return false;
      if (filters.mealTime === 'lunch' && !servesLunch(r.hours)) return false;
      if (filters.mealTime === 'dinner' && !servesDinner(r.hours)) return false;
      return true;
    });

    list.sort((a, b) => {
      switch (filters.sort) {
        case 'rating': return b.rating - a.rating;
        case 'reviews': return b.reviews - a.reviews;
        case 'priceAsc': return a.priceLevel - b.priceLevel;
        case 'priceDesc': return b.priceLevel - a.priceLevel;
        default: return a.distance - b.distance;
      }
    });
    return list;
  }, [restaurants, saved, skipped, filters]);

  const resetSkipped = useRestaurantStore((s) => s.resetSkipped);
  const expandAndReload = useRestaurantStore((s) => s.expandAndReload);

  // Auto-reset / auto-expand when deck runs out (only for swipe exhaustion, NOT filter mismatch)
  useEffect(() => {
    if (isLoading || restaurants.length === 0 || filteredRestaurants.length > 0) return;

    // Count unswiped restaurants (ignoring filters) to distinguish
    // "all swiped" from "filter excludes everything"
    const savedIds = new Set(saved.map((r) => r.id));
    const skippedSet = new Set(skipped);
    const unswiped = restaurants.filter((r) => !savedIds.has(r.id) && !skippedSet.has(r.id));

    if (unswiped.length > 0) {
      // There are restaurants but filters exclude them — don't auto-expand
      return;
    }

    if (skipped.length > 0) {
      // Some restaurants were skipped — reset so they cycle back
      resetSkipped();
    } else {
      // All restaurants are saved — expand radius to find more
      expandAndReload();
    }
  }, [filteredRestaurants.length, isLoading, restaurants.length, skipped.length, saved.length]);

  const handleSwipeRight = useCallback(
    (r: Restaurant) => {
      swipeRight(r);
      groups.forEach((g) => addSwipe(g.id, r.id));
    },
    [swipeRight, groups, addSwipe]
  );
  const handleSwipeLeft = useCallback(
    (id: string) => swipeLeft(id),
    [swipeLeft]
  );

  const current = filteredRestaurants[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <View style={styles.logo}>
          <Image source={require('../../assets/icon.png')} style={styles.logoIcon} />
          <Text style={styles.logoText}>DineFinder</Text>
        </View>
        <TouchableOpacity onPress={() => setShowFilter(true)} style={styles.filterBtn}>
          <Text style={styles.filterIcon}>⚙️</Text>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Deck area */}
      <View style={styles.deck}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: theme.subtext }]}>
              {restaurants.length === 0 ? 'Finding nearby restaurants...' : 'Finding more restaurants...'}
            </Text>
          </View>
        ) : restaurants.length === 0 ? (
          // Nothing loaded yet — show find button
          <View style={styles.center}>
            <Image source={require('../../assets/icon.png')} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Ready to discover?</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              Find restaurants near you and{'\n'}start swiping!
            </Text>
            <TouchableOpacity style={styles.changeFilterBtn} onPress={fetchRestaurants}>
              <Text style={styles.changeFilterText}>Find Restaurants Near Me</Text>
            </TouchableOpacity>
          </View>
        ) : filteredRestaurants.length === 0 ? (
          // All restaurants saved — skipped auto-resets so this only shows when all are saved
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>All saved!</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>
              You've saved all matching restaurants.{'\n'}Try changing your filters to discover more!
            </Text>
            <TouchableOpacity
              style={styles.changeFilterBtn}
              onPress={() => setShowFilter(true)}
            >
              <Text style={styles.changeFilterText}>Change Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SwipeDeck
            restaurants={filteredRestaurants}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
          />
        )}
      </View>

      {/* Action buttons */}
      {filteredRestaurants.length > 0 && current && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn]}
            onPress={() => handleSwipeLeft(current.id)}
            activeOpacity={0.8}
          >
            <Text style={styles.skipIcon}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.saveBtn]}
            onPress={() => handleSwipeRight(current)}
            activeOpacity={0.8}
          >
            <Text style={styles.saveIcon}>♥</Text>
          </TouchableOpacity>
        </View>
      )}

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5EE',
    borderWidth: 1.5,
    borderColor: '#FFD4BC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterIcon: {
    fontSize: 14,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deck: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  changeFilterBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  changeFilterText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingVertical: 16,
    paddingBottom: 12,
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  skipBtn: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.skip,
  },
  skipIcon: {
    fontSize: 22,
    color: COLORS.skip,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: COLORS.save,
  },
  saveIcon: {
    fontSize: 24,
    color: COLORS.save,
  },
});

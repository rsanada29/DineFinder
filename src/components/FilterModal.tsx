import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import type { Filters } from '../types';
import { COLORS, GENRES } from '../constants/mockData';

interface Props {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
}

const SORT_OPTIONS = [
  { key: 'distance', label: 'Nearest' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'reviews', label: 'Most Reviewed' },
  { key: 'priceAsc', label: 'Price: Low to High' },
  { key: 'priceDesc', label: 'Price: High to Low' },
] as const;

const MEAL_OPTIONS = [
  { key: 'all', label: '🍽️ All' },
  { key: 'lunch', label: '☀️ Lunch' },
  { key: 'dinner', label: '🌙 Dinner' },
] as const;

export default function FilterModal({ visible, onClose, filters, onApply }: Props) {
  const [local, setLocal] = useState<Filters>({ ...filters });

  const togglePrice = (level: number) => {
    setLocal((prev) => {
      const set = new Set(prev.priceLevels);
      if (set.has(level)) {
        // Don't allow deselecting all price levels
        if (set.size <= 1) return prev;
        set.delete(level);
      } else {
        set.add(level);
      }
      return { ...prev, priceLevels: [...set] };
    });
  };

  const toggleGenre = (g: string) => {
    setLocal((prev) => {
      if (g === 'All') return { ...prev, genres: ['All'] };
      const without = prev.genres.filter((x) => x !== 'All');
      const has = without.includes(g);
      if (has) {
        const next = without.filter((x) => x !== g);
        return { ...prev, genres: next.length === 0 ? ['All'] : next };
      }
      return { ...prev, genres: [...without, g] };
    });
  };

  const reset = () =>
    setLocal({ maxDistance: 20, genres: ['All'], sort: 'distance', priceLevels: [1, 2, 3, 4], mealTime: 'all' });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Filters</Text>

          {/* Meal Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Meal Time</Text>
            <View style={styles.mealRow}>
              {MEAL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setLocal((p) => ({ ...p, mealTime: opt.key }))}
                  style={[styles.mealBtn, local.mealTime === opt.key && styles.mealBtnActive]}
                >
                  <Text style={[styles.mealText, local.mealTime === opt.key && styles.mealTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.label}>Distance: within {local.maxDistance}km</Text>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0.5}
              maximumValue={20}
              step={0.5}
              value={local.maxDistance}
              onValueChange={(v) => setLocal((p) => ({ ...p, maxDistance: Math.round(v * 2) / 2 }))}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor="#ddd"
              thumbTintColor={COLORS.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>0.5km</Text>
              <Text style={styles.sliderLabel}>20km</Text>
            </View>
          </View>

          {/* Category (multi-select) */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chips}>
              {GENRES.map((g) => {
                const isActive = local.genres.includes(g);
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => toggleGenre(g)}
                    style={[styles.chip, isActive && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sort */}
          <View style={styles.section}>
            <Text style={styles.label}>Sort By</Text>
            {SORT_OPTIONS.map((s) => (
              <TouchableOpacity
                key={s.key}
                onPress={() => setLocal((p) => ({ ...p, sort: s.key }))}
                style={[styles.radioRow, local.sort === s.key && styles.radioRowActive]}
              >
                <View style={[styles.radio, local.sort === s.key && styles.radioFilled]}>
                  {local.sort === s.key && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.radioLabel, local.sort === s.key && styles.radioLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.label}>Price Range</Text>
            <View style={styles.priceRow}>
              {([
                { level: 1, label: '~$20' },
                { level: 2, label: '$20–40' },
                { level: 3, label: '$50–100' },
                { level: 4, label: '$100~' },
              ] as { level: 1|2|3|4; label: string }[]).map(({ level, label }) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => togglePrice(level)}
                  style={[styles.priceBtn, local.priceLevels.includes(level) && styles.priceBtnActive]}
                >
                  <Text
                    style={[
                      styles.priceBtnText,
                      local.priceLevels.includes(level) && styles.priceBtnTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                onApply(local);
                onClose();
              }}
            >
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFAF5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
  },
  mealRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mealBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f0e8e0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealBtnActive: {
    backgroundColor: '#FFF5EE',
    borderColor: COLORS.primary,
  },
  mealText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  mealTextActive: {
    color: COLORS.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    color: '#999',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0e8e0',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: 'white',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  radioRowActive: {
    backgroundColor: '#FFF0E8',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFilled: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
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
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f0e8e0',
    alignItems: 'center',
  },
  priceBtnActive: {
    backgroundColor: COLORS.primary,
  },
  priceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  priceBtnTextActive: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});

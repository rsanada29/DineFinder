import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Image,
} from 'react-native';
import type { ReviewText } from '../types';
import StarRating from './StarRating';
import { COLORS } from '../constants/mockData';

interface Props {
  visible: boolean;
  onClose: () => void;
  restaurantName: string;
  rating: number;
  reviewCount: number;
  reviews: ReviewText[];
}

const SORT_OPTIONS = [
  { key: 'default', label: 'Relevant' },
  { key: 'newest', label: 'Newest' },
  { key: 'high', label: 'High ★' },
  { key: 'low', label: 'Low ★' },
] as const;

type SortKey = typeof SORT_OPTIONS[number]['key'];

/** Parse relative time strings like "2 months ago" → days ago (for sorting fallback) */
function parseRelativeTime(time: string): number {
  if (!time) return Infinity;
  const m = time.match(/(\d+)\s*(year|month|week|day|hour|minute)/i);
  if (!m) {
    if (/year/i.test(time)) return 365;
    if (/month/i.test(time)) return 30;
    if (/week/i.test(time)) return 7;
    if (/day/i.test(time)) return 1;
    return Infinity;
  }
  const n = parseInt(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === 'year') return n * 365;
  if (unit === 'month') return n * 30;
  if (unit === 'week') return n * 7;
  if (unit === 'day') return n;
  if (unit === 'hour') return n / 24;
  if (unit === 'minute') return n / 1440;
  return Infinity;
}

export default function ReviewModal({
  visible,
  onClose,
  restaurantName,
  rating,
  reviewCount,
  reviews,
}: Props) {
  const [sort, setSort] = useState<SortKey>('default');
  const [filterStar, setFilterStar] = useState<number | null>(null);

  const filtered = filterStar
    ? reviews.filter((r) => r.rating === filterStar)
    : reviews;

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'high') return b.rating - a.rating;
    if (sort === 'low') return a.rating - b.rating;
    if (sort === 'newest') {
      const tA = a.publishTime ? new Date(a.publishTime).getTime() : -parseRelativeTime(a.time);
      const tB = b.publishTime ? new Date(b.publishTime).getTime() : -parseRelativeTime(b.time);
      return tB - tA;
    }
    return 0;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.restaurantName} numberOfLines={1}>{restaurantName}</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={rating} size={14} />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)}  ({reviewCount.toLocaleString()} reviews)
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Toolbar: Sort + Star filter */}
        <View style={styles.toolbar}>
          {/* Sort */}
          <View style={styles.toolbarSection}>
            <Text style={styles.toolbarLabel}>Sort</Text>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map((s) => {
                const active = sort === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    onPress={() => setSort(s.key)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Star filter */}
          <View style={styles.toolbarSection}>
            <Text style={styles.toolbarLabel}>Rating</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                onPress={() => setFilterStar(null)}
                style={[styles.chip, filterStar === null && styles.chipActive]}
              >
                <Text style={[styles.chipText, filterStar === null && styles.chipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {[5, 4, 3, 2, 1].map((star) => {
                const active = filterStar === star;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setFilterStar(active ? null : star)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {star}★
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Reviews */}
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>
              {filterStar ? `No ${filterStar}-star reviews` : 'No reviews yet'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <View style={styles.reviewTopLeft}>
                    {item.authorPhotoUri ? (
                      <Image source={{ uri: item.authorPhotoUri }} style={styles.authorAvatarImage} />
                    ) : (
                      <View style={styles.authorAvatar}>
                        <Text style={styles.avatarText}>{item.author.charAt(0)}</Text>
                      </View>
                    )}
                    <View>
                      <Text style={styles.authorName}>{item.author}</Text>
                      <Text style={styles.reviewTime}>{item.time}</Text>
                    </View>
                  </View>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Text key={s} style={[styles.star, s <= item.rating ? styles.starOn : styles.starOff]}>
                        ★
                      </Text>
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewBody}>{item.text}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
          />
        )}
      </SafeAreaView>
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
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0e8e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },

  // --- Toolbar ---
  toolbar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0e8e0',
    gap: 10,
  },
  toolbarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolbarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    width: 46,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5ede5',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
  },
  chipTextActive: {
    color: 'white',
  },

  // --- Reviews ---
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  reviewCard: {
    paddingVertical: 16,
    gap: 8,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reviewTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  authorAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewTime: {
    fontSize: 11,
    color: '#aaa',
  },
  starsRow: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 14,
  },
  starOn: {
    color: '#FFC107',
  },
  starOff: {
    color: '#ddd',
  },
  reviewBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0e8e0',
  },
});

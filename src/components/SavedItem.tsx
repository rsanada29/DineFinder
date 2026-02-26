import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ScrollView,
} from 'react-native';
import type { Restaurant } from '../types';
import StarRating from './StarRating';
import PhotoViewerModal from './PhotoViewerModal';
import { COLORS } from '../constants/mockData';
import { getOpenStatus, getWalkingMinutes } from '../utils/hours';

interface Props {
  restaurant: Restaurant;
  onRemove: (id: string) => void;
}

export default function SavedItem({ restaurant: r, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<{ uri: string; attribution?: string } | null>(null);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
  const status = r.hours ? getOpenStatus(r.hours) : null;

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setExpanded((v) => !v)}>
        <View style={styles.row}>
          <Image source={{ uri: r.photos[0] }} style={styles.image} />
          <View style={styles.info}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.genreTag}>
                  <Text style={styles.genreText}>{r.genre}</Text>
                </View>
                <Text style={styles.name}>{r.name}</Text>
              </View>
              <TouchableOpacity onPress={() => onRemove(r.id)} style={styles.removeBtn}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <StarRating rating={r.rating} size={12} />
            <View style={styles.meta}>
              <Text style={styles.metaText}>🚶 {getWalkingMinutes(r.distance)}min · {r.distance}km</Text>
              <Text style={styles.metaText}>{r.price}</Text>
            </View>
            {status && status.label ? (
              <Text style={[styles.statusText, { color: status.isOpen ? '#4ADE80' : '#F87171' }]}>
                {status.label}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedSection}>
          {r.photos.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {r.photos.map((photo, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => setViewerPhoto({ uri: photo, attribution: r.photoAttributions?.[i] })}
                >
                  <Image source={{ uri: photo }} style={styles.photoThumb} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {!!r.address && (
            <Text style={styles.detailText}>📍 {r.address}</Text>
          )}
          {!!r.phone && (
            <Text style={styles.detailText}>📞 {r.phone}</Text>
          )}
          {!!r.hours && (
            <Text style={styles.detailText}>🕐 {r.hours}</Text>
          )}
          <Text style={styles.detailText}>
            ⭐ {r.rating} ({r.reviews.toLocaleString()} reviews)
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {!!r.phone && (
          <TouchableOpacity
            style={[styles.action, styles.actionBorder]}
            onPress={() => Linking.openURL(`tel:${r.phone}`)}
          >
            <Text style={[styles.actionText, { color: COLORS.primary }]}>
              📞 Call
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.action}
          onPress={() => Linking.openURL(mapsUrl)}
        >
          <Text style={[styles.actionText, { color: COLORS.maps }]}>
            🗺️ Navigate
          </Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  row: {
    flexDirection: 'row',
  },
  image: {
    width: 100,
    height: 130,
    resizeMode: 'cover',
  },
  info: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerLeft: { flex: 1 },
  genreTag: {
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  genreText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  removeBtn: {
    padding: 4,
  },
  removeIcon: {
    fontSize: 16,
    color: '#ccc',
  },
  meta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  expandedSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f0eb',
    gap: 5,
  },
  photoScroll: {
    marginBottom: 4,
  },
  photoThumb: {
    width: 100,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    resizeMode: 'cover',
  },
  detailText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f5f0eb',
  },
  action: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBorder: {
    borderRightWidth: 1,
    borderRightColor: '#f5f0eb',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

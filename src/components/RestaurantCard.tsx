import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import type { Restaurant } from '../types';
import { COLORS } from '../constants/mockData';
import { getOpenStatus, getWalkingMinutes } from '../utils/hours';
import PhotoGallery from './PhotoGallery';
import StarRating from './StarRating';
import ReviewModal from './ReviewModal';
import PoweredByGoogle from './PoweredByGoogle';

interface Props {
  restaurant: Restaurant;
  isActive: boolean;
  saveOverlayStyle: object;
  skipOverlayStyle: object;
}

export default function RestaurantCard({
  restaurant: r,
  isActive,
  saveOverlayStyle,
  skipOverlayStyle,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;

  return (
    <View style={styles.card}>
      {/* Photo */}
      <PhotoGallery photos={r.photos} attributions={r.photoAttributions} isActive={isActive} />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      {/* Distance badge */}
      <View style={styles.distanceBadge} pointerEvents="none">
        <Text style={styles.distanceText}>🚶 {getWalkingMinutes(r.distance)}min · {r.distance}km</Text>
      </View>

      {/* Genre badge */}
      <View style={styles.genreBadge} pointerEvents="none">
        <Text style={styles.genreText}>{r.genre}</Text>
      </View>

      {/* SAVE overlay */}
      <Animated.View style={[styles.saveOverlay, saveOverlayStyle]} pointerEvents="none">
        <Text style={styles.saveLabel}>SAVE</Text>
      </Animated.View>

      {/* SKIP overlay */}
      <Animated.View style={[styles.skipOverlay, skipOverlayStyle]} pointerEvents="none">
        <Text style={styles.skipLabel}>SKIP</Text>
      </Animated.View>

      {/* Info section */}
      <View style={styles.info}>
        <Text style={styles.name}>{r.name}</Text>

        {/* Rating row — tap to open reviews */}
        <TouchableOpacity
          onPress={() => r.reviewTexts && r.reviewTexts.length > 0 && setShowReviews(true)}
          style={styles.ratingRow}
          activeOpacity={r.reviewTexts && r.reviewTexts.length > 0 ? 0.7 : 1}
        >
          <StarRating rating={r.rating} />
          <Text style={styles.metaText}>
            {r.reviews.toLocaleString()} reviews
          </Text>
          {r.reviewTexts && r.reviewTexts.length > 0 && (
            <View style={styles.reviewBadge}>
              <Text style={styles.reviewBadgeText}>Reviews ›</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <Text style={styles.priceText}>{r.price}</Text>
          {!!r.hours && (() => {
            const status = getOpenStatus(r.hours);
            return status.label ? (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={[styles.infoText, { color: status.isOpen ? '#4ADE80' : '#F87171' }]}>
                  {status.label}
                </Text>
              </>
            ) : null;
          })()}
        </View>
        {!!r.phone && (
          <View style={styles.metaRow}>
            <Text style={styles.infoText}>📞 {r.phone}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setExpanded((e) => !e)}
          style={styles.expandBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Close ▲' : 'Details ▾'}
          </Text>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.expandedContent}>
            {!!r.address && <Text style={styles.addressText}>📍 {r.address}</Text>}
            <View style={styles.btnRow}>
              {!!r.phone && (
                <TouchableOpacity
                  style={[styles.btn, styles.callBtn]}
                  onPress={() => Linking.openURL(`tel:${r.phone}`)}
                >
                  <Text style={styles.callBtnText}>📞 Call</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.btn, styles.mapsBtn]}
                onPress={() => Linking.openURL(mapsUrl)}
              >
                <Text style={styles.mapsBtnText}>🗺️ Navigate</Text>
              </TouchableOpacity>
            </View>
            <PoweredByGoogle style={{ paddingVertical: 4, marginTop: 4 }} />
          </View>
        )}
      </View>

      {/* Review Modal */}
      <ReviewModal
        visible={showReviews}
        onClose={() => setShowReviews(false)}
        restaurantName={r.name}
        rating={r.rating}
        reviewCount={r.reviews}
        reviews={r.reviewTexts ?? []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  distanceBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  distanceText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  genreBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  genreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  saveOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    borderWidth: 4,
    borderColor: COLORS.save,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    transform: [{ rotate: '-15deg' }],
  },
  saveLabel: {
    color: COLORS.save,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  skipOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    borderWidth: 4,
    borderColor: COLORS.skip,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    transform: [{ rotate: '15deg' }],
  },
  skipLabel: {
    color: COLORS.skip,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 20,
  },
  name: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  dot: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  priceText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  infoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  reviewBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 2,
  },
  reviewBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  expandBtn: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  expandText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  addressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 10,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  callBtn: {
    backgroundColor: COLORS.save,
  },
  callBtnText: {
    color: '#1a1a1a',
    fontSize: 13,
    fontWeight: '700',
  },
  mapsBtn: {
    backgroundColor: COLORS.maps,
  },
  mapsBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
});

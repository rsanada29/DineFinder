import React, { useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import type { Restaurant, SwipeDirection } from '../types';
import RestaurantCard from './RestaurantCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;
const OFFSCREEN = SCREEN_WIDTH * 1.6;

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (dir: SwipeDirection) => void;
  isTop: boolean;
}

function SwipeCard({ restaurant, onSwipe, isTop }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.25;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(OFFSCREEN, { duration: 280 });
        runOnJS(onSwipe)('right');
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-OFFSCREEN, { duration: 280 });
        runOnJS(onSwipe)('left');
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: isTop ? translateY.value : 12 },
      {
        rotate: `${interpolate(
          translateX.value,
          [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
          [-12, 0, 12],
          Extrapolation.CLAMP
        )}deg`,
      },
      {
        scale: isTop
          ? 1
          : interpolate(
              Math.abs(translateX.value),
              [0, SCREEN_WIDTH / 4],
              [0.95, 1],
              Extrapolation.CLAMP
            ),
      },
    ],
    opacity: isTop
      ? interpolate(
          Math.abs(translateX.value),
          [0, OFFSCREEN],
          [1, 0.6],
          Extrapolation.CLAMP
        )
      : 0.7,
  }));

  const saveOverlayStyle = useAnimatedStyle(() => ({
    opacity: isTop
      ? interpolate(translateX.value, [20, 90], [0, 1], Extrapolation.CLAMP)
      : 0,
  }));

  const skipOverlayStyle = useAnimatedStyle(() => ({
    opacity: isTop
      ? interpolate(translateX.value, [-20, -90], [0, 1], Extrapolation.CLAMP)
      : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[StyleSheet.absoluteFill, cardStyle]}>
        <RestaurantCard
          restaurant={restaurant}
          isActive={isTop}
          saveOverlayStyle={saveOverlayStyle}
          skipOverlayStyle={skipOverlayStyle}
        />
      </Animated.View>
    </GestureDetector>
  );
}

interface SwipeDeckProps {
  restaurants: Restaurant[];
  onSwipeRight: (restaurant: Restaurant) => void;
  onSwipeLeft: (restaurantId: string) => void;
}

export default function SwipeDeck({
  restaurants,
  onSwipeRight,
  onSwipeLeft,
}: SwipeDeckProps) {
  const handleSwipe = useCallback(
    (restaurant: Restaurant, dir: SwipeDirection) => {
      if (dir === 'right') onSwipeRight(restaurant);
      else onSwipeLeft(restaurant.id);
    },
    [onSwipeRight, onSwipeLeft]
  );

  const visible = restaurants.slice(0, 2);

  return (
    <View style={styles.deck}>
      {visible
        .slice()
        .reverse()
        .map((r, idx) => {
          const isTop = idx === visible.length - 1;
          return (
            <SwipeCard
              key={r.id}
              restaurant={r}
              isTop={isTop}
              onSwipe={(dir) => handleSwipe(r, dir)}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    position: 'relative',
  },
});

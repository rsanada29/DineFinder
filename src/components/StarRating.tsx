import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface Props {
  rating: number;
  size?: number;
}

function Star({ index, rating, size }: { index: number; rating: number; size: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  let fill: string;
  if (index < full) fill = '#FF6B35';
  else if (index === full && half) fill = 'url(#half)';
  else fill = '#ddd';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="half" x1="0" x2="1" y1="0" y2="0">
          <Stop offset="50%" stopColor="#FF6B35" />
          <Stop offset="50%" stopColor="#ddd" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={fill}
      />
    </Svg>
  );
}

export default function StarRating({ rating, size = 14 }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} index={i} rating={rating} size={size} />
      ))}
      <Text
        style={{
          fontSize: size - 1,
          fontWeight: '700',
          color: '#FF6B35',
          marginLeft: 4,
        }}
      >
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Poker chip with a dollar sign in the middle (ICM Value tab): chips turned into money. Drawn on a
// 24×24 grid in a single colour so it can be tinted like the other tab icons.
export default function ChipDollarIcon({ size = 24, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.3} fill="none" stroke={color} strokeWidth={1.8} />
      {/* six edge spots, every 60° */}
      <Path
        d="M12 2.7v2.4M12 18.9v2.4M3.95 7.35l2.08 1.2M17.97 15.45l2.08 1.2M3.95 16.65l2.08-1.2M17.97 8.55l2.08-1.2"
        stroke={color}
        strokeWidth={3}
      />
      {/* dollar sign */}
      <Path
        d="M14.5 9.7c-.4-.9-1.3-1.45-2.5-1.45-1.45 0-2.5.8-2.5 1.85 0 2.6 5.05 1.3 5.05 4 0 1.15-1.1 2-2.6 2-1.25 0-2.2-.55-2.6-1.55M12 6.8v1.5M12 15.7v1.5"
        fill="none"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

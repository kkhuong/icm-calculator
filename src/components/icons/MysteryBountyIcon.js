import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Crosshair scope with a question mark in the sight (Bounty tab): a bounty whose prize is a
// mystery. Drawn on a 24×24 grid in a single colour so it can be tinted like the other tab icons.
export default function MysteryBountyIcon({ size = 24, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.2} fill="none" stroke={color} strokeWidth={1.8} />
      {/* crosshair ticks */}
      <Path d="M12 1.6v3M12 19.4v3M1.6 12h3M19.4 12h3" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* question mark */}
      <Path d="M9.8 9.5a2.3 2.3 0 1 1 3.3 2.1c-.7.3-1.1.8-1.1 1.6v.3" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={16.2} r={1.1} fill={color} />
    </Svg>
  );
}

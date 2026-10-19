import React from 'react';
import Svg, { G, Path, Rect } from 'react-native-svg';

// Satellite (Satellite tab): body with a dish on top and two-cell solar panels either side, tilted
// 45°. Drawn on a 24×24 grid in a single colour so it can be tinted like the other tab icons.
export default function SatelliteIcon({ size = 24, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill={color} transform="translate(12 12) scale(0.92) rotate(-45) translate(-12 -12)">
        {/* solar panels */}
        <Rect x={1.2} y={9.6} width={3.1} height={4.8} rx={0.5} />
        <Rect x={4.9} y={9.6} width={3.1} height={4.8} rx={0.5} />
        <Rect x={16} y={9.6} width={3.1} height={4.8} rx={0.5} />
        <Rect x={19.7} y={9.6} width={3.1} height={4.8} rx={0.5} />
        {/* struts */}
        <Rect x={7.6} y={11.35} width={2.2} height={1.3} />
        <Rect x={14.2} y={11.35} width={2.2} height={1.3} />
        {/* body */}
        <Rect x={9.4} y={8.6} width={5.2} height={6.8} rx={1.1} />
        {/* dish on a short mast */}
        <Rect x={11.35} y={5.6} width={1.3} height={3.2} />
        <Path d="M9.6 5.4a2.4 2.4 0 0 0 4.8 0z" />
      </G>
    </Svg>
  );
}

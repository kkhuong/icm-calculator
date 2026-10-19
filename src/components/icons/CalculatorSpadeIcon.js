import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

// Calculator with a spade cut out of its display (Hand Equity tab). Drawn on a 24×24 grid in a
// single colour so it can be tinted like the SF/Material tab symbols.
export default function CalculatorSpadeIcon({ size = 24, color = '#000' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4.4} y={1.9} width={15.2} height={20.2} rx={3} fill="none" stroke={color} strokeWidth={1.8} />
      {/* display, with the spade as a hole (evenodd) so the background shows through */}
      <Path
        fill={color}
        fillRule="evenodd"
        d="M8.2 4.4h7.6a1.2 1.2 0 0 1 1.2 1.2v4.6a1.2 1.2 0 0 1-1.2 1.2H8.2A1.2 1.2 0 0 1 7 10.2V5.6a1.2 1.2 0 0 1 1.2-1.2z M12 5.1c-1.2 1.2-2.4 2-2.4 3.2 0 .8.6 1.4 1.4 1.4.4 0 .7-.2.9-.5l-.4 1.3h1l-.4-1.3c.2.3.5.5.9.5.8 0 1.4-.6 1.4-1.4 0-1.2-1.2-2-2.4-3.2z"
      />
      {/* 3×2 keypad */}
      {[13.2, 16.9].map((y) => [7, 10.7, 14.4].map((x) => (
        <Rect key={`${x}-${y}`} x={x} y={y} width={2.6} height={2.6} rx={0.6} fill={color} />
      )))}
    </Svg>
  );
}

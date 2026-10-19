import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { RANKS, SUITS, rankChar, cardOf } from '../lib/cards';
import { C, SUIT_COLORS } from '../theme';

const FACE_SIZE = { m: 20, l: 17, t: 15, s: 13 };

// Rank and suit symbol in the suit's colour, e.g. "A♠".
export function CardFace({ card, size = 'm' }) {
  return (
    <Text style={[st.face, { fontSize: FACE_SIZE[size], color: SUIT_COLORS[card & 3] }]}>
      {rankChar(card)}{SUITS[card & 3]}
    </Text>
  );
}

// A tappable card position (hole card, board or dead card). Narrower for 4- and 5-card hands.
export function CardSlot({ card, selected, onPress, hole = 2 }) {
  return (
    <Pressable
      onPress={onPress}
      style={[st.slot, hole === 4 && { width: 38 }, hole === 5 && { width: 34 }, card == null ? st.slotEmpty : st.slotFull, selected && st.slotSel]}
    >
      {card != null && <CardFace card={card} size={hole === 5 ? 't' : hole === 4 ? 'l' : 'm'} />}
    </Pressable>
  );
}

// Full deck as a 4 x 13 grid (one row per suit); cards in `used` are dimmed and ignored.
export function CardPicker({ used, onPick }) {
  const win = useWindowDimensions();
  const [gridW, setGridW] = useState(null); // measured, so it fits split view and iPad
  const cell = Math.floor(((gridW ?? win.width - 20) - 12 * 2) / 13);
  return (
    <View style={st.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width - 20)}>
      {SUITS.map((_, suit) => (
        <View key={suit} style={st.gridRow}>
          {RANKS.split('').map((_, ri) => {
            const card = cardOf(ri, suit);
            const taken = used.has(card);
            return (
              <Pressable key={card} onPress={() => !taken && onPick(card)} style={[st.cell, { width: cell }, taken && st.taken]}>
                <CardFace card={card} size="s" />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  face: { fontWeight: '800' },
  slot: { width: 46, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  slotEmpty: { borderColor: C.line, borderStyle: 'dashed', backgroundColor: C.bg },
  slotFull: { borderColor: C.text, backgroundColor: C.text },
  slotSel: { borderColor: C.amber, borderStyle: 'solid' },
  grid: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 6, gap: 3, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card },
  gridRow: { flexDirection: 'row', gap: 2 },
  cell: { height: 40, borderRadius: 5, backgroundColor: C.text, alignItems: 'center', justifyContent: 'center' },
  taken: { opacity: 0.18 },
});

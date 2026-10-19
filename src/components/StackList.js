import React, { useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { C } from '../theme';
import { s } from '../styles';
import { decimalText, num } from '../lib/format';

// One row per player: seat number, a stack box (chips or BB; "next" on the keyboard moves to the
// following row), and whatever result the screen renders for that player.
export default function StackList({ stacks, onChange, renderResult, resultWidth }) {
  const refs = useRef([]);
  const last = stacks.length - 1;
  return (
    <>
      {stacks.map((v, i) => (
        <View key={i} style={s.row}>
          <Text style={st.seat}>{i + 1}</Text>
          <TextInput
            ref={(r) => (refs.current[i] = r)}
            style={s.input}
            value={v}
            placeholder="Chips or BB"
            placeholderTextColor={C.dim}
            keyboardType="decimal-pad"
            returnKeyType={i === last ? 'done' : 'next'}
            blurOnSubmit={i === last}
            onSubmitEditing={() => refs.current[i + 1]?.focus()}
            onChangeText={(t) => onChange(i, decimalText(t))}
          />
          <View style={[s.result, resultWidth != null && { width: resultWidth }]}>{renderResult(i)}</View>
        </View>
      ))}
    </>
  );
}

// Parsed stack boxes. `filled` counts players with a stack above 0; a blank row is a player whose
// stack hasn't been typed yet, so results wait until every row is filled.
export function parseStacks(stacks) {
  const nums = stacks.map((v) => parseFloat(v) || 0);
  return {
    nums,
    total: nums.reduce((a, b) => a + b, 0),
    filled: nums.filter((n) => n > 0).length,
  };
}

// Grows (with blank rows) or shrinks the stack list to `n` players.
export const resizeStacks = (stacks, n) =>
  n > stacks.length ? [...stacks, ...Array(n - stacks.length).fill('')] : stacks.slice(0, n);

// "Total chips 60,000 · Average stack 10,000"
export const stackSummary = (total, players) =>
  `Total chips ${total.toLocaleString()} · Average stack ${num(total / players, 1)}`;

const st = StyleSheet.create({
  seat: { color: C.dim, fontSize: 13, fontWeight: '700', width: 18, textAlign: 'center' },
});

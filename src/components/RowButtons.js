import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';

// Full-width outlined "+ Add …" button under a list.
export function AddButton({ label, onPress }) {
  return (
    <Pressable style={st.add} onPress={onPress}>
      <Text style={st.addText}>{label}</Text>
    </Pressable>
  );
}

// "✕" button at the start of a list row that removes the row. Filled like the −/+ buttons so it
// reads as tappable, and dims while pressed.
export function RemoveButton({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel="Remove row"
      style={({ pressed }) => [st.del, pressed && st.pressed]}>
      <Text style={st.delText}>✕</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  add: { height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addText: { color: C.amber, fontSize: 15, fontWeight: '700' },
  del: { width: 30, height: 30, borderRadius: 8, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  delText: { color: C.text, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.5 },
});

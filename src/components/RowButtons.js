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

// Small "✕" at the start of a list row.
export function RemoveButton({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={st.del}>✕</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  add: { height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addText: { color: C.amber, fontSize: 15, fontWeight: '700' },
  del: { color: C.dim, fontSize: 16, width: 22, textAlign: 'center' },
});

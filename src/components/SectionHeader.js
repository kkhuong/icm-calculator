import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { s } from '../styles';

// Section heading with an optional "Clear" action on the right. `divider` adds a rule above it
// to separate it from the previous section.
export default function SectionHeader({ title, onClear, divider }) {
  return (
    <View style={[st.row, divider && st.divider]}>
      <Text style={s.head}>{title}</Text>
      {onClear && (
        <Pressable onPress={onClear}>
          <Text style={st.clear}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}

// The amber "Clear"-style text action, for use outside a section header.
export function TextAction({ label, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Text style={st.clear}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  divider: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  clear: { color: C.amber, fontSize: 14, fontWeight: '600', paddingVertical: 2, paddingLeft: 12 },
});

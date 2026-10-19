import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { C } from '../theme';
import { digitsText } from '../lib/format';

// −/+ buttons around a number you can also tap and type. Typed values apply when editing ends
// (not per keystroke, so typing "12" never passes through 1) and are clamped to min..max.
export default function Stepper({ label, value, onChange, min, max }) {
  const [draft, setDraft] = useState(null); // text being typed; null = show value
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const current = () => {
    const n = parseInt(draft, 10);
    return draft != null && !isNaN(n) ? clamp(n) : value;
  };
  const commit = () => {
    if (draft == null) return;
    const n = current();
    setDraft(null);
    if (n !== value) onChange(n);
  };
  const bump = (d) => { const n = clamp(current() + d); setDraft(null); onChange(n); };

  return (
    <View style={st.stepper}>
      <Text style={st.label}>{label}</Text>
      <View style={st.row}>
        <Pressable style={st.btn} onPress={() => bump(-1)}>
          <Text style={st.btnText}>−</Text>
        </Pressable>
        <TextInput
          style={st.value}
          value={draft ?? String(value)}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={String(max).length}
          onChangeText={(t) => setDraft(digitsText(t))}
          onBlur={commit}
          onSubmitEditing={commit}
        />
        <Pressable style={st.btn} onPress={() => bump(1)}>
          <Text style={st.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Lays steppers out side by side.
export function StepperRow({ children }) {
  return <View style={st.steppers}>{children}</View>;
}

const st = StyleSheet.create({
  steppers: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  stepper: { flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 6 },
  label: { color: C.dim, fontSize: 11, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 40, height: 40, borderRadius: 8, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: C.text, fontSize: 24, fontWeight: '600', marginTop: -2 },
  value: { color: C.amber, fontSize: 24, fontWeight: '800', textAlign: 'center', minWidth: 48, height: 40, padding: 0, paddingVertical: 0 },
});

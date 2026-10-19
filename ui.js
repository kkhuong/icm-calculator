import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

export const C = {
  bg: '#101A24', card: '#1A2835', line: '#2B3D4E', text: '#EEF2F5',
  dim: '#8DA0B2', amber: '#F2B84B', ink: '#101A24',
};

// Cleans typed text into a decimal number string: "," becomes "." (comma-decimal locales), and only
// digits and the first "." are kept.
export function decimalText(t) {
  const [whole, ...rest] = t.replace(/,/g, '.').replace(/[^0-9.]/g, '').split('.');
  return rest.length ? whole + '.' + rest.join('') : whole;
}

export const money = (n) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });

// TextInput with a fixed "$" in front of the value.
export function MoneyInput({ style, wrapStyle, ...props }) {
  return (
    <View style={[s.moneyWrap, wrapStyle]}>
      <TextInput style={[style, s.moneyInput]} {...props} />
      <Text style={s.moneySign} pointerEvents="none">$</Text>
    </View>
  );
}

// −/+ buttons around a number you can also tap and type. Typed values apply when editing ends
// (not per keystroke, so typing "12" never passes through 1) and are clamped to min..max.
export function Stepper({ label, value, onChange, min, max }) {
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
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{label}</Text>
      <View style={s.stepRow}>
        <Pressable style={s.stepBtn} onPress={() => bump(-1)}>
          <Text style={s.stepBtnText}>−</Text>
        </Pressable>
        <TextInput
          style={[s.stepValue, s.stepInput]}
          value={draft ?? String(value)}
          keyboardType="number-pad"
          returnKeyType="done"
          selectTextOnFocus
          maxLength={String(max).length}
          onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onSubmitEditing={commit}
        />
        <Pressable style={s.stepBtn} onPress={() => bump(1)}>
          <Text style={s.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 10, paddingBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 },
  title: { color: C.text, fontSize: 18, fontWeight: '800' },
  sub: { color: C.dim, fontSize: 12 },
  steppers: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  stepper: { flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 6 },
  stepLabel: { color: C.dim, fontSize: 11, marginBottom: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 40, height: 40, borderRadius: 8, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: C.text, fontSize: 24, fontWeight: '600', marginTop: -2 },
  stepValue: { color: C.amber, fontSize: 24, fontWeight: '800', minWidth: 36, textAlign: 'center' },
  stepInput: { minWidth: 48, height: 40, padding: 0, paddingVertical: 0 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  head: { color: C.text, fontSize: 14, fontWeight: '700' },
  clear: { color: C.amber, fontSize: 14, fontWeight: '600', paddingVertical: 2, paddingLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 10, padding: 4, marginBottom: 3, gap: 6 },
  seat: { color: C.dim, fontSize: 13, fontWeight: '700', width: 18, textAlign: 'center' },
  input: { flex: 1, height: 40, backgroundColor: C.bg, borderRadius: 8, borderWidth: 1, borderColor: C.line, color: C.text, fontSize: 18, fontWeight: '600', paddingHorizontal: 10 },
  result: { width: 112, alignItems: 'flex-end' },
  pct: { color: C.amber, fontSize: 18, fontWeight: '800' },
  pctDim: { color: C.dim, fontSize: 18 },
  barBg: { width: '100%', height: 3, borderRadius: 2, backgroundColor: C.line, marginTop: 1 },
  bar: { height: 3, borderRadius: 2, backgroundColor: C.amber },
  chips: { color: C.dim, fontSize: 10, marginTop: 1 },
  moneyWrap: { flex: 1, justifyContent: 'center' },
  moneyInput: { flex: 0, paddingLeft: 22 },
  moneySign: { position: 'absolute', left: 10, color: C.dim, fontSize: 16, fontWeight: '600' },
  foot: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
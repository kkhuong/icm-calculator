import { StyleSheet } from 'react-native';
import { C } from './theme';

// Styles shared across screens. Component-specific styles live with their component.
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 10, paddingBottom: 16 },
  head: { color: C.text, fontSize: 14, fontWeight: '700' },
  sub: { color: C.dim, fontSize: 12 },
  // A list row: card background, children laid out horizontally.
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 10, padding: 4, marginBottom: 3, gap: 6 },
  input: { flex: 1, height: 40, backgroundColor: C.bg, borderRadius: 8, borderWidth: 1, borderColor: C.line, color: C.text, fontSize: 18, fontWeight: '600', paddingHorizontal: 10 },
  // Right-hand result column of a row.
  result: { width: 112, alignItems: 'flex-end' },
  pct: { color: C.amber, fontSize: 18, fontWeight: '800' },
  pctDim: { color: C.dim, fontSize: 18 },
  chips: { color: C.dim, fontSize: 10, marginTop: 1 },
  hint: { color: C.amber, fontSize: 12, marginTop: 6 },
  foot: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 4 },
});

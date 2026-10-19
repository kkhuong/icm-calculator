import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Dimensions } from 'react-native';
import { C } from './ui';
import { cellLabel, rangeStats, topPercent, emptyRange } from './ranges';

const W = Dimensions.get('window').width;
const CELL_W = Math.floor((W - 20) / 13);
const CELL_H = 34;
const PRESETS = [5, 10, 15, 20, 30, 50];

export default function RangeEditor({ visible, title, value, onChange, onClose }) {
  const cur = useRef(value);
  const paintTo = useRef(1);
  const last = useRef(-1);
  useEffect(() => { cur.current = value; }, [value]);

  const sel = value || emptyRange();
  const st = rangeStats(sel);

  const cellFrom = (e) => {
    const { locationX: px, locationY: py } = e.nativeEvent;
    const c = Math.floor(px / CELL_W), r = Math.floor(py / CELL_H);
    return c < 0 || c > 12 || r < 0 || r > 12 ? -1 : r * 13 + c;
  };
  const paint = (i) => {
    if (i < 0 || i === last.current || !cur.current) return;
    last.current = i;
    const next = cur.current.slice();
    next[i] = paintTo.current;
    cur.current = next;
    onChange(next);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onDismiss={onClose}>
      <View style={m.wrap}>
        <View style={m.head}>
          <View>
            <Text style={m.title}>{title}</Text>
            <Text style={m.sub}>{st.combos} combos · {st.pct.toFixed(1)}% of hands</Text>
          </View>
          <Pressable style={m.done} onPress={onClose}><Text style={m.doneText}>Done</Text></Pressable>
        </View>

        <View style={m.presets}>
          {PRESETS.map((p) => (
            <Pressable key={p} style={m.chip} onPress={() => onChange(topPercent(p))}><Text style={m.chipText}>Top {p}%</Text></Pressable>
          ))}
          <Pressable style={m.chip} onPress={() => onChange(Array(169).fill(1))}><Text style={m.chipText}>All</Text></Pressable>
          <Pressable style={m.chip} onPress={() => onChange(emptyRange())}><Text style={m.chipText}>Clear</Text></Pressable>
        </View>

        <View
          style={m.grid}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={(e) => {
            const i = cellFrom(e);
            last.current = -1;
            paintTo.current = i >= 0 && cur.current && cur.current[i] ? 0 : 1;
            paint(i);
          }}
          onResponderMove={(e) => paint(cellFrom(e))}
        >
          {Array.from({ length: 13 }, (_, r) => (
            <View key={r} style={m.gridRow} pointerEvents="none">
              {Array.from({ length: 13 }, (_, c) => {
                const on = sel[r * 13 + c];
                return (
                  <View key={c} style={[m.cell, r === c ? m.pair : r < c ? m.suited : m.off, on && m.on]}>
                    <Text style={[m.cellText, on && m.cellTextOn]}>{cellLabel(r, c)}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <Text style={m.legend}>Pairs on the diagonal, suited above, offsuit below. Tap or drag to select.</Text>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, padding: 10, paddingTop: 16 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { color: C.text, fontSize: 18, fontWeight: '800' },
  sub: { color: C.dim, fontSize: 13, marginTop: 2 },
  done: { backgroundColor: C.amber, borderRadius: 10, paddingHorizontal: 18, height: 40, justifyContent: 'center' },
  doneText: { color: C.ink, fontSize: 16, fontWeight: '800' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: { backgroundColor: C.card, borderRadius: 8, paddingHorizontal: 10, height: 34, justifyContent: 'center' },
  chipText: { color: C.text, fontSize: 14, fontWeight: '600' },
  grid: { width: CELL_W * 13, alignSelf: 'center' },
  gridRow: { flexDirection: 'row' },
  cell: { width: CELL_W, height: CELL_H, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: C.bg },
  pair: { backgroundColor: '#2A4157' },
  suited: { backgroundColor: '#203447' },
  off: { backgroundColor: '#18283A' },
  on: { backgroundColor: C.amber },
  cellText: { color: C.dim, fontSize: 9.5, fontWeight: '700' },
  cellTextOn: { color: C.ink },
  legend: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 10 },
});

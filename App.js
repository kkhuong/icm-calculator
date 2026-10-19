import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cashProbabilities } from './icm';

const KEY = 'gto-finance-v1';
const MAX_PLAYERS = 30;
const C = {
  bg: '#101A24', card: '#1A2835', line: '#2B3D4E', text: '#EEF2F5',
  dim: '#8DA0B2', amber: '#F2B84B', ink: '#101A24',
};

function Stepper({ label, value, onChange, min, max }) {
  return (
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{label}</Text>
      <View style={s.stepRow}>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
          <Text style={s.stepBtnText}>−</Text>
        </Pressable>
        <Text style={s.stepValue}>{value}</Text>
        <Pressable style={s.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}>
          <Text style={s.stepBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Main() {
  const insets = useSafeAreaInsets();
  const [players, setPlayers] = useState(6);
  const [paid, setPaid] = useState(3);
  const [stacks, setStacks] = useState(Array(6).fill(''));
  const [loaded, setLoaded] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw);
          setPlayers(d.players); setPaid(d.paid); setStacks(d.stacks);
        } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ players, paid, stacks })).catch(() => {});
  }, [players, paid, stacks, loaded]);

  const setCount = (n) => {
    setPlayers(n);
    setPaid((p) => Math.min(p, n - 1));
    setStacks((st) => (n > st.length ? [...st, ...Array(n - st.length).fill('')] : st.slice(0, n)));
  };

  const nums = stacks.map((v) => parseFloat(v) || 0);
  const total = nums.reduce((a, b) => a + b, 0);
  const probs = useMemo(() => cashProbabilities(nums, paid), [stacks, paid]);
  const filled = nums.filter((n) => n > 0).length;

  return (
    <View style={[s.safe, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <Text style={s.title}>GTO Finance</Text>
          <Text style={s.sub}>Satellite ICM: chance to take a seat</Text>

          <View style={s.steppers}>
            <Stepper label="Players left" value={players} min={2} max={MAX_PLAYERS} onChange={setCount} />
            <Stepper label="Seats awarded" value={paid} min={1} max={players - 1} onChange={setPaid} />
          </View>

          <View style={s.headRow}>
            <Text style={s.head}>Chip stacks</Text>
            <Pressable onPress={() => setStacks(Array(players).fill(''))}>
              <Text style={s.clear}>Clear</Text>
            </Pressable>
          </View>

          {stacks.map((v, i) => {
            const p = probs[i] || 0;
            const chipShare = total > 0 ? (nums[i] / total) * 100 : 0;
            return (
              <View key={i} style={s.row}>
                <Text style={s.seat}>{i + 1}</Text>
                <TextInput
                  ref={(r) => (refs.current[i] = r)}
                  style={s.input}
                  value={v}
                  placeholder="Stack"
                  placeholderTextColor={C.dim}
                  keyboardType="number-pad"
                  returnKeyType={i === players - 1 ? 'done' : 'next'}
                  blurOnSubmit={i === players - 1}
                  onSubmitEditing={() => refs.current[i + 1]?.focus()}
                  onChangeText={(t) => setStacks((st) => st.map((x, k) => (k === i ? t.replace(/[^0-9]/g, '') : x)))}
                />
                <View style={s.result}>
                  {nums[i] > 0 && filled > 0 ? (
                    <>
                      <Text style={s.pct}>{(p * 100).toFixed(1)}%</Text>
                      <View style={s.barBg}><View style={[s.bar, { width: `${p * 100}%` }]} /></View>
                      <Text style={s.chips}>{chipShare.toFixed(1)}% of chips</Text>
                    </>
                  ) : (
                    <Text style={s.pctDim}>–</Text>
                  )}
                </View>
              </View>
            );
          })}

          <Text style={s.foot}>
            {total > 0 ? `Total ${total.toLocaleString()} chips · average ${Math.round(total / Math.max(filled, 1)).toLocaleString()}` : 'Enter each player’s chips to see their chance of a seat.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 16, paddingBottom: 120 },
  title: { color: C.text, fontSize: 28, fontWeight: '800' },
  sub: { color: C.dim, fontSize: 15, marginTop: 2, marginBottom: 16 },
  steppers: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stepper: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 12 },
  stepLabel: { color: C.dim, fontSize: 14, marginBottom: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 52, height: 52, borderRadius: 12, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { color: C.text, fontSize: 28, fontWeight: '600', marginTop: -2 },
  stepValue: { color: C.amber, fontSize: 34, fontWeight: '800', minWidth: 44, textAlign: 'center' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  head: { color: C.text, fontSize: 18, fontWeight: '700' },
  clear: { color: C.amber, fontSize: 16, fontWeight: '600', padding: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 10, marginBottom: 8, gap: 10 },
  seat: { color: C.dim, fontSize: 16, fontWeight: '700', width: 22, textAlign: 'center' },
  input: { flex: 1, height: 56, backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.line, color: C.text, fontSize: 24, fontWeight: '600', paddingHorizontal: 12 },
  result: { width: 112, alignItems: 'flex-end' },
  pct: { color: C.amber, fontSize: 24, fontWeight: '800' },
  pctDim: { color: C.dim, fontSize: 24 },
  barBg: { width: '100%', height: 5, borderRadius: 3, backgroundColor: C.line, marginTop: 3 },
  bar: { height: 5, borderRadius: 3, backgroundColor: C.amber },
  chips: { color: C.dim, fontSize: 12, marginTop: 3 },
  foot: { color: C.dim, fontSize: 14, textAlign: 'center', marginTop: 12 },
});
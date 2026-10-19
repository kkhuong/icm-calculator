import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { icmEquity } from './icm';
import { C, Stepper, s } from './ui';

const KEY = 'gto-finance-icm-v1';
const MAX_PLAYERS = 30;
const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const ord = (n) => n + (['th', 'st', 'nd', 'rd'][(n % 100 >> 3) ^ 1 && n % 10 < 4 ? n % 10 : 0]);

export default function IcmScreen() {
  const [players, setPlayers] = useState(6);
  const [places, setPlaces] = useState(3);
  const [stacks, setStacks] = useState(Array(6).fill(''));
  const [prizes, setPrizes] = useState(Array(MAX_PLAYERS).fill(''));
  const [loaded, setLoaded] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw);
          setPlayers(d.players); setPlaces(d.places); setStacks(d.stacks); setPrizes(d.prizes);
        } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ players, places, stacks, prizes })).catch(() => {});
  }, [players, places, stacks, prizes, loaded]);

  const setCount = (n) => {
    setPlayers(n);
    setPlaces((p) => Math.min(p, n));
    setStacks((x) => (n > x.length ? [...x, ...Array(n - x.length).fill('')] : x.slice(0, n)));
  };

  const nums = stacks.map((v) => parseFloat(v) || 0);
  const pay = prizes.slice(0, places).map((v) => parseFloat(v) || 0);
  const total = nums.reduce((a, b) => a + b, 0);
  const pool = pay.reduce((a, b) => a + b, 0);
  const filled = nums.filter((n) => n > 0).length;
  // Blank rows would otherwise be treated as absent players, leaving their prizes unassigned.
  const ready = filled === players && pool > 0;
  const eq = useMemo(() => (ready ? icmEquity(nums, pay) : []), [stacks, prizes, places, ready]);

  // Don't accept input until saved state has loaded, or the load would overwrite it.
  if (!loaded) return <View style={s.safe} />;

  return (
    <View style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={s.titleRow}><Text style={s.title}>GTO Finance</Text><Text style={s.sub}>Fair value of each stack</Text></View>

          <View style={s.steppers}>
            <Stepper label="Players left" value={players} min={2} max={MAX_PLAYERS} onChange={setCount} />
            <Stepper label="Paid places" value={places} min={1} max={players} onChange={setPlaces} />
          </View>

          <View style={s.headRow}>
            <Text style={s.head}>Payouts</Text>
            <Pressable onPress={() => setPrizes(Array(MAX_PLAYERS).fill(''))}>
              <Text style={s.clear}>Clear</Text>
            </Pressable>
          </View>
          <View style={x.grid}>
            {Array.from({ length: places }, (_, i) => (
              <View key={i} style={x.prizeCell}>
                <Text style={x.place}>{ord(i + 1)}</Text>
                <TextInput
                  style={x.prizeInput}
                  value={prizes[i]}
                  placeholder="0"
                  placeholderTextColor={C.dim}
                  keyboardType="decimal-pad"
                  onChangeText={(t) => setPrizes((p) => p.map((v, k) => (k === i ? t.replace(/,/g, '.').replace(/[^0-9.]/g, '') : v)))}
                />
              </View>
            ))}
          </View>

          <View style={[s.headRow, x.divider]}>
            <Text style={s.head}>Chip stacks</Text>
            <Pressable onPress={() => setStacks(Array(players).fill(''))}>
              <Text style={s.clear}>Clear</Text>
            </Pressable>
          </View>

          {stacks.map((v, i) => {
            const share = total > 0 ? nums[i] / total : 0;
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
                  onChangeText={(t) => setStacks((st) => st.map((q, k) => (k === i ? t.replace(/[^0-9]/g, '') : q)))}
                />
                <View style={[s.result, { width: 140 }]}>
                  {ready ? (
                    <>
                      <Text style={s.pct}>{fmt(eq[i])}</Text>
                      <View style={s.barBg}><View style={[s.bar, { width: `${(eq[i] / pool) * 100}%` }]} /></View>
                      <Text style={s.chips} numberOfLines={1} adjustsFontSizeToFit>chip value {fmt(share * pool)} ({(share * 100).toFixed(1)}%)</Text>
                    </>
                  ) : (
                    <Text style={s.pctDim}>–</Text>
                  )}
                </View>
              </View>
            );
          })}

          <Text style={s.foot}>
            {pool > 0 ? `Prize pool ${fmt(pool)} · ${ready ? fmt(total) + ' chips' : `enter all ${players} stacks (${filled} entered)`}` : 'Enter the payouts and each player’s chips.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const x = StyleSheet.create({
  divider: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  prizeCell: { width: '49%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 10, padding: 3, gap: 3 },
  place: { color: C.dim, fontSize: 12, fontWeight: '700', width: 26, textAlign: 'center' },
  prizeInput: { flex: 1, height: 34, backgroundColor: C.bg, borderRadius: 8, borderWidth: 1, borderColor: C.line, color: C.text, fontSize: 16, fontWeight: '600', paddingHorizontal: 10 },
});
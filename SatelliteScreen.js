import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cashProbabilities } from './icm';
import { C, Stepper, s } from './ui';

const KEY = 'gto-finance-v1';
const MAX_PLAYERS = 30;

export default function SatelliteScreen() {
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
    <View style={s.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={s.titleRow}><Text style={s.title}>GTO Finance</Text><Text style={s.sub}>Chance to win a seat</Text></View>

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
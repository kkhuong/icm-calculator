import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Keyboard, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import SatelliteScreen from './SatelliteScreen';
import IcmScreen from './IcmScreen';
import EquityScreen from './EquityScreen';
import BountyScreen from './BountyScreen';
import { C } from './ui';

const TABS = [
  { id: 'sat', label: 'Satellite' },
  { id: 'icm', label: 'ICM value' },
  { id: 'eq', label: 'Equity' },
  { id: 'mb', label: 'Bounty' },
];

function Main() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('sat');
  const [kb, setKb] = useState(false);

  useEffect(() => {
    const a = Keyboard.addListener('keyboardWillShow', () => setKb(true));
    const b = Keyboard.addListener('keyboardDidShow', () => setKb(true));
    const c = Keyboard.addListener('keyboardWillHide', () => setKb(false));
    const d = Keyboard.addListener('keyboardDidHide', () => setKb(false));
    return () => [a, b, c, d].forEach((l) => l.remove());
  }, []);

  return (
    <View style={[st.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      {/* All screens stay mounted so nothing you typed is lost when switching tabs */}
      <View style={[st.screen, tab !== 'sat' && st.hidden]}><SatelliteScreen /></View>
      <View style={[st.screen, tab !== 'icm' && st.hidden]}><IcmScreen /></View>
      <View style={[st.screen, tab !== 'eq' && st.hidden]}><EquityScreen /></View>
      <View style={[st.screen, tab !== 'mb' && st.hidden]}><BountyScreen /></View>
      {!kb && (
        <View style={[st.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map((t) => (
            <Pressable key={t.id} style={st.tab} onPress={() => setTab(t.id)}>
              <View style={[st.pill, tab === t.id && st.pillOn]}>
                <Text style={[st.label, tab === t.id && st.labelOn]} numberOfLines={1} adjustsFontSizeToFit>{t.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
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

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1 },
  hidden: { display: 'none' },
  bar: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, paddingHorizontal: 8, gap: 4 },
  tab: { flex: 1 },
  pill: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: C.amber },
  label: { color: C.dim, fontSize: 15, fontWeight: '700', paddingHorizontal: 4 },
  labelOn: { color: C.ink },
});
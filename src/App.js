import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Keyboard, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import SatelliteScreen from './screens/SatelliteScreen';
import IcmScreen from './screens/IcmScreen';
import EquityScreen from './screens/EquityScreen';
import BountyScreen from './screens/BountyScreen';
import { C } from './theme';

const TABS = [
  { id: 'sat', label: 'Satellite', Screen: SatelliteScreen },
  { id: 'icm', label: 'ICM Value', Screen: IcmScreen },
  { id: 'eq', label: 'Hand Equity', Screen: EquityScreen },
  { id: 'mb', label: 'Bounty', Screen: BountyScreen },
];

function Main() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('sat');
  const [kb, setKb] = useState(false);

  // The tab bar hides while the keyboard is up so it doesn't sit on top of the inputs.
  useEffect(() => {
    const a = Keyboard.addListener('keyboardWillShow', () => setKb(true));
    const b = Keyboard.addListener('keyboardDidShow', () => setKb(true));
    const c = Keyboard.addListener('keyboardWillHide', () => setKb(false));
    const d = Keyboard.addListener('keyboardDidHide', () => setKb(false));
    return () => [a, b, c, d].forEach((l) => l.remove());
  }, []);

  return (
    <View style={[st.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <StatusBar barStyle="light-content" />
      {/* All screens stay mounted so nothing you typed is lost when switching tabs */}
      {TABS.map(({ id, Screen }) => (
        <View key={id} style={[st.screen, tab !== id && st.hidden]}><Screen /></View>
      ))}
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
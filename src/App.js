import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Keyboard, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import CalculatorSpadeIcon from './components/icons/CalculatorSpadeIcon';
import SatelliteIcon from './components/icons/SatelliteIcon';
import MysteryBountyIcon from './components/icons/MysteryBountyIcon';
import ChipDollarIcon from './components/icons/ChipDollarIcon';
import SatelliteScreen from './screens/SatelliteScreen';
import IcmScreen from './screens/IcmScreen';
import EquityScreen from './screens/EquityScreen';
import BountyScreen from './screens/BountyScreen';
import { C } from './theme';

// Tab icons are custom SVGs in components/icons (taking size and color), so they look the same
// on iOS and Android.
const TABS = [
  { id: 'sat', label: 'Satellite', Screen: SatelliteScreen, Icon: SatelliteIcon },
  { id: 'icm', label: 'ICM Value', Screen: IcmScreen, Icon: ChipDollarIcon },
  { id: 'eq', label: 'Hand Equity', Screen: EquityScreen, Icon: CalculatorSpadeIcon },
  { id: 'mb', label: 'Bounty', Screen: BountyScreen, Icon: MysteryBountyIcon },
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
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable key={t.id} style={st.tab} onPress={() => setTab(t.id)}
                accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={t.label}>
                <View style={[st.iconPill, on && st.iconPillOn]}>
                  <t.Icon size={22} color={on ? C.amber : C.dim} />
                </View>
                <Text style={[st.label, on && st.labelOn]} numberOfLines={1} adjustsFontSizeToFit>{t.label}</Text>
              </Pressable>
            );
          })}
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
  bar: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6, paddingHorizontal: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  // Soft amber pill behind the active tab's icon.
  iconPill: { width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconPillOn: { backgroundColor: 'rgba(242, 184, 75, 0.18)' },
  label: { color: C.dim, fontSize: 11, fontWeight: '600', marginTop: 3, paddingHorizontal: 2 },
  labelOn: { color: C.amber, fontWeight: '800' },
});
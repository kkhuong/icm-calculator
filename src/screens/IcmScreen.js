import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import usePersistentState from '../hooks/usePersistentState';
import { icmEquity, findPayoutMisorder } from '../lib/icm';
import { money, ordinal, pct, decimalText } from '../lib/format';
import FormScreen from '../components/Screen';
import Stepper, { StepperRow } from '../components/Stepper';
import SectionHeader from '../components/SectionHeader';
import MoneyInput from '../components/MoneyInput';
import StackList, { parseStacks, resizeStacks, stackSummary } from '../components/StackList';
import { Bar, NoResult } from '../components/Result';
import { C } from '../theme';
import { s } from '../styles';

const STORAGE_KEY = 'gto-finance-icm-v1';
const MAX_PLAYERS = 30;

// Fair (ICM) dollar value of each stack given the payout structure.
export default function IcmScreen() {
  const [{ players, places, stacks, prizes }, update, loaded] = usePersistentState(STORAGE_KEY, {
    players: 6, places: 3, stacks: Array(6).fill(''), prizes: Array(MAX_PLAYERS).fill(''),
  });

  const setPlayers = (n) => update((cur) => ({
    players: n,
    places: Math.min(cur.places, n),
    stacks: resizeStacks(cur.stacks, n),
  }));
  const setStack = (i, v) => update((cur) => ({ stacks: cur.stacks.map((x, k) => (k === i ? v : x)) }));
  const setPrize = (i, v) => update((cur) => ({ prizes: cur.prizes.map((x, k) => (k === i ? v : x)) }));
  // Reorder the typed payouts highest-first (blanks last), leaving places beyond the paid ones alone.
  const sortPrizes = () => update((cur) => ({
    prizes: [
      ...cur.prizes.slice(0, places).sort((a, b) => (parseFloat(b) || 0) - (parseFloat(a) || 0)),
      ...cur.prizes.slice(places),
    ],
  }));

  const { nums, total, filled } = parseStacks(stacks);
  const typed = prizes.slice(0, places).map((v) => parseFloat(v) || 0);
  const misorder = findPayoutMisorder(typed); // warns about the boxes; tapping it only tidies them
  // The calculation always treats the highest payout as 1st, next highest as 2nd, and so on.
  const pay = typed.slice().sort((a, b) => b - a);
  const pool = pay.reduce((a, b) => a + b, 0);
  // Blank rows would otherwise be treated as absent players, leaving their prizes unassigned.
  const ready = filled === players && pool > 0;
  const eq = useMemo(() => (ready ? icmEquity(nums, pay) : []), [stacks, prizes, places, ready]);

  if (!loaded) return <View style={s.safe} />;

  return (
    <FormScreen subtitle="Fair value of each stack">
      <StepperRow>
        <Stepper label="Players left" value={players} min={2} max={MAX_PLAYERS} onChange={setPlayers} />
        <Stepper label="Paid places" value={places} min={1} max={players} onChange={(n) => update({ places: n })} />
      </StepperRow>

      <SectionHeader title="Payouts" onClear={() => update({ prizes: Array(MAX_PLAYERS).fill('') })} />
      <View style={st.grid}>
        {Array.from({ length: places }, (_, i) => (
          <View key={i} style={st.prizeCell}>
            <Text style={st.place}>{ordinal(i + 1)}</Text>
            <MoneyInput
              style={st.prizeInput}
              value={prizes[i]}
              placeholder="0"
              placeholderTextColor={C.dim}
              keyboardType="decimal-pad"
              onChangeText={(t) => setPrize(i, decimalText(t))}
            />
          </View>
        ))}
      </View>
      {misorder && (
        <Pressable onPress={sortPrizes} hitSlop={6}>
          <Text style={st.warn}>
            {ordinal(misorder.lower + 1)} pays more than {ordinal(misorder.higher + 1)} — <Text style={st.warnLink}>tap to sort</Text>
          </Text>
        </Pressable>
      )}

      <SectionHeader title="Chip Stacks" divider onClear={() => update({ stacks: Array(players).fill('') })} />
      <StackList
        stacks={stacks}
        onChange={setStack}
        resultWidth={140}
        renderResult={(i) => {
          if (!ready) return <NoResult />;
          const share = total > 0 ? nums[i] / total : 0;
          return (
            <>
              <Text style={s.pct}>{money(eq[i])}</Text>
              <Bar fraction={eq[i] / pool} />
              <Text style={s.chips} numberOfLines={1} adjustsFontSizeToFit>chip value {money(share * pool)} ({pct(share)}%)</Text>
            </>
          );
        }}
      />

      <Text style={s.foot}>
        {pool > 0
          ? `Prize pool ${money(pool)} · ${ready ? stackSummary(total, players) : `enter all ${players} stacks (${filled} entered)`}`
          : 'Enter the payouts and each player’s chips.'}
      </Text>
    </FormScreen>
  );
}

const st = StyleSheet.create({
  warn: { color: C.amber, fontSize: 13, marginTop: 6 },
  warnLink: { fontWeight: '800', textDecorationLine: 'underline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  prizeCell: { width: '49%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 10, padding: 3, gap: 3 },
  place: { color: C.dim, fontSize: 12, fontWeight: '700', width: 26, textAlign: 'center' },
  prizeInput: { flex: 1, height: 34, backgroundColor: C.bg, borderRadius: 8, borderWidth: 1, borderColor: C.line, color: C.text, fontSize: 16, fontWeight: '600', paddingHorizontal: 10 },
});

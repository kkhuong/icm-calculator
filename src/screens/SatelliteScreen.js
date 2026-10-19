import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import usePersistentState from '../hooks/usePersistentState';
import { cashProbabilities } from '../lib/satellite';
import { pct } from '../lib/format';
import FormScreen from '../components/Screen';
import Stepper, { StepperRow } from '../components/Stepper';
import SectionHeader from '../components/SectionHeader';
import StackList, { parseStacks, resizeStacks, stackSummary } from '../components/StackList';
import { Bar, NoResult } from '../components/Result';
import { s } from '../styles';

// Storage key from when the app was satellite-only; kept so saved data survives updates.
const STORAGE_KEY = 'gto-finance-v1';
const MAX_PLAYERS = 200;

// Chance each player finishes in the top `paid` places, i.e. wins a seat.
export default function SatelliteScreen() {
  const [{ players, paid, stacks }, update, loaded] = usePersistentState(STORAGE_KEY, {
    players: 9, paid: 3, stacks: Array(9).fill(''),
  });

  const setPlayers = (n) => update((cur) => ({
    players: n,
    paid: Math.min(cur.paid, n - 1),
    stacks: resizeStacks(cur.stacks, n),
  }));
  const setStack = (i, v) => update((cur) => ({ stacks: cur.stacks.map((x, k) => (k === i ? v : x)) }));

  const { nums, total, filled } = parseStacks(stacks);
  // Blank rows would otherwise be treated as absent players and inflate everyone else's odds.
  const ready = filled === players;
  const probs = useMemo(() => (ready ? cashProbabilities(nums, paid) : []), [stacks, paid, ready]);

  if (!loaded) return <View style={s.safe} />;

  return (
    <FormScreen title="Chance to win a seat">
      <StepperRow>
        <Stepper label="Players left" value={players} min={2} max={MAX_PLAYERS} onChange={setPlayers} />
        <Stepper label="Seats awarded" value={paid} min={1} max={players - 1} onChange={(n) => update({ paid: n })} />
      </StepperRow>

      <SectionHeader title="Chip Stacks" onClear={() => update({ stacks: Array(players).fill('') })} />
      <StackList
        stacks={stacks}
        onChange={setStack}
        renderResult={(i) => (ready ? (
          <>
            <Text style={s.pct}>{pct(probs[i] || 0)}%</Text>
            <Bar fraction={probs[i] || 0} />
            <Text style={s.chips}>{pct(total > 0 ? nums[i] / total : 0)}% of chips</Text>
          </>
        ) : <NoResult />)}
      />

      <Text style={s.foot}>
        {ready ? stackSummary(total, players)
          : filled > 0 ? `Enter all ${players} stacks to see the odds (${filled} of ${players} entered).`
          : 'Enter each player’s chips to see their chance of a seat.'}
      </Text>
    </FormScreen>
  );
}

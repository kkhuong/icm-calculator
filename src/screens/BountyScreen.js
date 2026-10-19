import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import usePersistentState from '../hooks/usePersistentState';
import { bountyStats, bountyInChips, requiredEquity } from '../lib/bounty';
import { money, num, pct, decimalText, digitsText } from '../lib/format';
import FormScreen from '../components/Screen';
import SectionHeader from '../components/SectionHeader';
import MoneyInput from '../components/MoneyInput';
import { AddButton, RemoveButton } from '../components/RowButtons';
import { Bar, NoResult } from '../components/Result';
import { C } from '../theme';
import { s } from '../styles';

const STORAGE_KEY = 'gto-finance-bounty-v1';
const MAX_TIERS = 20;
const blank = () => ({ amount: '', count: '' });
const EMPTY_SPOT = { prizeLeft: '', chips: '', bb: '', pot: '', call: '' };

// Labelled number box used in the chip-value and calling sections.
function Field({ label, value, onChange, decimalPad, isMoney }) {
  const Input = isMoney ? MoneyInput : TextInput;
  return (
    <View style={st.field}>
      <Text style={st.fieldLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <Input
        wrapStyle={isMoney ? st.fieldWrap : undefined}
        style={[s.input, st.fieldInput]}
        value={value}
        placeholder="0"
        placeholderTextColor={C.dim}
        keyboardType={decimalPad ? 'decimal-pad' : 'number-pad'}
        onChangeText={(t) => onChange(decimalPad ? decimalText(t) : digitsText(t))}
      />
    </View>
  );
}

// Mystery bounty value: the average bounty left in the pool, its worth in chips, and how it
// lowers the equity needed to call an all-in.
export default function BountyScreen() {
  const [{ tiers, spot }, update, loaded] = usePersistentState(STORAGE_KEY, {
    tiers: [blank(), blank(), blank()], spot: EMPTY_SPOT,
  });

  const setTiers = (fn) => update((cur) => ({ tiers: fn(cur.tiers) }));
  const setSpot = (patch) => update((cur) => ({ spot: { ...EMPTY_SPOT, ...cur.spot, ...patch } }));
  const setField = (field) => (v) => setSpot({ [field]: v });

  const edit = (i, field, v) => setTiers((ts) => ts.map((t, k) => (k === i ? { ...t, [field]: v } : t)));
  // One bounty of this size was just pulled: take it out of the pool.
  const drawn = (i) => setTiers((ts) => ts.map((t, k) => (k === i ? { ...t, count: String(Math.max(0, (parseInt(t.count, 10) || 0) - 1)) } : t)));
  const remove = (i) => setTiers((ts) => (ts.length > 1 ? ts.filter((_, k) => k !== i) : [blank()]));

  const stats = bountyStats(tiers.map((t) => ({ amount: parseFloat(t.amount) || 0, count: parseInt(t.count, 10) || 0 })));
  const value = (k) => parseFloat(spot[k]) || 0;
  const inChips = bountyInChips(stats.ev, value('prizeLeft'), value('chips'), value('bb'));
  const need = requiredEquity(value('pot'), value('call'), inChips ? inChips.chips : 0);

  if (!loaded) return <View style={s.safe} />;

  return (
    <FormScreen subtitle="Mystery bounty value">
      <View style={st.card}>
        <Text style={st.cardLabel}>Each knockout's expected worth</Text>
        <Text style={st.ev}>{stats.count ? money(stats.ev) : '–'}</Text>
        <Text style={st.cardSub}>
          {stats.count
            ? `${stats.count.toLocaleString()} bounties left · ${money(stats.pool)} in the pool`
            : 'Enter each bounty size and how many are left.'}
        </Text>
        {stats.count > 0 && (
          <Text style={st.cardSub}>
            Top bounty {money(stats.top)} · Standard deviation ±{money(stats.sd)}
          </Text>
        )}
      </View>

      <SectionHeader title="Mystery Bounties left" onClear={() => update({ tiers: [blank(), blank(), blank()] })} />
      {tiers.map((t, i) => {
        const p = stats.p[i];
        return (
          <View key={i} style={s.row}>
            <RemoveButton onPress={() => remove(i)} />
            <MoneyInput
              style={s.input}
              value={t.amount}
              placeholder="Bounty"
              placeholderTextColor={C.dim}
              keyboardType="decimal-pad"
              onChangeText={(v) => edit(i, 'amount', decimalText(v))}
            />
            <Text style={st.times}>×</Text>
            <TextInput
              style={[s.input, st.count]}
              value={t.count}
              placeholder="Left"
              placeholderTextColor={C.dim}
              keyboardType="number-pad"
              onChangeText={(v) => edit(i, 'count', digitsText(v))}
            />
            <Pressable style={st.minus} onPress={() => drawn(i)}><Text style={st.minusText}>−</Text></Pressable>
            <View style={[s.result, st.result]}>
              {p > 0 ? (
                <>
                  <Text style={st.pct}>{pct(p)}%</Text>
                  <Bar fraction={p} />
                </>
              ) : <NoResult />}
            </View>
          </View>
        );
      })}
      {tiers.length < MAX_TIERS && (
        <AddButton label="+ Add bounty size" onPress={() => setTiers((ts) => [...ts, blank()])} />
      )}
      <Text style={s.foot}>Tap − each time a bounty of that size is pulled. % is the chance the next one drawn is that size.</Text>

      <SectionHeader title="Bounty in chips" divider onClear={() => setSpot({ prizeLeft: '', chips: '', bb: '' })} />
      <View style={st.fields}>
        <Field label="Prize money left" value={spot.prizeLeft} onChange={setField('prizeLeft')} decimalPad isMoney />
        <Field label="Chips in play" value={spot.chips} onChange={setField('chips')} />
        <Field label="Big blind" value={spot.bb} onChange={setField('bb')} />
      </View>
      <Text style={st.answer}>
        {inChips
          ? <>A knockout is worth <Text style={st.hi}>{num(inChips.chips, 0)} chips</Text>{inChips.bb != null ? <> or <Text style={st.hi}>{num(inChips.bb, 1)}bb</Text></> : null}</>
          : 'Enter the bounties above plus the regular (non-bounty) prize money still to be paid and the total chips in play.'}
      </Text>

      <SectionHeader title="Calling an all-in you cover" divider onClear={() => setSpot({ pot: '', call: '' })} />
      <View style={st.fields}>
        <Field label="Pot incl. their shove" value={spot.pot} onChange={setField('pot')} />
        <Field label="To call" value={spot.call} onChange={setField('call')} />
      </View>
      <Text style={st.answer}>
        {need
          ? <>Equity needed: {pct(need.plain)}% → <Text style={st.hi}>{pct(need.withBounty)}%</Text>{inChips ? ' with the bounty' : ' (fill in bounty in chips to include it)'}</>
          : 'Enter the pot and the amount to call, in chips.'}
      </Text>
      <Text style={s.foot}>Chip value assumes every chip is worth the same (prize money left ÷ chips in play). ICM makes chips worth less for big stacks and near pay jumps, so the real bounty edge is a bit larger there.</Text>
    </FormScreen>
  );
}

const st = StyleSheet.create({
  fields: { flexDirection: 'row', gap: 6, marginTop: 4 },
  field: { flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 6 },
  fieldLabel: { color: C.dim, fontSize: 11, marginBottom: 3 },
  fieldWrap: { flex: 0 },
  fieldInput: { flex: 0, height: 38, fontSize: 16, paddingHorizontal: 8 },
  answer: { color: C.text, fontSize: 14, marginTop: 6, lineHeight: 20 },
  hi: { color: C.amber, fontWeight: '800' },
  card: { backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 12, alignItems: 'center' },
  cardLabel: { color: C.dim, fontSize: 13, fontWeight: '600' },
  ev: { color: C.amber, fontSize: 36, fontWeight: '800', marginVertical: 2 },
  cardSub: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 2 },
  times: { color: C.dim, fontSize: 16, fontWeight: '700' },
  count: { flex: 0, width: 64 },
  minus: { width: 40, height: 40, borderRadius: 8, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  minusText: { color: C.text, fontSize: 24, fontWeight: '600', marginTop: -2 },
  result: { width: 56 },
  pct: { color: C.amber, fontSize: 15, fontWeight: '800' },
});

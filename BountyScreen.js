import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bountyStats, bountyInChips, requiredEquity } from './bounty';
import { C, MoneyInput, money, decimalText, s } from './ui';

const KEY = 'gto-finance-bounty-v1';
const MAX_TIERS = 20;
const blank = () => ({ amount: '', count: '' });
const fmt = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const whole = (n) => Math.round(n).toLocaleString();
const digits = (t) => t.replace(/[^0-9]/g, '');
const EMPTY_SPOT = { prizeLeft: '', chips: '', bb: '', pot: '', call: '' };

function Field({ label, value, onChange, decimalPad, isMoney }) {
  const Input = isMoney ? MoneyInput : TextInput;
  return (
    <View style={x.field}>
      <Text style={x.fieldLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
      <Input
        wrapStyle={isMoney ? x.fieldWrap : undefined}
        style={[s.input, x.fieldInput]}
        value={value}
        placeholder="0"
        placeholderTextColor={C.dim}
        keyboardType={decimalPad ? 'decimal-pad' : 'number-pad'}
        onChangeText={(t) => onChange(decimalPad ? decimalText(t) : digits(t))}
      />
    </View>
  );
}

export default function BountyScreen() {
  const [tiers, setTiers] = useState([blank(), blank(), blank()]);
  const [spot, setSpot] = useState(EMPTY_SPOT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw);
          setTiers(d.tiers);
          if (d.spot) setSpot({ ...EMPTY_SPOT, ...d.spot });
        } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ tiers, spot })).catch(() => {});
  }, [tiers, spot, loaded]);

  const setField = (field) => (v) => setSpot((sp) => ({ ...sp, [field]: v }));

  const edit = (i, field, v) => setTiers((ts) => ts.map((t, k) => (k === i ? { ...t, [field]: v } : t)));
  // One bounty of this size was just pulled: take it out of the pool.
  const drawn = (i) => setTiers((ts) => ts.map((t, k) => (k === i ? { ...t, count: String(Math.max(0, (parseInt(t.count, 10) || 0) - 1)) } : t)));
  const remove = (i) => setTiers((ts) => (ts.length > 1 ? ts.filter((_, k) => k !== i) : [blank()]));

  const nums = tiers.map((t) => ({ amount: parseFloat(t.amount) || 0, count: parseInt(t.count, 10) || 0 }));
  const st = bountyStats(nums);
  const num = (k) => parseFloat(spot[k]) || 0;
  const inChips = bountyInChips(st.ev, num('prizeLeft'), num('chips'), num('bb'));
  const need = requiredEquity(num('pot'), num('call'), inChips ? inChips.chips : 0);

  // Don't accept input until saved state has loaded, or the load would overwrite it.
  if (!loaded) return <View style={s.safe} />;

  return (
    <View style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <View style={s.titleRow}><Text style={s.title}>GTO Finance</Text><Text style={s.sub}>Mystery bounty value</Text></View>

          <View style={x.card}>
            <Text style={x.cardLabel}>Each knockout is worth</Text>
            <Text style={x.ev}>{st.count ? money(st.ev) : '–'}</Text>
            <Text style={x.cardSub}>
              {st.count
                ? `${st.count.toLocaleString()} bounties left · ${money(st.pool)} in the pool`
                : 'Enter each bounty size and how many are left.'}
            </Text>
            {st.count > 0 && (
              <Text style={x.cardSub}>
                Top bounty {money(st.top)} · Standard deviation ±{money(st.sd)}
              </Text>
            )}
          </View>

          <View style={s.headRow}>
            <Text style={s.head}>Mystery Bounties left</Text>
            <Pressable onPress={() => setTiers([blank(), blank(), blank()])}>
              <Text style={s.clear}>Clear</Text>
            </Pressable>
          </View>

          {tiers.map((t, i) => {
            const p = st.p[i];
            return (
              <View key={i} style={s.row}>
                <Pressable onPress={() => remove(i)} hitSlop={8}><Text style={x.del}>✕</Text></Pressable>
                <MoneyInput
                  style={s.input}
                  value={t.amount}
                  placeholder="Bounty"
                  placeholderTextColor={C.dim}
                  keyboardType="decimal-pad"
                  onChangeText={(v) => edit(i, 'amount', decimalText(v))}
                />
                <Text style={x.times}>×</Text>
                <TextInput
                  style={[s.input, x.count]}
                  value={t.count}
                  placeholder="Left"
                  placeholderTextColor={C.dim}
                  keyboardType="number-pad"
                  onChangeText={(v) => edit(i, 'count', digits(v))}
                />
                <Pressable style={x.minus} onPress={() => drawn(i)}><Text style={x.minusText}>−</Text></Pressable>
                <View style={[s.result, x.result]}>
                  {p > 0 ? (
                    <>
                      <Text style={x.pct}>{(p * 100).toFixed(1)}%</Text>
                      <View style={s.barBg}><View style={[s.bar, { width: `${p * 100}%` }]} /></View>
                    </>
                  ) : (
                    <Text style={s.pctDim}>–</Text>
                  )}
                </View>
              </View>
            );
          })}

          {tiers.length < MAX_TIERS && (
            <Pressable style={x.add} onPress={() => setTiers([...tiers, blank()])}>
              <Text style={x.addText}>+ Add bounty size</Text>
            </Pressable>
          )}

          <Text style={s.foot}>Tap − each time a bounty of that size is pulled. % is the chance the next one drawn is that size.</Text>

          <Text style={[s.head, x.section]}>Bounty in chips</Text>
          <View style={x.fields}>
            <Field label="Prize money left" value={spot.prizeLeft} onChange={setField('prizeLeft')} decimalPad isMoney />
            <Field label="Chips in play" value={spot.chips} onChange={setField('chips')} />
            <Field label="Big blind" value={spot.bb} onChange={setField('bb')} />
          </View>
          <Text style={x.answer}>
            {inChips
              ? <>A knockout is worth <Text style={x.hi}>{whole(inChips.chips)} chips</Text>{inChips.bb != null ? <> · <Text style={x.hi}>{fmt(Math.round(inChips.bb * 10) / 10)} BB</Text></> : null}</>
              : 'Enter the bounties above plus the regular (non-bounty) prize money still to be paid and the total chips in play.'}
          </Text>

          <Text style={[s.head, x.section]}>Calling an all-in you cover</Text>
          <View style={x.fields}>
            <Field label="Pot incl. their shove" value={spot.pot} onChange={setField('pot')} />
            <Field label="To call" value={spot.call} onChange={setField('call')} />
          </View>
          <Text style={x.answer}>
            {need
              ? <>Equity needed: {(need.plain * 100).toFixed(1)}% → <Text style={x.hi}>{(need.withBounty * 100).toFixed(1)}%</Text>{inChips ? ' with the bounty' : ' (fill in bounty in chips to include it)'}</>
              : 'Enter the pot and the amount to call, in chips.'}
          </Text>
          <Text style={s.foot}>Chip value assumes every chip is worth the same (prize money left ÷ chips in play). ICM makes chips worth less for big stacks and near pay jumps, so the real bounty edge is a bit larger there.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const x = StyleSheet.create({
  section: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.line },
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
  del: { color: C.dim, fontSize: 16, width: 22, textAlign: 'center' },
  times: { color: C.dim, fontSize: 16, fontWeight: '700' },
  count: { flex: 0, width: 64 },
  minus: { width: 40, height: 40, borderRadius: 8, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  minusText: { color: C.text, fontSize: 24, fontWeight: '600', marginTop: -2 },
  result: { width: 56 },
  pct: { color: C.amber, fontSize: 15, fontWeight: '800' },
  add: { height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addText: { color: C.amber, fontSize: 15, fontWeight: '700' },
});

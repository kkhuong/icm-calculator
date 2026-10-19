import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import useEquityCalc, { boardProblem } from '../hooks/useEquityCalc';
import { emptyRange, rangeStats } from '../lib/ranges';
import { pct } from '../lib/format';
import { ScreenTitle } from '../components/Screen';
import SectionHeader, { TextAction } from '../components/SectionHeader';
import { CardSlot, CardPicker } from '../components/Cards';
import { AddButton, RemoveButton } from '../components/RowButtons';
import { NoResult } from '../components/Result';
import RangeEditor from '../components/RangeEditor';
import { C } from '../theme';
import { s } from '../styles';

const MAX_DEAD = 10;
const HOLE = { nlh: 2, plo: 4, plo5: 5 }; // hole cards per game
const MAXH = { nlh: 10, plo: 9, plo5: 8 }; // max hands per game
const GAMES = [['nlh', 'Hold’em'], ['plo', 'PLO'], ['plo5', 'PLO5']];

// A slot is [kind, index, card]: ['h', hand, card] for hole cards, ['b', i, 0] for the board,
// ['d', i, 0] for dead cards. `sel` is the slot the next tapped card goes into.
const sameSlot = (a, b) => a && b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

// Equity of hands or ranges (Hold'em only) on any board, with dead cards.
export default function EquityScreen() {
  const [game, setGame] = useState('nlh');
  const hole = HOLE[game];
  const maxHands = MAXH[game];
  const emptyHand = () => Array(hole).fill(null);
  const [hands, setHands] = useState([[null, null], [null, null]]);
  const [board, setBoard] = useState(Array(5).fill(null));
  const [ranges, setRanges] = useState([null, null]); // per hand: null = exact hand, else 169-cell range grid
  const [editing, setEditing] = useState(null); // hand whose range is open in the editor
  const [dead, setDead] = useState([]);
  const [sel, setSel] = useState(['h', 0, 0]);
  const { res, busy, note } = useEquityCalc({ hands, ranges, board, dead, hole });

  // Hole-card and board slots in fill order (range hands have none).
  const slotsOf = (hs, bd, rg = ranges) => [
    ...hs.flatMap((h, i) => (rg[i] ? [] : h.map((_, j) => ['h', i, j]))),
    ...bd.map((_, i) => ['b', i, 0]),
  ];
  const getCard = (hs, bd, [t, i, j]) => (t === 'h' ? hs[i][j] : t === 'b' ? bd[i] : dead[i] ?? null);
  // Next empty slot after `from` (wrapping around), or null if every slot is filled.
  const firstEmpty = (hs, bd, from, rg = ranges) => {
    const all = slotsOf(hs, bd, rg);
    const start = from ? all.findIndex((q) => sameSlot(q, from)) : -1;
    for (let k = 1; k <= all.length; k++) {
      const q = all[(start + k) % all.length];
      if (getCard(hs, bd, q) == null) return q;
    }
    return null;
  };

  const used = new Set([...hands.flat(), ...board, ...dead].filter((c) => c != null));

  const pick = (card) => {
    if (!sel || used.has(card)) return;
    if (sel[0] === 'd') {
      const d = dead.slice();
      if (sel[1] < d.length) d[sel[1]] = card; else d.push(card);
      setDead(d);
      setSel(d.length < MAX_DEAD ? ['d', d.length, 0] : firstEmpty(hands, board, null));
      return;
    }
    const hs = hands.map((h) => h.slice());
    const bd = board.slice();
    if (sel[0] === 'h') hs[sel[1]][sel[2]] = card; else bd[sel[1]] = card;
    setHands(hs); setBoard(bd);
    setSel(firstEmpty(hs, bd, sel));
  };

  // Tapping a slot selects it; tapping the selected, filled slot empties it.
  const tapSlot = (q) => {
    const cur = getCard(hands, board, q);
    const isSel = sameSlot(sel, q);
    if (isSel && cur != null && q[0] === 'd') {
      setDead(dead.filter((_, i) => i !== q[1]));
      setSel(['d', dead.length - 1, 0]);
    } else if (isSel && cur != null) {
      if (q[0] === 'h') setHands(hands.map((h, i) => (i === q[1] ? h.map((c, j) => (j === q[2] ? null : c)) : h)));
      else setBoard(board.map((c, i) => (i === q[1] ? null : c)));
    } else setSel(q);
  };

  const addHand = () => {
    if (hands.length >= maxHands) return;
    setHands([...hands, emptyHand()]);
    setRanges([...ranges, null]);
    setSel(['h', hands.length, 0]);
  };
  // Removes a hand, or just empties it when only two are left.
  const removeHand = (i) => {
    const big = hands.length > 2;
    const hs = big ? hands.filter((_, k) => k !== i) : hands.map((h, k) => (k === i ? emptyHand() : h));
    const rg = big ? ranges.filter((_, k) => k !== i) : ranges.map((q, k) => (k === i ? null : q));
    setHands(hs); setRanges(rg);
    setSel(firstEmpty(hs, board, null, rg));
  };
  // Keeps the cards that still fit the new game; ranges exist only in Hold'em.
  const switchGame = (g) => {
    if (g === game) return;
    const size = HOLE[g];
    const hs = hands.slice(0, MAXH[g]).map((h) => (size <= h.length ? h.slice(0, size) : [...h, ...Array(size - h.length).fill(null)]));
    const rg = hs.map((_, i) => (g === 'nlh' ? ranges[i] ?? null : null));
    setGame(g); setHands(hs); setRanges(rg);
    setSel(firstEmpty(hs, board, null, rg));
  };
  // Switches a hand between exact cards and a range (opening the range editor).
  const toggleMode = (i) => {
    const rg = ranges.slice();
    const hs = hands.map((h, k) => (k === i ? emptyHand() : h));
    rg[i] = rg[i] ? null : emptyRange();
    setHands(hs); setRanges(rg);
    if (rg[i]) setEditing(i);
    setSel(firstEmpty(hs, board, null, rg));
  };
  // Per-section clears; each selects the first slot of the section it emptied.
  const clearBoard = () => { setBoard(Array(5).fill(null)); setSel(['b', 0, 0]); };
  const clearHands = () => {
    const hs = hands.map(emptyHand);
    const rg = ranges.map((q) => (q ? emptyRange() : null));
    setHands(hs); setRanges(rg);
    setSel(firstEmpty(hs, board, null, rg));
  };
  const clearDead = () => { setDead([]); setSel(['d', 0, 0]); };
  const reset = () => {
    setHands([emptyHand(), emptyHand()]); setRanges([null, null]); setBoard(Array(5).fill(null)); setDead([]); setSel(['h', 0, 0]);
  };

  const problem = boardProblem(board);

  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <ScreenTitle title="Calculate hand equity" right={<TextAction label="Clear all" onPress={reset} />} />

        <View style={st.seg}>
          {GAMES.map(([g, label]) => (
            <Pressable key={g} style={[st.segBtn, game === g && st.segOn]} onPress={() => switchGame(g)}>
              <Text style={[st.segText, game === g && st.segTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Board" onClear={clearBoard} />
        <View style={st.boardRow}>
          {board.map((c, i) => (
            <View key={i} style={i === 3 || i === 4 ? st.street : null}>
              <CardSlot card={c} selected={sameSlot(sel, ['b', i, 0])} onPress={() => tapSlot(['b', i, 0])} />
            </View>
          ))}
        </View>
        {problem ? <Text style={s.hint}>{problem}</Text> : null}

        <SectionHeader title="Hands" divider onClear={clearHands} />
        {hands.map((h, i) => {
          const r = res && res[i];
          const rs = ranges[i] && rangeStats(ranges[i]);
          return (
            <View key={i} style={s.row}>
              <RemoveButton onPress={() => removeHand(i)} />
              {ranges[i] ? (
                <Pressable style={st.rangeBtn} onPress={() => setEditing(i)}>
                  <Text style={st.rangeTop}>{rs.combos ? 'Range' : 'Pick range'}</Text>
                  {rs.combos ? <Text style={st.rangeSub}>{rs.pct.toFixed(1)}% · {rs.combos}</Text> : null}
                </Pressable>
              ) : (
                h.map((c, j) => (
                  <CardSlot key={j} card={c} hole={hole} selected={sameSlot(sel, ['h', i, j])} onPress={() => tapSlot(['h', i, j])} />
                ))
              )}
              {game === 'nlh' && (
                <Pressable style={st.mode} onPress={() => toggleMode(i)}>
                  <Text style={st.modeText}>{ranges[i] ? 'Hand' : 'Range'}</Text>
                </Pressable>
              )}
              <View style={[s.result, st.result]}>
                {r ? (
                  <>
                    <Text style={[s.pct, busy && st.pending]}>{pct(r.equity)}%</Text>
                    <Text style={s.chips} numberOfLines={1} adjustsFontSizeToFit>win {pct(r.win)}% · tie {pct(r.tie)}%</Text>
                  </>
                ) : <NoResult busy={busy} />}
              </View>
            </View>
          );
        })}
        {note ? <Text style={s.hint}>{note}</Text> : null}
        {hands.length < maxHands && <AddButton label="+ Add hand" onPress={addHand} />}

        <SectionHeader title={<>Dead cards <Text style={s.sub}>exposed or mucked</Text></>} divider onClear={clearDead} />
        <View style={st.deadRow}>
          {[...dead, ...(dead.length < MAX_DEAD ? [null] : [])].map((c, i) => (
            <CardSlot key={i} card={c} selected={sameSlot(sel, ['d', i, 0])} onPress={() => tapSlot(['d', i, 0])} />
          ))}
        </View>
      </ScrollView>

      <RangeEditor
        visible={editing != null && !!ranges[editing]}
        title={`Hand ${(editing ?? 0) + 1} range`}
        value={editing != null ? ranges[editing] : null}
        onChange={(v) => setRanges((r) => r.map((q, k) => (k === editing ? v : q)))}
        onClose={() => setEditing(null)}
      />

      <CardPicker used={used} onPick={pick} />
    </View>
  );
}

const st = StyleSheet.create({
  pending: { color: C.dim },
  seg: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  segBtn: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  segOn: { backgroundColor: C.amber },
  segText: { color: C.dim, fontSize: 15, fontWeight: '700' },
  segTextOn: { color: C.ink },
  boardRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  street: { marginLeft: 8 }, // gap before the turn and river
  rangeBtn: { width: 98, height: 40, borderRadius: 8, borderWidth: 1, borderColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  rangeTop: { color: C.amber, fontSize: 14, fontWeight: '800' },
  rangeSub: { color: C.dim, fontSize: 11, marginTop: 1 },
  mode: { height: 40, paddingHorizontal: 8, borderRadius: 8, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  modeText: { color: C.text, fontSize: 12, fontWeight: '700' },
  result: { flex: 1, width: undefined },
  deadRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});

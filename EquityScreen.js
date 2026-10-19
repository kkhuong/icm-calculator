import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { equity, RANKS, SUITS, SUIT_COLORS, rankChar, cardOf } from './equity';
import { C, s } from './ui';

const MAX_HANDS = 10;
const MAX_DEAD = 10;
const W = Dimensions.get('window').width;
const CELL = Math.floor((W - 20 - 12 * 2) / 13);
const pct = (v) => (v * 100).toFixed(1);

function CardFace({ card, size = 'm' }) {
  const big = size === 'm';
  return (
    <Text style={[x.face, { fontSize: big ? 20 : 13, color: SUIT_COLORS[card & 3] }]}>
      {rankChar(card)}{SUITS[card & 3]}
    </Text>
  );
}

function Slot({ card, selected, onPress }) {
  return (
    <Pressable onPress={onPress} style={[x.slot, card == null ? x.slotEmpty : x.slotFull, selected && x.slotSel]}>
      {card != null && <CardFace card={card} />}
    </Pressable>
  );
}

// Board must be filled in order and be 0 cards, or a full flop (3), turn (4) or river (5).
function boardStatus(board) {
  const filled = board.filter((c) => c != null).length;
  const prefix = board.findIndex((c) => c == null);
  const n = prefix === -1 ? 5 : prefix;
  if (filled !== n) return 'Fill the board in order: flop, turn, then river';
  if (n === 1 || n === 2) return 'Add all 3 flop cards to see equity';
  return null;
}

export default function EquityScreen() {
  const [hands, setHands] = useState([[null, null], [null, null]]);
  const [board, setBoard] = useState(Array(5).fill(null));
  const [dead, setDead] = useState([]);
  const [sel, setSel] = useState(['h', 0, 0]);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  const slotsOf = (hs, bd) => [
    ...hs.flatMap((_, i) => [['h', i, 0], ['h', i, 1]]),
    ...bd.map((_, i) => ['b', i, 0]),
  ];
  const getCard = (hs, bd, [t, i, j]) => (t === 'h' ? hs[i][j] : t === 'b' ? bd[i] : dead[i] ?? null);
  const firstEmpty = (hs, bd, from) => {
    const all = slotsOf(hs, bd);
    const start = from ? all.findIndex((q) => q[0] === from[0] && q[1] === from[1] && q[2] === from[2]) : -1;
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

  const tapSlot = (q) => {
    const cur = getCard(hands, board, q);
    const isSel = sel && sel[0] === q[0] && sel[1] === q[1] && sel[2] === q[2];
    if (isSel && cur != null && q[0] === 'd') {
      setDead(dead.filter((_, i) => i !== q[1]));
      setSel(['d', dead.length - 1, 0]);
    } else if (isSel && cur != null) {
      if (q[0] === 'h') setHands(hands.map((h, i) => (i === q[1] ? h.map((c, j) => (j === q[2] ? null : c)) : h)));
      else setBoard(board.map((c, i) => (i === q[1] ? null : c)));
    } else setSel(q);
  };

  const addHand = () => {
    if (hands.length >= MAX_HANDS) return;
    setHands([...hands, [null, null]]);
    setSel(['h', hands.length, 0]);
  };
  const removeHand = (i) => {
    const hs = hands.length > 2 ? hands.filter((_, k) => k !== i) : hands.map((h, k) => (k === i ? [null, null] : h));
    setHands(hs);
    setSel(firstEmpty(hs, board, null));
  };
  const reset = () => {
    setHands([[null, null], [null, null]]); setBoard(Array(5).fill(null)); setDead([]); setSel(['h', 0, 0]);
  };

  useEffect(() => {
    const idx = [];
    hands.forEach((h, i) => { if (h[0] != null && h[1] != null) idx.push(i); });
    if (idx.length < 2 || boardStatus(board)) { setRes(null); setBusy(false); return; }
    const bd = board.filter((c) => c != null);
    setBusy(true);
    const t = setTimeout(() => {
      const r = equity(idx.map((i) => hands[i]), bd, dead);
      const out = {};
      idx.forEach((i, k) => (out[i] = r[k]));
      setRes(out); setBusy(false);
    }, 20);
    return () => clearTimeout(t);
  }, [hands, board, dead]);

  const isSel = (t, i, j) => sel && sel[0] === t && sel[1] === i && sel[2] === j;

  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.titleRow}>
          <Text style={s.title}>GTO Finance</Text>
          <Pressable onPress={reset}><Text style={s.clear}>Reset</Text></Pressable>
        </View>

        <Text style={s.head}>Board</Text>
        <View style={x.boardRow}>
          {board.map((c, i) => (
            <View key={i} style={i === 3 || i === 4 ? { marginLeft: 8 } : null}>
              <Slot card={c} selected={isSel('b', i, 0)} onPress={() => tapSlot(['b', i, 0])} />
            </View>
          ))}
        </View>

        {boardStatus(board) ? <Text style={x.hint}>{boardStatus(board)}</Text> : null}

        <View style={x.divider}><Text style={s.head}>Hands</Text></View>
        {hands.map((h, i) => {
          const r = res && res[i];
          return (
            <View key={i} style={s.row}>
              <Pressable onPress={() => removeHand(i)} hitSlop={8}><Text style={x.del}>✕</Text></Pressable>
              <Slot card={h[0]} selected={isSel('h', i, 0)} onPress={() => tapSlot(['h', i, 0])} />
              <Slot card={h[1]} selected={isSel('h', i, 1)} onPress={() => tapSlot(['h', i, 1])} />
              <View style={[s.result, { flex: 1, width: undefined }]}>
                {r ? (
                  <>
                    <Text style={s.pct}>{pct(r.equity)}%</Text>
                    <Text style={s.chips}>win {pct(r.win)}% · tie {pct(r.tie)}%</Text>
                  </>
                ) : (
                  <Text style={s.pctDim}>{busy ? '…' : '–'}</Text>
                )}
              </View>
            </View>
          );
        })}
        {hands.length < MAX_HANDS && (
          <Pressable style={x.add} onPress={addHand}><Text style={x.addText}>+ Add hand</Text></Pressable>
        )}

        <View style={x.divider}>
          <Text style={s.head}>Dead cards <Text style={s.sub}>exposed or mucked</Text></Text>
        </View>
        <View style={x.deadRow}>
          {[...dead, ...(dead.length < MAX_DEAD ? [null] : [])].map((c, i) => (
            <Slot key={i} card={c} selected={isSel('d', i, 0)} onPress={() => tapSlot(['d', i, 0])} />
          ))}
        </View>
      </ScrollView>

      <View style={x.grid}>
        {SUITS.map((_, suit) => (
          <View key={suit} style={x.gridRow}>
            {RANKS.split('').map((_, ri) => {
              const card = cardOf(ri, suit);
              const taken = used.has(card);
              return (
                <Pressable key={card} onPress={() => pick(card)} style={[x.cell, { width: CELL }, taken && { opacity: 0.18 }]}>
                  <CardFace card={card} size="s" />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const x = StyleSheet.create({
  face: { fontWeight: '800' },
  slot: { width: 46, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  slotEmpty: { borderColor: C.line, borderStyle: 'dashed', backgroundColor: C.bg },
  slotFull: { borderColor: '#EEF2F5', backgroundColor: '#EEF2F5' },
  slotSel: { borderColor: C.amber, borderStyle: 'solid' },
  boardRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  divider: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, marginBottom: 4 },
  hint: { color: C.amber, fontSize: 12, marginTop: 6 },
  deadRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  del: { color: C.dim, fontSize: 16, width: 22, textAlign: 'center' },
  add: { height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addText: { color: C.amber, fontSize: 15, fontWeight: '700' },
  grid: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 6, gap: 3, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card },
  gridRow: { flexDirection: 'row', gap: 2 },
  cell: { height: 40, borderRadius: 5, backgroundColor: '#EEF2F5', alignItems: 'center', justifyContent: 'center' },
});
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { equityJob, equityRangeJob, RANKS, SUITS, SUIT_COLORS, rankChar, cardOf } from './equity';
import { C, s } from './ui';
import RangeEditor from './RangeEditor';
import { emptyRange, rangeCombos, rangeStats } from './ranges';

const MAX_DEAD = 10;
const HOLE = { nlh: 2, plo: 4, plo5: 5 };
const MAXH = { nlh: 10, plo: 9, plo5: 8 };
const SLICE_MS = 12; // max time per calculation slice before yielding back to the UI
const PARTIAL_MS = 150; // how often a sampled run refreshes its on-screen estimate
const pct = (v) => (v * 100).toFixed(1);

function CardFace({ card, size = 'm' }) {
  const fs = { m: 20, l: 17, t: 15, s: 13 }[size];
  return (
    <Text style={[x.face, { fontSize: fs, color: SUIT_COLORS[card & 3] }]}>
      {rankChar(card)}{SUITS[card & 3]}
    </Text>
  );
}

function Slot({ card, selected, onPress, hole = 2 }) {
  return (
    <Pressable onPress={onPress} style={[x.slot, hole === 4 && { width: 38 }, hole === 5 && { width: 34 }, card == null ? x.slotEmpty : x.slotFull, selected && x.slotSel]}>
      {card != null && <CardFace card={card} size={hole === 5 ? 't' : hole === 4 ? 'l' : 'm'} />}
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
  const [game, setGame] = useState('nlh');
  const hole = HOLE[game];
  const maxHands = MAXH[game];
  const emptyHand = () => Array(hole).fill(null);
  const [hands, setHands] = useState([[null, null], [null, null]]);
  const [board, setBoard] = useState(Array(5).fill(null));
  const [ranges, setRanges] = useState([null, null]); // per hand: null = exact hand, else 169-cell range grid
  const [editing, setEditing] = useState(null);
  const [note, setNote] = useState(null);
  const [dead, setDead] = useState([]);
  const [sel, setSel] = useState(['h', 0, 0]);
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const win = useWindowDimensions();
  const [gridW, setGridW] = useState(null);
  const cell = Math.floor(((gridW ?? win.width - 20) - 12 * 2) / 13);

  const slotsOf = (hs, bd, rg = ranges) => [
    ...hs.flatMap((h, i) => (rg[i] ? [] : h.map((_, j) => ['h', i, j]))),
    ...bd.map((_, i) => ['b', i, 0]),
  ];
  const getCard = (hs, bd, [t, i, j]) => (t === 'h' ? hs[i][j] : t === 'b' ? bd[i] : dead[i] ?? null);
  const firstEmpty = (hs, bd, from, rg = ranges) => {
    const all = slotsOf(hs, bd, rg);
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
    if (hands.length >= maxHands) return;
    setHands([...hands, emptyHand()]);
    setRanges([...ranges, null]);
    setSel(['h', hands.length, 0]);
  };
  const removeHand = (i) => {
    const big = hands.length > 2;
    const hs = big ? hands.filter((_, k) => k !== i) : hands.map((h, k) => (k === i ? emptyHand() : h));
    const rg = big ? ranges.filter((_, k) => k !== i) : ranges.map((q, k) => (k === i ? null : q));
    setHands(hs); setRanges(rg);
    setSel(firstEmpty(hs, board, null, rg));
  };
  const switchGame = (g) => {
    if (g === game) return;
    const size = HOLE[g];
    const hs = hands.slice(0, MAXH[g]).map((h) => (size <= h.length ? h.slice(0, size) : [...h, ...Array(size - h.length).fill(null)]));
    const rg = hs.map((_, i) => (g === 'nlh' ? ranges[i] ?? null : null));
    setGame(g); setHands(hs); setRanges(rg);
    setSel(firstEmpty(hs, board, null, rg));
  };
  const toggleMode = (i) => {
    const rg = ranges.slice();
    const hs = hands.map((h, k) => (k === i ? emptyHand() : h));
    if (rg[i]) rg[i] = null; else rg[i] = emptyRange();
    setHands(hs); setRanges(rg);
    if (rg[i]) setEditing(i);
    setSel(firstEmpty(hs, board, null, rg));
  };
  const reset = () => {
    setHands([emptyHand(), emptyHand()]); setRanges([null, null]); setBoard(Array(5).fill(null)); setDead([]); setSel(['h', 0, 0]);
  };

  useEffect(() => {
    const players = [];
    hands.forEach((h, i) => {
      if (ranges[i]) { const cb = rangeCombos(ranges[i]); if (cb.length) players.push({ i, combos: cb, range: true }); }
      else if (h.every((c) => c != null)) players.push({ i, combos: [h] });
    });
    const bd = board.filter((c) => c != null);
    const needed = 5 - bd.length;
    const taken = players.length * hole + bd.length + dead.length;
    setNote(null);
    setRes(null); // never show results from the previous inputs while the new ones compute
    if (players.length < 2 || boardStatus(board) || 52 - taken < needed) { setBusy(false); return; }
    setBusy(true);
    const anyRange = players.some((p) => p.range);
    const job = anyRange ? equityRangeJob(players.map((p) => p.combos), bd, dead) : equityJob(players.map((p) => p.combos[0]), bd, dead);
    const fail = () => { setNote('These ranges can’t be dealt with the cards entered'); setBusy(false); };
    if (!job) { fail(); return; }
    // Run in short slices so taps and scrolling stay responsive; cleanup cancels a stale run.
    // Sampled runs (preflop, ranges) show a running estimate that firms up as samples accumulate.
    let t, shown = Date.now();
    const show = (r, final) => {
      const out = {};
      players.forEach((p, k) => (out[p.i] = r[k]));
      setRes(out); setBusy(!final);
    };
    const tick = () => {
      if (!job.step(Date.now() + SLICE_MS)) {
        if (!job.exact && Date.now() - shown >= PARTIAL_MS) {
          const r = job.result();
          if (r) show(r, false);
          shown = Date.now();
        }
        t = setTimeout(tick, 0);
        return;
      }
      const r = job.result();
      if (!r) { fail(); return; }
      show(r, true);
    };
    t = setTimeout(tick, 20);
    return () => clearTimeout(t);
  }, [hands, board, dead, game, ranges]);

  const isSel = (t, i, j) => sel && sel[0] === t && sel[1] === i && sel[2] === j;

  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.titleRow}>
          <Text style={s.title}>GTO Finance</Text>
          <Pressable onPress={reset}><Text style={s.clear}>Reset</Text></Pressable>
        </View>

        <View style={x.seg}>
          {[['nlh', 'Hold’em'], ['plo', 'PLO'], ['plo5', 'PLO5']].map(([g, label]) => (
            <Pressable key={g} style={[x.segBtn, game === g && x.segOn]} onPress={() => switchGame(g)}>
              <Text style={[x.segText, game === g && x.segTextOn]}>{label}</Text>
            </Pressable>
          ))}
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
              {ranges[i] ? (
                <Pressable style={x.rangeBtn} onPress={() => setEditing(i)}>
                  <Text style={x.rangeTop}>{rangeStats(ranges[i]).combos ? 'Range' : 'Pick range'}</Text>
                  {rangeStats(ranges[i]).combos ? <Text style={x.rangeSub}>{rangeStats(ranges[i]).pct.toFixed(1)}% · {rangeStats(ranges[i]).combos}</Text> : null}
                </Pressable>
              ) : (
                h.map((c, j) => (
                  <Slot key={j} card={c} hole={hole} selected={isSel('h', i, j)} onPress={() => tapSlot(['h', i, j])} />
                ))
              )}
              {game === 'nlh' && (
                <Pressable style={x.mode} onPress={() => toggleMode(i)}>
                  <Text style={x.modeText}>{ranges[i] ? 'Hand' : 'Range'}</Text>
                </Pressable>
              )}
              <View style={[s.result, { flex: 1, width: undefined }]}>
                {r ? (
                  <>
                    <Text style={[s.pct, busy && x.pending]}>{pct(r.equity)}%</Text>
                    <Text style={s.chips} numberOfLines={1} adjustsFontSizeToFit>win {pct(r.win)}% · tie {pct(r.tie)}%</Text>
                  </>
                ) : (
                  <Text style={s.pctDim}>{busy ? '…' : '–'}</Text>
                )}
              </View>
            </View>
          );
        })}
        {note ? <Text style={x.hint}>{note}</Text> : null}
        {hands.length < maxHands && (
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

      <RangeEditor
        visible={editing != null && !!ranges[editing]}
        title={`Hand ${(editing ?? 0) + 1} range`}
        value={editing != null ? ranges[editing] : null}
        onChange={(v) => setRanges((r) => r.map((q, k) => (k === editing ? v : q)))}
        onClose={() => setEditing(null)}
      />

      <View style={x.grid} onLayout={(e) => setGridW(e.nativeEvent.layout.width - 20)}>
        {SUITS.map((_, suit) => (
          <View key={suit} style={x.gridRow}>
            {RANKS.split('').map((_, ri) => {
              const card = cardOf(ri, suit);
              const taken = used.has(card);
              return (
                <Pressable key={card} onPress={() => pick(card)} style={[x.cell, { width: cell }, taken && { opacity: 0.18 }]}>
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
  pending: { color: C.dim },
  slot: { width: 46, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  seg: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  segBtn: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  segOn: { backgroundColor: C.amber },
  segText: { color: C.dim, fontSize: 15, fontWeight: '700' },
  segTextOn: { color: C.ink },
  slotEmpty: { borderColor: C.line, borderStyle: 'dashed', backgroundColor: C.bg },
  slotFull: { borderColor: '#EEF2F5', backgroundColor: '#EEF2F5' },
  slotSel: { borderColor: C.amber, borderStyle: 'solid' },
  boardRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  divider: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.line, marginBottom: 4 },
  rangeBtn: { width: 98, height: 40, borderRadius: 8, borderWidth: 1, borderColor: C.amber, alignItems: 'center', justifyContent: 'center' },
  rangeTop: { color: C.amber, fontSize: 14, fontWeight: '800' },
  rangeSub: { color: C.dim, fontSize: 11, marginTop: 1 },
  mode: { height: 40, paddingHorizontal: 8, borderRadius: 8, backgroundColor: C.line, alignItems: 'center', justifyContent: 'center' },
  modeText: { color: C.text, fontSize: 12, fontWeight: '700' },
  hint: { color: C.amber, fontSize: 12, marginTop: 6 },
  deadRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  del: { color: C.dim, fontSize: 16, width: 22, textAlign: 'center' },
  add: { height: 40, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addText: { color: C.amber, fontSize: 15, fontWeight: '700' },
  grid: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 6, gap: 3, borderTopWidth: 1, borderTopColor: C.line, backgroundColor: C.card },
  gridRow: { flexDirection: 'row', gap: 2 },
  cell: { height: 40, borderRadius: 5, backgroundColor: '#EEF2F5', alignItems: 'center', justifyContent: 'center' },
});
import { useEffect, useState } from 'react';
import { equityJob, equityRangeJob } from '../lib/equity';
import { rangeCombos } from '../lib/ranges';

const SLICE_MS = 12; // max time per calculation slice before yielding back to the UI
const PARTIAL_MS = 150; // how often a sampled run refreshes its on-screen estimate

// Why the board can't be used yet, or null if it's fine. It must be filled in order and be empty
// (preflop), a full flop (3), turn (4) or river (5).
export function boardProblem(board) {
  const filled = board.filter((c) => c != null).length;
  const prefix = board.findIndex((c) => c == null);
  const n = prefix === -1 ? 5 : prefix;
  if (filled !== n) return 'Fill the board in order: flop, turn, then river';
  if (n === 1 || n === 2) return 'Add all 3 flop cards to see equity';
  return null;
}

// Equity for every complete hand or non-empty range, recalculated whenever the cards change.
// Runs in short slices so taps and scrolling stay responsive; a change cancels the stale run.
// Sampled runs (preflop, ranges) show a running estimate that firms up as samples accumulate,
// with `busy` true until the final numbers are in.
// Returns { res: {handIndex: {equity, win, tie}} | null, busy, note }.
export default function useEquityCalc({ hands, ranges, board, dead, hole }) {
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

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
    if (players.length < 2 || boardProblem(board) || 52 - taken < needed) { setBusy(false); return; }
    setBusy(true);
    const anyRange = players.some((p) => p.range);
    const job = anyRange ? equityRangeJob(players.map((p) => p.combos), bd, dead) : equityJob(players.map((p) => p.combos[0]), bd, dead);
    const fail = () => { setNote('These ranges can’t be dealt with the cards entered'); setBusy(false); };
    if (!job) { fail(); return; }

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
  }, [hands, board, dead, hole, ranges]);

  return { res, busy, note };
}

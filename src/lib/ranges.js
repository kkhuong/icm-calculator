import { RANKS, cardOf } from './cards';

// 13x13 grid, row/col 0 = Ace. Pairs on the diagonal, suited above it, offsuit below it.
export const cellLabel = (r, c) => (r === c ? RANKS[r] + RANKS[r] : r < c ? RANKS[r] + RANKS[c] + 's' : RANKS[c] + RANKS[r] + 'o');
export const cellWeight = (r, c) => (r === c ? 6 : r < c ? 4 : 12);

export function cellCombos(r, c) {
  const out = [];
  if (r === c) { for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) out.push([cardOf(r, a), cardOf(r, b)]); }
  else if (r < c) { for (let s = 0; s < 4; s++) out.push([cardOf(r, s), cardOf(c, s)]); }
  else { for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (a !== b) out.push([cardOf(c, a), cardOf(r, b)]); }
  return out;
}

export const emptyRange = () => Array(169).fill(0);

export function rangeCombos(sel) {
  const out = [];
  for (let i = 0; i < 169; i++) if (sel[i]) out.push(...cellCombos(Math.floor(i / 13), i % 13));
  return out;
}

export function rangeStats(sel) {
  let combos = 0;
  for (let i = 0; i < 169; i++) if (sel[i]) combos += cellWeight(Math.floor(i / 13), i % 13);
  return { combos, pct: (combos / 1326) * 100 };
}

// Hands sorted strongest to weakest by preflop equity vs a random hand.
export const HAND_ORDER = [
  'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', '77', 'AQs', 'AJs', 'AKo', 'ATs',
  'AQo', 'KQs', 'AJo', '66', 'ATo', 'KJs', 'A9s', 'A8s', 'KTs', 'KQo', 'A7s', 'A9o', 'QJs',
  'KJo', '55', 'K9s', 'A5s', 'A8o', 'KTo', 'A6s', 'QTs', 'A4s', 'A7o', 'QJo', 'A3s', 'K8s',
  'K9o', 'Q9s', 'K7s', 'JTs', 'A6o', 'QTo', 'A5o', '44', 'A2s', 'A4o', 'K6s', 'K8o', 'Q8s',
  'A3o', 'K5s', 'J9s', 'Q9o', 'JTo', 'K7o', 'K4s', 'A2o', 'K6o', 'Q7s', 'J8s', 'T9s', 'K3s',
  '33', 'K5o', 'Q8o', 'Q6s', 'K2s', 'J9o', 'Q5s', 'J7s', 'K4o', 'T8s', 'Q4s', 'Q7o', 'T9o',
  'J8o', 'K3o', 'Q3s', 'Q6o', '98s', 'J6s', 'T7s', '22', 'Q2s', 'K2o', 'Q5o', 'J5s', 'T8o',
  'J7o', '97s', 'Q4o', 'J4s', 'T6s', 'Q3o', '87s', 'J3s', 'T7o', '98o', 'J6o', '96s', 'J2s',
  'T5s', 'Q2o', 'J5o', 'T4s', '97o', '86s', 'T6o', 'J4o', '95s', 'T3s', '76s', 'J3o', '87o',
  'T2s', '96o', 'J2o', '85s', 'T5o', '94s', '75s', 'T4o', '93s', '65s', '95o', '86o', '84s',
  'T3o', '92s', '76o', '74s', '54s', 'T2o', '85o', '64s', '83s', '94o', '75o', '93o', '82s',
  '73s', '65o', '53s', '63s', '84o', '92o', '43s', '74o', '72s', '54o', '64o', '52s', '62s',
  '83o', '82o', '73o', '42s', '53o', '63o', '32s', '43o', '72o', '52o', '62o', '42o', '32o',
];

export function topPercent(pct) {
  const sel = emptyRange();
  const target = (pct / 100) * 1326;
  let cum = 0;
  for (const label of HAND_ORDER) {
    if (cum >= target) break;
    for (let i = 0; i < 169; i++) {
      const r = Math.floor(i / 13), c = i % 13;
      if (cellLabel(r, c) === label) { sel[i] = 1; cum += cellWeight(r, c); break; }
    }
  }
  return sel;
}

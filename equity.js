// Card = rank*4 + suit. rank 0..12 = 2..A, suit 0..3 = s,h,d,c
export const RANKS = 'AKQJT98765432';          // display order (A first)
export const SUITS = ['♠', '♥', '♦', '♣'];
export const SUIT_COLORS = ['#1B2733', '#D64545', '#2F6FD6', '#2E8B57'];
export const rankChar = (c) => 'AKQJT98765432'[12 - (c >> 2)];
export const cardOf = (rankIdx, suit) => (12 - rankIdx) * 4 + suit; // rankIdx = position in RANKS

const rc = new Int8Array(13), sc = new Int8Array(4), sm = new Int16Array(4);

function straightHigh(mask) {
  const ext = (mask << 1) | ((mask >> 12) & 1); // bit0 = ace-low
  for (let h = 13; h >= 4; h--) if (((ext >> (h - 4)) & 31) === 31) return h - 1;
  return -1;
}
function top(mask, count) {
  let out = 0;
  for (let r = 12; r >= 0 && count > 0; r--) if ((mask >> r) & 1) { out = out * 16 + r; count--; }
  return out;
}

// Higher score = better hand (works for 5 or 7 cards).
function evalN(cs, n) {
  rc.fill(0); sc.fill(0); sm.fill(0);
  let mask = 0;
  for (let i = 0; i < n; i++) {
    const r = cs[i] >> 2, s = cs[i] & 3;
    rc[r]++; sc[s]++; sm[s] |= 1 << r; mask |= 1 << r;
  }
  let flushMask = 0;
  for (let s = 0; s < 4; s++) if (sc[s] >= 5) flushMask = sm[s];
  if (flushMask) {
    const sf = straightHigh(flushMask);
    if (sf >= 0) return (8 << 20) | (sf << 16);
  }
  let q = -1, t1 = -1, t2 = -1, p1 = -1, p2 = -1;
  for (let r = 12; r >= 0; r--) {
    const n = rc[r];
    if (n === 4) q = r;
    else if (n === 3) { if (t1 < 0) t1 = r; else if (t2 < 0) t2 = r; }
    else if (n === 2) { if (p1 < 0) p1 = r; else if (p2 < 0) p2 = r; }
  }
  if (q >= 0) return (7 << 20) | (q << 16) | (top(mask & ~(1 << q), 1) << 12);
  if (t1 >= 0 && (t2 >= 0 || p1 >= 0)) return (6 << 20) | (t1 << 16) | (Math.max(t2, p1) << 12);
  if (flushMask) return (5 << 20) | top(flushMask, 5);
  const st = straightHigh(mask);
  if (st >= 0) return (4 << 20) | (st << 16);
  if (t1 >= 0) return (3 << 20) | (t1 << 16) | (top(mask & ~(1 << t1), 2) << 8);
  if (p2 >= 0) return (2 << 20) | (p1 << 16) | (p2 << 12) | (top(mask & ~(1 << p1) & ~(1 << p2), 1) << 8);
  if (p1 >= 0) return (1 << 20) | (p1 << 16) | (top(mask & ~(1 << p1), 3) << 4);
  return top(mask, 5);
}

const comb = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return Math.round(r); };

// Omaha: must use exactly 2 hole cards and exactly 3 of the 5 board cards (4 or 5 hole cards dealt).
const pairsFor = (h) => { const a = []; for (let i = 0; i < h; i++) for (let j = i + 1; j < h; j++) a.push(i, j); return a; };
const PAIRS = { 4: pairsFor(4), 5: pairsFor(5) };
const TR = [];
for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) for (let c = b + 1; c < 5; c++) TR.push(a, b, c);
const c5 = new Array(5);
function evalPLO(hand, fb) {
  const pa = PAIRS[hand.length];
  let best = -1;
  for (let p = 0; p < pa.length; p += 2) {
    c5[0] = hand[pa[p]]; c5[1] = hand[pa[p + 1]];
    for (let t = 0; t < 30; t += 3) {
      c5[2] = fb[TR[t]]; c5[3] = fb[TR[t + 1]]; c5[4] = fb[TR[t + 2]];
      const v = evalN(c5, 5);
      if (v > best) best = v;
    }
  }
  return best;
}

// hands: complete hands of 2 (Hold'em), 4 (PLO) or 5 (PLO5) cards, board: 0/3/4/5 cards, dead: known out cards.
// Returns [{equity, win, tie}] as fractions. Exact when feasible, otherwise Monte Carlo.
export function equity(hands, board, dead = [], samples = 40000) {
  const plo = hands[0].length >= 4;
  const used = new Set([...hands.flat(), ...board, ...dead]);
  const deck = [];
  for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
  const k = 5 - board.length;
  const n = hands.length;
  const perHand = plo ? (PAIRS[hands[0].length].length / 2) * 10 : 1; // 5-card evals per hand
  const BUDGET = 4e6;
  const eq = new Array(n).fill(0), win = new Array(n).fill(0), tie = new Array(n).fill(0);
  const fb = new Array(5), cs = new Array(7), scores = new Array(n);
  for (let i = 0; i < board.length; i++) fb[i] = board[i];
  let runs = 0;

  const score = (extra) => {
    for (let i = 0; i < k; i++) fb[board.length + i] = extra[i];
    let best = -1, w = 0;
    for (let h = 0; h < n; h++) {
      let v;
      if (plo) v = evalPLO(hands[h], fb);
      else {
        cs[0] = hands[h][0]; cs[1] = hands[h][1];
        for (let i = 0; i < 5; i++) cs[2 + i] = fb[i];
        v = evalN(cs, 7);
      }
      scores[h] = v;
      if (v > best) { best = v; w = 1; } else if (v === best) w++;
    }
    for (let h = 0; h < n; h++) {
      if (scores[h] === best) { eq[h] += 1 / w; if (w === 1) win[h]++; else tie[h]++; }
    }
    runs++;
  };

  if (k === 0) score([]);
  else if (comb(deck.length, k) * n * perHand <= BUDGET) {
    const pick = new Array(k);
    const rec = (start, d) => {
      if (d === k) return score(pick);
      for (let i = start; i < deck.length; i++) { pick[d] = deck[i]; rec(i + 1, d + 1); }
    };
    rec(0, 0);
  } else {
    const runsWanted = Math.min(samples, Math.floor(BUDGET / (n * perHand)));
    const d = deck.slice();
    for (let s = 0; s < runsWanted; s++) {
      for (let i = 0; i < k; i++) {
        const j = i + Math.floor(Math.random() * (d.length - i));
        const t = d[i]; d[i] = d[j]; d[j] = t;
      }
      score(d);
    }
  }
  return eq.map((v, i) => ({ equity: v / runs, win: win[i] / runs, tie: tie[i] / runs }));
}

// Range equity (Hold'em). players: array of combo lists, e.g. [[[c1,c2]], [[c1,c2],[c3,c4],...]].
// A fixed hand is just a list with one combo. Each player's combo is drawn uniformly from the combos
// that don't clash with the board, dead cards or each other (rejection sampling), then the board is
// run out at random. Returns null if no valid deal exists.
export function equityRange(players, board, dead = [], samples = 100000) {
  const n = players.length;
  const bit = (c) => (c < 32 ? [1 << c, 0] : [0, 1 << (c - 32)]);
  let blockLo = 0, blockHi = 0;
  for (const c of [...board, ...dead]) { const [l, h] = bit(c); blockLo |= l; blockHi |= h; }

  const P = [];
  for (let p = 0; p < n; p++) {
    const cards = [], lo = [], hi = [];
    for (const [a, b] of players[p]) {
      const [la, ha] = bit(a), [lb, hb] = bit(b);
      if ((blockLo & (la | lb)) !== 0 || (blockHi & (ha | hb)) !== 0) continue;
      cards.push(a, b); lo.push(la | lb); hi.push(ha | hb);
    }
    if (!lo.length) return null;
    P.push({ cards, lo, hi, m: lo.length });
  }

  const k = 5 - board.length;
  const eq = new Array(n).fill(0), win = new Array(n).fill(0), tie = new Array(n).fill(0);
  const cs = new Array(7), scores = new Array(n), pickIdx = new Array(n);
  for (let i = 0; i < board.length; i++) cs[2 + i] = board[i];
  let accepted = 0, attempts = 0;
  const maxAttempts = samples * 40;

  while (accepted < samples && attempts < maxAttempts) {
    attempts++;
    let uLo = blockLo, uHi = blockHi, ok = true;
    for (let p = 0; p < n; p++) {
      const q = P[p], i = Math.floor(Math.random() * q.m);
      if ((uLo & q.lo[i]) !== 0 || (uHi & q.hi[i]) !== 0) { ok = false; break; }
      uLo |= q.lo[i]; uHi |= q.hi[i]; pickIdx[p] = i;
    }
    if (!ok) continue;
    for (let j = 0; j < k; j++) {
      for (;;) {
        const c = Math.floor(Math.random() * 52);
        const [l, h] = bit(c);
        if ((uLo & l) === 0 && (uHi & h) === 0) { uLo |= l; uHi |= h; cs[2 + board.length + j] = c; break; }
      }
    }
    let best = -1, w = 0;
    for (let p = 0; p < n; p++) {
      cs[0] = P[p].cards[2 * pickIdx[p]]; cs[1] = P[p].cards[2 * pickIdx[p] + 1];
      const v = evalN(cs, 7);
      scores[p] = v;
      if (v > best) { best = v; w = 1; } else if (v === best) w++;
    }
    for (let p = 0; p < n; p++) {
      if (scores[p] === best) { eq[p] += 1 / w; if (w === 1) win[p]++; else tie[p]++; }
    }
    accepted++;
  }
  if (accepted === 0) return null;
  return eq.map((v, i) => ({ equity: v / accepted, win: win[i] / accepted, tie: tie[i] / accepted }));
}
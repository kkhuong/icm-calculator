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

// Higher score = better 7-card hand.
function eval7(cs) {
  rc.fill(0); sc.fill(0); sm.fill(0);
  let mask = 0;
  for (let i = 0; i < 7; i++) {
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

// hands: [[c,c],...] (all complete), board: 0-5 cards, dead: known exposed/mucked cards. Returns [{equity, win, tie}] as fractions.
export function equity(hands, board, dead = [], samples = 40000) {
  const used = new Set([...hands.flat(), ...board, ...dead]);
  const deck = [];
  for (let c = 0; c < 52; c++) if (!used.has(c)) deck.push(c);
  const k = 5 - board.length;
  const n = hands.length;
  const eq = new Array(n).fill(0), win = new Array(n).fill(0), tie = new Array(n).fill(0);
  const cs = new Array(7);
  const scores = new Array(n);
  let runs = 0;

  const score = (extra) => {
    for (let i = 0; i < board.length; i++) cs[2 + i] = board[i];
    for (let i = 0; i < k; i++) cs[2 + board.length + i] = extra[i];
    let best = -1, w = 0;
    for (let h = 0; h < n; h++) {
      cs[0] = hands[h][0]; cs[1] = hands[h][1];
      const v = eval7(cs);
      scores[h] = v;
      if (v > best) { best = v; w = 1; } else if (v === best) w++;
    }
    for (let h = 0; h < n; h++) {
      if (scores[h] === best) { eq[h] += 1 / w; if (w === 1) win[h]++; else tie[h]++; }
    }
    runs++;
  };

  if (k === 0) score([]);
  else if (comb(deck.length, k) <= 250000) {
    const pick = new Array(k);
    const rec = (start, d) => {
      if (d === k) return score(pick);
      for (let i = start; i < deck.length; i++) { pick[d] = deck[i]; rec(i + 1, d + 1); }
    };
    rec(0, 0);
  } else {
    const d = deck.slice();
    for (let s = 0; s < samples; s++) {
      for (let i = 0; i < k; i++) {
        const j = i + Math.floor(Math.random() * (d.length - i));
        const t = d[i]; d[i] = d[j]; d[j] = t;
      }
      score(d);
    }
  }
  return eq.map((e, i) => ({ equity: e / runs, win: win[i] / runs, tie: tie[i] / runs }));
}
// Standard ICM (Malmuth-Harville): expected prize for each stack given payouts for places 1..n.
// Exact for up to 20 players, Monte Carlo above that.
export function icmEquity(stacks, payouts) {
  const out = stacks.map(() => 0);
  const idx = [];
  stacks.forEach((v, i) => { if (v > 0) idx.push(i); });
  const m = idx.length;
  const L = Math.min(m, payouts.length);
  if (m === 0 || L === 0) return out;
  const s = idx.map((i) => stacks[i]);
  const e = m <= 20 ? equityExact(s, payouts, L) : equityMC(s, payouts, L, 30000);
  idx.forEach((i, k) => (out[i] = e[k]));
  return out;
}

function equityExact(s, payouts, L) {
  const m = s.length;
  const total = s.reduce((a, b) => a + b, 0);
  const size = 1 << m;
  const sum = new Float64Array(size);
  const pc = new Uint8Array(size);
  const g = new Float64Array(size);
  const eq = new Array(m).fill(0);
  g[0] = 1;
  for (let mask = 0; mask < size; mask++) {
    if (mask) {
      const low = mask & -mask;
      const j = 31 - Math.clz32(low);
      sum[mask] = sum[mask ^ low] + s[j];
      pc[mask] = pc[mask ^ low] + 1;
    }
    const gm = g[mask];
    if (gm === 0 || pc[mask] >= L) continue;
    const rem = total - sum[mask];
    const prize = payouts[pc[mask]];
    for (let j = 0; j < m; j++) {
      if (mask & (1 << j)) continue;
      const pr = (gm * s[j]) / rem; // P(set = mask, then j finishes next)
      g[mask | (1 << j)] += pr;
      eq[j] += pr * prize;
    }
  }
  return eq;
}

function equityMC(s, payouts, L, runs) {
  const m = s.length;
  const acc = new Array(m).fill(0);
  for (let r = 0; r < runs; r++) {
    const w = s.slice();
    let total = w.reduce((a, b) => a + b, 0);
    for (let k = 0; k < L; k++) {
      const j = pickNext(w, total);
      acc[j] += payouts[k];
      total -= w[j];
      w[j] = 0;
    }
  }
  return acc.map((v) => v / runs);
}

// Picks the next finisher proportional to stack among players still in (w[j] > 0). If float
// rounding runs x past the end, falls back to the last live player instead of a busted one.
function pickNext(w, total) {
  let x = Math.random() * total, j = -1;
  for (let i = 0; i < w.length; i++) {
    if (w[i] <= 0) continue;
    j = i;
    if (x < w[i]) break;
    x -= w[i];
  }
  return j;
}

// A lower place paying more than a higher one is almost certainly a typo. Returns the worst such
// pair as {higher, lower} (0-based places, higher < lower), or null if payouts never increase.
export function findPayoutMisorder(pay) {
  let worst = null, gap = 0;
  for (let i = 0; i < pay.length; i++) {
    for (let j = i + 1; j < pay.length; j++) {
      if (pay[j] - pay[i] > gap) { gap = pay[j] - pay[i]; worst = { higher: i, lower: j }; }
    }
  }
  return worst;
}

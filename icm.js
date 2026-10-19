// Satellite ICM: every surviving player in the paid spots gets the same prize,
// so a player's equity = probability of finishing in the top `paid` places
// (Malmuth-Harville model: next finisher is picked proportional to chip stack).

export function cashProbabilities(stacks, paid) {
  const out = stacks.map(() => 0);
  const idx = [];
  stacks.forEach((s, i) => { if (s > 0) idx.push(i); });
  const m = idx.length;
  if (m === 0 || paid <= 0) return out;
  if (paid >= m) { idx.forEach((i) => (out[i] = 1)); return out; }

  const s = idx.map((i) => stacks[i]);
  const p = m <= 20 ? exact(s, paid) : monteCarlo(s, paid, 30000);
  idx.forEach((i, k) => (out[i] = p[k]));
  return out;
}

function exact(s, paid) {
  const m = s.length;
  const total = s.reduce((a, b) => a + b, 0);
  const size = 1 << m;
  const sum = new Float64Array(size);
  const pc = new Uint8Array(size);
  const g = new Float64Array(size);
  const res = new Array(m).fill(0);
  g[0] = 1;
  for (let mask = 0; mask < size; mask++) {
    if (mask) {
      const low = mask & -mask;
      const j = 31 - Math.clz32(low);
      sum[mask] = sum[mask ^ low] + s[j];
      pc[mask] = pc[mask ^ low] + 1;
    }
    const gm = g[mask];
    if (gm === 0) continue;
    if (pc[mask] === paid) {
      for (let j = 0; j < m; j++) if (mask & (1 << j)) res[j] += gm;
    } else if (pc[mask] < paid) {
      const rem = total - sum[mask];
      for (let j = 0; j < m; j++) {
        if (!(mask & (1 << j))) g[mask | (1 << j)] += (gm * s[j]) / rem;
      }
    }
  }
  return res;
}

function monteCarlo(s, paid, runs) {
  const m = s.length;
  const hits = new Array(m).fill(0);
  for (let r = 0; r < runs; r++) {
    const w = s.slice();
    let total = w.reduce((a, b) => a + b, 0);
    for (let k = 0; k < paid; k++) {
      let x = Math.random() * total;
      let j = 0;
      for (; j < m - 1; j++) { if (w[j] > 0 && x < w[j]) break; x -= w[j]; }
      hits[j]++;
      total -= w[j];
      w[j] = 0;
    }
  }
  return hits.map((h) => h / runs);
}

// Standard ICM: expected prize for each stack given payouts for places 1..n.
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
      let x = Math.random() * total;
      let j = 0;
      for (; j < m - 1; j++) { if (w[j] > 0 && x < w[j]) break; x -= w[j]; }
      acc[j] += payouts[k];
      total -= w[j];
      w[j] = 0;
    }
  }
  return acc.map((v) => v / runs);
}
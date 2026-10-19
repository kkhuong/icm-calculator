// Satellite math: every surviving player in the paid spots gets the same prize (a seat),
// so a player's equity = probability of finishing in the top `paid` places
// (Malmuth-Harville model: next finisher is picked proportional to chip stack).
// Exact for up to 20 players; larger fields use raceIntegral below (accurate to ~1e-9).

export function cashProbabilities(stacks, paid) {
  const out = stacks.map(() => 0);
  const idx = [];
  stacks.forEach((s, i) => { if (s > 0) idx.push(i); });
  const m = idx.length;
  if (m === 0 || paid <= 0) return out;
  if (paid >= m) { idx.forEach((i) => (out[i] = 1)); return out; }

  const s = idx.map((i) => stacks[i]);
  const p = m <= 20 ? exact(s, paid) : raceIntegral(s, paid);
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

// Large fields. Harville finishing order is equivalent to a race: player j "finishes" at an
// independent time T_j ~ Exp(rate s_j), earliest = 1st place. So
//   P(i in top K) = ∫ s_i e^(-s_i t) · P(fewer than K others have T_j < t) dt,
// where that count is Poisson-binomial with p_j = 1 - e^(-s_j t). For each t, prefix/suffix
// count DPs give every player's leave-one-out distribution in O(m·K). When K > m/2 it counts
// the m-K places outside the money instead and takes the complement (cost ∝ min(K, m-K)).
// Integrated with Simpson's rule in log t; matches the exact method to ~1e-9.
function raceIntegral(stacks, paid, N = 400) {
  const m = stacks.length;
  const mean = stacks.reduce((a, b) => a + b, 0) / m;
  const s = stacks.map((v) => v / mean);
  const low = paid > m / 2; // count players finishing below i instead
  const L = low ? m - paid : paid; // i qualifies when fewer than L others beat it (on that side)
  let smin = Infinity, smax = 0;
  for (const v of s) { smin = Math.min(smin, v); smax = Math.max(smax, v); }
  const lo = Math.log(1e-9 / smax), hi = Math.log(45 / smin);
  const h = (hi - lo) / N;

  const pre = Array.from({ length: m + 1 }, () => new Float64Array(L));
  const suf = Array.from({ length: m + 2 }, () => new Float64Array(L));
  const p = new Float64Array(m), cum = new Float64Array(L), out = new Float64Array(m);
  const step = (from, to, pj) => {
    to[0] = from[0] * (1 - pj);
    for (let c = 1; c < L; c++) to[c] = from[c] * (1 - pj) + from[c - 1] * pj;
  };

  for (let q = 0; q <= N; q++) {
    const w = ((q === 0 || q === N ? 1 : q % 2 ? 4 : 2) * h) / 3;
    const t = Math.exp(lo + q * h);
    for (let j = 0; j < m; j++) {
      const before = -Math.expm1(-s[j] * t); // P(T_j < t)
      p[j] = low ? 1 - before : before;
    }
    pre[0].fill(0); pre[0][0] = 1;
    for (let j = 0; j < m; j++) step(pre[j], pre[j + 1], p[j]);
    suf[m].fill(0); suf[m][0] = 1;
    for (let j = m - 1; j >= 0; j--) step(suf[j + 1], suf[j], p[j]);
    for (let i = 0; i < m; i++) {
      const A = pre[i], B = suf[i + 1];
      let c = 0;
      for (let k = 0; k < L; k++) { c += B[k]; cum[k] = c; }
      let ok = 0; // P(fewer than L of the others are on the counted side)
      for (let a = 0; a < L; a++) ok += A[a] * cum[L - 1 - a];
      out[i] += w * t * s[i] * Math.exp(-s[i] * t) * ok; // dt = t·d(ln t)
    }
  }
  return Array.from(out, (v) => Math.min(1, Math.max(0, low ? 1 - v : v)));
}

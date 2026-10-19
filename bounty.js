// Mystery bounty: each knockout draws one bounty at random from those still left, so a draw is
// worth the average of the remaining pool. tiers: [{amount, count}] (count = how many of that size left).
export function bountyStats(tiers) {
  let count = 0, pool = 0, top = 0;
  for (const { amount, count: c } of tiers) {
    if (amount > 0 && c > 0) { count += c; pool += amount * c; top = Math.max(top, amount); }
  }
  if (count === 0) return { count: 0, pool: 0, ev: 0, sd: 0, top: 0, pTop: 0, p: tiers.map(() => 0) };

  const ev = pool / count;
  let variance = 0, topCount = 0;
  for (const { amount, count: c } of tiers) {
    if (!(amount > 0 && c > 0)) continue;
    variance += c * (amount - ev) ** 2;
    if (amount === top) topCount += c;
  }
  return {
    count, pool, ev, top,
    sd: Math.sqrt(variance / count),
    pTop: topCount / count,
    p: tiers.map(({ amount, count: c }) => (amount > 0 && c > 0 ? c / count : 0)), // chance the next draw is this tier
  };
}

// Linear chip value: each chip is worth (regular prize money left / chips in play), so a bounty of
// `ev` is worth ev / thatRate chips. Ignores ICM, which makes chips worth less to big stacks.
export function bountyInChips(ev, prizeLeft, chipsInPlay, bigBlind) {
  if (!(ev > 0 && prizeLeft > 0 && chipsInPlay > 0)) return null;
  const chips = ev / (prizeLeft / chipsInPlay);
  return { chips, bb: bigBlind > 0 ? chips / bigBlind : null };
}

// Equity needed to call an all-in: risk `call` to win `pot` (everything already in, including the
// shove) plus, if you cover them, the bounty's chip value.
export function requiredEquity(pot, call, bountyChips = 0) {
  if (!(pot > 0 && call > 0)) return null;
  return { plain: call / (pot + call), withBounty: call / (pot + call + bountyChips) };
}

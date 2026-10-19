// Card = rank*4 + suit. rank 0..12 = 2..A, suit 0..3 = s,h,d,c
export const RANKS = 'AKQJT98765432';          // display order (A first)
export const SUITS = ['♠', '♥', '♦', '♣'];
export const rankChar = (c) => 'AKQJT98765432'[12 - (c >> 2)];
export const cardOf = (rankIdx, suit) => (12 - rankIdx) * 4 + suit; // rankIdx = position in RANKS

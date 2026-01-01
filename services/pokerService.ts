import {
  Card,
  CardRank,
  CardSuit,
  Hand,
  Position,
  Action,
  GTOAdvice,
  PokerPlayerState,
  HandType,
} from '../types';
import { GTO_ENGINE_V2 } from './gtoData';
import { ADVICE_COLORS, STACK_DEPTH_INSIGHTS, CARD_RANKS } from '../constants';

/**
 * Normalizes a raw hand string like "AKs", "QQ", "72o" into a Hand object.
 * Assumes valid input format for raw hands.
 * Ranks are ordered by convention: higher rank first, then lower rank.
 */
export const normalizeHandString = (rawHand: string): Hand | null => {
  rawHand = rawHand.trim().toUpperCase();

  if (rawHand.length < 2) {
    return null; // Invalid length
  }
  
  // Allow for 2 or 3 char input (e.g. QQ, AKs, AKo)
  let typeChar = rawHand.length === 3 ? rawHand[2] : '';
  const rank1Str = rawHand[0];
  const rank2Str = rawHand[1];


  const rank1 = Object.values(CardRank).find(r => r === rank1Str);
  const rank2 = Object.values(CardRank).find(r => r === rank2Str);

  if (!rank1 || !rank2) {
    return null; // Invalid ranks
  }

  const card1: Card = { rank: rank1, suit: CardSuit.None }; // Suit not needed for preflop range lookup
  const card2: Card = { rank: rank2, suit: CardSuit.None };

  let type: HandType;
  if (rank1 === rank2) {
    type = 'p'; // Pair
    if (typeChar === 'S' || typeChar === 'O') rawHand = rawHand.slice(0, 2); // Correct raw string for pairs
  } else if (typeChar === 'S') {
    type = 's'; // Suited
  } else {
    type = 'o'; // Offsuit
    if (typeChar !== 'O') rawHand = `${rawHand}O`; // Assume offsuit and correct raw string
  }

  // Ensure higher rank comes first for consistent lookup
  const rank1Index = CARD_RANKS.indexOf(rank1);
  const rank2Index = CARD_RANKS.indexOf(rank2);

  if (rank1Index > rank2Index) { // rank1 is actually lower than rank2, swap
    const newRaw = `${rank2Str}${rank1Str}${type !== 'p' ? type.toUpperCase() : ''}`;
    return {
      card1: { rank: rank2, suit: CardSuit.None },
      card2: { rank: rank1, suit: CardSuit.None },
      type,
      raw: newRaw
    };
  }

  return { card1, card2, type, raw: rawHand };
};

/**
 * Checks if a player's hand matches a specific range string (e.g., "JJ+", "AKo", "A9s", "A5s-A2s").
 * Now supports descriptive ranges like "pocket pairs" and "suited broadway".
 */
const handMatchesRangeString = (hand: Hand, rangeString: string): boolean => {
  const { card1, card2, type } = hand;
  const r1 = card1.rank;
  const r2 = card2.rank;

  // Handle special text-based ranges
  if (rangeString === 'pocket pairs') {
    return type === 'p';
  }
  if (rangeString === 'suited broadway') {
    if (type !== 's') return false;
    const broadwayRanks = [CardRank.Ace, CardRank.King, CardRank.Queen, CardRank.Jack, CardRank.Ten];
    return broadwayRanks.includes(r1) && broadwayRanks.includes(r2);
  }

  if (rangeString.endsWith('+')) {
    const baseHand = rangeString.slice(0, -1);
    const baseRank1 = Object.values(CardRank).find(r => r === baseHand[0]);
    const baseRank2 = Object.values(CardRank).find(r => r === baseHand[1]);

    if (!baseRank1 || !baseRank2) return false;

    // Pairs: "77+"
    if (baseHand.length === 2 && baseRank1 === baseRank2) {
      if (type !== 'p') return false;
      const baseRankIndex = CARD_RANKS.indexOf(baseRank1);
      const handRankIndex = CARD_RANKS.indexOf(r1);
      return handRankIndex <= baseRankIndex;
    }

    // Suited/Offsuit "AJs+", "KJo+"
    if (baseHand.length >= 2 && baseRank1 !== baseRank2) {
      const handTypeChar = baseHand.length === 3 ? baseHand[2].toLowerCase() : null;
      if (handTypeChar && type !== handTypeChar) return false;
      
      const baseRank1Index = CARD_RANKS.indexOf(baseRank1);
      const baseRank2Index = CARD_RANKS.indexOf(baseRank2);
      const handR1Index = CARD_RANKS.indexOf(r1);
      const handR2Index = CARD_RANKS.indexOf(r2);

      if (r1 === baseRank1) {
        return handR2Index <= baseRank2Index;
      }
      return false;
    }
  } else if (rangeString.includes('-')) { // Suited/Offsuit range: "A5s-A2s" or "88-22"
    const [startRange, endRange] = rangeString.split('-');
    const rangeType = startRange.length === 3 ? startRange[2].toLowerCase() as HandType : (startRange[0] === startRange[1] ? 'p' : 'o');

    if (type !== rangeType) return false;
    
    // Pair range: 88-22
    if (type === 'p') {
      const startRank = Object.values(CardRank).find(r => r === startRange[0]);
      const endRank = Object.values(CardRank).find(r => r === endRange[0]);
      if (!startRank || !endRank) return false;
      const startRankIndex = CARD_RANKS.indexOf(startRank);
      const endRankIndex = CARD_RANKS.indexOf(endRank);
      const handRankIndex = CARD_RANKS.indexOf(r1);
      return handRankIndex >= endRankIndex && handRankIndex <= startRankIndex;
    }

    // Non-pair range
    const startRank1 = Object.values(CardRank).find(r => r === startRange[0]);
    const startRank2 = Object.values(CardRank).find(r => r === startRange[1]);
    const endRank1 = Object.values(CardRank).find(r => r === endRange[0]);
    const endRank2 = Object.values(CardRank).find(r => r === endRange[1]);

    if (!startRank1 || !startRank2 || !endRank1 || !endRank2) return false;

    const startR2Index = CARD_RANKS.indexOf(startRank2);
    const endR2Index = CARD_RANKS.indexOf(endRank2);
    const handR1Index = CARD_RANKS.indexOf(r1);
    const handR2Index = CARD_RANKS.indexOf(r2);

    if (r1 === startRank1 && r1 === endRank1) {
      return handR2Index >= endR2Index && handR2Index <= startR2Index;
    }
  } else { // Exact hand: "AKs", "QQ", "72o"
    return hand.raw.toUpperCase() === rangeString.toUpperCase();
  }
  return false;
};


/**
 * Checks if a player's hand is within any of the provided GTO ranges.
 */
const isHandInGTO = (hand: Hand, gtoRanges: string[]): boolean => {
  return gtoRanges.some(rangeStr => handMatchesRangeString(hand, rangeStr));
};

/**
 * Classifies hand strength based on GTO Engine v2 categories.
 */
const classifyHandStrength = (hand: Hand): 'premium' | 'strong' | 'weak' => {
  const { premium, strong } = GTO_ENGINE_V2.strength_categories;
  if (isHandInGTO(hand, premium)) return 'premium';
  if (isHandInGTO(hand, strong)) return 'strong';
  return 'weak';
};


/**
 * Generates preflop advice based on player state and GTO Engine v2.
 */
export const getPreflopAdvice = (playerState: PokerPlayerState): GTOAdvice | null => {
  const { hand, position, stackDepthBB, isVsOpen } = playerState;

  if (!hand) {
    return null;
  }

  // 1. Strength & Equity
  const strength = classifyHandStrength(hand);
  const handKey = hand.raw in GTO_ENGINE_V2.equity_map ? hand.raw : hand.raw.slice(0,2);
  // @ts-ignore
  const equity = GTO_ENGINE_V2.equity_map[handKey] || GTO_ENGINE_V2.equity_map.default;

  // 2. Base Advice
  let action: Action = Action.Fold;
  let insight: string = GTO_ENGINE_V2.insights.out_of_range_fold;

  const ranges = GTO_ENGINE_V2.preflop_ranges;
  const positionRanges = ranges[position as keyof typeof ranges];

  if (isVsOpen) {
    if (position === Position.BB) {
      // @ts-ignore
      if (isHandInGTO(hand, positionRanges["3bet_vs_open"])) {
        action = Action.ThreeBet;
        insight = GTO_ENGINE_V2.insights.premium_raise;
      // @ts-ignore
      } else if (isHandInGTO(hand, positionRanges["call_vs_open"])) {
        action = Action.Call;
        insight = GTO_ENGINE_V2.insights.defense_call;
      }
    } else {
      // @ts-ignore
      if (positionRanges["3bet"] && isHandInGTO(hand, positionRanges["3bet"])) {
        action = Action.ThreeBet;
        insight = GTO_ENGINE_V2.insights.premium_raise;
      }
    }
  } else { // Not facing a raise, we are the opener
    // @ts-ignore
    if (positionRanges["open"] && isHandInGTO(hand, positionRanges["open"])) {
      action = Action.Open;
      insight = strength === 'premium' ? GTO_ENGINE_V2.insights.premium_raise : GTO_ENGINE_V2.insights.nut_advantage;
    }
  }

  // 3. Stack depth adjustments (add to insight)
  let stackInsight = '';
  if (stackDepthBB < 30) {
    stackInsight = STACK_DEPTH_INSIGHTS.lessThan30;
  } else if (stackDepthBB >= 30 && stackDepthBB <= 50) {
    stackInsight = STACK_DEPTH_INSIGHTS.between30and50;
  } else if (stackDepthBB > 70) {
    stackInsight = STACK_DEPTH_INSIGHTS.greaterThan70;
  }
  
  const finalInsight = stackInsight ? `${insight} ${stackInsight}` : insight;

  return {
    action,
    strength,
    equity,
    insight: finalInsight,
    colorClass: ADVICE_COLORS[action],
  };
};

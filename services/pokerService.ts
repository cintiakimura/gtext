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
import { GTO_LOGIC_DATABASE, ADVICE_COLORS, PERCENTAGES, INSIGHTS, STACK_DEPTH_INSIGHTS, CARD_RANKS } from '../constants';

/**
 * Normalizes a raw hand string like "AKs", "QQ", "72o" into a Hand object.
 * Assumes valid input format for raw hands.
 * Ranks are ordered by convention: higher rank first, then lower rank.
 */
export const normalizeHandString = (rawHand: string): Hand | null => {
  rawHand = rawHand.trim().toUpperCase();

  if (rawHand.length < 2 || rawHand.length > 3) {
    return null; // Invalid length
  }

  const rank1Str = rawHand[0];
  const rank2Str = rawHand[1];
  const typeChar = rawHand.length === 3 ? rawHand[2] : '';

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
  } else if (typeChar === 'S') {
    type = 's'; // Suited
  } else if (typeChar === 'O') {
    type = 'o'; // Offsuit
  } else {
    // If no type char and ranks are different, assume offsuit
    type = 'o';
  }

  // Ensure higher rank comes first for consistent lookup
  const rank1Index = CARD_RANKS.indexOf(rank1);
  const rank2Index = CARD_RANKS.indexOf(rank2);

  if (rank1Index > rank2Index) { // rank1 is actually lower than rank2, swap
    return {
      card1: { rank: rank2, suit: CardSuit.None },
      card2: { rank: rank1, suit: CardSuit.None },
      type,
      raw: rawHand
    };
  }

  return { card1, card2, type, raw: rawHand };
};

/**
 * Checks if a player's hand matches a specific range string (e.g., "JJ+", "AKo", "A9s", "A5s-A2s").
 */
const handMatchesRangeString = (hand: Hand, rangeString: string): boolean => {
  const { card1, card2, type } = hand;
  const r1 = card1.rank;
  const r2 = card2.rank;

  if (rangeString.endsWith('+')) {
    const baseHand = rangeString.slice(0, -1);
    const baseRank1 = Object.values(CardRank).find(r => r === baseHand[0]);
    const baseRank2 = Object.values(CardRank).find(r => r === baseHand[1]);

    if (!baseRank1) return false;

    // Pairs: "77+"
    if (baseHand.length === 2 && baseRank1 === baseRank2) {
      if (type !== 'p') return false;
      const baseRankIndex = CARD_RANKS.indexOf(baseRank1);
      const handRankIndex = CARD_RANKS.indexOf(r1);
      return handRankIndex <= baseRankIndex;
    }

    // Suited/Offsuit "AJs+", "KJo+"
    if (baseHand.length === 2 && baseRank1 !== baseRank2) {
      if ((type === 's' && rangeString.endsWith('s+')) || (type === 'o' && rangeString.endsWith('o+')) || (type === 'p' && rangeString.endsWith('s+') === false && rangeString.endsWith('o+') === false) ) {
        if ((rangeString.endsWith('s+') && type !== 's') || (rangeString.endsWith('o+') && type !== 'o')) {
          return false;
        }
        
        const baseRank1Index = CARD_RANKS.indexOf(baseRank1);
        const baseRank2Index = CARD_RANKS.indexOf(baseRank2);
        const handR1Index = CARD_RANKS.indexOf(r1);
        const handR2Index = CARD_RANKS.indexOf(r2);

        if (handR1Index < baseRank1Index) { // Higher first card than base
          return true;
        } else if (handR1Index === baseRank1Index) { // Same first card, check second card
          return handR2Index <= baseRank2Index;
        }
        return false;
      }
    }
  } else if (rangeString.includes('-')) { // Suited/Offsuit range: "A5s-A2s"
    const [startRange, endRange] = rangeString.split('-');
    const startRank1 = Object.values(CardRank).find(r => r === startRange[0]);
    const startRank2 = Object.values(CardRank).find(r => r === startRange[1]);
    const endRank1 = Object.values(CardRank).find(r => r === endRange[0]);
    const endRank2 = Object.values(CardRank).find(r => r === endRange[1]);
    const rangeType = startRange[2] === 'S' ? 's' : 'o';

    if (!startRank1 || !startRank2 || !endRank1 || !endRank2 || type !== rangeType) return false;

    const startR2Index = CARD_RANKS.indexOf(startRank2);
    const endR2Index = CARD_RANKS.indexOf(endRank2);
    const handR1Index = CARD_RANKS.indexOf(r1);
    const handR2Index = CARD_RANKS.indexOf(r2);

    if (handR1Index === CARD_RANKS.indexOf(startRank1) && handR1Index === CARD_RANKS.indexOf(endRank1)) {
      return handR2Index >= endR2Index && handR2Index <= startR2Index;
    }
  } else { // Exact hand: "AKs", "QQ", "72o"
    let targetType: HandType = 'o'; // Default offsuit
    if (rangeString.length === 3) {
      targetType = rangeString[2].toLowerCase() as HandType;
    }
    if (r1 === r2) targetType = 'p';

    if (type !== targetType) return false;

    const targetR1 = Object.values(CardRank).find(cr => cr === rangeString[0]);
    const targetR2 = Object.values(CardRank).find(cr => cr === rangeString[1]);

    return r1 === targetR1 && r2 === targetR2;
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
 * Generates preflop advice based on player state and GTO logic.
 */
export const getPreflopAdvice = (playerState: PokerPlayerState): GTOAdvice | null => {
  const { hand, position, stackDepthBB, isVsOpen } = playerState;

  if (!hand) {
    return null;
  }

  let advice: GTOAdvice = {
    action: Action.Fold,
    percentage: PERCENTAGES.Fold,
    insight: INSIGHTS.Fold,
    colorClass: ADVICE_COLORS.Fold,
  };

  let applicableLogic = GTO_LOGIC_DATABASE[position as keyof typeof GTO_LOGIC_DATABASE];

  // Specific logic for BB vs BTN open
  if (position === Position.BB && isVsOpen) {
    applicableLogic = GTO_LOGIC_DATABASE.BB_vs_BTN_Open;
  }

  // Action Priority: 3-bet > Open > Call > Fold
  if (isHandInGTO(hand, applicableLogic.threeBet)) {
    advice = {
      action: Action.ThreeBet,
      percentage: PERCENTAGES['3-bet'],
      insight: INSIGHTS['3-bet'],
      colorClass: ADVICE_COLORS['3-bet'],
    };
  }
  // Fix: Changed 'applicableLogic.Open' to 'applicableLogic.open' to match type definition
  else if (!isVsOpen && isHandInGTO(hand, applicableLogic.open)) { // Can only Open if not facing an open
    advice = {
      action: Action.Open,
      percentage: PERCENTAGES.Open,
      insight: INSIGHTS.Open,
      colorClass: ADVICE_COLORS.Open,
    };
  } else if (isVsOpen && isHandInGTO(hand, applicableLogic.call)) { // Can only Call if facing an open
    advice = {
      action: Action.Call,
      percentage: PERCENTAGES.Call,
      insight: INSIGHTS.Call,
      colorClass: ADVICE_COLORS.Call,
    };
  }

  // Stack depth adjustments (add to insight)
  let stackInsight = '';
  if (stackDepthBB < 30) {
    stackInsight = STACK_DEPTH_INSIGHTS.lessThan30;
  } else if (stackDepthBB >= 30 && stackDepthBB <= 50) {
    stackInsight = STACK_DEPTH_INSIGHTS.between30and50;
  } else if (stackDepthBB > 70) {
    stackInsight = STACK_DEPTH_INSIGHTS.greaterThan70;
  } else {
    stackInsight = STACK_DEPTH_INSIGHTS.between50and70;
  }
  advice.insight = `${advice.insight} (${stackInsight})`;

  return advice;
};
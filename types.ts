export enum CardRank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = 'T',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export enum CardSuit {
  Clubs = 'c',
  Diamonds = 'd',
  Hearts = 'h',
  Spades = 's',
  None = '', // Used for offsuit or pairs
}

export type HandType = 's' | 'o' | 'p'; // Suited, Offsuit, Pair

export interface Card {
  rank: CardRank;
  suit: CardSuit;
}

export interface Hand {
  card1: Card;
  card2: Card;
  type: HandType; // Derived from cards (suited, offsuit, pair)
  raw: string; // e.g., "AKs", "QQ", "72o"
}

export enum Position {
  UTG = 'UTG',
  HJ = 'HJ',
  CO = 'CO',
  BTN = 'BTN',
  SB = 'SB',
  BB = 'BB',
}

export enum Action {
  Fold = 'Fold',
  Call = 'Call',
  Open = 'Open', // First in raise
  ThreeBet = '3-bet', // Re-raise
}

export interface GTOAdvice {
  action: Action;
  equity: number;
  strength: 'premium' | 'strong' | 'weak';
  insight: string;
  colorClass: string; // Tailwind color class for the card background
}

export interface PokerPlayerState {
  hand: Hand | null;
  position: Position;
  stackDepthBB: number;
  isVsOpen: boolean; // True if facing an open raise (e.g., BB vs BTN open)
}

export interface StatsCardData {
  id: string;
  playerState: PokerPlayerState;
  advice: GTOAdvice | null;
  position: { x: number; y: number }; // Relative to PokerTableArea or screen
}

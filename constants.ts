import { CardRank, Position, GTOLogic } from './types';

export const CARD_RANKS: CardRank[] = [
  CardRank.Ace,
  CardRank.King,
  CardRank.Queen,
  CardRank.Jack,
  CardRank.Ten,
  CardRank.Nine,
  CardRank.Eight,
  CardRank.Seven,
  CardRank.Six,
  CardRank.Five,
  CardRank.Four,
  CardRank.Three,
  CardRank.Two,
];

export const GTO_LOGIC_DATABASE: GTOLogic = {
  [Position.UTG]: {
    // Fix: Changed 'Open' to 'open' to match GTOHandRange type
    open: ['77+', 'AJo+', 'KQo', 'A9s+', 'KJs+', 'QJs'],
    threeBet: ['QQ+', 'AK'],
    call: [],
  },
  [Position.HJ]: {
    // Fix: Changed 'Open' to 'open' to match GTOHandRange type
    open: ['66+', 'ATo+', 'KQo', 'A8s+', 'KTs+', 'QTs+', 'JTs'],
    threeBet: ['JJ+', 'AK', 'AQs'],
    call: [],
  },
  [Position.CO]: {
    // Fix: Changed 'Open' to 'open' to match GTOHandRange type
    open: ['55+', 'A9o+', 'KJo+', 'QJo+', 'A7s+', 'K9s+', 'QTs+', 'JTs'],
    threeBet: ['TT+', 'AK', 'AJs+', 'KQs'],
    call: [],
  },
  [Position.BTN]: {
    // Fix: Changed 'Open' to 'open' to match GTOHandRange type
    open: ['22+', 'A2o+', 'K8o+', 'Q9o+', 'J9o+', 'A2s+', 'K7s+', 'Q8s+', 'J8s+', 'T8s+', '98s+', '87s+', '76s+', '65s+', '54s+'],
    threeBet: ['88+', 'AJs+', 'AQo+', 'KJs+'],
    call: [],
  },
  [Position.SB]: {
    // Fix: Changed 'Open' to 'open' to match GTOHandRange type
    open: ['22+', 'A2o+', 'K6o+', 'Q9o+', 'J9o+', 'A2s+', 'K6s+', 'Q8s+', 'J8s+', 'T8s+', '98s+', '87s+', '76s+', '65s+', '54s+'],
    threeBet: ['77+', 'AJo+', 'KQs', 'A5s-A2s'],
    call: [],
  },
  BB_vs_BTN_Open: { // Specific case for BB when facing a BTN open
    // Fix: Changed 'Open' to 'open' to match GTOHandRange type
    open: [], // Defend only
    threeBet: ['99+', 'AK', 'AQs+', 'KQs', 'A5s-A3s'],
    call: ['88+', 'AJo+', 'KTs+', 'QTs+', 'JTs', '98s+'], // Note: "pocket pairs, suited connectors (~35-40%)" is simplified to specific hands here for clarity
  },
};

export const ADVICE_COLORS = {
  Fold: 'bg-custom-red',
  Call: 'bg-custom-yellow',
  Open: 'bg-custom-green',
  '3-bet': 'bg-custom-blue',
};

export const PERCENTAGES = {
  Fold: '10-25%',
  Call: '30-45%',
  Open: '50-65%',
  '3-bet': '65-85%',
};

export const INSIGHTS = {
  Fold: 'Weak hand, too many stronger combinations. Avoid losing chips.',
  Call: 'Decent hand, but not strong enough to raise. See more cards cheaply.',
  Open: 'Strong starting hand, seize the initiative!',
  '3-bet': 'Premium hand, build the pot and isolate opponents.',
};

export const STACK_DEPTH_INSIGHTS = {
  lessThan30: '(<30bb) Push/fold wider, consider Nash ranges.',
  between30and50: '(30-50bb) Slightly tighter than 100bb.',
  between50and70: '(50-70bb) Standard play. Maximize value.',
  greaterThan70: '(>70bb) Slightly looser, more suited connectors.',
};
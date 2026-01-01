import { CardRank } from './types';

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

export const ADVICE_COLORS = {
  Fold: 'bg-custom-red',
  Call: 'bg-custom-yellow',
  Open: 'bg-custom-green',
  '3-bet': 'bg-custom-blue',
};

export const STACK_DEPTH_INSIGHTS = {
  lessThan30: '(<30bb) Push/fold wider, consider Nash ranges.',
  between30and50: '(30-50bb) Slightly tighter than 100bb.',
  between50and70: '(50-70bb) Standard play. Maximize value.',
  greaterThan70: '(>70bb) Slightly looser, more suited connectors.',
};

import type { Card, CardColor, CardValue } from '../types/game';

const COLORS: CardColor[] = ['crimson', 'ocean', 'toxic', 'solar'];

export const createFullDeck = (): Card[] => {
  const cards: Card[] = [];
  let idCounter = 1;

  for (const color of COLORS) {
    // One '0'
    cards.push({
      id: `card-${idCounter++}`,
      color,
      value: '0',
      label: '0',
      type: 'number',
      scoreValue: 0,
    });

    // Two of '1' through '9'
    for (let num = 1; num <= 9; num++) {
      const valStr = num.toString() as CardValue;
      for (let copy = 0; copy < 2; copy++) {
        cards.push({
          id: `card-${idCounter++}`,
          color,
          value: valStr,
          label: valStr,
          type: 'number',
          scoreValue: num,
        });
      }
    }

    // Two HALT (Skip)
    for (let copy = 0; copy < 2; copy++) {
      cards.push({
        id: `card-${idCounter++}`,
        color,
        value: 'HALT',
        label: 'HALT',
        type: 'action',
        scoreValue: 20,
      });
    }

    // Two REWIND (Reverse)
    for (let copy = 0; copy < 2; copy++) {
      cards.push({
        id: `card-${idCounter++}`,
        color,
        value: 'REWIND',
        label: 'REWIND',
        type: 'action',
        scoreValue: 20,
      });
    }

    // Two BURST +2 (Draw 2)
    for (let copy = 0; copy < 2; copy++) {
      cards.push({
        id: `card-${idCounter++}`,
        color,
        value: 'BURST_2',
        label: 'BURST +2',
        type: 'action',
        scoreValue: 20,
      });
    }
  }

  // Four SPECTRUM (Wild)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `card-${idCounter++}`,
      color: 'wild',
      value: 'SPECTRUM',
      label: 'SPECTRUM',
      type: 'wild',
      scoreValue: 50,
    });
  }

  // Four INFERNO +4 (Wild Draw 4)
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `card-${idCounter++}`,
      color: 'wild',
      value: 'INFERNO_4',
      label: 'INFERNO +4',
      type: 'wild',
      scoreValue: 50,
    });
  }

  return cards;
};

// Fisher-Yates Shuffle
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Card Playability Rule Check
export const isValidPlay = (
  card: Card,
  topDiscard: Card | null,
  activeColor: CardColor | null
): boolean => {
  if (!topDiscard) return true;

  if (card.color === 'wild') return true;

  if (activeColor && card.color === activeColor) return true;

  if (topDiscard.color === card.color) return true;

  if (topDiscard.value === card.value) return true;

  return false;
};

// AI Decision Helper: Pick best card
export const chooseBotCard = (
  hand: Card[],
  topDiscard: Card,
  activeColor: CardColor
): Card | null => {
  const playableCards = hand.filter((c) => isValidPlay(c, topDiscard, activeColor));
  if (playableCards.length === 0) return null;

  const actionCards = playableCards.filter(
    (c) => c.type === 'action' && c.color === activeColor
  );
  if (actionCards.length > 0) {
    return actionCards[Math.floor(Math.random() * actionCards.length)];
  }

  const colorMatches = playableCards.filter(
    (c) => c.type === 'number' && c.color === activeColor
  );
  if (colorMatches.length > 0) {
    return colorMatches.sort((a, b) => b.scoreValue - a.scoreValue)[0];
  }

  const valueMatches = playableCards.filter(
    (c) => c.value === topDiscard.value && c.color !== 'wild'
  );
  if (valueMatches.length > 0) {
    return valueMatches[0];
  }

  const spectrums = playableCards.filter((c) => c.value === 'SPECTRUM');
  if (spectrums.length > 0) return spectrums[0];

  const infernos = playableCards.filter((c) => c.value === 'INFERNO_4');
  if (infernos.length > 0) return infernos[0];

  return playableCards[0];
};

// AI Decision Helper: Choose dominant color in bot's hand
export const chooseBotColor = (hand: Card[]): CardColor => {
  const counts: Record<CardColor, number> = {
    crimson: 0,
    ocean: 0,
    toxic: 0,
    solar: 0,
  };

  hand.forEach((card) => {
    if (card.color !== 'wild') {
      counts[card.color]++;
    }
  });

  let bestColor: CardColor = 'crimson';
  let maxCount = -1;

  for (const c of COLORS) {
    if (counts[c] > maxCount) {
      maxCount = counts[c];
      bestColor = c;
    }
  }

  return bestColor;
};

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { CardComponent } from './Card';
import { isValidPlay } from '../game/deck';
import type { Card } from '../types/game';
import { Zap, PlusCircle } from 'lucide-react';

export const PlayerHand: React.FC = () => {
  const isMobile = useIsMobile(768);
  const {
    players,
    currentTurnIndex,
    discardPile,
    activeColor,
    playCard,
    drawCard,
    callRush,
    hasPlayerDrawnThisTurn,
    drawnCardId,
    gamePhase,
    myPlayerId,
    stackCount,
  } = useGameStore();

  const humanPlayer =
    players.find((p) => (myPlayerId ? p.id === myPlayerId : !p.isBot)) ||
    players.find((p) => p.position === 'bottom') ||
    players.find((p) => !p.isBot) ||
    players[0];
  const currentPlayer = players[currentTurnIndex];
  const isMyTurn = currentPlayer && currentPlayer.id === humanPlayer?.id;
  const topDiscard = discardPile[discardPile.length - 1];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!humanPlayer) return null;

  const hand = humanPlayer.hand;

  // Official UNO playability check:
  // If stack is active, only stacking cards (+2 or +4) are playable!
  // If player drew a card this turn, only that newly drawn card can be played (if valid)!
  const isCardPlayable = (card: Card) => {
    if (!isMyTurn || gamePhase !== 'playing') return false;
    if (hasPlayerDrawnThisTurn) {
      return card.id === drawnCardId && isValidPlay(card, topDiscard, activeColor, stackCount);
    }
    return isValidPlay(card, topDiscard, activeColor, stackCount);
  };

  const hasPlayableCard = hand.some((c) => isCardPlayable(c));

  // Determine fan angle based on index and hand length
  const getFanRotation = (index: number, total: number) => {
    if (total <= 1) return 0;
    const maxSpread = Math.min(30, total * 3.5);
    const step = (maxSpread * 2) / (total - 1);
    return -maxSpread + index * step;
  };

  const getFanTranslateY = (index: number, total: number) => {
    if (total <= 1) return 0;
    const normalized = Math.abs(index - (total - 1) / 2) / ((total - 1) / 2);
    return normalized * 12;
  };

  return (
    <div className="w-full relative flex flex-col items-center pb-1 md:pb-4 z-20">
      {/* Hand Action Controls Header */}
      <div className="flex items-center justify-between w-full max-w-4xl px-2 md:px-3 mb-1 md:mb-2">
        {/* Rush Button & Card Count */}
        <div className="flex items-center space-x-1.5 md:space-x-2">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => callRush(humanPlayer.id)}
            disabled={humanPlayer.hasCalledRush}
            className={`flex items-center space-x-1 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[11px] md:text-sm tracking-wider uppercase shadow-lg transition-all ${
              humanPlayer.hasCalledRush
                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/50 cursor-default'
                : hand.length <= 2
                ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white border-2 border-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 md:w-4 md:h-4 ${hand.length <= 2 ? 'text-yellow-200 fill-yellow-200' : ''}`} />
            <span>{humanPlayer.hasCalledRush ? 'UNO CALLED!' : 'SHOUT UNO!'}</span>
          </motion.button>

          {/* Cards Count Badge */}
          <div className="text-[10px] md:text-xs font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border border-white/10">
            {hand.length} {hand.length === 1 ? 'Card' : 'Cards'}
          </div>
        </div>

        {/* Draw / Pass Controls */}
        {isMyTurn && gamePhase === 'playing' && (
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <button
              onClick={() => drawCard(humanPlayer.id)}
              className={`flex items-center space-x-1 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-white text-[11px] md:text-sm font-bold shadow-md transition-all cursor-pointer ${
                stackCount > 0
                  ? 'bg-gradient-to-r from-rose-600 via-red-500 to-amber-600 hover:brightness-110 shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-pulse'
                  : 'bg-sky-600 hover:bg-sky-500'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{stackCount > 0 ? `Ambil +${stackCount} Kartu (Stack)` : 'Draw Card (1)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Desktop Card Fan Layout (Only mounted on desktop) */}
      {!isMobile ? (
        <div className="flex items-end justify-center w-full max-w-5xl h-44 px-8 relative">
          <div className="flex items-end justify-center -space-x-8 lg:-space-x-7 pt-4">
            {hand.map((card, index) => {
              const playable = isCardPlayable(card);
              const rotation = getFanRotation(index, hand.length);
              const translateY = getFanTranslateY(index, hand.length);

              return (
                <motion.div
                  key={card.id}
                  initial={{ y: 40, opacity: 0, scale: 0.9 }}
                  animate={{
                    y: translateY,
                    opacity: 1,
                    rotate: rotation,
                    scale: 1,
                  }}
                  exit={{ y: 40, opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  style={{ zIndex: index + 1, willChange: 'transform, opacity' }}
                  className="hover:z-50 hover:-translate-y-6 transition-transform cursor-pointer"
                >
                  <CardComponent
                    card={card}
                    isPlayable={playable}
                    enableDrag={true}
                    disableHover={false}
                    onClick={() => {
                      if (playable) {
                        playCard(humanPlayer.id, card.id);
                      }
                    }}
                    size="md"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Mobile Horizontal Snap-Scroll Ribbon Layout (Only mounted on mobile) */
        <div
          ref={scrollContainerRef}
          className="flex w-full overflow-x-auto no-scrollbar snap-x snap-mandatory py-2 px-3 items-center space-x-2.5 min-h-[145px]"
        >
          {hand.map((card) => {
            const playable = isCardPlayable(card);

            return (
              <div key={card.id} className="snap-center shrink-0">
                <CardComponent
                  card={card}
                  isPlayable={playable}
                  enableDrag={false}
                  disableHover={true}
                  onClick={() => {
                    if (playable) {
                      playCard(humanPlayer.id, card.id);
                    }
                  }}
                  size="md"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Turn Helper Prompt */}
      {isMyTurn && stackCount > 0 && (
        <div className="mt-0.5 text-[10px] md:text-[11px] text-rose-400 font-bold animate-pulse">
          🔥 Tumpukan penalti +{stackCount} kartu aktif! Tumpuk kartu +2 / +4 atau klik &quot;Ambil Kartu&quot; untuk menerima penalti.
        </div>
      )}
      {isMyTurn && stackCount === 0 && !hasPlayableCard && (
        <div className="mt-0.5 text-[10px] md:text-[11px] text-sky-400 font-semibold animate-pulse">
          Tidak ada kartu cocok! Ambil 1 kartu (Aturan Force Play: kartu cocok langsung dimainkan otomatis).
        </div>
      )}
    </div>
  );
};

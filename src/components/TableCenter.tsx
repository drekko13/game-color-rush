import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { CardComponent } from './Card';
import { SUIT_NAMES, COLOR_HEX } from '../types/game';
import { RotateCw, RotateCcw } from 'lucide-react';

export const TableCenter: React.FC = () => {
  const {
    deck,
    discardPile,
    activeColor,
    turnDirection,
    players,
    currentTurnIndex,
    drawCard,
    gamePhase,
    penaltyState,
    stackCount,
    myPlayerId,
  } = useGameStore();

  const humanPlayer =
    players.find((p) => (myPlayerId ? p.id === myPlayerId : !p.isBot)) ||
    players.find((p) => p.position === 'bottom') ||
    players[0];
  const currentPlayer = players[currentTurnIndex];
  const isMyTurn = Boolean(currentPlayer && humanPlayer && currentPlayer.id === humanPlayer.id);
  const topDiscard = discardPile[discardPile.length - 1];

  const isPenaltyPulse = penaltyState !== null;

  return (
    <div className="relative flex flex-col items-center justify-center py-1 md:py-4 w-full">
      {/* Turn Orbit Indicator Rings (Scaled for Mobile vs Desktop) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            rotate: turnDirection === 'clockwise' ? 360 : -360,
          }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: 'linear',
          }}
          className="w-56 h-56 md:w-96 md:h-96 rounded-full border border-dashed border-white/15 relative flex items-center justify-center"
        >
          <div
            className="absolute top-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full blur-[1px]"
            style={{ backgroundColor: COLOR_HEX[activeColor].bg }}
          />
          <div
            className="absolute bottom-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full blur-[1px]"
            style={{ backgroundColor: COLOR_HEX[activeColor].bg }}
          />
          <div
            className="absolute left-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full blur-[1px]"
            style={{ backgroundColor: COLOR_HEX[activeColor].bg }}
          />
          <div
            className="absolute right-0 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full blur-[1px]"
            style={{ backgroundColor: COLOR_HEX[activeColor].bg }}
          />
        </motion.div>
      </div>

      {/* Active Color Beacon, Direction Badge & Stack Penalty Badge */}
      <div className="z-10 flex flex-wrap items-center justify-center gap-2 mb-2 md:mb-4">
        <div className="flex items-center space-x-2 md:space-x-3 px-3 py-1 md:py-1.5 rounded-full bg-slate-900/85 border border-white/15 backdrop-blur-md shadow-lg">
          <div className="flex items-center space-x-1.5 md:space-x-2">
            <span
              className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full shadow-[0_0_10px]"
              style={{
                backgroundColor: COLOR_HEX[activeColor].bg,
                boxShadow: `0 0 12px ${COLOR_HEX[activeColor].bg}`,
              }}
            />
            <span className="text-[11px] md:text-sm font-bold tracking-wide text-white">
              {SUIT_NAMES[activeColor]}
            </span>
          </div>

          <div className="w-px h-3.5 md:h-4 bg-white/20" />

          <div className="flex items-center space-x-1 text-slate-300 text-[11px] md:text-xs font-semibold">
            {turnDirection === 'clockwise' ? (
              <>
                <RotateCw className="w-3 h-3 md:w-3.5 md:h-3.5 text-sky-400 animate-spin-slow" />
                <span className="hidden sm:inline">Clockwise</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5 text-pink-400 animate-spin-slow" />
                <span className="hidden sm:inline">Counter-CW</span>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Stack Counter Badge */}
        {stackCount > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.06, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="flex items-center space-x-1.5 px-3 py-1 md:py-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 border border-rose-400 text-white font-black text-[11px] md:text-xs tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.7)]"
          >
            <span>🔥 STACK PENALTI: +{stackCount} KARTU!</span>
          </motion.div>
        )}
      </div>

      {/* Center Table: Draw Deck + Discard Pile */}
      <div className="relative z-10 grid grid-cols-2 gap-4 md:gap-10 items-center justify-center">
        {/* Draw Deck (Tap to Draw) */}
        <div className="relative flex flex-col items-center">
          <motion.div
            whileHover={isMyTurn && gamePhase === 'playing' ? { scale: 1.05 } : undefined}
            whileTap={isMyTurn && gamePhase === 'playing' ? { scale: 0.94 } : undefined}
            onClick={() => {
              if (isMyTurn && gamePhase === 'playing' && humanPlayer) {
                drawCard(humanPlayer.id);
              }
            }}
            className={`relative min-w-[68px] min-h-[96px] transition-all ${
              isMyTurn
                ? stackCount > 0
                  ? 'cursor-pointer ring-4 ring-rose-500 ring-offset-2 ring-offset-slate-900 rounded-xl shadow-[0_0_30px_rgba(225,29,72,0.9)] animate-pulse'
                  : 'cursor-pointer ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.7)] animate-pulse'
                : 'cursor-not-allowed opacity-75'
            }`}
          >
            {/* Realistic Stack Depth */}
            <div className="absolute top-1 left-1 w-20 h-32 md:w-24 md:h-36 bg-slate-800 rounded-xl border border-white/10 opacity-50" />
            <div className="absolute top-0.5 left-0.5 w-20 h-32 md:w-24 md:h-36 bg-slate-850 rounded-xl border border-white/15 opacity-80" />

            {/* Top Deck Card */}
            <CardComponent
              card={{
                id: 'deck-top',
                color: 'wild',
                value: '0',
                label: 'CR',
                type: 'wild',
                scoreValue: 0,
              }}
              isFaceDown={true}
              size="md"
              className="relative shadow-2xl"
            />

            {/* Deck Count Badge */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-white/30 text-white font-black text-[10px] md:text-[11px] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
              {deck.length} Left
            </div>
          </motion.div>

          <span className={`text-[10px] md:text-[11px] font-semibold mt-2.5 ${
            isMyTurn
              ? stackCount > 0
                ? 'text-rose-400 font-bold animate-pulse'
                : 'text-sky-300 font-bold'
              : 'text-slate-500'
          }`}>
            {isMyTurn
              ? stackCount > 0
                ? `Ambil +${stackCount} Kartu (Stack)`
                : '👉 Ambil Kartu'
              : 'Deck Kartu'}
          </span>
        </div>

        {/* Discard Pile */}
        <div className="relative flex flex-col items-center">
          <motion.div
            animate={
              isPenaltyPulse
                ? { scale: [1, 1.25, 1], transition: { duration: 0.4 } }
                : {}
            }
            className="relative min-w-[68px] min-h-[96px]"
          >
            {/* Stack Depth for Underneath Cards */}
            {discardPile.slice(-3, -1).map((underCard, idx) => (
              <div
                key={underCard.id + idx}
                className="absolute inset-0 pointer-events-none"
                style={{
                  transform: `rotate(${underCard.rotation}deg) translate(${underCard.offsetX * 0.7}px, ${underCard.offsetY * 0.7}px)`,
                }}
              >
                <CardComponent
                  card={underCard}
                  size="md"
                  disableHover
                  className="opacity-60 shadow-md"
                />
              </div>
            ))}

            {/* Active Top Discard Card */}
            <AnimatePresence mode="popLayout">
              {topDiscard && (
                <motion.div
                  key={topDiscard.id}
                  initial={{ scale: 1.2, y: -15, opacity: 0.7 }}
                  animate={{
                    scale: 1,
                    y: 0,
                    opacity: 1,
                    rotate: topDiscard.rotation,
                  }}
                  transition={{ type: 'spring', damping: 18, stiffness: 240 }}
                  className="relative shadow-2xl"
                >
                  <CardComponent
                    card={topDiscard}
                    size="md"
                    disableHover
                    className="ring-1 ring-white/40"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 mt-2.5">
            Discard Pile
          </span>
        </div>
      </div>

      {/* Turn Notification Bar */}
      <div className="z-10 mt-2 md:mt-3 text-center">
        {currentPlayer && (
          isMyTurn ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="inline-flex items-center space-x-2 px-4 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-emerald-600/35 via-teal-500/25 to-emerald-600/35 border-2 border-emerald-400 text-white font-black text-xs md:text-sm shadow-[0_0_25px_rgba(16,185,129,0.7)] backdrop-blur-md"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-emerald-300 tracking-wider">🎯 GILIRAN KAMU!</span>
              <span className="text-slate-200 font-medium text-[11px] md:text-xs hidden sm:inline">
                {stackCount > 0
                  ? `(Tumpuk +2/+4 atau ambil +${stackCount})`
                  : 'Keluarkan kartu cocok atau ambil dari deck'}
              </span>
            </motion.div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 md:py-1.5 rounded-full bg-slate-900/90 border border-amber-400/50 text-slate-200 text-xs md:text-sm font-semibold shadow-md backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-amber-300 font-bold tracking-wide">
                ⏳ GILIRAN: {currentPlayer.name}
              </span>
              <span className="text-slate-400 text-[10px] md:text-xs">
                {currentPlayer.isDisconnected
                  ? '(Sedang beralih tab...)'
                  : currentPlayer.isBot
                  ? 'sedang berpikir...'
                  : 'harus mengeluarkan kartu...'}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

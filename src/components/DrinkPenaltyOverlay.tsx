import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { Flame, Beer, Zap, Sparkles } from 'lucide-react';

export const DrinkPenaltyOverlay: React.FC = () => {
  const { penaltyState, players } = useGameStore();

  const targetPlayer = players.find((p) => p.id === penaltyState?.targetPlayerId);
  const isInferno = penaltyState?.type === 'inferno_4';
  const showDrink = penaltyState?.showDrinkSplash;

  return (
    <AnimatePresence>
      {penaltyState && (
        <motion.div
          key={penaltyState.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-center overflow-hidden"
          style={{ willChange: 'opacity' }}
        >
          {/* Ambient Dimmer */}
          <div
            className={`absolute inset-0 pointer-events-none ${
              isInferno
                ? 'bg-gradient-to-b from-rose-950/80 via-black/80 to-rose-950/80'
                : 'bg-black/60'
            }`}
          />

          {/* GPU Shockwave ring */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className={`absolute w-64 h-64 md:w-96 md:h-96 rounded-full border-4 pointer-events-none ${
              isInferno ? 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.6)]' : 'border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.6)]'
            }`}
            style={{ willChange: 'transform, opacity' }}
          />

          {/* Party Drink Splash */}
          {showDrink && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 md:top-24 flex flex-col items-center z-30"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-full shadow-lg flex items-center gap-2">
                <Beer className="w-8 h-8 text-amber-400 animate-bounce" />
                <span className="text-amber-200 font-black text-sm tracking-wider uppercase">
                  PENALTY SIP!
                </span>
              </div>
            </motion.div>
          )}

          {/* Center Penalty Banner */}
          <motion.div
            initial={{ scale: 0.7, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            className={`relative z-50 flex flex-col items-center px-6 py-4 rounded-3xl border-2 shadow-2xl ${
              isInferno
                ? 'bg-slate-950/95 border-rose-500 shadow-rose-600/40'
                : 'bg-slate-950/95 border-amber-400 shadow-amber-500/40'
            }`}
            style={{ willChange: 'transform, opacity' }}
          >
            <div
              className={`p-3 rounded-2xl border mb-2 flex items-center justify-center ${
                isInferno
                  ? 'bg-rose-500/20 border-rose-400/50'
                  : 'bg-amber-500/20 border-amber-400/50'
              }`}
            >
              {penaltyState.type === 'inferno_4' ? (
                <Flame className="w-10 h-10 text-rose-500 animate-pulse" />
              ) : penaltyState.type === 'rush_penalty' ? (
                <Zap className="w-10 h-10 text-amber-400 animate-bounce" />
              ) : showDrink ? (
                <Beer className="w-10 h-10 text-amber-400 animate-bounce" />
              ) : (
                <Sparkles className="w-10 h-10 text-cyan-400 animate-pulse" />
              )}
            </div>

            <h2
              className={`text-2xl md:text-3xl font-black tracking-wider uppercase text-center ${
                isInferno ? 'text-rose-400' : 'text-amber-300'
              }`}
            >
              {penaltyState.type === 'rush_penalty'
                ? 'Caught Slipping!'
                : penaltyState.type === 'inferno_4'
                ? 'Inferno +4 Strike!'
                : 'Burst +2 Blast!'}
            </h2>

            <p className="text-sm md:text-base font-bold text-slate-100 mt-1">
              <span className="text-amber-400">{targetPlayer?.name || 'Player'}</span> draws{' '}
              <span className="text-rose-400 font-black">+{penaltyState.cardsCount}</span> cards
              {showDrink ? ' & takes a drink!' : '!'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

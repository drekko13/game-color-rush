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

          {/* Center Penalty Banner (Ultra-lightweight for mobile) */}
          <motion.div
            initial={{ scale: 0.8, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative z-50 flex flex-col items-center px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl border-2 shadow-xl max-w-[88vw] md:max-w-md ${
              isInferno
                ? 'bg-slate-950/95 border-rose-500'
                : 'bg-slate-950/95 border-amber-400'
            }`}
            style={{ willChange: 'transform, opacity' }}
          >
            <div
              className={`p-3 rounded-2xl border mb-2 flex items-center justify-center ${
                isInferno
                  ? 'bg-rose-500/20 border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                  : 'bg-amber-500/20 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
              }`}
            >
              {penaltyState.type === 'inferno_4' ? (
                <Flame className="w-10 h-10 text-rose-500 drop-shadow" />
              ) : penaltyState.type === 'rush_penalty' ? (
                <Zap className="w-10 h-10 text-amber-400 drop-shadow" />
              ) : showDrink ? (
                <Beer className="w-10 h-10 text-amber-400 drop-shadow" />
              ) : (
                <Sparkles className="w-10 h-10 text-cyan-400 drop-shadow" />
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

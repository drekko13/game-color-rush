import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { Flame, Beer, Zap, Sparkles } from 'lucide-react';

export const DrinkPenaltyOverlay: React.FC = () => {
  const { penaltyState, players } = useGameStore();

  if (!penaltyState) return null;

  const targetPlayer = players.find((p) => p.id === penaltyState.targetPlayerId);
  const isInferno = penaltyState.type === 'inferno_4';
  const showDrink = penaltyState.showDrinkSplash;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
        {/* 1. Hardware-Accelerated Ambient Dimmer (No expensive backdrop-blur for 60fps) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute inset-0 pointer-events-none ${
            isInferno
              ? 'bg-gradient-to-b from-rose-950/80 via-black/80 to-rose-950/80'
              : 'bg-black/60'
          }`}
          style={{ willChange: 'opacity' }}
        >
          {/* Radial shockwave pulse (pure CSS gradient, GPU friendly) */}
          <div
            className={`absolute inset-0 m-auto w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full pointer-events-none animate-ping opacity-30 ${
              isInferno ? 'bg-rose-600' : 'bg-amber-500'
            }`}
            style={{ animationDuration: '1.2s' }}
          />
        </motion.div>

        {/* 2. Party Drink Splash Effect (Optimized, lightweight) */}
        {showDrink && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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

        {/* 3. Center Punchy Penalty Banner (Hardware-Accelerated Spring) */}
        <motion.div
          initial={{ scale: 0.6, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 24 }}
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
      </div>
    </AnimatePresence>
  );
};

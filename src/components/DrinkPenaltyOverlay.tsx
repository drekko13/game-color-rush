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
        {/* 1. Inferno Vortex Dark Dim Overlay (for INFERNO +4) */}
        {isInferno && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center pointer-events-none"
          >
            {/* Spinning Inferno Particle Vortex SVG */}
            <motion.div
              animate={{ rotate: 360, scale: [0.9, 1.15, 0.9] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
              className="w-[450px] h-[450px] md:w-[600px] md:h-[600px] opacity-80"
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <radialGradient id="infernoGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="80" fill="url(#infernoGrad)" />
                {Array.from({ length: 12 }).map((_, i) => (
                  <path
                    key={i}
                    d={`M 100 100 Q ${100 + Math.cos(i * 0.5) * 60} ${100 + Math.sin(i * 0.5) * 60} ${100 + Math.cos(i * 0.5 + 0.8) * 90} ${100 + Math.sin(i * 0.5 + 0.8) * 90}`}
                    stroke={i % 2 === 0 ? '#ef4444' : '#fbbf24'}
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                ))}
              </svg>
            </motion.div>
          </motion.div>
        )}

        {/* 2. Party Drink Splash Overlay */}
        {showDrink && (
          <div className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden">
            {/* Bubbly Vignette & Blur Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-amber-500/10 backdrop-blur-[4px]"
            >
              {/* Effervescent Floating Bubbles */}
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    y: '100vh',
                    x: `${(i * 5.5) % 95}vw`,
                    opacity: 0.3,
                    scale: Math.random() * 0.6 + 0.4,
                  }}
                  animate={{
                    y: '-10vh',
                    opacity: [0.3, 0.8, 0],
                  }}
                  transition={{
                    duration: 1.4 + (i % 5) * 0.2,
                    ease: 'easeOut',
                  }}
                  className="absolute w-5 h-5 rounded-full border border-amber-300/60 bg-amber-200/30 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                />
              ))}
            </motion.div>

            {/* 3D Tilting Cartoon Drink Mug */}
            <div className="relative w-full flex justify-center pt-8 z-30">
              <motion.div
                initial={{ y: -120, rotate: 0 }}
                animate={{
                  y: [ -120, 20, 20, -120 ],
                  rotate: [ 0, 0, 52, 0 ],
                }}
                transition={{ duration: 1.3, times: [0, 0.25, 0.7, 1] }}
                className="relative"
              >
                {/* SVG Cartoon Beer/Soda Mug */}
                <svg
                  className="w-32 h-36 drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)]"
                  viewBox="0 0 100 120"
                >
                  <defs>
                    <linearGradient id="beerLiquid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="40%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#b45309" />
                    </linearGradient>
                  </defs>

                  {/* Mug Handle */}
                  <path
                    d="M 68 35 C 92 35 92 85 68 85"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Glass Body */}
                  <rect
                    x="20"
                    y="25"
                    width="55"
                    height="80"
                    rx="8"
                    fill="rgba(255,255,255,0.25)"
                    stroke="#ffffff"
                    strokeWidth="4"
                  />

                  {/* Liquid Inside */}
                  <rect
                    x="24"
                    y="38"
                    width="47"
                    height="63"
                    rx="6"
                    fill="url(#beerLiquid)"
                  />

                  {/* Frothy Foam Top */}
                  <ellipse cx="47" cy="35" rx="25" ry="8" fill="#ffffff" />
                  <circle cx="30" cy="32" r="7" fill="#ffffff" />
                  <circle cx="45" cy="30" r="8" fill="#ffffff" />
                  <circle cx="62" cy="32" r="7" fill="#ffffff" />
                </svg>

                {/* Pouring Liquid Stream from Spout */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: [0, 400, 400, 0],
                    opacity: [0, 0.9, 0.9, 0],
                  }}
                  transition={{ duration: 1.1, times: [0.3, 0.5, 0.8, 1] }}
                  className="absolute top-28 left-20 w-5 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-600 rounded-full blur-[1px] shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                />
              </motion.div>
            </div>

            {/* Bottom Morphing Liquid Splash Wave */}
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{
                y: [200, 20, 20, 200],
                opacity: [0, 0.95, 0.95, 0],
              }}
              transition={{ duration: 1.2, times: [0.35, 0.55, 0.8, 1] }}
              className="relative w-full z-20"
            >
              <svg viewBox="0 0 1200 160" className="w-full h-24 md:h-36 fill-amber-500/80">
                <path d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,85.3C672,75,768,85,864,101.3C960,117,1056,139,1152,133.3C1200,130,1248,117,1272,110L1296,104L1296,180L1272,180C1248,180,1200,180,1152,180C1056,180,960,180,864,180C768,180,672,180,576,180C480,180,384,180,288,180C192,180,96,180,48,180L0,180Z" />
              </svg>
            </motion.div>
          </div>
        )}

        {/* Big Animated Banner In Center */}
        <motion.div
          initial={{ scale: 0.5, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative z-50 flex flex-col items-center px-6 py-4 rounded-3xl bg-slate-950/90 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)] backdrop-blur-xl"
        >
          <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 mb-2 flex items-center justify-center">
            {penaltyState.type === 'inferno_4' ? (
              <Flame className="w-9 h-9 text-rose-500 animate-pulse" />
            ) : penaltyState.type === 'rush_penalty' ? (
              <Zap className="w-9 h-9 text-amber-400 animate-bounce" />
            ) : showDrink ? (
              <Beer className="w-9 h-9 text-amber-400 animate-bounce" />
            ) : (
              <Sparkles className="w-9 h-9 text-cyan-400 animate-pulse" />
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-amber-300 tracking-wider uppercase text-center">
            {penaltyState.type === 'rush_penalty'
              ? 'Caught Slipping!'
              : penaltyState.type === 'inferno_4'
              ? 'Inferno +4 Strike!'
              : 'Burst +2 Blast!'}
          </h2>
          <p className="text-xs md:text-sm font-bold text-white mt-1">
            {targetPlayer?.name} draws +{penaltyState.cardsCount} cards
            {showDrink ? ' & takes a penalty sip!' : '!'}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

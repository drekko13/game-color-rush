import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import type { CardColor } from '../types/game';
import { SUIT_NAMES, COLOR_HEX } from '../types/game';
import { Flame, Waves, Sparkles, Sun } from 'lucide-react';

export const ColorWheelModal: React.FC = () => {
  const {
    gamePhase,
    selectWildColor,
    gameMode,
    myPlayerId,
    players,
    currentTurnIndex,
    activeColorPickerPlayerId,
  } = useGameStore();

  if (gamePhase !== 'color_picker') return null;

  // In multiplayer: only show modal to the player who played the wild card!
  if (gameMode === 'multiplayer') {
    const pickerId = activeColorPickerPlayerId || players[currentTurnIndex]?.id;
    if (pickerId && myPlayerId && pickerId !== myPlayerId) {
      return null;
    }
  }

  const colors: {
    color: CardColor;
    name: string;
    icon: React.ReactNode;
    bgGrad: string;
    border: string;
  }[] = [
    {
      color: 'crimson',
      name: SUIT_NAMES.crimson,
      icon: <Flame className="w-8 h-8 text-white drop-shadow-md" />,
      bgGrad: 'from-rose-500 to-red-700',
      border: 'border-red-400',
    },
    {
      color: 'ocean',
      name: SUIT_NAMES.ocean,
      icon: <Waves className="w-8 h-8 text-white drop-shadow-md" />,
      bgGrad: 'from-sky-400 to-blue-700',
      border: 'border-sky-400',
    },
    {
      color: 'toxic',
      name: SUIT_NAMES.toxic,
      icon: <Sparkles className="w-8 h-8 text-white drop-shadow-md" />,
      bgGrad: 'from-emerald-400 to-emerald-700',
      border: 'border-emerald-400',
    },
    {
      color: 'solar',
      name: SUIT_NAMES.solar,
      icon: <Sun className="w-8 h-8 text-slate-950 drop-shadow-md" />,
      bgGrad: 'from-amber-300 to-amber-600',
      border: 'border-yellow-300',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md pt-safe pb-safe pl-safe pr-safe">
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -45 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative flex flex-col items-center p-4 sm:p-6 rounded-3xl bg-slate-900 border border-white/20 shadow-2xl max-w-sm w-full max-h-[90dvh] overflow-y-auto no-scrollbar"
        >
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-pink-500 via-sky-500 to-emerald-500 blur-xl opacity-30 pointer-events-none" />

          <h3 className="text-xl font-black text-white tracking-wider uppercase mb-1">
            Choose Active Suit
          </h3>
          <p className="text-xs text-slate-400 mb-6 text-center font-medium">
            Select the new color to dictate table play
          </p>

          <div className="grid grid-cols-2 gap-3 w-full">
            {colors.map((c) => (
              <motion.button
                key={c.color}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectWildColor(c.color)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${c.bgGrad} border-2 ${c.border} shadow-lg transition-transform`}
                style={{
                  boxShadow: `0 0 20px ${COLOR_HEX[c.color].glow}`,
                }}
              >
                {c.icon}
                <span
                  className={`mt-2 font-black text-xs md:text-sm tracking-wide text-center uppercase ${
                    c.color === 'solar' ? 'text-slate-950' : 'text-white'
                  }`}
                >
                  {c.name}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

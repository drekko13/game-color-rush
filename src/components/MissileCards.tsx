import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import type { PlayerPosition } from '../types/game';

export const MissileCards: React.FC = () => {
  const { cardMissiles } = useGameStore();

  if (!cardMissiles) return null;

  const count = cardMissiles.count;
  const target = cardMissiles.targetPosition;

  const getTargetCoordinates = (pos: PlayerPosition) => {
    switch (pos) {
      case 'left':
        return { x: -window.innerWidth * 0.38, y: 0, scale: 0.5 };
      case 'right':
        return { x: window.innerWidth * 0.38, y: 0, scale: 0.5 };
      case 'top':
        return { x: 0, y: -window.innerHeight * 0.35, scale: 0.5 };
      case 'bottom':
      default:
        return { x: 0, y: window.innerHeight * 0.36, scale: 0.8 };
    }
  };

  const targetCoords = getTargetCoordinates(target);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
        {Array.from({ length: count }).map((_, i) => {
          return (
            <motion.div
              key={`${cardMissiles.id}-${i}`}
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
                opacity: 0,
              }}
              animate={{
                x: [0, (targetCoords.x * 0.4) + (i % 2 === 0 ? -40 : 40), targetCoords.x],
                y: [0, (targetCoords.y * 0.5) - 60, targetCoords.y],
                scale: [1, 1.2, targetCoords.scale],
                rotate: [0, (i % 2 === 0 ? -25 : 25), (i * 15 - 15)],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 0.45,
                delay: i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ willChange: 'transform, opacity' }}
              className="absolute w-20 h-28 md:w-24 md:h-32 rounded-xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border-2 border-fuchsia-400 shadow-xl flex items-center justify-center p-2"
            >
              <div className="w-full h-full rounded-lg border border-pink-300/40 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-pink-200 drop-shadow">CR</span>
                <div className="w-6 h-0.5 bg-pink-400/50 mt-1" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </AnimatePresence>
  );
};

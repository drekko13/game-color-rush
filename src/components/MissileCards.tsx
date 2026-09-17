import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import type { PlayerPosition } from '../types/game';

export const MissileCards: React.FC = () => {
  const { cardMissiles } = useGameStore();

  const count = cardMissiles?.count || 0;
  const target = cardMissiles?.targetPosition || 'bottom';

  const getTargetCoordinates = (pos: PlayerPosition) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      switch (pos) {
        case 'left':
          return { x: -window.innerWidth * 0.32, y: -window.innerHeight * 0.38, scale: 0.45 };
        case 'right':
          return { x: window.innerWidth * 0.32, y: -window.innerHeight * 0.38, scale: 0.45 };
        case 'top':
          return { x: 0, y: -window.innerHeight * 0.38, scale: 0.45 };
        case 'bottom':
        default:
          return { x: 0, y: window.innerHeight * 0.32, scale: 0.65 };
      }
    }

    switch (pos) {
      case 'left':
        return { x: -window.innerWidth * 0.38, y: 0, scale: 0.55 };
      case 'right':
        return { x: window.innerWidth * 0.38, y: 0, scale: 0.55 };
      case 'top':
        return { x: 0, y: -window.innerHeight * 0.35, scale: 0.55 };
      case 'bottom':
      default:
        return { x: 0, y: window.innerHeight * 0.36, scale: 0.75 };
    }
  };

  const targetCoords = getTargetCoordinates(target);

  return (
    <AnimatePresence>
      {cardMissiles && (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
          {Array.from({ length: count }).map((_, i) => {
            const arcOffset = (i % 2 === 0 ? -20 : 20);
            return (
              <motion.div
                key={`${cardMissiles.id}-${i}`}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0.75,
                  rotate: 0,
                  opacity: 0,
                }}
                animate={{
                  x: [0, (targetCoords.x * 0.45) + arcOffset, targetCoords.x],
                  y: [0, (targetCoords.y * 0.45) - 35, targetCoords.y],
                  scale: [0.75, 1.05, targetCoords.scale],
                  rotate: [0, (i % 2 === 0 ? -14 : 14), (i * 10 - 10)],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 0.42,
                  delay: i * 0.06,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ willChange: 'transform, opacity' }}
                className="absolute w-16 h-24 md:w-22 md:h-30 rounded-xl bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-950 border border-fuchsia-400/80 shadow-lg flex items-center justify-center p-1.5"
              >
                <div className="w-full h-full rounded-lg border border-pink-300/40 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-pink-200 drop-shadow">CR</span>
                  <div className="w-6 h-0.5 bg-pink-400/50 mt-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
};

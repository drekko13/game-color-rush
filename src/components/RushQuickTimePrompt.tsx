import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { Zap, AlertTriangle } from 'lucide-react';

export const RushQuickTimePrompt: React.FC = () => {
  const { rushDuel, callRush, catchUncalledRush } = useGameStore();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!rushDuel) {
      setProgress(100);
      return;
    }

    const interval = 30; // update every 30ms
    const timer = setInterval(() => {
      const remaining = rushDuel.expiresAt - Date.now();
      const pct = Math.max(0, (remaining / rushDuel.durationMs) * 100);
      setProgress(pct);
    }, interval);

    return () => clearInterval(timer);
  }, [rushDuel]);

  if (!rushDuel) return null;

  const isHuman = rushDuel.isHumanTarget;

  return (
    <AnimatePresence>
      <div className="fixed inset-x-0 bottom-28 md:bottom-36 z-50 flex justify-center px-4 pointer-events-auto">
        {isHuman ? (
          /* Human Player must press RUSH to avoid +1 penalty */
          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 p-1 shadow-[0_0_35px_rgba(244,63,94,0.8)] border-2 border-yellow-300 animate-pulse"
          >
            <div className="bg-slate-950/90 rounded-[14px] p-3 text-center flex flex-col items-center">
              {/* Header Title */}
              <div className="flex items-center space-x-1.5 text-amber-300 mb-1">
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-bounce" />
                <span className="font-black text-xs md:text-sm uppercase tracking-wider">
                  Kartu Tinggal 1! Tekan RUSH!
                </span>
                <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-bounce" />
              </div>

              <p className="text-[11px] text-slate-300 mb-2 font-semibold">
                Kalah cepat dengan lawan = <span className="text-rose-400 font-black">+1 Kartu Penalti</span>!
              </p>

              {/* Progress countdown bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-rose-500 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Big Tap Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => callRush(rushDuel.targetPlayerId)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-rose-500 text-slate-950 font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.9)] flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>TEKAN RUSH SEKARANG!</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* Opponent Bot has 1 card left! Human player can catch them! */
          <motion.div
            initial={{ scale: 0.7, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 p-1 shadow-[0_0_35px_rgba(225,29,72,0.8)] border-2 border-red-300 animate-pulse"
          >
            <div className="bg-slate-950/90 rounded-[14px] p-3 text-center flex flex-col items-center">
              <div className="flex items-center space-x-1.5 text-rose-300 mb-1">
                <AlertTriangle className="w-5 h-5 text-yellow-300 animate-bounce" />
                <span className="font-black text-xs md:text-sm uppercase tracking-wider">
                  {rushDuel.targetPlayerName} Sisa 1 Kartu!
                </span>
              </div>

              <p className="text-[11px] text-slate-300 mb-2 font-semibold">
                Tangkap sebelum lawan teriak RUSH! (Penalti <span className="text-rose-400 font-black">+1 Kartu</span>)
              </p>

              {/* Progress countdown bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-yellow-400 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Big Catch Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => catchUncalledRush(rushDuel.targetPlayerId)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 text-white font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(225,29,72,0.9)] flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                <span>TANGKAP {rushDuel.targetPlayerName.toUpperCase()}!</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};

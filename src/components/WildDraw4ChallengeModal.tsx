import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { ShieldAlert, CheckCircle2, Swords, AlertOctagon } from 'lucide-react';
import { COLOR_HEX, SUIT_NAMES } from '../types/game';

export const WildDraw4ChallengeModal: React.FC = () => {
  const { challengeState, gamePhase, respondToChallenge, myPlayerId, players } = useGameStore();

  if (gamePhase !== 'challenge_decision' || !challengeState) return null;

  // Check if local player is the target of the Wild Draw 4
  const isMeTarget = myPlayerId
    ? challengeState.targetPlayerId === myPlayerId
    : players.find((p) => p.id === challengeState.targetPlayerId && !p.isBot) !== undefined;

  if (!isMeTarget) return null;

  const colorMeta = COLOR_HEX[challengeState.colorBeforeWild];
  const suitName = SUIT_NAMES[challengeState.colorBeforeWild];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md pt-safe pb-safe pl-safe pr-safe">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="w-full max-w-md max-h-[90dvh] overflow-y-auto no-scrollbar bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-4 sm:p-6 text-center relative shadow-[0_0_50px_rgba(225,29,72,0.45)]"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-rose-600/30 blur-3xl pointer-events-none" />

          {/* Header Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mb-3 shadow-lg text-rose-400">
            <ShieldAlert className="w-9 h-9 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
            TANTANGAN WILD DRAW +4!
          </h2>

          <p className="text-xs md:text-sm text-slate-300 mt-2 mb-4 leading-relaxed">
            <span className="font-bold text-white">{challengeState.wildPlayerName}</span> memainkan{' '}
            <span className="font-black text-rose-400">INFERNO +4</span>!
          </p>

          {/* Official Uno Rule Explainer Card */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 text-left mb-5 space-y-2">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                Aturan Resmi Mattel UNO:
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Kartu Wild Draw +4 hanya boleh dimainkan jika pemain{' '}
              <strong className="text-white">TIDAK memiliki kartu warna sebelumnya</strong>:
            </p>
            <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/10">
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: colorMeta.bg }}
              />
              <span className="text-xs font-black text-white">{suitName}</span>
            </div>
          </div>

          {/* Decision Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Accept Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => respondToChallenge(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-all cursor-pointer group"
            >
              <CheckCircle2 className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mb-1 transition-colors" />
              <span className="font-black text-xs uppercase tracking-wider text-white">
                Terima (+4 Kartu)
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Ambil 4 kartu & lewati giliran
              </span>
            </motion.button>

            {/* Challenge Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => respondToChallenge(false)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 border border-rose-400/60 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] transition-all cursor-pointer group"
            >
              <Swords className="w-6 h-6 text-yellow-300 animate-bounce mb-1" />
              <span className="font-black text-xs uppercase tracking-wider text-yellow-200">
                Tantang! (Challenge)
              </span>
              <span className="text-[10px] text-rose-100 mt-0.5">
                Cek kartu lawan!
              </span>
            </motion.button>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 leading-normal">
            Jika lawan <strong className="text-emerald-400">bersalah</strong> (punya warna {suitName}): lawan yang ambil 4 kartu!<br />
            Jika lawan <strong className="text-rose-400">jujur</strong>: kamu ambil 6 kartu (4 + 2 penalti) & diskip.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

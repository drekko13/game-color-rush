import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Flame, Waves, Sparkles, Sun, Zap } from 'lucide-react';
import { SUIT_NAMES } from '../types/game';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl relative no-scrollbar"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-black text-white tracking-wide uppercase mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-sky-400" />
            ColorRush Guide & Rules
          </h2>

          <div className="space-y-6 text-sm text-slate-300">
            {/* The 4 Elemental Suits */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                The 4 Elemental Suits
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center space-x-2.5">
                  <Flame className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <span className="font-bold text-red-300 block">{SUIT_NAMES.crimson}</span>
                    <span className="text-[11px] text-slate-400">Crimson Red</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 flex items-center space-x-2.5">
                  <Waves className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <span className="font-bold text-sky-300 block">{SUIT_NAMES.ocean}</span>
                    <span className="text-[11px] text-slate-400">Ocean Surge</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-2.5">
                  <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300 block">{SUIT_NAMES.toxic}</span>
                    <span className="text-[11px] text-slate-400">Toxic Bloom</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center space-x-2.5">
                  <Sun className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-300 block">{SUIT_NAMES.solar}</span>
                    <span className="text-[11px] text-slate-400">Solar Flare</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Cards */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                Action & Wild Cards
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 whitespace-nowrap">
                    HALT
                  </span>
                  <p className="text-xs text-slate-300">
                    Skips the next player's turn completely.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 whitespace-nowrap">
                    REWIND
                  </span>
                  <p className="text-xs text-slate-300">
                    Reverses turn direction between clockwise and counter-clockwise.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 whitespace-nowrap">
                    BURST +2
                  </span>
                  <p className="text-xs text-slate-300">
                    Forces next player to draw 2 cards and skip their turn! Discard pile pulses and screen shakes.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 whitespace-nowrap">
                    SPECTRUM
                  </span>
                  <p className="text-xs text-slate-300">
                    Wild card. Play anytime; blooms the 4-color wheel to choose the next active suit.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-rose-600/30 text-rose-300 border border-rose-500/50 whitespace-nowrap">
                    INFERNO +4
                  </span>
                  <p className="text-xs text-slate-300">
                    Ultimate wild card. Choose the active suit and unleash an inferno missile strike forcing next player to draw 4 cards!
                  </p>
                </div>
              </div>
            </div>

            {/* The RUSH! Rule */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-400/40">
              <h3 className="font-black text-amber-300 uppercase tracking-wide text-sm mb-1 flex items-center">
                <Zap className="w-4 h-4 text-amber-400 mr-1.5 fill-amber-400" />
                <span>Aturan "RUSH!" (Sisa 1 Kartu)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ketika kartu tinggal <strong>1 kartu</strong>, kamu wajib menekan tombol <strong>"RUSH!"</strong> secepat mungkin! Jika kamu kalah cepat dengan lawan (lawan menekan lebih dulu atau waktu habis), kamu mendapat penalti <strong>+1 Kartu</strong>! Begitu juga sebaliknya: jika lawan sisa 1 kartu dan kamu lebih cepat menangkapnya, lawan terkena <strong>+1 Kartu</strong>!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { X, Volume2, Beer, Zap, Bot } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    partyDrinkPenaltyEnabled,
    togglePartyDrinkPenalty,
    soundMuted,
    toggleSound,
    botSpeedMs,
    setBotSpeed,
  } = useGameStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-black text-white tracking-wide uppercase mb-6 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-amber-400" />
            Game Settings
          </h2>

          <div className="space-y-5">
            {/* Party Drink Penalty Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Beer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Party Drink Penalty</h4>
                  <p className="text-xs text-slate-400">
                    Tilting drink mug splash on +2, +4, and missed RUSH!
                  </p>
                </div>
              </div>
              <button
                onClick={togglePartyDrinkPenalty}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  partyDrinkPenaltyEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    partyDrinkPenaltyEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sound FX Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Audio Sound Effects</h4>
                  <p className="text-xs text-slate-400">Synthesized cards, impacts, and fanfare</p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  !soundMuted ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !soundMuted ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* AI Bot Speed */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">AI Opponent Speed</h4>
                  <p className="text-xs text-slate-400">Adjust bot thinking and decision time</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Fast (0.6s)', val: 'fast', ms: 600 },
                  { label: 'Normal (1.1s)', val: 'normal', ms: 1100 },
                  { label: 'Relaxed (1.8s)', val: 'relaxed', ms: 1800 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setBotSpeed(item.val as 'fast' | 'normal' | 'relaxed')}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                      botSpeedMs === item.ms
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

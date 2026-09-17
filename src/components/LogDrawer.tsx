import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { X, ScrollText } from 'lucide-react';
import { COLOR_HEX } from '../types/game';

interface LogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogDrawer: React.FC<LogDrawerProps> = ({ isOpen, onClose }) => {
  const { logs } = useGameStore();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-80 md:w-96 h-full bg-slate-900 border-l border-white/10 p-5 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <ScrollText className="w-5 h-5 text-sky-400" />
              <h3 className="font-black text-sm uppercase tracking-wide text-white">
                Battle Feed
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Logs List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No action recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 text-xs text-slate-300 flex items-start space-x-2"
                >
                  {log.color && log.color !== 'wild' && (
                    <span
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: COLOR_HEX[log.color].bg }}
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium leading-tight">{log.text}</p>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

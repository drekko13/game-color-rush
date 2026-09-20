import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from '../store/useGameStore';
import {
  X,
  Volume2,
  VolumeX,
  Beer,
  Bot,
  LogOut,
  Home,
  RotateCcw,
  BookOpen,
  ScrollText,
  Settings,
  Info,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRules?: () => void;
  onOpenLogs?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenRules,
  onOpenLogs,
}) => {
  const {
    partyDrinkPenaltyEnabled,
    togglePartyDrinkPenalty,
    soundMuted,
    toggleSound,
    botSpeedMs,
    setBotSpeed,
    gameMode,
    roomId,
    leaveRoom,
    returnToMainMenu,
    initGame,
    openAboutModal,
    openExitModal,
  } = useGameStore();

  if (!isOpen) return null;

  const isInRoom = gameMode === 'multiplayer' || Boolean(roomId);

  const handleLeaveRoomOrMenu = () => {
    if (isInRoom) {
      if (
        window.confirm(
          'Apakah kamu yakin ingin keluar dari room ini? Kamu akan kembali ke Menu Utama.'
        )
      ) {
        leaveRoom();
        onClose();
      }
    } else {
      if (
        window.confirm(
          'Kembali ke Menu Utama? Pertandingan saat ini akan diakhiri.'
        )
      ) {
        returnToMainMenu();
        onClose();
      }
    }
  };

  const handleRestartGame = () => {
    if (window.confirm('Mulai ulang pertandingan dari awal?')) {
      initGame();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-safe pb-safe pl-safe pr-safe bg-slate-950/85 backdrop-blur-md"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-5 md:p-6 shadow-xl relative max-h-[90vh] overflow-y-auto no-scrollbar will-change-transform"
        >
          {/* Ambient Glow (desktop only) */}
          <div className="hidden md:block absolute -top-16 -right-16 w-36 h-36 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Pengaturan"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center space-x-2.5 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-wide uppercase">
                Pengaturan
              </h2>
              <p className="text-xs text-slate-400">
                Sesuaikan preferensi audio, gameplay, dan sesi
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 1. Party Drink Penalty Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Beer className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-100">
                    Party Drink Mode
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Efek tilt minuman saat +2, +4, atau salah RUSH
                  </p>
                </div>
              </div>
              <button
                onClick={togglePartyDrinkPenalty}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer ${
                  partyDrinkPenaltyEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
                title={partyDrinkPenaltyEnabled ? 'Aktif' : 'Nonaktif'}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    partyDrinkPenaltyEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. Audio Sound Effects Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  {soundMuted ? (
                    <VolumeX className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-sky-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-100">
                    Efek Suara (Audio)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    {soundMuted ? 'Suara dinonaktifkan (Muted)' : 'Suara kartu & aksi aktif'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer ${
                  !soundMuted ? 'bg-sky-500' : 'bg-slate-700'
                }`}
                title={!soundMuted ? 'Suara Aktif' : 'Suara Mati'}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    !soundMuted ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. AI Opponent Speed */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5">
              <div className="flex items-center space-x-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-100">
                    Kecepatan Lawan AI (Bot)
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Waktu jeda berpikir bot komputer
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Cepat (0.6s)', val: 'fast', ms: 600 },
                  { label: 'Normal (1.1s)', val: 'normal', ms: 1100 },
                  { label: 'Santai (1.8s)', val: 'relaxed', ms: 1800 },
                ].map((item) => (
                  <button
                    key={item.val}
                    onClick={() => setBotSpeed(item.val as 'fast' | 'normal' | 'relaxed')}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      botSpeedMs === item.ms
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md ring-1 ring-purple-400/50'
                        : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white hover:bg-slate-750'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Tombol Keluar Room / Kembali ke Menu Utama */}
            <div className="pt-2 space-y-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLeaveRoomOrMenu}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 cursor-pointer transition-all border border-rose-400/30"
              >
                {isInRoom ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Keluar dari Room</span>
                  </>
                ) : (
                  <>
                    <Home className="w-4 h-4" />
                    <span>Kembali ke Menu Utama</span>
                  </>
                )}
              </motion.button>

              {/* Solo Match Restart Button (if in solo mode) */}
              {!isInRoom && (
                <button
                  onClick={handleRestartGame}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-white/10 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mulai Ulang Pertandingan (Restart)</span>
                </button>
              )}
            </div>

            {/* 5. Quick Links: Aturan, Log Permainan, & Tentang Aplikasi */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              {(onOpenRules || onOpenLogs) && (
                <div className="flex items-center justify-center space-x-2">
                  {onOpenRules && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenRules();
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-sky-400 border border-sky-500/20 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Aturan Main</span>
                    </button>
                  )}
                  {onOpenLogs && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenLogs();
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-white/10 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <ScrollText className="w-3.5 h-3.5" />
                      <span>Riwayat Log</span>
                    </button>
                  )}
                </div>
              )}

              {/* About App / Version Info button (Hanya muncul saat dibuka di aplikasi Android native) */}
              {Capacitor.isNativePlatform() && (
                <button
                  onClick={() => {
                    onClose();
                    openAboutModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-amber-300 border border-amber-400/20 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tentang Aplikasi (ColorRush v1.1.0)</span>
                </button>
              )}

              {/* Exit App button (Mobile Native only) */}
              {Capacitor.isNativePlatform() && (
                <button
                  onClick={() => {
                    onClose();
                    openExitModal();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Keluar dari Aplikasi</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

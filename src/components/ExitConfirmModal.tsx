import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import { LogOut, X, AlertTriangle } from 'lucide-react';

export const ExitConfirmModal: React.FC = () => {
  const { isExitModalOpen, closeExitModal } = useGameStore();

  if (!isExitModalOpen) return null;

  const handleCancel = () => {
    soundFx.playCardDraw();
    closeExitModal();
  };

  const handleConfirmExit = async () => {
    soundFx.playCardDraw();
    closeExitModal();

    // 1. Prioritas utama: Interface Native Android (finishAffinity & System.exit)
    if (typeof (window as any).AndroidNativeApp?.exitApp === 'function') {
      (window as any).AndroidNativeApp.exitApp();
      return;
    }

    // 2. Capacitor App Plugin
    if (Capacitor.isNativePlatform()) {
      try {
        await CapApp.exitApp();
        return;
      } catch (err) {
        console.warn('[ExitApp] Gagal keluar via CapApp.exitApp:', err);
      }
    }

    // 3. Fallback web / window.close
    window.close();
  };

  return (
    <AnimatePresence>
      <div
        onClick={handleCancel}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe pl-safe pr-safe bg-slate-950/85 backdrop-blur-md overflow-hidden"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl relative flex flex-col text-center will-change-transform my-auto overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleCancel}
            className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95 z-10"
            title="Batal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon Showcase */}
          <div className="mx-auto mb-3.5 relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 via-red-500/20 to-amber-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.35)]">
              <LogOut className="w-8 h-8 -mr-1" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-950 border border-amber-400/40 text-amber-400 shadow">
              <AlertTriangle className="w-3 h-3" />
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
            Keluar dari ColorRush?
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Apakah kamu yakin ingin menutup dan keluar dari aplikasi? Progres serta poin akunmu tetap tersimpan aman.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2.5 mt-5 pt-1">
            <button
              onClick={handleCancel}
              className="py-2.5 px-3 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-xs transition-all border border-white/10 active:scale-95 cursor-pointer"
            >
              Batal
            </button>

            <button
              onClick={handleConfirmExit}
              className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Ya, Keluar</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

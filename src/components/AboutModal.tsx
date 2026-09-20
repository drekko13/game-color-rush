import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import {
  X,
  Sparkles,
  Smartphone,
  Globe,
  Bot,
  Users,
  Zap,
  ShieldCheck,
  Code2,
  Heart,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const AboutModal: React.FC = () => {
  const { isAboutModalOpen, closeAboutModal } = useGameStore();

  if (!isAboutModalOpen || !Capacitor.isNativePlatform()) return null;

  const handleClose = () => {
    soundFx.playCardDraw();
    closeAboutModal();
  };

  const isAndroid =
    typeof window !== 'undefined' &&
    (window as any).Capacitor?.getPlatform() === 'android';

  return (
    <AnimatePresence>
      <div
        onClick={handleClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 pt-safe pb-safe pl-safe pr-safe bg-slate-950/85 backdrop-blur-md overflow-hidden"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-md max-h-[92dvh] sm:max-h-[85vh] bg-slate-900 border border-white/15 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden will-change-transform my-auto"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Fixed Header */}
          <div className="px-4 sm:px-6 pt-3.5 pb-3 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur-sm z-10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-400">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide">Tentang Aplikasi</h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">Informasi Versi & Sistem</span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 -mr-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 space-y-3 overscroll-contain">
            {/* App Header Showcase */}
            <div className="flex flex-col items-center text-center pt-1 pb-1">
              <div className="relative mb-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_25px_rgba(244,63,94,0.4)] border-2 border-white/20 p-0.5 bg-gradient-to-tr from-rose-500 via-amber-500 to-sky-500">
                  <img
                    src="/app-logo.png"
                    alt="ColorRush Official Logo"
                    className="w-full h-full object-cover rounded-[14px] sm:rounded-[22px]"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 rounded-full bg-slate-950 border border-emerald-400/50 shadow">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                </div>
              </div>

              <h2 className="text-lg sm:text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-sky-400 uppercase">
                COLORRUSH
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-semibold tracking-wide">
                Run The Rainbow • Arcade Card Battle
              </p>

              {/* Version Pill Badge */}
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-black mt-2 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>Versi 1.1.0 (Build 110)</span>
              </div>
            </div>

            {/* Card 1: Informasi Sistem & Build */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5">
                <span className="text-slate-400 font-medium text-[11px] sm:text-xs">Status Aplikasi:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px] sm:text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Resmi & Terbaru</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5">
                <span className="text-slate-400 font-medium text-[11px] sm:text-xs">Platform:</span>
                <span className="text-white font-bold flex items-center gap-1 text-[11px] sm:text-xs">
                  {isAndroid ? (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>Android APK (Native)</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Android Web / Browser</span>
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5">
                <span className="text-slate-400 font-medium text-[11px] sm:text-xs">Waktu Rilis:</span>
                <span className="text-slate-200 font-bold text-[11px] sm:text-xs">September 2026</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium text-[11px] sm:text-xs">Pengembang:</span>
                <span className="text-amber-300 font-bold flex items-center gap-1 text-[11px] sm:text-xs">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                  <span>Project Andre</span>
                </span>
              </div>
            </div>

            {/* Card 2: Fitur Utama Game */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
              <div className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Fitur & Mode Permainan</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                <div className="p-2 rounded-xl bg-slate-900 border border-white/5 flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[11px] truncate">100% Offline</div>
                    <div className="text-[10px] text-slate-400 truncate">Solo vs 3 AI Bot cerdas</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-white/5 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[11px] truncate">Multiplayer</div>
                    <div className="text-[10px] text-slate-400 truncate">Room online 2-4 pemain</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-white/5 flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[11px] truncate">Duel RUSH!</div>
                    <div className="text-[10px] text-slate-400 truncate">Quick-time teriak UNO</div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-white/5 flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-[11px] truncate">Stack Penalti</div>
                    <div className="text-[10px] text-slate-400 truncate">Tumpukan kartu +2 & +4</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Catatan Pembaruan Terkini (Changelog v1.1.0) */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/25 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-amber-300 text-[11px] sm:text-xs flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Catatan Pembaruan v1.1.0 (Terbaru)</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-black">
                  Build 110
                </span>
              </div>
              <ul className="text-[10px] sm:text-[11px] text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-white">Logo & Splash Screen Resmi:</strong> Logo *COLOR RUSH - Run The Rainbow* resmi diterapkan di seluruh ikon launcher Android dan layar pembuka.
                </li>
                <li>
                  <strong className="text-white">Deteksi Jaringan Cerdas:</strong> Pengecekan koneksi nyata ke server backend tanpa peringatan offline palsu saat awal aplikasi dibuka.
                </li>
                <li>
                  <strong className="text-white">Mode Offline Otomatis:</strong> Beralih instan ke Solo vs Bot AI cerdas saat data seluler & Wi-Fi mati.
                </li>
                <li>
                  <strong className="text-white">UI/UX Mobile Responsif:</strong> Tampilan modal Tentang Aplikasi dengan header & footer tetap agar tombol tutup selalu mudah diakses di HP.
                </li>
                <li>
                  <strong className="text-white">Optimasi Performa 60 FPS:</strong> Animasi popup, penalti kartu, dan transisi layar mulus tanpa lag di Android.
                </li>
              </ul>
            </div>

            {/* Card 4: Versi Sebelumnya (v1.0.0) */}
            <div className="p-2.5 rounded-2xl bg-slate-950/40 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>Versi 1.0.0 (Rilis Perdana)</span>
                <span className="text-slate-500">Build 100</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Peluncuran perdana: Mode Solo vs 3 Bot AI, Multiplayer Online kustom room, Duel RUSH! QTE, dan Stack Penalti kartu.
              </p>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-3 sm:p-4 border-t border-white/10 shrink-0 bg-slate-900/90 backdrop-blur-sm z-10">
            <button
              onClick={handleClose}
              className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-sky-600 hover:brightness-110 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

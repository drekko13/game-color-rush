import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';
import { UsernamePlate } from './UsernamePlate';
import type { LeaderboardEntry, LeaderboardCategory } from '../types/game';
import {
  Trophy,
  Crown,
  Medal,
  Target,
  Sparkles,
  RefreshCw,
  X,
  Info,
  LogIn,
  Award,
} from 'lucide-react';

export const LeaderboardModal: React.FC = () => {
  const {
    isLeaderboardOpen,
    closeLeaderboardModal,
    leaderboardCategory,
    leaderboardEntries,
    currentUserLeaderboardRank,
    isLeaderboardLoading,
    setLeaderboardCategory,
    fetchLeaderboard,
    authUser,
    openAuthModal,
  } = useGameStore();

  useEffect(() => {
    if (isLeaderboardOpen) {
      fetchLeaderboard(leaderboardCategory);
    }
  }, [isLeaderboardOpen, leaderboardCategory, fetchLeaderboard]);

  if (!isLeaderboardOpen) return null;

  const top1: LeaderboardEntry | undefined = leaderboardEntries[0];
  const top2: LeaderboardEntry | undefined = leaderboardEntries[1];
  const top3: LeaderboardEntry | undefined = leaderboardEntries[2];

  const getEntryPoints = (entry?: LeaderboardEntry) => {
    if (!entry) return 0;
    return typeof entry.allTimePoints === 'number' ? entry.allTimePoints : (entry.totalPoints || 0);
  };

  const handleCategorySwitch = (cat: LeaderboardCategory) => {
    if (cat === leaderboardCategory) return;
    soundFx.playCardDraw();
    setLeaderboardCategory(cat);
  };

  const handleRefresh = () => {
    soundFx.playCardDraw();
    fetchLeaderboard(leaderboardCategory);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 select-none">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLeaderboardModal}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-10"
        >
          {/* Ambient Lighting Accents */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 relative z-10 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <Trophy className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center">
                    PAPAN PERINGKAT
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    Season 1
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Persaingan Para Master Kartu Color Clash
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLeaderboardLoading}
                title="Segarkan Peringkat"
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLeaderboardLoading ? 'animate-spin text-amber-400' : ''}`}
                />
              </button>

              {/* Close Button */}
              <button
                onClick={closeLeaderboardModal}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-white/10 transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Switcher Tabs */}
          <div className="px-4 sm:px-6 pt-3 pb-2 flex flex-col space-y-2 shrink-0 relative z-10">
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900/90 border border-white/10 shadow-inner">
              <button
                onClick={() => handleCategorySwitch('points')}
                className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  leaderboardCategory === 'points'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.01]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span>Total Poin</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/20 font-bold">
                  Akumulasi
                </span>
              </button>

              <button
                onClick={() => handleCategorySwitch('winRate')}
                className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  leaderboardCategory === 'winRate'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.01]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Win Rate %</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950/20 font-bold">
                  Taktis
                </span>
              </button>
            </div>

            {/* Hint / Notification regarding Points Rule */}
            {leaderboardCategory === 'points' && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/20 text-amber-300 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Peringkat dihitung dari seluruh poin yang pernah didapatkan (tidak berkurang saat belanja di Toko).
                </span>
              </div>
            )}

            {/* Hint / Notification regarding Qualification Rule */}
            {leaderboardCategory === 'winRate' && (
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-[11px]">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Syarat Kualifikasi: Minimal bermain 3 pertandingan untuk masuk peringkat akurasi Win Rate.
                </span>
              </div>
            )}
          </div>

          {/* Scrollable Modal Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-4 relative z-10 no-scrollbar">
            {isLeaderboardLoading && leaderboardEntries.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs text-slate-400 font-bold">Memuat papan peringkat...</p>
              </div>
            ) : leaderboardEntries.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Award className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">Belum Ada Data Peringkat</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Jadilah yang pertama bermain dan menangkan pertandingan untuk menguasai posisi #1!
                </p>
              </div>
            ) : (
              <>
                {/* =========================================================================
                    TOP #1 - #3 PODIUM SECTION (Hanya muncul jika data ada)
                    ========================================================================= */}
                <div className="pt-3 pb-2">
                  {/* Kondisi 1: Hanya ada 1 pemain (Juara Tunggal) */}
                  {leaderboardEntries.length === 1 && top1 && (
                    <div className="flex flex-col items-center max-w-xs mx-auto">
                      {/* Floating Crown */}
                      <motion.div
                        animate={{ y: [-3, 3, -3] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                        className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] mb-1.5"
                      >
                        <Crown className="w-8 h-8 fill-amber-400" />
                      </motion.div>

                      {/* Avatar with Gold Frame */}
                      <div className="relative mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black text-sm flex items-center justify-center absolute -top-2.5 -right-1 shadow-lg z-10 border-2 border-slate-950">
                          1
                        </div>
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-amber-400/40 blur-lg animate-pulse" />
                          <PlayerAvatar
                            avatarId={top1.avatar}
                            size="lg"
                            borderId={top1.activeProfileBorder || 'default'}
                          />
                        </div>
                      </div>

                      <UsernamePlate
                        username={top1.username}
                        plateId={top1.activeUsernameBorder || 'default'}
                        size="md"
                        className="text-center font-black text-sm truncate max-w-[160px] mb-1.5"
                      />

                      <div className="flex items-center space-x-1.5 mb-2">
                        <span className="text-base">{top1.tier?.badge || '👑'}</span>
                        <span className="text-xs text-amber-300 font-black tracking-wide uppercase">
                          {top1.tier?.name}
                        </span>
                      </div>

                      {/* Big Champion Card */}
                      <div className="w-full py-4 px-6 rounded-2xl bg-gradient-to-b from-amber-600/90 via-amber-700/80 to-slate-950 border-t-2 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
                        <Trophy className="w-6 h-6 text-amber-200 mb-1.5" />
                        <span className="text-lg sm:text-xl font-black text-white drop-shadow">
                          {leaderboardCategory === 'points'
                            ? `${getEntryPoints(top1).toLocaleString()} Poin Total`
                            : `${top1.winRate}% Win Rate`}
                        </span>
                        <span className="text-xs text-amber-200/90 font-bold mt-0.5">
                          {top1.wins} Menang • {top1.totalMatches} Pertandingan
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Kondisi 2: Ada 2 pemain (#1 & #2) */}
                  {leaderboardEntries.length === 2 && top1 && top2 && (
                    <div className="flex items-end justify-center gap-3 sm:gap-6 max-w-sm mx-auto">
                      {/* #2 Silver */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="relative mb-2">
                          <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center absolute -top-2 -right-1 shadow-md z-10 border border-white">
                            2
                          </div>
                          <PlayerAvatar
                            avatarId={top2.avatar}
                            size="md"
                            borderId={top2.activeProfileBorder || 'default'}
                          />
                        </div>
                        <UsernamePlate
                          username={top2.username}
                          plateId={top2.activeUsernameBorder || 'default'}
                          size="sm"
                          className="text-center font-bold text-[11px] truncate max-w-[100px] mb-1"
                        />
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-xs">{top2.tier?.badge}</span>
                          <span className="text-[10px] text-slate-400 font-bold">{top2.tier?.name}</span>
                        </div>
                        <div className="w-full h-24 sm:h-28 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t-2 border-slate-300/80 shadow-[0_0_15px_rgba(203,213,225,0.15)] flex flex-col items-center justify-center p-2 text-center">
                          <Medal className="w-4 h-4 text-slate-300 mb-1" />
                          <span className="text-xs font-black text-slate-200">
                            {leaderboardCategory === 'points'
                              ? `${getEntryPoints(top2).toLocaleString()} Pts`
                              : `${top2.winRate}% WR`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {top2.wins}M • {top2.losses}K
                          </span>
                        </div>
                      </div>

                      {/* #1 Gold */}
                      <div className="flex-1 flex flex-col items-center -mt-3">
                        <motion.div
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                          className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] mb-1"
                        >
                          <Crown className="w-6 h-6 fill-amber-400" />
                        </motion.div>
                        <div className="relative mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black text-xs flex items-center justify-center absolute -top-2 -right-1 shadow-lg z-10 border-2 border-slate-950">
                            1
                          </div>
                          <PlayerAvatar
                            avatarId={top1.avatar}
                            size="lg"
                            borderId={top1.activeProfileBorder || 'default'}
                          />
                        </div>
                        <UsernamePlate
                          username={top1.username}
                          plateId={top1.activeUsernameBorder || 'default'}
                          size="md"
                          className="text-center font-black text-xs truncate max-w-[120px] mb-1"
                        />
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-sm">{top1.tier?.badge}</span>
                          <span className="text-xs text-amber-300 font-black">{top1.tier?.name}</span>
                        </div>
                        <div className="w-full h-28 sm:h-32 rounded-2xl bg-gradient-to-b from-amber-600 via-amber-700 to-slate-950 border-t-2 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center p-2 text-center">
                          <Trophy className="w-5 h-5 text-amber-200 mb-1" />
                          <span className="text-sm sm:text-base font-black text-white drop-shadow">
                            {leaderboardCategory === 'points'
                              ? `${getEntryPoints(top1).toLocaleString()} Pts`
                              : `${top1.winRate}% WR`}
                          </span>
                          <span className="text-[10px] text-amber-200/80 font-bold">
                            {top1.wins}M • {top1.losses}K
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kondisi 3: Ada 3 atau lebih pemain (#2, #1, #3) */}
                  {leaderboardEntries.length >= 3 && top1 && top2 && top3 && (
                    <div className="flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto">
                      {/* PODIUM #2 (Silver - Kiri) */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center group">
                          <div className="relative mb-2">
                            <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center absolute -top-2 -right-1 shadow-md z-10 border border-white">
                              2
                            </div>
                            <PlayerAvatar
                              avatarId={top2.avatar}
                              size="md"
                              borderId={top2.activeProfileBorder || 'default'}
                            />
                          </div>

                          <UsernamePlate
                            username={top2.username}
                            plateId={top2.activeUsernameBorder || 'default'}
                            size="sm"
                            className="text-center font-bold text-[11px] truncate max-w-[100px] mb-1"
                          />

                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs">{top2.tier?.badge || '🥈'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {top2.tier?.name}
                            </span>
                          </div>

                          <div className="w-full h-24 sm:h-28 rounded-2xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t-2 border-slate-300/80 shadow-[0_0_15px_rgba(203,213,225,0.15)] flex flex-col items-center justify-center p-2 text-center">
                            <Medal className="w-4 h-4 text-slate-300 mb-1" />
                            <span className="text-xs font-black text-slate-200">
                              {leaderboardCategory === 'points'
                                ? `${getEntryPoints(top2).toLocaleString()} Pts`
                                : `${top2.winRate}% WR`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {top2.wins}M • {top2.losses}K
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PODIUM #1 (Gold - Tengah - Elevated Champion) */}
                      <div className="flex-1 flex flex-col items-center -mt-4">
                        <div className="w-full flex flex-col items-center group relative">
                          <motion.div
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                            className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] mb-1"
                          >
                            <Crown className="w-6 h-6 fill-amber-400" />
                          </motion.div>

                          <div className="relative mb-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black text-xs flex items-center justify-center absolute -top-2 -right-1 shadow-lg z-10 border-2 border-slate-950">
                              1
                            </div>
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-md animate-pulse" />
                              <PlayerAvatar
                                avatarId={top1.avatar}
                                size="lg"
                                borderId={top1.activeProfileBorder || 'default'}
                              />
                            </div>
                          </div>

                          <UsernamePlate
                            username={top1.username}
                            plateId={top1.activeUsernameBorder || 'default'}
                            size="md"
                            className="text-center font-black text-xs truncate max-w-[120px] mb-1"
                          />

                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-sm">{top1.tier?.badge || '👑'}</span>
                            <span className="text-xs text-amber-300 font-black">
                              {top1.tier?.name}
                            </span>
                          </div>

                          <div className="w-full h-32 sm:h-36 rounded-2xl bg-gradient-to-b from-amber-600 via-amber-700 to-slate-950 border-t-2 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center p-2 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
                            <Trophy className="w-5 h-5 text-amber-200 mb-1" />
                            <span className="text-sm sm:text-base font-black text-white drop-shadow">
                              {leaderboardCategory === 'points'
                                ? `${getEntryPoints(top1).toLocaleString()} Pts`
                                : `${top1.winRate}% WR`}
                            </span>
                            <span className="text-[10px] text-amber-200/80 font-bold">
                              {top1.wins} Menang • {top1.totalMatches} Main
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PODIUM #3 (Bronze - Kanan) */}
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center group">
                          <div className="relative mb-2">
                            <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center absolute -top-2 -right-1 shadow-md z-10 border border-amber-500">
                              3
                            </div>
                            <PlayerAvatar
                              avatarId={top3.avatar}
                              size="md"
                              borderId={top3.activeProfileBorder || 'default'}
                            />
                          </div>

                          <UsernamePlate
                            username={top3.username}
                            plateId={top3.activeUsernameBorder || 'default'}
                            size="sm"
                            className="text-center font-bold text-[11px] truncate max-w-[100px] mb-1"
                          />

                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs">{top3.tier?.badge || '🥉'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {top3.tier?.name}
                            </span>
                          </div>

                          <div className="w-full h-20 sm:h-24 rounded-2xl bg-gradient-to-b from-amber-900 via-amber-950 to-slate-900 border-t-2 border-amber-600/80 shadow-[0_0_15px_rgba(180,83,9,0.15)] flex flex-col items-center justify-center p-2 text-center">
                            <Medal className="w-4 h-4 text-amber-500 mb-1" />
                            <span className="text-xs font-black text-amber-300">
                              {leaderboardCategory === 'points'
                                ? `${getEntryPoints(top3).toLocaleString()} Pts`
                                : `${top3.winRate}% WR`}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {top3.wins}M • {top3.losses}K
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* =========================================================================
                    DAFTAR KLASEMEN SEMUA PEMAIN (LIST TABLE SECTION)
                    ========================================================================= */}
                {leaderboardEntries.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <span>Daftar Peringkat Pemain ({leaderboardEntries.length})</span>
                      <span>{leaderboardCategory === 'points' ? 'Total Poin' : 'Akurasi Win Rate'}</span>
                    </div>

                    <div className="space-y-1.5">
                      {leaderboardEntries.map((entry) => {
                        const isMe = authUser?.id === entry.id;
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                              isMe
                                ? 'bg-amber-500/15 border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                : 'bg-slate-900/60 border-white/5 hover:bg-slate-800/60'
                            }`}
                          >
                            {/* Left: Rank Badge & Avatar & Name */}
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-7 text-center shrink-0 flex items-center justify-center">
                                {entry.rank === 1 ? (
                                  <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                                    1
                                  </span>
                                ) : entry.rank === 2 ? (
                                  <span className="w-6 h-6 rounded-lg bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center shadow-md">
                                    2
                                  </span>
                                ) : entry.rank === 3 ? (
                                  <span className="w-6 h-6 rounded-lg bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                                    3
                                  </span>
                                ) : (
                                  <span className="font-black text-xs text-slate-400">
                                    #{entry.rank}
                                  </span>
                                )}
                              </div>

                              <PlayerAvatar
                                avatarId={entry.avatar}
                                size="xs"
                                borderId={entry.activeProfileBorder || 'default'}
                              />

                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5 truncate">
                                  <UsernamePlate
                                    username={entry.username}
                                    plateId={entry.activeUsernameBorder || 'default'}
                                    size="sm"
                                  />
                                  {isMe && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-black shrink-0">
                                      Kamu
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                                  <span>{entry.tier?.badge}</span>
                                  <span>{entry.tier?.name}</span>
                                  <span>•</span>
                                  <span>{entry.wins} Menang ({entry.totalMatches} Game)</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Points or Win Rate */}
                            <div className="text-right shrink-0">
                              <div
                                className={`text-xs font-black ${
                                  leaderboardCategory === 'points'
                                    ? 'text-amber-300'
                                    : 'text-cyan-300'
                                }`}
                              >
                                {leaderboardCategory === 'points'
                                  ? `${getEntryPoints(entry).toLocaleString()} Pts`
                                  : `${entry.winRate}%`}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                {entry.wins}W - {entry.losses}L
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* =========================================================================
              STICKY BOTTOM FOOTER: YOUR RANK (PERINGKAT KAMU)
              ========================================================================= */}
          <div className="p-3 sm:p-4 bg-slate-950/95 border-t border-white/10 shrink-0 relative z-20">
            {authUser ? (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-400/30">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-300 text-xs shrink-0">
                    {currentUserLeaderboardRank && currentUserLeaderboardRank.rank > 0
                      ? `#${currentUserLeaderboardRank.rank}`
                      : '-'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        Peringkat Kamu:
                      </span>
                      <UsernamePlate
                        username={authUser.username}
                        plateId={authUser.activeUsernameBorder || 'default'}
                        size="sm"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {currentUserLeaderboardRank && currentUserLeaderboardRank.rank > 0
                        ? `Posisi #${currentUserLeaderboardRank.rank} dari ${leaderboardEntries.length} pemain terbaik`
                        : leaderboardCategory === 'winRate'
                        ? 'Belum terkualifikasi (mainkan min. 3 pertandingan)'
                        : 'Mainkan pertandingan untuk masuk peringkat!'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-amber-300">
                    {leaderboardCategory === 'points'
                      ? `${((authUser.allTimePoints ?? authUser.totalPoints) || 0).toLocaleString()} Pts Total`
                      : `${authUser.winRate}% WR`}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Saldo Toko: {authUser.totalPoints.toLocaleString()} Pts
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/80 border border-white/10">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Ingin Masuk ke Leaderboard?</p>
                    <p className="text-[10px] text-slate-400">
                      Masuk akun agar riwayat kemenangan dan poinmu tercatat!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    closeLeaderboardModal();
                    openAuthModal('login');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white font-black text-xs shadow transition-transform active:scale-95 flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

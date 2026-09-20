import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import { PlayerAvatar, AVATAR_OPTIONS } from './PlayerAvatar';
import { UsernamePlate } from './UsernamePlate';
import { apiService } from '../services/api';
import {
  X,
  Trophy,
  Award,
  Users,
  Bot,
  LogOut,
  Calendar,
  History,
  Sparkles,
  Clock,
  ShoppingBag,
  Swords,
  Shield,
} from 'lucide-react';

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} hari lalu`;
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Baru saja';
  }
}

export const ProfileHistoryModal: React.FC = () => {
  const {
    isProfileModalOpen,
    closeProfileModal,
    authUser,
    matchHistory,
    fetchMatchHistory,
    logout,
    openAuthModal,
    openShopModal,
    setPlayerProfile,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'history' | 'avatar'>('history');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  useEffect(() => {
    if (isProfileModalOpen && authUser) {
      fetchMatchHistory();
    }
  }, [isProfileModalOpen, authUser, fetchMatchHistory]);

  if (!isProfileModalOpen) return null;

  // If somehow not logged in, prompt to log in
  if (!authUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-safe pb-safe pl-safe pr-safe bg-slate-950/80 backdrop-blur-md">
        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
          <h3 className="text-xl font-black text-white">Belum Masuk Akun</h3>
          <p className="text-xs text-slate-400">
            Masuk atau buat akun untuk melihat statistik profil, rank tier, dan riwayat pertandinganmu.
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                closeProfileModal();
                openAuthModal('login');
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs uppercase"
            >
              Masuk
            </button>
            <button
              onClick={() => closeProfileModal()}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tier = authUser.tier || { name: 'Bronze', badge: '🥉', color: 'from-orange-400 to-amber-700' };
  const winRate = authUser.winRate || 0;

  const handleSelectAvatar = async (avatarId: string) => {
    if (isUpdatingAvatar || avatarId === authUser.avatar) return;
    setIsUpdatingAvatar(true);
    soundFx.playCardDraw();
    try {
      const updated = await apiService.updateProfile({ avatar: avatarId });
      setPlayerProfile(updated.username, updated.avatar);
      useGameStore.setState({ authUser: updated });
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah avatar.');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Apakah kamu yakin ingin keluar dari akun ini?')) {
      soundFx.playCardDraw();
      await logout();
      closeProfileModal();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe pl-safe pr-safe bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-xl max-h-[92vh] bg-slate-900 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col relative overflow-hidden my-auto will-change-transform"
        >
          {/* Top ambient glow (desktop only) */}
          <div className="hidden md:block absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-tr from-amber-500/20 via-rose-500/15 to-sky-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => {
              soundFx.playCardDraw();
              closeProfileModal();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-20 cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Player Profile Header Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 shadow-inner relative z-10 shrink-0 mb-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <PlayerAvatar
                  avatarId={authUser.avatar}
                  size="lg"
                  borderId={authUser.activeProfileBorder || 'default'}
                />
                <span className="absolute -bottom-1 -right-1 text-base sm:text-lg select-none" title={`Rank: ${tier.name}`}>
                  {tier.badge}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <UsernamePlate
                    username={authUser.username}
                    plateId={authUser.activeUsernameBorder || 'default'}
                    size="md"
                  />
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.color} text-slate-950 shadow-sm shrink-0`}
                  >
                    {tier.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{authUser.email}</p>
                <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>Bergabung sejak {new Date(authUser.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Total Accumulated Points Badge */}
              <div className="text-right shrink-0 bg-amber-500/10 border border-amber-400/30 rounded-2xl p-2 sm:p-2.5">
                <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-end">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-400 animate-spin" />
                  Total Poin
                </div>
                <div className="text-lg sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                  {authUser.totalPoints.toLocaleString('id-ID')}
                </div>
                <div className="text-[9px] text-amber-400/70 font-semibold">UNO Points</div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5 text-center">
              <div className="bg-slate-900/60 rounded-xl py-1.5 px-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tanding</div>
                <div className="text-sm font-black text-white">{authUser.totalMatches}</div>
              </div>
              <div className="bg-emerald-500/10 rounded-xl py-1.5 px-1 border border-emerald-500/20">
                <div className="text-[10px] font-bold text-emerald-400 uppercase">Menang</div>
                <div className="text-sm font-black text-emerald-300">{authUser.wins}</div>
              </div>
              <div className="bg-rose-500/10 rounded-xl py-1.5 px-1 border border-rose-500/20">
                <div className="text-[10px] font-bold text-rose-400 uppercase">Kalah</div>
                <div className="text-sm font-black text-rose-300">{authUser.losses}</div>
              </div>
              <div className="bg-sky-500/10 rounded-xl py-1.5 px-1 border border-sky-500/20">
                <div className="text-[10px] font-bold text-sky-400 uppercase">Win Rate</div>
                <div className="text-sm font-black text-sky-300">{winRate}%</div>
              </div>
            </div>
          </div>

          {/* Tabs: Riwayat vs Avatar & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3 shrink-0">
            {/* Tab Switcher Pills */}
            <div className="flex items-center space-x-1 p-1 rounded-2xl bg-slate-950/80 border border-white/10 shrink-0">
              <button
                onClick={() => {
                  soundFx.playCardDraw();
                  setActiveTab('history');
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <span className="sm:hidden">Riwayat ({matchHistory.length})</span>
                  <span className="hidden sm:inline">Riwayat Pertandingan ({matchHistory.length})</span>
                </span>
              </button>

              <button
                onClick={() => {
                  soundFx.playCardDraw();
                  setActiveTab('avatar');
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  activeTab === 'avatar'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>
                  <span className="sm:hidden">Avatar</span>
                  <span className="hidden sm:inline">Ganti Avatar</span>
                </span>
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-end space-x-1.5 shrink-0">
              <button
                onClick={() => {
                  soundFx.playCardDraw();
                  closeProfileModal();
                  openShopModal();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow active:scale-95 shrink-0"
                title="Buka Toko Kosmetik"
              >
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                <span>Toko</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95 shrink-0"
                title="Keluar dari Akun"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT: RIWAYAT PERTANDINGAN */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar min-h-[200px]">
              {matchHistory.length === 0 ? (
                <div className="h-44 sm:h-52 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500">
                    <Swords className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Belum Ada Riwayat Bermain</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Mainkan mode Solo vs Bot atau Multiplayer Room untuk mengumpulkan poin dan mencatat riwayat kemenanganmu di sini!
                  </p>
                </div>
              ) : (
                matchHistory.map((item) => {
                  const isWin = item.result === 'win';
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isWin
                          ? 'bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-slate-900/90 border-amber-400/30 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                          : 'bg-slate-950/60 border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Left: Icon Badge & Match Info */}
                      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isWin
                              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                              : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          }`}
                        >
                          {isWin ? <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> : <Shield className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Row 1: Result Badge + Mode Tag + Timestamp */}
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span
                              className={`text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                                isWin
                                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                                  : 'bg-slate-800 text-slate-300 border border-white/10'
                              }`}
                            >
                              {isWin ? 'MENANG' : 'KALAH'}
                            </span>

                            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/90 text-slate-300 font-semibold flex items-center space-x-1 shrink-0">
                              {item.gameMode === 'multiplayer' ? (
                                <>
                                  <Users className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                                  <span>Multiplayer</span>
                                </>
                              ) : (
                                <>
                                  <Bot className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                  <span>Solo vs Bot</span>
                                </>
                              )}
                            </span>

                            <span className="text-[10px] text-slate-500 flex items-center shrink-0">
                              <Clock className="w-2.5 h-2.5 mr-1 text-slate-500 shrink-0" />
                              <span>{formatRelativeTime(item.playedAt)}</span>
                            </span>
                          </div>

                          {/* Row 2: Opponents List */}
                          {item.opponents && item.opponents.length > 0 && (
                            <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                              <span className="text-slate-500 font-semibold">Lawan:</span>{' '}
                              <span className="text-slate-300">{item.opponents.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Points earned */}
                      <div className="text-right shrink-0 pl-2 border-l border-white/5">
                        <div
                          className={`text-xs sm:text-sm md:text-base font-black tracking-tight ${
                            isWin ? 'text-amber-300' : 'text-slate-400'
                          }`}
                        >
                          +{item.pointsEarned} Pts
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500">
                          {isWin ? 'Bonus Juara' : 'Partisipasi'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB CONTENT: GANTI AVATAR */}
          {activeTab === 'avatar' && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <p className="text-xs text-slate-400">
                Pilih avatar yang akan ditampilkan di profil, kartu identitas, dan ruang bermainmu:
              </p>
              <div className="grid grid-cols-5 gap-2 sm:gap-3 py-2">
                {AVATAR_OPTIONS.map((opt) => {
                  const isCurrent = authUser.avatar === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectAvatar(opt.id)}
                      disabled={isUpdatingAvatar}
                      className={`p-2 rounded-2xl flex flex-col items-center space-y-1.5 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-sky-500/20 ring-2 ring-sky-400 shadow-md scale-105'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <PlayerAvatar avatarId={opt.id} size="md" />
                      <span className="text-[10px] font-bold text-slate-300 truncate w-full text-center">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

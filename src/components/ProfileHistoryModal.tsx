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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="w-full max-w-xl max-h-[92vh] bg-slate-900 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col relative overflow-hidden my-auto"
        >
          {/* Top ambient glow */}
          <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-tr from-amber-500/20 via-rose-500/15 to-sky-500/20 rounded-full blur-3xl pointer-events-none" />

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

          {/* Tabs: Riwayat vs Avatar */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/5">
              <button
                onClick={() => {
                  soundFx.playCardDraw();
                  setActiveTab('history');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Riwayat Pertandingan ({matchHistory.length})</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playCardDraw();
                  setActiveTab('avatar');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'avatar'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-sky-400" />
                <span>Ganti Avatar</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  soundFx.playCardDraw();
                  closeProfileModal();
                  openShopModal();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 text-xs font-black transition-all flex items-center space-x-1.5 cursor-pointer shadow"
                title="Buka Toko Kosmetik"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toko Kosmetik</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Keluar dari Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>

          {/* TAB CONTENT: RIWAYAT PERTANDINGAN */}
          {activeTab === 'history' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-[220px]">
              {matchHistory.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-slate-950/40 border border-dashed border-white/10 space-y-2">
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
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isWin
                          ? 'bg-amber-500/10 border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.08)]'
                          : 'bg-slate-950/60 border-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isWin
                              ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                              : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                          }`}
                        >
                          {isWin ? <Trophy className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-xs font-black uppercase tracking-wider ${
                                isWin ? 'text-amber-300' : 'text-slate-300'
                              }`}
                            >
                              {isWin ? 'MENANG' : 'KALAH'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold flex items-center space-x-1">
                              {item.gameMode === 'multiplayer' ? (
                                <>
                                  <Users className="w-2.5 h-2.5 mr-1 text-sky-400" />
                                  <span>Multiplayer</span>
                                </>
                              ) : (
                                <>
                                  <Bot className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                                  <span>Solo vs Bot</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-slate-500" />
                              {formatRelativeTime(item.playedAt)}
                            </span>
                            {item.opponents && item.opponents.length > 0 && (
                              <span className="truncate max-w-[150px] sm:max-w-xs text-slate-400">
                                Lawan: {item.opponents.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Points earned */}
                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm sm:text-base font-black ${
                            isWin ? 'text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          +{item.pointsEarned} Pts
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isWin ? 'Bonus Menang' : 'Partisipasi'}
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

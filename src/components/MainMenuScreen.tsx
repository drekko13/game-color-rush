import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import { socketService } from '../services/socket';
import { checkNetworkConnectivity } from '../services/network';
import { PlayerAvatar, AVATAR_OPTIONS } from './PlayerAvatar';
import { UsernamePlate } from './UsernamePlate';
import {
  Sparkles,
  Bot,
  Users,
  Radio,
  PlusCircle,
  LogIn,
  Globe,
  Lock,
  ArrowRight,
  RefreshCw,
  Zap,
  Beer,
  Crown,
  Play,
  ArrowLeft,
  ShoppingBag,
  Trophy,
  WifiOff,
  Info,
} from 'lucide-react';

export const MainMenuScreen: React.FC = () => {
  const {
    playerName,
    playerAvatar,
    setPlayerProfile,
    startSoloGame,
    joinRandomMatch,
    createCustomRoom,
    joinCustomRoom,
    publicRooms,
    fetchPublicRooms,
    partyDrinkPenaltyEnabled,
    togglePartyDrinkPenalty,
    onlineCount,
    isSearchingMatch,
    authUser,
    openAuthModal,
    openProfileModal,
    openShopModal,
    openLeaderboardModal,
    isOnline,
    isCheckingConnection,
    initMultiplayerSocket,
    openAboutModal,
  } = useGameStore();

  const [multiplayerTab, setMultiplayerTab] = useState<'quick' | 'create' | 'join' | 'public'>('quick');
  const [joinInput, setJoinInput] = useState('');
  const [roomIsPublic, setRoomIsPublic] = useState(true);
  const [roomMaxSlots, setRoomMaxSlots] = useState<2 | 3 | 4>(4);
  const [showMobileModes, setShowMobileModes] = useState(false);

  // Poll public rooms when public tab is active
  useEffect(() => {
    fetchPublicRooms();
    const timer = setInterval(() => {
      fetchPublicRooms();
    }, 2500);
    return () => clearInterval(timer);
  }, [fetchPublicRooms]);

  const handleStartSolo = () => {
    soundFx.playCardDraw();
    startSoloGame();
  };

  const handleRandomMatch = () => {
    soundFx.playCardDraw();
    joinRandomMatch();
  };

  const handleCreateRoom = () => {
    soundFx.playCardDraw();
    createCustomRoom({ isPublic: roomIsPublic, maxPlayers: roomMaxSlots });
  };

  const handleJoinByCode = () => {
    if (joinInput.trim()) {
      soundFx.playCardDraw();
      joinCustomRoom(joinInput.trim());
    }
  };

  const handleRandomizeName = () => {
    const randomNum = Math.floor(Math.random() * 899 + 100);
    const randomOpt = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    setPlayerProfile(`Player ${randomNum}`, randomOpt.id);
  };

  const handleRetryConnection = async () => {
    soundFx.playCardDraw();
    useGameStore.setState({ isCheckingConnection: true });
    const isConnected = await checkNetworkConnectivity(2500);
    useGameStore.setState({ isOnline: isConnected, isCheckingConnection: false });
    if (isConnected) {
      socketService.reconnect();
      initMultiplayerSocket();
    }
  };

  return (
    <div className="w-full max-w-full h-dvh md:h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between select-none overflow-x-hidden overflow-y-auto md:overflow-hidden relative p-3 md:p-6 pt-safe pb-safe-nav pl-safe pr-safe">
      {/* Ambient background glows (contained so they never cause horizontal scroll on mobile) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Brand Pill Header */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between py-1.5 px-2.5 sm:px-4 md:px-5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-sky-500 flex items-center justify-center shadow-lg font-black text-white text-xs sm:text-sm shrink-0">
            CR
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-sky-400 uppercase">
              ColorRush
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider hidden md:block">
              High Energy Arcade Card Battle
            </p>
          </div>
        </div>

        {/* Header Actions: Leaderboard + Toko + Account + Online Count */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Papan Peringkat (Leaderboard) Button */}
          <button
            onClick={() => {
              soundFx.playCardDraw();
              openLeaderboardModal();
            }}
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all flex items-center space-x-1 text-xs font-black cursor-pointer shrink-0"
            title="Buka Papan Peringkat (Leaderboard Juara #1-3)"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Peringkat</span>
          </button>

          {/* Toko Poin (Store) Button */}
          <button
            onClick={() => {
              soundFx.playCardDraw();
              openShopModal();
            }}
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all flex items-center space-x-1 text-xs font-black cursor-pointer shrink-0"
            title="Buka Toko Poin (Beli Border Profile & Username)"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Toko</span>
          </button>

          {/* Account Profile / Login Button */}
          {authUser ? (
            <button
              onClick={() => {
                soundFx.playCardDraw();
                openProfileModal();
              }}
              className="px-1.5 sm:px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all flex items-center space-x-1 text-xs font-black cursor-pointer shrink-0 max-w-[120px] sm:max-w-none"
              title="Buka Profil & Riwayat Poin"
            >
              <PlayerAvatar
                avatarId={authUser.avatar}
                size="xs"
                borderId={authUser.activeProfileBorder || 'default'}
              />
              <UsernamePlate
                username={authUser.username}
                borderId={authUser.activeUsernameBorder || 'default'}
                className="hidden md:inline text-xs truncate max-w-[80px]"
              />
              <span className="px-1 sm:px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                {authUser.totalPoints} Pts
              </span>
            </button>
          ) : isOnline ? (
            <button
              onClick={() => {
                soundFx.playCardDraw();
                openAuthModal('login');
              }}
              className="px-2 sm:px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white transition-all flex items-center space-x-1 text-xs font-black shadow-md cursor-pointer shrink-0"
              title="Masuk / Daftar Akun untuk Menyimpan Poin & Riwayat"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
          ) : null}

          {/* Live Online Users / Offline / Checking Badge */}
          {isCheckingConnection ? (
            <div className="flex items-center space-x-1 px-1.5 sm:px-2.5 py-1 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 shrink-0" title="Memeriksa Koneksi...">
              <RefreshCw className="w-3 h-3 animate-spin shrink-0 text-slate-400" />
              <span className="text-[10px] sm:text-[11px] font-bold hidden sm:inline">Cek...</span>
            </div>
          ) : isOnline ? (
            <div className="flex items-center space-x-1 px-1.5 sm:px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-[10px] sm:text-[11px] font-black">{onlineCount}</span>
              <Users className="w-3 h-3 hidden sm:inline" />
            </div>
          ) : (
            <div className="flex items-center space-x-1 px-1.5 sm:px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300 shrink-0" title="Mode Offline (Tidak Ada Internet)">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-[10px] sm:text-[11px] font-black">Offline</span>
              <WifiOff className="w-3 h-3 hidden sm:inline" />
            </div>
          )}

          {/* Party Mode Toggle: Visible on tablet & desktop (on mobile already accessible in the main menu card) */}
          <button
            onClick={togglePartyDrinkPenalty}
            className={`hidden md:flex px-2.5 py-1 rounded-xl text-xs font-bold border transition-all items-center space-x-1.5 cursor-pointer shrink-0 ${
              partyDrinkPenaltyEnabled
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-white/10 text-slate-400'
            }`}
            title="Toggle Efek Animasi Penalti Minum"
          >
            <Beer className="w-3.5 h-3.5" />
            <span>Party Mode:</span>
            <span className="text-[11px] font-black">{partyDrinkPenaltyEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </header>

      {/* Offline Alert Banner (Hanya muncul jika sudah dipastikan offline dan tidak sedang memeriksa) */}
      {!isOnline && !isCheckingConnection && (
        <div className="w-full max-w-7xl mx-auto mt-2 px-3 py-1.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Mode Offline: Internet tidak aktif. Kamu tetap bisa bermain <strong>Single Player (vs Bot AI)</strong>.</span>
          </div>
          <button
            onClick={handleRetryConnection}
            className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold flex items-center space-x-1 cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Cek Ulang</span>
          </button>
        </div>
      )}

      {/* Main Grid: Left (Brand & Profile) vs Right (Single & Multiplayer Modes) */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 my-auto items-center py-2 md:py-3 z-10">
        {/* =========================================================================
            LEFT COLUMN (lg:col-span-5): Game Visual Showcase & Profile Setup
            ========================================================================= */}
        <div className={`lg:col-span-5 flex flex-col justify-center space-y-4 ${showMobileModes ? 'hidden lg:flex' : 'flex'}`}>
          {/* Hero Branding */}
          <div className="space-y-1.5 text-center lg:text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/20 to-sky-500/20 border border-white/10 text-xs font-black text-amber-300 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>ALTERNATIVE TO UNO • REALTIME MULTIPLAYER</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              COLOR<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">RUSH</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
              Pertarungan kartu arcade berkecepatan tinggi! Kuasai kartu aksi, taklukkan duel quick-time <strong>RUSH!</strong>, dan kalahkan lawanmu.
            </p>
          </div>

          {/* Animated 4-Color Card Suit Preview Fan */}
          <div className="relative h-28 md:h-32 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-950/40 border border-white/5 p-2">
            {[
              { color: 'from-rose-500 to-red-600', label: 'CRIMSON', val: 'INFERNO +4', rot: -15, x: -60 },
              { color: 'from-sky-500 to-blue-600', label: 'OCEAN', val: 'REWIND', rot: -5, x: -20 },
              { color: 'from-emerald-500 to-green-600', label: 'TOXIC', val: 'HALT', rot: 5, x: 20 },
              { color: 'from-amber-400 to-yellow-500', label: 'SOLAR', val: 'BURST +2', rot: 15, x: 60 },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1, rotate: c.rot, x: c.x }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.1, zIndex: 10 }}
                className={`absolute w-16 h-24 md:w-20 md:h-28 rounded-xl bg-gradient-to-br ${c.color} p-1.5 shadow-2xl border border-white/30 text-white flex flex-col justify-between cursor-pointer select-none`}
              >
                <div className="text-[10px] font-black">{c.val.charAt(0)}</div>
                <div className="text-center font-black text-[9px] uppercase tracking-tighter leading-tight">{c.val}</div>
                <div className="text-right text-[10px] font-black">{c.val.charAt(0)}</div>
              </motion.div>
            ))}
          </div>

          {/* Player Identity Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center">
                <Crown className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Identitas Pemain Kamu
              </span>
              {!authUser && (
                <button
                  onClick={handleRandomizeName}
                  className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                  title="Acak Nama & Avatar"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Acak Profil</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <PlayerAvatar
                avatarId={playerAvatar}
                size="lg"
                borderId={authUser?.activeProfileBorder || 'default'}
              />

              <div className="flex-1">
                <input
                  type="text"
                  value={playerName}
                  maxLength={15}
                  onChange={(e) => setPlayerProfile(e.target.value, playerAvatar)}
                  placeholder="Masukkan nama panggilanmu"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-black tracking-wide focus:outline-none focus:border-sky-500 shadow-inner"
                />
              </div>
            </div>

            {/* Avatar Selectors */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1 overscroll-x-contain touch-pan-x">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPlayerProfile(playerName, opt.id)}
                  className={`p-1 rounded-2xl transition-all flex flex-col items-center shrink-0 ${
                    playerAvatar === opt.id ? 'scale-110 ring-2 ring-sky-400' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={opt.label}
                >
                  <PlayerAvatar avatarId={opt.id} size="sm" />
                </button>
              ))}
            </div>

            {/* Account Status / Profile Quick Banner */}
            {authUser ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/25 gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <span className="text-base select-none shrink-0">{authUser.tier?.badge || '⭐'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-white flex items-center space-x-1.5 truncate">
                      <UsernamePlate
                        username={authUser.username}
                        plateId={authUser.activeUsernameBorder || 'default'}
                        size="sm"
                        className="truncate max-w-[80px] sm:max-w-[120px]"
                      />
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold shrink-0">
                        {authUser.totalPoints} Pts
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {authUser.tier?.name} • {authUser.wins} Menang ({authUser.winRate}%)
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
                  <button
                    onClick={() => {
                      soundFx.playCardDraw();
                      openLeaderboardModal();
                    }}
                    className="px-1.5 sm:px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-750 text-amber-300 border border-amber-400/30 text-[10px] sm:text-[11px] font-bold transition-all flex items-center space-x-1 cursor-pointer shrink-0"
                    title="Buka Papan Peringkat"
                  >
                    <Trophy className="w-3 h-3 text-amber-400" />
                    <span className="hidden sm:inline">Peringkat</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playCardDraw();
                      openShopModal();
                    }}
                    className="px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-black text-[10px] sm:text-[11px] shadow transition-transform active:scale-95 flex items-center space-x-1 cursor-pointer shrink-0"
                    title="Buka Toko Kosmetik"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Toko</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playCardDraw();
                      openProfileModal();
                    }}
                    className="px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] sm:text-[11px] font-bold transition-colors cursor-pointer shrink-0"
                  >
                    Profil
                  </button>
                </div>
              </div>
            ) : isOnline ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-sky-500/10 border border-white/10">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simpan Poin & Riwayat</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Masuk untuk simpan riwayat & beli kosmetik!</p>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => {
                      soundFx.playCardDraw();
                      openShopModal();
                    }}
                    className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-[11px] border border-amber-400/30 flex items-center space-x-1 transition-transform active:scale-95 cursor-pointer"
                    title="Lihat Katalog Toko"
                  >
                    <ShoppingBag className="w-3 h-3 text-amber-400" />
                    <span>Toko</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playCardDraw();
                      openAuthModal('login');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
                  >
                    Masuk
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Mobile Only: 1 Primary "MAIN SEKARANG" Button initially */}
          <div className="lg:hidden pt-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                soundFx.playCardDraw();
                setShowMobileModes(true);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-sky-500 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_25px_rgba(244,63,94,0.4)] flex items-center justify-center space-x-2 active:scale-95"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>MAIN SEKARANG (PLAY)</span>
            </motion.button>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (lg:col-span-7): Action Cards: Single Player & Multiplayer Hub
            ========================================================================= */}
        <div className={`lg:col-span-7 flex flex-col space-y-3 sm:space-y-4 ${showMobileModes ? 'flex' : 'hidden lg:flex'}`}>
          {/* Mobile Navigation Header: Back to Initial Menu */}
          <div className="lg:hidden flex items-center justify-between py-1 px-0.5 border-b border-white/10 mb-1">
            <button
              onClick={() => {
                soundFx.playCardDraw();
                setShowMobileModes(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md border border-white/10 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Kembali</span>
            </button>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-wider">
                Pilih Mode Bermain
              </span>
            </div>
          </div>

          {/* Card 1: Play Single Player (vs AI Bot) */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-3.5 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 shadow-2xl relative overflow-hidden group cursor-pointer"
            onClick={handleStartSolo}
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black shrink-0">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wider">
                      Main Single Player
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30 flex items-center space-x-1">
                      <span>VS BOT</span>
                      <span>•</span>
                      <span>100% OFFLINE</span>
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    Langsung bermain offline melawan 3 AI Bot cerdas (Blaze Bot, Cyber Surge, Neon Bloom).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartSolo();
                }}
                className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg group-hover:shadow-emerald-500/50 transition-all shrink-0 active:scale-95 cursor-pointer"
              >
                <span>Mulai Solo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Card 2: Multiplayer Arena Hub */}
          <div className="p-3.5 sm:p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-md space-y-3.5 sm:space-y-4">
            {/* Multiplayer Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                    Multiplayer Online Hub
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bermain real-time bersama teman atau pemain lain di internet
                  </p>
                </div>
              </div>

              {isCheckingConnection ? (
                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-white/10 flex items-center space-x-1 shrink-0">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>MEMERIKSA...</span>
                </span>
              ) : isOnline ? (
                <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black border border-sky-400/20 flex items-center space-x-1 shrink-0">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>ONLINE</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-black border border-amber-400/30 flex items-center space-x-1 shrink-0">
                  <WifiOff className="w-3 h-3" />
                  <span>OFFLINE</span>
                </span>
              )}
            </div>

            {/* If offline, show elegant info card instead of broken multiplayer tabs */}
            {!isOnline && !isCheckingConnection ? (
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <WifiOff className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white">Mode Multiplayer Memerlukan Internet</h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Koneksi internet tidak terdeteksi di perangkat Anda. Aktifkan Wi-Fi atau data seluler di HP Anda untuk bermain bersama pemain lain secara online.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 w-full sm:w-auto">
                  <button
                    onClick={handleRetryConnection}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Hubungkan Ulang</span>
                  </button>
                  <button
                    onClick={handleStartSolo}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase flex items-center justify-center space-x-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Main Solo (Offline)</span>
                  </button>
                </div>
              </div>
            ) : isCheckingConnection ? (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col items-center text-center space-y-2 py-10">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                <p className="text-xs text-slate-400">Memeriksa status koneksi internet...</p>
              </div>
            ) : (
              <>
            {/* Multiplayer Sub-Tabs: 2x2 grid on mobile for optimal tap targets & clean non-wrapping labels, 4 cols on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold">
              <button
                onClick={() => setMultiplayerTab('quick')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  multiplayerTab === 'quick'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Quick Match</span>
              </button>
              <button
                onClick={() => setMultiplayerTab('create')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  multiplayerTab === 'create'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-300" />
                <span>Buat Room</span>
              </button>
              <button
                onClick={() => setMultiplayerTab('join')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                  multiplayerTab === 'join'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-300" />
                <span>Gabung Kode</span>
              </button>
              <button
                onClick={() => setMultiplayerTab('public')}
                className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 relative ${
                  multiplayerTab === 'public'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-rose-300" />
                <span>Publik ({publicRooms.length})</span>
              </button>
            </div>

            {/* Tab 1: Matching Random Room */}
            {multiplayerTab === 'quick' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center">
                    <Zap className="w-4 h-4 mr-1.5 text-amber-400" />
                    Matching Room Acak (Quick Match)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                    Sistem akan mencarikan room publik aktif secara otomatis. Jika belum ada yang buka, room publik baru akan dibuatkan untukmu!
                  </p>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSearchingMatch}
                  onClick={handleRandomMatch}
                  className="w-full py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(2,132,199,0.4)] flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  <Radio className={`w-4 h-4 ${isSearchingMatch ? 'animate-spin' : 'animate-pulse'}`} />
                  <span>{isSearchingMatch ? 'Sedang Mencari Room...' : 'Cari Match Sekarang'}</span>
                </motion.button>
              </div>
            )}

            {/* Tab 2: Buat Room (Settings: Public/Private & 2, 3, 4 Slots) */}
            {multiplayerTab === 'create' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center">
                    <PlusCircle className="w-4 h-4 mr-1.5 text-purple-400" />
                    Pengaturan Room Baru
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Atur visibilitas room dan jumlah kapasitas slot pemain
                  </p>
                </div>

                {/* Option 1: Room Type (Public vs Private) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                    Visibilitas Room
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRoomIsPublic(true)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                        roomIsPublic
                          ? 'bg-purple-600/30 border-purple-400 text-white shadow'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-purple-300 shrink-0" />
                      <div className="text-left">
                        <div className="font-bold text-xs text-white">Publik</div>
                        <div className="text-[10px] text-slate-400">Muncul di List</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setRoomIsPublic(false)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                        !roomIsPublic
                          ? 'bg-purple-600/30 border-purple-400 text-white shadow'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                      <div className="text-left">
                        <div className="font-bold text-xs text-white">Private</div>
                        <div className="text-[10px] text-slate-400">Hanya via Kode</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Option 2: Max Player Slots (2, 3, 4) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      Kapasitas Slot Pemain
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Slot kosong otomatis diisi Bot AI
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setRoomMaxSlots(slot as 2 | 3 | 4)}
                        className={`py-2 rounded-xl border text-xs font-black transition-all ${
                          roomMaxSlots === slot
                            ? 'bg-purple-600 text-white border-purple-300 shadow'
                            : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {slot} Pemain
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateRoom}
                  className="w-full py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Room ({roomIsPublic ? 'Publik' : 'Private'} • {roomMaxSlots} Slot)</span>
                </motion.button>
              </div>
            )}

            {/* Tab 3: Gabung Room (Kode) */}
            {multiplayerTab === 'join' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center">
                    <LogIn className="w-4 h-4 mr-1.5 text-indigo-400" />
                    Gabung dengan Kode Room
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400">
                    Masukkan kode 4-karakter yang dibagikan oleh temanmu
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={joinInput}
                    maxLength={6}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    placeholder="KODE ROOM"
                    className="w-full sm:w-44 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-center font-black text-sm text-white uppercase tracking-widest focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                  <button
                    onClick={handleJoinByCode}
                    disabled={!joinInput.trim()}
                    className="w-full sm:flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow transition-all flex items-center justify-center space-x-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Gabung Room</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 4: Public Rooms List */}
            {multiplayerTab === 'public' && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    Daftar Room Publik Aktif ({publicRooms.length})
                  </span>
                  <button
                    onClick={fetchPublicRooms}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {publicRooms.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-slate-500">
                      Belum ada room publik aktif yang sedang menunggu pemain.
                    </p>
                    <button
                      onClick={() => setMultiplayerTab('create')}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-300 text-xs font-bold"
                    >
                      Buat Room Publik Pertama!
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {publicRooms.map((r) => (
                      <div
                        key={r.roomId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-rose-400/40 transition-all"
                      >
                        <div className="flex items-center space-x-2.5">
                          <PlayerAvatar avatarId={r.hostAvatar} size="sm" />
                          <div>
                            <span className="font-bold text-xs text-white block leading-tight">{r.hostName}</span>
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
                              KODE: {r.roomId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-white/5">
                            {r.playerCount}/{r.maxPlayers} Pemain
                          </span>
                          <button
                            onClick={() => joinCustomRoom(r.roomId)}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all"
                          >
                            Gabung
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
        </div>
      </main>

      {/* Footer Status Bar (Tentang Aplikasi hanya muncul di aplikasi native, disembunyikan di website) */}
      <footer className="w-full max-w-7xl mx-auto py-1.5 px-3 text-center text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        {Capacitor.isNativePlatform() ? (
          <button
            onClick={() => {
              soundFx.playCardDraw();
              openAboutModal();
            }}
            className="px-2.5 py-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-white/10 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Lihat Tentang Aplikasi & Versi Terpasang"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Tentang Aplikasi • v1.1.0</span>
          </button>
        ) : (
          <div />
        )}
        <span className="text-[10px] text-slate-500 hidden sm:inline">ColorRush • Arcade Card Battle</span>
      </footer>
    </div>
  );
};

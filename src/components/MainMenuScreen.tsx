import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import { PlayerAvatar, AVATAR_OPTIONS } from './PlayerAvatar';
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

  return (
    <div className="w-full h-dvh md:h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between select-none overflow-y-auto md:overflow-hidden relative p-3 md:p-6">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Pill Header */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between py-1.5 px-3 md:px-5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-sky-500 flex items-center justify-center shadow-lg font-black text-white text-sm">
            CR
          </div>
          <div>
            <h1 className="text-sm md:text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-sky-400 uppercase">
              ColorRush
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider hidden sm:block">
              High Energy Arcade Card Battle
            </p>
          </div>
        </div>

        {/* Quick Settings: Online Count + Party Drink Mode */}
        <div className="flex items-center space-x-2">
          {/* Live Online Users Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span className="text-[11px] font-black">{onlineCount}</span>
            <Users className="w-3 h-3" />
          </div>

          <button
            onClick={togglePartyDrinkPenalty}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center space-x-1.5 ${
              partyDrinkPenaltyEnabled
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-white/10 text-slate-400'
            }`}
            title="Toggle Efek Animasi Penalti Minum"
          >
            <Beer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Party Drink Mode:</span>
            <span className="text-[11px] font-black">{partyDrinkPenaltyEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Left (Brand & Profile) vs Right (Single & Multiplayer Modes) */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 my-auto items-center py-3 z-10">
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
              <button
                onClick={handleRandomizeName}
                className="text-[10px] font-bold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
                title="Acak Nama & Avatar"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Acak Profil</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <PlayerAvatar avatarId={playerAvatar} size="lg" />

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
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
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
        <div className={`lg:col-span-7 flex flex-col space-y-4 ${showMobileModes ? 'flex' : 'hidden lg:flex'}`}>
          {/* Mobile Navigation Header: Back to Initial Menu */}
          <div className="lg:hidden flex items-center justify-between pb-1 border-b border-white/10">
            <button
              onClick={() => {
                soundFx.playCardDraw();
                setShowMobileModes(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-all shadow border border-white/10 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
              Pilih Mode Bermain
            </span>
          </div>
          {/* Card 1: Play Single Player (vs AI Bot) */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 shadow-2xl relative overflow-hidden group cursor-pointer"
            onClick={handleStartSolo}
          >
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base md:text-lg font-black text-white uppercase tracking-wider">
                      Main Single Player
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-400/30">
                      VS BOT
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Langsung bermain offline melawan 3 AI Bot cerdas (Blaze Bot, Cyber Surge, Neon Bloom).
                  </p>
                </div>
              </div>

              <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg group-hover:shadow-emerald-500/50 transition-all shrink-0">
                <span>Mulai Solo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Card 2: Multiplayer Arena Hub */}
          <div className="p-4 md:p-5 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl backdrop-blur-md space-y-4">
            {/* Multiplayer Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wide">
                    Multiplayer Online Hub
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Bermain real-time bersama teman atau pemain lain di internet
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-black border border-sky-400/20 flex items-center space-x-1">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Multiplayer Sub-Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-950 border border-white/5 text-[11px] font-bold">
              <button
                onClick={() => setMultiplayerTab('quick')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                  multiplayerTab === 'quick'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Matching</span>
              </button>
              <button
                onClick={() => setMultiplayerTab('create')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                  multiplayerTab === 'create'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Buat Room</span>
              </button>
              <button
                onClick={() => setMultiplayerTab('join')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center space-x-1 ${
                  multiplayerTab === 'join'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Gabung</span>
              </button>
              <button
                onClick={() => setMultiplayerTab('public')}
                className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center space-x-1 relative ${
                  multiplayerTab === 'public'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Publik ({publicRooms.length})</span>
              </button>
            </div>

            {/* Tab 1: Matching Random Room */}
            {multiplayerTab === 'quick' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Zap className="w-4 h-4 mr-1.5 text-amber-400" />
                    Matching Room Acak (Quick Match)
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sistem akan mencarikan room publik aktif secara otomatis. Jika belum ada yang buka, room publik baru akan dibuatkan untukmu!
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRandomMatch}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-black text-xs md:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(2,132,199,0.4)] flex items-center justify-center space-x-2"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Cari Match Sekarang</span>
                </motion.button>
              </div>
            )}

            {/* Tab 2: Buat Room (Settings: Public/Private & 2, 3, 4 Slots) */}
            {multiplayerTab === 'create' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3.5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <PlusCircle className="w-4 h-4 mr-1.5 text-purple-400" />
                    Pengaturan Room Baru
                  </h4>
                  <p className="text-xs text-slate-400">
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
                      <Globe className="w-3.5 h-3.5 text-purple-300" />
                      <span>Publik (Muncul di List)</span>
                    </button>

                    <button
                      onClick={() => setRoomIsPublic(false)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                        !roomIsPublic
                          ? 'bg-purple-600/30 border-purple-400 text-white shadow'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Private (Hanya Kode)</span>
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
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Room ({roomIsPublic ? 'Publik' : 'Private'} • {roomMaxSlots} Slot)</span>
                </motion.button>
              </div>
            )}

            {/* Tab 3: Gabung Room (Kode) */}
            {multiplayerTab === 'join' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <LogIn className="w-4 h-4 mr-1.5 text-indigo-400" />
                    Gabung dengan Kode Room
                  </h4>
                  <p className="text-xs text-slate-400">
                    Masukkan kode 4-karakter yang dibagikan oleh temanmu
                  </p>
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={joinInput}
                    maxLength={6}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    placeholder="KODE ROOM"
                    className="w-36 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-center font-black text-sm text-white uppercase tracking-widest focus:outline-none focus:border-indigo-500 shadow-inner"
                  />
                  <button
                    onClick={handleJoinByCode}
                    disabled={!joinInput.trim()}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider shadow transition-all"
                  >
                    Gabung Room
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
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="w-full max-w-7xl mx-auto py-1 px-3 text-center text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span>ColorRush v2.1 • Arcade Uno Alternative</span>
      </footer>
    </div>
  );
};

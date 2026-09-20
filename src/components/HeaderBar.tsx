import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { PlayerAvatar } from './PlayerAvatar';
import { UsernamePlate } from './UsernamePlate';
import {
  Volume2,
  VolumeX,
  Beer,
  RotateCcw,
  Settings,
  HelpCircle,
  ScrollText,
  Users,
  Home,
  LogIn,
  ShoppingBag,
  Trophy,
  WifiOff,
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { RulesModal } from './RulesModal';
import { LogDrawer } from './LogDrawer';
import { MultiplayerModal } from './MultiplayerModal';

export const HeaderBar: React.FC = () => {
  const {
    soundMuted,
    toggleSound,
    partyDrinkPenaltyEnabled,
    togglePartyDrinkPenalty,
    initGame,
    returnToMainMenu,
    gameMode,
    roomId,
    authUser,
    openAuthModal,
    openProfileModal,
    openShopModal,
    openLeaderboardModal,
    isOnline,
  } = useGameStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);

  const isInRoom = gameMode === 'multiplayer' || Boolean(roomId);

  return (
    <>
      <header className="w-full flex items-center justify-between px-2 sm:px-4 pt-safe pb-1.5 sm:pb-2 pl-safe pr-safe z-30 bg-slate-950/40 backdrop-blur-md border-b border-white/5">
        {/* Game Logo & Brand */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={() => {
              if (window.confirm('Kembali ke Menu Utama?')) {
                returnToMainMenu();
              }
            }}
            className="flex items-center space-x-1.5 sm:space-x-2 text-left group cursor-pointer shrink-0"
            title="Klik untuk ke Menu Utama"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-sky-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.5)] p-0.5 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-xs text-white">
                CR
              </div>
            </div>
            <div>
              <h1 className="font-black text-xs sm:text-base tracking-wider bg-gradient-to-r from-rose-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                COLORRUSH
              </h1>
            </div>
          </button>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Desktop Only: Home / Menu Utama Button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Kembali ke Menu Utama? Permainan saat ini akan diakhiri.'
                )
              ) {
                returnToMainMenu();
              }
            }}
            title="Kembali ke Menu Utama"
            className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/30 transition-all items-center space-x-1.5 text-xs font-bold shadow cursor-pointer shrink-0"
          >
            <Home className="w-4 h-4" />
            <span>Menu</span>
          </button>

          {/* Papan Peringkat (Leaderboard) Button: Tablet/Desktop only during matches */}
          <button
            onClick={openLeaderboardModal}
            title="Buka Papan Peringkat (Leaderboard Juara #1-3)"
            className="hidden sm:flex px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all items-center space-x-1 text-xs font-black cursor-pointer shrink-0"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Peringkat</span>
          </button>

          {/* Toko Poin (Store) Button: Tablet/Desktop only during matches */}
          <button
            onClick={openShopModal}
            title="Buka Toko Poin (Beli Border Profile & Username)"
            className="hidden sm:flex px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all items-center space-x-1 text-xs font-black cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Toko</span>
          </button>

          {/* Account Profile / Login Button (Visible on Mobile & Desktop) */}
          {authUser ? (
            <button
              onClick={openProfileModal}
              title="Lihat Profil, Statistik & Riwayat Poin"
              className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] transition-all flex items-center space-x-1 text-xs font-black cursor-pointer shrink-0 max-w-[120px] sm:max-w-none"
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
              <span className="px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                {authUser.totalPoints} Pts
              </span>
            </button>
          ) : isOnline ? (
            <button
              onClick={() => openAuthModal('login')}
              title="Masuk / Daftar Akun untuk Menyimpan Poin & Riwayat"
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white transition-all flex items-center space-x-1 text-xs font-black shadow-md cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
          ) : null}

          {/* ESSENTIAL: Info Room / Multiplayer Button (Visible on Mobile & Desktop) */}
          <button
            onClick={() => setIsMultiplayerOpen(true)}
            title="Informasi Room & Pemain"
            className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center space-x-1 text-xs font-black shadow-md cursor-pointer shrink-0 ${
              isInRoom
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border border-sky-400/50 shadow-[0_0_15px_rgba(2,132,199,0.5)]'
                : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isInRoom ? `Room ${roomId || '...'}` : 'Info Room'}
            </span>
            {isInRoom && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            )}
          </button>

          {/* Desktop Only: Party Drink Mode Toggle */}
          <button
            onClick={togglePartyDrinkPenalty}
            title={
              partyDrinkPenaltyEnabled
                ? 'Party Drink Penalty: ON'
                : 'Party Drink Penalty: OFF'
            }
            className={`hidden md:flex p-2 rounded-xl transition-all items-center space-x-1.5 text-xs font-bold cursor-pointer shrink-0 ${
              partyDrinkPenaltyEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <Beer className="w-4 h-4" />
            <span>Party Mode</span>
          </button>

          {/* Desktop Only: Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer shrink-0"
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Desktop Only: Game Logs Button */}
          <button
            onClick={() => setIsLogsOpen(true)}
            title="Riwayat Log Permainan"
            className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer shrink-0"
          >
            <ScrollText className="w-4 h-4" />
          </button>

          {/* Desktop Only: How to Play Rules */}
          <button
            onClick={() => setIsRulesOpen(true)}
            title="Aturan Main & Panduan"
            className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer shrink-0"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Desktop Only: Restart Match */}
          {!isInRoom && (
            <button
              onClick={initGame}
              title="Restart Match"
              className="hidden md:flex p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold transition-all shadow-md cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* ESSENTIAL: Pengaturan / Settings Button (Visible on Mobile & Desktop) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Pengaturan Game (Audio, Party Mode, AI Speed, Keluar Room)"
            className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 hover:border-white/25 transition-all flex items-center space-x-1 text-xs font-bold shadow cursor-pointer shrink-0"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>
      </header>

      {/* In-Game Offline Warning for Multiplayer */}
      {isInRoom && !isOnline && (
        <div className="w-full bg-rose-600/90 text-white text-xs font-bold py-1.5 px-3 text-center flex items-center justify-center space-x-2 z-30 shadow">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Koneksi internet terputus! Sedang mencoba menghubungkan kembali...</span>
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenLogs={() => setIsLogsOpen(true)}
      />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <LogDrawer isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
      <MultiplayerModal
        isOpen={isMultiplayerOpen}
        onClose={() => setIsMultiplayerOpen(false)}
      />
    </>
  );
};

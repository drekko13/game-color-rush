import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
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
  } = useGameStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isMultiplayerOpen, setIsMultiplayerOpen] = useState(false);

  const isInRoom = gameMode === 'multiplayer' || Boolean(roomId);

  return (
    <>
      <header className="w-full flex items-center justify-between px-3 md:px-4 py-2 z-30 bg-slate-950/40 backdrop-blur-md border-b border-white/5">
        {/* Game Logo & Brand */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              if (window.confirm('Kembali ke Menu Utama?')) {
                returnToMainMenu();
              }
            }}
            className="flex items-center space-x-2 text-left group cursor-pointer"
            title="Klik untuk ke Menu Utama"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-sky-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.5)] p-0.5 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-xs text-white">
                CR
              </div>
            </div>
            <div>
              <h1 className="font-black text-sm md:text-base tracking-wider bg-gradient-to-r from-rose-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                COLORRUSH
              </h1>
            </div>
          </button>
        </div>

        {/* Toolbar Buttons: On mobile, ONLY Info Room & Pengaturan are visible. Other secondary buttons are shown on desktop */}
        <div className="flex items-center space-x-2">
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
            className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/30 transition-all items-center space-x-1.5 text-xs font-bold shadow cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Menu</span>
          </button>

          {/* ESSENTIAL: Info Room / Multiplayer Button (Visible on Mobile & Desktop) */}
          <button
            onClick={() => setIsMultiplayerOpen(true)}
            title="Informasi Room & Pemain"
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-black shadow-md cursor-pointer ${
              isInRoom
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border border-sky-400/50 shadow-[0_0_15px_rgba(2,132,199,0.5)]'
                : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {isInRoom ? `Room ${roomId || '...'}` : 'Info Room'}
            </span>
            {isInRoom && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
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
            className={`hidden md:flex p-2 rounded-xl transition-all items-center space-x-1.5 text-xs font-bold cursor-pointer ${
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
            className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
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
            className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <ScrollText className="w-4 h-4" />
          </button>

          {/* Desktop Only: How to Play Rules */}
          <button
            onClick={() => setIsRulesOpen(true)}
            title="Aturan Main & Panduan"
            className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Desktop Only: Restart Match */}
          {!isInRoom && (
            <button
              onClick={initGame}
              title="Restart Match"
              className="hidden md:flex p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold transition-all shadow-md cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* ESSENTIAL: Pengaturan / Settings Button (Visible on Mobile & Desktop) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Pengaturan Game (Audio, Party Mode, AI Speed, Keluar Room)"
            className="px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 hover:border-white/25 transition-all flex items-center space-x-1.5 text-xs font-bold shadow cursor-pointer"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>
        </div>
      </header>

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

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

  return (
    <>
      <header className="w-full flex items-center justify-between px-2 md:px-4 py-2 z-30 bg-slate-950/40 backdrop-blur-md border-b border-white/5">
        {/* Game Logo & Brand */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (window.confirm('Kembali ke Menu Utama?')) {
                returnToMainMenu();
              }
            }}
            className="flex items-center space-x-2 text-left group"
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

        {/* Quick Toolbar Buttons */}
        <div className="flex items-center space-x-1.5 md:space-x-2">
          {/* Home / Menu Utama Button */}
          <button
            onClick={() => {
              if (window.confirm('Kembali ke Menu Utama? Permainan saat ini akan diakhiri.')) {
                returnToMainMenu();
              }
            }}
            title="Kembali ke Menu Utama"
            className="px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/30 transition-all flex items-center space-x-1 text-xs font-bold shadow"
          >
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">Menu</span>
          </button>
          {/* Multiplayer Lobby Button */}
          <button
            onClick={() => setIsMultiplayerOpen(true)}
            title="Multiplayer Online Lobby"
            className={`p-1.5 md:px-3 md:py-1.5 rounded-xl transition-all flex items-center space-x-1.5 text-xs font-black shadow-md ${
              gameMode === 'multiplayer'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border border-sky-400/50 shadow-[0_0_15px_rgba(2,132,199,0.5)]'
                : 'bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">
              {gameMode === 'multiplayer' ? `Room ${roomId || '...'}` : 'Multiplayer'}
            </span>
            {gameMode === 'multiplayer' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          {/* Party Drink Mode Toggle */}
          <button
            onClick={togglePartyDrinkPenalty}
            title={partyDrinkPenaltyEnabled ? 'Party Drink Penalty: ON' : 'Party Drink Penalty: OFF'}
            className={`p-1.5 md:p-2 rounded-xl transition-all flex items-center space-x-1 text-xs font-bold ${
              partyDrinkPenaltyEnabled
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900 text-slate-500 border border-slate-800'
            }`}
          >
            <Beer className="w-4 h-4" />
            <span className="hidden sm:inline">Party Mode</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 md:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors"
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Game Logs Button */}
          <button
            onClick={() => setIsLogsOpen(true)}
            title="Action Log"
            className="p-1.5 md:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors"
          >
            <ScrollText className="w-4 h-4" />
          </button>

          {/* How to Play Rules */}
          <button
            onClick={() => setIsRulesOpen(true)}
            title="Rules & Suits"
            className="p-1.5 md:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            className="p-1.5 md:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Restart Match */}
          <button
            onClick={initGame}
            title="Restart Match"
            className="p-1.5 md:p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <LogDrawer isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />
      <MultiplayerModal isOpen={isMultiplayerOpen} onClose={() => setIsMultiplayerOpen(false)} />
    </>
  );
};

import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useIsMobile } from './hooks/useIsMobile';
import { MainMenuScreen } from './components/MainMenuScreen';
import { MultiplayerModal } from './components/MultiplayerModal';
import { HeaderBar } from './components/HeaderBar';
import { OpponentSlot } from './components/OpponentSlot';
import { TableCenter } from './components/TableCenter';
import { PlayerHand } from './components/PlayerHand';
import { ColorWheelModal } from './components/ColorWheelModal';
import { DrinkPenaltyOverlay } from './components/DrinkPenaltyOverlay';
import { MissileCards } from './components/MissileCards';
import { VictoryModal } from './components/VictoryModal';
import { RushQuickTimePrompt } from './components/RushQuickTimePrompt';

export const App: React.FC = () => {
  const { currentScreen, players, screenShake, initMultiplayerSocket } = useGameStore();
  const isMobile = useIsMobile(768);

  useEffect(() => {
    initMultiplayerSocket();
  }, [initMultiplayerSocket]);

  // If on Main Menu or in Room Lobby, render MainMenuScreen (with MultiplayerModal overlay if in lobby)
  if (currentScreen === 'menu' || currentScreen === 'lobby') {
    return (
      <>
        <MainMenuScreen />
        {currentScreen === 'lobby' && (
          <MultiplayerModal isOpen={true} onClose={() => {}} />
        )}
      </>
    );
  }

  const leftPlayer = players.find((p) => p.position === 'left');
  const topPlayer = players.find((p) => p.position === 'top');
  const rightPlayer = players.find((p) => p.position === 'right');

  // Screen shake classes
  const shakeClass =
    screenShake === 'lg'
      ? 'screen-shake-lg'
      : screenShake === 'sm'
      ? 'screen-shake-sm'
      : '';

  return (
    <div
      className="w-full h-dvh md:h-screen bg-table-dark bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-table-dark to-black text-slate-100 flex flex-col justify-between select-none overflow-hidden relative"
    >
      {/* Ambient background felt radial lights (Desktop only for max mobile fill-rate performance) */}
      {!isMobile && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-sky-900/15 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top Header & Settings Toolbar */}
      <HeaderBar />

      {/* Main Game Arena Container */}
      <main className={`w-full max-w-7xl mx-auto flex-1 flex flex-col justify-between px-2 md:px-6 py-1 md:py-3 relative z-10 overflow-hidden ${shakeClass}`}>

        {/* =========================================================================
            TOP OPPONENT ROW: Mobile 3-Opponent Header Strip VS Desktop Top Opponent
            (Conditionally unmounted to cut mobile DOM and layout calculation by >50%)
            ========================================================================= */}
        {isMobile ? (
          <div className="flex flex-col w-full">
            <div className="grid grid-cols-3 gap-1.5 w-full max-w-md mx-auto px-1 py-1.5 bg-slate-950/85 rounded-2xl border border-white/10 shadow-inner">
              {leftPlayer && <OpponentSlot player={leftPlayer} position="left" isMobileTopRow />}
              {topPlayer && <OpponentSlot player={topPlayer} position="top" isMobileTopRow />}
              {rightPlayer && <OpponentSlot player={rightPlayer} position="right" isMobileTopRow />}
            </div>
          </div>
        ) : (
          <div className="flex w-full justify-center pt-1">
            {topPlayer && <OpponentSlot player={topPlayer} position="top" />}
          </div>
        )}

        {/* Center Arena */}
        <div className="w-full flex items-center justify-between my-auto relative">
          {/* Desktop Left Opponent (Only mounted on desktop) */}
          {!isMobile && (
            <div className="flex w-28 lg:w-36 justify-start">
              {leftPlayer && <OpponentSlot player={leftPlayer} position="left" />}
            </div>
          )}

          {/* Center Table (Deck, Discard, Direction Orbit, Active Color) */}
          <div className="flex-1 flex justify-center items-center px-1 w-full">
            <TableCenter />
          </div>

          {/* Desktop Right Opponent (Only mounted on desktop) */}
          {!isMobile && (
            <div className="flex w-28 lg:w-36 justify-end">
              {rightPlayer && <OpponentSlot player={rightPlayer} position="right" />}
            </div>
          )}
        </div>

        {/* Bottom Arena: Human Player Hand */}
        <PlayerHand />
      </main>

      {/* Animated Modal & Penalty Overlays */}
      <ColorWheelModal />
      <DrinkPenaltyOverlay />
      <MissileCards />
      <RushQuickTimePrompt />
      <VictoryModal />
    </div>
  );
};

export default App;

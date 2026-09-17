import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player, PlayerPosition } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import { CardComponent } from './Card';
import { PlayerAvatar } from './PlayerAvatar';
import { Beer, AlertTriangle, Layers, Zap, Ban } from 'lucide-react';

interface OpponentSlotProps {
  player: Player;
  position: PlayerPosition;
  isMobileTopRow?: boolean;
}

export const OpponentSlot: React.FC<OpponentSlotProps> = ({
  player,
  position,
  isMobileTopRow = false,
}) => {
  const { currentTurnIndex, players, catchUncalledRush, rushCallGracePlayerId } =
    useGameStore();
  const isTurn = players[currentTurnIndex]?.id === player.id;
  const canCatch =
    rushCallGracePlayerId === player.id &&
    player.hand.length === 1 &&
    !player.hasCalledRush;

  const visibleCardsCount = Math.min(player.hand.length, 5);

  return (
    <div
      className={`flex flex-col items-center relative z-10 transition-all ${
        isMobileTopRow
          ? 'items-center px-1'
          : position === 'left'
          ? 'items-start md:items-center'
          : position === 'right'
          ? 'items-end md:items-center'
          : 'items-center'
      }`}
    >
      {/* Reaction / Status Bubble */}
      <AnimatePresence>
        {player.statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute -top-7 px-2.5 py-0.5 rounded-full text-[10px] md:text-[11px] font-black tracking-wider uppercase shadow-xl z-30 whitespace-nowrap flex items-center space-x-1 ${
              player.statusMessage.includes('HALTED')
                ? 'bg-rose-600 text-white animate-bounce'
                : player.statusMessage.includes('RUSH')
                ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-yellow-300'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {player.statusMessage.includes('RUSH') && (
              <Zap className="w-3 h-3 fill-current" />
            )}
            {player.statusMessage.includes('HALTED') && (
              <Ban className="w-3 h-3" />
            )}
            <span>{player.statusMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Avatar Station */}
      <div
        className={`relative flex items-center ${
          isMobileTopRow ? 'flex-col' : 'flex-row'
        }`}
      >
        {/* Animated Active Turn Aura */}
        {isTurn && (
          <motion.div
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
            className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-indigo-500 blur-sm pointer-events-none"
          />
        )}

        {/* Circular Avatar */}
        <div
          className={`relative w-10 h-10 md:w-14 md:h-14 rounded-full bg-slate-900 border-2 flex items-center justify-center shadow-xl transition-all overflow-hidden ${
            isTurn
              ? 'border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'border-slate-700'
          }`}
        >
          <PlayerAvatar avatarId={player.avatar} size="md" border={false} className="!w-full !h-full !rounded-none" />

          {/* Disconnected / Lagging Indicator */}
          {player.isDisconnected && (
            <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-[8px] font-black text-amber-300 bg-amber-500/30 px-1 py-0.5 rounded border border-amber-400/50 animate-pulse">
                Lag...
              </span>
            </div>
          )}

          {/* Thinking Indicator */}
          {player.isThinking && !player.isDisconnected && (
            <div className="absolute -bottom-1 -right-1 flex space-x-0.5 bg-slate-950 px-1 py-0.5 rounded-full border border-sky-400/50 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            </div>
          )}

          {/* Drink Penalty Mug Badge */}
          {player.drinkPenaltyCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 bg-amber-500/90 text-slate-950 text-[9px] md:text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-300 flex items-center shadow-md">
              <Beer className="w-2.5 h-2.5 mr-0.5" />
              <span>{player.drinkPenaltyCount}</span>
            </div>
          )}
        </div>

        {/* Bot Name & Hand Count (Desktop Side-by-Side or Mobile Below Avatar) */}
        <div
          className={`flex flex-col ${
            isMobileTopRow
              ? 'items-center text-center mt-1'
              : position === 'right'
              ? 'order-first mr-2 ml-0 text-right'
              : 'text-left ml-2'
          }`}
        >
          <div className="flex items-center space-x-1 justify-center">
            <span className="font-bold text-[11px] md:text-sm text-slate-200 tracking-tight whitespace-nowrap">
              {player.name}
            </span>
            {!player.isBot && (
              <span className="text-[8px] bg-emerald-500/90 text-slate-950 font-black px-1 py-0.2 rounded-sm flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white mr-0.5 animate-pulse" />
                LIVE
              </span>
            )}
            {player.hasCalledRush && (
              <span className="text-[8px] md:text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded-sm">
                RUSH!
              </span>
            )}
          </div>

          {/* Compact Card Count Badge on Mobile */}
          <div className="flex items-center space-x-1 mt-0.5 md:mt-0 text-[10px] md:text-xs text-slate-400 font-semibold bg-slate-950/60 md:bg-transparent px-1.5 py-0.5 md:p-0 rounded-full border md:border-0 border-white/10">
            <Layers className="w-2.5 h-2.5 text-sky-400 md:hidden" />
            <span>
              {player.hand.length} {player.hand.length === 1 ? 'card' : 'cards'}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Fan of Card Backs - ONLY visible on Desktop to prevent mobile collision */}
      <div className="hidden md:flex items-center -space-x-4 mt-1.5 pointer-events-none">
        {Array.from({ length: visibleCardsCount }).map((_, idx) => (
          <div
            key={idx}
            className="transform transition-transform"
            style={{
              transform: `rotate(${(idx - (visibleCardsCount - 1) / 2) * 8}deg)`,
            }}
          >
            <CardComponent
              card={{
                id: `card-back-${player.id}-${idx}`,
                color: 'wild',
                value: '0',
                label: '',
                type: 'wild',
                scoreValue: 0,
              }}
              isFaceDown={true}
              size="sm"
              disableHover
              className="shadow-sm"
            />
          </div>
        ))}
        {player.hand.length > 5 && (
          <div className="text-[10px] text-slate-400 font-bold pl-5">
            +{player.hand.length - 5}
          </div>
        )}
      </div>

      {/* Call Out / Catch Rush Penalty Button */}
      {canCatch && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => catchUncalledRush(player.id)}
          className="mt-1 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider shadow-[0_0_12px_rgba(225,29,72,0.8)] animate-pulse"
        >
          <AlertTriangle className="w-2.5 h-2.5 text-yellow-300" />
          <span>Catch!</span>
        </motion.button>
      )}
    </div>
  );
};

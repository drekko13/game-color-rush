import React from 'react';
import { motion } from 'framer-motion';
import type { Card as CardType, CardColorWithWild } from '../types/game';
import { SUIT_NAMES } from '../types/game';

interface CardProps {
  card: CardType;
  isPlayable?: boolean;
  onClick?: () => void;
  onDragEnd?: (info: { offset: { y: number } }) => void;
  isFaceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rotation?: number;
  className?: string;
  disableHover?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({
  card,
  isPlayable = false,
  onClick,
  onDragEnd,
  isFaceDown = false,
  size = 'md',
  rotation = 0,
  className = '',
  disableHover = false,
}) => {
  // Color gradient mappings
  const getColorGradient = (color: CardColorWithWild) => {
    switch (color) {
      case 'crimson':
        return 'from-rose-500 via-red-600 to-red-900 border-red-400 text-white';
      case 'ocean':
        return 'from-cyan-400 via-sky-600 to-blue-900 border-sky-400 text-white';
      case 'toxic':
        return 'from-emerald-400 via-teal-600 to-emerald-950 border-emerald-400 text-white';
      case 'solar':
        return 'from-amber-300 via-yellow-500 to-amber-800 border-yellow-300 text-slate-900';
      case 'wild':
        return 'from-slate-900 via-purple-950 to-slate-950 border-fuchsia-400 text-white';
    }
  };

  // Dimensions based on size
  const sizeStyles = {
    sm: 'w-14 h-20 text-xs rounded-lg',
    md: 'w-20 h-32 md:w-24 md:h-36 text-sm rounded-xl',
    lg: 'w-24 h-36 md:w-28 md:h-44 text-base rounded-2xl',
  };

  // Suit / Action stylized icon
  const renderCardCenter = () => {
    if (card.type === 'number') {
      return (
        <div className="flex flex-col items-center justify-center">
          <span className="text-4xl md:text-5xl font-black tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {card.label}
          </span>
          <div className="w-8 h-1 bg-white/40 rounded-full mt-1" />
        </div>
      );
    }

    if (card.value === 'HALT') {
      return (
        <div className="flex flex-col items-center justify-center space-y-1">
          <svg className="w-9 h-9 md:w-11 md:h-11 drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          <span className="text-[10px] md:text-xs font-black tracking-wider uppercase">HALT</span>
        </div>
      );
    }

    if (card.value === 'REWIND') {
      return (
        <div className="flex flex-col items-center justify-center space-y-1">
          <svg className="w-9 h-9 md:w-11 md:h-11 drop-shadow-md animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span className="text-[10px] md:text-xs font-black tracking-wider uppercase">REWIND</span>
        </div>
      );
    }

    if (card.value === 'BURST_2') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center space-x-0.5">
            <span className="text-3xl md:text-4xl font-black italic drop-shadow-md">+2</span>
          </div>
          <span className="text-[9px] md:text-[11px] font-black tracking-widest uppercase bg-white/20 px-1.5 py-0.5 rounded-full mt-0.5">
            BURST
          </span>
        </div>
      );
    }

    if (card.value === 'SPECTRUM') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full grid grid-cols-2 overflow-hidden border-2 border-white/80 shadow-lg rotate-45 transform">
            <div className="bg-red-500" />
            <div className="bg-sky-500" />
            <div className="bg-amber-400" />
            <div className="bg-emerald-500" />
          </div>
          <span className="text-[9px] md:text-[11px] font-black tracking-wider uppercase mt-1 text-fuchsia-300">
            SPECTRUM
          </span>
        </div>
      );
    }

    if (card.value === 'INFERNO_4') {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-11 h-11 md:w-13 md:h-13 rounded-full grid grid-cols-2 overflow-hidden border border-fuchsia-400 opacity-60 animate-spin-slow">
              <div className="bg-red-600" />
              <div className="bg-blue-600" />
              <div className="bg-amber-500" />
              <div className="bg-emerald-600" />
            </div>
            <span className="absolute text-2xl md:text-3xl font-black italic text-white drop-shadow-[0_0_12px_rgba(236,72,153,0.9)]">
              +4
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] font-black tracking-widest uppercase mt-1 text-rose-300">
            INFERNO
          </span>
        </div>
      );
    }

    return <span>{card.label}</span>;
  };

  // If card is face down
  if (isFaceDown) {
    return (
      <div
        className={`relative ${sizeStyles[size]} bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/40 shadow-xl overflow-hidden flex items-center justify-center ${className}`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="absolute inset-1.5 rounded-lg border border-indigo-400/20 bg-slate-950/80 flex items-center justify-center p-1">
          <div className="w-full h-full rounded border border-indigo-500/30 grid grid-cols-3 gap-0.5 p-1 opacity-70">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-indigo-600/20 rounded-sm border border-indigo-400/10"
              />
            ))}
          </div>
          <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 via-indigo-500 to-cyan-400 opacity-80 blur-[1px]" />
          <div className="absolute text-[10px] font-black text-white tracking-widest drop-shadow-md">
            CR
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      drag={isPlayable ? 'y' : false}
      dragConstraints={{ top: -140, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (onDragEnd) {
          onDragEnd(info);
        } else if (info.offset.y < -50 && isPlayable && onClick) {
          onClick();
        }
      }}
      whileHover={
        !disableHover && isPlayable
          ? { scale: 1.08, y: -14, transition: { duration: 0.15 } }
          : undefined
      }
      whileTap={isPlayable ? { scale: 0.96 } : undefined}
      onClick={isPlayable ? onClick : undefined}
      style={{ transform: `rotate(${rotation}deg)` }}
      className={`relative ${sizeStyles[size]} bg-gradient-to-br ${getColorGradient(
        card.color
      )} border-2 shadow-xl flex flex-col justify-between p-2 select-none overflow-hidden transition-all duration-150 ${
        isPlayable
          ? 'cursor-pointer ring-2 ring-white/60 hover:ring-white hover:shadow-2xl'
          : 'opacity-75 filter grayscale-[25%] cursor-not-allowed'
      } ${className}`}
    >
      <div className="absolute -top-12 -left-12 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none" />

      {/* Top Left Corner */}
      <div className="flex items-center justify-between pointer-events-none">
        <span className="font-extrabold text-xs md:text-sm leading-none drop-shadow">
          {card.label}
        </span>
        {card.color !== 'wild' && (
          <span className="text-[9px] opacity-80 uppercase tracking-tighter">
            {SUIT_NAMES[card.color as keyof typeof SUIT_NAMES].split(' ')[0]}
          </span>
        )}
      </div>

      {/* Center Display */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        {renderCardCenter()}
      </div>

      {/* Bottom Right Corner */}
      <div className="flex items-center justify-between rotate-180 pointer-events-none">
        <span className="font-extrabold text-xs md:text-sm leading-none drop-shadow">
          {card.label}
        </span>
        {card.color !== 'wild' && (
          <span className="text-[9px] opacity-80 uppercase tracking-tighter">
            {SUIT_NAMES[card.color as keyof typeof SUIT_NAMES].split(' ')[0]}
          </span>
        )}
      </div>

      {isPlayable && (
        <div className="absolute inset-0 border-2 border-white/40 rounded-xl pointer-events-none animate-pulse" />
      )}
    </motion.div>
  );
};

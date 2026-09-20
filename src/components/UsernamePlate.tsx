import React from 'react';

export const USERNAME_BORDER_STYLES: Record<
  string,
  {
    containerClass: string;
    textClass: string;
    badge: string;
    label: string;
  }
> = {
  default: {
    containerClass: '',
    textClass: 'text-white',
    badge: '⚪',
    label: 'Clean Minimal',
  },
  plate_cyber: {
    containerClass:
      'px-2 py-0.5 rounded-lg bg-cyan-950/60 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.4)] inline-flex items-center space-x-1',
    textClass: 'text-cyan-200 font-black tracking-wide',
    badge: '⚡',
    label: 'Cyber Runner',
  },
  plate_toxic: {
    containerClass:
      'px-2 py-0.5 rounded-lg bg-emerald-950/60 border border-lime-400/60 shadow-[0_0_10px_rgba(163,230,53,0.4)] inline-flex items-center space-x-1',
    textClass: 'text-lime-200 font-black tracking-wide',
    badge: '☣️',
    label: 'Acid Venom',
  },
  plate_flame: {
    containerClass:
      'px-2 py-0.5 rounded-lg bg-rose-950/60 border border-rose-500/70 shadow-[0_0_12px_rgba(244,63,94,0.5)] inline-flex items-center space-x-1',
    textClass: 'text-rose-200 font-black tracking-wide',
    badge: '🔥',
    label: 'Blaze Crest',
  },
  plate_cosmic: {
    containerClass:
      'px-2 py-0.5 rounded-lg bg-purple-950/60 border border-purple-400/70 shadow-[0_0_12px_rgba(192,132,252,0.5)] inline-flex items-center space-x-1',
    textClass: 'text-purple-200 font-black tracking-wide',
    badge: '🌌',
    label: 'Celestial Aura',
  },
  plate_gold: {
    containerClass:
      'px-2 py-0.5 rounded-lg bg-amber-950/60 border border-amber-300/80 shadow-[0_0_14px_rgba(252,211,77,0.6)] inline-flex items-center space-x-1',
    textClass: 'text-amber-200 font-black tracking-wide',
    badge: '👑',
    label: 'Golden Sovereign',
  },
  plate_rainbow: {
    containerClass:
      'px-2 py-0.5 rounded-lg bg-slate-950/80 border border-pink-400/80 shadow-[0_0_15px_rgba(236,72,153,0.5)] inline-flex items-center space-x-1',
    textClass:
      'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 via-emerald-300 to-sky-400 font-black tracking-wide',
    badge: '🌈',
    label: 'Rainbow Prism',
  },
};

interface UsernamePlateProps {
  username: string;
  borderId?: string;
  plateId?: string;
  className?: string;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const UsernamePlate: React.FC<UsernamePlateProps> = ({
  username,
  borderId,
  plateId,
  className = '',
  showBadge = false,
  size = 'md',
}) => {
  const activeId = borderId || plateId || 'default';
  const style = USERNAME_BORDER_STYLES[activeId] || USERNAME_BORDER_STYLES.default;

  const sizeClass =
    size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base sm:text-lg' : 'text-sm';

  if (!activeId || activeId === 'default') {
    return (
      <span className={`font-black text-white ${sizeClass} truncate max-w-full ${className}`}>
        {username}
      </span>
    );
  }

  return (
    <span
      className={`${style.containerClass} ${sizeClass} max-w-full truncate inline-flex items-center ${className}`}
    >
      {showBadge && <span className="text-[10px] select-none shrink-0">{style.badge}</span>}
      <span className={`${style.textClass} truncate`}>{username}</span>
    </span>
  );
};

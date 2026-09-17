import React from 'react';
import {
  Crown,
  Flame,
  Zap,
  Bot,
  Ghost,
  Skull,
  Shield,
  Swords,
  Sparkles,
  Gamepad2,
} from 'lucide-react';

export type AvatarId =
  | 'crown'
  | 'flame'
  | 'zap'
  | 'bot'
  | 'ghost'
  | 'skull'
  | 'shield'
  | 'swords'
  | 'sparkles'
  | 'gamepad';

export interface AvatarOption {
  id: AvatarId;
  label: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'crown', label: 'Crown', gradient: 'from-amber-500 to-yellow-600', icon: Crown },
  { id: 'flame', label: 'Flame', gradient: 'from-rose-500 to-red-600', icon: Flame },
  { id: 'zap', label: 'Volt', gradient: 'from-amber-400 to-orange-500', icon: Zap },
  { id: 'bot', label: 'Cyber', gradient: 'from-cyan-400 to-blue-600', icon: Bot },
  { id: 'ghost', label: 'Phantom', gradient: 'from-purple-500 to-indigo-600', icon: Ghost },
  { id: 'skull', label: 'Rogue', gradient: 'from-slate-400 to-slate-600', icon: Skull },
  { id: 'shield', label: 'Aegis', gradient: 'from-emerald-400 to-teal-600', icon: Shield },
  { id: 'swords', label: 'Blade', gradient: 'from-orange-500 to-rose-600', icon: Swords },
  { id: 'sparkles', label: 'Mystic', gradient: 'from-pink-500 to-rose-500', icon: Sparkles },
  { id: 'gamepad', label: 'Arcade', gradient: 'from-violet-500 to-purple-700', icon: Gamepad2 },
];

const EMOJI_MAP: Record<string, AvatarId> = {
  '👑': 'crown',
  '🔥': 'flame',
  '⚡': 'zap',
  '🤖': 'bot',
  '🐱': 'ghost',
  '🦊': 'flame',
  '🐉': 'swords',
  '👽': 'skull',
  '😎': 'crown',
  '🤠': 'shield',
  '🌸': 'sparkles',
};

interface PlayerAvatarProps {
  avatarId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  border?: boolean;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatarId = 'crown',
  size = 'md',
  className = '',
  border = true,
}) => {
  const normalizedId: AvatarId =
    (EMOJI_MAP[avatarId] as AvatarId) ||
    (AVATAR_OPTIONS.some((a) => a.id === avatarId) ? (avatarId as AvatarId) : 'crown');

  const option = AVATAR_OPTIONS.find((a) => a.id === normalizedId) || AVATAR_OPTIONS[0];
  const IconComponent = option.icon;

  const sizeClasses = {
    xs: 'w-6 h-6 p-1 rounded-lg',
    sm: 'w-8 h-8 p-1.5 rounded-xl',
    md: 'w-10 h-10 p-2 rounded-xl',
    lg: 'w-12 h-12 p-2.5 rounded-2xl',
    xl: 'w-14 h-14 p-3 rounded-2xl',
  }[size];

  const iconSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }[size];

  return (
    <div
      className={`bg-gradient-to-tr ${option.gradient} flex items-center justify-center text-white shadow-md shrink-0 ${
        border ? 'ring-2 ring-white/20' : ''
      } ${sizeClasses} ${className}`}
    >
      <IconComponent className={iconSizes} />
    </div>
  );
};

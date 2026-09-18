import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGameStore } from '../store/useGameStore';
import { Trophy, RotateCcw, Beer, Skull, Home } from 'lucide-react';
import { PlayerAvatar } from './PlayerAvatar';

export const VictoryModal: React.FC = () => {
  const {
    gamePhase,
    winner,
    matchWinner,
    targetScore,
    roundScores,
    players,
    initGame,
    gameMode,
    myPlayerId,
    isHost,
    startRoomGame,
    returnToMainMenu,
  } = useGameStore();

  const isGameOver = gamePhase === 'game_over';

  // Identify local player:
  const myPlayer =
    players.find((p) => (myPlayerId ? p.id === myPlayerId : !p.isBot)) ||
    players.find((p) => p.position === 'bottom') ||
    players[0];

  // Current player is the winner ONLY if their ID strictly matches winner.id
  const isMeWinner = Boolean(winner && myPlayer && winner.id === myPlayer.id);

  useEffect(() => {
    if (isGameOver && isMeWinner) {
      // Fire celebratory confetti ONLY for the winning player!
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        colors: ['#e11d48', '#0284c7', '#059669', '#d97706', '#ec4899'],
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isGameOver, isMeWinner]);

  if (!isGameOver || !winner) return null;

  // Order players: winner first, then remaining cards ascending
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === winner.id) return -1;
    if (b.id === winner.id) return 1;
    return a.hand.length - b.hand.length;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className={`w-full max-w-md bg-slate-900 border-2 rounded-3xl p-6 text-center relative overflow-hidden ${
            isMeWinner
              ? 'border-amber-400/60 shadow-[0_0_50px_rgba(245,158,11,0.4)]'
              : 'border-rose-500/50 shadow-[0_0_50px_rgba(225,29,72,0.35)]'
          }`}
        >
          {/* Top ambient glow */}
          <div
            className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
              isMeWinner ? 'bg-amber-500/30' : 'bg-rose-600/30'
            }`}
          />

          {/* Status Icon Badge */}
          <div
            className={`mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center mb-3 shadow-lg ${
              isMeWinner
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
            }`}
          >
            {isMeWinner ? (
              <Trophy className="w-9 h-9 text-amber-300 animate-bounce" />
            ) : (
              <Skull className="w-9 h-9 text-rose-400 animate-pulse" />
            )}
          </div>

          {/* Title Header */}
          <h2
            className={`text-2xl md:text-3xl font-black tracking-wider uppercase bg-clip-text text-transparent ${
              isMeWinner
                ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400'
                : 'bg-gradient-to-r from-rose-400 via-red-300 to-rose-400'
            }`}
          >
            {matchWinner
              ? matchWinner.id === myPlayer?.id
                ? '🏆 JUARA MATCH 500 POIN!'
                : `${matchWinner.name} JUARA MATCH!`
              : isMeWinner
              ? 'KAMU MENANG RONDE!'
              : 'KAMU KALAH RONDE'}
          </h2>

          {/* Subtitle with Official Score Summary */}
          <p className="text-xs md:text-sm text-slate-300 mt-1 mb-5 leading-relaxed">
            {isMeWinner
              ? `Kamu berhasil menghabiskan kartu lebih dulu dan mengumpulkan +${winner.roundScore || 0} Poin UNO dari kartu lawan!`
              : `${winner.name} berhasil menghabiskan kartu lebih dulu (+${winner.roundScore || 0} Poin UNO).`}
          </p>

          {/* Final Standings Table with Official Points */}
          <div className="space-y-2 mb-6 text-left">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1 px-1">
              <span>Standings & UNO Points</span>
              <span>Target: {targetScore} Pts</span>
            </div>
            {sortedPlayers.map((p) => {
              const isPWinner = p.id === winner.id;
              const isMe = myPlayer && p.id === myPlayer.id;
              const ptsFromHand = roundScores[p.id] || 0;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isPWinner
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : isMe
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      : 'bg-slate-800/60 border-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <PlayerAvatar avatarId={p.avatar} size="xs" />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold block">{p.name}</span>
                        {isMe && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40">
                            KAMU
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Total Skor: <strong className="text-white">{p.matchScore} pts</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    {p.drinkPenaltyCount > 0 && (
                      <span className="flex items-center text-amber-400 text-[11px] font-bold">
                        <Beer className="w-3 h-3 mr-1" />
                        {p.drinkPenaltyCount}
                      </span>
                    )}
                    <div className="text-right">
                      {isPWinner ? (
                        <div className="flex items-center text-amber-300 font-black">
                          <Trophy className="w-3.5 h-3.5 mr-1 fill-amber-300" />
                          <span>+{winner.roundScore || 0} Pts</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold block">
                          {p.hand.length} Kartu ({ptsFromHand} pts)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {gameMode === 'multiplayer' ? (
            isHost ? (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => startRoomGame()}
                  className="flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-xs md:text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                >
                  <RotateCcw className="w-4 h-4 text-slate-950" />
                  <span>Main Lagi (Host)</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => returnToMainMenu()}
                  className="flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs md:text-sm tracking-wider uppercase transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Menu Utama</span>
                </motion.button>
              </div>
            ) : (
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => returnToMainMenu()}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 text-white font-black text-xs md:text-sm tracking-wider uppercase shadow-lg"
                >
                  <Home className="w-4 h-4 text-white" />
                  <span>Kembali ke Menu Utama</span>
                </motion.button>
                <p className="text-[11px] text-center text-slate-400">
                  Menunggu host memulai rematch atau kamu bisa kembali ke menu utama.
                </p>
              </div>
            )
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => initGame()}
                className="flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-slate-950 font-black text-xs md:text-sm tracking-wider uppercase shadow-[0_0_25px_rgba(245,158,11,0.5)]"
              >
                <RotateCcw className="w-4 h-4 text-slate-950" />
                <span>Main Lagi</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => returnToMainMenu()}
                className="flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs md:text-sm tracking-wider uppercase transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Menu Utama</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

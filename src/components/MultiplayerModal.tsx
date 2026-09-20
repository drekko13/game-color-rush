import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { socketService } from '../services/socket';
import {
  Users,
  Radio,
  PlusCircle,
  LogIn,
  Bot,
  X,
  Loader2,
  Copy,
  Check,
  Crown,
  Play,
  LogOut,
} from 'lucide-react';

import { PlayerAvatar, AVATAR_OPTIONS } from './PlayerAvatar';
import { UsernamePlate } from './UsernamePlate';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    gameMode,
    roomId,
    roomLobby,
    isHost,
    myPlayerId,
    isSearchingMatch,
    queueCount,
    playerName,
    playerAvatar,
    setPlayerProfile,
    startMatchmaking,
    cancelMatchmaking,
    createCustomRoom,
    joinCustomRoom,
    startRoomGame,
    leaveRoom,
    startSoloGame,
    currentScreen,
    players,
    authUser,
  } = useGameStore();

  const isMatchInProgress = currentScreen === 'game' || roomLobby?.status === 'playing';
  const myPlayerInGame = players.find((p) => (myPlayerId ? p.id === myPlayerId : !p.isBot));
  const effectiveIsHost = isMatchInProgress
    ? Boolean(myPlayerInGame?.isHost ?? isHost)
    : isHost;

  const handleCloseModal = () => {
    if (currentScreen === 'lobby') {
      if (window.confirm('Keluar dari room ini?')) {
        leaveRoom();
        onClose();
      }
    } else {
      onClose();
    }
  };

  const [activeTab, setActiveTab] = useState<'matchmaking' | 'custom' | 'solo'>('matchmaking');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-switch to custom room tab if in a room lobby & poll lobby state
  useEffect(() => {
    if (roomId || roomLobby) {
      setActiveTab('custom');
    }
  }, [roomId, roomLobby]);

  useEffect(() => {
    if (roomId) {
      socketService.getRoomLobby(roomId);
      const interval = setInterval(() => {
        socketService.getRoomLobby(roomId);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [roomId]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartGameClick = () => {
    startRoomGame();
  };

  // Players in the room (prefer authoritative roomLobby if available)
  const lobbyPlayers =
    roomLobby?.players && roomLobby.players.length > 0
      ? roomLobby.players
      : roomId
      ? [
          {
            socketId: socketService.socket?.id || 'self',
            name: playerName,
            avatar: playerAvatar,
            isHost: isHost,
          },
        ]
      : [];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe pl-safe pr-safe bg-slate-950/85 backdrop-blur-md"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-lg max-h-[90dvh] overflow-y-auto no-scrollbar bg-slate-900 border border-white/15 rounded-3xl p-4 sm:p-6 shadow-xl relative will-change-transform"
        >
          {/* Ambient Glow (desktop only) */}
          <div className="hidden md:block absolute -top-20 -right-20 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center space-x-2.5 mb-5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
              isMatchInProgress
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                : 'bg-gradient-to-tr from-sky-500 to-indigo-600'
            }`}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-wide uppercase">
                {isMatchInProgress ? 'Informasi Room' : 'Multiplayer Lobby'}
              </h2>
              <p className="text-xs text-slate-400">
                {isMatchInProgress
                  ? `Pertandingan sedang berlangsung di Room ${roomId}`
                  : 'Play in real-time with other players online'}
              </p>
            </div>
          </div>

          {/* Profile Setup: Nickname & Avatar */}
          {!roomId && (
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 mb-5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                Your Player Identity
              </label>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <PlayerAvatar avatarId={playerAvatar} size="lg" />
                </div>

                <div className="flex-1">
                  <input
                    type="text"
                    value={playerName}
                    maxLength={15}
                    onChange={(e) => setPlayerProfile(e.target.value, playerAvatar)}
                    placeholder="Enter your nickname"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Avatar Selectors */}
              <div className="flex items-center space-x-2 mt-2.5 overflow-x-auto no-scrollbar py-1">
                {AVATAR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPlayerProfile(playerName, opt.id)}
                    className={`p-0.5 rounded-xl transition-transform shrink-0 ${
                      playerAvatar === opt.id
                        ? 'scale-110 ring-2 ring-sky-300'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <PlayerAvatar avatarId={opt.id} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Tabs (Disabled if already inside a custom room lobby) */}
          {!roomId && (
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-white/5 mb-5">
              <button
                onClick={() => setActiveTab('matchmaking')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'matchmaking'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Quick Match
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'custom'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Private Room
              </button>
              <button
                onClick={() => setActiveTab('solo')}
                className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'solo'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Solo vs AI
              </button>
            </div>
          )}

          {/* Tab 1: Quick Matchmaking */}
          {activeTab === 'matchmaking' && !roomId && (
            <div className="text-center py-2 space-y-4">
              {isSearchingMatch ? (
                <div className="flex flex-col items-center py-6 space-y-3">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-sky-400 animate-spin" />
                    <Radio className="w-5 h-5 text-sky-300 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Searching for Opponents...
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {queueCount} player{queueCount > 1 ? 's' : ''} in queue. Starting match soon!
                    </p>
                  </div>
                  <button
                    onClick={cancelMatchmaking}
                    className="px-4 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-white/10"
                  >
                    Cancel Search
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Click below to immediately match with other players visiting ColorRush. Any open slots will be filled with smart AI bots!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={startMatchmaking}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(2,132,199,0.5)] flex items-center justify-center space-x-2"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Find Match Now</span>
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Custom Private Room */}
          {activeTab === 'custom' && (
            <div className="space-y-4 py-1">
              {/* If in a Room -> Show Active Match Info or Waiting Lobby */}
              {roomId ? (
                isMatchInProgress ? (
                  /* IN-GAME ROOM DETAILS VIEW */
                  <div className="space-y-4">
                    {/* Status Live Banner */}
                    <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <div>
                          <span className="text-xs font-black text-emerald-300 uppercase tracking-wider block">
                            Pertandingan Sedang Berlangsung
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Room Aktif • {effectiveIsHost ? 'Kamu adalah Host' : 'Tamu / Pemain'}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase">
                        LIVE
                      </span>
                    </div>

                    {/* Room Code Card */}
                    <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-center">
                      <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider block mb-1">
                        KODE ROOM (BAGIKAN KE TEMAN)
                      </span>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl font-black text-white tracking-widest bg-slate-950 px-4 py-1.5 rounded-xl border border-purple-400">
                          {roomId}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow transition-all"
                          title="Salin Kode Room"
                        >
                          {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Connected Players in Active Match */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          Pemain dalam Pertandingan ({players.length})
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Kartu di Tangan
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {players.map((p) => {
                          const isMe = myPlayerId ? p.id === myPlayerId : !p.isBot;
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isMe
                                  ? 'bg-sky-950/60 border-sky-500/40 shadow-sm ring-1 ring-sky-500/30'
                                  : 'bg-slate-950/80 border-white/10'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <PlayerAvatar
                                  avatarId={p.avatar}
                                  size="sm"
                                  borderId={p.profileBorder || (isMe ? authUser?.activeProfileBorder : 'default')}
                                />
                                <div>
                                  <div className="flex items-center space-x-1.5">
                                    <UsernamePlate
                                      username={p.name}
                                      borderId={p.usernameBorder || (isMe ? authUser?.activeUsernameBorder : 'default')}
                                      size="sm"
                                    />
                                    {isMe && (
                                      <span className="text-[9px] font-black text-sky-400 bg-sky-500/20 px-1.5 py-0.2 rounded border border-sky-400/30 uppercase">
                                        Kamu
                                      </span>
                                    )}
                                    {p.isHost && (
                                      <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-400/30 uppercase">
                                        Host
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 block">
                                    {p.isBot ? 'Bot AI' : 'Pemain Online'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-mono font-bold text-xs text-amber-300">
                                  {p.hand.length} Kartu
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons for in-game modal */}
                    <div className="space-y-2 pt-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-slate-950" />
                        <span>Lanjutkan Permainan (Tutup Modal)</span>
                      </motion.button>

                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              'Apakah kamu yakin ingin keluar dari pertandingan ini? Kamu akan kembali ke Menu Utama.'
                            )
                          ) {
                            leaveRoom();
                            onClose();
                          }
                        }}
                        className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-rose-400 border border-rose-500/20 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar dari Pertandingan</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* PRE-GAME LOBBY VIEW */
                  <div className="space-y-4">
                    {/* Room Code Card */}
                    <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-center">
                      <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider block mb-1">
                        KODE ROOM (BAGIKAN KE TEMAN)
                      </span>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl font-black text-white tracking-widest bg-slate-950 px-4 py-1.5 rounded-xl border border-purple-400">
                          {roomId}
                        </span>
                        <button
                          onClick={handleCopyCode}
                          className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow transition-all"
                          title="Salin Kode Room"
                        >
                          {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Connected Players in Room */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                          Pemain di Room ({lobbyPlayers.length}/4)
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {lobbyPlayers.length < 4 ? 'Slot kosong otomatis diisi Bot AI' : 'Room Penuh (4/4)'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {lobbyPlayers.map((lp, idx) => {
                          const currentSocketId = socketService.socket?.id || myPlayerId;
                          const myClientId = typeof window !== 'undefined' ? sessionStorage.getItem('colorrush_client_id') : null;
                          const isMe = Boolean(
                            (lp.clientPlayerId && myClientId && lp.clientPlayerId === myClientId) ||
                            (lp.socketId && currentSocketId && lp.socketId === currentSocketId) ||
                            (!lp.socketId && lp.name === playerName) ||
                            (!lp.socketId && lp.isHost === isHost)
                          );

                          const isLpHost = Boolean(lp.isHost || idx === 0);

                          return (
                            <div
                              key={lp.socketId || idx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                isMe
                                  ? 'bg-sky-950/60 border-sky-500/40 shadow-sm ring-1 ring-sky-500/30'
                                  : 'bg-slate-950/80 border-white/10'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <PlayerAvatar
                                  avatarId={lp.avatar}
                                  size="md"
                                  borderId={lp.profileBorder || (isMe ? authUser?.activeProfileBorder : 'default')}
                                />
                                <div className="flex items-center space-x-2">
                                  <UsernamePlate
                                    username={lp.name}
                                    borderId={lp.usernameBorder || (isMe ? authUser?.activeUsernameBorder : 'default')}
                                    size="md"
                                  />
                                  {isMe && (
                                    <span className="text-[9px] font-black text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-400/30 uppercase">
                                      Kamu
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isLpHost ? (
                                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black">
                                  <Crown className="w-3 h-3" />
                                  <span>HOST (SLOT 1)</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black">
                                  TERISI (SLOT {idx + 1})
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Remaining empty slots indicator */}
                        {Array.from({ length: Math.max(0, (roomLobby?.maxPlayers || 4) - lobbyPlayers.length) }).map((_, i) => {
                          const slotNum = lobbyPlayers.length + i + 1;
                          return (
                            <div
                              key={`empty-${i}`}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-dashed border-white/10 text-slate-500 text-xs"
                            >
                              <div className="flex items-center space-x-2">
                                <Bot className="w-4 h-4 text-slate-500" />
                                <span className="font-semibold text-[11px]">
                                  Slot {slotNum} (Akan diisi AI Bot atau Teman)
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-600 uppercase font-mono tracking-wider">
                                Kosong
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Host Start Button vs Guest Waiting Notice */}
                    {isHost ? (
                      <div className="space-y-2">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={handleStartGameClick}
                          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.6)] flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Play className="w-5 h-5 fill-slate-950" />
                          <span>MULAI PERMAINAN (START GAME)</span>
                        </motion.button>
                        <p className="text-[11px] text-center text-slate-400">
                          Klik tombol di atas untuk mulai bermain bersama!
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-sky-500/30 flex items-center justify-center space-x-2.5 text-center">
                        <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                        <span className="text-xs font-bold text-sky-300">
                          Menunggu Host memulai permainan...
                        </span>
                      </div>
                    )}

                    {/* Leave Room Button */}
                    <button
                      onClick={leaveRoom}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar dari Room</span>
                    </button>
                  </div>
                )
              ) : (
                /* If Not in Room -> Show Create / Join Form */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Create Room */}
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center">
                        <PlusCircle className="w-4 h-4 mr-1.5 text-purple-400" />
                        Buat Room Baru
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Jadi Host, dapatkan kode room, dan mulai game bersama teman.
                      </p>
                    </div>
                    <button
                      onClick={() => createCustomRoom()}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow"
                    >
                      Buat Room (Host)
                    </button>
                  </div>

                  {/* Join Room */}
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center">
                        <LogIn className="w-4 h-4 mr-1.5 text-sky-400" />
                        Gabung Room
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Masukkan kode room 4-huruf dari temanmu.
                      </p>
                    </div>
                    <div className="flex space-x-1.5">
                      <input
                        type="text"
                        value={joinCodeInput}
                        maxLength={6}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="KODE"
                        className="w-24 bg-slate-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-center font-black text-sm text-white uppercase focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={() => {
                          if (joinCodeInput.trim()) {
                            joinCustomRoom(joinCodeInput.trim());
                          }
                        }}
                        className="flex-1 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider shadow"
                      >
                        Gabung
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Solo Offline */}
          {activeTab === 'solo' && !roomId && (
            <div className="text-center py-3 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wide">
                  Single Player Mode
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Play immediately against 3 intelligent bots (Blaze Bot, Cyber Surge, Neon Bloom). No internet needed.
                </p>
              </div>
              <button
                onClick={() => {
                  startSoloGame();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow"
              >
                Play Solo Match
              </button>
            </div>
          )}

          {/* Current Status Pill */}
          <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-2 ${
                  gameMode === 'multiplayer' || roomId ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              {roomId
                ? `Room: ${roomId} (${effectiveIsHost ? 'Host' : 'Guest'})`
                : 'Mode: Solo vs AI'}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

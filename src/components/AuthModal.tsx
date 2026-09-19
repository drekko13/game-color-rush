import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import { PlayerAvatar, AVATAR_OPTIONS } from './PlayerAvatar';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
  Trophy,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    openAuthModal,
    login,
    registerUser,
    isAuthLoading,
    lastGamePointsGained,
    lastGameSaved,
  } = useGameStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState('crown');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSwitchTab = (tab: 'login' | 'register') => {
    soundFx.playCardDraw();
    setErrorMessage(null);
    setSuccessMessage(null);
    openAuthModal(tab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Masukkan username atau email kamu.');
      return;
    }
    if (!password) {
      setErrorMessage('Masukkan kata sandi kamu.');
      return;
    }

    try {
      await login(identifier.trim(), password);
      soundFx.playVictory();
      setSuccessMessage('Berhasil masuk! Selamat datang kembali.');
      setTimeout(() => {
        closeAuthModal();
      }, 700);
    } catch (err: any) {
      soundFx.playDrinkPenalty();
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali akun kamu.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = regUsername.trim();
    const cleanEmail = regEmail.trim();

    if (cleanUser.length < 3 || cleanUser.length > 25) {
      setErrorMessage('Username harus terdiri dari 3 hingga 25 karakter.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUser)) {
      setErrorMessage('Username hanya boleh huruf, angka, dan garis bawah (_).');
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Format email tidak valid.');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      await registerUser(cleanUser, cleanEmail, regPassword, regAvatar);
      soundFx.playVictory();
      setSuccessMessage('Akun berhasil dibuat! Selamat bermain.');
      setTimeout(() => {
        closeAuthModal();
      }, 700);
    } catch (err: any) {
      soundFx.playDrinkPenalty();
      setErrorMessage(err.message || 'Gagal mendaftar.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden my-auto"
        >
          {/* Top ambient glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-tr from-rose-500/20 via-sky-500/20 to-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => {
              soundFx.playCardDraw();
              closeAuthModal();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title */}
          <div className="text-center space-y-1 mb-5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full bg-slate-800/70 border border-white/10 text-[11px] font-bold text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>COLORRUSH ACCOUNT</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              {authModalTab === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru'}
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Simpan riwayat pertandingan, akumulasi total poin Uno, dan capai rank tertinggi!
            </p>
          </div>

          {/* Banner notification if player has unsaved points */}
          {!lastGameSaved && lastGamePointsGained > 0 && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center space-x-2.5 text-amber-200 text-xs">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <span className="font-bold">+{lastGamePointsGained} Poin</span> dari permainan barusan akan otomatis disimpan ke akunmu setelah masuk/daftar!
              </div>
            </div>
          )}

          {/* Tabs: Login vs Register */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-white/5 mb-5">
            <button
              onClick={() => handleSwitchTab('login')}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authModalTab === 'login'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Login)</span>
            </button>
            <button
              onClick={() => handleSwitchTab('register')}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                authModalTab === 'register'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* FORM: LOGIN */}
          {authModalTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center">
                  <User className="w-3 h-3 mr-1 text-slate-400" />
                  Username atau Email
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: alex_99 atau alex@mail.com"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center">
                    <Lock className="w-3 h-3 mr-1 text-slate-400" />
                    Kata Sandi
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akunmu"
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-3 pr-10 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>MASUK SEKARANG</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-400">Belum punya akun? </span>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('register')}
                  className="text-xs font-bold text-sky-400 hover:underline cursor-pointer"
                >
                  Daftar Sekarang
                </button>
              </div>
            </form>
          )}

          {/* FORM: REGISTER */}
          {authModalTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              {/* Avatar Picker Preview */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  Pilih Avatar Akun
                </label>
                <div className="flex items-center space-x-2 overflow-x-auto py-1 no-scrollbar">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => {
                        soundFx.playCardDraw();
                        setRegAvatar(opt.id);
                      }}
                      className={`p-1 rounded-2xl transition-transform shrink-0 cursor-pointer ${
                        regAvatar === opt.id ? 'scale-110 ring-2 ring-sky-400 shadow-md' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={opt.label}
                    >
                      <PlayerAvatar avatarId={opt.id} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center">
                  <User className="w-3 h-3 mr-1 text-slate-400" />
                  Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="3-25 karakter (huruf, angka, _)"
                  maxLength={25}
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 transition-colors shadow-inner"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center">
                  <Mail className="w-3 h-3 mr-1 text-slate-400" />
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="contoh@gmail.com"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 transition-colors shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center">
                    <Lock className="w-3 h-3 mr-1 text-slate-400" />
                    Kata Sandi
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 transition-colors shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center">
                    <Lock className="w-3 h-3 mr-1 text-slate-400" />
                    Konfirmasi
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ulangi sandi"
                    required
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400 transition-colors shadow-inner"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3 mt-1 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>BUAT AKUN BARU</span>
                  </>
                )}
              </button>

              <div className="text-center pt-0.5">
                <span className="text-xs text-slate-400">Sudah punya akun? </span>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('login')}
                  className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                >
                  Masuk Saja
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

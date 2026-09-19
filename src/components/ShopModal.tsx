import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { soundFx } from '../audio/soundEffects';
import { PlayerAvatar } from './PlayerAvatar';
import { UsernamePlate } from './UsernamePlate';
import type { ShopItem } from '../types/game';
import {
  X,
  Sparkles,
  ShoppingBag,
  Check,
  Coins,
  Shield,
  Layers,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export const ShopModal: React.FC = () => {
  const {
    isShopModalOpen,
    closeShopModal,
    shopCatalog,
    fetchShopCatalog,
    authUser,
    buyShopItem,
    equipShopItem,
    openAuthModal,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'profile_border' | 'username_border'>('profile_border');
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isShopModalOpen) {
      fetchShopCatalog();
      setNotification(null);
    }
  }, [isShopModalOpen, fetchShopCatalog]);

  if (!isShopModalOpen) return null;

  const userPoints = authUser?.totalPoints || 0;
  const activeProfileBorder = authUser?.activeProfileBorder || 'default';
  const activeUsernameBorder = authUser?.activeUsernameBorder || 'default';
  const unlockedProfileBorders = authUser?.unlockedProfileBorders || ['default'];
  const unlockedUsernameBorders = authUser?.unlockedUsernameBorders || ['default'];

  // Current preview
  const previewProfileBorder =
    activeTab === 'profile_border' && selectedPreviewItem
      ? selectedPreviewItem
      : activeProfileBorder;

  const previewUsernameBorder =
    activeTab === 'username_border' && selectedPreviewItem
      ? selectedPreviewItem
      : activeUsernameBorder;

  const items: ShopItem[] =
    activeTab === 'profile_border'
      ? shopCatalog?.profileBorders || []
      : shopCatalog?.usernameBorders || [];

  const handleBuy = async (item: ShopItem) => {
    if (!authUser) {
      openAuthModal('login');
      return;
    }

    if (userPoints < item.price) {
      setNotification({
        type: 'error',
        message: `Poin tidak mencukupi! Kamu butuh ${item.price} Poin (Saldo: ${userPoints} Poin).`,
      });
      soundFx.playDrinkPenalty();
      return;
    }

    setIsProcessing(true);
    setNotification(null);
    try {
      await buyShopItem(activeTab, item.id);
      soundFx.playVictory();
      setNotification({
        type: 'success',
        message: `Selamat! "${item.name}" berhasil dibeli dan langsung dipasang!`,
      });
    } catch (err: any) {
      soundFx.playDrinkPenalty();
      setNotification({
        type: 'error',
        message: err.message || 'Gagal memproses pembelian.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquip = async (item: ShopItem) => {
    if (!authUser) return;

    setIsProcessing(true);
    setNotification(null);
    try {
      await equipShopItem(activeTab, item.id);
      soundFx.playCardDraw();
      setNotification({
        type: 'success',
        message: `"${item.name}" berhasil dipasang!`,
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Gagal memasang item.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col relative overflow-hidden my-auto"
        >
          {/* Ambient top glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={() => {
              soundFx.playCardDraw();
              closeShopModal();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors z-20 cursor-pointer"
            title="Tutup Toko"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header & Balance */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-white/10 shrink-0 z-10">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-sky-500 flex items-center justify-center text-white shadow-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  <span>TOKO POIN ARCADIA</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    STORE
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Kustomisasi tampilan profil dan nama akunmu menggunakan poin Uno!
                </p>
              </div>
            </div>

            {/* User Point Balance */}
            <div className="flex items-center space-x-2 self-start sm:self-auto bg-slate-950/80 border border-amber-400/40 rounded-2xl px-3.5 py-2 shadow-inner">
              <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Poin Kamu</div>
                <div className="text-base sm:text-lg font-black text-amber-300 leading-tight">
                  {userPoints.toLocaleString('id-ID')} <span className="text-xs text-amber-400/70">Pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Warning if not logged in */}
          {!authUser && (
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-sky-500/15 border border-white/15 flex items-center justify-between text-xs z-10">
              <div className="flex items-center space-x-2 text-slate-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Masuk ke akun terlebih dahulu agar dapat membeli & menyimpan koleksi bordermu!</span>
              </div>
              <button
                onClick={() => {
                  closeShopModal();
                  openAuthModal('login');
                }}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow"
              >
                Masuk Sekarang
              </button>
            </div>
          )}

          {/* Notification feedback */}
          {notification && (
            <div
              className={`mb-3 p-2.5 rounded-2xl border text-xs flex items-center space-x-2 z-10 ${
                notification.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="flex-1">{notification.message}</span>
            </div>
          )}

          {/* Interactive Live Preview Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 shadow-inner mb-3 shrink-0 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3.5">
              <div className="relative">
                <PlayerAvatar
                  avatarId={authUser?.avatar || 'crown'}
                  size="lg"
                  borderId={previewProfileBorder}
                />
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Pratinjau Langsung Profil & Username
                </div>
                <div className="mt-1 flex items-center space-x-2">
                  <UsernamePlate
                    username={authUser?.username || 'Player You'}
                    borderId={previewUsernameBorder}
                    showBadge={true}
                    className="text-sm"
                  />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {userPoints} Pts
                  </span>
                </div>
              </div>
            </div>

            {selectedPreviewItem && (
              <button
                onClick={() => setSelectedPreviewItem(null)}
                className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/80 cursor-pointer"
              >
                Reset Preview
              </button>
            )}
          </div>

          {/* Tabs: Profile Border vs Username Border */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/80 border border-white/5 mb-3 shrink-0 z-10">
            <button
              onClick={() => {
                soundFx.playCardDraw();
                setActiveTab('profile_border');
                setSelectedPreviewItem(null);
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'profile_border'
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Border Profile ({shopCatalog?.profileBorders.length || 7})</span>
            </button>
            <button
              onClick={() => {
                soundFx.playCardDraw();
                setActiveTab('username_border');
                setSelectedPreviewItem(null);
              }}
              className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                activeTab === 'username_border'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Border Username ({shopCatalog?.usernameBorders.length || 7})</span>
            </button>
          </div>

          {/* Items Grid Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-[240px] z-10">
            {items.map((item) => {
              const isProfile = activeTab === 'profile_border';
              const isUnlocked = isProfile
                ? unlockedProfileBorders.includes(item.id)
                : unlockedUsernameBorders.includes(item.id);
              const isEquipped = isProfile
                ? activeProfileBorder === item.id
                : activeUsernameBorder === item.id;
              const isPreviewing = selectedPreviewItem === item.id;
              const canAfford = userPoints >= item.price;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedPreviewItem(item.id)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                    isPreviewing
                      ? 'bg-slate-800/90 border-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                      : isEquipped
                      ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                      : isUnlocked
                      ? 'bg-slate-950/60 border-white/10 hover:border-white/20'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Left: Item Visual & Info */}
                  <div className="flex items-center space-x-3">
                    {/* Item icon / preview frame */}
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 relative overflow-hidden">
                      {isProfile ? (
                        <PlayerAvatar
                          avatarId={authUser?.avatar || 'crown'}
                          size="sm"
                          borderId={item.id}
                        />
                      ) : (
                        <div className="p-1">
                          <UsernamePlate username="NAME" borderId={item.id} className="text-[10px]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base select-none">{item.badge}</span>
                        <h4 className="text-sm font-black text-white">{item.name}</h4>
                        {isEquipped && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                            Digunakan
                          </span>
                        )}
                        {!isEquipped && isUnlocked && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                            Dimiliki
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  {/* Right: Price & Action Button */}
                  <div className="flex items-center justify-between sm:justify-end space-x-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-black text-amber-300">
                        {item.price === 0 ? 'GRATIS' : `${item.price.toLocaleString('id-ID')} Pts`}
                      </div>
                      <div className="text-[10px] text-slate-500">Harga Item</div>
                    </div>

                    {isEquipped ? (
                      <button
                        disabled
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-black text-xs flex items-center space-x-1 cursor-default"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aktif</span>
                      </button>
                    ) : isUnlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquip(item);
                        }}
                        disabled={isProcessing}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-110 text-white font-black text-xs flex items-center space-x-1 shadow-md transition-transform active:scale-95 cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Gunakan</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuy(item);
                        }}
                        disabled={isProcessing || !canAfford}
                        className={`px-3.5 py-2 rounded-xl font-black text-xs flex items-center space-x-1.5 shadow-md transition-transform active:scale-95 cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        ) : (
                          <>
                            <Coins className="w-3.5 h-3.5" />
                            <span>Beli ({item.price} Pts)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

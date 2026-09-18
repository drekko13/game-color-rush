import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Flame, Waves, Sparkles, Sun, Zap, Swords, Trophy, Layers } from 'lucide-react';
import { SUIT_NAMES } from '../types/game';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-xl max-h-[88vh] overflow-y-auto bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl relative no-scrollbar"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-black text-white tracking-wide uppercase mb-1 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-sky-400" />
            Panduan & Aturan Resmi ColorRush
          </h2>
          <p className="text-[11px] text-slate-400 mb-5">
            Berdasarkan aturan resmi ColorRush
          </p>

          <div className="space-y-6 text-sm text-slate-300">
            {/* 1. Deck & Setup */}
            <div>
              <h3 className="text-xs font-black text-sky-400 uppercase tracking-wider mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-1.5" />
                1. Dek Kartu & Permulaan (108 Kartu)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Dek terdiri dari <strong>108 kartu</strong>: masing-masing 4 warna memiliki satu kartu ‘0’, dua kartu angka ‘1-9’, dua kartu Skip (HALT), dua Reverse (REWIND), dan dua Draw Two (BURST +2). Ditambah 4 Wild (SPECTRUM) dan 4 Wild Draw Four (INFERNO +4).
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <span className="font-bold text-red-300 block text-xs">{SUIT_NAMES.crimson}</span>
                    <span className="text-[10px] text-slate-400">Crimson Red</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/40 flex items-center space-x-2">
                  <Waves className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <span className="font-bold text-sky-300 block text-xs">{SUIT_NAMES.ocean}</span>
                    <span className="text-[10px] text-slate-400">Ocean Blue</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300 block text-xs">{SUIT_NAMES.toxic}</span>
                    <span className="text-[10px] text-slate-400">Toxic Green</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-300 block text-xs">{SUIT_NAMES.solar}</span>
                    <span className="text-[10px] text-slate-400">Solar Yellow</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Aturan Stacking (+2 & +4) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/40">
              <h3 className="text-xs font-black text-rose-300 uppercase tracking-wider mb-2 flex items-center">
                <Flame className="w-4 h-4 mr-1.5 text-rose-400" />
                2. Aturan Menumpuk Kartu (Stacking +2 & +4)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Kartu <strong>+2 (BURST +2)</strong> dan <strong>+4 (INFERNO +4)</strong> dapat ditumpuk (*stack*):
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                <li><strong className="text-white">+2 hanya bisa ditumpuk di atas +2.</strong></li>
                <li><strong className="text-amber-300">+4 dapat ditumpuk di atas +2 maupun +4.</strong> (+2 tidak bisa ditumpuk di atas +4).</li>
                <li>Pemain yang <strong>tidak dapat / tidak menumpuk kartu</strong> wajib mengambil <strong>seluruh total kartu penalti yang terakumulasi</strong> (+2, +4, +6, +8, dst.) dan gilirannya dilewati!</li>
              </ul>
            </div>

            {/* 3. Force Play */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/10">
              <h3 className="text-xs font-black text-sky-300 uppercase tracking-wider mb-2">
                3. Force Play (Main Otomatis Saat Draw)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Sesuai aturan resmi Mattel ColorRush, jika kamu mengambil kartu dari deck (*draw card*) dan kartu yang kamu peroleh <strong>cocok / dapat dimainkan</strong>, kartu tersebut <strong>akan langsung dimainkan secara otomatis</strong> (*Force Play*).
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Jika kartu yang diambil tidak cocok, giliranmu langsung berakhir dan berlanjut ke pemain berikutnya.
              </p>
            </div>

            {/* 4. Action & Wild Cards */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5">
                4. Kartu Aksi & Simbol
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 whitespace-nowrap">
                    HALT (Skip)
                  </span>
                  <p className="text-xs text-slate-300">
                    Melewati giliran pemain berikutnya. (Pada 2 pemain, membuatmu langsung main lagi).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 whitespace-nowrap">
                    REWIND (Reverse)
                  </span>
                  <p className="text-xs text-slate-300">
                    Membalik arah putaran giliran. (Pada 2 pemain, berfungsi sama seperti Skip).
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 whitespace-nowrap">
                    BURST +2 (Draw Two)
                  </span>
                  <p className="text-xs text-slate-300">
                    Memaksa pemain berikutnya mengambil 2 kartu (bisa ditumpuk dengan +2 atau +4)!
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/60 border border-white/5 flex items-start space-x-3">
                  <span className="font-black text-xs px-2 py-1 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 whitespace-nowrap">
                    SPECTRUM (Wild)
                  </span>
                  <p className="text-xs text-slate-300">
                    Bisa dimainkan kapan saja untuk memilih warna aktif berikutnya.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Wild Draw 4 & Challenge Rule */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/40">
              <h3 className="font-black text-rose-300 uppercase tracking-wide text-xs mb-1.5 flex items-center">
                <Swords className="w-4 h-4 text-rose-400 mr-1.5" />
                <span>5. Aturan Wild Draw +4 & Tantangan (Challenge)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Kartu Wild Draw +4 (INFERNO +4) hanya sah dimainkan jika pemain <strong>TIDAK memiliki kartu berwarna sama</strong> dengan kartu sebelumnya di meja. Pemain korban berhak mengajukan <strong>Tantangan (Challenge)</strong>:
              </p>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                <li><strong className="text-emerald-400">Jika Bersalah (Bluffing):</strong> Pemain yang memainkan +4 terbukti punya warna tersebut; ia harus mengambil <strong>4 kartu penalti</strong>. Korban bebas penalti & bermain normal!</li>
                <li><strong className="text-rose-400">Jika Jujur:</strong> Penantang kalah dan harus mengambil <strong>6 KARTU PENALTI</strong> (4 kartu + 2 penalti tantangan) dan gilirannya dilewati!</li>
              </ul>
            </div>

            {/* 6. Teriak UNO! */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-400/40">
              <h3 className="font-black text-amber-300 uppercase tracking-wide text-xs mb-1.5 flex items-center">
                <Zap className="w-4 h-4 text-amber-400 mr-1.5 fill-amber-400" />
                <span>6. Aturan Teriak "UNO!" (Penalti +2 Kartu)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Saat kamu hanya memegang <strong>1 kartu</strong> di tangan, kamu wajib menekan tombol <strong>"UNO!"</strong>! Jika kamu lupa atau kalah cepat ditangkap lawan, kamu terkena penalti resmi mengambil <strong>+2 KARTU</strong>! Begitu juga sebaliknya: jika lawan sisa 1 kartu dan kamu lebih cepat menangkapnya, lawan terkena penalti +2 kartu.
              </p>
            </div>

            {/* 7. Perhitungan Skor & Target 500 Poin */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10">
              <h3 className="font-black text-amber-400 uppercase tracking-wide text-xs mb-1.5 flex items-center">
                <Trophy className="w-4 h-4 text-amber-400 mr-1.5" />
                <span>7. Sistem Poin Resmi (Target 500 Poin)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                Ketika seorang pemain menghabiskan seluruh kartunya, ia memenangkan ronde dan mendapatkan poin dari seluruh kartu yang tersisa di tangan semua lawan:
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                  <span className="block font-black text-white">Kartu 0-9</span>
                  <span className="text-[11px] text-slate-400">Nilai Muka (0-9 Poin)</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                  <span className="block font-black text-sky-300">Skip/Reverse/+2</span>
                  <span className="text-[11px] text-slate-400">20 Poin / kartu</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-white/10">
                  <span className="block font-black text-amber-300">Wild & Wild +4</span>
                  <span className="text-[11px] text-slate-400">50 Poin / kartu</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Pemain pertama yang mengumpulkan total <strong>500 Poin</strong> dinobatkan sebagai Juara Match!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

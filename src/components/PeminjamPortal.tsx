import { useState, useEffect } from "react";
import { UserProfile, Equipment, Transaction, EquipmentCategory, KondisiAlat } from "../types";
import {
  getEquipments,
  getTransactions,
  createTransaction,
  db
} from "../lib/db";
import { doc, getDoc } from "firebase/firestore";
import {
  Search,
  ShoppingBasket,
  Leaf,
  Calendar,
  Trash2,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PeminjamPortalProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  isOpenCart: boolean;
  onCloseCart: () => void;
  onCartCountChange?: (count: number) => void;
}

export default function PeminjamPortal({
  user,
  onUpdateUser,
  isOpenCart,
  onCloseCart,
  onCartCountChange
}: PeminjamPortalProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"catalog" | "history">("catalog");
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Equipment[]>([]);

  // Update cart count up to parent Navbar whenever it changes
  useEffect(() => {
    onCartCountChange?.(cart.length);
  }, [cart, onCartCountChange]);


  // Cart Dates
  const todayStr = new Date().toISOString().split("T")[0];
  const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const [tglPinjam, setTglPinjam] = useState(todayStr);
  const [tglKembali, setTglKembali] = useState(nextWeekStr);

  // States
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "ok" | "warn" }>({
    show: false,
    msg: "",
    type: "ok"
  });

  // Fetch data
  const loadData = async () => {
    setLoading(true);
    try {
      const eq = await getEquipments();
      const tx = await getTransactions();
      setEquipments(eq);
      // Filter transactions for this user
      setTransactions(tx.filter((t) => t.nimPeminjam === user.nim_nip));

      // Refresh user score from DB
      const userRef = doc(db, "users", user.nim_nip);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        onUpdateUser(userSnap.data() as UserProfile);
      }
    } catch (e) {
      showToast("Gagal memuat data dari server.", "warn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.nim_nip]);

  // Show Toast helper
  const showToast = (msg: string, type: "ok" | "warn" = "ok") => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Gamification properties
  const score = user.greenScore || 0;
  const scoreWidth = Math.min((score / 150) * 100, 100);

  const getTier = (s: number) => {
    if (s >= 100) return { label: "🌳 Ahli", cls: "text-neon", bg: "bg-neon" };
    if (s >= 51) return { label: "🌿 Menengah", cls: "text-yellow-400", bg: "bg-yellow-400" };
    if (s >= 21) return { label: "🌱 Pemula", cls: "text-orange-400", bg: "bg-orange-400" };
    return { label: "🪴 Baru", cls: "text-gray-400", bg: "bg-gray-400" };
  };
  const tier = getTier(score);

  // Notification System: Find any active overdues!
  const overdueLoans = transactions.filter(
    (t) => t.status === "DIPINJAM" && t.tglKembali < todayStr
  );

  const activeLoans = transactions.filter((t) => t.status === "DIPINJAM" && t.tglKembali >= todayStr);
  const pendingLoans = transactions.filter((t) => t.status === "PENDING");

  // Filter Catalog
  const filteredCatalog = equipments.filter((item) => {
    const matchesCategory = selectedCategory === "semua" || item.kategori === selectedCategory;
    const matchesSearch = item.namaAlat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const toggleCart = (item: Equipment) => {
    const exists = cart.some((c) => c.id === item.id);
    if (exists) {
      setCart(cart.filter((c) => c.id !== item.id));
      showToast(`Dihapus dari keranjang.`);
    } else {
      if (item.stokTersedia <= 0) {
        showToast("Stok alat habis, tidak dapat dipinjam.", "warn");
        return;
      }
      setCart([...cart, item]);
      showToast(`${item.namaAlat} ditambahkan 🛒`);
    }
  };

  const submitPeminjaman = async () => {
    if (!cart.length) return;
    if (!tglPinjam || !tglKembali) {
      showToast("Pilih tanggal ambil dan kembali!", "warn");
      return;
    }
    if (tglKembali < tglPinjam) {
      showToast("Tanggal kembali harus setelah tanggal ambil!", "warn");
      return;
    }

    setCheckoutLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of cart) {
      try {
        await createTransaction(item.id, user.nim_nip, tglPinjam, tglKembali);
        successCount++;
      } catch (e: any) {
        failCount++;
        console.error(e);
      }
    }

    setCheckoutLoading(false);
    onCloseCart();
    setCart([]);

    if (successCount > 0) {
      showToast(`Berhasil mengajukan ${successCount} permohonan peminjaman!`, "ok");
    }
    if (failCount > 0) {
      showToast(`Gagal mengajukan ${failCount} permohonan.`, "warn");
    }

    loadData();
    setActiveTab("history");
  };

  return (
    <div className="relative min-h-screen bg-forest/20 text-white">
      {/* Dynamic Toast banner */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border-l-4 ${
              toast.type === "ok" ? "bg-forest/90 border-neon" : "bg-red-950/90 border-red-500"
            }`}
          >
            {toast.type === "ok" ? (
              <CheckCircle2 className="w-5 h-5 text-neon" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <p className="text-sm font-medium">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Slider Drawer */}
      <AnimatePresence>
        {isOpenCart && (
          <motion.div
            key="cart-slider-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
          >
            {/* Backdrop */}
            <div
              onClick={onCloseCart}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer"
            />

            {/* Slider Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 flex flex-col w-full max-w-md h-full bg-[#0a1e11] border-l border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="font-serif text-lg font-bold">Keranjang Peminjaman</h3>
                <button
                  onClick={onCloseCart}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                    <ShoppingBasket className="w-10 h-10 opacity-30" />
                    <p className="text-sm">Keranjang masih kosong</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/2"
                    >
                      <img
                        src={item.urlFoto}
                        alt={item.namaAlat}
                        className="w-12 h-12 object-cover rounded-lg bg-emerald"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=80&q=70";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.namaAlat}</div>
                        <div className="text-xs text-gray-400">{item.id}</div>
                      </div>
                      <button
                        onClick={() => toggleCart(item)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Booking Dates and Submission Form */}
              <div className="p-5 border-t border-white/10 bg-forest/30 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                      Tgl Ambil
                    </label>
                    <div className="relative">
                      <Calendar className="absolute w-4 h-4 text-neon -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
                      <input
                        type="date"
                        value={tglPinjam}
                        min={todayStr}
                        onChange={(e) => setTglPinjam(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 text-xs text-white border outline-none border-white/10 rounded-lg bg-white/5 focus:border-neon/40 focus:ring-1 focus:ring-neon/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                      Tgl Kembali
                    </label>
                    <div className="relative">
                      <Calendar className="absolute w-4 h-4 text-neon -translate-y-1/2 left-3 top-1/2 pointer-events-none" />
                      <input
                        type="date"
                        value={tglKembali}
                        min={tglPinjam}
                        onChange={(e) => setTglKembali(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 text-xs text-white border outline-none border-white/10 rounded-lg bg-white/5 focus:border-neon/40 focus:ring-1 focus:ring-neon/20"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={submitPeminjaman}
                  disabled={cart.length === 0 || checkoutLoading}
                  className="flex items-center justify-center gap-2 w-full h-11 text-sm font-semibold text-forest bg-neon rounded-xl hover:bg-[#00c865] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {checkoutLoading ? (
                    <div className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Ajukan Peminjaman</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Section */}
      <header className="relative py-12 px-5 bg-radial from-[#0c2e19] via-[#091f11] to-transparent overflow-hidden">
        <div className="max-w-5xl mx-auto">
          {/* Real-time Overdue Notification banner */}
          {overdueLoans.length > 0 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col sm:flex-row items-start gap-3.5 p-4 mb-8 rounded-2xl border border-red-500/30 bg-red-950/40 text-red-200 shadow-lg"
            >
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-red-300">⚠ Peringatan: Keterlambatan Pengembalian!</h4>
                <p className="text-xs text-red-200/80 leading-relaxed mt-1">
                  Anda memiliki <strong>{overdueLoans.length} alat</strong> yang melewati batas waktu pengembalian. Setiap keterlambatan akan mengurangi <strong className="text-red-400">Green Score</strong> sebanyak <span className="underline font-bold">-5 poin</span> per alat. Segera kembalikan alat ke laboratorium untuk menghindari pemblokiran peminjaman.
                </p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {overdueLoans.map((ol) => (
                    <span key={ol.id} className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 font-mono">
                      {ol.namaAlat} (Batas: {ol.tglKembali})
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Gamified Green Score Banner */}
          <div className="p-5 border border-white/10 rounded-2xl bg-[#0f381e]/60 backdrop-blur-md shadow-lg mb-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/30 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-neon" />
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest">Peringkat & Skor</div>
                <div className="font-serif text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>Nama: {user.nama}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[200px] flex items-center gap-3">
              <span className={`font-serif text-2xl font-black ${tier.cls}`}>{score}</span>
              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${tier.bg}`}
                  style={{ width: `${scoreWidth}%` }}
                />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md bg-white/5 ${tier.cls}`}>
                {tier.label}
              </span>
            </div>
          </div>

          {/* Main Title Banner */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-4">
            <div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl tracking-tight leading-none text-white">
                Katalog <span className="text-neon italic">Peralatan</span> <br />
                Laboratorium Kehutanan
              </h1>
              <p className="text-gray-400 max-w-md text-sm mt-2 leading-relaxed">
                Pilih perlengkapan praktikum, tentukan tanggal pengambilan, dan ajukan peminjaman dengan responsif.
              </p>
            </div>
            <div className="flex gap-6 mt-2">
              <div className="p-3 border border-white/5 rounded-xl bg-white/2">
                <span className="font-serif text-2xl font-bold text-neon">{equipments.length}</span>
                <span className="text-gray-400 text-xs block">Total Alat</span>
              </div>
              <div className="p-3 border border-white/5 rounded-xl bg-white/2">
                <span className="font-serif text-2xl font-bold text-neon">
                  {equipments.filter((e) => e.stokTersedia > 0).length}
                </span>
                <span className="text-gray-400 text-xs block">Tersedia</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-5 pb-24">
        {/* Navigation Tabs */}
        <div className="flex gap-3 border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "catalog"
                ? "border-neon text-neon"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Sewa Peralatan
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 relative ${
              activeTab === "history"
                ? "border-neon text-neon"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <span>Riwayat Peminjaman</span>
            {pendingLoans.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
              </span>
            )}
          </button>
        </div>

        {activeTab === "catalog" ? (
          <>
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 bg-forest/40 p-3.5 border border-white/5 rounded-xl backdrop-blur-md">
              {/* Category selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {["semua", "Laboratorium", "Elektronika", "Pengukuran", "Navigasi"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex-shrink-0 uppercase ${
                      selectedCategory === cat
                        ? "bg-neon/15 text-neon border border-neon/30"
                        : "bg-white/5 text-gray-400 hover:text-white border border-transparent"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                <input
                  type="text"
                  placeholder="Cari alat praktikum..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-60 h-9 pl-9 pr-4 text-xs text-white border outline-none border-white/10 rounded-lg bg-white/5 focus:border-neon/40 focus:ring-1 focus:ring-neon/20"
                />
              </div>
            </div>

            {/* Grid Catalog */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10" />
                ))}
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                <Search className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm">Tidak ada alat yang cocok ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCatalog.map((item) => {
                  const empty = item.stokTersedia === 0;
                  const inCart = cart.some((c) => c.id === item.id);

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      className="group relative flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-forest/30 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-neon/30 hover:shadow-xl"
                    >
                      {/* Image */}
                      <div className="relative aspect-4/3 overflow-hidden bg-emerald">
                        <img
                          src={item.urlFoto}
                          alt={item.namaAlat}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=70";
                          }}
                        />
                      </div>

                      {/* Info body */}
                      <div className="p-4 flex flex-col flex-1">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-neon/20 bg-neon/5 text-neon mb-2 self-start uppercase">
                          {item.kategori}
                        </span>

                        <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-2 leading-tight flex-1">
                          {item.namaAlat}
                        </h3>

                        <div className="text-[10px] text-gray-400 mt-1 font-mono">{item.id}</div>

                        <div className="flex items-center justify-between mt-3 mb-4">
                          <span className="text-[11px] text-gray-400">Tersedia</span>
                          <span
                            className={`text-xs font-bold ${
                              empty
                                ? "text-red-400"
                                : item.stokTersedia <= 2
                                ? "text-yellow-400"
                                : "text-neon"
                            }`}
                          >
                            {empty ? "Habis" : `${item.stokTersedia} unit`}
                          </span>
                        </div>

                        {/* Add to Cart button */}
                        <button
                          onClick={() => toggleCart(item)}
                          disabled={empty && !inCart}
                          className={`w-full h-9 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                            inCart
                              ? "bg-neon/15 text-neon border border-neon/40 hover:bg-neon/25"
                              : empty
                              ? "bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed"
                              : "bg-neon text-forest hover:bg-[#00c865]"
                          }`}
                        >
                          {inCart ? "✓ Di Keranjang" : empty ? "Stok Habis" : "+ Tambahkan"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Peminjaman History view */
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                <Clock className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm">Anda belum memiliki riwayat peminjaman</p>
              </div>
            ) : (
              transactions.map((t) => {
                const isOverdue = t.status === "DIPINJAM" && t.tglKembali < todayStr;
                return (
                  <div
                    key={t.id}
                    className="p-4 sm:p-5 border border-white/10 rounded-2xl bg-forest/30 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          t.status === "PENDING"
                            ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                            : t.status === "DIPINJAM"
                            ? isOverdue
                              ? "border-red-500/30 bg-red-500/10 text-red-400 animate-pulse"
                              : "border-neon/30 bg-neon/10 text-neon"
                            : t.status === "DIKEMBALIKAN"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                            : "border-gray-500/30 bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {t.status === "PENDING" && <Clock className="w-5 h-5" />}
                        {t.status === "DIPINJAM" && <AlertCircle className="w-5 h-5" />}
                        {t.status === "DIKEMBALIKAN" && <CheckCircle2 className="w-5 h-5" />}
                        {t.status === "DITOLAK" && <AlertCircle className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="font-semibold text-sm sm:text-base text-white">{t.namaAlat}</div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1 font-mono">
                          <span>ID: {t.id}</span>
                          <span>•</span>
                          <span>Alat: {t.idAlat}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-2.5 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5 text-neon" />
                          <span>
                            Ambil: {t.tglPinjam} - Batas Kembali: {t.tglKembali}
                          </span>
                        </div>

                        {t.status === "DIKEMBALIKAN" && (
                          <div className="mt-2 text-xs text-blue-400 flex items-center gap-1.5 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              Dikembalikan pada {t.tglKembaliAktual} dengan kondisi{" "}
                              <strong>{t.kondisiKembali}</strong> • +{t.poinMendapat} Poin Green Score!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right flex flex-col sm:items-end gap-1.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border font-bold self-start sm:self-auto ${
                          t.status === "PENDING"
                            ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                            : t.status === "DIPINJAM"
                            ? isOverdue
                              ? "border-red-500/40 bg-red-500/20 text-red-400 animate-pulse"
                              : "border-neon/30 bg-neon/10 text-neon"
                            : t.status === "DIKEMBALIKAN"
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                            : "border-gray-500/30 bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {t.status === "PENDING" && "Menunggu Persetujuan"}
                        {t.status === "DIPINJAM" && (isOverdue ? "Terlambat Kembali" : "Sedang Dipinjam")}
                        {t.status === "DIKEMBALIKAN" && "Selesai Dikembalikan"}
                        {t.status === "DITOLAK" && "Permohonan Ditolak"}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        Diajukan: {t.createdAt ? new Date(t.createdAt).toLocaleDateString("id-ID") : "-"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}

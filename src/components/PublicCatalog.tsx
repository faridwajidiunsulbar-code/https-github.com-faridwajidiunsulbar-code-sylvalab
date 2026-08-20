import { useState, useEffect } from "react";
import { Equipment, Article, EquipmentCategory, OrgMember } from "../types";
import { getEquipments, getArticles, getOrgMembers } from "../lib/db";
import {
  Search,
  BookOpen,
  Calendar,
  Leaf,
  ShieldCheck,
  Compass,
  MapPin,
  Clock,
  ChevronRight,
  Info,
  Quote,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PublicCatalogProps {
  onGoToLogin: () => void;
  isLoggedIn: boolean;
}

export default function PublicCatalog({ onGoToLogin, isLoggedIn }: PublicCatalogProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [kepalaLab, setKepalaLab] = useState<OrgMember | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const eq = await getEquipments();
        const art = await getArticles();
        setEquipments(eq);
        setArticles(art);
        
        const members = await getOrgMembers();
        const head = members.find(m => m.id === "kepala_lab");
        if (head) {
          setKepalaLab(head);
        }
      } catch (e) {
        console.error("Failed to load public data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter lists
  const filteredCatalog = equipments.filter((item) => {
    const matchesCategory = selectedCategory === "semua" || item.kategori === selectedCategory;
    const matchesSearch = item.namaAlat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#06180c] text-white">
      {/* Hero Welcome banner with Ambient Moving Forest Background */}
      <section className="relative py-20 px-5 text-center overflow-hidden bg-gradient-to-b from-[#041008] via-[#061c0d] to-[#06180c]">
        {/* Moving Forest Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1920&q=80"
            alt="Atmospheric Forest"
            className="w-full h-full object-cover opacity-20 scale-105 animate-kenburns"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#041008]/50 via-transparent to-[#06180c]" />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon/20 bg-neon/5 text-neon text-xs font-semibold uppercase tracking-widest"
          >
            <Leaf className="w-4 h-4" />
            <span>Laboratorium Kehutanan Unsulbar</span>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-serif font-black text-4xl sm:text-5xl md:text-6xl tracking-tight leading-none text-white"
          >
            Efisiensi Inventaris, <br />
            Kemudahan <span className="text-neon italic">Peminjaman</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Portal digital SylvaLab memfasilitasi mahasiswa Jurusan Kehutanan Universitas Sulawesi Barat dalam mengelola peminjaman peralatan praktikum secara modern, real-time, dan transparan.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-2"
          >
            {!isLoggedIn ? (
              <button
                onClick={onGoToLogin}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-neon text-forest hover:bg-[#00c865] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <span>Mulai Pinjam Sekarang</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs text-neon border border-neon/30 bg-neon/10 px-4 py-2 rounded-xl font-mono">
                ✓ Anda sudah masuk. Silakan gunakan tab navigasi di atas!
              </span>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── SAMBUTAN KEPALA LAB (KECE BADAI WELCOME SECTION) ── */}
      {kepalaLab && (
        <section className="max-w-6xl mx-auto px-5 py-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-[#071f10] to-[#041008] p-6 sm:p-8 md:p-10 shadow-2xl"
          >
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-neon/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute top-4 right-4 text-emerald-500/10 pointer-events-none">
              <Quote className="w-40 h-40 transform translate-x-10 -translate-y-10" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 relative z-10">
              
              {/* Photo Frame Container with "Kece Badai" Styling */}
              <div className="flex-shrink-0 relative group">
                {/* Neon Aura Ring */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-neon via-emerald-400 to-green-600 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-500" />
                
                <div className="relative w-48 h-48 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border border-white/20 bg-[#041008] shadow-2xl">
                  <img
                    src={kepalaLab.urlFoto}
                    alt={kepalaLab.nama}
                    className="w-full h-full object-cover grayscale-[10%] hover:grayscale-0 transition-all duration-700 hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Decorative tag overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-center">
                    <span className="text-[9px] font-mono font-bold uppercase text-neon tracking-widest">
                      KEPALA LAB UTAMA
                    </span>
                  </div>
                </div>

                {/* Floating Cert Stamp Badge */}
                <div className="absolute -top-3 -right-3 bg-neon text-forest p-1.5 rounded-xl shadow-lg border border-forest flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              {/* Speech & Profile Text Content */}
              <div className="flex-grow space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SAMBUTAN KEPALA LABORATORIUM KEHUTANAN</span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif font-black text-xl sm:text-2xl text-white tracking-tight">
                    "Mewujudkan Transformasi <span className="text-neon">Praktikum Berbasis Konservasi</span> Presisi Tinggi"
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans italic relative">
                    {kepalaLab.sambutan}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-serif font-bold text-sm sm:text-base text-white">
                      {kepalaLab.nama}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-mono">
                      NIP. 19780512 200501 1 002 · Universitas Sulawesi Barat
                    </p>
                  </div>

                  {/* Quick stats / values */}
                  <div className="flex justify-center md:justify-end gap-3 text-[10px] font-mono text-emerald-400">
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Paperless 100%</span>
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10">SOP Terakreditasi</span>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </section>
      )}

      {/* Jurnal Kanopi / Scientific News */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-neon rounded-full" />
          <h2 className="font-serif text-2xl font-bold text-white">Jurnal Kanopi</h2>
          <span className="text-xs text-gray-500 uppercase tracking-widest font-mono ml-2">Catatan Lapangan & Riset</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-white/5 rounded-2xl bg-white/2">
            Belum ada artikel riset yang dipublikasikan saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.slice(0, 4).map((art) => (
              <div
                key={art.id}
                className="flex flex-col sm:flex-row border border-white/10 rounded-2xl overflow-hidden bg-forest/20 hover:border-white/20 transition-all group"
              >
                {art.urlCover && (
                  <div className="w-full sm:w-44 h-40 sm:h-auto overflow-hidden flex-shrink-0 bg-emerald relative">
                    <img
                      src={art.urlCover}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={art.judul}
                    />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-2 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-neon" />
                      <span>{art.tanggalTerbit}</span>
                    </div>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-white leading-snug mb-1.5">
                      {art.judul}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {art.kontenTeks}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedArticle(art)}
                    className="flex items-center gap-1 text-neon text-xs font-bold hover:underline self-start mt-4 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Baca Selengkapnya</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Equipment Catalog exploration */}
      <section className="max-w-6xl mx-auto px-5 py-12 border-t border-white/10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-neon rounded-full" />
          <h2 className="font-serif text-2xl font-bold text-white">Katalog Inventaris Alat</h2>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6 bg-forest/40 p-3.5 border border-white/5 rounded-xl">
          {/* Category tabs */}
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Cari alat praktikum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-60 h-9 pl-9 pr-4 text-xs text-white border outline-none border-white/10 rounded-lg bg-white/5 focus:border-neon/40"
            />
          </div>
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-white/5 rounded-2xl">
            <p className="text-sm">Tidak ada alat yang cocok dengan filter pencarian</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCatalog.map((item) => {
              const empty = item.stokTersedia === 0;
              return (
                <div
                  key={item.id}
                  className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-[#0a2313]/40 backdrop-blur-sm"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-emerald">
                    <img
                      src={item.urlFoto}
                      alt={item.namaAlat}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=70";
                      }}
                    />
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-neon/20 bg-neon/5 text-neon mb-2 self-start uppercase font-mono">
                      {item.kategori}
                    </span>

                    <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-2 leading-tight flex-1">
                      {item.namaAlat}
                    </h3>

                    <div className="text-[10px] text-gray-500 mt-1 font-mono">{item.id}</div>

                    <div className="flex items-center justify-between mt-3 mb-4">
                      <span className="text-xs text-gray-400">Tersedia</span>
                      <span
                        className={`text-xs font-bold ${
                          empty ? "text-red-400" : "text-neon"
                        }`}
                      >
                        {empty ? "Habis" : `${item.stokTersedia} unit`}
                      </span>
                    </div>

                    <button
                      onClick={onGoToLogin}
                      disabled={empty}
                      className="w-full h-9 rounded-xl text-xs font-bold tracking-wide transition-all bg-neon/10 border border-neon/20 text-neon hover:bg-neon hover:text-forest cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {empty ? "Stok Habis" : "Masuk Untuk Pinjam"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── MODAL: READ FULL ARTICLE ── */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            key="article-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 border border-white/10 rounded-2xl bg-[#0a1e11] shadow-2xl space-y-4 scrollbar-thin"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-serif font-black text-xl text-white leading-tight">
                    {selectedArticle.judul}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 font-mono">
                    <span>Terbit: {selectedArticle.tanggalTerbit}</span>
                    <span>•</span>
                    <span>Penulis: {selectedArticle.author}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-1 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {selectedArticle.urlCover && (
                <img
                  src={selectedArticle.urlCover}
                  alt={selectedArticle.judul}
                  className="w-full h-60 object-cover rounded-xl"
                />
              )}

              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line pt-2 font-sans">
                {selectedArticle.kontenTeks}
              </p>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

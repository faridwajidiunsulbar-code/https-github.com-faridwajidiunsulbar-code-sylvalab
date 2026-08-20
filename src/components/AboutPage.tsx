import { useState, useEffect } from "react";
import { UserProfile } from "../types";
import {
  ArrowLeft,
  Leaf,
  Layers,
  ShieldCheck,
  Award,
  MapPin,
  Users,
  ChevronRight,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";

interface AboutPageProps {
  onBack: () => void;
  user: UserProfile | null;
  onGoToOrg?: () => void;
}

const ALL_SECTIONS = [
  {
    id: "visi",
    name: "Visi & Konservasi",
    subtitle: "Sinergi Lingkungan & Kehutanan 5.0",
    title: "Visi Pelestarian Kehutanan Digital",
    icon: Leaf,
    color: "text-[#00e165]",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    desc: "Laboratorium Kehutanan UPA Lab Terpadu Universitas Sulawesi Barat berkomitmen menjadi pusat riset pelestarian hayati yang didukung oleh pencatatan digital terenkripsi secara transparan melalui portal SylvaLab.",
    points: [
      "Mengurangi emisi karbon melalui administrasi paperless 100% menggunakan pangkalan data digital.",
      "Sertifikasi kelayakan berkala untuk seluruh alat ukur silvikultur & inventarisasi hutan.",
      "Menumbuhkan tanggung jawab mahasiswa melalui insentif poin GreenScore."
    ],
    badge: "UMUM"
  },
  {
    id: "birokrasi",
    name: "Alur Birokrasi & SOP",
    subtitle: "Alur Pengesahan Dokumen Negara",
    title: "SOP Pelaporan Berjenjang Resmi",
    icon: Layers,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    desc: "Setiap laporan inventarisasi harian, bulanan, dan tahunan divalidasi secara bertingkat untuk menjamin akuntabilitas data tanpa manipulasi.",
    points: [
      "Petugas Lapangan: Menyusun draf harian, merekam sirkulasi alat, & mencatat denda fisik.",
      "Kepala Lab Kehutanan: Memeriksa laporan harian/mingguan, menyetujui draf, dan menerbitkan rekomendasi kalibrasi.",
      "Kepala UPA Lab Terpadu: Memvalidasi draf tingkat universitas, mengesahkan laporan akhir, serta mengajukan anggaran perawatan berkala."
    ],
    badge: "KHUSUS STAF"
  },
  {
    id: "audit",
    name: "Standar Kepatuhan Audit",
    subtitle: "Kepatuhan Regulasi BAN-PT & BPK",
    title: "Verifikasi Eksternal Tanpa Kendala",
    icon: ShieldCheck,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    desc: "Sistem SylvaLab secara otomatis memisahkan log teknis mentah dan visualisasi formal, sehingga memudahkan auditor dalam mencocokkan stok fisik vs ketersediaan di rak secara real-time.",
    points: [
      "Tombol Ekspor CSV Sekali Klik: Mempercepat pelaporan inventaris ke tim pemeriksa keuangan.",
      "Pencetakan Berkas Formal KOP Surat Universitas: Sesuai pedoman tata naskah dinas resmi kementerian.",
      "Pelacakan Tanggung Jawab Kerusakan: Riwayat peminjaman terintegrasi dengan database NIM aktif Universitas Sulawesi Barat."
    ],
    badge: "PENGELOLA"
  },
  {
    id: "greenscore",
    name: "Ekosistem GreenScore",
    subtitle: "Sistem Disiplin & Reputasi Mahasiswa",
    title: "Poin Kehormatan & Tanggung Jawab",
    icon: Award,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    desc: "Aturan gamifikasi inovatif di mana mahasiswa didorong untuk memiliki kepedulian tinggi terhadap alat laboratorium yang dipinjam demi menjaga usia pakai peralatan.",
    points: [
      "Poin Default: Setiap mahasiswa yang mendaftar diberikan 100 Poin Kehormatan (GreenScore).",
      "Insentif (+): Pengembalian alat tepat waktu dan dalam kondisi bersih menambah poin reputasi.",
      "Disiplin (-): Kerusakan atau keterlambatan memotong skor secara otomatis. Jika di bawah 70 poin, akses peminjaman dibekukan."
    ],
    badge: "PEMINJAM"
  },
  {
    id: "kontak",
    name: "Kontak & Layanan",
    subtitle: "Jam Kerja & Pusat Informasi Resmi",
    title: "Pusat Layanan Laboratorium Terpadu",
    icon: MapPin,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
    desc: "Kami menyambut baik kunjungan praktikum riset dari instansi luar, sekolah mitra, maupun mahasiswa lintas fakultas.",
    points: [
      "Alamat: Gedung UPA Laboratorium Terpadu Lantai 2, Kampus Unsulbar Padang-Padang, Majene, Sulawesi Barat.",
      "Jam Operasional: Senin - Jumat (08:00 - 16:00 WITA).",
      "Email Resmi: lab-kehutanan@unsulbar.ac.id · Telp: +62 812-3456-7890"
    ],
    badge: "UMUM"
  }
];

export default function AboutPage({ onBack, user, onGoToOrg }: AboutPageProps) {
  const [activeTab, setActiveTab] = useState("visi");

  // Filter sections based on user role
  const isSectionVisible = (id: string, role: string | undefined): boolean => {
    if (!role) return ["visi", "kontak"].includes(id);
    if (role === "SUPER_ADMIN") return true;
    switch (id) {
      case "visi":
        return true;
      case "birokrasi":
        return ["PETUGAS_LAB", "KEPALA_LAB_KEHUTANAN", "KEPALA_UPA_LAB_TERPADU"].includes(role);
      case "audit":
        return ["KEPALA_LAB_KEHUTANAN", "KEPALA_UPA_LAB_TERPADU"].includes(role);
      case "greenscore":
        return ["PEMINJAM", "PETUGAS_LAB", "KEPALA_LAB_KEHUTANAN"].includes(role);
      case "kontak":
        return true;
      default:
        return true;
    }
  };

  const visibleSections = ALL_SECTIONS.filter((s) => isSectionVisible(s.id, user?.role));

  // Auto-set first visible section if current becomes hidden
  useEffect(() => {
    if (visibleSections.length > 0) {
      const isCurrentVisible = visibleSections.some((s) => s.id === activeTab);
      if (!isCurrentVisible) {
        setActiveTab(visibleSections[0].id);
      }
    }
  }, [user, visibleSections, activeTab]);

  const activeData = visibleSections.find((s) => s.id === activeTab) || visibleSections[0] || ALL_SECTIONS[0];
  const ActiveIcon = activeData.icon;

  return (
    <div className="min-h-screen bg-[#041008] text-white py-12 px-5">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back and Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neon border border-neon/20 bg-neon/5 rounded-xl hover:bg-neon hover:text-forest transition-all self-start cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Portal</span>
          </button>
          
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            Panduan Mutu · SOP SylvaLab Terpadu
          </span>
        </div>

        {/* Hero Header Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
            Panduan & <span className="text-neon italic">SOP Resmi</span> SylvaLab
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Eksplorasi transparansi birokrasi, kelayakan standar audit nasional, dan regulasi konservasi digital terpadu Universitas Sulawesi Barat.
          </p>
        </div>

        {/* Main Content Split Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative mt-6">
          
          {/* LEFT PANEL: Interactive Navigation Menu (4 Columns) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase block mb-1">
              Daftar Topik Panduan ({visibleSections.length})
            </span>
            
            <div className="space-y-2">
              {visibleSections.map((sec) => {
                const isSelected = activeTab === sec.id;
                const SecIcon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? "bg-[#0a2312] border-neon text-white shadow-lg shadow-neon/5"
                        : "bg-white/2 border-white/5 text-gray-400 hover:text-white hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2 rounded-xl transition-colors ${isSelected ? "bg-neon/10" : "bg-white/5"}`}>
                        <SecIcon className={`w-5 h-5 ${sec.color}`} />
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-sm leading-tight text-white group-hover:text-neon transition-colors">
                          {sec.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{sec.subtitle}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-white/5 rounded text-gray-500 uppercase">
                        {sec.badge}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-neon translate-x-1" : "text-gray-600 group-hover:text-gray-400"}`} />
                    </div>
                  </button>
                );
              })}

              {/* Direct Link to Org Structure Page */}
              {onGoToOrg && (
                <button
                  onClick={onGoToOrg}
                  className="w-full text-left p-4 rounded-2xl border bg-gradient-to-r from-[#0d1711] to-[#050e09] border-emerald-500/20 hover:border-neon text-gray-300 hover:text-white transition-all cursor-pointer flex items-center justify-between group mt-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2 rounded-xl bg-neon/10">
                      <Users className="w-5 h-5 text-neon" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm leading-tight text-white">Struktur Organisasi</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Bagan Kepemimpinan & Anggota</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 bg-neon/10 border border-neon/20 rounded text-neon uppercase">Bagan</span>
                    <ChevronRight className="w-4 h-4 text-neon group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )}
            </div>

            <div className="p-4 bg-white/2 border border-white/5 rounded-2xl text-[11px] text-gray-400 leading-relaxed font-mono">
              💡 <span className="text-neon font-bold">Informasi Akses:</span> Sistem menyembunyikan beberapa panduan audit internal secara otomatis apabila Anda tidak masuk menggunakan akun pengelola terdaftar.
            </div>
          </div>

          {/* RIGHT PANEL: Detailed Document Content (8 Columns) */}
          <div className="lg:col-span-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-[#061e0f] to-[#041008] border border-white/10 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-[80px] pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl bg-white/5 border border-white/10`}>
                    <ActiveIcon className={`w-6 h-6 ${activeData.color}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neon font-bold">
                      {activeData.subtitle}
                    </span>
                    <h2 className="font-serif font-black text-xl sm:text-2xl text-white">
                      {activeData.title}
                    </h2>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-neon/10 border border-neon/30 text-neon text-[10px] font-mono tracking-wider font-bold uppercase self-start sm:self-auto">
                  {activeData.badge}
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
                  {activeData.desc}
                </p>

                <div className="space-y-3 mt-4">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold">
                    Poin & Ketentuan Utama Dokumen:
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {activeData.points.map((point, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-white/2 border border-white/5 rounded-2xl text-xs sm:text-sm text-gray-300 leading-relaxed"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center font-mono text-[10px] font-bold text-neon mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-xs sm:text-sm">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Decorative footer stamp */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-neon" />
                  <span>SOP Terakreditasi BAN-PT & BPK</span>
                </div>
                <span>Dokumen Resmi SylvaLab v2.4</span>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}

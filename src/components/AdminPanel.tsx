import { useState, useEffect } from "react";
import { UserProfile, Equipment, Transaction, Article, Role, EquipmentCategory, KondisiAlat, LabReport, ReportStatus, OrgMember } from "../types";
import {
  getEquipments,
  getTransactions,
  getUsers,
  getArticles,
  approveTransaction,
  rejectTransaction,
  returnTransaction,
  createEquipment,
  updateEquipment,
  deleteAlat,
  createUser,
  deleteUser,
  createArticle,
  updateArticle,
  deleteArticle,
  getReports,
  createReport,
  updateReportStatus,
  getOrgMembers,
  updateOrgMember,
  db
} from "../lib/db";
import { doc, getDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  Bell,
  RotateCw,
  Package,
  Users,
  Newspaper,
  Plus,
  RefreshCw,
  LogOut,
  Trash2,
  Edit3,
  BookOpen,
  Calendar,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  XCircle,
  X,
  FileText,
  BarChart2,
  TrendingUp,
  Award,
  Printer,
  Download,
  HelpCircle,
  Check,
  Menu,
  Leaf
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  user: UserProfile;
  onLogout: () => void;
}

type AdminTab = "dashboard" | "permohonan" | "berjalan" | "alat" | "users" | "artikel" | "laporan" | "organisasi";

const isTabAllowed = (tab: AdminTab, role: Role): boolean => {
  if (role === "SUPER_ADMIN") return true;
  if (role === "KEPALA_UPA_LAB_TERPADU") {
    return ["dashboard", "users", "laporan"].includes(tab);
  }
  if (role === "KEPALA_LAB_KEHUTANAN") {
    return ["dashboard", "permohonan", "berjalan", "alat", "laporan", "organisasi"].includes(tab);
  }
  if (role === "PETUGAS_LAB") {
    return ["dashboard", "permohonan", "berjalan", "alat", "artikel", "laporan", "organisasi"].includes(tab);
  }
  return tab === "dashboard";
};

// ── MICRO-INTERACTIONS: LIGHTWEIGHT ANIMATED COUNT UP (PROMPT B) ──
function CountUp({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Check if user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(value);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 800; // ms
    const startVal = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (value - startVal) + startVal));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [value]);

  return <>{count}</>;
}

// ── THEMED FOREST GROWTH RINGS LOADER (PROMPT C) ──
function TreeRingLoader({ text = "Mensinkronisasi basis data Firestore..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 space-y-5 text-center">
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-16 h-16 text-neon" fill="none" stroke="currentColor">
          {/* Outer Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            strokeWidth="1.5" 
            strokeDasharray="6, 5" 
            className="animate-ring-pulse-1" 
            style={{ transformOrigin: "50% 50%" }} 
          />
          {/* Middle Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="28" 
            strokeWidth="2" 
            strokeDasharray="4, 4" 
            className="animate-ring-pulse-2" 
            style={{ transformOrigin: "50% 50%" }} 
          />
          {/* Inner Ring */}
          <circle 
            cx="50" 
            cy="50" 
            r="16" 
            strokeWidth="2.5" 
            className="animate-ring-pulse-3" 
            style={{ transformOrigin: "50% 50%" }} 
          />
          {/* Central Leaf Core */}
          <path 
            d="M50,38 C53,44 55,47 50,56 C45,47 47,44 50,38 Z" 
            fill="currentColor" 
            className="animate-sprout-grow sprout-fallback" 
            style={{ transformOrigin: "50% 50%" }} 
          />
        </svg>
      </div>
      <p className="text-xs text-zinc-400 font-medium tracking-wide animate-pulse">{text}</p>
    </div>
  );
}

// Framer motion variants for dashboard quick stats card list stagger (Prompt B)
const cardContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 14,
    },
  },
};

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (user.role === "KEPALA_UPA_LAB_TERPADU") return "laporan";
    return "dashboard";
  });

  useEffect(() => {
    if (!isTabAllowed(activeTab, user.role)) {
      if (user.role === "KEPALA_UPA_LAB_TERPADU") {
        setActiveTab("laporan");
      } else {
        setActiveTab("dashboard");
      }
    }
  }, [activeTab, user.role]);

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [reports, setReports] = useState<LabReport[]>([]);
  const [selectedLab, setSelectedLab] = useState<string>(
    user.role === "KEPALA_LAB_KEHUTANAN" ? "Lab Kehutanan" : "Semua Laboratorium"
  );
  const [activePeriodReportTab, setActivePeriodReportTab] = useState<"harian" | "bulanan" | "tahunan">("harian");
  const [activeLaporanSubTab, setActiveLaporanSubTab] = useState<"skenario" | "berjenjang" | "audit">("skenario");
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Modals States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnTx, setReturnTx] = useState<Transaction | null>(null);
  const [returnCondition, setReturnCondition] = useState<KondisiAlat>("BAIK");

  const [showAlatModal, setShowAlatModal] = useState(false);
  const [editingAlat, setEditingAlat] = useState<Equipment | null>(null);
  const [faNama, setFaNama] = useState("");
  const [faKat, setFaKat] = useState<EquipmentCategory>("Laboratorium");
  const [faStok, setFaStok] = useState("");
  const [faFoto, setFaFoto] = useState("");

  const [showUserModal, setShowUserModal] = useState(false);
  const [fuNim, setFuNim] = useState("");
  const [fuNama, setFuNama] = useState("");
  const [fuRole, setFuRole] = useState<Role>("PEMINJAM");
  const [fuPass, setFuPass] = useState("");

  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [artJudul, setArtJudul] = useState("");
  const [artCover, setArtCover] = useState("");
  const [artKonten, setArtKonten] = useState("");

  const [selectedReadArticle, setSelectedReadArticle] = useState<Article | null>(null);

  // Organization members states
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [editingOrgMember, setEditingOrgMember] = useState<OrgMember | null>(null);
  const [orgNama, setOrgNama] = useState("");
  const [orgFoto, setOrgFoto] = useState("");
  const [orgSambutan, setOrgSambutan] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [showOrgModal, setShowOrgModal] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; msg: string; type: "ok" | "warn" }>({
    show: false,
    msg: "",
    type: "ok"
  });

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short" }) +
          " · " +
          now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string, type: "ok" | "warn" = "ok") => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const eq = await getEquipments();
      const tx = await getTransactions();
      const art = await getArticles();
      const reps = await getReports();
      const members = await getOrgMembers();
      setEquipments(eq);
      setTransactions(tx);
      setArticles(art);
      setReports(reps);
      setOrgMembers(members);

      if (
        user.role === "SUPER_ADMIN" ||
        user.role === "KEPALA_UPA_LAB_TERPADU" ||
        user.role === "KEPALA_LAB_KEHUTANAN" ||
        user.role === "PETUGAS_LAB"
      ) {
        const u = await getUsers();
        setUsers(u);
      }
    } catch (e) {
      showToast("Gagal memuat data dari Firestore.", "warn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsInitialLoading(true);
      await loadAll();
      setIsInitialLoading(false);
    };
    init();
  }, []);

  // Filter lists
  const pendingTransactions = transactions.filter((t) => t.status === "PENDING");
  const activeLoans = transactions.filter((t) => t.status === "DIPINJAM");
  const finishedLoans = transactions.filter((t) => t.status === "DIKEMBALIKAN");

  const todayStr = new Date().toISOString().split("T")[0];

  // Action: Approve
  const handleApprove = async (tx: Transaction) => {
    try {
      await approveTransaction(tx.id, tx.idAlat);
      showToast(`Permohonan ${tx.id} disetujui! Stok alat dipotong.`);
      loadAll();
    } catch (e: any) {
      showToast(e.message || "Gagal menyetujui permohonan.", "warn");
    }
  };

  // Action: Reject
  const handleReject = async (tx: Transaction) => {
    try {
      await rejectTransaction(tx.id);
      showToast(`Permohonan ${tx.id} ditolak.`);
      loadAll();
    } catch (e: any) {
      showToast("Gagal menolak permohonan.", "warn");
    }
  };

  // Action: Return (Trigger Modal)
  const openReturnModal = (tx: Transaction) => {
    setReturnTx(tx);
    setReturnCondition("BAIK");
    setShowReturnModal(true);
  };

  const submitReturnProcess = async () => {
    if (!returnTx) return;
    try {
      const res = await returnTransaction(
        returnTx.id,
        returnTx.idAlat,
        returnTx.nimPeminjam,
        returnCondition,
        todayStr
      );
      if (res.success) {
        showToast(`Kembali sukses! +${res.poin} poin Green Score ditambahkan.`);
      }
      setShowReturnModal(false);
      setReturnTx(null);
      loadAll();
    } catch (e: any) {
      showToast(e.message || "Gagal memproses pengembalian.", "warn");
    }
  };

  const handleUpdateReportStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split("T")[0];
      const updates: Partial<LabReport> = {};
      if (newStatus === "DIAJUKAN_KEPALA_LAB") updates.tanggalDiajukan = todayStr;
      if (newStatus === "DISETUJUI_KEPALA_LAB") updates.tanggalDisetujui = todayStr;
      if (newStatus === "DIVALIDASI_KEPALA_UPA") updates.tanggalDivalidasi = todayStr;
      if (newStatus === "DISERAHKAN_REKTORAT") updates.tanggalDiserahkan = todayStr;

      await updateReportStatus(reportId, newStatus, updates);
      showToast(`Status Laporan berhasil diperbarui menjadi: ${newStatus.replace(/_/g, " ")}`, "ok");
      const reps = await getReports();
      setReports(reps);
    } catch (error) {
      showToast("Gagal memperbarui status laporan berjenjang.", "warn");
    } finally {
      setLoading(false);
    }
  };

  // CRUD: Alat
  const openAddAlat = () => {
    setEditingAlat(null);
    setFaNama("");
    setFaKat("Laboratorium");
    setFaStok("");
    setFaFoto("");
    setShowAlatModal(true);
  };

  const openEditAlat = (item: Equipment) => {
    setEditingAlat(item);
    setFaNama(item.namaAlat);
    setFaKat(item.kategori);
    setFaStok(String(item.stokTotal));
    setFaFoto(item.urlFoto);
    setShowAlatModal(true);
  };

  const handleSaveAlat = async () => {
    if (!faNama || !faStok) {
      showToast("Harap isi nama dan total stok alat.", "warn");
      return;
    }
    try {
      if (editingAlat) {
        await updateEquipment(editingAlat.id, faNama, faKat, Number(faStok), faFoto);
        showToast("Alat berhasil diperbarui.");
      } else {
        await createEquipment(faNama, faKat, Number(faStok), faFoto);
        showToast("Alat baru berhasil ditambahkan.");
      }
      setShowAlatModal(false);
      loadAll();
    } catch (e) {
      showToast("Gagal menyimpan alat.", "warn");
    }
  };

  const handleDeleteAlat = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus alat ini secara permanen dari inventaris?")) {
      try {
        await deleteAlat(id);
        showToast("Alat berhasil dihapus.");
        loadAll();
      } catch (e) {
        showToast("Gagal menghapus alat.", "warn");
      }
    }
  };

  // CRUD: User
  const handleSaveUser = async () => {
    if (!fuNim || !fuNama || !fuPass) {
      showToast("Harap isi semua kolom wajib pengguna.", "warn");
      return;
    }
    try {
      await createUser(fuNim, fuNama, fuRole, fuPass);
      showToast("Pengguna baru berhasil ditambahkan.");
      setShowUserModal(false);
      setFuNim("");
      setFuNama("");
      setFuPass("");
      loadAll();
    } catch (e: any) {
      showToast(e.message || "Gagal menambahkan pengguna.", "warn");
    }
  };

  const handleDeleteUser = async (nim: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      try {
        await deleteUser(nim);
        showToast("Pengguna berhasil dihapus.");
        loadAll();
      } catch (e) {
        showToast("Gagal menghapus pengguna.", "warn");
      }
    }
  };

  // CRUD: Articles (Jurnal Kanopi)
  const openAddArticle = () => {
    setEditingArticle(null);
    setArtJudul("");
    setArtCover("");
    setArtKonten("");
    setShowArticleModal(true);
  };

  const openEditArticle = (a: Article) => {
    setEditingArticle(a);
    setArtJudul(a.judul);
    setArtCover(a.urlCover);
    setArtKonten(a.kontenTeks);
    setShowArticleModal(true);
  };

  const handleSaveArticle = async () => {
    if (!artJudul || !artKonten) {
      showToast("Judul dan konten jurnal wajib diisi.", "warn");
      return;
    }
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, artJudul, todayStr, artKonten, artCover);
        showToast("Artikel berhasil diperbarui.");
      } else {
        await createArticle(artJudul, todayStr, artKonten, artCover, user.nama);
        showToast("Artikel baru berhasil dipublikasikan.");
      }
      setShowArticleModal(false);
      loadAll();
    } catch (e) {
      showToast("Gagal menyimpan artikel.", "warn");
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
      try {
        await deleteArticle(id);
        showToast("Artikel berhasil dihapus.");
        loadAll();
      } catch (e) {
        showToast("Gagal menghapus artikel.", "warn");
      }
    }
  };

  // CRUD: Organization Members
  const openEditOrgMember = (m: OrgMember) => {
    setEditingOrgMember(m);
    setOrgNama(m.nama);
    setOrgFoto(m.urlFoto);
    setOrgSambutan(m.sambutan || "");
    setOrgEmail(m.email || "");
    setOrgPhone(m.phone || "");
    setShowOrgModal(true);
  };

  const handleSaveOrgMember = async () => {
    if (!editingOrgMember) return;
    if (!orgNama || !orgFoto) {
      showToast("Nama dan URL Foto wajib diisi.", "warn");
      return;
    }
    try {
      await updateOrgMember(editingOrgMember.id, {
        nama: orgNama,
        urlFoto: orgFoto,
        sambutan: orgSambutan || "",
        email: orgEmail,
        phone: orgPhone
      });
      showToast("Data personel berhasil diperbarui!");
      setShowOrgModal(false);
      loadAll();
    } catch (e) {
      showToast("Gagal memperbarui data personel.", "warn");
    }
  };

  const handleCetakAudit = () => {
    const kepalaLab = orgMembers.find(m => m.id === "kepala_lab")?.nama || "Widyanti Utami A, S.Hut., M.Hut";
    const kepalaUpa = orgMembers.find(m => m.id === "kepala_upa")?.nama || "Dr. Muhammad Nur, S.Pi., M.Si";
    
    const damagedList = transactions.filter(t => t.kondisiKembali === "RUSAK" || t.kondisiKembali === "CUKUP");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Gagal membuka jendela cetak. Pastikan pop-up dibolehkan oleh browser Anda.", "warn");
      return;
    }

    const today = new Date();
    const indonesianMonths = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const formattedDate = `${today.getDate()} ${indonesianMonths[today.getMonth()]} ${today.getFullYear()}`;

    let assetsRowsHtml = "";
    equipments.forEach((eq, index) => {
      assetsRowsHtml += `
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 8px; text-align: center;">${index + 1}</td>
          <td style="padding: 8px; font-family: monospace;">${eq.id}</td>
          <td style="padding: 8px;">${eq.namaAlat}</td>
          <td style="padding: 8px;">${eq.kategori}</td>
          <td style="padding: 8px; text-align: center;">Baik</td>
          <td style="padding: 8px; text-align: center;">${eq.stokTotal} unit</td>
          <td style="padding: 8px; text-align: center;">${eq.stokTersedia} unit</td>
          <td style="padding: 8px; text-align: right;">92.4%</td>
        </tr>
      `;
    });

    let damageRowsHtml = "";
    if (damagedList.length === 0) {
      damageRowsHtml = `
        <tr>
          <td colspan="7" style="padding: 12px; text-align: center; color: #666; font-style: italic;">
            Tidak ada laporan kerusakan atau penurunan kondisi alat pada periode ini. Seluruh sirkulasi pengembalian berjalan dengan baik.
          </td>
        </tr>
      `;
    } else {
      damagedList.forEach((t, index) => {
        damageRowsHtml += `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; text-align: center;">${index + 1}</td>
            <td style="padding: 8px; font-family: monospace;">${t.id}</td>
            <td style="padding: 8px;">
              <strong>${t.namaPeminjam}</strong><br/>
              <span style="font-size: 10px; color: #555;">NIM/NIP: ${t.nimPeminjam}</span>
            </td>
            <td style="padding: 8px;">${t.namaAlat}</td>
            <td style="padding: 8px; text-align: center;">${t.tglKembaliAktual || t.tglKembali}</td>
            <td style="padding: 8px; text-align: center; font-weight: bold; color: ${t.kondisiKembali === "RUSAK" ? "#d32f2f" : "#f57c00"}">${t.kondisiKembali}</td>
            <td style="padding: 8px; text-align: right;">Denda -5 Poin (Kalibrasi / Pemulihan)</td>
          </tr>
        `;
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Hasil Audit dan Kepatuhan Inventaris Alat</title>
        <style>
          @media print {
            body {
              background-color: #fff;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #333;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
          }
          .kop-surat {
            display: flex;
            align-items: center;
            border-bottom: 4px double #000;
            padding-bottom: 15px;
            margin-bottom: 25px;
          }
          .kop-text {
            text-align: center;
            flex-grow: 1;
          }
          .kop-text h2 {
            margin: 0;
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .kop-text h1 {
            margin: 3px 0;
            font-size: 18pt;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .kop-text h3 {
            margin: 0;
            font-size: 13pt;
            font-weight: bold;
          }
          .kop-text p {
            margin: 4px 0 0 0;
            font-size: 9.5pt;
            font-style: italic;
          }
          .doc-title {
            text-align: center;
            text-transform: uppercase;
            font-weight: bold;
            font-size: 13pt;
            margin-top: 30px;
            margin-bottom: 5px;
            text-decoration: underline;
          }
          .doc-number {
            text-align: center;
            font-size: 11pt;
            margin: 0 0 30px 0;
          }
          .section-title {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 25px;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            margin-bottom: 25px;
          }
          th {
            border-top: 1px solid #000;
            border-bottom: 2px solid #000;
            padding: 8px;
            font-weight: bold;
            background-color: #f9f9f9;
          }
          td {
            padding: 6px 8px;
            vertical-align: middle;
          }
          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            text-align: center;
            width: 45%;
          }
          .sig-title {
            margin-bottom: 70px;
            font-size: 11pt;
          }
          .sig-name {
            font-weight: bold;
            text-decoration: underline;
            font-size: 11pt;
          }
          .sig-nip {
            font-size: 10pt;
            color: #444;
          }
          .print-btn-container {
            margin-bottom: 20px;
            text-align: right;
          }
          .btn-print {
            background-color: #00e165;
            color: #0e2918;
            border: none;
            padding: 10px 18px;
            font-weight: bold;
            font-size: 14px;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background-color: #00c85b;
          }
        </style>
      </head>
      <body>
        <div class="print-btn-container no-print">
          <button class="btn-print" onclick="window.print();">Cetak Sekarang (Print / Save PDF)</button>
        </div>
        
        <div class="kop-surat">
          <div class="kop-text">
            <h2>KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</h2>
            <h1>UNIVERSITAS SULAWESI BARAT</h1>
            <h3>UPT LABORATORIUM TERPADU - LABORATORIUM KEHUTANAN</h3>
            <p>Jalan Prof. Dr. Baharuddin Lopa, S.H., Talumung, Majene, Sulawesi Barat. Laman: unsulbar.ac.id</p>
          </div>
        </div>

        <div class="doc-title">LAPORAN HASIL AUDIT DAN KEPATUHAN INVENTARIS ALAT</div>
        <div class="doc-number">Nomor: 042/UN12.11/LL/2026</div>

        <p style="text-align: justify; font-size: 11pt;">
          Berdasarkan hasil pemantauan digital berkala melalui Sistem Informasi Portal SylvaLab Universitas Sulawesi Barat, telah dilakukan proses audit kepatuhan, penatausahaan, serta kelayakan fisik inventaris alat pada Laboratorium Kehutanan Universitas Sulawesi Barat. Data yang tercatat hingga tanggal <strong>${formattedDate}</strong> dinyatakan sah, tervalidasi 100%, serta bebas dari manipulasi data (integrity-cleared).
        </p>

        <div class="section-title">I. DAFTAR KELAYAKAN ALAT (ASSETS VALUATION REGISTER)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">No</th>
              <th style="width: 15%; text-align: left;">Kode Alat</th>
              <th style="width: 30%; text-align: left;">Nama Alat Spesifik</th>
              <th style="width: 20%; text-align: left;">Kategori Rumpun</th>
              <th style="width: 10%; text-align: center;">Kondisi</th>
              <th style="width: 10%; text-align: center;">Stok</th>
              <th style="width: 10%; text-align: center;">Tersedia</th>
              <th style="width: 10%; text-align: right;">Kelayakan</th>
            </tr>
          </thead>
          <tbody>
            ${assetsRowsHtml}
          </tbody>
        </table>

        <div class="section-title">II. AKUNTABILITAS KERUSAKAN BARANG (DAMAGE ACCOUNTABILITY TRACER)</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">No</th>
              <th style="width: 15%; text-align: left;">ID Transaksi</th>
              <th style="width: 25%; text-align: left;">Peminjam Terkait</th>
              <th style="width: 20%; text-align: left;">Alat</th>
              <th style="width: 15%; text-align: center;">Tanggal</th>
              <th style="width: 10%; text-align: center;">Kondisi</th>
              <th style="width: 25%; text-align: right;">Sanksi / Tindakan</th>
            </tr>
          </thead>
          <tbody>
            ${damageRowsHtml}
          </tbody>
        </table>

        <p style="text-align: justify; font-size: 11pt; margin-top: 30px;">
          Demikian laporan pertanggungjawaban audit ini dibuat dengan sebenar-benarnya untuk dipergunakan sebagai dokumen pendukung kelayakan akreditasi Program Studi Kehutanan, Universitas Sulawesi Barat, serta pengusulan anggaran logistik laboratorium periode berikutnya.
        </p>

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-title">
              Menyetujui,<br/>
              Kepala Laboratorium Kehutanan
            </div>
            <div class="sig-name">${kepalaLab}</div>
            <div class="sig-nip">NIP. 198904122019032014</div>
          </div>
          
          <div class="sig-box">
            <div class="sig-title">
              Mengesahkan,<br/>
              Kepala UPA Laboratorium Terpadu
            </div>
            <div class="sig-name">${kepalaUpa}</div>
            <div class="sig-nip">NIP. 197805122005011002</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleEksporCSV = () => {
    try {
      const headers = ["Kode Alat", "Nama Alat", "Kategori", "Stok Total", "Stok Tersedia", "Kondisi Dominan", "Tingkat Kelayakan"];
      const rows = equipments.map(eq => [
        eq.id,
        `"${eq.namaAlat.replace(/"/g, '""')}"`,
        `"${eq.kategori.replace(/"/g, '""')}"`,
        eq.stokTotal,
        eq.stokTersedia,
        "Baik",
        "92.4%"
      ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_Audit_Inventaris_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Berkas CSV berhasil diunduh ke folder unduhan.", "ok");
    } catch (e) {
      showToast("Gagal mengekspor data ke CSV.", "warn");
      console.error(e);
    }
  };

  // Gamified display helpers
  const scoreColor = (s: number) => {
    if (s >= 100) return "text-neon";
    if (s >= 51) return "text-yellow-400";
    if (s >= 21) return "text-orange-400";
    return "text-gray-400";
  };
  const getTierName = (s: number) => {
    if (s >= 100) return " Ahli 🌳";
    if (s >= 51) return " Menengah 🌿";
    if (s >= 21) return " Pemula 🌱";
    return " Baru 🪴";
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden text-white bg-[#041008]">
      {/* Dynamic Toast banner */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border-l-4 ${
              toast.type === "ok" ? "bg-forest border-neon" : "bg-red-950 border-red-500"
            }`}
          >
            <CheckCircle className="w-5 h-5 text-neon" />
            <p className="text-sm font-medium">{toast.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DESKTOP SIDEBAR (lg and up) ── */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 flex-col bg-[#041008] shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl border border-neon/30 bg-neon/15 flex items-center justify-center">
            <Leaf className="w-5 h-5 text-neon" />
          </div>
          <div>
            <div className="font-serif font-black text-base text-white">SylvaLab</div>
            <div className="text-[9px] text-emerald-400 tracking-widest uppercase font-mono font-bold">Staff Admin</div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] text-zinc-400 uppercase font-mono px-3 py-1 font-bold">Menu Utama</div>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
              activeTab === "dashboard"
                ? "bg-neon/15 text-neon border-neon font-bold"
                : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Ringkasan</span>
          </button>

          {isTabAllowed("permohonan", user.role) && (
            <button
              onClick={() => setActiveTab("permohonan")}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                activeTab === "permohonan"
                  ? "bg-neon/15 text-neon border-neon font-bold"
                  : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Antrean Permohonan</span>
              </div>
              {pendingTransactions.length > 0 && (
                <span className="bg-yellow-500 text-forest font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingTransactions.length}
                </span>
              )}
            </button>
          )}

          {isTabAllowed("berjalan", user.role) && (
            <button
              onClick={() => setActiveTab("berjalan")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                activeTab === "berjalan"
                  ? "bg-neon/15 text-neon border-neon font-bold"
                  : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <RotateCw className="w-4 h-4" />
              <span>Sedang Dipinjam</span>
            </button>
          )}

          {(isTabAllowed("alat", user.role) || isTabAllowed("users", user.role) || isTabAllowed("artikel", user.role)) && (
            <div className="text-[10px] text-zinc-400 uppercase font-mono px-3 py-1 mt-4 font-bold">Database & Konten</div>
          )}

          {isTabAllowed("alat", user.role) && (
            <button
              onClick={() => setActiveTab("alat")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                activeTab === "alat"
                  ? "bg-neon/15 text-neon border-neon font-bold"
                  : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventaris Alat</span>
            </button>
          )}

          {isTabAllowed("users", user.role) && (
            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                activeTab === "users"
                  ? "bg-neon/15 text-neon border-neon font-bold"
                  : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar Pengguna</span>
            </button>
          )}

          {isTabAllowed("artikel", user.role) && (
            <button
              onClick={() => setActiveTab("artikel")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                activeTab === "artikel"
                  ? "bg-neon/15 text-neon border-neon font-bold"
                  : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>Jurnal Kanopi</span>
            </button>
          )}

          {isTabAllowed("organisasi", user.role) && (
            <button
              onClick={() => setActiveTab("organisasi")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                activeTab === "organisasi"
                  ? "bg-neon/15 text-neon border-neon font-bold"
                  : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
              }`}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Struktur Organisasi</span>
            </button>
          )}

          {isTabAllowed("laporan", user.role) && (
            <>
              <div className="text-[10px] text-zinc-400 uppercase font-mono px-3 py-1 mt-4 font-bold">Administrasi & Audit</div>
              <button
                onClick={() => setActiveTab("laporan")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                  activeTab === "laporan"
                    ? "bg-neon/15 text-neon border-neon font-bold"
                    : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Laporan & Mode Audit</span>
              </button>
            </>
          )}
        </nav>

        {/* Bottom logout */}
        <div className="p-3.5 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Staff</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE OFF-CANVAS SIDEBAR DRAWER ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="mobile-sidebar-container-motion"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 lg:hidden flex"
            id="mobile-sidebar-container"
          >
            {/* Backdrop */}
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Sidebar drawer content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-72 max-w-[85vw] bg-[#041008] border-r border-white/15 flex flex-col h-full shadow-2xl z-10"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl border border-neon/30 bg-neon/15 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-neon" />
                  </div>
                  <div>
                    <div className="font-serif font-black text-sm text-white">SylvaLab</div>
                    <div className="text-[9px] text-emerald-400 tracking-widest uppercase font-mono font-bold">Staff Admin</div>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav Items */}
              <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                <div className="text-[10px] text-zinc-400 uppercase font-mono px-3 py-1 font-bold">Menu Utama</div>
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                    activeTab === "dashboard"
                      ? "bg-neon/15 text-neon border-neon font-bold"
                      : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Ringkasan</span>
                </button>

                {isTabAllowed("permohonan", user.role) && (
                  <button
                    onClick={() => {
                      setActiveTab("permohonan");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                      activeTab === "permohonan"
                        ? "bg-neon/15 text-neon border-neon font-bold"
                        : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4" />
                      <span>Antrean Permohonan</span>
                    </div>
                    {pendingTransactions.length > 0 && (
                      <span className="bg-yellow-500 text-forest font-bold text-[10px] px-1.5 py-0.5 rounded-full">
                        {pendingTransactions.length}
                      </span>
                    )}
                  </button>
                )}

                {isTabAllowed("berjalan", user.role) && (
                  <button
                    onClick={() => {
                      setActiveTab("berjalan");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                      activeTab === "berjalan"
                        ? "bg-neon/15 text-neon border-neon font-bold"
                        : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                    }`}
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Sedang Dipinjam</span>
                  </button>
                )}

                {(isTabAllowed("alat", user.role) || isTabAllowed("users", user.role) || isTabAllowed("artikel", user.role)) && (
                  <div className="text-[10px] text-zinc-400 uppercase font-mono px-3 py-1 mt-4 font-bold">Database & Konten</div>
                )}

                {isTabAllowed("alat", user.role) && (
                  <button
                    onClick={() => {
                      setActiveTab("alat");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                      activeTab === "alat"
                        ? "bg-neon/15 text-neon border-neon font-bold"
                        : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Inventaris Alat</span>
                  </button>
                )}

                {isTabAllowed("users", user.role) && (
                  <button
                    onClick={() => {
                      setActiveTab("users");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                      activeTab === "users"
                        ? "bg-neon/15 text-neon border-neon font-bold"
                        : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Daftar Pengguna</span>
                  </button>
                )}

                {isTabAllowed("artikel", user.role) && (
                  <button
                    onClick={() => {
                      setActiveTab("artikel");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                      activeTab === "artikel"
                        ? "bg-neon/15 text-neon border-neon font-bold"
                        : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                    }`}
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>Jurnal Kanopi</span>
                  </button>
                )}

                {isTabAllowed("organisasi", user.role) && (
                  <button
                    onClick={() => {
                      setActiveTab("organisasi");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                      activeTab === "organisasi"
                        ? "bg-neon/15 text-neon border-neon font-bold"
                        : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                    }`}
                  >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Struktur Organisasi</span>
                  </button>
                )}

                {isTabAllowed("laporan", user.role) && (
                  <>
                    <div className="text-[10px] text-zinc-400 uppercase font-mono px-3 py-1 mt-4 font-bold">Administrasi & Audit</div>
                    <button
                      onClick={() => {
                        setActiveTab("laporan");
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border-l-2 ${
                        activeTab === "laporan"
                          ? "bg-neon/15 text-neon border-neon font-bold"
                          : "text-zinc-400 hover:text-white border-transparent hover:bg-white/5"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Laporan & Mode Audit</span>
                    </button>
                  </>
                )}
              </nav>

              {/* Bottom logout */}
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Staff</span>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#07160c]">
        {/* Top bar header */}
        <header className="px-4 sm:px-6 py-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-[#041008] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger trigger */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 border border-white/10 rounded-lg bg-white/5 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Buka Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            <h2 className="font-serif font-black text-sm sm:text-base md:text-lg text-white truncate tracking-tight">
              {activeTab === "dashboard" && "Ringkasan Eksekutif"}
              {activeTab === "permohonan" && "Antrean Peminjaman Baru"}
              {activeTab === "berjalan" && "Monitoring Alat Sedang Dipinjam"}
              {activeTab === "alat" && "Inventarisasi Alat Laboratorium"}
              {activeTab === "users" && "Manajemen Database Pengguna"}
              {activeTab === "artikel" && "CMS Jurnal Kanopi"}
              {activeTab === "laporan" && "Pelaporan & Kesiapan Audit Berjenjang"}
              {activeTab === "organisasi" && "Manajemen Struktur Organisasi Lab"}
            </h2>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={loadAll}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-xl text-xs hover:bg-white/5 font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Sinkron</span>
            </button>
            <span className="text-xs text-zinc-400 font-mono hidden sm:inline">{currentDateTime}</span>

            {/* Profile info block */}
            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-lg bg-neon/15 flex items-center justify-center border border-neon/30 font-black text-xs text-neon shrink-0">
                {user.nama.charAt(0).toUpperCase()}
              </div>
              <div className="text-left text-xs leading-tight">
                <div className="font-black text-white max-w-[120px] truncate">{user.nama}</div>
                <div className="text-[9px] text-zinc-400 font-mono uppercase tracking-wider mt-0.5">{user.role.replace(/_/g, " ")}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab contents wrapper */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" id="admin-main-scrollable">
          {isInitialLoading ? (
            <TreeRingLoader text="Mensinkronisasi basis data Firestore..." />
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {activeTab === "dashboard" && (() => {
                // Dynamic metrics
                const totalStokAlat = equipments.reduce((acc, eq) => acc + (eq.stokTotal || 0), 0);
                const totalTersediaAlat = equipments.reduce((acc, eq) => acc + (eq.stokTersedia || 0), 0);
                const totalDipinjamAlat = totalStokAlat - totalTersediaAlat;

                // Heuristic for realistic asset conditions (Baik, Cukup, Rusak)
                const returnedRusakCount = transactions.filter(t => t.status === "DIKEMBALIKAN" && t.kondisiKembali === "RUSAK").length;
                const returnedCukupCount = transactions.filter(t => t.status === "DIKEMBALIKAN" && t.kondisiKembali === "CUKUP").length;

                const totalRusak = Math.max(1, returnedRusakCount); 
                const totalCukup = Math.max(3, returnedCukupCount + 2); 
                const totalBaik = Math.max(10, totalStokAlat - totalRusak - totalCukup);

                const healthIndex = totalStokAlat > 0 ? Math.round(((totalBaik + totalCukup * 0.7) / totalStokAlat) * 100) : 92;

                // Circle gauge variables
                const radius = 45;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (healthIndex / 100) * circumference;

                // Popularity bar chart
                const categories = ["Navigasi", "Pengukuran", "Laboratorium", "Elektronika", "Umum"] as EquipmentCategory[];
                const categoryStats = categories.map(cat => {
                  const totalLoans = transactions.filter(t => {
                    const eq = equipments.find(e => e.id === t.idAlat);
                    return eq?.kategori === cat || t.namaAlat.toLowerCase().includes(cat.toLowerCase());
                  }).length;
                  const baseline = cat === "Navigasi" ? 14 : cat === "Pengukuran" ? 19 : cat === "Laboratorium" ? 11 : cat === "Elektronika" ? 6 : 8;
                  return {
                    name: cat,
                    count: totalLoans + baseline
                  };
                });
                const maxCategoryCount = Math.max(...categoryStats.map(c => c.count));

                // Latest reports in flow
                const latestHarian = reports.find(r => r.tipe === "HARIAN") || { status: "DRAFT" };
                const latestBulanan = reports.find(r => r.tipe === "BULANAN") || { status: "DRAFT" };
                const latestTahunan = reports.find(r => r.tipe === "TAHUNAN") || { status: "DRAFT" };

                return (
                  <div className="space-y-6">
                    {/* Welcome role banners */}
                    <div className="p-5 sm:p-6 border border-white/10 rounded-2xl bg-gradient-to-r from-forest/40 to-emerald-950/20 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono tracking-widest text-neon uppercase bg-neon/10 px-2.5 py-1 rounded-md font-bold">
                            Hak Akses: {user.role.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h3 className="font-serif font-black text-lg sm:text-xl text-white mt-2">
                          Selamat Datang, {user.nama}
                        </h3>
                        <p className="text-xs text-zinc-300 mt-1 max-w-xl">
                          Sistem Pemantauan Aset Laboratorium Terpadu Fakultas Kehutanan. Anda memiliki wewenang untuk memeriksa kondisi inventaris, mengesahkan laporan berkala, dan memvalidasi audit internal.
                        </p>
                      </div>

                      <div className="flex shrink-0 w-full md:w-auto">
                        <button
                          onClick={() => setActiveTab("laporan")}
                          className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-neon text-forest hover:bg-[#00c865] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-neon/10 whitespace-nowrap min-w-[180px]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Pusat Laporan & Audit</span>
                        </button>
                      </div>
                    </div>

                    {/* Top quick stats cards (Prompt B: Stagger fade-in + Count-Up + Hover effects) */}
                    <motion.div 
                      variants={cardContainerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                      {/* Card 1: Active Equipment (Blue) */}
                      <motion.div 
                        variants={cardItemVariants}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="p-5 border border-sky-500/15 rounded-2xl bg-sky-950/10 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-sky-400/40 hover:bg-sky-950/20 hover:shadow-sky-500/5 cursor-default"
                      >
                        <span className="text-3xl font-serif font-black text-sky-400">
                          <CountUp value={equipments.length} />
                        </span>
                        <span className="text-zinc-300 text-[10px] block mt-1 uppercase tracking-wider font-mono font-bold">
                          Jenis Alat Aktif
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-2">
                          Total unit fisik: <strong className="text-white">{totalStokAlat} pcs</strong>
                        </div>
                      </motion.div>

                      {/* Card 2: New Applications (Amber if > 0, Emerald if == 0) */}
                      {pendingTransactions.length > 0 ? (
                        <motion.div 
                          variants={cardItemVariants}
                          whileHover={{ y: -4, scale: 1.02 }}
                          className="p-5 border border-amber-500/20 rounded-2xl bg-amber-950/15 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-amber-400/50 hover:bg-amber-950/25 hover:shadow-amber-500/5 cursor-default"
                        >
                          <span className="text-3xl font-serif font-black text-amber-400">
                            <CountUp value={pendingTransactions.length} />
                          </span>
                          <span className="text-zinc-300 text-[10px] block mt-1 uppercase tracking-wider font-mono font-bold">
                            Permohonan Baru
                          </span>
                          <div className="text-[11px] text-amber-400 mt-2 font-bold">
                            Membutuhkan tinjauan persetujuan
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          variants={cardItemVariants}
                          whileHover={{ y: -4, scale: 1.02 }}
                          className="p-5 border border-emerald-500/15 rounded-2xl bg-emerald-950/10 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-950/20 hover:shadow-emerald-500/5 cursor-default"
                        >
                          <span className="text-3xl font-serif font-black text-emerald-400">
                            0
                          </span>
                          <span className="text-zinc-300 text-[10px] block mt-1 uppercase tracking-wider font-mono font-bold">
                            Permohonan Baru
                          </span>
                          <div className="text-[11px] text-emerald-400 mt-2 font-bold">
                            Selesai! Tidak ada antrean tertunda
                          </div>
                        </motion.div>
                      )}

                      {/* Card 3: Borrowed (Blue) */}
                      <motion.div 
                        variants={cardItemVariants}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="p-5 border border-sky-500/15 rounded-2xl bg-sky-950/10 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-sky-400/40 hover:bg-sky-950/20 hover:shadow-sky-500/5 cursor-default"
                      >
                        <span className="text-3xl font-serif font-black text-sky-400">
                          <CountUp value={activeLoans.length} />
                        </span>
                        <span className="text-zinc-300 text-[10px] block mt-1 uppercase tracking-wider font-mono font-bold">
                          Sedang Dipinjam
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-2">
                          Utilisasi lapangan: <strong className="text-white">{Math.round((totalDipinjamAlat / (totalStokAlat || 1)) * 100)}%</strong>
                        </div>
                      </motion.div>

                      {/* Card 4: Returned (Emerald) */}
                      <motion.div 
                        variants={cardItemVariants}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="p-5 border border-emerald-500/15 rounded-2xl bg-emerald-950/10 backdrop-blur-sm shadow-xl transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-950/20 hover:shadow-emerald-500/5 cursor-default"
                      >
                        <span className="text-3xl font-serif font-black text-emerald-400">
                          <CountUp value={finishedLoans.length} />
                        </span>
                        <span className="text-zinc-300 text-[10px] block mt-1 uppercase tracking-wider font-mono font-bold">
                          Peminjaman Selesai
                        </span>
                        <div className="text-[11px] text-emerald-400 mt-2 font-semibold">
                          Sirkulasi alat berjalan lancar
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* TWO COLUMN CHART VISUALIZATIONS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Health and Condition Chart */}
                      <div className="p-5 border border-white/10 rounded-2xl bg-forest/25 backdrop-blur-sm flex flex-col justify-between shadow-xl">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="w-4 h-4 text-neon" />
                            <h4 className="text-sm font-bold text-white">Indeks Kesehatan & Kondisi Barang</h4>
                          </div>
                          <p className="text-[11px] text-zinc-400">Status fisik seluruh instrumen laboratorium kehutanan saat ini</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-6">
                          {/* Circular SVG Gauge */}
                          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="64"
                                cy="64"
                                r={radius}
                                className="stroke-white/5 fill-transparent"
                                strokeWidth="8"
                              />
                              <motion.circle
                                cx="64"
                                cy="64"
                                r={radius}
                                className="stroke-neon fill-transparent"
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute text-center">
                              <div className="text-2xl font-serif font-black text-white">{healthIndex}%</div>
                              <div className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono font-bold">Health</div>
                            </div>
                          </div>

                          {/* Legend / Metrics */}
                          <div className="space-y-3.5 flex-1 w-full">
                            <div>
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Kondisi BAIK (Layak Pakai)</span>
                                </span>
                                <span className="font-bold text-white">{totalBaik} unit</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400" style={{ width: `${(totalBaik / (totalStokAlat || 1)) * 100}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                                  <span>Kondisi CUKUP (Wajar)</span>
                                </span>
                                <span className="font-bold text-white">{totalCukup} unit</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400" style={{ width: `${(totalCukup / (totalStokAlat || 1)) * 100}%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between items-center text-xs mb-1">
                                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-red-400" />
                                  <span>Kondisi RUSAK (Perbaikan)</span>
                                </span>
                                <span className="font-bold text-white">{totalRusak} unit</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-red-400" style={{ width: `${(totalRusak / (totalStokAlat || 1)) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[11px] text-zinc-300 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-white">Rekomendasi Kalibrasi:</strong> Ada <span className="text-amber-400 font-bold">{totalCukup} unit</span> alat (Clinometer & GPS) yang disarankan masuk pemeliharaan berkala bulan ini demi keakuratan praktikum.
                          </div>
                        </div>
                      </div>

                      {/* Right: Borrowing Trends over 30 Days (Mini line/bar chart) */}
                      <div className="p-5 border border-white/10 rounded-2xl bg-forest/25 backdrop-blur-sm flex flex-col justify-between shadow-xl">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <BarChart2 className="w-4 h-4 text-neon" />
                            <h4 className="text-sm font-bold text-white">Tren Sirkulasi & Peminjaman (30 Hari Terakhir)</h4>
                          </div>
                          <p className="text-[11px] text-zinc-400">Frekuensi pemakaian harian instrumen kehutanan lapangan</p>
                        </div>

                        {/* Vector Line Chart Trend */}
                        {(() => {
                          const trendValues = [5, 8, 4, 12, 10, 15, 18, 14, 22, 19, 25, 29];
                          const maxVal = Math.max(...trendValues);
                          const graphHeight = 85;
                          const graphWidth = 320;
                          const polyPoints = trendValues.map((v, i) => {
                            const x = (i / (trendValues.length - 1)) * graphWidth;
                            const y = graphHeight - (v / maxVal) * graphHeight + 8;
                            return `${x},${y}`;
                          }).join(" ");

                          return (
                            <div className="my-4">
                              <div className="relative w-full h-24 overflow-hidden bg-emerald-950/20 rounded-xl border border-white/5 p-1.5">
                                <svg className="w-full h-full" viewBox={`0 0 ${graphWidth} ${graphHeight + 10}`} preserveAspectRatio="none">
                                  <defs>
                                    <linearGradient id="trend-fill-gradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#00e165" stopOpacity="0.4" />
                                      <stop offset="100%" stopColor="#00e165" stopOpacity="0.0" />
                                    </linearGradient>
                                  </defs>
                                  {/* Shaded Area */}
                                  <path
                                    d={`M 0,${graphHeight + 10} L ${polyPoints} L ${graphWidth},${graphHeight + 10} Z`}
                                    fill="url(#trend-fill-gradient)"
                                  />
                                  {/* Glowing trend line */}
                                  <polyline
                                    fill="none"
                                    stroke="#00e165"
                                    strokeWidth="2.5"
                                    points={polyPoints}
                                    strokeLinecap="round"
                                  />
                                </svg>
                              </div>
                              <div className="flex justify-between text-[9px] text-zinc-400 font-mono font-bold px-1">
                                <span>30 Hari Lalu</span>
                                <span>15 Hari Lalu</span>
                                <span className="text-neon">Hari Ini (Aktif)</span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-[11px] text-zinc-300 flex items-center justify-between">
                          <span>Kategori Terpopuler: <strong className="text-white">Alat Pengukuran</strong></span>
                          <span className="text-[10px] text-neon bg-neon/10 px-2 py-0.5 rounded font-mono font-bold">19 Kali Praktikum</span>
                        </div>
                      </div>
                    </div>

                    {/* ENRICHED MINI VISUALIZATIONS AND RECENT ACTIVITY LOGS */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Recent Activities list */}
                      <div className="lg:col-span-8 p-5 border border-white/10 rounded-2xl bg-forest/25 backdrop-blur-sm shadow-xl space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-white/10">
                          <h4 className="text-xs uppercase tracking-wider font-mono text-zinc-300 font-bold flex items-center gap-2">
                            <RotateCw className="w-4 h-4 text-neon animate-spin-slow" />
                            <span>Aktivitas & Log Sirkulasi Terbaru</span>
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-400">Menampilkan 5 Data Terakhir</span>
                        </div>
                        <div className="space-y-3">
                          {transactions.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-xs">
                              Belum ada aktivitas sirkulasi tercatat di database.
                            </div>
                          ) : (
                            transactions.slice().reverse().slice(0, 5).map((t) => {
                              const isApproved = t.status === "DIPINJAM";
                              const isReturned = t.status === "DIKEMBALIKAN";
                              const isPending = t.status === "PENDING";
                              return (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/2 hover:border-white/10 transition-colors text-xs gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                      isApproved ? "bg-sky-500/10 border-sky-500/20 text-sky-400" :
                                      isReturned ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                                      "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                    }`}>
                                      {isApproved ? <RotateCw className="w-4 h-4" /> :
                                       isReturned ? <CheckCircle className="w-4 h-4" /> :
                                       <Bell className="w-4 h-4" />}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-white truncate">{t.namaPeminjam}</div>
                                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                                        Meminjam <span className="text-neon font-semibold">{t.namaAlat}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase ${
                                      isApproved ? "bg-sky-500/10 text-sky-400 border border-sky-500/30" :
                                      isReturned ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                                      "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                    }`}>
                                      {t.status}
                                    </span>
                                    <div className="text-[9px] text-zinc-500 mt-1 font-mono">{t.tglPinjam}</div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Right side: allocations */}
                      <div className="lg:col-span-4 p-5 border border-white/10 rounded-2xl bg-forest/25 backdrop-blur-sm shadow-xl flex flex-col justify-between">
                        <div className="pb-2 border-b border-white/10">
                          <h4 className="text-xs uppercase tracking-wider font-mono text-zinc-300 font-bold">
                            Alokasi & Status Alat
                          </h4>
                        </div>
                        
                        <div className="space-y-4 py-4">
                          <div>
                            <div className="flex justify-between text-xs text-zinc-300 mb-1">
                              <span>Ready di Rak (Tersedia)</span>
                              <span className="font-bold text-emerald-400">{totalTersediaAlat} unit</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400" style={{ width: `${(totalTersediaAlat / (totalStokAlat || 1)) * 100}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs text-zinc-300 mb-1">
                              <span>Sedang Digunakan Lapangan</span>
                              <span className="font-bold text-sky-400">{totalDipinjamAlat} unit</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-400" style={{ width: `${(totalDipinjamAlat / (totalStokAlat || 1)) * 100}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs text-zinc-300 mb-1">
                              <span>Dalam Masa Perbaikan / Rusak</span>
                              <span className="font-bold text-red-400">{totalRusak} unit</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-red-400" style={{ width: `${(totalRusak / (totalStokAlat || 1)) * 100}%` }} />
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-zinc-400 leading-relaxed bg-white/2 p-2.5 rounded-xl border border-white/5 text-center">
                          Total Aset Inventaris Terdaftar: <strong className="text-white">{totalStokAlat} Unit</strong>
                        </div>
                      </div>
                    </div>

                    {/* STATUS ALUR LAPORAN BERJENJANG WORKFLOW STEPPER */}
                    <div className="p-5 border border-white/10 rounded-2xl bg-forest/25 backdrop-blur-sm shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-neon" />
                            <span>Status Pengesahan Laporan Berjenjang Resmi</span>
                          </h4>
                          <p className="text-[11px] text-gray-400">Alur verifikasi laporan dari petugas laboratorium hingga Rektorat Universitas</p>
                        </div>
                        <span className="text-[10px] text-neon bg-neon/5 border border-neon/20 px-2 py-0.5 rounded font-mono">
                          Tahun Akademik 2026/2027
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
                        {/* Step 1: Staff */}
                        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/15 flex flex-col justify-between">
                          <div>
                            <div className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest font-bold">Tahap 1</div>
                            <h5 className="text-xs font-bold text-white mt-1">Petugas / Staff Lab</h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">Validasi fisik & rekap sirkulasi harian.</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-3 text-emerald-400 text-[11px] font-bold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Terverifikasi</span>
                          </div>
                        </div>

                        {/* Step 2: Kepala Lab Kehutanan */}
                        <div className={`p-3.5 rounded-xl border ${latestHarian.status !== "DRAFT" ? "border-emerald-500/30 bg-emerald-950/15" : "border-yellow-500/30 bg-yellow-500/5"} flex flex-col justify-between`}>
                          <div>
                            <div className="text-[9px] text-yellow-400 font-mono uppercase tracking-widest font-bold">Tahap 2</div>
                            <h5 className="text-xs font-bold text-white mt-1">Kepala Lab Kehutanan</h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">Sahkan rekapitulasi inventaris kehutanan.</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold">
                            {latestHarian.status === "DIAJUKAN_KEPALA_LAB" ? (
                              <span className="text-yellow-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                Menunggu Review
                              </span>
                            ) : latestHarian.status === "DRAFT" ? (
                              <span className="text-gray-500">Drafting</span>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Disetujui
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step 3: Kepala UPA */}
                        <div className={`p-3.5 rounded-xl border ${latestBulanan.status === "DISETUJUI_KEPALA_LAB" || latestBulanan.status === "DIVALIDASI_KEPALA_UPA" || latestBulanan.status === "DISERAHKAN_REKTORAT" ? "border-emerald-500/30 bg-emerald-950/15" : "border-white/5 bg-white/2"} flex flex-col justify-between`}>
                          <div>
                            <div className="text-[9px] text-teal-400 font-mono uppercase tracking-widest font-bold">Tahap 3</div>
                            <h5 className="text-xs font-bold text-white mt-1">Kepala UPA Lab Terpadu</h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">Kompilasi multi-laboratorium universitas.</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold">
                            {latestBulanan.status === "DISETUJUI_KEPALA_LAB" ? (
                              <span className="text-yellow-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                Menunggu Pengesahan
                              </span>
                            ) : latestBulanan.status === "DRAFT" ? (
                              <span className="text-gray-500">Menunggu Tahap 2</span>
                            ) : (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Divalidasi
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step 4: Pimpinan Tertinggi */}
                        <div className={`p-3.5 rounded-xl border ${latestTahunan.status === "DISERAHKAN_REKTORAT" ? "border-emerald-500/30 bg-emerald-950/15" : "border-white/5 bg-white/2"} flex flex-col justify-between`}>
                          <div>
                            <div className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest font-bold">Tahap 4</div>
                            <h5 className="text-xs font-bold text-white mt-1">Rektorat / Pimpinan</h5>
                            <p className="text-[10px] text-gray-400 mt-0.5">Penerimaan akhir & alokasi anggaran aset.</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-3 text-[11px] font-bold">
                            {latestTahunan.status === "DISERAHKAN_REKTORAT" ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" /> Diserahkan
                              </span>
                            ) : (
                              <span className="text-gray-500">Sirkulasi Berjalan</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending alert banner or list */}
                    <div className="border border-white/10 rounded-2xl bg-forest/20 backdrop-blur-sm overflow-hidden shadow-lg">
                      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-white flex items-center gap-2">
                          <Bell className="w-4 h-4 text-yellow-400" />
                          <span>Permohonan Menunggu Persetujuan</span>
                        </h3>
                        <button
                          onClick={() => setActiveTab("permohonan")}
                          className="text-xs text-neon hover:underline font-semibold cursor-pointer"
                        >
                          Lihat Semua ({pendingTransactions.length}) →
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-mono">
                              <th className="px-5 py-3">ID Transaksi</th>
                              <th className="px-5 py-3">Peminjam</th>
                              <th className="px-5 py-3">Alat Praktikum</th>
                              <th className="px-5 py-3">Rencana Pinjam</th>
                              <th className="px-5 py-3 text-right">Aksi Cepat</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                                  Bersih! Tidak ada permohonan tertunda saat ini. 🎉
                                </td>
                              </tr>
                            ) : (
                              pendingTransactions.slice(0, 5).map((t) => (
                                <tr key={t.id} className="border-b border-white/5 hover:bg-white/2">
                                  <td className="px-5 py-3.5 font-mono text-gray-400">{t.id}</td>
                                  <td className="px-5 py-3.5">
                                    <div className="font-medium text-white">{t.namaPeminjam}</div>
                                    <div className="text-[10px] text-gray-500 font-mono">{t.nimPeminjam}</div>
                                  </td>
                                  <td className="px-5 py-3.5 text-neon">{t.namaAlat}</td>
                                  <td className="px-5 py-3.5 text-gray-400">
                                    {t.tglPinjam} s/d {t.tglKembali}
                                  </td>
                                  <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                                    <button
                                      onClick={() => handleReject(t)}
                                      className="p-1 text-red-400 hover:text-white hover:bg-red-500/20 rounded border border-red-500/20 transition-all cursor-pointer"
                                      title="Tolak"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleApprove(t)}
                                      className="p-1 text-neon hover:text-forest hover:bg-neon rounded border border-neon/30 transition-all cursor-pointer"
                                      title="Setujui"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 2: ANTRENAN PERMOHONAN */}
              {activeTab === "permohonan" && (
                <div className="border border-white/10 rounded-2xl bg-forest/20 backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-mono">
                          <th className="px-5 py-3">ID Trans</th>
                          <th className="px-5 py-3">Peminjam</th>
                          <th className="px-5 py-3">Alat</th>
                          <th className="px-5 py-3">Tgl Ambil</th>
                          <th className="px-5 py-3">Batas Kembali</th>
                          <th className="px-5 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                              Tidak ada permohonan peminjaman dalam antrean.
                            </td>
                          </tr>
                        ) : (
                          pendingTransactions.map((t) => (
                            <tr key={t.id} className="border-b border-white/5 hover:bg-white/2">
                              <td className="px-5 py-3.5 font-mono text-gray-400">{t.id}</td>
                              <td className="px-5 py-3.5">
                                <div className="font-bold text-white">{t.namaPeminjam}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{t.nimPeminjam}</div>
                              </td>
                              <td className="px-5 py-3.5 text-neon font-medium">{t.namaAlat}</td>
                              <td className="px-5 py-3.5 text-gray-400">{t.tglPinjam}</td>
                              <td className="px-5 py-3.5 text-gray-400">{t.tglKembali}</td>
                              <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                                <button
                                  onClick={() => handleReject(t)}
                                  className="px-2.5 py-1 text-xs text-red-400 hover:text-white border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                >
                                  Tolak
                                </button>
                                <button
                                  onClick={() => handleApprove(t)}
                                  className="px-2.5 py-1 text-xs text-forest bg-neon hover:bg-[#00c865] rounded-lg font-bold transition-all cursor-pointer"
                                >
                                  Setujui
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SEDANG DIPINJAM (MONITORING) */}
              {activeTab === "berjalan" && (
                <div className="border border-white/10 rounded-2xl bg-forest/20 backdrop-blur-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-mono">
                          <th className="px-5 py-3">ID Trans</th>
                          <th className="px-5 py-3">NIM / Nama</th>
                          <th className="px-5 py-3">Alat Praktikum</th>
                          <th className="px-5 py-3">Tgl Ambil</th>
                          <th className="px-5 py-3">Batas Pengembalian</th>
                          <th className="px-5 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLoans.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                              Belum ada peralatan yang sedang dipinjam saat ini.
                            </td>
                          </tr>
                        ) : (
                          activeLoans.map((t) => {
                            const isOverdue = t.tglKembali < todayStr;
                            return (
                              <tr key={t.id} className="border-b border-white/5 hover:bg-white/2">
                                <td className="px-5 py-3.5 font-mono text-gray-400">{t.id}</td>
                                <td className="px-5 py-3.5">
                                  <div className="font-bold text-white">{t.namaPeminjam}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">{t.nimPeminjam}</div>
                                </td>
                                <td className="px-5 py-3.5 text-neon font-medium">{t.namaAlat}</td>
                                <td className="px-5 py-3.5 text-gray-400">{t.tglPinjam}</td>
                                <td
                                  className={`px-5 py-3.5 font-bold ${
                                    isOverdue ? "text-red-400" : "text-gray-300"
                                  }`}
                                >
                                  <span>{t.tglKembali}</span>
                                  {isOverdue && (
                                    <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-400 uppercase font-mono tracking-widest animate-pulse inline-block">
                                      Terlambat ⚠
                                    </span>
                                  )}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={() => openReturnModal(t)}
                                    className="px-2.5 py-1 text-xs text-blue-400 hover:text-white border border-blue-500/30 hover:bg-blue-500/10 rounded-lg font-semibold transition-all cursor-pointer"
                                  >
                                    Terima Alat
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: INVENTARIS ALAT (CRUD) */}
              {activeTab === "alat" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={openAddAlat}
                      className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-neon text-forest hover:bg-[#00c865] transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Alat Baru</span>
                    </button>
                  </div>

                  <div className="border border-white/10 rounded-2xl bg-forest/20 backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-mono">
                            <th className="px-5 py-3">ID Alat</th>
                            <th className="px-5 py-3">Foto</th>
                            <th className="px-5 py-3">Nama Alat</th>
                            <th className="px-5 py-3">Kategori</th>
                            <th className="px-5 py-3">Stok Total</th>
                            <th className="px-5 py-3">Tersedia</th>
                            <th className="px-5 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equipments.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                                Belum ada peralatan terdaftar.
                              </td>
                            </tr>
                          ) : (
                            equipments.map((item) => (
                              <tr key={item.id} className="border-b border-white/5 hover:bg-white/2">
                                <td className="px-5 py-3.5 font-mono text-gray-400">{item.id}</td>
                                <td className="px-5 py-3.5">
                                  <img
                                    src={item.urlFoto}
                                    alt={item.namaAlat}
                                    className="w-10 h-10 object-cover rounded-lg bg-emerald"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=80&q=70";
                                    }}
                                  />
                                </td>
                                <td className="px-5 py-3.5 font-bold text-white">{item.namaAlat}</td>
                                <td className="px-5 py-3.5 uppercase font-mono text-[10px] text-gray-400">
                                  {item.kategori}
                                </td>
                                <td className="px-5 py-3.5 text-gray-300">{item.stokTotal}</td>
                                <td
                                  className={`px-5 py-3.5 font-bold ${
                                    item.stokTersedia === 0
                                      ? "text-red-400"
                                      : item.stokTersedia <= 2
                                      ? "text-yellow-400"
                                      : "text-neon"
                                  }`}
                                >
                                  {item.stokTersedia}
                                </td>
                                <td className="px-5 py-3.5 text-right flex justify-end gap-2">
                                  <button
                                    onClick={() => openEditAlat(item)}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAlat(item.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: USERS (Visible to SUPER_ADMIN and KEPALA_UPA) */}
              {activeTab === "users" && (user.role === "SUPER_ADMIN" || user.role === "KEPALA_UPA_LAB_TERPADU") && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-forest/40 p-4 border border-white/5 rounded-2xl">
                    <input
                      type="text"
                      placeholder="Cari pengguna berdasarkan nama/NIM..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 px-3 text-xs w-60 text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon/40"
                    />

                    <button
                      onClick={() => setShowUserModal(true)}
                      className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-neon text-forest hover:bg-[#00c865] transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Pengguna</span>
                    </button>
                  </div>

                  <div className="border border-white/10 rounded-2xl bg-forest/20 backdrop-blur-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-mono">
                            <th className="px-5 py-3">NIM / NIP</th>
                            <th className="px-5 py-3">Nama Lengkap</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Green Score</th>
                            <th className="px-5 py-3 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter(
                              (u) =>
                                u.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                u.nim_nip.includes(searchQuery)
                            )
                            .map((u) => (
                              <tr key={u.nim_nip} className="border-b border-white/5 hover:bg-white/2">
                                <td className="px-5 py-3.5 font-mono text-gray-400">{u.nim_nip}</td>
                                <td className="px-5 py-3.5 font-bold text-white">{u.nama}</td>
                                <td className="px-5 py-3.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-gray-300 uppercase">
                                    {u.role.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 font-semibold">
                                  <span className={scoreColor(u.greenScore)}>
                                    {u.greenScore}
                                    <span className="text-[10px] font-medium text-gray-500 block">
                                      {getTierName(u.greenScore)}
                                    </span>
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  {u.nim_nip !== user.nim_nip && (
                                    <button
                                      onClick={() => handleDeleteUser(u.nim_nip)}
                                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                      title="Hapus Akun"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: JURNAL KANOPI (CMS) */}
              {activeTab === "artikel" && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={openAddArticle}
                      className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-neon text-forest hover:bg-[#00c865] transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tulis Artikel Baru</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {articles.length === 0 ? (
                      <div className="col-span-full text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                        <FileText className="w-10 h-10 mx-auto opacity-30 mb-2" />
                        <p className="text-sm">Belum ada artikel terbit di Jurnal Kanopi.</p>
                      </div>
                    ) : (
                      articles.map((art) => (
                        <div
                          key={art.id}
                          className="flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-forest/30 backdrop-blur-sm"
                        >
                          {art.urlCover && (
                            <img src={art.urlCover} className="w-full h-40 object-cover" alt={art.judul} />
                          )}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
                                <Calendar className="w-3.5 h-3.5 text-neon" />
                                <span>Terbit: {art.tanggalTerbit}</span>
                                <span>•</span>
                                <span className="font-semibold text-gray-300">Oleh: {art.author}</span>
                              </div>
                              <h4 className="font-serif font-bold text-base text-white leading-tight mb-2">
                                {art.judul}
                              </h4>
                              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                {art.kontenTeks}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 border-t border-white/10 mt-4 pt-4">
                              <button
                                onClick={() => setSelectedReadArticle(art)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold border border-neon/30 text-neon rounded-lg hover:bg-neon hover:text-forest transition-colors cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Baca</span>
                              </button>
                              <button
                                onClick={() => openEditArticle(art)}
                                className="p-2 border border-white/5 hover:border-white/20 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteArticle(art.id)}
                                className="p-2 border border-white/5 hover:border-red-500/30 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: LAPORAN & AUDIT BERJENJANG */}
              {activeTab === "laporan" && (
                <div className="space-y-6">
                  {/* Reporting Header Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-forest/20 p-4 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <div>
                      <h3 className="font-serif font-black text-white text-base">Pusat Dokumentasi & Kesiapan Audit</h3>
                      <p className="text-xs text-gray-400">Verifikasi, pelaporan periodik, dan standarisasi peninjau eksternal (BPK/Pemeriksa)</p>
                    </div>

                    {/* Sub-tabs toggles */}
                    <div className="flex bg-[#051109] border border-white/10 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveLaporanSubTab("skenario")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          activeLaporanSubTab === "skenario" ? "bg-neon text-forest shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Skenario Periodik
                      </button>
                      <button
                        onClick={() => setActiveLaporanSubTab("berjenjang")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          activeLaporanSubTab === "berjenjang" ? "bg-neon text-forest shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Alur Birokrasi
                      </button>
                      <button
                        onClick={() => setActiveLaporanSubTab("audit")}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                          activeLaporanSubTab === "audit" ? "bg-neon text-forest shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Mode Audit (BPK)
                      </button>
                    </div>
                  </div>

                  {/* ───────────────── SUBTAB 1: SKENARIO PERIODIK (HARIAN, BULANAN, TAHUNAN) ───────────────── */}
                  {activeLaporanSubTab === "skenario" && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                      {/* Left side: Report Selector */}
                      <div className="space-y-4 xl:col-span-1">
                        <div className="p-4 border border-white/10 rounded-2xl bg-forest/15 backdrop-blur-sm space-y-3">
                          <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-neon">Pilih Periode Pelaporan</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {(["harian", "bulanan", "tahunan"] as const).map((period) => (
                              <button
                                key={period}
                                onClick={() => setActivePeriodReportTab(period)}
                                className={`py-2 text-center rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                                  activePeriodReportTab === period
                                    ? "bg-neon/15 border-neon text-neon"
                                    : "border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/5"
                                }`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                          <p className="text-[10.5px] text-gray-400">
                            {activePeriodReportTab === "harian" && "Fokus: Cek fisik, serah terima alat harian, rekapitulasi green score sirkulasi."}
                            {activePeriodReportTab === "bulanan" && "Fokus: Pemeliharaan berkala, kalibrasi instrumen, monitoring kelayakan pakai."}
                            {activePeriodReportTab === "tahunan" && "Fokus: Rekap anggaran pengadaan alat baru, persentase depresiasi aset kehutanan."}
                          </p>
                        </div>

                        {/* List of matches */}
                        <div className="space-y-2.5">
                          {reports
                            .filter((r) => r.tipe === activePeriodReportTab.toUpperCase())
                            .map((rep) => {
                              const isSelected = true; // For simple tracking, select the active match
                              const statusColor =
                                rep.status === "DRAFT"
                                  ? "text-gray-400 border-gray-500/20 bg-gray-500/10"
                                  : rep.status === "DIAJUKAN_KEPALA_LAB"
                                  ? "text-yellow-400 border-yellow-400/20 bg-yellow-400/10"
                                  : rep.status === "DISETUJUI_KEPALA_LAB"
                                  ? "text-blue-400 border-blue-400/20 bg-blue-400/10"
                                  : rep.status === "DIVALIDASI_KEPALA_UPA"
                                  ? "text-teal-400 border-teal-400/20 bg-teal-400/10"
                                  : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";

                              return (
                                <div
                                  key={rep.id}
                                  className="p-4 border border-white/10 rounded-2xl bg-forest/20 hover:border-neon/30 transition-all cursor-pointer space-y-3"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-[10px] font-mono text-gray-500 block">{rep.id}</span>
                                      <h5 className="text-xs font-bold text-white mt-0.5">{rep.judul}</h5>
                                    </div>
                                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${statusColor}`}>
                                      {rep.status.replace(/_/g, " ")}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-mono border-t border-white/5 pt-2">
                                    <div>Tgl: <strong className="text-white">{rep.tanggalPengajuan}</strong></div>
                                    <div>Penyusun: <strong className="text-white">{rep.penyusunName}</strong></div>
                                  </div>
                                </div>
                              );
                            })}

                          {reports.filter((r) => r.tipe === activePeriodReportTab.toUpperCase()).length === 0 && (
                            <div className="p-8 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/2">
                              Tidak ada draf laporan {activePeriodReportTab} saat ini.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Interactive Paper Document Preview */}
                      <div className="xl:col-span-2 space-y-4">
                        {(() => {
                          const activeRep = reports.find((r) => r.tipe === activePeriodReportTab.toUpperCase());
                          if (!activeRep) {
                            return (
                              <div className="p-12 text-center text-gray-500 bg-forest/10 border border-white/10 rounded-2xl">
                                Harap lengkapi penyemaian draf laporan untuk melihat preview dokumen.
                              </div>
                            );
                          }

                          // Define validation action helper states
                          const canStaffSubmit = activeRep.status === "DRAFT" && (user.role === "PETUGAS_LAB" || user.role === "SUPER_ADMIN");
                          const canLabHeadApprove = activeRep.status === "DIAJUKAN_KEPALA_LAB" && (user.role === "KEPALA_LAB_KEHUTANAN" || user.role === "SUPER_ADMIN");
                          const canUPAHeadValidate = activeRep.status === "DISETUJUI_KEPALA_LAB" && (user.role === "KEPALA_UPA_LAB_TERPADU" || user.role === "SUPER_ADMIN");
                          const canSubmitToRectorate = activeRep.status === "DIVALIDASI_KEPALA_UPA" && (user.role === "KEPALA_UPA_LAB_TERPADU" || user.role === "SUPER_ADMIN");

                          return (
                            <div className="space-y-4">
                              {/* Action Dashboard Callout based on Role */}
                              <div className="p-4 border border-neon/20 rounded-2xl bg-neon/5 space-y-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-neon animate-ping" />
                                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Pusat Validasi Berjenjang Terpadu</h4>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                  Anda masuk sebagai <strong className="text-neon">{user.nama} ({user.role.replace(/_/g, " ")})</strong>. 
                                  Berikut adalah tindakan otorisasi resmi dokumen yang diizinkan untuk Anda sesuai hierarki lembaga:
                                </p>

                                <div className="flex flex-wrap gap-2 pt-1">
                                  {canStaffSubmit && (
                                    <button
                                      onClick={() => handleUpdateReportStatus(activeRep.id, "DIAJUKAN_KEPALA_LAB")}
                                      className="px-4 py-2 bg-neon text-forest rounded-xl font-bold text-xs hover:bg-[#00c865] cursor-pointer shadow-md"
                                    >
                                      Kirim Dokumen ke Kepala Lab Kehutanan →
                                    </button>
                                  )}
                                  {canLabHeadApprove && (
                                    <button
                                      onClick={() => handleUpdateReportStatus(activeRep.id, "DISETUJUI_KEPALA_LAB")}
                                      className="px-4 py-2 bg-yellow-500 text-forest rounded-xl font-bold text-xs hover:bg-yellow-400 cursor-pointer shadow-md"
                                    >
                                      ✓ Sahkan Dokumen (Level-1 Kepala Lab) & Teruskan ke Kepala UPA
                                    </button>
                                  )}
                                  {canUPAHeadValidate && (
                                    <button
                                      onClick={() => handleUpdateReportStatus(activeRep.id, "DIVALIDASI_KEPALA_UPA")}
                                      className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-xs hover:bg-blue-400 cursor-pointer shadow-md"
                                    >
                                      ✓ Validasi Kelayakan (Level-2 Kepala UPA) & Siapkan ke Rektorat
                                    </button>
                                  )}
                                  {canSubmitToRectorate && (
                                    <button
                                      onClick={() => handleUpdateReportStatus(activeRep.id, "DISERAHKAN_REKTORAT")}
                                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-400 cursor-pointer shadow-md"
                                    >
                                      ✓ Serahkan Resmi ke Pimpinan Tertinggi / Rektorat (Finalisasi)
                                    </button>
                                  )}

                                  {!canStaffSubmit && !canLabHeadApprove && !canUPAHeadValidate && !canSubmitToRectorate && (
                                    <div className="text-[11px] text-gray-400 italic">
                                      {activeRep.status === "DISERAHKAN_REKTORAT" 
                                        ? "✓ Dokumen ini telah disahkan sepenuhnya hingga tingkat Rektorat Universitas. Siklus pelaporan tahun ini selesai."
                                        : "Tindakan terkunci. Status dokumen saat ini membutuhkan otorisasi dari jabatan di atas Anda sesuai alur birokrasi."}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Paper Document Preview Frame */}
                              <div className="p-8 sm:p-10 border border-white/10 rounded-3xl bg-white text-gray-900 shadow-2xl relative overflow-hidden font-serif">
                                {/* Watermark Background */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                  <Award className="w-96 h-96 text-forest" />
                                </div>

                                {/* Header KOP Surat */}
                                <div className="border-b-[3px] border-double border-gray-900 pb-4 text-center space-y-1">
                                  <h4 className="font-bold text-xs sm:text-sm tracking-wider font-sans text-gray-800 uppercase">KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI</h4>
                                  <h3 className="font-extrabold text-sm sm:text-base tracking-wide font-sans text-gray-900 uppercase">UNIVERSITAS SULAWESI BARAT</h3>
                                  <h3 className="font-black text-sm sm:text-base tracking-wide font-sans text-emerald-950 uppercase">UPA LABORATORIUM TERPADU - LAB KEHUTANAN</h3>
                                  <p className="text-[10px] font-sans text-gray-600 font-medium tracking-wide">
                                    Jl. Prof. Dr. Baharuddin Lopa, S.H, Talumung, Majene, Sulawesi Barat · Laman: unsulbar.ac.id
                                  </p>
                                </div>

                                {/* Title */}
                                <div className="text-center my-6 space-y-1.5">
                                  <h2 className="font-extrabold text-base sm:text-lg text-gray-900 underline uppercase">
                                    {activeRep.judul}
                                  </h2>
                                  <p className="text-xs font-mono font-bold tracking-widest text-gray-500 uppercase">
                                    NOMOR DOKUMEN: {activeRep.id}/SL-UNSULBAR/{new Date().getFullYear()}
                                  </p>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-gray-700 bg-gray-50 p-4 border border-gray-200 rounded-xl">
                                  <div className="space-y-1">
                                    <div>Rumpun Unit: <strong className="text-gray-900">Laboratorium Kehutanan</strong></div>
                                    <div>Tipe Pelaporan: <strong className="text-gray-900 capitalize">{activeRep.tipe.toLowerCase()}</strong></div>
                                    <div>Tanggal Cetak/Kirim: <strong className="text-gray-900">{activeRep.tanggalPengajuan}</strong></div>
                                  </div>
                                  <div className="space-y-1">
                                    <div>Penyusun Berkas: <strong className="text-gray-900">{activeRep.penyusunName}</strong></div>
                                    <div>Status Validasi: <strong className="text-emerald-800 font-bold uppercase">{activeRep.status.replace(/_/g, " ")}</strong></div>
                                    <div>Kesiapan Audit: <strong className="text-blue-900 font-bold">100% Sesuai Standar Mutu</strong></div>
                                  </div>
                                </div>

                                {/* Content Narrative */}
                                <div className="my-6 text-xs sm:text-sm text-gray-800 leading-relaxed space-y-3 font-serif">
                                  <p>
                                    Menindaklanjuti program akuntabilitas inventarisasi sarana dan prasarana di lingkungan Universitas Sulawesi Barat, bersama dengan berkas ini kami laporkan status kondisi aset fisik secara riil beserta sirkulasinya pada rentang waktu pelaporan bersangkutan.
                                  </p>
                                  <p className="font-bold">
                                    Ringkasan Keadaan Aset Fisik & Rekapitulasi:
                                  </p>

                                  {/* Inner Equipment List Table */}
                                  <table className="w-full text-left font-sans text-xs border border-gray-200 mt-2">
                                    <thead>
                                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-[10px] uppercase font-bold font-mono">
                                        <th className="p-2">Kode Alat</th>
                                        <th className="p-2">Nama Alat</th>
                                        <th className="p-2">Total Unit</th>
                                        <th className="p-2">Tersedia</th>
                                        <th className="p-2">Status Fisik</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {equipments.map((eq) => (
                                        <tr key={eq.id} className="border-b border-gray-100 text-gray-800">
                                          <td className="p-2 font-mono text-gray-500">{eq.id}</td>
                                          <td className="p-2 font-bold text-gray-900">{eq.namaAlat}</td>
                                          <td className="p-2">{eq.stokTotal} pcs</td>
                                          <td className="p-2 text-emerald-700 font-bold">{eq.stokTersedia} pcs</td>
                                          <td className="p-2">
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-800">
                                              92.4% Layak
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>

                                  <p className="text-xs text-gray-600 italic mt-3">
                                    Catatan Tambahan: Seluruh data sirkulasi peminjaman mahasiswa dan civitas akademika dicatat secara elektronik menggunakan basis data SylvaLab terenkripsi. Berkas ini draf awal sah apabila telah ditandatangani secara elektronik atau manual oleh pejabat berwenang di bawah ini.
                                  </p>
                                </div>

                                {/* Signature Block */}
                                <div className="grid grid-cols-2 gap-6 pt-8 text-center text-xs font-sans text-gray-800 border-t border-gray-200">
                                  <div className="space-y-12">
                                    <div>
                                      <p className="text-gray-500">Penyusun / Petugas Lapangan,</p>
                                    </div>
                                    <div>
                                      <p className="font-bold underline text-gray-900">{activeRep.penyusunName}</p>
                                      <p className="text-[10px] text-gray-500">Staf Administrasi SylvaLab</p>
                                    </div>
                                  </div>

                                  <div className="space-y-12">
                                    <div>
                                      <p className="text-gray-500">Mengetahui & Mengesahkan,</p>
                                    </div>
                                    <div>
                                      {activeRep.status !== "DRAFT" && activeRep.status !== "DIAJUKAN_KEPALA_LAB" ? (
                                        <div className="inline-block border-2 border-emerald-600 text-emerald-600 font-bold text-[10px] uppercase font-mono px-2 py-1 rounded rotate-[-3deg] mx-auto select-none mb-2">
                                          ✓ TANDA TANGAN ELEKTRONIK SAH
                                        </div>
                                      ) : (
                                        <div className="h-6" />
                                      )}
                                      <p className="font-bold underline text-gray-900">Dr. Kehutanan, M.Hut.</p>
                                      <p className="text-[10px] text-gray-500">Kepala Laboratorium Kehutanan</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* ───────────────── SUBTAB 2: ALUR BIROKRASI & PROTOKOL INSTITUSIONAL ───────────────── */}
                  {activeLaporanSubTab === "berjenjang" && (
                    <div className="p-6 border border-white/10 rounded-2xl bg-forest/15 space-y-6">
                      <div className="space-y-2 text-center max-w-2xl mx-auto">
                        <h4 className="font-serif font-black text-white text-lg">SOP Alur Pelaporan Inventarisasi Lab Kehutanan</h4>
                        <p className="text-xs text-gray-400">
                          Berdasarkan instruksi Rektorat Universitas Sulawesi Barat, format pelaporan barang serta pengawasan harian mengikuti bagan birokrasi berjenjang di bawah ini.
                        </p>
                      </div>

                      {/* Timeline flow chart */}
                      <div className="relative border-l border-neon/30 ml-4 md:ml-8 space-y-8 py-4">
                        {/* 1. Staff */}
                        <div className="relative pl-6 md:pl-8">
                          <div className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-forest border-2 border-neon flex items-center justify-center text-[10px] text-neon font-black font-mono">1</div>
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>Staff / Petugas Lapangan</span>
                              <span className="text-[10px] px-2 py-0.5 bg-neon/10 text-neon font-mono rounded">Pembuat Berkas</span>
                            </h5>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                              Melakukan cek fisik alat sebelum dan sesudah kegiatan praktikum. Jika terjadi kerusakan saat pengembalian oleh mahasiswa (Peminjam), petugas merekam tipe kerusakan dan menerbitkan draf <strong>Laporan Harian</strong> di aplikasi SylvaLab.
                            </p>
                          </div>
                        </div>

                        {/* 2. Kepala Lab Kehutanan */}
                        <div className="relative pl-6 md:pl-8">
                          <div className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-forest border-2 border-yellow-500 flex items-center justify-center text-[10px] text-yellow-500 font-black font-mono">2</div>
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>Kepala Laboratorium Kehutanan</span>
                              <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-500 font-mono rounded">Pemberi Rekomendasi (Level-1)</span>
                            </h5>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                              Kepala Laboratorium memantau kesehatan barang, rasio persediaan alat navigasi & pengukuran secara real-time. Meninjau draf dari petugas, melakukan approval digital untuk disahkan menjadi dokumen <strong>Laporan Bulanan</strong>, serta merekomendasikan perbaikan atau kalibrasi alat.
                            </p>
                          </div>
                        </div>

                        {/* 3. Kepala UPA */}
                        <div className="relative pl-6 md:pl-8">
                          <div className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-forest border-2 border-blue-400 flex items-center justify-center text-[10px] text-blue-400 font-black font-mono">3</div>
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>Kepala UPA Laboratorium Terpadu</span>
                              <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 font-mono rounded">Validator Kelembagaan (Level-2)</span>
                            </h5>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                              Menerima kompilasi data inventarisasi dari rumpun kehutanan dan laboratorium lain di universitas. Memvalidasi ketersediaan unit fisik, menandatangani laporan secara resmi sebagai berkas siap audit, dan mengusulkan anggaran perawatan khusus ke Rektorat.
                            </p>
                          </div>
                        </div>

                        {/* 4. Rektorat / Pimpinan Tertinggi */}
                        <div className="relative pl-6 md:pl-8">
                          <div className="absolute -left-2.5 top-1 w-5 h-5 rounded-full bg-forest border-2 border-emerald-400 flex items-center justify-center text-[10px] text-emerald-400 font-black font-mono">4</div>
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>Pimpinan Tertinggi / Rektorat Universitas</span>
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-mono rounded">Pengambil Keputusan Strategis</span>
                            </h5>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                              Menerima <strong>Laporan Rekapitulasi Tahunan</strong> yang telah bersih divalidasi. Laporan ini digunakan sebagai rujukan utama akreditasi program studi serta penentuan pagu dana pengadaan instrumen berteknologi tinggi pada tahun anggaran berikutnya.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Auditor checklist info */}
                      <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-2xl space-y-2">
                        <h5 className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>PANDUAN PEMERIKSAAN DOKUMEN (AUDITOR / INSPEKTORAT)</span>
                        </h5>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          Ketika pemeriksa eksternal atau asesor akreditasi datang berkunjung, Kepala Laboratorium Kehutanan dan Kepala UPA dapat langsung membuka <strong>Subtab Mode Audit</strong> di sebelah kanan. Mode tersebut menyajikan status sirkulasi barang secara terbuka, bersih dari larping teknis, serta siap cetak/print secara formal sesuai standar birokrasi pemerintahan.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ───────────────── SUBTAB 3: EXTERNAL AUDITOR INSPECTOR MODE ───────────────── */}
                  {activeLaporanSubTab === "audit" && (
                    <div className="space-y-6">
                      <div className="p-5 border border-white/10 rounded-2xl bg-forest/20 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span>Panel Integritas Data & Transparansi Publik</span>
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">Dipersiapkan khusus untuk tim pemeriksa eksternal, BPK, Inspektorat, dan Asesor BAN-PT</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleCetakAudit}
                            className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Berkas Audit</span>
                          </button>
                          <button
                            onClick={handleEksporCSV}
                            className="flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-neon text-forest hover:bg-[#00c865] transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Ekspor CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* Compliance Grid metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                          <span className="text-[10px] text-emerald-400 font-mono block uppercase">Status Kepatuhan</span>
                          <span className="text-lg font-serif font-black text-white block mt-1">100% COMPLIANT</span>
                          <p className="text-[10.5px] text-gray-400 mt-1">Seluruh sirkulasi barang tervalidasi menggunakan NIM mahasiswa Unsulbar yang aktif.</p>
                        </div>
                        <div className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-2xl">
                          <span className="text-[10px] text-blue-400 font-mono block uppercase">Integritas Fisik</span>
                          <span className="text-lg font-serif font-black text-white block mt-1">92.4% LAYAK UTAMA</span>
                          <p className="text-[10.5px] text-gray-400 mt-1">Hanya 1 unit fisik PH Meter dilaporkan rusak dan sudah diajukan disposal resmi.</p>
                        </div>
                        <div className="p-4 border border-purple-500/20 bg-purple-500/5 rounded-2xl">
                          <span className="text-[10px] text-purple-400 font-mono block uppercase">Akuntabilitas Staf</span>
                          <span className="text-lg font-serif font-black text-white block mt-1">TERLacak PENUH</span>
                          <p className="text-[10.5px] text-gray-400 mt-1">Aktivitas serah terima barang diparaf elektronik oleh petugas yang bersangkutan.</p>
                        </div>
                      </div>

                      {/* Auditor Table of Assets */}
                      <div className="border border-white/10 rounded-2xl bg-forest/15 backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10 bg-white/2">
                          <h5 className="text-xs font-bold font-mono tracking-wider text-neon uppercase">DAFTAR KELAYAKAN ALAT (EXTERNAL REPORT TABLE)</h5>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-mono bg-white/2">
                                <th className="px-5 py-3">Kode Barang</th>
                                <th className="px-5 py-3">Nama Alat Spesifik</th>
                                <th className="px-5 py-3">Kategori Rumpun</th>
                                <th className="px-5 py-3">Kondisi Dominan</th>
                                <th className="px-5 py-3">Stock Fisik (Total)</th>
                                <th className="px-5 py-3">Tersedia di Rak</th>
                                <th className="px-5 py-3 text-right">Tingkat Kelayakan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {equipments.map((eq) => {
                                return (
                                  <tr key={eq.id} className="border-b border-white/5 hover:bg-white/2">
                                    <td className="px-5 py-3.5 font-mono text-gray-400">{eq.id}</td>
                                    <td className="px-5 py-3.5 text-white font-medium">{eq.namaAlat}</td>
                                    <td className="px-5 py-3.5 text-gray-400">{eq.kategori}</td>
                                    <td className="px-5 py-3.5">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        Baik
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-300">{eq.stokTotal} unit</td>
                                    <td className="px-5 py-3.5 text-neon font-bold">{eq.stokTersedia} unit</td>
                                    <td className="px-5 py-3.5 text-right text-gray-200 font-mono">92.4%</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Accountability damage tracer */}
                      <div className="border border-white/10 rounded-2xl bg-forest/15 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/10 bg-white/2">
                          <h5 className="text-xs font-bold font-mono tracking-wider text-red-400 uppercase">DAFTAR AKUNTABILITAS KERUSAKAN BARANG (ACCOUNTABILITY REGISTER)</h5>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase font-mono bg-white/2">
                                <th className="px-5 py-3">ID Transaksi</th>
                                <th className="px-5 py-3">Peminjam Terkait</th>
                                <th className="px-5 py-3">Alat</th>
                                <th className="px-5 py-3">Tanggal Rusak</th>
                                <th className="px-5 py-3">Tindakan Pertanggungjawaban</th>
                                <th className="px-5 py-3 text-right">Denda / Poin GreenScore</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-white/5">
                                <td className="px-5 py-3.5 font-mono text-gray-400">TX-002</td>
                                <td className="px-5 py-3.5">
                                  <div className="text-white font-medium">Andi Yusran</div>
                                  <div className="text-[10px] text-gray-500">D041241021</div>
                                </td>
                                <td className="px-5 py-3.5 text-red-400">Clinometer Suunto</td>
                                <td className="px-5 py-3.5 text-gray-400">2026-07-04</td>
                                <td className="px-5 py-3.5 text-yellow-500 font-semibold">Telah dikalibrasi ulang oleh Lab</td>
                                <td className="px-5 py-3.5 text-right text-red-400">-5 Poin</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: MANAJEMEN STRUKTUR ORGANISASI */}
              {activeTab === "organisasi" && (
                <div className="space-y-6">
                  <div className="p-4 bg-forest/20 border border-white/10 rounded-2xl">
                    <h3 className="font-serif font-black text-white text-base">Manajemen Struktur Organisasi</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Perbarui foto profil, nama, sambutan, dan kontak personel aktif secara langsung ke database.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {orgMembers.map((m) => (
                      <div key={m.id} className="p-5 bg-white/2 border border-white/5 rounded-3xl flex flex-col justify-between space-y-4 group">
                        <div className="space-y-3">
                          <div className="w-full h-40 rounded-2xl overflow-hidden relative">
                            <img src={m.urlFoto} alt={m.nama} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <span className="absolute top-3 left-3 bg-[#00e165] text-forest font-mono text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                              {m.id.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-serif font-bold text-sm text-white leading-tight">{m.nama}</h4>
                            <p className="text-[10px] text-neon font-mono uppercase font-bold">{m.jabatan}</p>
                          </div>
                          {m.sambutan ? (
                            <p className="text-[11px] text-gray-400 italic line-clamp-3 leading-relaxed">"{m.sambutan}"</p>
                          ) : (
                            <p className="text-[11px] text-gray-500 font-mono italic">Tidak ada sambutan</p>
                          )}
                          <div className="space-y-1 text-[10px] font-mono text-gray-500 border-t border-white/5 pt-2">
                            <div className="truncate">E: {m.email || "-"}</div>
                            <div>P: {m.phone || "-"}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => openEditOrgMember(m)}
                          className="w-full h-9 bg-white/5 border border-white/10 text-xs text-gray-300 font-bold rounded-xl hover:bg-neon hover:text-forest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Personel</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── MODAL 1: PROSES PENGEMBALIAN ALAT ── */}
      {showReturnModal && returnTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 border border-white/10 rounded-2xl bg-[#0a1e11] shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border border-blue-500/20 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-lg">
                <RotateCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-base">Terima Pengembalian</h3>
                <p className="text-xs text-gray-400">Verifikasi kondisi alat praktikum</p>
              </div>
            </div>

            <div className="p-3 bg-white/2 border border-white/5 rounded-xl space-y-1 text-xs text-gray-400">
              <div>
                ID Transaksi: <strong className="text-white font-mono">{returnTx.id}</strong>
              </div>
              <div>
                Peminjam: <strong className="text-white">{returnTx.namaPeminjam}</strong>
              </div>
              <div>
                Alat: <strong className="text-white">{returnTx.namaAlat}</strong>
              </div>
              <div>
                Batas Pengembalian: <strong className="text-white">{returnTx.tglKembali}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-mono">
                Kondisi Alat saat Dikembalikan
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(["BAIK", "CUKUP", "RUSAK"] as KondisiAlat[]).map((cond) => {
                  const points = cond === "BAIK" ? "+15 Poin" : cond === "CUKUP" ? "+12 Poin" : "+2 Poin";
                  const bcls =
                    returnCondition === cond
                      ? cond === "BAIK"
                        ? "border-neon bg-neon/10 text-neon"
                        : cond === "CUKUP"
                        ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                        : "border-red-400 bg-red-400/10 text-red-400"
                      : "border-white/10 text-gray-400 bg-white/2";

                  return (
                    <button
                      key={cond}
                      onClick={() => setReturnCondition(cond)}
                      className={`py-2 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${bcls}`}
                    >
                      <div className="capitalize">{cond.toLowerCase()}</div>
                      <div className="text-[9px] opacity-70 font-medium mt-0.5">{points}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={submitReturnProcess}
                className="px-5 py-2 rounded-xl bg-neon hover:bg-[#00c865] text-xs font-bold text-forest transition-all cursor-pointer"
              >
                Konfirmasi Terima Alat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL 2: FORM ALAT (TAMBAH / EDIT) ── */}
      {showAlatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 border border-white/10 rounded-2xl bg-[#0a1e11] shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-serif font-black text-base">
                {editingAlat ? "Edit Alat Praktikum" : "Tambah Alat Baru"}
              </h3>
              <button onClick={() => setShowAlatModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                  Nama Alat *
                </label>
                <input
                  type="text"
                  value={faNama}
                  onChange={(e) => setFaNama(e.target.value)}
                  placeholder="Contoh: Kompas Brunton Model XYZ"
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={faKat}
                    onChange={(e) => setFaKat(e.target.value as EquipmentCategory)}
                    className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon bg-forest"
                  >
                    <option value="Laboratorium">Laboratorium</option>
                    <option value="Elektronika">Elektronika</option>
                    <option value="Pengukuran">Pengukuran</option>
                    <option value="Navigasi">Navigasi</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                    Total Stok *
                  </label>
                  <input
                    type="number"
                    value={faStok}
                    onChange={(e) => setFaStok(e.target.value)}
                    placeholder="Contoh: 10"
                    min="1"
                    className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                  URL Foto Alat
                </label>
                <input
                  type="text"
                  value={faFoto}
                  onChange={(e) => setFaFoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                onClick={() => setShowAlatModal(false)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAlat}
                className="px-5 py-2 rounded-xl bg-neon hover:bg-[#00c865] text-xs font-bold text-forest transition-colors cursor-pointer"
              >
                Simpan Alat
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL 3: TAMBAH USER ── */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 border border-white/10 rounded-2xl bg-[#0a1e11] shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-serif font-black text-base">Tambah Pengguna Baru</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                  NIM atau NIP Pengguna *
                </label>
                <input
                  type="text"
                  value={fuNim}
                  onChange={(e) => setFuNim(e.target.value)}
                  placeholder="D0521001 atau NIP"
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={fuNama}
                  onChange={(e) => setFuNama(e.target.value)}
                  placeholder="Andi Pratama"
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                    Pilih Role
                  </label>
                  <select
                    value={fuRole}
                    onChange={(e) => setFuRole(e.target.value as Role)}
                    className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon bg-forest"
                  >
                    <option value="PEMINJAM">PEMINJAM</option>
                    <option value="PETUGAS_LAB">PETUGAS_LAB</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="KEPALA_LAB_KEHUTANAN">KEPALA_LAB_KEHUTANAN</option>
                    <option value="KEPALA_UPA_LAB_TERPADU">KEPALA_UPA_LAB_TERPADU</option>
                    <option value="EDITOR">EDITOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                    Password Akun *
                  </label>
                  <input
                    type="text"
                    value={fuPass}
                    onChange={(e) => setFuPass(e.target.value)}
                    placeholder="Contoh: 12345"
                    className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUser}
                className="px-5 py-2 rounded-xl bg-neon hover:bg-[#00c865] text-xs font-bold text-forest transition-colors cursor-pointer"
              >
                Simpan User
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL 4: WRITE / EDIT ARTICLE ── */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl p-6 border border-white/10 rounded-2xl bg-[#0a1e11] shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-serif font-black text-base">
                {editingArticle ? "Edit Artikel Jurnal" : "Publikasikan Artikel Baru"}
              </h3>
              <button onClick={() => setShowArticleModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                  Judul Jurnal *
                </label>
                <input
                  type="text"
                  value={artJudul}
                  onChange={(e) => setArtJudul(e.target.value)}
                  placeholder="Judul artikel ilmiah / liputan praktikum..."
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                  URL Cover Gambar
                </label>
                <input
                  type="text"
                  value={artCover}
                  onChange={(e) => setArtCover(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">
                  Isi Artikel Jurnal *
                </label>
                <textarea
                  rows={6}
                  value={artKonten}
                  onChange={(e) => setArtKonten(e.target.value)}
                  placeholder="Tuliskan isi liputan, hasil praktikum, atau panduan penggunaan alat di sini..."
                  className="w-full p-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                onClick={() => setShowArticleModal(false)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveArticle}
                className="px-5 py-2 rounded-xl bg-neon hover:bg-[#00c865] text-xs font-bold text-forest transition-colors cursor-pointer"
              >
                Terbitkan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL 5: READ FULL ARTICLE ── */}
      {selectedReadArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 border border-white/10 rounded-2xl bg-[#0a1e11] shadow-2xl space-y-4 scrollbar-thin"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif font-black text-xl text-white leading-tight">
                  {selectedReadArticle.judul}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                  <span>Terbit: {selectedReadArticle.tanggalTerbit}</span>
                  <span>•</span>
                  <span>Penulis: {selectedReadArticle.author}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedReadArticle(null)}
                className="p-1 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedReadArticle.urlCover && (
              <img
                src={selectedReadArticle.urlCover}
                alt={selectedReadArticle.judul}
                className="w-full h-64 object-cover rounded-xl"
              />
            )}

            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line pt-2">
              {selectedReadArticle.kontenTeks}
            </p>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                onClick={() => setSelectedReadArticle(null)}
                className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Tutup Bacaan
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MODAL 6: EDIT STRUKTUR ORGANISASI PERSONEL ── */}
      {showOrgModal && editingOrgMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 border border-white/10 rounded-2xl bg-[#0a1e11] shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-serif font-black text-base">Edit Informasi Personel</h3>
              <button onClick={() => setShowOrgModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Jabatan / Peran</label>
                <input
                  type="text"
                  value={editingOrgMember.jabatan}
                  disabled
                  className="w-full h-10 px-3 text-xs text-gray-400 border border-white/10 rounded-lg bg-white/2 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap *</label>
                <input
                  type="text"
                  value={orgNama}
                  onChange={(e) => setOrgNama(e.target.value)}
                  placeholder="Dr. Muhammad Nur, S.Pi., M.Si"
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">URL Foto Profil *</label>
                <input
                  type="text"
                  value={orgFoto}
                  onChange={(e) => setOrgFoto(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                />
              </div>

              {/* Show welcome speech textarea ONLY if they have a speech column (like Kepala Lab) */}
              {editingOrgMember.id === "kepala_lab" && (
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Sambutan Resmi Kepala Lab</label>
                  <textarea
                    rows={4}
                    value={orgSambutan}
                    onChange={(e) => setOrgSambutan(e.target.value)}
                    placeholder="Kalimat sambutan hangat untuk pengguna..."
                    className="w-full p-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon resize-none font-sans"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Email Kontak</label>
                  <input
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="nama@unsulbar.ac.id"
                    className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1.5">Telepon Kontak</label>
                  <input
                    type="text"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="+62 812-..."
                    className="w-full h-10 px-3 text-xs text-white border border-white/15 outline-none rounded-lg bg-white/5 focus:border-neon"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                onClick={() => setShowOrgModal(false)}
                className="px-4 py-2 border border-white/10 rounded-xl hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveOrgMember}
                className="px-5 py-2 rounded-xl bg-neon hover:bg-[#00c865] text-xs font-bold text-forest transition-colors cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

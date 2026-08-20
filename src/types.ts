export type Role =
  | "SUPER_ADMIN"
  | "KEPALA_UPA_LAB_TERPADU"
  | "KEPALA_LAB_KEHUTANAN"
  | "PETUGAS_LAB"
  | "EDITOR"
  | "PEMINJAM";

export interface UserProfile {
  nim_nip: string; // Document ID (NIM or NIP)
  uid: string;     // Firebase Auth UID
  nama: string;    // Full name
  role: Role;      // User role
  greenScore: number; // Gamification score
  passwordPlaceholder?: string; // Stored hashed/plain for backward compat simple login checks if needed
  createdAt: string;
}

export type EquipmentCategory =
  | "Laboratorium"
  | "Elektronika"
  | "Pengukuran"
  | "Navigasi"
  | "Umum";

export interface Equipment {
  id: string; // Document ID (e.g. ALT-001)
  namaAlat: string;
  kategori: EquipmentCategory;
  stokTotal: number;
  stokTersedia: number;
  urlFoto: string;
  createdAt: string;
}

export type TransactionStatus =
  | "PENDING"
  | "DIPINJAM"
  | "DIKEMBALIKAN"
  | "DITOLAK";

export type KondisiAlat = "BAIK" | "CUKUP" | "RUSAK";

export interface Transaction {
  id: string; // Document ID (e.g. TX-123456)
  nimPeminjam: string;
  namaPeminjam: string;
  idAlat: string;
  namaAlat: string;
  status: TransactionStatus;
  tglPinjam: string; // YYYY-MM-DD
  tglKembali: string; // YYYY-MM-DD
  tglKembaliAktual?: string; // YYYY-MM-DD
  kondisiKembali?: KondisiAlat;
  poinMendapat?: number;
  createdAt: string;
}

export interface Article {
  id: string; // Document ID
  judul: string;
  tanggalTerbit: string; // YYYY-MM-DD
  kontenTeks: string;
  urlCover: string;
  author: string;
  createdAt: string;
}

export type ReportStatus =
  | "DRAFT"
  | "DIAJUKAN_KEPALA_LAB"
  | "DISETUJUI_KEPALA_LAB"
  | "DIVALIDASI_KEPALA_UPA"
  | "DISERAHKAN_REKTORAT";

export interface LabReport {
  id: string;
  tipe: "HARIAN" | "BULANAN" | "TAHUNAN";
  tanggal: string;
  judul: string;
  dibuatOleh: string;
  lab: string;
  status: ReportStatus;
  catatan?: string;
  tanggalDiajukan?: string;
  tanggalDisetujui?: string;
  tanggalDivalidasi?: string;
  tanggalDiserahkan?: string;
  ringkasanAset: {
    totalBaik: number;
    totalCukup: number;
    totalRusak: number;
  };
}

export interface OrgMember {
  id: string; // "kepala_upa", "kepala_lab", "staff_admin", "petugas_lab"
  nama: string;
  jabatan: string;
  urlFoto: string;
  sambutan?: string;
  email?: string;
  phone?: string;
}


# SYLVA-AUDIT-000: INVENTARIS DAN BASELINE PROYEK SYLVALAB

**Tanggal Audit:** 20 Agustus 2026  
**Auditor:** AI Systems Specialist / Codebase Auditor  
**Status Proyek:** BASELINE INITIALIZED  
**Tujuan Dokumen:** Menetapkan baseline faktual kondisi aplikasi SylvaLab Kehutanan Unsulbar sebelum dilakukan audit modular atau refactoring lanjutan.

---

## 1. Ringkasan Eksekutif

Aplikasi **SylvaLab** adalah sistem informasi manajemen inventaris dan administrasi peminjaman alat laboratorium pada Laboratorium Kehutanan UPA Laboratorium Terpadu Universitas Sulawesi Barat (Unsulbar). Aplikasi ini dibangun dengan arsitektur Single Page Application (SPA) berbasis React 19, TypeScript, Tailwind CSS v4, dan Firebase (Cloud Firestore & Firebase Auth).

Secara fungsionalitas UI, aplikasi menyediakan alur peminjaman alat, monitoring pengembalian, kalkulasi gamifikasi *Green Score*, pelaporan berjenjang formal (Harian, Bulanan, Tahunan), manajemen staf laboratorium, dan publikasi warta ilmiah (*CMS Jurnal Kanopi*). 

Namun, dari perspektif arsitektur kode dan keamanan data, audit baseline ini mengidentifikasi beberapa risiko signifikan:
1. **Firestore Security Rules terbuka 100%** (`allow read, write: if true;`), sehingga otorisasi hanya dibatasi di level UI client.
2. **Password pengguna disimpan dalam bentuk teks biasa (plaintext)** pada dokumen Firestore (`passwordPlaceholder`).
3. **Monolitik kode ekstrem** pada komponen `src/components/AdminPanel.tsx` yang mencapai 3.384 baris kode dan merangkap 8 domain bisnis sekaligus.
4. **Dependensi backend tak terpakai** (`express`, `@google/genai`, `tsx`, `esbuild`) terpasang pada proyek SPA murni.

Semua proses verifikasi build dan linting pada baseline ini berjalan **SUKSES** tanpa error kompilasi TypeScript.

---

## 2. Identitas dan Stack Proyek

| Parameter | Spesifikasi Aktual |
| :--- | :--- |
| **Nama Aplikasi** | SylvaLab (Laboratorium Kehutanan Unsulbar) |
| **Framework UI** | React v19.2.7 (`react`, `react-dom`) |
| **Bahasa Pemrograman** | TypeScript v5.8.3 (`tsconfig.json` target ES2022, bundler module resolution) |
| **Build Tool & Bundler** | Vite v6.4.3 (`@vitejs/plugin-react` v5.2.0) |
| **CSS Framework** | Tailwind CSS v4.3.2 (`@tailwindcss/vite` v4.3.2) |
| **Animasi & Transisi** | Motion v12.42.2 (`motion/react`) |
| **Ikonografi** | Lucide React v0.546.0 |
| **Backend & Database** | Google Firebase v12.15.0 (Cloud Firestore & Firebase Authentication) |
| **Port Dev Default** | Port 3000 (bind `0.0.0.0`) |
| **Metadata File** | `metadata.json` (major capability: `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`) |
| **Deployment Target** | Vercel SPA (`vercel.json` rewrites ke `/index.html`) & Google Cloud Run |

### Script npm (`package.json`)
- `dev`: `vite --port=3000 --host=0.0.0.0`
- `build`: `vite build`
- `preview`: `vite preview`
- `clean`: `rm -rf dist server.js`
- `lint`: `tsc --noEmit`

---

## 3. Struktur File dan Direktori

```
.
├── docs/
│   └── audit/
│       └── SYLVA-AUDIT-000-BASELINE.md
├── src/
│   ├── components/
│   │   ├── AboutPage.tsx         (320 baris) - Profil lab, SOP birokrasi, sistem GreenScore
│   │   ├── AdminPanel.tsx        (3.384 baris) - Monolitik dashboard pengelola & staf lab
│   │   ├── Login.tsx             (335 baris) - Login form & animasi visual hutan interaktif
│   │   ├── Navbar.tsx            (368 baris) - Navigasi global, status sesi, menu mobile
│   │   ├── OrganizationPage.tsx  (297 baris) - Visualisasi bagan struktur organisasi lab
│   │   ├── PeminjamPortal.tsx    (662 baris) - Katalog booking alat, keranjang, & riwayat
│   │   └── PublicCatalog.tsx     (452 baris) - Halaman publik, artikel jurnal, & katalog tamu
│   ├── lib/
│   │   ├── db.ts                 (764 baris) - Data access layer, Firestore CRUD & Seeder
│   │   └── firebase.ts           (39 baris)  - Inisialisasi Firebase App, Auth, & Firestore
│   ├── App.tsx                   (174 baris) - Root routing berbasis state `view`
│   ├── index.css                 (202 baris) - Global Tailwind directives & custom CSS keyframes
│   ├── main.tsx                  (10 baris)  - Entry point React DOM render
│   └── types.ts                  (106 baris) - Tipe data TypeScript & enum sistem
├── firebase-applet-config.json   (Firebase project metadata)
├── firebase-blueprint.json       (120 baris) - Skema entitas Firestore
├── firestore.rules               (9 baris)   - Aturan keamanan Cloud Firestore
├── index.html                    (19 baris)  - HTML Template
├── metadata.json                 (7 baris)   - Konfigurasi aplikasi AI Studio
├── package.json                  (37 baris)  - Deklarasi paket dependensi
├── tsconfig.json                 (27 baris)  - Konfigurasi compiler TypeScript
├── vercel.json                   (6 baris)   - Konfigurasi rewrite SPA
└── vite.config.ts                (23 baris)  - Konfigurasi bundler Vite & Tailwind plugin
```

---

## 4. Inventaris Fitur

| No | Fitur | Komponen UI | Fungsi Data (`src/lib/db.ts`) | Koleksi Firestore | Akses Role | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Katalog Publik & Pencarian** | `PublicCatalog.tsx` | `getEquipments()`, `getArticles()` | `equipments`, `articles` | Semua (Tamu/Publik) | Lengkap |
| 2 | **Autentikasi & Login Multi-Role** | `Login.tsx`, `App.tsx` | `loginUser()`, `seedInitialData()` | `users` | Semua pengguna terdaftar | Lengkap (Client-auth) |
| 3 | **Portal Peminjam (Booking Alat)** | `PeminjamPortal.tsx` | `getEquipments()`, `createTransaction()`, `getTransactions()` | `equipments`, `transactions`, `users` | `PEMINJAM` | Lengkap |
| 4 | **Keranjang Pengajuan Peminjaman** | `PeminjamPortal.tsx` (Drawer Cart) | `createTransaction()` | `transactions`, `equipments` | `PEMINJAM` | Lengkap |
| 5 | **Riwayat & Pelacakan Keterlambatan** | `PeminjamPortal.tsx` | `getTransactions()` | `transactions` | `PEMINJAM` | Lengkap |
| 6 | **Sistem Gamifikasi Green Score** | `PeminjamPortal.tsx`, `AdminPanel.tsx` | `returnTransaction()` | `users` | `PEMINJAM`, `PETUGAS_LAB`, `SUPER_ADMIN` | Lengkap |
| 7 | **Antrean Approval Permohonan** | `AdminPanel.tsx` (Tab `permohonan`) | `approveTransaction()`, `rejectTransaction()` | `transactions`, `equipments` | `SUPER_ADMIN`, `KEPALA_LAB_KEHUTANAN`, `PETUGAS_LAB` | Lengkap |
| 8 | **Monitoring & Pengembalian Alat** | `AdminPanel.tsx` (Tab `berjalan`) | `returnTransaction()`, `getTransactions()` | `transactions`, `equipments`, `users` | `SUPER_ADMIN`, `KEPALA_LAB_KEHUTANAN`, `PETUGAS_LAB` | Lengkap |
| 9 | **Manajemen Inventaris Alat (CRUD)** | `AdminPanel.tsx` (Tab `alat`) | `createEquipment()`, `updateEquipment()`, `deleteAlat()` | `equipments` | `SUPER_ADMIN`, `KEPALA_LAB_KEHUTANAN`, `PETUGAS_LAB` | Lengkap |
| 10 | **Manajemen Database Pengguna** | `AdminPanel.tsx` (Tab `users`) | `getUsers()`, `createUser()`, `deleteUser()` | `users` | `SUPER_ADMIN`, `KEPALA_UPA_LAB_TERPADU` | Lengkap |
| 11 | **CMS Jurnal Kanopi (Artikel)** | `AdminPanel.tsx` (Tab `artikel`) | `createArticle()`, `updateArticle()`, `deleteArticle()` | `articles` | `SUPER_ADMIN`, `PETUGAS_LAB` | Lengkap |
| 12 | **Manajemen Struktur Organisasi** | `AdminPanel.tsx` (Tab `organisasi`), `OrganizationPage.tsx` | `getOrgMembers()`, `updateOrgMember()` | `org_members` | `SUPER_ADMIN`, `KEPALA_LAB_KEHUTANAN`, `PETUGAS_LAB` | Lengkap |
| 13 | **Pelaporan Berjenjang & Audit Mode** | `AdminPanel.tsx` (Tab `laporan`) | `getReports()`, `updateReportStatus()` | `reports` | `SUPER_ADMIN`, `KEPALA_UPA_LAB_TERPADU`, `KEPALA_LAB_KEHUTANAN`, `PETUGAS_LAB` | Lengkap |
| 14 | **Cetak Berkas Kop Resmi & Ekspor CSV** | `AdminPanel.tsx` | Browser print DOM, client-side CSV blob generator | Local State / Memory | Pengelola Lab | Lengkap |

---

## 5. Matriks Role dan Hak Akses

Berdasarkan analisis file `src/types.ts`, `src/App.tsx`, dan fungsi `isTabAllowed()` pada `src/components/AdminPanel.tsx`:

| Role | Halaman Utama | Tab Menu Admin yang Diizinkan | Aksi UI yang Dapat Dilakukan | Pembatasan Hanya di UI? | Aturan di Firestore Rules? |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **`SUPER_ADMIN`** | `AdminPanel` | `dashboard`, `permohonan`, `berjalan`, `alat`, `users`, `artikel`, `laporan`, `organisasi` (Semua Tab) | Mengelola seluruh data, approve/reject, CRUD alat, CRUD user, CRUD artikel, ubah status laporan ke rektorat. | **YA** | **TIDAK** (`allow read, write: if true;`) |
| **`KEPALA_UPA_LAB_TERPADU`** | `AdminPanel` | `dashboard`, `users`, `laporan` | Melihat ringkasan lab, validasi laporan ke tahap rektorat, mengelola akun user. | **YA** | **TIDAK** (`allow read, write: if true;`) |
| **`KEPALA_LAB_KEHUTANAN`** | `AdminPanel` | `dashboard`, `permohonan`, `berjalan`, `alat`, `laporan`, `organisasi` | Menyetujui pinjaman, monitor alat, update inventaris, menyetujui draf laporan lab. | **YA** | **TIDAK** (`allow read, write: if true;`) |
| **`PETUGAS_LAB`** | `AdminPanel` | `dashboard`, `permohonan`, `berjalan`, `alat`, `artikel`, `laporan`, `organisasi` | Eksekusi approve/reject transaksi, proses pengembalian alat & input kondisi, input draf laporan harian, tulis artikel. | **YA** | **TIDAK** (`allow read, write: if true;`) |
| **`EDITOR`** | `AdminPanel` | Terdefinisi pada tipe Role, fallback ke `dashboard` saja | Tidak memiliki menu khusus selain dashboard dasar. | **YA** | **TIDAK** (`allow read, write: if true;`) |
| **`PEMINJAM`** | `PeminjamPortal` | Tidak dapat membuka `AdminPanel` | Melihat katalog, menambah ke keranjang, mengajukan peminjaman, melihat status approval & poin Green Score. | **YA** | **TIDAK** (`allow read, write: if true;`) |

> **Catatan Kritis:** Seluruh batas otorisasi di atas saat ini **HANYA diisolasi melalui kondisi React Client Component (`isTabAllowed`, `App.tsx` guards)**. Siapapun yang memiliki akses API Firebase dapat membaca dan menulis dokumen apapun secara langsung karena `firestore.rules` mengizinkan seluruh operasi secara publik.

---

## 6. Peta Koleksi dan Model Data Firestore

### 1. Koleksi `users`
- **Document ID:** `NIM_NIP` (string, contoh: `"12345"`, `"D0521001"`, `"kepala_lab"`)
- **Field & Tipe:**
  - `nim_nip`: `string`
  - `nama`: `string`
  - `role`: `Role` (`"SUPER_ADMIN" | "KEPALA_UPA_LAB_TERPADU" | "KEPALA_LAB_KEHUTANAN" | "PETUGAS_LAB" | "EDITOR" | "PEMINJAM"`)
  - `greenScore`: `number` (default: 100 untuk akun baru via seeder, 0 untuk manual register)
  - `passwordPlaceholder`: `string` (Plaintext password)
  - `uid`: `string` (Firebase Auth UID atau fallback `sylva_fs_{nim}`)
  - `createdAt`: `string` (ISO 8601)
- **Operasi CRUD:** `getUsers()`, `createUser()`, `deleteUser()`, `loginUser()`, `returnTransaction()` (update score).

### 2. Koleksi `equipments`
- **Document ID:** `id` (format: `"ALT-001"`, `"ALT-002"`, dst.)
- **Field & Tipe:**
  - `id`: `string`
  - `namaAlat`: `string`
  - `kategori`: `EquipmentCategory` (`"Laboratorium" | "Elektronika" | "Pengukuran" | "Navigasi" | "Umum"`)
  - `stokTotal`: `number`
  - `stokTersedia`: `number`
  - `urlFoto`: `string` (URL gambar)
  - `createdAt`: `string` (ISO 8601)
- **Operasi CRUD:** `getEquipments()`, `createEquipment()`, `updateEquipment()`, `deleteAlat()`, `approveTransaction()` (decrement stok), `returnTransaction()` (increment stok).

### 3. Koleksi `transactions`
- **Document ID:** `id` (format: `"TX-` + 6 digit timestamp + 2 digit random)
- **Field & Tipe:**
  - `id`: `string`
  - `nimPeminjam`: `string` (relasi ke `users.nim_nip`)
  - `namaPeminjam`: `string` (denormalized dari user)
  - `idAlat`: `string` (relasi ke `equipments.id`)
  - `namaAlat`: `string` (denormalized dari equipment)
  - `status`: `TransactionStatus` (`"PENDING" | "DIPINJAM" | "DIKEMBALIKAN" | "DITOLAK"`)
  - `tglPinjam`: `string` (`YYYY-MM-DD`)
  - `tglKembali`: `string` (`YYYY-MM-DD`)
  - `tglKembaliAktual`: `string` (opsional, `YYYY-MM-DD`)
  - `kondisiKembali`: `KondisiAlat` (opsional, `"BAIK" | "CUKUP" | "RUSAK"`)
  - `poinMendapat`: `number` (opsional)
  - `createdAt`: `string` (ISO 8601)
- **Operasi CRUD:** `getTransactions()`, `createTransaction()`, `approveTransaction()`, `rejectTransaction()`, `returnTransaction()`.

### 4. Koleksi `articles`
- **Document ID:** `id` (format: `"ART-` + 5 digit timestamp)
- **Field & Tipe:**
  - `id`: `string`
  - `judul`: `string`
  - `tanggalTerbit`: `string` (`YYYY-MM-DD`)
  - `kontenTeks`: `string`
  - `urlCover`: `string`
  - `author`: `string`
  - `createdAt`: `string` (ISO 8601)
- **Operasi CRUD:** `getArticles()`, `createArticle()`, `updateArticle()`, `deleteArticle()`.

### 5. Koleksi `reports`
- **Document ID:** `id` (format: `"REP-YYYY-MM-DD"` atau custom ID)
- **Field & Tipe:**
  - `id`: `string`
  - `tipe`: `"HARIAN" | "BULANAN" | "TAHUNAN"`
  - `tanggal`: `string` (`YYYY-MM-DD`)
  - `judul`: `string`
  - `dibuatOleh`: `string`
  - `lab`: `string`
  - `status`: `ReportStatus` (`"DRAFT" | "DIAJUKAN_KEPALA_LAB" | "DISETUJUI_KEPALA_LAB" | "DIVALIDASI_KEPALA_UPA" | "DISERAHKAN_REKTORAT"`)
  - `catatan`: `string` (opsional)
  - `tanggalDiajukan`: `string` (opsional)
  - `tanggalDisetujui`: `string` (opsional)
  - `tanggalDivalidasi`: `string` (opsional)
  - `tanggalDiserahkan`: `string` (opsional)
  - `ringkasanAset`: `object` `{ totalBaik: number, totalCukup: number, totalRusak: number }`
- **Operasi CRUD:** `getReports()`, `createReport()`, `updateReportStatus()`, `seedReports()`.

### 6. Koleksi `org_members`
- **Document ID:** `id` (`"kepala_upa" | "kepala_lab" | "staff_admin" | "petugas_lab"`)
- **Field & Tipe:**
  - `id`: `string`
  - `nama`: `string`
  - `jabatan`: `string`
  - `urlFoto`: `string`
  - `sambutan`: `string` (opsional)
  - `email`: `string` (opsional)
  - `phone`: `string` (opsional)
- **Operasi CRUD:** `getOrgMembers()`, `updateOrgMember()`, `seedOrgMembers()`.

---

## 7. Peta Aliran Data Utama

```
[Pengguna / Mahasiswa]
       │ (1. Login / Registrasi)
       ▼
[Firestore: users] ◄─── (Validasi Password & UID)
       │
       ├─────────────────────────────────────────┐
       ▼ (2. Pilih Alat & Checkout)              ▼ (4. Pengembalian Alat)
[Firestore: transactions (PENDING)]       [Petugas Input Kondisi Alat]
       │                                         │
       ▼ (3. Approval oleh Staf Lab)             ▼ (Kalkulasi Skor)
[Update status: DIPINJAM]                 [Update status: DIKEMBALIKAN]
[Decrement equipments.stokTersedia]       [Increment equipments.stokTersedia]
                                          [Update users.greenScore (+15/+12/+2, -5 late)]
```

### Alur Pelaporan Berjenjang (*Hierarchical Audit Flow*):
1. **Penyusunan Draf (`DRAFT`)**: Dibuat oleh Petugas Lab Lapangan.
2. **Pengajuan ke Kepala Lab (`DIAJUKAN_KEPALA_LAB`)**: Notifikasi diteruskan ke Kepala Lab Kehutanan.
3. **Persetujuan Tingkat Lab (`DISETUJUI_KEPALA_LAB`)**: Disahkan oleh Kepala Lab Kehutanan.
4. **Validasi Universitas (`DIVALIDASI_KEPALA_UPA`)**: Divalidasi oleh Kepala UPA Laboratorium Terpadu.
5. **Penyerahan Eksekutif (`DISERAHKAN_REKTORAT`)**: Laporan difinalisasi untuk arsip Rektorat Unsulbar & Kesiapan Audit BAN-PT/BPK.

---

## 8. Statistik Ukuran File dan Modularitas

| File Source | Jumlah Baris | Ukuran Karakter | Evaluasi Kompleksitas & Modularitas |
| :--- | :---: | :---: | :--- |
| `src/components/AdminPanel.tsx` | **3.384** | ~175 KB | **Sangat Kritis (Monolitik)**. Menggabungkan visual dashboard, 7 sub-layar modal, tabel inventaris, CSV exporter, print layout KOP dinas, chart simulasi, dan state management lokal dalam 1 file. |
| `src/lib/db.ts` | **764** | ~25 KB | **Tinggi**. Menggabungkan 6 domain entitas Firestore, integrasi Auth, algoritma kalkulasi Green Score, dan 4 fungsi seeder ke dalam 1 file tunggal. |
| `src/components/PeminjamPortal.tsx` | **662** | ~29 KB | **Sedang-Tinggi**. Menggabungkan katalog peminjam, drawer keranjang, modal detail alat, dan riwayat transaksi. |
| `src/components/PublicCatalog.tsx` | **452** | ~20 KB | **Sedang**. Mengelola hero section, katalog publik, dan modal baca artikel jurnal. |
| `src/components/Navbar.tsx` | **368** | ~16 KB | **Sedang**. Mengelola navigasi desktop, banner indikator role, dan drawer mobile menu. |
| `src/components/Login.tsx` | **335** | ~18 KB | **Sedang**. Mengelola form autentikasi dan animasi SVG forest & fireflies particles. |
| `src/components/AboutPage.tsx` | **320** | ~15 KB | **Terisolasi Baik**. Halaman statis informasi profil dan SOP. |
| `src/components/OrganizationPage.tsx` | **297** | ~15 KB | **Terisolasi Baik**. Bagan hierarki organisasi laboratorium. |
| `src/index.css` | **202** | ~7 KB | Styling Tailwind directives dan custom keyframes animation. |
| `src/App.tsx` | **174** | ~5.4 KB | Root routing switch view sederhana. |
| `src/types.ts` | **106** | ~2.3 KB | Interface TypeScript terpusat. |
| `src/lib/firebase.ts` | **39** | ~1.4 KB | Inisialisasi Firebase App. |
| `src/main.tsx` | **10** | ~0.3 KB | DOM mount React. |

---

## 9. Hasil Install, Lint, dan Build

Pemeriksaan kualitas non-destruktif dijalankan pada workspace:

### 1. `npm run lint` (`tsc --noEmit`)
- **Status:** **BERHASIL (0 Error)**
- **Output:**
  ```bash
  > react-example@0.0.0 lint
  > tsc --noEmit
  # Selesai tanpa ada komplain tipe TypeScript
  ```

### 2. `npm run build` (`vite build`)
- **Status:** **BERHASIL (Production bundle tercipta)**
- **Output Log:**
  ```text
  vite v6.4.3 building for production...
  transforming...
  ✓ 2106 modules transformed.
  rendering chunks...
  computing gzip size...
  dist/index.html                     0.41 kB │ gzip:   0.28 kB
  dist/assets/index-CaCenyYj.css     81.69 kB │ gzip:  12.74 kB
  dist/assets/index-CzViTwiX.js   1,602.28 kB │ gzip: 395.59 kB
  ✓ built in 9.36s
  ```
- **Peringatan Bundler:** Chunk JS melebihi 500 kB (1.6 MB uncompressed) karena seluruh kode komponen (`AdminPanel.tsx`, Firebase SDK, Motion, Lucide icons) dibundel dalam satu single bundle tanpa dynamic `import()` code-splitting.

---

## 10. Temuan Terverifikasi

### Temuan 1: Firestore Security Rules Terbuka Penuh
- **ID:** AUDIT-000-F01
- **Tingkat:** **KRITIS**
- **Status:** **TERBUKTI**
- **Lokasi:** `firestore.rules`, baris 4–6
- **Bukti:**
  ```javascript
  match /{document=**} {
    allow read, write: if true;
  }
  ```
- **Dampak:** Siapapun di internet yang memiliki Firebase config dapat membaca, mengubah, dan menghapus seluruh database (`users`, `transactions`, `equipments`, `reports`, `articles`) secara langsung tanpa autentikasi.
- **Rekomendasi Audit Lanjutan:** Prioritas audit perancangan Firestore Rules berbasis Role & Auth UID pada audit keamanan.
- **Implementasi Dilakukan:** TIDAK.

---

### Temuan 2: Password Disimpan dalam Bentuk Plaintext di Dokumen Firestore
- **ID:** AUDIT-000-F02
- **Tingkat:** **KRITIS**
- **Status:** **TERBUKTI**
- **Lokasi:** `src/types.ts` (baris 15), `src/lib/db.ts` (baris 111, 149, 259, 322)
- **Bukti:** Field `passwordPlaceholder` pada dokumen Firestore `users/{nim}` menyimpan password akun secara mentah (misal: `"admin123"`, `"12345"`).
- **Dampak:** Pelanggaran privasi dan keamanan akun. Mengingat Firestore rules terbuka, seluruh password pengguna dapat terbaca secara bebas.
- **Rekomendasi Audit Lanjutan:** Migrasi penuh ke Firebase Authentication hashing/token dan penghapusan field plaintext password dari dokumen publik.
- **Implementasi Dilakukan:** TIDAK.

---

### Temuan 3: Monolitik Ekstrem pada Komponen `AdminPanel.tsx` (3.384 Baris)
- **ID:** AUDIT-000-F03
- **Tingkat:** **TINGGI**
- **Status:** **TERBUKTI**
- **Lokasi:** `src/components/AdminPanel.tsx` (Baris 1–3.384)
- **Bukti:** Satu file berukuran ~175 KB memuat 8 tab navigasi utama, 6 dialog modal CRUD, layout cetak surat dinas, logic kalkulasi audit, serta manipulasi state secara bercampur aduk.
- **Dampak:** Risiko tinggi token limit cutoff saat modifikasi, sulit di-maintain, rentan *race condition*, dan memperlambat waktu kompilasi UI.
- **Rekomendasi Audit Lanjutan:** Pemecahan modular ke dalam sub-komponen terpisah (`src/components/admin/tabs/*` dan `src/components/admin/modals/*`).
- **Implementasi Dilakukan:** TIDAK.

---

### Temuan 4: Mekanisme Login Fallback Mengabaikan Autentikasi Kredensial Firebase
- **ID:** AUDIT-000-F04
- **Tingkat:** **TINGGI**
- **Status:** **TERBUKTI**
- **Lokasi:** `src/lib/db.ts`, baris 269–289 (`loginUser`)
- **Bukti:** Jika `signInWithEmailAndPassword` gagal atau dinonaktifkan, sistem menangkap catch block lalu tetap memberikan akses login berhasil jika password cocok dengan `passwordPlaceholder` di Firestore document.
- **Dampak:** Sesi pengguna hanya bergantung pada `sessionStorage` lokal tanpa verifikasi token JWT/Auth State dari server Firebase.
- **Rekomendasi Audit Lanjutan:** Sinkronisasi konsisten antara Firebase Auth User state dengan Firestore User Profile.
- **Implementasi Dilakukan:** TIDAK.

---

### Temuan 5: Ketidaksinkronan Skema Antara `firebase-blueprint.json` dan `src/types.ts`
- **ID:** AUDIT-000-F05
- **Tingkat:** **SEDANG**
- **Status:** **TERBUKTI**
- **Lokasi:** `firebase-blueprint.json` vs `src/types.ts`
- **Bukti:** Pada `firebase-blueprint.json`, field `User` mendefinisikan `NIM_NIP` (huruf kapital), sedangkan di TypeScript dan database menggunakan `nim_nip` (huruf kecil). Selain itu entitas `org_members` tidak terdaftar di `firebase-blueprint.json`.
- **Dampak:** Inkonsistensi dokumentasi skema jika dilakukan ekspor atau validasi otomatis rules berbasis blueprint.
- **Rekomendasi Audit Lanjutan:** Standarisasi blueprint agar 100% selaras dengan implementasi aktual.
- **Implementasi Dilakukan:** TIDAK.

---

### Temuan 6: Hardcoded Seeding Credentials & Roles pada Runtime Client
- **ID:** AUDIT-000-F06
- **Tingkat:** **SEDANG**
- **Status:** **TERBUKTI**
- **Lokasi:** `src/lib/db.ts`, baris 105–173 (`seedInitialData`)
- **Bukti:** Akun administratif (Super Admin, Kepala Lab, Kepala UPA) beserta password default tertanam langsung di dalam kode JavaScript bundle client.
- **Dampak:** Kredensial bawaan dapat diinspeksi oleh siapa saja melalui DevTools browser.
- **Rekomendasi Audit Lanjutan:** Pemisahan seeder ke administrative script khusus atau backend trigger.
- **Implementasi Dilakukan:** TIDAK.

---

### Temuan 7: Role `EDITOR` Belum Memiliki Fungsionalitas Mandiri
- **ID:** AUDIT-000-F07
- **Tingkat:** **RENDAH**
- **Status:** **TERBUKTI**
- **Lokasi:** `src/types.ts` (baris 6), `src/components/AdminPanel.tsx` (baris 66–78)
- **Bukti:** Role `EDITOR` terdapat di union tipe `Role`, namun pada `isTabAllowed()` role ini hanya mendapatkan fallback ke `dashboard` dan tidak diberikan izin untuk tab `artikel`.
- **Dampak:** Pengguna dengan role `EDITOR` tidak dapat menjalankan fungsi editing artikel jurnal di UI.
- **Rekomendasi Audit Lanjutan:** Penyesuaian izin `isTabAllowed("artikel", "EDITOR")` atau konsolidasi role jika tidak digunakan.
- **Implementasi Dilakukan:** TIDAK.

---

### Temuan 8: Dependensi Server Tak Terpakai pada Proyek SPA
- **ID:** AUDIT-000-F08
- **Tingkat:** **INFORMASI**
- **Status:** **TERBUKTI**
- **Lokasi:** `package.json`, baris 14, 17, 18, 27, 28, 30, 32
- **Bukti:** Paket `express`, `@types/express`, `@google/genai`, `dotenv`, `tsx`, dan `esbuild` terdaftar di dependencies, padahal aplikasi berjalan sebagai Client-side SPA melalui Vite.
- **Dampak:** Menambah ukuran `node_modules` dan waktu instalasi dependency, meskipun tidak mempengaruhi runtime frontend.
- **Rekomendasi Audit Lanjutan:** Pembersihan dependensi yang tidak relevan jika diputuskan tetap sebagai SPA murni.
- **Implementasi Dilakukan:** TIDAK.

---

## 11. Hal yang Memerlukan Verifikasi Runtime

1. **Sinkronisasi Otentikasi Firebase Auth vs Firestore:** Apakah token refresh Firebase Auth tetap aktif saat pengguna berganti perangkat atau tab browser ditutup dalam durasi lama.
2. **Kuota Operasi Firestore pada Akses Simultan:** Pemeriksaan apakah `getDocs` yang dipanggil pada setiap pergantian tab/refresh dapat memicu latensi tinggi jika jumlah transaksi melonjak.
3. **Dampak Pemblokiran Cookie Pihak Ketiga:** Memastikan iframe preview AI Studio tidak memblokir local storage atau session storage pada browser Safari/iOS.

---

## 12. Risiko Awal

1. **Risiko Keamanan Data (Kritis):** Firestore Rules terbuka memungkinkan manipulasi data inventaris, approval fiktif, atau penghapusan data secara destruktif oleh pihak luar.
2. **Risiko Pemeliharaan Kode (Tinggi):** Berkas `AdminPanel.tsx` yang sangat besar (3.384 baris) menghambat kecepatan perbaikan bug dan berisiko tinggi menghasilkan konflik kode.
3. **Risiko Privasi Pengguna (Tinggi):** Penyimpanan password secara plaintext melanggar standar kepatuhan pengelolaan data akademik kampus.
4. **Risiko Kinerja Bundling (Sedang):** Ukuran bundle JavaScript utama (~1.6 MB) memperlambat waktu buka pertama (*First Contentful Paint*) pada koneksi seluler lambat.
5. **Risiko Kehilangan Sesi (Rendah-Sedang):** Penggunaan `sessionStorage` menyebabkan data login hilang saat tab browser ditutup.

---

## 13. Rekomendasi Urutan Audit Berikutnya

Berdasarkan temuan baseline, disarankan urutan tahapan audit berikutnya adalah:

1. **SYLVA-AUDIT-001 — Audit Keamanan & Firestore Rules:** Memperketat `firestore.rules` berbasis role token dan merumuskan skema sanitasi password plaintext.
2. **SYLVA-AUDIT-002 — Audit Modularitas & Refactoring AdminPanel:** Memecah komponen raksasa 3.384 baris menjadi modul-modul independen per domain fitur.
3. **SYLVA-AUDIT-003 — Audit Data Access Layer & State Management:** Mengoptimalkan fungsi-fungsi pada `src/lib/db.ts`, caching data, dan penanganan error terpusat.
4. **SYLVA-AUDIT-004 — Audit Integritas Bisnis & Gamifikasi Green Score:** Memvalidasi logika penalti keterlambatan, pengembalian alat, dan alur persetujuan bertingkat.

---

## 14. Daftar File yang Diperiksa

- `/package.json`
- `/firestore.rules`
- `/firebase-blueprint.json`
- `/metadata.json`
- `/tsconfig.json`
- `/vite.config.ts`
- `/vercel.json`
- `/src/main.tsx`
- `/src/App.tsx`
- `/src/types.ts`
- `/src/index.css`
- `/src/lib/firebase.ts`
- `/src/lib/db.ts`
- `/src/components/Login.tsx`
- `/src/components/Navbar.tsx`
- `/src/components/PublicCatalog.tsx`
- `/src/components/PeminjamPortal.tsx`
- `/src/components/AdminPanel.tsx`
- `/src/components/AboutPage.tsx`
- `/src/components/OrganizationPage.tsx`

---

## 15. Pernyataan Penutup

Dokumen audit ini dibuat secara murni berdasarkan observasi dan eksekusi non-destruktif terhadap kode sumber aktual di workspace. **Tidak ada satu baris pun kode implementasi aplikasi, aturan keamanan, maupun dependensi yang diubah, dihapus, atau dimodifikasi selama pelaksanaan task ini.** Baseline proyek SylvaLab telah resmi tercatat dan siap menjadi acuan audit modular berikutnya.

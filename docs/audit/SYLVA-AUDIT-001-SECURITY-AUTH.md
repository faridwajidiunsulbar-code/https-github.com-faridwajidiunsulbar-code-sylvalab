# SYLVA-AUDIT-001: AUDIT KEAMANAN, FIRESTORE RULES, DAN AUTENTIKASI

**Tanggal Audit:** 20 Agustus 2026  
**Auditor:** AI Systems Specialist / Codebase Security Auditor  
**Status Proyek:** SECURITY AUDIT COMPLETED (NO CODE MODIFIED)  
**Referensi Baseline:** `docs/audit/SYLVA-AUDIT-000-BASELINE.md`

---

## 1. Ringkasan Eksekutif

Audit keamanan mendalam terhadap aplikasi **SylvaLab (Laboratorium Kehutanan Unsulbar)** mengonfirmasi kerentanan arsitektural level **KRITIS** pada tiga fondasi utama:
1. **Firestore Security Rules Terbuka 100%** (`allow read, write: if true;`), membuat seluruh data universitas dapat dibaca, dimanipulasi, atau dihapus oleh siapapun tanpa otorisasi.
2. **Penyimpanan Kredensial Plaintext** (`passwordPlaceholder`), di mana kata sandi pengguna dikirim dan diverifikasi secara mentah di browser client.
3. **Session Management Tanpa Integritas Kriptografis** (`sessionStorage`), di mana hak akses administratif dapat dibajak (*role escalation*) hanya dengan mengedit string JSON lokal di DevTools peramban.
4. **Ketiadaan Transaksi Atomik Database**, memicu risiko *race condition* stok alat, tabrakan ID (*ID collision*), inkonsistensi poin *Green Score*, dan rekaman yatim (*orphan records*).

Audit ini menyajikan analisis akar masalah, bukti kode (*code proof*), pemetaan matriks izin granular (*least privilege*), rancangan aturan keamanan Firestore target (*declarative security rules*), dan strategi migrasi 4-fase yang aman tanpa risiko *lockout* atau kehilangan data historis.

---

## 2. Model Ancaman SylvaLab (*Threat Modeling*)

Model ancaman SylvaLab dianalisis menggunakan metodologi **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) yang disesuaikan dengan konteks laboratorium universitas:

```
                      ┌───────────────────────────────────────────┐
                      │             PERIMETER INTERNET            │
                      └─────────────────────┬─────────────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
    [Penyerang Luar / Anonim]                               [Mahasiswa Nakal / Peminjam]
      - Dump seluruh DB via SDK                               - Spoof Role ke SUPER_ADMIN
      - Baca password civitas lab                             - Auto-approve peminjaman
      - Hapus inventaris & artikel                            - Manipulasi Green Score ke 999
               │                                                         │
               └────────────────────────────┬────────────────────────────┘
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │           CLIENT RUNTIME (Vite)         │
                       │ - Plaintext password di Memory          │
                       │ - sessionStorage "sylvalab_user"        │
                       │ - Local state guards (isTabAllowed)     │
                       └────────────────────┬────────────────────┘
                                            │ (Direct Firestore SDK API)
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │      CLOUD FIRESTORE (ai-studio-*)      │
                       │  Rules: match /{document=**} { if true }│
                       │  - users        - transactions          │
                       │  - equipments   - reports               │
                       │  - articles     - org_members           │
                       └─────────────────────────────────────────┘
```

### Vektor Ancaman Utama:
1. **Anonim (Unauthenticated External Threat):** Membaca kredensial dosen/staf dari `users`, merusak laporan audit rektorat di `reports`, atau menghapus koleksi `equipments`.
2. **Mahasiswa / Peminjam (Authenticated Malicious Insider):** Mengubah poin `greenScore` sendiri, menyetujui transaksi peminjaman sendiri tanpa izin laboran, atau mereset denda keterlambatan.
3. **Penyusupan Akun Staf (Account Takeover):** Menggunakan kredensial bawaan (*hardcoded seed*) untuk mengubah struktur organisasi dan memalsukan tanda tangan digital laporan audit BAN-PT.

---

## 3. Audit Autentikasi Rinci

Berdasarkan inspeksi langsung pada `src/components/Login.tsx`, `src/App.tsx`, `src/lib/db.ts`, dan `src/lib/firebase.ts`, berikut adalah temuan faktual atas 10 pertanyaan audit wajib:

### 1. Apakah pengguna dapat dianggap login tanpa Firebase Auth?
* **Jawaban:** **YA (TERBUKTI)**
* **Bukti Kode:** `src/lib/db.ts` baris 279–289:
  ```typescript
  } catch (err: any) {
    console.warn("Firebase Auth synchronization failed/disabled, falling back to Firestore-only session:", err.message);
    if (!profile.uid) {
      const fallbackUid = `sylva_fs_${cleanNim}`;
      await updateDoc(userDocRef, { uid: fallbackUid });
      profile.uid = fallbackUid;
    }
  }
  return profile;
  ```
* **Analisis:** Jika `signInWithEmailAndPassword` gagal (misal koneksi bermasalah atau email belum ada di Auth), sistem tetap mengembalikan objek `profile` ke `App.tsx` dan memasukkannya ke `sessionStorage`. Pengguna masuk ke sistem tanpa token JWT Firebase yang valid.

---

### 2. Apakah sessionStorage dapat dimanipulasi untuk mengganti role?
* **Jawaban:** **YA (TERBUKTI)**
* **Bukti Kode:** `src/App.tsx` baris 24–38:
  ```typescript
  const cachedUser = sessionStorage.getItem("sylvalab_user");
  if (cachedUser) {
    const parsed = JSON.parse(cachedUser) as UserProfile;
    setUser(parsed);
    if (parsed.role === "PEMINJAM") {
      setView("peminjam");
    } else {
      setView("admin");
    }
  }
  ```
* **Analisis:** Komponen `App.tsx` mempercayai 100% isi `sessionStorage` tanpa mencocokkan kembali ke database atau memvalidasi claims token Firebase Auth. Pengguna dapat membuka DevTools Console dan mengeksekusi:
  `sessionStorage.setItem("sylvalab_user", JSON.stringify({nim_nip:"hacker", nama:"Hacker", role:"SUPER_ADMIN", greenScore:100, uid:"fake"})); location.reload();`
  dan aplikasi akan langsung membuka seluruh menu `AdminPanel` dengan hak akses penuh.

---

### 3. Apakah refresh halaman memverifikasi ulang token?
* **Jawaban:** **TIDAK (TERBUKTI)**
* **Bukti Kode:** `src/App.tsx` baris 19–39 (`useEffect`).
* **Analisis:** Saat halaman di-refresh, aplikasi tidak memanggil `onAuthStateChanged(auth)` atau `auth.currentUser.getIdToken()`. Sesi hanya dibangkitkan dari parsing string JSON di `sessionStorage`. Jika akun pengguna sudah dihapus atau dinonaktifkan di Firebase, pengguna tetap memiliki akses di browser selama `sessionStorage` belum dibersihkan.

---

### 4. Apakah logout membersihkan sesi lokal dan Firebase Auth?
* **Jawaban:** **PARSIAL / TIDAK SEMPURNA (TERBUKTI)**
* **Bukti Kode:** `src/App.tsx` baris 53–59 vs `src/lib/db.ts` baris 294–300:
  ```typescript
  // src/App.tsx
  const handleLogout = () => {
    sessionStorage.removeItem("sylvalab_user");
    setUser(null);
    setCartCount(0);
    setIsOpenCart(false);
    setView("public");
  };
  ```
* **Analisis:** Fungsi `handleLogout` di `App.tsx` yang dipasang pada tombol Logout di Navbar dan AdminPanel **sama sekali tidak memanggil `logoutUser()`** (`signOut(auth)`). Sesi lokal di `sessionStorage` terhapus, namun sesi Firebase Auth di background peramban (`IndexedDB` Firebase) tetap berstatus aktif (*persisted*).

---

### 5. Apakah profil dari Firestore dipercaya tanpa verifikasi identitas?
* **Jawaban:** **YA (TERBUKTI)**
* **Bukti Kode:** `src/lib/db.ts` baris 250–263:
  ```typescript
  const userDocRef = doc(db, "users", cleanNim);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) throw new Error("User tidak terdaftar.");
  const profile = userDoc.data() as UserProfile;
  const expectedPassword = profile.passwordPlaceholder || "12345";
  if (cleanPass !== expectedPassword) throw new Error("Password salah.");
  ```
* **Analisis:** Verifikasi identitas dilakukan murni dengan perbandingan string di memori JavaScript browser client (`cleanPass !== expectedPassword`). Tidak ada hashing (bcrypt/argon2) atau verifikasi kriptografis server-side.

---

### 6. Apakah password dibaca langsung oleh browser?
* **Jawaban:** **YA (TERBUKTI)**
* **Bukti Kode:** `src/lib/db.ts` baris 258–260 dan `src/lib/db.ts` baris 303–307 (`getUsers()`):
  ```typescript
  export async function getUsers(): Promise<UserProfile[]> {
    const coll = collection(db, "users");
    const snap = await getDocs(coll);
    return snap.docs.map(d => d.data() as UserProfile);
  }
  ```
* **Analisis:** Seluruh dokumen `users` (termasuk field `passwordPlaceholder`) diunduh secara transparan ke browser. Setiap pengguna yang memanggil `getUsers()` atau melakukan query Firestore langsung dapat melihat kata sandi seluruh mahasiswa, staf, Kepala Lab, dan Super Admin dalam bentuk teks biasa (*plaintext*).

---

### 7. Apakah createUserWithEmailAndPassword mengubah sesi admin menjadi akun baru?
* **Jawaban:** **YA (TERBUKTI)**
* **Bukti Kode:** `src/lib/db.ts` baris 329–334 (`createUser`):
  ```typescript
  try {
    const email = getEmailForNim(nim);
    await createUserWithEmailAndPassword(auth, email, pass || "12345");
  } catch (e) { ... }
  ```
* **Analisis:** Pada Firebase Web Client SDK, pemanggilan `createUserWithEmailAndPassword` pada instance client aktif secara otomatis melakukan login sebagai pengguna yang baru saja dibuat. Jika seorang Super Admin membuatkan akun mahasiswa melalui Admin Panel, sesi auth admin pada instance SDK client tersebut seketika tertimpa oleh sesi mahasiswa baru tersebut.

---

### 8. Apakah terdapat mekanisme pemulihan password?
* **Jawaban:** **TIDAK (TERBUKTI)**
* **Bukti Kode:** Tidak ada pemanggilan fungsi `sendPasswordResetEmail` dari `firebase/auth` di seluruh workspace (`Login.tsx`, `App.tsx`, `db.ts`, `AdminPanel.tsx`).
* **Analisis:** Jika pengguna lupa kata sandi, tidak ada prosedur reset mandiri berbasis email. Pengguna harus meminta Super Admin mengedit field `passwordPlaceholder` di database.

---

### 9. Apakah akun dapat dihapus dari Firestore tetapi tetap ada di Firebase Auth?
* **Jawaban:** **YA (TERBUKTI)**
* **Bukti Kode:** `src/lib/db.ts` baris 339–341:
  ```typescript
  export async function deleteUser(nim: string) {
    await deleteDoc(doc(db, "users", nim));
  }
  ```
* **Analisis:** Fungsi `deleteUser` hanya menghapus dokumen di Cloud Firestore. Akun kredensial email di Firebase Authentication tidak terhapus. Akibatnya, jika admin mencoba mendaftarkan kembali NIM yang sama di kemudian hari, `createUserWithEmailAndPassword` akan gagal dengan kode error `auth/email-already-in-use`.

---

### 10. Apakah uid Firestore selalu sama dengan Firebase Auth UID?
* **Jawaban:** **TIDAK (TERBUKTI)**
* **Bukti Kode:** `src/lib/db.ts` baris 150 (`uid: ""`), baris 285 (`uid = 'sylva_fs_${cleanNim}'`), dan baris 276 (`uid = authUser.uid`).
* **Analisis:** Dokumen yang dibuat oleh seeder memiliki `uid` kosong (`""`). Pengguna yang gagal sinkronisasi Auth memiliki `uid` buatan (`sylva_fs_...`). Hanya pengguna yang sukses Auth memiliki Firebase UID asli (`28 karakter acak`). Ketiadaan konsistensi ini membuat relasi berbasis `request.auth.uid` di Firestore Rules menjadi tidak berfungsi tanpa migrasi menyeluruh.

---

## 4. Audit Manajemen Sesi

| Karakteristik Sesi | Implementasi Saat Ini | Status Risiko | Dampak Nyata |
| :--- | :--- | :---: | :--- |
| **Media Penyimpanan Sesi** | `sessionStorage.getItem("sylvalab_user")` | **KRITIS** | Data sesi hilang jika tab ditutup, tetapi sangat rentan terhadap manipulasi manual via DevTools Console. |
| **Validasi Integritas State** | Tidak ada signature / JWT check | **KRITIS** | Mengubah field `"role": "SUPER_ADMIN"` pada JSON lokal langsung memberikan akses ke seluruh tab dan fitur sensitif. |
| **Pembersihan Sesi Logout** | Hanya menghapus key `sylvalab_user` di storage | **TINGGI** | Sesi Firebase Auth di layer background SDK tidak pernah di-`signOut`, meninggalkan token aktif di browser publik/laboratorium. |
| **Masa Berlaku Sesi (Expiry)** | Tidak ada expiration timestamp | **SEDANG** | Data sesi di `sessionStorage` bertahan tanpa batas waktu hingga tab peramban ditutup secara manual. |
| **Sinkronisasi Multi-Tab** | Terisolasi per tab (`sessionStorage`) | **SEDANG** | Login di satu tab tidak merefleksikan sesi di tab lain, membingungkan staf saat membuka multi-jendela. |

---

## 5. Matriks Role dan Izin (*Least Privilege Matrix*)

Matriks di bawah ini memetakan izin aktual vs izin ideal yang wajib diterapkan:

| Koleksi | Operasi | Role yang Diizinkan (Kondisi Ideal) | Status Saat Ini di Firestore Rules | Field Terlarang untuk Diubah Client |
| :--- | :---: | :--- | :---: | :--- |
| **`users`** | `list` | `SUPER_ADMIN`, `KEPALA_UPA_LAB_TERPADU` | **Semua Orang (Publik)** | Seluruh dokumen |
| | `get` | Pemilik Akun (`auth.uid == resource.data.uid`), Admin | **Semua Orang (Publik)** | - |
| | `create` | `SUPER_ADMIN`, `KEPALA_UPA_LAB_TERPADU` (atau Self-Registration Mahasiswa dengan role terkunci `PEMINJAM`) | **Semua Orang (Publik)** | Field `role`, `greenScore`, `passwordPlaceholder` |
| | `update` | `SUPER_ADMIN` (semua field); Pemilik Akun (hanya profil non-privilege: nama, no hp) | **Semua Orang (Publik)** | `role`, `greenScore`, `nim_nip`, `uid` (dilarang diubah oleh `PEMINJAM`) |
| | `delete` | `SUPER_ADMIN` | **Semua Orang (Publik)** | - |
| **`equipments`** | `list` / `get` | **Publik (Semua Pengguna & Tamu)** | **Semua Orang (Publik)** | - |
| | `create` / `delete` | `SUPER_ADMIN`, `KEPALA_LAB_KEHUTANAN`, `PETUGAS_LAB` | **Semua Orang (Publik)** | - |
| | `update` | Staf Pengelola Lab (update katalog); Sistem/Staf (update stok) | **Semua Orang (Publik)** | Dilarang diubah langsung oleh `PEMINJAM` |
| **`transactions`** | `list` | Staf Pengelola Lab (semua transaksi); `PEMINJAM` (hanya transaksinya sendiri: `nimPeminjam == user.nim`) | **Semua Orang (Publik)** | - |
| | `get` | Staf Pengelola Lab & Pemilik Transaksi | **Semua Orang (Publik)** | - |
| | `create` | `PEMINJAM` (dengan `status: "PENDING"`, `nimPeminjam` valid milik sendiri) | **Semua Orang (Publik)** | Dilarang membuat langsung dengan status `"DIPINJAM"` / `"DIKEMBALIKAN"` |
| | `update` | Staf Pengelola Lab (mengubah status ke `"DIPINJAM"`, `"DIKEMBALIKAN"`, `"DITOLAK"`, input kondisi & denda) | **Semua Orang (Publik)** | `PEMINJAM` dilarang mengubah status atau memalsukan tanggal kembali |
| | `delete` | `SUPER_ADMIN` (Arsip) | **Semua Orang (Publik)** | Dilarang dihapus oleh `PEMINJAM` |
| **`articles`** | `list` / `get` | **Publik (Semua Pengguna & Tamu)** | **Semua Orang (Publik)** | - |
| | `create` / `update` / `delete` | `SUPER_ADMIN`, `PETUGAS_LAB`, `EDITOR` | **Semua Orang (Publik)** | Dilarang dimodifikasi oleh `PEMINJAM` / Tamu |
| **`reports`** | `list` / `get` | Staf Pengelola Lab (`SUPER_ADMIN`, `KEPALA_UPA_LAB_TERPADU`, `KEPALA_LAB_KEHUTANAN`, `PETUGAS_LAB`) | **Semua Orang (Publik)** | `PEMINJAM` / Tamu dilarang membaca laporan audit internal |
| | `create` | `PETUGAS_LAB`, `SUPER_ADMIN` (status awal `"DRAFT"` / `"DIAJUKAN_KEPALA_LAB"`) | **Semua Orang (Publik)** | - |
| | `update` | Bertingkat sesuai hierarki: `KEPALA_LAB` (ke `"DISETUJUI"`), `KEPALA_UPA` (ke `"DIVALIDASI"`), `SUPER_ADMIN` (ke `"DISERAHKAN_REKTORAT"`) | **Semua Orang (Publik)** | Dilarang melompati tahapan (*status jump bypass*) |
| | `delete` | `SUPER_ADMIN` | **Semua Orang (Publik)** | - |
| **`org_members`** | `list` / `get` | **Publik (Semua Pengguna & Tamu)** | **Semua Orang (Publik)** | - |
| | `update` / `create` / `delete` | `SUPER_ADMIN`, `KEPALA_LAB_KEHUTANAN` | **Semua Orang (Publik)** | Dilarang diubah oleh `PEMINJAM` / Tamu |

---

## 6. Audit Firestore Rules dan Spesifikasi Target

### Kondisi Aktual:
File `firestore.rules` saat ini hanya berisi:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Spesifikasi Desain Target (*Security Rules Specification Blueprint*):
Untuk mengamankan database tanpa memutus fungsionalitas, rules target harus dibangun dengan prinsip **Default Deny** dan fungsi pembantu (*helper functions*):

```javascript
// PSEUDOCODE / RANCANGAN TARGET RULES (UNTUK TAHAP IMPLEMENTASI NANTI)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── HELPER FUNCTIONS ──
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function hasRole(role) {
      return isAuthenticated() && getUserData().role == role;
    }

    function isLabStaff() {
      return isAuthenticated() && (
        getUserData().role in ['SUPER_ADMIN', 'KEPALA_UPA_LAB_TERPADU', 'KEPALA_LAB_KEHUTANAN', 'PETUGAS_LAB']
      );
    }

    function isOwner(nim) {
      return isAuthenticated() && (
        getUserData().nim_nip == nim || request.auth.uid == resource.data.uid
      );
    }

    // ── KOLEKSI USERS ──
    match /users/{userId} {
      // Publik/Peminjam tidak boleh membaca seluruh daftar user
      allow read: if isLabStaff() || (isAuthenticated() && request.auth.uid == userId);
      // Pembuatan user dibatasi staf admin
      allow create: if isLabStaff() || (isAuthenticated() && request.auth.uid == userId && request.resource.data.role == 'PEMINJAM');
      // Update role & greenScore hanya boleh oleh staf lab
      allow update: if isLabStaff() || (
        isAuthenticated() && request.auth.uid == userId &&
        request.resource.data.role == resource.data.role &&
        request.resource.data.greenScore == resource.data.greenScore
      );
      allow delete: if hasRole('SUPER_ADMIN');
    }

    // ── KOLEKSI EQUIPMENTS ──
    match /equipments/{equipmentId} {
      allow read: if true; // Publik katalog
      allow create, delete: if isLabStaff();
      allow update: if isLabStaff() || (
        // Mengizinkan peminjaman mengurangi/menambah stok hanya melalui transaksi valid
        isAuthenticated() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['stokTersedia'])
      );
    }

    // ── KOLEKSI TRANSACTIONS ──
    match /transactions/{txId} {
      allow read: if isLabStaff() || (isAuthenticated() && resource.data.nimPeminjam == getUserData().nim_nip);
      allow create: if isAuthenticated() && 
                    request.resource.data.nimPeminjam == getUserData().nim_nip &&
                    request.resource.data.status == 'PENDING';
      allow update: if isLabStaff(); // Hanya staf yang boleh approve/return/reject
      allow delete: if hasRole('SUPER_ADMIN');
    }

    // ── KOLEKSI ARTICLES ──
    match /articles/{articleId} {
      allow read: if true; // Publik warta kanopi
      allow write: if isLabStaff() || hasRole('EDITOR');
    }

    // ── KOLEKSI REPORTS ──
    match /reports/{reportId} {
      allow read: if isLabStaff();
      allow create: if isLabStaff();
      allow update: if isLabStaff(); // Validasi transisi status berjenjang
      allow delete: if hasRole('SUPER_ADMIN');
    }

    // ── KOLEKSI ORG_MEMBERS ──
    match /org_members/{memberId} {
      allow read: if true; // Publik bagan organisasi
      allow write: if isLabStaff();
    }
  }
}
```

---

## 7. Audit Integritas Operasi Database

Pemeriksaan kode pada `src/lib/db.ts` mengidentifikasi ketiadaan transaksi atomik (*ACID transactions*) pada seluruh alur kritis:

```
[EKSEKUSI TRANSAKSI SAAT INI DI DB.TS: NON-ATOMIC]

Step 1: updateDoc(transactions, { status: "DIPINJAM" })
                      │
                      ▼ (Jika koneksi putus di sini ──► KORUPSI DATA)
Step 2: getDoc(equipments)
                      │
                      ▼ (Race condition: 2 peminjam mengambil stok terakhir bersamaan)
Step 3: updateDoc(equipments, { stokTersedia: stok - 1 })
```

### Rincian Masalah Integritas Data:

1. **Race Condition Pengurangan Stok Alat (`approveTransaction`):**
   * Lokasi: `src/lib/db.ts` baris 435–450.
   * Masalah: Menggunakan `updateDoc` terpisah antara status transaksi dan stok alat. Dua petugas yang menyetujui peminjaman untuk alat dengan sisa stok 1 secara bersamaan akan menyebabkan `stokTersedia` menjadi minus atau terjadi *double-allocation*.
2. **Parsial Update pada Pengembalian Alat (`returnTransaction`):**
   * Lokasi: `src/lib/db.ts` baris 465–529.
   * Masalah: Melibatkan 4 operasi jaringan terpisah (`updateDoc(tx)`, `getDoc(eq)`, `updateDoc(eq)`, `getDoc(user)`, `updateDoc(user)`). Jika eksekusi gagal di tengah, alat berstatus kembali namun stok gudang tidak bertambah dan poin *Green Score* mahasiswa tidak tercatat.
3. **Pemberian Skor Gamifikasi Ganda:**
   * Lokasi: `src/lib/db.ts` baris 477–480.
   * Masalah: Meskipun ada validasi `if (tx.status === "DIKEMBALIKAN")`, tidak adanya *Firestore transaction lock* memungkinkan klik ganda (*double click*) cepat mengirim dua mutasi skor secara bersamaan.
4. **Tabrakan ID Entitas (*ID Collision*):**
   * Lokasi: `src/lib/db.ts` baris 353–355 (`createEquipment`): `nextId = ALT-${snap.size + 1}`.
   * Masalah: Jika total alat ada 5 dan alat ke-3 dihapus, `snap.size` menjadi 4. Penambahan alat baru akan menghasilkan ID `ALT-005` yang **menimpa dokumen alat ke-5 yang sudah ada**.
   * Lokasi: `src/lib/db.ts` baris 418 (`createTransaction`): `Date.now().toString().slice(-6) + Math.floor(Math.random()*100)`. ID hanya mengandalkan 6 digit waktu + 2 digit random (peluang kolisi tinggi pada jam sibuk praktikum).
5. **Rekaman Yatim (*Orphan Records*):**
   * Lokasi: `src/lib/db.ts` baris 340 (`deleteUser`) dan baris 389 (`deleteAlat`).
   * Masalah: Penghapusan user atau alat tidak memvalidasi apakah entitas tersebut masih terikat dengan transaksi aktif di koleksi `transactions`.

---

## 8. Audit Navigasi Publik

Berdasarkan laporan pada isu sebelumnya bahwa *"setiap tab/menu tetap menampilkan Home"*, dilakukan penelusuran statis pada seluruh rantai navigasi:

```
[User Click Menu] ──► Navbar.tsx: onSwitchView?.("about" | "organization" | "public")
                              │
                              ▼
                      App.tsx: handleSwitchView(targetView)
                              │
                              ▼
                      App.tsx: setView(targetView) ──► Re-render conditional view
```

### Hasil Pemeriksaan Kode Statis:
1. **Navigasi Publik Utama (`Navbar.tsx` & `App.tsx`):**
   * Tombol "Katalog Publik" → memanggil `onSwitchView?.("public")` → `setView("public")` (Renders `<PublicCatalog />`).
   * Tombol "Tentang & SOP" → memanggil `onSwitchView?.("about")` → `setView("about")` (Renders `<AboutPage />`).
   * Tombol "Struktur Organisasi" → memanggil `onSwitchView?.("organization")` → `setView("organization")` (Renders `<OrganizationPage />`).
   * Tombol "Masuk" / Login → memanggil `onSwitchView?.("admin")` → diarahkan ke `login` jika `!user` (Renders `<Login />`).
2. **Status Evaluasi:** **TIDAK DAPAT DIREPRODUKSI DI LEVEL LOGIKA KODE STATIC (`TIDAK DAPAT DIREPRODUKSI`)**. Logika *state routing* di `App.tsx` telah terhubung secara benar ke setiap komponen halaman.
3. **Akar Kebingungan Pengguna:**
   * Aplikasi tidak menggunakan library routing URL berbasis browser seperti `react-router-dom`. Semua transisi halaman dikelola via internal React state `view`.
   * Akibatnya, URL di address bar peramban selalu tetap `/`. Jika pengguna menekan tombol **Browser Refresh (F5)** atau **Browser Back Button**, browser memuat ulang dari awal dan mengecek `sessionStorage`, yang dapat mengembalikan tampilan ke Beranda jika sesi kosong.

---

## 9. Skenario Serangan yang Terbukti dari Kode (*Proof-of-Concept Scenarios*)

Berikut adalah 4 skenario eksploitasi nyata yang dapat dilakukan pada kondisi kode saat ini:

### Skenario A: Dump Seluruh Data Akun dan Kata Sandi Tanpa Login
1. Penyerang membuka halaman web SylvaLab di browser.
2. Penyerang membuka Developer Tools Console (F12) dan mengeksekusi:
   ```javascript
   const { db } = await import("./src/lib/firebase.ts");
   const { getDocs, collection } = await import("firebase/firestore");
   const snap = await getDocs(collection(db, "users"));
   console.table(snap.docs.map(d => ({ nim: d.id, nama: d.data().nama, role: d.data().role, pass: d.data().passwordPlaceholder })));
   ```
3. **Hasil:** Seluruh daftar civitas akademika beserta kata sandi plaintext dan hak aksesnya langsung tampil di konsol tanpa perlu login.

### Skenario B: Eskalasi Hak Akses Lokal (*Privilege Escalation to SUPER_ADMIN*)
1. Mahasiswa login dengan NIM biasa (Role: `PEMINJAM`).
2. Di Console browser, mahasiswa mengetik:
   ```javascript
   const user = JSON.parse(sessionStorage.getItem("sylvalab_user"));
   user.role = "SUPER_ADMIN";
   sessionStorage.setItem("sylvalab_user", JSON.stringify(user));
   location.reload();
   ```
3. **Hasil:** Setelah reload, antarmuka `AdminPanel` terbuka penuh. Mahasiswa dapat mengakses tab CRUD Alat, Manajemen Pengguna, dan Verifikasi Laporan Rektorat.

### Skenario C: Menyetujui Peminjaman Alat Sendiri Tanpa Verifikasi Laboran
1. Mahasiswa membuat permohonan pinjam alat di portal (status: `PENDING`, misal ID: `TX-12345678`).
2. Mahasiswa mengeksekusi langsung di console:
   ```javascript
   const { db } = await import("./src/lib/firebase.ts");
   const { updateDoc, doc } = await import("firebase/firestore");
   await updateDoc(doc(db, "transactions", "TX-12345678"), { status: "DIPINJAM" });
   ```
3. **Hasil:** Permohonan langsung berstatus disetujui tanpa sepengetahuan staf lab.

### Skenario D: Manipulasi Green Score Menjadi Nilai Maksimal (999 Poin)
1. Mahasiswa mengeksekusi pembaruan dokumen profilnya:
   ```javascript
   const { db } = await import("./src/lib/firebase.ts");
   const { updateDoc, doc } = await import("firebase/firestore");
   await updateDoc(doc(db, "users", "D0521001"), { greenScore: 999 });
   ```
2. **Hasil:** Poin reputasi mahasiswa seketika melonjak menjadi 999 poin secara permanen di database.

---

## 10. Daftar Temuan Terverifikasi

- **AUDIT-001-F01 (KRITIS - TERBUKTI):** Firestore Security Rules terbuka untuk publik (`allow read, write: if true;`) di `firestore.rules`.
- **AUDIT-001-F02 (KRITIS - TERBUKTI):** Penyimpanan kata sandi dalam bentuk plaintext di field `passwordPlaceholder` pada dokumen `users`.
- **AUDIT-001-F03 (KRITIS - TERBUKTI):** Manajemen otentikasi rentan eskalasi peran melalui manipulasi `sessionStorage` di `src/App.tsx`.
- **AUDIT-001-F04 (TINGGI - TERBUKTI):** Mekanisme fallback login di `src/lib/db.ts` membolehkan sesi aktif tanpa verifikasi identitas Firebase Auth.
- **AUDIT-001-F05 (TINGGI - TERBUKTI):** Pembuatan akun user baru oleh Admin via `createUserWithEmailAndPassword` membajak sesi login Admin di client.
- **AUDIT-001-F06 (TINGGI - TERBUKTI):** Operasi persetujuan dan pengembalian transaksi tidak menggunakan transaksi atomik Firestore (`runTransaction`).
- **AUDIT-001-F07 (TINGGI - TERBUKTI):** Pembuatan ID alat di `createEquipment` rentan tabrakan (*collision*) dan penimpaan data akibat perhitungan berbasis `snap.size + 1`.
- **AUDIT-001-F08 (SEDANG - TERBUKTI):** Fungsi logout di `src/App.tsx` tidak memanggil `signOut(auth)` ke Firebase Authentication.
- **AUDIT-001-F09 (SEDANG - TERBUKTI):** Penghapusan entitas alat dan user menghasilkan *orphan record* pada transaksi aktif.
- **AUDIT-001-F10 (SEDANG - TERBUKTI):** Ketiadaan mekanisme reset/pemulihan kata sandi mandiri bagi pengguna.
- **AUDIT-001-F11 (RENDAH - TERBUKTI):** Ketiadaan sinkronisasi URL address bar dengan state navigasi internal.

---

## 11. Rencana Migrasi Autentikasi dan Roadmap Implementasi

Untuk mentransformasi keamanan SylvaLab tanpa merusak data yang ada (*zero downtime & zero data loss*), ditetapkan rencana migrasi 4-tahap:

```
[FASE 1: PERSIAPAN & AUTH SYNC]
  ├── Registrasi massal akun lama ke Firebase Auth (Email: {nim}@sylvalab.com)
  ├── Sinkronisasi document ID users ke auth.uid
  └── Penguatan loginUser() mewajibkan signInWithEmailAndPassword

[FASE 2: TRANSAKSI ATOMIK & DATA ACCESS HARDENING]
  ├── Refactoring create/approve/return transaction menggunakan runTransaction()
  ├── UUID / Firestore Auto-ID untuk pencegahan ID Collision
  └── Integrasi onAuthStateChanged & pembersihan sesi menyeluruh pada logout

[FASE 3: PENGETATAN FIRESTORE SECURITY RULES]
  ├── Deploy Rules berbasis request.auth & RBAC dokumen users
  ├── Penguncian akses field sensitif (role, greenScore, status transaksi)
  └── Pengujian Rules melalui Firebase Rules Emulator / Unit Tests

[FASE 4: SANITASI DATA & PEMBERSIHAN KREDENSIAL]
  ├── Penghapusan field passwordPlaceholder dari semua dokumen users
  ├── Penghapusan hardcoded credentials di seedInitialData()
  └── Implementasi alur reset password mandiri
```

### Strategi Pencegahan User Lockout:
1. **Fallback Dual-Check Selama Masa Transisi:** Pada saat pertama kali pengguna lama login, sistem memverifikasi kredensial ke Firebase Auth. Jika belum terdaftar di Auth namun cocok dengan Firestore, sistem otomatis mendaftarkannya ke Firebase Auth, mengaitkan UID baru, dan menghapus `passwordPlaceholder`.
2. **Kunci Rollback:** Simpan backup dokumen koleksi `users` sebelum proses migrasi dijalankan.

---

## 12. Daftar Berkas yang Diperiksa

1. `/firestore.rules`
2. `/firebase-blueprint.json`
3. `/src/types.ts`
4. `/src/App.tsx`
5. `/src/lib/firebase.ts`
6. `/src/lib/db.ts`
7. `/src/components/Login.tsx`
8. `/src/components/Navbar.tsx`
9. `/src/components/PublicCatalog.tsx`
10. `/src/components/PeminjamPortal.tsx`
11. `/src/components/AdminPanel.tsx`
12. `/src/components/AboutPage.tsx`
13. `/src/components/OrganizationPage.tsx`

---

## 13. Pernyataan Penutup

Audit keamanan **SYLVA-AUDIT-001** telah diselesaikan secara komprehensif. **Seluruh temuan, bukti kode, skenario ancaman, spesifikasi target rules, dan rencana migrasi telah tercatat tanpa memodifikasi, menghapus, atau mengubah satu baris pun kode implementasi, data Firestore, ataupun konfigurasi keamanan di workspace.**

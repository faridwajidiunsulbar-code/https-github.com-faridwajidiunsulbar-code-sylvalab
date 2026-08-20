import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from "firebase/firestore";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { db, auth } from "./firebase";
export { db, auth };
import { UserProfile, Equipment, Transaction, Article, Role, EquipmentCategory, KondisiAlat, OrgMember } from "../types";

// Helper to convert NIM/NIP to Firebase Auth email representation
export function getEmailForNim(nim: string): string {
  return `${nim.toLowerCase().trim()}@sylvalab.com`;
}

// ── SEED INITIAL DATA ──
export async function seedInitialData() {
  console.log("Starting seedInitialData...");

  // 1. Seed Equipments if empty
  try {
    const eqColl = collection(db, "equipments");
    const eqSnapshot = await getDocs(eqColl);
    if (eqSnapshot.empty) {
      const initialEquipments: Omit<Equipment, "id" | "createdAt">[] = [
        {
          namaAlat: "Kompas Brunton",
          kategori: "Navigasi",
          stokTotal: 8,
          stokTersedia: 8,
          urlFoto: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=400&q=70"
        },
        {
          namaAlat: "GPS Garmin GPSMAP 64s",
          kategori: "Navigasi",
          stokTotal: 5,
          stokTersedia: 5,
          urlFoto: "https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=400&q=70"
        },
        {
          namaAlat: "Haglof Clinometer",
          kategori: "Pengukuran",
          stokTotal: 6,
          stokTersedia: 6,
          urlFoto: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=70"
        },
        {
          namaAlat: "Mistar Diameter Pohon (Caliper)",
          kategori: "Pengukuran",
          stokTotal: 12,
          stokTersedia: 12,
          urlFoto: "https://images.unsplash.com/photo-1503387762458-7e52f4045a46?w=400&q=70"
        },
        {
          namaAlat: "pH Meter Tanah Analog",
          kategori: "Laboratorium",
          stokTotal: 7,
          stokTersedia: 7,
          urlFoto: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=400&q=70"
        },
        {
          namaAlat: "Altimeter Barometrik",
          kategori: "Pengukuran",
          stokTotal: 4,
          stokTersedia: 4,
          urlFoto: "https://images.unsplash.com/photo-1501534159991-5b7f67c4788a?w=400&q=70"
        }
      ];

      for (let i = 0; i < initialEquipments.length; i++) {
        const id = `ALT-00${i + 1}`;
        await setDoc(doc(db, "equipments", id), {
          ...initialEquipments[i],
          id,
          createdAt: new Date().toISOString()
        });
      }
      console.log("Initial equipments seeded successfully.");
    } else {
      console.log("Equipments collection is not empty, skipping seeding.");
    }
  } catch (error) {
    console.error("Failed to seed equipments:", error);
  }

  // 2. Seed Users if empty
  try {
    const userColl = collection(db, "users");
    const userSnapshot = await getDocs(userColl);
    if (userSnapshot.empty) {
      const initialUsers = [
        {
          nim_nip: "12345",
          nama: "Super Admin Sylva",
          role: "SUPER_ADMIN" as Role,
          greenScore: 100,
          passwordPlaceholder: "admin123"
        },
        {
          nim_nip: "petugas",
          nama: "Andi Pratama",
          role: "PETUGAS_LAB" as Role,
          greenScore: 80,
          passwordPlaceholder: "12345"
        },
        {
          nim_nip: "D0521001",
          nama: "Faisal Wijaya",
          role: "PEMINJAM" as Role,
          greenScore: 45,
          passwordPlaceholder: "12345"
        },
        {
          nim_nip: "D0521002",
          nama: "Siti Rahma",
          role: "PEMINJAM" as Role,
          greenScore: 120,
          passwordPlaceholder: "12345"
        },
        {
          nim_nip: "D0521003",
          nama: "Budi Santoso",
          role: "PEMINJAM" as Role,
          greenScore: 15,
          passwordPlaceholder: "12345"
        }
      ];

      for (const u of initialUsers) {
        await setDoc(doc(db, "users", u.nim_nip), {
          nim_nip: u.nim_nip,
          nama: u.nama,
          role: u.role,
          greenScore: u.greenScore,
          passwordPlaceholder: u.passwordPlaceholder,
          uid: "", // Will be updated on first login
          createdAt: new Date().toISOString()
        });
      }
      console.log("Initial users seeded successfully.");
    }

    // Ensure specific administrative roles always exist for easy testing
    const adminRoles = [
      {
        nim_nip: "kepala_lab",
        nama: "Widyanti Utami A, S.Hut., M.Hut",
        role: "KEPALA_LAB_KEHUTANAN" as Role,
        greenScore: 90,
        passwordPlaceholder: "12345"
      },
      {
        nim_nip: "kepala_upa",
        nama: "Dr. Muhammad Nur, S.Pi., M.Si",
        role: "KEPALA_UPA_LAB_TERPADU" as Role,
        greenScore: 95,
        passwordPlaceholder: "12345"
      }
    ];
    for (const ar of adminRoles) {
      const docRef = doc(db, "users", ar.nim_nip);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          nim_nip: ar.nim_nip,
          nama: ar.nama,
          role: ar.role,
          greenScore: ar.greenScore,
          passwordPlaceholder: ar.passwordPlaceholder,
          uid: "",
          createdAt: new Date().toISOString()
        });
      } else {
        const currentData = docSnap.data();
        if (currentData && (currentData.nama === "Dr. Ir. Hermawan, M.Si." || currentData.nama === "Prof. Dr. Andi Yusuf, M.T.")) {
          await updateDoc(docRef, { nama: ar.nama });
          console.log(`Migrated user ${ar.nim_nip} name to ${ar.nama}`);
        }
      }
    }
    console.log("Ensure admin roles are present.");
  } catch (error) {
    console.error("Failed to seed users:", error);
  }

  // 3. Seed Articles if empty
  try {
    const artColl = collection(db, "articles");
    const artSnapshot = await getDocs(artColl);
    if (artSnapshot.empty) {
      const initialArticles = [
        {
          judul: "Ekspedisi Hutan Mangrove Majene 2026",
          tanggalTerbit: "2026-06-15",
          kontenTeks: "Tim peneliti Kehutanan Unsulbar melakukan inventarisasi jenis mangrove di pesisir Majene menggunakan kompas Brunton dan GPS Garmin. Kegiatan ini melibatkan mahasiswa pencinta alam kanopi untuk memetakan zonasi penyebaran vegetasi pesisir.\n\nHasil awal menunjukkan keanekaragaman mangrove masih terjaga baik di area konservasi lokal.",
          urlCover: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=70",
          author: "Editor Kanopi"
        },
        {
          judul: "Praktikum Silvikultur Mandiri di Hutan Pendidikan",
          tanggalTerbit: "2026-07-02",
          kontenTeks: "Mahasiswa angkatan 2024 melaksanakan praktikum pengukuran tinggi dan diameter pohon menggunakan Mistar Diameter dan Altimeter. Kegiatan ini ditujukan untuk membekali mahasiswa keterampilan dasar inventarisasi tegakan hutan sebelum memasuki semester konsentrasi.",
          urlCover: "https://images.unsplash.com/photo-1501534159991-5b7f67c4788a?w=600&q=70",
          author: "Asisten Lab Kehutanan"
        }
      ];

      for (let i = 0; i < initialArticles.length; i++) {
        const id = `ART-00${i + 1}`;
        await setDoc(doc(db, "articles", id), {
          ...initialArticles[i],
          id,
          createdAt: new Date().toISOString()
        });
      }
      console.log("Initial articles seeded successfully.");
    } else {
      console.log("Articles collection is not empty, skipping seeding.");
    }
  } catch (error) {
    console.error("Failed to seed articles:", error);
  }

  // 4. Seed Reports if empty
  await seedReports();

  // 5. Seed Org Members if empty
  await seedOrgMembers();
}

// ── AUTHENTICATION ──
export async function loginUser(nim: string, pass: string): Promise<UserProfile> {
  const cleanNim = nim.trim();
  const cleanPass = pass.trim();

  // 1. Fetch user document from Firestore
  const userDocRef = doc(db, "users", cleanNim);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error("User dengan NIM/NIP tersebut tidak terdaftar di SylvaLab.");
  }

  const profile = userDoc.data() as UserProfile;
  const expectedPassword = profile.passwordPlaceholder || "12345";

  if (cleanPass !== expectedPassword) {
    throw new Error("Password salah.");
  }

  // 2. Synchronize with Firebase Auth (on-the-fly registration/login)
  const email = getEmailForNim(cleanNim);
  let authUser;

  try {
    // Try signing in
    const authResult = await signInWithEmailAndPassword(auth, email, cleanPass);
    authUser = authResult.user;

    // Update UID in Firestore if empty or different
    if (profile.uid !== authUser.uid) {
      await updateDoc(userDocRef, { uid: authUser.uid });
      profile.uid = authUser.uid;
    }
  } catch (err: any) {
    console.warn("Firebase Auth synchronization failed/disabled, falling back to Firestore-only session:", err.message);
    
    // Fallback: If auth provider is disabled or missing permissions, still log in using Firestore.
    // Ensure we have a valid client-side UID if none is set.
    if (!profile.uid) {
      const fallbackUid = `sylva_fs_${cleanNim}`;
      await updateDoc(userDocRef, { uid: fallbackUid });
      profile.uid = fallbackUid;
    }
  }

  return profile;
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn("Firebase Auth signOut failed:", e);
  }
}

// ── USER MANAGEMENT ──
export async function getUsers(): Promise<UserProfile[]> {
  const coll = collection(db, "users");
  const snap = await getDocs(coll);
  return snap.docs.map(d => d.data() as UserProfile);
}

export async function createUser(nim: string, nama: string, role: Role, pass: string): Promise<UserProfile> {
  const userDocRef = doc(db, "users", nim);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    throw new Error("User dengan NIM/NIP ini sudah terdaftar.");
  }

  const profile: UserProfile = {
    nim_nip: nim,
    uid: "",
    nama,
    role,
    greenScore: 0,
    passwordPlaceholder: pass || "12345",
    createdAt: new Date().toISOString()
  };

  await setDoc(userDocRef, profile);

  // Pre-register in Firebase Auth to ensure credentials exist
  try {
    const email = getEmailForNim(nim);
    await createUserWithEmailAndPassword(auth, email, pass || "12345");
  } catch (e) {
    console.warn("Pre-register auth already done or errored:", e);
  }

  return profile;
}

export async function deleteUser(nim: string) {
  await deleteDoc(doc(db, "users", nim));
}

// ── EQUIPMENTS ──
export async function getEquipments(): Promise<Equipment[]> {
  const coll = collection(db, "equipments");
  const q = query(coll, orderBy("id", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Equipment);
}

export async function createEquipment(nama: string, kategori: EquipmentCategory, stok: number, foto: string): Promise<Equipment> {
  const coll = collection(db, "equipments");
  const snap = await getDocs(coll);
  const nextId = `ALT-${String(snap.size + 1).padStart(3, "0")}`;

  const item: Equipment = {
    id: nextId,
    namaAlat: nama,
    kategori,
    stokTotal: stok,
    stokTersedia: stok,
    urlFoto: foto || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&q=70",
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, "equipments", nextId), item);
  return item;
}

export async function updateEquipment(id: string, nama: string, kategori: EquipmentCategory, stok: number, foto: string) {
  const docRef = doc(db, "equipments", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Alat tidak ditemukan.");

  const current = docSnap.data() as Equipment;
  const stokDiff = stok - current.stokTotal;
  const newTersedia = Math.max(0, current.stokTersedia + stokDiff);

  await updateDoc(docRef, {
    namaAlat: nama,
    kategori,
    stokTotal: stok,
    stokTersedia: newTersedia,
    urlFoto: foto
  });
}

export async function deleteAlat(id: string) {
  await deleteDoc(doc(db, "equipments", id));
}

// ── TRANSACTIONS ──
export async function getTransactions(): Promise<Transaction[]> {
  const coll = collection(db, "transactions");
  const q = query(coll, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Transaction);
}

export async function createTransaction(idAlat: string, nim: string, tglPinjam: string, tglKembali: string): Promise<Transaction> {
  // 1. Fetch equipment to ensure availability
  const eqDocRef = doc(db, "equipments", idAlat);
  const eqSnap = await getDoc(eqDocRef);
  if (!eqSnap.exists()) throw new Error("Alat tidak ditemukan.");

  const eq = eqSnap.data() as Equipment;
  if (eq.stokTersedia <= 0) {
    throw new Error(`Stok alat ${eq.namaAlat} sedang habis.`);
  }

  // 2. Fetch borrower name
  const userDocRef = doc(db, "users", nim);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) throw new Error("User peminjam tidak ditemukan.");
  const userProf = userSnap.data() as UserProfile;

  // 3. Create transaction document
  const txId = `TX-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
  const tx: Transaction = {
    id: txId,
    nimPeminjam: nim,
    namaPeminjam: userProf.nama,
    idAlat,
    namaAlat: eq.namaAlat,
    status: "PENDING",
    tglPinjam,
    tglKembali,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, "transactions", txId), tx);
  return tx;
}

export async function approveTransaction(idTrans: string, idAlat: string) {
  // 1. Update transaction status
  await updateDoc(doc(db, "transactions", idTrans), {
    status: "DIPINJAM"
  });

  // 2. Reduce stokTersedia in equipment
  const eqRef = doc(db, "equipments", idAlat);
  const eqSnap = await getDoc(eqRef);
  if (eqSnap.exists()) {
    const eq = eqSnap.data() as Equipment;
    await updateDoc(eqRef, {
      stokTersedia: Math.max(0, eq.stokTersedia - 1)
    });
  }
}

export async function rejectTransaction(idTrans: string) {
  await updateDoc(doc(db, "transactions", idTrans), {
    status: "DITOLAK"
  });
}

interface ReturnResult {
  success: boolean;
  message: string;
  poin: number;
  isOnTime: boolean;
}

export async function returnTransaction(
  idTrans: string,
  idAlat: string,
  nim: string,
  kondisi: KondisiAlat,
  tglKembaliAktual: string
): Promise<ReturnResult> {
  const txRef = doc(db, "transactions", idTrans);
  const txSnap = await getDoc(txRef);
  if (!txSnap.exists()) throw new Error("Transaksi tidak ditemukan.");
  const tx = txSnap.data() as Transaction;

  if (tx.status === "DIKEMBALIKAN") {
    throw new Error("Transaksi ini sudah dikembalikan sebelumnya.");
  }

  // 1. Calculate lateness and points
  // Base points on condition: Baik +15, Cukup +12, Rusak +2
  let pointsEarned = 0;
  if (kondisi === "BAIK") pointsEarned = 15;
  else if (kondisi === "CUKUP") pointsEarned = 12;
  else if (kondisi === "RUSAK") pointsEarned = 2;

  // Lateness check (deduct 5 points if late, warning)
  const isOnTime = tglKembaliAktual <= tx.tglKembali;
  if (!isOnTime) {
    pointsEarned = Math.max(0, pointsEarned - 5); // late penalty
  }

  // 2. Update Transaction document
  await updateDoc(txRef, {
    status: "DIKEMBALIKAN",
    tglKembaliAktual,
    kondisiKembali: kondisi,
    poinMendapat: pointsEarned
  });

  // 3. Restock equipment
  const eqRef = doc(db, "equipments", idAlat);
  const eqSnap = await getDoc(eqRef);
  if (eqSnap.exists()) {
    const eq = eqSnap.data() as Equipment;
    await updateDoc(eqRef, {
      stokTersedia: Math.min(eq.stokTotal, eq.stokTersedia + 1)
    });
  }

  // 4. Award Green Score points to user profile
  const userRef = doc(db, "users", nim);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userProf = userSnap.data() as UserProfile;
    const newScore = (userProf.greenScore || 0) + pointsEarned;
    await updateDoc(userRef, {
      greenScore: newScore
    });
  }

  return {
    success: true,
    message: "Alat berhasil dikembalikan.",
    poin: pointsEarned,
    isOnTime
  };
}

// ── ARTICLES (KANOPI JOURNAL) ──
export async function getArticles(): Promise<Article[]> {
  const coll = collection(db, "articles");
  const q = query(coll, orderBy("tanggalTerbit", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Article);
}

export async function createArticle(judul: string, tanggal: string, konten: string, cover: string, author: string): Promise<Article> {
  const coll = collection(db, "articles");
  const snap = await getDocs(coll);
  const id = `ART-${Date.now().toString().slice(-5)}`;

  const article: Article = {
    id,
    judul,
    tanggalTerbit: tanggal,
    kontenTeks: konten,
    urlCover: cover || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=70",
    author: author || "Staf Lab",
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, "articles", id), article);
  return article;
}

export async function updateArticle(id: string, judul: string, tanggal: string, konten: string, cover: string) {
  const docRef = doc(db, "articles", id);
  await updateDoc(docRef, {
    judul,
    tanggalTerbit: tanggal,
    kontenTeks: konten,
    urlCover: cover
  });
}

export async function deleteArticle(id: string) {
  await deleteDoc(doc(db, "articles", id));
}

// ── LAB REPORTS (HIERARCHICAL FLOW & AUDIT) ──
import { LabReport, ReportStatus } from "../types";

export async function getReports(): Promise<LabReport[]> {
  try {
    const coll = collection(db, "reports");
    const q = query(coll, orderBy("tanggal", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as LabReport);
  } catch (error) {
    console.error("Error fetching reports from Firestore:", error);
    return [];
  }
}

export async function createReport(report: LabReport): Promise<void> {
  const docRef = doc(db, "reports", report.id);
  await setDoc(docRef, report);
}

export async function updateReportStatus(id: string, status: ReportStatus, updates: Partial<LabReport>): Promise<void> {
  const docRef = doc(db, "reports", id);
  await updateDoc(docRef, {
    status,
    ...updates
  });
}

// Update seed function to seed reports if empty
export async function seedReports() {
  try {
    const coll = collection(db, "reports");
    const snap = await getDocs(coll);
    if (snap.empty) {
      const initialReports: LabReport[] = [
        {
          id: "REP-2026-07-08",
          tipe: "HARIAN",
          tanggal: "2026-07-08",
          judul: "Laporan Aktivitas Harian & Cek Fisik Alat Praktikum",
          dibuatOleh: "Andi Pratama",
          lab: "Lab Kehutanan",
          status: "DIAJUKAN_KEPALA_LAB",
          catatan: "Seluruh alat navigasi telah dikembalikan dalam kondisi bersih. Ada 1 unit pH meter tanah analog yang terindikasi rusak elektrodanya dan butuh penggantian.",
          tanggalDiajukan: "2026-07-08",
          ringkasanAset: {
            totalBaik: 32,
            totalCukup: 4,
            totalRusak: 1
          }
        },
        {
          id: "REP-2026-06",
          tipe: "BULANAN",
          tanggal: "2026-06-30",
          judul: "Laporan Bulanan Akumulasi Peminjaman Alat - Juni 2026",
          dibuatOleh: "Andi Pratama",
          lab: "Lab Kehutanan",
          status: "DISETUJUI_KEPALA_LAB",
          catatan: "Kinerja utilitas alat naik 25% dibanding bulan lalu dikarenakan musim praktikum silvikultur. Kerja sama dengan Hima Kanopi berjalan sukses.",
          tanggalDiajukan: "2026-06-30",
          tanggalDisetujui: "2026-07-01",
          ringkasanAset: {
            totalBaik: 30,
            totalCukup: 5,
            totalRusak: 2
          }
        },
        {
          id: "REP-2025-YEAR",
          tipe: "TAHUNAN",
          tanggal: "2025-12-31",
          judul: "Laporan Akuntabilitas & Utilitas Tahunan UPA Lab Terpadu 2025",
          dibuatOleh: "Andi Pratama",
          lab: "Lab Terpadu",
          status: "DISERAHKAN_REKTORAT",
          catatan: "Sistem pelaporan audit berjenjang berjalan dengan tingkat kepatuhan mahasiswa 98%. Usulan anggaran 2026 difokuskan pada pengadaan alat navigasi GPS terbaru.",
          tanggalDiajukan: "2025-12-28",
          tanggalDisetujui: "2025-12-29",
          tanggalDivalidasi: "2025-12-30",
          tanggalDiserahkan: "2025-12-31",
          ringkasanAset: {
            totalBaik: 28,
            totalCukup: 7,
            totalRusak: 4
          }
        }
      ];

      for (const r of initialReports) {
        await setDoc(doc(db, "reports", r.id), r);
      }
      console.log("Initial reports seeded successfully.");
    }
  } catch (error) {
    console.error("Failed to seed initial reports:", error);
  }
}

// ── ORGANIZATION MEMBERS (TEAM & PROFILE MANAGEMENT) ──
export async function getOrgMembers(): Promise<OrgMember[]> {
  try {
    const coll = collection(db, "org_members");
    const snap = await getDocs(coll);
    if (snap.empty) return [];
    
    // Sort manually by predefined positions
    const members = snap.docs.map(d => d.data() as OrgMember);
    const order = ["kepala_upa", "kepala_lab", "staff_admin", "petugas_lab"];
    return members.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  } catch (error) {
    console.error("Error fetching org members:", error);
    return [];
  }
}

export async function updateOrgMember(id: string, updates: Partial<OrgMember>): Promise<void> {
  const docRef = doc(db, "org_members", id);
  await updateDoc(docRef, updates);
}

export async function seedOrgMembers() {
  try {
    const coll = collection(db, "org_members");
    const snap = await getDocs(coll);
    const initialTeam: OrgMember[] = [
      {
        id: "kepala_upa",
        nama: "Dr. Muhammad Nur, S.Pi., M.Si",
        jabatan: "Kepala UPA Laboratorium Terpadu",
        urlFoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        email: "mhd.nur@unsulbar.ac.id",
        phone: "+62 811-456-789"
      },
      {
        id: "kepala_lab",
        nama: "Widyanti Utami A, S.Hut., M.Hut",
        jabatan: "Kepala Laboratorium Kehutanan",
        urlFoto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
        sambutan: "Selamat datang di Portal Digital SylvaLab, platform inovatif digitalisasi manajemen inventaris dan administrasi peminjaman alat laboratorium kehutanan Universitas Sulawesi Barat. Kami terus berkomitmen untuk menghadirkan layanan yang transparan, terintegrasi, paperless 100%, serta melahirkan generasi rimbawan unggul berdaya saing global.",
        email: "widyanti.utami@unsulbar.ac.id",
        phone: "+62 812-345-678"
      },
      {
        id: "staff_admin",
        nama: "Sarah Olivia, S.Hut.",
        jabatan: "Staf Administrasi & Verifikator Berkas",
        urlFoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        email: "sarah.olivia@unsulbar.ac.id",
        phone: "+62 821-987-654"
      },
      {
        id: "petugas_lab",
        nama: "Andi Pratama",
        jabatan: "Petugas Laboran Lapangan",
        urlFoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        email: "andi.pratama@unsulbar.ac.id",
        phone: "+62 853-111-222"
      }
    ];

    if (snap.empty) {
      for (const member of initialTeam) {
        await setDoc(doc(db, "org_members", member.id), member);
      }
      console.log("Initial org members seeded successfully.");
    } else {
      for (const member of initialTeam) {
        const docRef = doc(db, "org_members", member.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const currentData = docSnap.data() as OrgMember;
          if (
            (member.id === "kepala_upa" && currentData.nama === "Prof. Dr. Andi Yusuf, M.T.") ||
            (member.id === "kepala_lab" && currentData.nama === "Dr. Ir. Hermawan, M.Si.")
          ) {
            await updateDoc(docRef, {
              nama: member.nama,
              email: member.email
            });
            console.log(`Updated existing org member ${member.id} to new name: ${member.nama}`);
          }
        } else {
          await setDoc(docRef, member);
        }
      }
    }
  } catch (error) {
    console.error("Failed to seed org members:", error);
  }
}


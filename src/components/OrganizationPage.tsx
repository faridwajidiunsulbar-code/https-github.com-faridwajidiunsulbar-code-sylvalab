import { useState, useEffect } from "react";
import { OrgMember } from "../types";
import { getOrgMembers } from "../lib/db";
import { ArrowLeft, Mail, Phone, ExternalLink, Shield, GraduationCap, Server, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface OrganizationPageProps {
  onBack: () => void;
}

export default function OrganizationPage({ onBack }: OrganizationPageProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const data = await getOrgMembers();
        setMembers(data);
      } catch (err) {
        console.error("Failed to fetch org structure:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const kepalaUpa = members.find((m) => m.id === "kepala_upa");
  const kepalaLab = members.find((m) => m.id === "kepala_lab");
  const staffAdmin = members.find((m) => m.id === "staff_admin");
  const petugasLab = members.find((m) => m.id === "petugas_lab");

  return (
    <div className="min-h-screen bg-[#041008] text-white py-12 px-5">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back and Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-neon border border-neon/20 bg-neon/5 rounded-xl hover:bg-neon hover:text-forest transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Portal</span>
          </button>
          
          <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
            SylvaLab Terpadu · Universitas Sulawesi Barat
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl tracking-tight leading-tight">
            Struktur <span className="text-neon italic">Organisasi</span> Laboratorium
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Sinergi tata kelola administrasi berjenjang dan pemantauan teknis lapangan di bawah naungan UPA Laboratorium Terpadu Unsulbar.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-10 h-10 border-4 border-neon border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400 font-mono">Memuat bagan struktur...</p>
          </div>
        ) : (
          <div className="relative py-8">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon/5 rounded-full blur-[120px] pointer-events-none" />

            {/* ── THE ORG TREE BRACKET ── */}
            <div className="flex flex-col items-center space-y-12 relative z-10">
              
              {/* Level 1: Kepala UPA (Root Node) */}
              {kepalaUpa && (
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedMember(kepalaUpa)}
                    className="cursor-pointer p-4 bg-[#0a1e11] border border-neon/30 hover:border-neon rounded-2xl w-72 text-center shadow-xl hover:shadow-neon/10 transition-all group relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00e165] text-forest font-mono text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-forest">
                      DIREKTORAT UTAMA
                    </div>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neon mx-auto mb-3 shadow-md">
                      <img
                        src={kepalaUpa.urlFoto}
                        alt={kepalaUpa.nama}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-white leading-tight truncate">
                      {kepalaUpa.nama}
                    </h3>
                    <p className="text-[10px] text-neon uppercase font-mono mt-1 font-bold">
                      {kepalaUpa.jabatan}
                    </p>
                    <div className="flex justify-center items-center gap-1.5 mt-2.5 text-gray-400 group-hover:text-white transition-colors text-[10px] font-mono">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Detail Profil</span>
                    </div>
                  </motion.div>
                  {/* Connection Line Down */}
                  <div className="w-0.5 h-12 bg-neon/30" />
                </div>
              )}

              {/* Level 2: Kepala Lab (Core Tactic Node) */}
              {kepalaLab && (
                <div className="flex flex-col items-center">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedMember(kepalaLab)}
                    className="cursor-pointer p-4 bg-[#0d2a17] border border-emerald-500/30 hover:border-emerald-400 rounded-2xl w-72 text-center shadow-xl hover:shadow-emerald-500/10 transition-all group relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-forest font-mono text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider border border-forest">
                      PENGELOLA TAKTIS
                    </div>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-400 mx-auto mb-3 shadow-md relative">
                      <img
                        src={kepalaLab.urlFoto}
                        alt={kepalaLab.nama}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="font-serif font-bold text-sm text-white leading-tight truncate">
                      {kepalaLab.nama}
                    </h3>
                    <p className="text-[10px] text-emerald-400 uppercase font-mono mt-1 font-bold">
                      {kepalaLab.jabatan}
                    </p>
                    {kepalaLab.sambutan && (
                      <span className="inline-block mt-2 bg-emerald-500/10 text-[9px] text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                        💬 Memberikan Sambutan
                      </span>
                    )}
                    <div className="flex justify-center items-center gap-1.5 mt-2.5 text-gray-400 group-hover:text-white transition-colors text-[10px] font-mono">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Detail Profil</span>
                    </div>
                  </motion.div>
                  {/* Branching Connection Lines Down */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-neon/30" />
                    <div className="w-[300px] h-0.5 bg-neon/30" />
                    <div className="flex justify-between w-[300px]">
                      <div className="w-0.5 h-6 bg-neon/30" />
                      <div className="w-0.5 h-6 bg-neon/30" />
                    </div>
                  </div>
                </div>
              )}

              {/* Level 3: Lower administrative nodes (Staff & Laboran side by side) */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-10">
                {/* Staff Admin Node */}
                {staffAdmin && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedMember(staffAdmin)}
                    className="cursor-pointer p-4 bg-[#0a1e11] border border-white/5 hover:border-neon/40 rounded-2xl w-64 text-center shadow-lg transition-all group relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                      ADMINISTRASI
                    </div>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-400 mx-auto mb-3">
                      <img
                        src={staffAdmin.urlFoto}
                        alt={staffAdmin.nama}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-semibold text-xs text-white leading-tight truncate">
                      {staffAdmin.nama}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-mono mt-1">
                      {staffAdmin.jabatan}
                    </p>
                    <div className="flex justify-center items-center gap-1.5 mt-2.5 text-gray-500 group-hover:text-white transition-colors text-[9px] font-mono">
                      <span>Lihat Kontak</span>
                    </div>
                  </motion.div>
                )}

                {/* Petugas/Laboran Node */}
                {petugasLab && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedMember(petugasLab)}
                    className="cursor-pointer p-4 bg-[#0a1e11] border border-white/5 hover:border-neon/40 rounded-2xl w-64 text-center shadow-lg transition-all group relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-forest font-mono text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">
                      PELAKSANA LAPANGAN
                    </div>
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 mx-auto mb-3">
                      <img
                        src={petugasLab.urlFoto}
                        alt={petugasLab.nama}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h4 className="font-semibold text-xs text-white leading-tight truncate">
                      {petugasLab.nama}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-mono mt-1">
                      {petugasLab.jabatan}
                    </p>
                    <div className="flex justify-center items-center gap-1.5 mt-2.5 text-gray-500 group-hover:text-white transition-colors text-[9px] font-mono">
                      <span>Lihat Kontak</span>
                    </div>
                  </motion.div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Interactive Detail Modal on Node Click */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-[#071d0e] border border-white/10 rounded-2xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <img
                  src={selectedMember.urlFoto}
                  alt={selectedMember.nama}
                  className="w-16 h-16 rounded-full object-cover border-2 border-neon"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="font-serif font-black text-white text-lg">{selectedMember.nama}</h3>
                  <p className="text-xs text-neon uppercase font-mono font-bold">{selectedMember.jabatan}</p>
                </div>
              </div>

              {selectedMember.sambutan ? (
                <div className="space-y-2 bg-[#041008] p-4 rounded-xl border border-neon/10">
                  <div className="flex items-center gap-1.5 text-xs text-neon font-bold uppercase tracking-wider font-mono">
                    <span>📢 Sambutan Resmi Kepala Lab</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed italic">
                    "{selectedMember.sambutan}"
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-white/2 rounded-xl text-xs text-gray-400 font-mono flex items-center gap-2">
                  <Shield className="w-4 h-4 text-neon" />
                  <span>Personel tersertifikasi aktif dalam mengawal SOP Lab Kehutanan Unsulbar.</span>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <h4 className="text-xs uppercase font-mono tracking-wider text-gray-400">Hubungi Personel</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg text-gray-300 hover:text-white">
                    <Mail className="w-3.5 h-3.5 text-neon" />
                    <span className="truncate">{selectedMember.email || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg text-gray-300 hover:text-white">
                    <Phone className="w-3.5 h-3.5 text-neon" />
                    <span>{selectedMember.phone || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2 bg-neon/15 border border-neon/30 text-neon hover:bg-neon hover:text-forest text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Tutup Profil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

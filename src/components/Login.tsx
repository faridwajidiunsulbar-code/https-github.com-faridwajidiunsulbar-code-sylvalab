import React, { useState, useEffect } from "react";
import { loginUser } from "../lib/db";
import { UserProfile } from "../types";
import { Leaf, IdCard, Lock, Eye, EyeOff, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface LoginProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fireflies, setFireflies] = useState<Array<{ id: number; size: number; left: number; top: number; dx: number; dy: number; dur: number; delay: number }>>([]);

  // Generate fireflies decoration
  useEffect(() => {
    const list = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      dx: (Math.random() - 0.5) * 150,
      dy: (Math.random() - 0.5) * 150,
      dur: Math.random() * 8 + 8,
      delay: Math.random() * 5
    }));
    setFireflies(list);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nim || !password) {
      setError("Harap isi NIM/NIP dan Password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await loginUser(nim, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan periksa kembali NIM/NIP dan Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-[#041008]">
      {/* ── HIGHLY CRAFTED AMBIENT FOREST BACKGROUND (PROMPT A) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Ambient Dark Forest Green Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020a04] via-[#041209] to-[#010603]" />

        {/* 100% Inline SVG layered forest silhouettes */}
        <svg viewBox="0 0 1000 400" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-45">
          <defs>
            {/* Pine tree path silhouette */}
            <path id="pine-tree" d="M12 0 L24 22 L18 22 L27 38 L15 38 L30 56 L16 56 L16 64 L8 64 L8 56 L-6 56 L9 38 L-3 38 L6 22 L0 22 Z" />
            {/* Round oak-like tree path silhouette */}
            <path id="broad-tree" d="M15 0 C22 0 28 5 28 12 C28 18 24 22 20 25 L23 35 L7 35 L10 25 C6 22 2 18 2 12 C2 5 8 0 15 0 Z" />
          </defs>

          {/* Back forest layer - sways very slowly, lighter green */}
          <g fill="#072211" style={{ transformOrigin: "50% 100%" }} className="animate-sway-slow">
            <use href="#pine-tree" x="40" y="300" transform="scale(1.2)" />
            <use href="#broad-tree" x="120" y="280" transform="scale(1.4)" />
            <use href="#pine-tree" x="200" y="290" transform="scale(1.3)" />
            <use href="#broad-tree" x="280" y="310" transform="scale(1.1)" />
            <use href="#pine-tree" x="380" y="300" transform="scale(1.3)" />
            <use href="#broad-tree" x="460" y="290" transform="scale(1.4)" />
            <use href="#pine-tree" x="540" y="295" transform="scale(1.25)" />
            <use href="#broad-tree" x="620" y="285" transform="scale(1.35)" />
            <use href="#pine-tree" x="710" y="305" transform="scale(1.15)" />
            <use href="#broad-tree" x="790" y="290" transform="scale(1.3)" />
            <use href="#pine-tree" x="870" y="300" transform="scale(1.25)" />
            <use href="#broad-tree" x="940" y="295" transform="scale(1.4)" />
          </g>

          {/* Mid forest layer - sways moderately, darker emerald */}
          <g fill="#04160b" style={{ transformOrigin: "50% 100%" }} className="animate-sway-med">
            <use href="#pine-tree" x="10" y="310" transform="scale(1.4)" />
            <use href="#pine-tree" x="90" y="305" transform="scale(1.45)" />
            <use href="#broad-tree" x="170" y="295" transform="scale(1.6)" />
            <use href="#pine-tree" x="250" y="305" transform="scale(1.45)" />
            <use href="#broad-tree" x="330" y="300" transform="scale(1.5)" />
            <use href="#pine-tree" x="420" y="315" transform="scale(1.35)" />
            <use href="#broad-tree" x="500" y="300" transform="scale(1.55)" />
            <use href="#pine-tree" x="580" y="310" transform="scale(1.4)" />
            <use href="#broad-tree" x="660" y="305" transform="scale(1.5)" />
            <use href="#pine-tree" x="750" y="315" transform="scale(1.35)" />
            <use href="#broad-tree" x="830" y="300" transform="scale(1.6)" />
            <use href="#pine-tree" x="910" y="310" transform="scale(1.45)" />
          </g>

          {/* Foreground forest layer - sways faster, deep charcoal green */}
          <g fill="#010703" style={{ transformOrigin: "50% 100%" }} className="animate-sway-fast">
            <use href="#broad-tree" x="50" y="315" transform="scale(1.8)" />
            <use href="#pine-tree" x="140" y="320" transform="scale(1.7)" />
            <use href="#broad-tree" x="220" y="310" transform="scale(1.9)" />
            <use href="#pine-tree" x="300" y="325" transform="scale(1.65)" />
            <use href="#broad-tree" x="390" y="310" transform="scale(1.85)" />
            <use href="#pine-tree" x="470" y="320" transform="scale(1.7)" />
            <use href="#broad-tree" x="550" y="315" transform="scale(1.8)" />
            <use href="#pine-tree" x="630" y="325" transform="scale(1.65)" />
            <use href="#broad-tree" x="720" y="310" transform="scale(1.9)" />
            <use href="#pine-tree" x="800" y="320" transform="scale(1.75)" />
            <use href="#broad-tree" x="880" y="315" transform="scale(1.8)" />
            <use href="#pine-tree" x="960" y="325" transform="scale(1.65)" />
          </g>
        </svg>

        {/* Dynamic Fog sweeping layers (Seamless horizontal looping) */}
        <div className="absolute inset-0 z-1 overflow-hidden opacity-30 pointer-events-none">
          <div 
            className="absolute inset-y-0 left-0 w-[200%] animate-fog-slow"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(10,38,21,0.2) 25%, transparent 50%, rgba(10,38,21,0.2) 75%, transparent 100%)"
            }}
          />
          <div 
            className="absolute inset-y-0 left-0 w-[200%] animate-fog-fast"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(0,230,118,0.05) 25%, transparent 50%, rgba(0,230,118,0.05) 75%, transparent 100%)"
            }}
          />
        </div>

        {/* Ambient Spore particles drifting upward (Fully GPU-Accelerated) */}
        <div className="absolute inset-0 z-2 overflow-hidden pointer-events-none">
          <div className="absolute left-[8%] w-1.5 h-1.5 rounded-full bg-neon/30 blur-[0.5px] animate-spore-1" style={{ animationDelay: "0s" }} />
          <div className="absolute left-[22%] w-2 h-2 rounded-full bg-emerald-400/25 blur-[0.5px] animate-spore-2" style={{ animationDelay: "3s" }} />
          <div className="absolute left-[38%] w-1 h-1 rounded-full bg-neon/40 animate-spore-3" style={{ animationDelay: "7s" }} />
          <div className="absolute left-[52%] w-2 h-2 rounded-full bg-emerald-400/35 blur-[0.5px] animate-spore-1" style={{ animationDelay: "5s" }} />
          <div className="absolute left-[68%] w-1.5 h-1.5 rounded-full bg-neon/25 blur-[0.5px] animate-spore-2" style={{ animationDelay: "1.5s" }} />
          <div className="absolute left-[82%] w-1 h-1 rounded-full bg-emerald-300/40 animate-spore-3" style={{ animationDelay: "9s" }} />
          <div className="absolute left-[16%] w-2 h-2 rounded-full bg-neon/25 blur-[0.5px] animate-spore-2" style={{ animationDelay: "11s" }} />
          <div className="absolute left-[46%] w-1.5 h-1.5 rounded-full bg-emerald-400/35 blur-[0.5px] animate-spore-1" style={{ animationDelay: "14s" }} />
          <div className="absolute left-[61%] w-2 h-2 rounded-full bg-neon/35 blur-[0.5px] animate-spore-3" style={{ animationDelay: "4.5s" }} />
          <div className="absolute left-[90%] w-1.5 h-1.5 rounded-full bg-emerald-300/25 blur-[0.5px] animate-spore-1" style={{ animationDelay: "8s" }} />
        </div>

        {/* Radial layout mask to center-focus layout card and boost readability */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(4,16,8,0.7)_80%)]" />
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-br from-black/15 via-transparent to-black/45" />

      {/* Card wrapper */}
      <motion.div
        initial={{ y: 35, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 border border-white/10 rounded-3xl bg-forest/65 backdrop-blur-2xl shadow-2xl glow-card"
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-10 h-10 border border-neon/30 rounded-xl bg-neon/15">
            <Leaf className="w-5 h-5 text-neon" />
          </div>
          <div>
            <div className="font-sans font-bold tracking-wide text-white/95 text-lg">SylvaLab</div>
            <div className="text-[10px] text-gray-400 tracking-widest uppercase">Lab Kehutanan Unsulbar</div>
          </div>
        </div>

        {/* Header Heading */}
        <h1 className="mb-2 font-serif text-3xl font-semibold leading-tight text-white">
          Selamat <br />
          <span className="text-neon italic">datang</span> kembali
        </h1>
        <p className="mb-8 text-sm text-gray-400">Masuk dengan NIM atau NIP untuk mengajukan peminjaman</p>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 text-xs tracking-widest text-gray-400 uppercase">NIM / NIP</label>
            <div className="relative">
              <IdCard className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3.5 top-1/2" />
              <input
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="Contoh: D0521001"
                className="w-full h-12 pl-11 pr-4 text-sm text-white border outline-none border-white/15 rounded-xl bg-white/5 focus:border-neon/50 focus:ring-1 focus:ring-neon/30 transition-all placeholder:text-white/20"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-xs tracking-widest text-gray-400 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3.5 top-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-10 text-sm text-white border outline-none border-white/15 rounded-xl bg-white/5 focus:border-neon/50 focus:ring-1 focus:ring-neon/30 transition-all placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 p-3 text-sm rounded-xl border border-red-500/30 bg-red-500/10 text-red-300"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full h-12 gap-2 text-sm font-semibold rounded-xl bg-neon text-forest hover:bg-[#00c865] active:scale-[0.98] transition-all disabled:opacity-55 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Memverifikasi..." : "Masuk ke SylvaLab"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Guidelines / Info Section */}
        <div className="p-4 mt-6 leading-relaxed text-xs text-gray-400 border border-white/5 rounded-xl bg-white/2">
          <span className="font-semibold text-neon">Tips:</span> Belum punya akun? Akun baru akan otomatis dibuatkan jika NIM Anda sudah didaftarkan oleh <strong className="text-gray-200">Super Admin</strong> atau <strong className="text-gray-200">Koordinator Lab</strong>. Gunakan password default <strong className="text-neon font-bold">12345</strong> jika baru didaftarkan.
        </div>

        {/* Interactive Demo Accounts Box */}
        <div className="p-4 mt-4 border border-white/10 rounded-xl bg-white/5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neon">Akun Demo (Klik untuk Auto-Fill):</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                setNim("12345");
                setPassword("admin123");
              }}
              className="flex items-center justify-between p-2 text-left text-xs rounded-lg bg-black/30 hover:bg-white/10 border border-white/5 hover:border-neon/30 text-white transition-all"
            >
              <div>
                <span className="font-semibold text-neon">Super Admin</span>
                <span className="block text-[10px] text-gray-400">NIM/NIP: 12345</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neon/10 text-neon font-mono">admin123</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNim("kepala_lab");
                setPassword("12345");
              }}
              className="flex items-center justify-between p-2 text-left text-xs rounded-lg bg-black/30 hover:bg-white/10 border border-white/5 hover:border-neon/30 text-white transition-all"
            >
              <div>
                <span className="font-semibold text-emerald-400">Kepala Lab Kehutanan</span>
                <span className="block text-[10px] text-gray-400">NIP: kepala_lab</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">12345</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNim("kepala_upa");
                setPassword("12345");
              }}
              className="flex items-center justify-between p-2 text-left text-xs rounded-lg bg-black/30 hover:bg-white/10 border border-white/5 hover:border-neon/30 text-white transition-all"
            >
              <div>
                <span className="font-semibold text-teal-400">Kepala UPA Lab Terpadu</span>
                <span className="block text-[10px] text-gray-400">NIP: kepala_upa</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 font-mono">12345</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNim("petugas");
                setPassword("12345");
              }}
              className="flex items-center justify-between p-2 text-left text-xs rounded-lg bg-black/30 hover:bg-white/10 border border-white/5 hover:border-neon/30 text-white transition-all"
            >
              <div>
                <span className="font-semibold text-neon">Petugas Lab</span>
                <span className="block text-[10px] text-gray-400">NIP: petugas</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neon/10 text-neon font-mono">12345</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNim("D0521001");
                setPassword("12345");
              }}
              className="flex items-center justify-between p-2 text-left text-xs rounded-lg bg-black/30 hover:bg-white/10 border border-white/5 hover:border-neon/30 text-white transition-all"
            >
              <div>
                <span className="font-semibold text-neon">Peminjam (Mahasiswa)</span>
                <span className="block text-[10px] text-gray-400">NIM: D0521001</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-neon/10 text-neon font-mono">12345</span>
            </button>
          </div>
        </div>

        {/* App Footer */}
        <p className="mt-6 text-center text-[11px] text-gray-500">SylvaLab v2.0 • Didukung oleh Firestore & Auth</p>
      </motion.div>
    </div>
  );
}

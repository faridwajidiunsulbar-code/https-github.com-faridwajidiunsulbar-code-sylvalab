import { useState } from "react";
import { UserProfile } from "../types";
import {
  Leaf,
  ShoppingBasket,
  LogOut,
  ShieldCheck,
  User,
  HelpCircle,
  Users,
  Menu,
  X,
  ChevronRight,
  LogIn
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
  onSwitchView?: (view: "public" | "peminjam" | "admin" | "organization" | "about") => void;
  currentView?: string;
}

export default function Navbar({
  user,
  onLogout,
  onOpenCart,
  cartCount = 0,
  onSwitchView,
  currentView
}: NavbarProps) {
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const isStaff = user && user.role !== "PEMINJAM";

  const toggleMobileMenu = () => setIsOpenMobileMenu(!isOpenMobileMenu);
  const closeMobileMenu = () => setIsOpenMobileMenu(false);

  return (
    <nav className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-white/10 bg-[#041008]/90 backdrop-blur-md shadow-lg" id="navbar-main">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        
        {/* Brand logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer select-none group" 
          onClick={() => {
            closeMobileMenu();
            onSwitchView?.("public");
          }} 
          id="navbar-logo"
        >
          <div className="flex items-center justify-center w-8 h-8 border border-neon/30 rounded-lg bg-neon/15 group-hover:border-neon transition-colors">
            <Leaf className="w-4 h-4 text-neon" />
          </div>
          <span className="font-serif font-black text-lg text-white tracking-tight">SylvaLab</span>
        </div>

        {/* ────────── DESKTOP NAVIGATION ────────── */}
        <div className="hidden md:flex items-center gap-1.5" id="navbar-links">
          <button
            onClick={() => onSwitchView?.("public")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              currentView === "public"
                ? "bg-neon/15 text-neon border border-neon/20 font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Katalog Publik
          </button>

          <button
            onClick={() => onSwitchView?.("about")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === "about"
                ? "bg-neon/15 text-neon border border-neon/20 font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            id="btn-about-page"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tentang & SOP</span>
          </button>

          <button
            onClick={() => onSwitchView?.("organization")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentView === "organization"
                ? "bg-neon/15 text-neon border border-neon/20 font-bold"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            id="btn-org-page"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Struktur Organisasi</span>
          </button>

          {user && user.role === "PEMINJAM" && (
            <button
              onClick={() => onSwitchView?.("peminjam")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === "peminjam"
                  ? "bg-neon/15 text-neon border border-neon/20 font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Portal Peminjam
            </button>
          )}

          {isStaff && (
            <button
              onClick={() => onSwitchView?.("admin")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentView === "admin"
                  ? "bg-neon/15 text-neon border border-neon/20 font-bold"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Panel Admin
            </button>
          )}
        </div>

        {/* ────────── USER STATE / DESKTOP & MOBILE TRIGGER ────────── */}
        <div className="flex items-center gap-3" id="navbar-user-section">
          {user ? (
            <>
              {/* Profile card / brief info (Desktop only) */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                {isStaff ? (
                  <ShieldCheck className="w-4 h-4 text-neon flex-shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
                )}
                <div className="text-left text-xs leading-tight">
                  <div className="font-semibold text-white truncate max-w-[120px]">
                    {user.nama.split(" ")[0]}
                  </div>
                  <div className="text-[9px] text-gray-400 truncate uppercase font-mono tracking-wider">
                    {user.role.replace(/_/g, " ")}
                  </div>
                </div>
              </div>

              {/* Cart button (Shown on Desktop and Mobile to PEMINJAM for speed) */}
              {user.role === "PEMINJAM" && onOpenCart && (
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center gap-1.5 px-3 py-2 border border-white/10 text-xs font-semibold text-white rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                  id="btn-cart-nav"
                >
                  <ShoppingBasket className="w-4 h-4 text-neon" />
                  <span className="hidden sm:inline">Keranjang</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neon text-forest min-w-[18px] text-center leading-none">
                    {cartCount}
                  </span>
                </button>
              )}

              {/* Desktop Logout Button */}
              <button
                onClick={onLogout}
                className="hidden md:flex p-2 border border-white/5 hover:border-red-500/30 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                title="Keluar dari SylvaLab"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Hamburger menu toggle */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 border border-white/10 rounded-lg bg-white/5 text-gray-300 hover:text-white transition-colors cursor-pointer"
                id="btn-mobile-hamburger"
              >
                {isOpenMobileMenu ? <X className="w-5 h-5 text-neon" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {/* Desktop Login Button */}
              <button
                onClick={() => onSwitchView?.("admin")}
                className="hidden md:block px-4 py-1.5 text-xs font-semibold rounded-lg bg-neon text-forest hover:bg-[#00c865] transition-all cursor-pointer font-bold"
              >
                Masuk
              </button>

              {/* Mobile Hamburger toggle for guests */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 border border-white/10 rounded-lg bg-white/5 text-gray-300 hover:text-white transition-colors cursor-pointer"
                id="btn-mobile-hamburger-guest"
              >
                {isOpenMobileMenu ? <X className="w-5 h-5 text-neon" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ────────── MOBILE DROPDOWN DRAWER ────────── */}
      <AnimatePresence>
        {isOpenMobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-[#041008]/95 backdrop-blur-xl absolute top-[58px] left-0 right-0 z-50 px-5 py-6 space-y-6 shadow-2xl"
            id="mobile-drawer"
          >
            {/* User Details inside Mobile Drawer */}
            {user ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon/15 border border-neon/30 text-neon font-black font-serif text-lg">
                  {user.nama.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user.nama}</p>
                  <p className="text-[10px] text-gray-400 truncate uppercase font-mono tracking-wider mt-0.5">
                    {user.role.replace(/_/g, " ")}
                  </p>
                </div>
                {isStaff ? (
                  <ShieldCheck className="w-5 h-5 text-neon flex-shrink-0" />
                ) : (
                  <User className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#071f10] border border-emerald-500/10 text-center space-y-3">
                <p className="text-xs text-gray-400">Silakan login untuk meminjam alat praktikum secara digital.</p>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    onSwitchView?.("admin");
                  }}
                  className="w-full py-2.5 rounded-xl bg-neon text-forest font-bold text-xs hover:bg-[#00c865] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk ke SylvaLab</span>
                </button>
              </div>
            )}

            {/* Tap-friendly Navigation list */}
            <div className="space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-emerald-500 uppercase block px-1">Menu Utama</span>
              
              <button
                onClick={() => {
                  closeMobileMenu();
                  onSwitchView?.("public");
                }}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentView === "public"
                    ? "bg-neon/10 border-neon text-white font-bold"
                    : "bg-white/2 border-white/5 text-gray-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Leaf className={`w-4 h-4 ${currentView === "public" ? "text-neon" : "text-gray-400"}`} />
                  <span className="text-xs">Katalog Publik</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => {
                  closeMobileMenu();
                  onSwitchView?.("about");
                }}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentView === "about"
                    ? "bg-neon/10 border-neon text-white font-bold"
                    : "bg-white/2 border-white/5 text-gray-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className={`w-4 h-4 ${currentView === "about" ? "text-neon" : "text-gray-400"}`} />
                  <span className="text-xs">Tentang & SOP Resmi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={() => {
                  closeMobileMenu();
                  onSwitchView?.("organization");
                }}
                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentView === "organization"
                    ? "bg-neon/10 border-neon text-white font-bold"
                    : "bg-white/2 border-white/5 text-gray-300 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`w-4 h-4 ${currentView === "organization" ? "text-neon" : "text-gray-400"}`} />
                  <span className="text-xs">Struktur Organisasi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>

              {user && user.role === "PEMINJAM" && (
                <button
                  onClick={() => {
                    closeMobileMenu();
                    onSwitchView?.("peminjam");
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    currentView === "peminjam"
                      ? "bg-neon/10 border-neon text-white font-bold"
                      : "bg-white/2 border-white/5 text-gray-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-4 h-4 ${currentView === "peminjam" ? "text-neon" : "text-gray-400"}`} />
                    <span className="text-xs">Portal Peminjam</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              )}

              {isStaff && (
                <button
                  onClick={() => {
                    closeMobileMenu();
                    onSwitchView?.("admin");
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    currentView === "admin"
                      ? "bg-neon/10 border-neon text-white font-bold"
                      : "bg-white/2 border-white/5 text-gray-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-4 h-4 ${currentView === "admin" ? "text-neon" : "text-gray-400"}`} />
                    <span className="text-xs">Panel Admin</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {/* Logout at bottom of mobile menu */}
            {user && (
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => {
                    closeMobileMenu();
                    onLogout();
                  }}
                  className="w-full py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 font-bold text-xs hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

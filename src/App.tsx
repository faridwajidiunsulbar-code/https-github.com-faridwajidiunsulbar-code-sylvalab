import { useState, useEffect } from "react";
import { UserProfile } from "./types";
import { seedInitialData } from "./lib/db";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import PeminjamPortal from "./components/PeminjamPortal";
import AdminPanel from "./components/AdminPanel";
import PublicCatalog from "./components/PublicCatalog";
import OrganizationPage from "./components/OrganizationPage";
import AboutPage from "./components/AboutPage";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<"public" | "peminjam" | "admin" | "login" | "organization" | "about">("public");
  const [cartCount, setCartCount] = useState(0);
  const [isOpenCart, setIsOpenCart] = useState(false);

  // Initialize and check for session
  useEffect(() => {
    // 1. Seed initial Firestore data if collections are empty
    seedInitialData();

    // 2. Load session from storage if logged in
    const cachedUser = sessionStorage.getItem("sylvalab_user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as UserProfile;
        setUser(parsed);
        // Direct to correct dashboard
        if (parsed.role === "PEMINJAM") {
          setView("peminjam");
        } else {
          setView("admin");
        }
      } catch (e) {
        console.error("Failed to parse cached session:", e);
      }
    }
  }, []);

  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    sessionStorage.setItem("sylvalab_user", JSON.stringify(profile));
    
    // Route role correctly
    if (profile.role === "PEMINJAM") {
      setView("peminjam");
    } else {
      setView("admin");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("sylvalab_user");
    setUser(null);
    setCartCount(0);
    setIsOpenCart(false);
    setView("public");
  };

  const handleUpdateUser = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    sessionStorage.setItem("sylvalab_user", JSON.stringify(updatedProfile));
  };

  const handleSwitchView = (targetView: "public" | "peminjam" | "admin" | "organization" | "about") => {
    if (targetView === "public") {
      setView("public");
      return;
    }

    if (targetView === "organization") {
      setView("organization");
      return;
    }

    if (targetView === "about") {
      setView("about");
      return;
    }

    if (!user) {
      setView("login");
      return;
    }

    // Role guards
    if (targetView === "peminjam" && user.role === "PEMINJAM") {
      setView("peminjam");
    } else if (targetView === "admin" && user.role !== "PEMINJAM") {
      setView("admin");
    } else {
      // Fallback
      setView("public");
    }
  };

  return (
    <div className="min-h-screen bg-[#041008] text-white flex flex-col font-sans select-none">
      {/* 1. LOGIN SCREEN (Full page, no shared headers) */}
      {view === "login" && (
        <div className="flex-1 flex flex-col justify-center">
          {/* Header to go back */}
          <div className="absolute top-5 left-5 z-20">
            <button
              onClick={() => setView("public")}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              ← Kembali ke Katalog
            </button>
          </div>
          <Login onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {/* 2. ADMIN PANEL (Full workspace, has its own custom nested sidebar navigation) */}
      {view === "admin" && user && (
        <AdminPanel user={user} onLogout={handleLogout} />
      )}

      {/* 3. PORTALS THAT INHERIT THE GENERAL SITE NAVBAR (Public & Student Booking screens) */}
      {(view === "public" || view === "peminjam" || view === "organization" || view === "about") && (
        <>
          <Navbar
            user={user}
            onLogout={handleLogout}
            onOpenCart={() => setIsOpenCart(true)}
            cartCount={cartCount}
            onSwitchView={handleSwitchView}
            currentView={view}
          />

          <main className="flex-grow">
            {view === "public" && (
              <PublicCatalog
                onGoToLogin={() => {
                  if (user) {
                    handleSwitchView(user.role === "PEMINJAM" ? "peminjam" : "admin");
                  } else {
                    setView("login");
                  }
                }}
                isLoggedIn={!!user}
              />
            )}

            {view === "peminjam" && user && (
              <PeminjamPortal
                user={user}
                onUpdateUser={handleUpdateUser}
                isOpenCart={isOpenCart}
                onCloseCart={() => setIsOpenCart(false)}
                onCartCountChange={(count) => setCartCount(count)}
              />
            )}

            {view === "organization" && (
              <OrganizationPage onBack={() => setView("public")} />
            )}

            {view === "about" && (
              <AboutPage
                onBack={() => setView("public")}
                user={user}
                onGoToOrg={() => setView("organization")}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

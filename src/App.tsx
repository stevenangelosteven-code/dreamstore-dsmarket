import React, { useState, useEffect } from "react";
import { ShoppingBag, Search, ShieldCheck, Mail, Phone, Lock, Sparkles, LogIn, ChevronRight, CornerDownRight, User as UserIcon, Wallet, Headphones, MessageSquare, Send, Bot } from "lucide-react";
import { Catalog } from "./components/Catalog";
import { OrderTracker } from "./components/OrderTracker";
import { AdminPanel } from "./components/AdminPanel";
import { UserAuthModal } from "./components/UserAuthModal";
import { UserProfileModal } from "./components/UserProfileModal";
import { CustomerServiceWidget } from "./components/CustomerServiceWidget";

interface PromoBanner {
  text: string;
  isActive: boolean;
  linkUrl?: string;
  bgColor?: string;
  textColor?: string;
}

export default function App() {
  // Navigation tabs: 'catalog' | 'tracker' | 'admin'
  const [activeTab, setActiveTab] = useState<"catalog" | "tracker" | "admin" >("catalog");

  // Banner announcement state
  const [banner, setBanner] = useState<PromoBanner | null>(null);

  // Store layout and contact details state
  const [storeConfig, setStoreConfig] = useState<{
    footerDescription: string;
    aboutUs: string;
    supportEmail: string;
    supportPhone: string;
    copyrightText: string;
  } | null>(null);

  // Admin session authentication states
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("dream_admin_token") || "");
  const [adminUsername, setAdminUsername] = useState(() => localStorage.getItem("dream_admin_user") || "");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Regular user login state and credentials storage
  const [userToken, setUserToken] = useState(() => localStorage.getItem("dream_user_token") || "");
  const [userData, setUserData] = useState<{ id: string; email: string; phone: string; name: string; balance?: number } | null>(() => {
    try {
      const stored = localStorage.getItem("dream_user_data");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Modal display states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"orders" | "topup">("orders");

  // Handle auto-selected tracking of order ID
  const [trackedOrderId, setTrackedOrderId] = useState("");

  // Check token lifetimes on startup
  useEffect(() => {
    if (adminToken) {
      verifyAdminToken(adminToken);
    }
    if (userToken) {
      verifyUserToken(userToken);
    }
    fetchBanner();
    fetchStoreConfig();

    // Event listener to sync user profile state instantly without full reload
    const handleSyncProfile = () => {
      const token = localStorage.getItem("dream_user_token");
      if (token) {
        verifyUserToken(token);
      }
    };
    
    const handleSyncConfig = () => {
      fetchStoreConfig();
    };

    window.addEventListener("sync_user_profile", handleSyncProfile);
    window.addEventListener("sync_store_config", handleSyncConfig);
    return () => {
      window.removeEventListener("sync_user_profile", handleSyncProfile);
      window.removeEventListener("sync_store_config", handleSyncConfig);
    };
  }, []);

  const fetchStoreConfig = async () => {
    try {
      const res = await fetch("/api/store-config");
      if (res.ok) {
        const data = await res.json();
        setStoreConfig(data);
      }
    } catch (e) {
      console.warn("Offline fallback for config fetch");
    }
  };

  const verifyUserToken = async (token: string) => {
    try {
      const res = await fetch("/api/user/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          balance: data.balance || 0
        };
        localStorage.setItem("dream_user_data", JSON.stringify(updatedUser));
        setUserData(updatedUser);
      } else {
        handleUserLogout();
      }
    } catch {
      console.warn("User authentication offline fallbacks");
    }
  };

  const handleUserLoginSuccess = (token: string, user: { id: string; email: string; phone: string; name: string }) => {
    localStorage.setItem("dream_user_token", token);
    localStorage.setItem("dream_user_data", JSON.stringify(user));
    setUserToken(token);
    setUserData(user);
  };

  const handleUserLogout = () => {
    localStorage.removeItem("dream_user_token");
    localStorage.removeItem("dream_user_data");
    setUserToken("");
    setUserData(null);
  };

  const handleQuickTrackOrder = (orderId: string) => {
    setTrackedOrderId(orderId);
    setActiveTab("tracker");
    // Hydrate state manually onto the input inside OrderTracker
    setTimeout(() => {
      const trackerInput = document.getElementById("search_id_input") as HTMLInputElement;
      if (trackerInput) {
        trackerInput.value = orderId;
        // Trigger the click search
        const btnTrack = document.getElementById("btn_track_order");
        if (btnTrack) btnTrack.click();
      }
    }, 150);
  };

  const fetchBanner = async () => {
    try {
      const res = await fetch("/api/banner");
      if (res.ok) {
        const data = await res.json();
        setBanner(data);
      }
    } catch (e) {
      console.warn("Offline fallback for banner fetch");
    }
  };

  const verifyAdminToken = async (token: string) => {
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) {
        // Token expired
        handleLogout();
      }
    } catch (e) {
      console.warn("Authentication verify offline fallbacks");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError("Harap isi username dan password admin.");
      return;
    }
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Username atau password salah.");
      }

      const data = await res.json();
      localStorage.setItem("dream_admin_token", data.token);
      localStorage.setItem("dream_admin_user", data.username);
      setAdminToken(data.token);
      setAdminUsername(data.username);
      setLoginPassword("");
      setLoginUsername("");
    } catch (err: any) {
      setLoginError(err.message || "Gagal masuk. Coba periksa koneksi Anda.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
    } catch (e) {
      console.warn("Logout request failed silently");
    }
    localStorage.removeItem("dream_admin_token");
    localStorage.removeItem("dream_admin_user");
    setAdminToken("");
    setAdminUsername("");
  };

  const handleOrderCreatedRedirect = (orderId: string) => {
    setTrackedOrderId(orderId);
    setActiveTab("tracker");
    // Hydrate state manually onto the input inside OrderTracker
    setTimeout(() => {
      const trackerInput = document.getElementById("search_id_input") as HTMLInputElement;
      if (trackerInput) {
        trackerInput.value = orderId;
        // Trigger the click search
        const btnTrack = document.getElementById("btn_track_order");
        if (btnTrack) btnTrack.click();
      }
    }, 150);
  };

  return (
    <div id="dream_store_root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 0. PROMO ANNOUNCEMENT BANNER */}
      {banner && banner.isActive && banner.text && (
        <div className={`${banner.bgColor || 'bg-slate-900 border-b border-indigo-500/20'} ${banner.textColor || 'text-white'} text-xs font-semibold py-2.5 px-4 text-center relative z-50 flex items-center justify-center gap-2 shadow-sm animate-fade-in`}>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span>{banner.text}</span>
          {banner.linkUrl ? (
            <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-300 transition duration-150 inline-flex items-center gap-0.5 ml-1 select-none">
              Info Selengkapnya <ChevronRight className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      )}

      {/* 1. TOP PREMIUM HEADER NAVIGATION BAR */}
      <header className="border-b border-slate-900 sticky top-0 bg-slate-950/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Combined Premium DS Logo Main branding */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab("catalog")}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-display font-black text-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300 group-hover:scale-105 border border-white/10 group-hover:border-white/20">
              DS
              <div className="absolute inset-[1.5px] rounded-lg border border-white/10"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-sm tracking-tight text-white group-hover:text-indigo-400 transition-colors uppercase">Dream Store</span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-400 uppercase">Digital Hub</span>
            </div>
          </div>

          {/* Interactive Navigation menu */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="nav_btn_catalog"
              onClick={() => setActiveTab("catalog")}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-slate-900 text-white border border-slate-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Belanja
            </button>

            <button
              id="nav_btn_tracker"
              onClick={() => setActiveTab("tracker")}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                activeTab === "tracker"
                  ? "bg-slate-900 text-white border border-slate-800"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              History Pembelian
            </button>

            {userToken && userData ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="nav_btn_topup_trigger"
                  onClick={() => {
                    setModalInitialTab("topup");
                    setIsProfileModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 hover:text-white border border-violet-500/30 hover:border-violet-400 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-500/5 select-none"
                  title="Klik untuk Top-Up Saldo"
                >
                  <Wallet className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="font-mono font-bold text-white text-[11px] sm:text-xs">
                    Rp {(userData.balance || 0).toLocaleString("id-ID")}
                  </span>
                  <span className="bg-violet-600 hover:bg-violet-500 text-white font-extrabold rounded px-1.5 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-wider animate-pulse inline-block shrink-0">
                    + Top-Up
                  </span>
                </button>

                <button
                  id="nav_btn_user_profile"
                  onClick={() => {
                    setModalInitialTab("orders");
                    setIsProfileModalOpen(true);
                  }}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900 text-slate-300 hover:text-white border border-slate-805 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer hover:border-slate-700 shadow-sm shrink-0"
                >
                  <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="hidden md:inline text-[11px] sm:text-xs">Hai,</span> <span className="font-bold text-white text-[11px] sm:text-xs">{userData.name.split(" ")[0]}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav_btn_topup_nonlogged"
                  onClick={() => {
                    setIsAuthModalOpen(true);
                  }}
                  className="hidden md:flex px-3 py-2 bg-slate-950 text-slate-400 hover:text-white border border-slate-850 hover:border-violet-500/40 rounded-xl text-xs font-semibold transition items-center gap-1.5 cursor-pointer"
                  title="Masuk untuk isi saldo"
                >
                  <Wallet className="w-3.5 h-3.5 text-slate-500" />
                  <span>Isi Saldo Wallet</span>
                </button>

                <button
                  id="nav_btn_user_login"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3 sm:px-3.5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/15"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Masuk / Daftar
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 2. CORE DYNAMIC BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {activeTab === "catalog" && (
          <Catalog 
            onOrderCreated={handleOrderCreatedRedirect} 
            userEmail={userData?.email || ""}
            userPhone={userData?.phone || ""}
          />
        )}

        {activeTab === "tracker" && (
          <OrderTracker userToken={userToken} userData={userData} />
        )}

        {activeTab === "admin" && (
          <div>
            {adminToken ? (
              <AdminPanel
                adminToken={adminToken}
                adminUsername={adminUsername}
                onLogout={handleLogout}
                onBannerUpdated={fetchBanner}
              />
            ) : (
              /* SECURE ADMIN LOGIN SCREEN */
              <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-bold flex items-center justify-center mx-auto shadow-lg">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <h2 className="font-display font-bold text-2xl text-white">Login Admin</h2>
                  <p className="text-slate-400 text-xs">
                    Amankan kredensial sistem. Hanya pemilik otorisasi yang dapat mengecek data operasional.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl text-center">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold font-display block">Username</label>
                    <input
                      type="text"
                      id="admin_username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Username admin"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold font-display block">Password</label>
                    <input
                      type="password"
                      id="admin_password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition"
                    />
                  </div>

                  <button
                    id="btn_admin_login_submit"
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-white text-slate-950 hover:bg-slate-200 font-bold text-sm tracking-wide rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow hover:shadow-white/5"
                  >
                    {loginLoading ? "Memverifikasi..." : "Akses Dashboard"}
                    <LogIn className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. FOOTER AREA */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-display font-black text-sm border border-white/10">
                DS
              </div>
              <span className="font-display font-bold text-white text-sm uppercase tracking-wide">DREAM STORE</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              {storeConfig?.footerDescription || "E-Commerce penyalur akun premium, subscription membership, dan kredensial digital instan otomatis terlengkap & teraman."}
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block font-display">TENTANG KAMI</span>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              {storeConfig?.aboutUs || "Platform operasional digital berkecepatan tinggi dengan integrasi auto-distribution stok kredensial digital orisinal premium."}
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block font-display">LAYANAN DARURAT</span>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{storeConfig?.supportEmail || "support@dreamstore.net"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{storeConfig?.supportPhone || "+62 857 1212 9999 (WhatsApp)"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-900 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-mono">
          <span>{storeConfig?.copyrightText || `© ${new Date().getFullYear()} Dream Store Digital. Seluruh hak cipta dilindungi. Crafted for Ultimate Speed & Aesthetics`}</span>
          <div className="flex items-center gap-4 font-mono">
            <span>Crafted for Ultimate Speed & Aesthetics</span>
            <span className="text-slate-800 hidden sm:inline">|</span>
            <button
              id="btn_footer_admin_login"
              onClick={() => setActiveTab("admin")}
              className="hover:text-indigo-400 transition cursor-pointer flex items-center gap-1 select-none text-slate-400 hover:underline"
            >
              <Lock className="w-3 h-3 text-slate-500" />
              {adminToken ? `Dashboard Admin (${adminUsername})` : "Akses Admin"}
            </button>
          </div>
        </div>
      </footer>

      {/* 4. MODALS (AUTHENTICATION & PROFILE DASHBOARDS) */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleUserLoginSuccess}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userToken={userToken}
        user={userData}
        onLogout={handleUserLogout}
        onTrackOrder={handleQuickTrackOrder}
        initialTab={modalInitialTab}
      />

      <CustomerServiceWidget userEmail={userData?.email || ""} />

    </div>
  );
}

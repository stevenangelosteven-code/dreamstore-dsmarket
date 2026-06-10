import React, { useState } from "react";
import { X, Lock, Mail, Phone, User as UserIcon, LogIn, ChevronRight, Sparkles, ShieldCheck, Eye, EyeOff } from "lucide-react";

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, user: { id: string; email: string; phone: string; name: string }) => void;
}

export function UserAuthModal({ isOpen, onClose, onLoginSuccess }: UserAuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg("Harap masukkan email dan password Anda.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html") || res.status === 404) {
        throw new Error("Koneksi API Gagal (404/HTML). Kemungkinan besar Anda mengakses domain Vercel / hosting statis yang tidak menjalankan backend server NodeJS/Express secara aktif. Harap akses melalui URL Cloud Run atau gunakan hosting full-stack!");
      }

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Gagal membaca respon server (bukan JSON). Pastikan backend server aktif.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Email atau password salah.");
      }

      onLoginSuccess(data.token, data.user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk. Periksa internet atau data Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPhone || !regName || !regPassword) {
      setErrorMsg("Semua kolom pendaftaran wajib diisi!");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail.trim(),
          phone: regPhone.trim(),
          name: regName.trim(),
          password: regPassword
        })
      });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html") || res.status === 404) {
        throw new Error("Koneksi API Gagal (404/HTML). Kemungkinan besar Anda mengakses domain Vercel / hosting statis yang tidak menjalankan backend server NodeJS/Express secara aktif. Harap akses melalui URL Cloud Run atau gunakan hosting full-stack!");
      }

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error("Gagal membaca respon server (bukan JSON). Pastikan backend server aktif.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Pendaftaran gagal.");
      }

      setSuccessMsg(data.message || "Pendaftaran sukses! Silakan login.");
      // Clear forms
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      // Redirect to login tab after brief interval
      setTimeout(() => {
        setActiveTab("login");
        setLoginEmail(regEmail);
        setSuccessMsg("");
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || "Registrasi gagal. Email mungkin telah digunakan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Dark Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Frame Container */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-hidden animate-fade-in">
        
        {/* Close Button Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-950/50 hover:bg-slate-950/90 text-slate-400 hover:text-white rounded-full transition duration-150 z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT SIDE PANEL: VALUE PROPOSITION (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 flex flex-col justify-between border-r border-slate-800/80 text-left space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DREAM HUB MEMBERSHIP</span>
            </div>
            
            <h3 className="font-display font-black text-white text-xl md:text-2xl leading-tight">
              Satu Akun Untuk Kemudahan Digital Anda
            </h3>
            
            <p className="text-slate-400 text-xs leading-relaxed">
              Bergabunglah bersama ribuan pelanggan Dream Store untuk menikmati sistem auto-pengiriman produk premium tercepat.
            </p>
          </div>

          <div className="space-y-4">
            
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white font-display">Lacak Riwayat Pembelian</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Semua kredensial akun digital yang Anda beli tersimpan rapi dan aman di satu layar pribadi.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white font-display">Instan Auto-Fill Form</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Tidak perlu mengetik email dan WhatsApp berulang-ulang ketika Anda checkout produk.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white font-display">Kredensial Aman 100%</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Sistem data terenkripsi rahasia, memastikan akun langganan Anda bebas jangkauan umum.</p>
              </div>
            </div>

          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            Dream Store Digital &bull; VIP Member
          </div>
        </div>

        {/* RIGHT SIDE PANEL: FORMS TABS (7 cols) */}
        <div className="md:col-span-7 bg-slate-900 p-8 md:p-10 flex flex-col justify-center">
          
          {/* Header tabs toggle link */}
          <div className="flex border-b border-slate-800 pb-3 mb-6">
            <button
              onClick={() => { setActiveTab("login"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 text-center pb-2 text-sm font-semibold border-b-2 transition ${
                activeTab === "login" 
                  ? "border-indigo-500 text-white font-bold" 
                  : "border-transparent text-slate-450 hover:text-white"
              }`}
            >
              Masuk Akun
            </button>
            <button
              onClick={() => { setActiveTab("register"); setErrorMsg(""); setSuccessMsg(""); }}
              className={`flex-1 text-center pb-2 text-sm font-semibold border-b-2 transition ${
                activeTab === "register" 
                  ? "border-indigo-500 text-white font-bold" 
                  : "border-transparent text-slate-450 hover:text-white"
              }`}
            >
              Daftar Hub Baru
            </button>
          </div>

          {/* Feedback alerts notifications */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center mb-4 leading-normal">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl text-center mb-4 leading-normal">
              {successMsg}
            </div>
          )}

          {/* LOGIN TAB FORM */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Alamat Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Kata Sandi (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password Anda"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-tr from-indigo-500 to-violet-600 text-white hover:opacity-90 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md disabled:opacity-40 mt-6"
              >
                {loading ? "Memverifikasi..." : "Masuk ke Akun"}
                <LogIn className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* REGISTER TAB FORM */}
          {activeTab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Dodi Darmawan"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="dodi@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">No. WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0857XXXXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Kata Sandi Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-white rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md disabled:opacity-40 mt-6"
              >
                {loading ? "Mendaftarkan Akun..." : "Buat Akun Hub Baru"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}

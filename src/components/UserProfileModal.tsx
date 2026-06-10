import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, ShoppingBag, Copy, Check, RefreshCw, LogOut, ArrowRight, Sparkles, ExternalLink, Star } from "lucide-react";
import { Order } from "../types";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToken: string;
  user: { id: string; email: string; phone: string; name: string } | null;
  onLogout: () => void;
  onTrackOrder: (orderId: string) => void;
  initialTab?: "orders" | "topup";
}

export function UserProfileModal({ isOpen, onClose, userToken, user, onLogout, onTrackOrder, initialTab = "orders" }: UserProfileModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<"orders" | "topup" | "pin">("orders");
  const [topups, setTopups] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [proofBase64, setProofBase64] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [topupStatusMsg, setTopupStatusMsg] = useState("");
  const [topupErrorMsg, setTopupErrorMsg] = useState("");
  const [isSubmittingTopup, setIsSubmittingTopup] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Complain & PIN states
  const [complainTelegramUrl, setComplainTelegramUrl] = useState("https://t.me/dreamstore_support");
  const [hasSecurityPin, setHasSecurityPin] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinSuccessMsg, setPinSuccessMsg] = useState("");
  const [pinErrorMsg, setPinErrorMsg] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  const fetchPinStatus = async () => {
    try {
      const res = await fetch("/api/user/pin-status", {
        headers: { "Authorization": `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHasSecurityPin(data.hasPin);
      }
    } catch (e) {
      console.warn("Failed fetching PIN status", e);
    }
  };

  const fetchStoreConfigClient = async () => {
    try {
      const res = await fetch("/api/store-config");
      if (res.ok) {
        const data = await res.json();
        if (data && data.complainTelegramUrl) {
          setComplainTelegramUrl(data.complainTelegramUrl);
        }
      }
    } catch (e) {
      console.warn("Offline config loading", e);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinSuccessMsg("");
    setPinErrorMsg("");

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinErrorMsg("PIN baru harus berupa 6 digit angka.");
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinErrorMsg("Konfirmasi PIN baru tidak sesuai.");
      return;
    }

    setIsSavingPin(true);
    try {
      const res = await fetch("/api/user/pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`
        },
        body: JSON.stringify({
          pin: newPin,
          oldPin: hasSecurityPin ? oldPin : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui PIN keamanan.");
      }

      setPinSuccessMsg(data.message || "PIN keamanan berhasil disimpan!");
      setOldPin("");
      setNewPin("");
      setConfirmNewPin("");
      fetchPinStatus();
    } catch (err: any) {
      setPinErrorMsg(err.message || "Gagal menyimpan PIN.");
    } finally {
      setIsSavingPin(false);
    }
  };

  const fetchProfileDetails = async () => {
    try {
      const res = await fetch("/api/user/me", {
        headers: { "Authorization": `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserBalance(data.balance || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchUserTopups = async () => {
    try {
      const res = await fetch("/api/user/topups", {
        headers: { "Authorization": `Bearer ${userToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTopups(data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.filter((m: any) => m.status === "active") || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen && userToken) {
      if (initialTab) {
        setActiveSection(initialTab);
      }
      fetchUserOrders();
      fetchProfileDetails();
      fetchUserTopups();
      fetchPaymentMethods();
      fetchPinStatus();
      fetchStoreConfigClient();
    }
  }, [isOpen, userToken, initialTab]);

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/orders", {
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error("Gagal mengambil riwayat pesanan user", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const handleCopy = (text: string, orderId: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(orderId);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setTopupErrorMsg("Harap unggah berkas gambar bukti pembayaran yang sah (JPG, PNG, WEBP).");
      return;
    }

    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProofBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTopupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopupErrorMsg("");
    setTopupStatusMsg("");

    const amountNum = Number(topupAmount);
    if (!amountNum || amountNum < 5000) {
      setTopupErrorMsg("Minimal nominal top up saldo adalah Rp 5.000");
      return;
    }

    if (!selectedMethodId) {
      setTopupErrorMsg("Silakan pilih rekening transfer tujuan.");
      return;
    }

    if (!proofBase64) {
      setTopupErrorMsg("Wajib mengunggah screenshot bukti transfer.");
      return;
    }

    setIsSubmittingTopup(true);
    try {
      const res = await fetch("/api/user/topup", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amountNum,
          paymentMethodId: selectedMethodId,
          fileName: proofFileName,
          base64: proofBase64
        })
      });

      if (res.ok) {
        setTopupStatusMsg("Selesai! Permintaan top up berhasil diajukan. Mohon tunggu verifikasi manual admin dalam 5-10 menit.");
        setTopupAmount("");
        setSelectedMethodId("");
        setProofBase64("");
        setProofFileName("");
        fetchUserTopups();
        fetchProfileDetails();
      } else {
        const err = await res.json();
        setTopupErrorMsg(err.error || "Gagal mengirim permintaan top up.");
      }
    } catch (err) {
      setTopupErrorMsg("Gagal menghubungi server. Periksa koneksi internet Anda.");
    } finally {
      setIsSubmittingTopup(false);
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">Selesai</span>;
      case "failed":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Batal / Gagal</span>;
      case "refund":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Refund</span>;
      case "waiting_confirmation":
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Menunggu Verifikasi</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-850 text-slate-400 border border-slate-800">Menunggu Pembayaran</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Frame panel */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in text-left">
        
        {/* Header bar */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-md">
              <User className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Profil & Riwayat Belanja</h3>
              <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest mt-0.5">DREAM HUB ACCOUNT</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* USER BALANCE & WALLET HEADER */}
          <div className="bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-slate-950 border border-indigo-500/20 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center shadow-lg shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block">SALDO UTAMA &bull; DREAM PAY</span>
                <h4 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  Rp {userBalance.toLocaleString("id-ID")}
                </h4>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                id="tab_active_orders"
                onClick={() => setActiveSection("orders")}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  activeSection === "orders"
                    ? "bg-white text-slate-950 font-bold shadow"
                    : "bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900"
                }`}
              >
                Riwayat Belanja
              </button>
              <button
                id="tab_active_topups"
                onClick={() => {
                  setActiveSection("topup");
                  fetchUserTopups();
                  fetchPaymentMethods();
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  activeSection === "topup"
                    ? "bg-violet-600 hover:bg-violet-700 text-white font-bold shadow"
                    : "bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900"
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Top-Up Saldo
              </button>
              <button
                id="tab_active_pin"
                onClick={() => {
                  setActiveSection("pin");
                  fetchPinStatus();
                }}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 ${
                  activeSection === "pin"
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow"
                    : "bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900"
                }`}
              >
                Pengaturan PIN
              </button>
            </div>
          </div>

          {/* Section 1: User Profile Details Grid */}
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">NAMA LENGKAP</span>
                <span className="text-xs font-semibold text-white block truncate">{user.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">ALAMAT EMAIL</span>
                <span className="text-xs font-semibold text-white block truncate">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">NO. WHATSAPP</span>
                <span className="text-xs font-semibold text-white block truncate">{user.phone}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Order History List */}
          {activeSection === "orders" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-display font-medium text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  Riwayat Pembelian Digital Anda
                </h4>
                <button
                  onClick={fetchUserOrders}
                  disabled={loading}
                  className="p-1 px-2.5 text-[10px] font-semibold font-mono border border-slate-800 rounded-lg hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Muat Ulang
                </button>
              </div>

              {loading && orders.length === 0 ? (
                <p className="text-slate-500 text-xs font-mono py-12 text-center bg-slate-950/20 border border-slate-850 rounded-2xl">
                  Sedang memuat data transaksi pesanan Anda...
                </p>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl space-y-3">
                  <p className="text-slate-400 text-xs">
                    Anda belum pernah memesan di Dream Store menggunakan email <span className="font-semibold text-white font-mono">{user.email}</span>.
                  </p>
                  <p className="text-slate-500 text-[11px] leading-normal max-w-md mx-auto">
                    Silakan jelajahi katalog produk premium dan lakukan pemesanan untuk melihat kredensial digital Anda di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="p-4 bg-slate-950 border border-slate-850 rounded-2xl block space-y-3 text-xs"
                    >
                      
                      {/* Top Row: Product name + Status badge */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                            <span>{order.id}</span>
                            <span>&bull;</span>
                            <span>{new Date(order.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <h5 className="font-semibold text-white text-xs sm:text-sm mt-0.5">{order.productName}</h5>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                        </div>
                      </div>

                      {/* Middle Row: Delivered Account Credentials Box */}
                      {order.status === "completed" && order.accountDelivered ? (
                        <div className="p-3 bg-gradient-to-br from-green-950/40 to-emerald-950/10 border border-green-500/20 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-semibold text-green-400 flex items-center gap-1 font-display">
                              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                              KREDENSIAL AKUN SIAP DIGUNAKAN
                            </span>
                            <button
                              onClick={() => handleCopy(order.accountDelivered || "", order.id)}
                              className="p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 rounded text-slate-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer text-[10px]"
                              title="Salin Kredensial"
                            >
                              {copyStatus === order.id ? (
                                <>
                                  <Check className="w-3 h-3 text-green-400" />
                                  <span className="text-green-400 font-mono">Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span className="font-mono">Salin</span>
                                </>
                              )}
                            </button>
                          </div>
                          <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap select-all py-1 select-all break-all bg-slate-950/80 p-2 rounded border border-slate-900 leading-relaxed">
                            {order.accountDelivered}
                          </pre>

                          {order.rating ? (
                            <div className="bg-slate-950/85 border border-slate-900 p-2 rounded flex justify-between items-center text-[10px] gap-2">
                              <span className="text-slate-400 truncate max-w-[180px]">Ulasan: <span className="italic">"{order.reviewText || "Tanpa komentar"}"</span></span>
                              <div className="flex text-amber-400 shrink-0">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-2.5 h-2.5 ${
                                      star <= (order.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-700"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onTrackOrder(order.id);
                                onClose();
                              }}
                              className="w-full text-[9px] text-amber-400 hover:text-amber-300 font-mono flex items-center justify-between bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 p-1.5 rounded cursor-pointer transition text-left"
                            >
                              <span>Ulasan Belum Dibuat</span>
                              <span className="underline font-bold font-sans flex items-center gap-0.5">Beri Rating & Ulas <ArrowRight className="w-2.5 h-2.5" /></span>
                            </button>
                          )}
                        </div>
                      ) : order.status === "waiting_confirmation" ? (
                        <p className="text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-xl text-[11px] leading-relaxed italic">
                          Bukti bayar sedang divalidasi oleh admin. Akun dirilis otomatis sesaat lagi.
                        </p>
                      ) : order.status === "failed" ? (
                        <p className="text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl text-[11px] leading-relaxed italic">
                          Pesanan ini batal / ditolak. Alasan: {order.remarks || "-"}
                        </p>
                      ) : order.status === "refund" ? (
                        <p className="text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 p-2.5 rounded-xl text-[11px] leading-relaxed italic">
                          Pesanan ini telah dikembalikan (refund dari admin).
                        </p>
                      ) : (
                        <p className="text-slate-400 bg-slate-900 border border-slate-800/60 p-2.5 rounded-xl text-[11px] leading-relaxed italic">
                          Pemesanan dibuat. Silakan selesaikan pembayaran dan unggah struk di tab Lacak Pesanan.
                        </p>
                      )}

                      {/* Footer Row Actions: Link to track */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                        <span>Total Bayar: <span className="text-green-455 font-bold">Rp {order.paymentAmount.toLocaleString("id-ID")}</span></span>
                        
                        <div className="flex items-center gap-2">
                          <a
                            href={complainTelegramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-3 rounded-lg border border-red-500/30 hover:border-red-500 text-rose-400 hover:bg-red-500/10 hover:text-white transition flex items-center gap-1 cursor-pointer bg-slate-950 font-sans text-[11px] font-bold"
                          >
                            KOMPLAIN
                          </a>

                          <button
                            onClick={() => {
                              onTrackOrder(order.id);
                              onClose();
                            }}
                            className="p-1 px-2.5 rounded-lg border border-slate-905 hover:border-slate-800 text-indigo-400 hover:text-white transition flex items-center gap-1 cursor-pointer bg-slate-950"
                          >
                            Detail & Lacak Lanjut <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Top-Up Saldo Interface */}
          {activeSection === "topup" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* LEFT CONTEXT: FORM INPUT */}
                <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl h-fit space-y-4">
                  <h5 className="text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    Formulir Top-Up Saldo
                  </h5>
                  
                  <form onSubmit={handleTopupSubmit} className="space-y-4">
                    
                    {/* Amount Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block font-display">
                        Nominal Isi Saldo (Rp)
                      </label>
                      <input
                        type="number"
                        id="topup_amount_input"
                        value={topupAmount}
                        onChange={(e) => setTopupAmount(e.target.value)}
                        placeholder="Misal: 50000 (Min. Rp 5.000)"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs"
                      />
                    </div>

                    {/* Payment methods choice */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block font-display">
                        Transfer Rekening Tujuan
                      </label>
                      <select
                        id="topup_method_select"
                        value={selectedMethodId}
                        onChange={(e) => setSelectedMethodId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs"
                      >
                        <option value="">-- Pilih Saluran Pembayaran --</option>
                        {paymentMethods.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.accountNo} a.n {m.accountName})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* QR Code preview helper if QRIS is selected */}
                    {selectedMethodId && paymentMethods.find(m => m.id === selectedMethodId)?.qrCodeUrl && (
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col items-center">
                        <span className="text-[9px] text-slate-400 font-semibold mb-2 block uppercase text-center font-mono">
                          Pindai QR Resmi Toko
                        </span>
                        <img 
                          src={paymentMethods.find(m => m.id === selectedMethodId)?.qrCodeUrl} 
                          alt="QR Code" 
                          referrerPolicy="no-referrer"
                          className="w-32 h-32 object-contain rounded-lg border border-slate-950"
                        />
                      </div>
                    )}

                    {/* Screenshot Receipt Upload */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block font-display">
                        Unggah Bukti Struk Transfer
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-800 transition">
                          Pilih File Struk
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                          {proofFileName || "Belum ada file struk"}
                        </span>
                      </div>
                    </div>

                    {/* Alerts feedback */}
                    {topupErrorMsg && (
                      <p className="text-rose-400 text-xs italic">{topupErrorMsg}</p>
                    )}
                    {topupStatusMsg && (
                      <p className="text-green-400 text-xs italic font-semibold leading-normal">{topupStatusMsg}</p>
                    )}

                    <button
                      id="btn_submit_topup_request"
                      type="submit"
                      disabled={isSubmittingTopup}
                      className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-lg text-center text-xs cursor-pointer transition shadow"
                    >
                      {isSubmittingTopup ? "Mengirimkan..." : "Ajukan Pengisian Saldo"}
                    </button>

                  </form>
                </div>

                {/* RIGHT CONTEXT: TOPUP HISTORY LIST */}
                <div className="space-y-4">
                  <h5 className="text-white font-bold text-xs uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    Riwayat Pengisian Saldo
                  </h5>

                  {topups.length === 0 ? (
                    <div className="p-8 text-center bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs italic">
                      Belum ada permohonan isi saldo. Silakan isi form di samping untuk topup pertama kali.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                      {topups.map((t) => (
                        <div 
                          key={t.id} 
                          className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1.5 text-xs"
                        >
                          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <span>ID: {t.id}</span>
                            <span>{new Date(t.createdAt).toLocaleDateString("id-ID")}</span>
                          </div>
                          
                          <div className="flex justify-between items-center font-semibold text-white">
                            <span>Rp {t.amount.toLocaleString("id-ID")}</span>
                            <div>
                              {t.status === "completed" ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">DISETUJUI</span>
                              ) : t.status === "failed" ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">DITOLAK</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-[10px] text-slate-400">
                            <span>Tujuan Transfer: {t.paymentMethodName}</span>
                            {t.remarks && (
                              <p className="text-slate-500 text-[10px] mt-1 select-text">Catatan: {t.remarks}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* Section 4: PIN Keamanan Setup */}
          {activeSection === "pin" && (
            <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-4 max-w-lg mx-auto">
              <div className="text-center space-y-1">
                <h4 className="text-base font-bold text-white font-display">Pengaturan PIN Keamanan</h4>
                <p className="text-xs text-slate-400">
                  {hasSecurityPin 
                    ? "Ganti / Perbarui PIN 6-angka keamanan akun premium Anda." 
                    : "Akun Anda belum memiliki PIN pelindung. Silakan buat PIN baru (6 Angka)."}
                </p>
              </div>

              <form onSubmit={handleSavePin} className="space-y-4">
                {hasSecurityPin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PIN Saat Ini / Lama</label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="Masukkan 6 angka PIN lama"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-mono text-lg tracking-widest"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">PIN Baru (6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="6 angka PIN baru"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-indigo-500/30 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-mono text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Konfirmasi PIN Baru (6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ketik ulang 6 angka PIN baru"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-indigo-500/30 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-center font-mono text-lg tracking-widest"
                  />
                </div>

                {pinErrorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-rose-400 text-xs italic">
                    {pinErrorMsg}
                  </div>
                )}

                {pinSuccessMsg && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-semibold">
                    {pinSuccessMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-center text-xs cursor-pointer transition shadow hover:shadow-indigo-500/10"
                >
                  {isSavingPin ? "Menyimpan..." : hasSecurityPin ? "Perbarui PIN Keamanan" : "Aktifkan PIN Keamanan"}
                </button>
              </form>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-500 font-mono leading-relaxed text-center">
                PENTING: PIN keamanan ini digunakan saat melakukan transaksi premium guna memproteksi saldo Anda. Jangan bagikan PIN ini ke siapa pun.
              </div>
            </div>
          )}

        </div>

        {/* Modal footer action */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 mt-auto flex items-center justify-between">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Sesi Akun
          </button>
          
          <span className="text-[10px] text-slate-600 font-mono block">
            ID: {user.id}
          </span>
        </div>

      </div>
    </div>
  );
}

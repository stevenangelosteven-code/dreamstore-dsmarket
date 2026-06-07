import React, { useState, useEffect } from "react";
import { Search, Copy, Check, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, Sparkles, Phone, Mail, ShoppingBag, ArrowRight, User, Key, ShieldCheck } from "lucide-react";
import { Order, Notification } from "../types";

interface OrderTrackerProps {
  userToken?: string;
  userData?: { id: string; email: string; phone: string; name: string } | null;
}

export function OrderTracker({ userToken, userData }: OrderTrackerProps) {
  // Manual Tracking Search State
  const [searchId, setSearchId] = useState("");
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Logged In History States
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Email Notification Lookup State
  const [userEmail, setUserEmail] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadedNotifications, setLoadedNotifications] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // Check query params on load (for redirection after auto-created orders)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get("orderId");
    if (orderParam) {
      setSearchId(orderParam);
      fetchOrderDetails(orderParam);
    }
  }, []);

  // Fetch logged in user orders automatically on mount / token change
  useEffect(() => {
    if (userToken) {
      fetchLoggedInOrders();
    } else {
      setUserOrders([]);
    }
  }, [userToken]);

  const fetchLoggedInOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/user/orders", {
        headers: {
          "Authorization": `Bearer ${userToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data);
      }
    } catch (e) {
      console.error("Gagal mengambil riwayat pesanan user", e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderDetails = async (idToSearch?: string) => {
    const id = idToSearch || searchId;
    if (!id.trim()) {
      setError("Silakan masukkan ID Pesanan Anda.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${id.trim().toUpperCase()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Pesanan tidak ditemukan.");
      }
      const data = await res.json();
      setCurrentOrder(data);
    } catch (err: any) {
      setCurrentOrder(null);
      setError(err.message || "Gagal memuat pesanan. Cek kembali format ID.");
    } finally {
      setLoading(false);
    }
  };

  const pollOrder = async () => {
    if (!currentOrder) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/orders/${currentOrder.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentOrder(data);
      }
    } catch (e) {
      console.error("Poller failed", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchUserNotifs = async () => {
    if (!userEmail.trim()) return;
    setNotifLoading(true);
    setLoadedNotifications(true);
    try {
      const res = await fetch(`/api/user-notifications?email=${encodeURIComponent(userEmail.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNotifLoading(false);
    }
  };

  const copyCreds = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/35";
      case "failed":
        return "bg-rose-500/10 text-rose-400 border-rose-500/35";
      case "refund":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/35";
      case "waiting_confirmation":
        return "bg-amber-500/10 text-amber-400 border-amber-500/35";
      default:
        return "bg-slate-500/15 text-slate-400 border-slate-500/25";
    }
  };

  const getStatusLabel = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return "Selesai & Dikirim";
      case "failed":
        return "Ditolak / Batal";
      case "refund":
        return "Refund / Dikembalikan";
      case "waiting_confirmation":
        return "Menunggu Verifikasi";
      case "awaiting_payment":
        return "Belum Bayar";
      default:
        return "Pending";
    }
  };

  return (
    <div className="space-y-10">
      
      {/* ========================================================= */}
      {/* SECTION A: DIRECT HISTORY LIST (FOR LOGGED IN USERS) */}
      {/* ========================================================= */}
      {userToken && userData ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase block mb-1">
                MEMBERSHIP ACCOUNT PANEL
              </span>
              <h2 className="font-display text-xl md:text-2xl font-bold text-white flex items-center gap-2.5">
                <ShoppingBag className="w-5.5 h-5.5 text-indigo-400" />
                History & Pembelian Saya
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Daftar semua pembelian digital terhubung langsung dengan email <span className="text-white font-mono font-medium">{userData.email}</span>.
              </p>
            </div>

            <button
              id="btn_refresh_logged_history"
              onClick={fetchLoggedInOrders}
              disabled={ordersLoading}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-xs text-slate-300 font-semibold border border-slate-800 hover:border-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? "animate-spin text-indigo-400" : ""}`} />
              Segarkan Data
            </button>
          </div>

          {ordersLoading && userOrders.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-slate-500 text-xs font-mono">Memuat riwayat transaksi digital Anda secara aman...</p>
            </div>
          ) : userOrders.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white text-sm font-bold">Belum Ada Transaksi</h4>
                <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                  Pemesanan digital Anda akan muncul langsung di sini. Silakan jelajahi katalog premium kami dan cobalah memesan.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {userOrders.map((order) => (
                <div 
                  key={order.id} 
                  id={`history_order_card_${order.id}`}
                  className="bg-slate-950 border border-slate-850 p-4 rounded-2xl hover:border-slate-800 transition block space-y-4 text-xs select-text text-left"
                >
                  
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-900 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span className="font-bold text-slate-400">{order.id}</span>
                        <span>&bull;</span>
                        <span>{new Date(order.createdAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="font-display font-bold text-white text-sm mt-1">
                        {order.productName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className={`px-2.5 py-1 text-[10px] border font-bold rounded-lg ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>

                  {/* Body: Accounts Delivered credentials Box */}
                  {order.status === "completed" && order.accountDelivered ? (
                    <div className="bg-gradient-to-br from-green-950/40 to-emerald-950/10 border border-green-500/20 p-4 rounded-xl space-y-3.5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-bold text-green-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                          KREDENSIAL AKUN AKTIF & SIAP PAKAI
                        </span>
                        
                        <button
                          onClick={() => copyCreds(order.accountDelivered || "", order.id)}
                          className="bg-slate-950 hover:bg-slate-900 hover:text-white text-slate-400 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                          title="Salin Akun"
                        >
                          {copyStatus === order.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-400" />
                              <span className="text-green-400 font-mono text-[10px]">Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="font-mono text-[10px]">Salin</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap select-all py-2 break-all bg-slate-950/80 p-3 rounded-lg border border-slate-900 leading-relaxed font-semibold">
                        {order.accountDelivered}
                      </pre>
                    </div>
                  ) : order.status === "waiting_confirmation" ? (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/15 text-amber-400/90 rounded-xl leading-relaxed italic text-[11px]">
                      Struk bukti pembayaran Anda sedang dicek operasional admin toko. Akun digital dirilis instan sesaat lagi.
                    </div>
                  ) : order.status === "failed" ? (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/15 text-rose-450 rounded-xl leading-relaxed italic text-[11px]">
                      Pesanan ditolak/dibatalkan. Alasan administrator: <span className="font-semibold text-rose-300 font-display">{order.remarks || "-"}</span>
                    </div>
                  ) : order.status === "refund" ? (
                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/15 text-indigo-400 rounded-xl leading-relaxed italic text-[11px]">
                      Transaksi dikembalikan (Refund dana dari Admin).
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-900 border border-slate-850 text-slate-450 rounded-xl leading-relaxed italic text-[11px]">
                      Pesanan dibuat. Harap selesaikan transfer tagihan Anda ke admin toko.
                    </div>
                  )}

                  {/* Info Footer Row */}
                  <div className="flex flex-wrap justify-between items-center gap-y-2 text-[11px] font-mono text-slate-500 pt-1">
                    <span>Metode: <span className="text-slate-300 font-semibold">{order.paymentMethodName}</span></span>
                    <span>Total Pembayaran: <span className="text-green-400 font-bold text-xs">Rp {order.paymentAmount.toLocaleString("id-ID")}</span></span>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 max-w-3xl mx-auto">
          
          {/* Guest Card Call to login */}
          <div className="bg-gradient-to-r from-indigo-700/20 via-indigo-900/10 to-slate-950 border border-indigo-500/15 rounded-2xl p-6 text-center space-y-4">
            <div className="w-11 h-11 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-xl flex items-center justify-center mx-auto shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-extrabold text-white text-base">Masuk untuk Riwayat Instan</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Daripada memasukkan ID struk secara manual, pastikan Anda masuk / mendaftar agar kredensial akun terkirim & tersimpan otomatis selamanya.
              </p>
            </div>
          </div>

          {/* Fallback Manual Search by ID */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2 mb-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-white">
                Cari Manual ID Pesanan
              </h2>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Masukkan ID struk manual (Contoh: <span className="font-mono text-white">ORD-554129</span>) untuk mencari data produk Anda.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono">ID</span>
                <input
                  type="text"
                  id="search_id_input"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                  placeholder="ORD-XXXXXX"
                  className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 text-white font-mono rounded-xl focus:outline-none focus:ring-1 focus:ring-white transition text-xs"
                  onKeyDown={(e) => e.key === "Enter" && fetchOrderDetails()}
                />
              </div>
              <button
                id="btn_track_order"
                onClick={() => fetchOrderDetails()}
                disabled={loading}
                className="px-5 py-3 bg-white text-slate-950 hover:bg-slate-200 transition font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Cari Pesanan
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Display Manual Found Card */}
            {currentOrder && (
              <div className="border-t border-slate-800 pt-6 space-y-5 text-left text-xs">
                
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      <span>ORD ID #</span>
                      <span className="font-bold text-slate-300">{currentOrder.id}</span>
                    </div>
                    <h3 className="font-display font-bold text-white text-sm mt-0.5">
                      {currentOrder.productName}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[9px] font-bold border rounded ${getStatusColor(currentOrder.status)}`}>
                      {getStatusLabel(currentOrder.status)}
                    </span>
                    <button
                      onClick={pollOrder}
                      className="p-1.5 bg-slate-950 border border-slate-800 rounded hover:bg-slate-900 transition text-slate-400 hover:text-white"
                      title="Poller Status"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                {currentOrder.status === "completed" && currentOrder.accountDelivered ? (
                  <div className="p-4 bg-gradient-to-br from-green-950/40 to-emerald-950/10 border border-green-500/20 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-green-400 font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      AKUN SIAP DIGUNAKAN
                    </span>
                    
                    <div className="flex gap-2 justify-between items-start">
                      <pre className="text-green-300 font-mono select-all select-all break-all whitespace-pre-wrap leading-relaxed py-1 bg-slate-950/80 p-2.5 rounded border border-slate-900 flex-1">
                        {currentOrder.accountDelivered}
                      </pre>
                      <button
                        onClick={() => copyCreds(currentOrder.accountDelivered || "", currentOrder.id)}
                        className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded transition shrink-0"
                      >
                        {copyStatus === currentOrder.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-slate-400 text-left italic">
                    Status: {getStatusLabel(currentOrder.status)}. Akun premium akan terisi di kotak ini jika status pesanan selesai/diverifikasi admin.
                  </div>
                )}

                <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 font-mono text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Nominal Bayar</span>
                    <span className="text-white">Rp {currentOrder.paymentAmount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode</span>
                    <span className="text-white">{currentOrder.paymentMethodName}</span>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION B: GUEST EMAIL NOTIFICATIONS INBOX                */}
      {/* ========================================================= */}
      <div className="bg-slate-950 border border-slate-905 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto space-y-6 text-left">
        <div className="space-y-1">
          <h3 className="font-display font-medium text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            Kotak Masuk Notifikasi Sistem
          </h3>
          <p className="text-slate-400 text-xs">
            Masukkan atau ketik kembali email pendaftaran Anda untuk memuat log notifikasi manual.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="email"
            id="user_email_notif"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="nama@email.com"
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition text-xs"
            onKeyDown={(e) => e.key === "Enter" && fetchUserNotifs()}
          />
          <button
            id="btn_check_notif"
            onClick={fetchUserNotifs}
            disabled={notifLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-800 transition font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {notifLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            Cari Notifikasi
          </button>
        </div>

        {loadedNotifications && (
          <div className="space-y-2 pt-2">
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-5 bg-slate-900/10 border border-dashed border-slate-850 rounded-xl">
                Tidak ada riwayat notifikasi untuk alamat email ini.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1">
                    <div className="flex justify-between items-center font-semibold text-slate-200">
                      <span>{notif.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(notif.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-normal">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

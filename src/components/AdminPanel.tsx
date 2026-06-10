import React, { useState, useEffect } from "react";
import { 
  Lock, LayoutDashboard, Package, Key, CreditCard, ShieldAlert, ListFilter,
  LogOut, Plus, Edit, Trash2, Check, X, Eye, FileSpreadsheet, RefreshCw, AlertCircle, FileText, Download, CheckCircle, HelpCircle, Sparkles,
  Users, MessageSquare, Send, Star
} from "lucide-react";
import { Product, PaymentMethod, Order, ActivityLog, BlacklistItem, Notification, DashboardStats, ProductAccount, Review } from "../types";

interface AdminPanelProps {
  adminToken: string;
  adminUsername: string;
  onLogout: () => void;
  onBannerUpdated?: () => void;
}

export function AdminPanel({ adminToken, adminUsername, onLogout, onBannerUpdated }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "bulk_accounts" | "orders" | "payments" | "blacklist" | "logs" | "banner" | "topups" | "users" | "support" | "reviews">("dashboard");
  const [topups, setTopups] = useState<any[]>([]);
  const [loadingTopups, setLoadingTopups] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerConfirm = (title: string, message: string, action: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmDialog(null);
      }
    });
  };

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Announcement Banner Field States
  const [bannerText, setBannerText] = useState("");
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [bannerBgColor, setBannerBgColor] = useState("bg-slate-900 border-b border-indigo-500/30");
  const [bannerTextColor, setBannerTextColor] = useState("text-white");
  const [bannerLinkUrl, setBannerLinkUrl] = useState("");
  const [bannerLoading, setBannerLoading] = useState(false);

  // Store footer, contact channels, and customized carousel slides
  const [footerDescription, setFooterDescription] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [copyrightText, setCopyrightText] = useState("");
  const [complainTelegramUrl, setComplainTelegramUrl] = useState("");
  const [slides, setSlides] = useState<any[]>([
    { image: "", badge: "", badgeColor: "", title: "", desc: "", category: "", buttonText: "" },
    { image: "", badge: "", badgeColor: "", title: "", desc: "", category: "", buttonText: "" },
    { image: "", badge: "", badgeColor: "", title: "", desc: "", category: "", buttonText: "" }
  ]);
  const [configLoading, setConfigLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Entities states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Mutators loadings
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals & form fields state
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [productModalMode, setProductModalMode] = useState<"add" | "edit" | null>(null);
  const [bulkAccountProductId, setBulkAccountProductId] = useState("");
  const [bulkAccountsText, setBulkAccountsText] = useState("");

  // Payment methods fields state
  const [currentPayment, setCurrentPayment] = useState<Partial<PaymentMethod> | null>(null);
  const [paymentModalMode, setPaymentModalMode] = useState<"add" | "edit" | null>(null);

  // Blacklist state
  const [blacklistEmail, setBlacklistEmail] = useState("");
  const [blacklistReason, setBlacklistReason] = useState("");

  // Expandable Order Proof View
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [declineRemarksOrderId, setDeclineRemarksOrderId] = useState<string | null>(null);
  const [declineReasonText, setDeclineReasonText] = useState("");

  // Product Stock Accounts Reader
  // Product Stock Accounts Reader
  const [readingStockProductId, setReadingStockProductId] = useState<string | null>(null);
  const [viewingStockAccounts, setViewingStockAccounts] = useState<ProductAccount[]>([]);
  const [loadingStockAccts, setLoadingStockAccts] = useState(false);

  // === NEW USER BALANCE & CS STATES ===
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState("");
  const [balanceAdjustAction, setBalanceAdjustAction] = useState<"add" | "reduce">("add");
  const [balanceAdjustReason, setBalanceAdjustReason] = useState("");

  const [csSessions, setCsSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionMessages, setSelectedSessionMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [csReplyText, setCsReplyText] = useState("");

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", { headers });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserEmail || !balanceAdjustAmount || !balanceAdjustAction) {
      setErrorMsg("Email & nominal penyesuaian saldo wajib diisi.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/users/adjust-balance", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: selectedUserEmail,
          amount: parseFloat(balanceAdjustAmount),
          actionType: balanceAdjustAction,
          reason: balanceAdjustReason
        })
      });
      if (res.ok) {
        const result = await res.json();
        setSuccessMsg(`Saldo pengguna ${selectedUserEmail} berhasil disesuaikan! Saldo kini Rp ${result.balance.toLocaleString("id-ID")}`);
        setBalanceAdjustAmount("");
        setBalanceAdjustReason("");
        fetchUsers();
        fetchStats();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal menyesuaikan saldo pengguna.");
      }
    } catch (e) {
      setErrorMsg("Terjadi kesalahan koneksi.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchCsSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/cs/sessions", { headers });
      if (res.ok) {
        const data = await res.json();
        setCsSessions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchSessionMessages = async (sessId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/cs/messages/${sessId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedSessionMessages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendCsReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !csReplyText.trim()) return;

    setActionLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin/cs/reply", {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId: selectedSessionId,
          text: csReplyText.trim()
        })
      });
      if (res.ok) {
        setCsReplyText("");
        fetchSessionMessages(selectedSessionId);
        fetchCsSessions();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal membalas pesan CS.");
      }
    } catch (e) {
      setErrorMsg("Koneksi gagal.");
    } finally {
      setActionLoading(false);
    }
  };

  // Poll active chat thread while in CS support tab
  useEffect(() => {
    if (activeTab === "support" && selectedSessionId) {
      const interval = setInterval(() => {
        fetchSessionMessages(selectedSessionId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedSessionId]);

  useEffect(() => {
    fetchStats();
    fetchNotifications();
    fetchDataForTab();
  }, [activeTab]);

  const fetchDataForTab = () => {
    setErrorMsg("");
    setSuccessMsg("");
    if (activeTab === "products") fetchProducts();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "payments") fetchPayments();
    if (activeTab === "blacklist") fetchBlacklist();
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "banner") {
      fetchBannerConfig();
      fetchStoreConfig();
    }
    if (activeTab === "topups") fetchTopups();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "support") fetchCsSessions();
    if (activeTab === "reviews") fetchOrders();
  };

  const fetchTopups = async () => {
    setLoadingTopups(true);
    try {
      const res = await fetch("/api/admin/topups", { headers });
      if (res.ok) {
        const data = await res.json();
        setTopups(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTopups(false);
    }
  };

  const handleProcessTopup = async (id: string, status: "completed" | "failed") => {
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/admin/topups/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccessMsg(`Tindakan top up saldo berhasil diproses: ${status === "completed" ? "disetujui" : "ditolak"}.`);
        fetchTopups();
        fetchStats();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal memproses pengajuan top up.");
      }
    } catch (e) {
      setErrorMsg("Koneksi gagal.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchBannerConfig = async () => {
    setBannerLoading(true);
    try {
      const res = await fetch("/api/banner");
      if (res.ok) {
        const data = await res.json();
        setBannerText(data.text || "");
        setBannerIsActive(data.isActive ?? false);
        setBannerBgColor(data.bgColor || "bg-slate-900 border-b border-indigo-500/30");
        setBannerTextColor(data.textColor || "text-white");
        setBannerLinkUrl(data.linkUrl || "");
      }
    } catch (e) {
      console.warn("Error fetching banner inside admin panel", e);
    } finally {
      setBannerLoading(false);
    }
  };

  const saveBannerConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/banner", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          text: bannerText,
          isActive: bannerIsActive,
          bgColor: bannerBgColor,
          textColor: bannerTextColor,
          linkUrl: bannerLinkUrl
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui banner.");
      }

      setSuccessMsg("Banner pengumuman barulah berhasil diperbarui dan disiarkan.");
      if (onBannerUpdated) onBannerUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan konfigurasi banner.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStoreConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch("/api/store-config");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFooterDescription(data.footerDescription || "");
          setAboutUs(data.aboutUs || "");
          setSupportEmail(data.supportEmail || "");
          setSupportPhone(data.supportPhone || "");
          setCopyrightText(data.copyrightText || "");
          setComplainTelegramUrl(data.complainTelegramUrl || "https://t.me/dreamstore_support");
          if (Array.isArray(data.carouselSlides)) {
            setSlides(data.carouselSlides);
          }
        }
      }
    } catch (e) {
      console.warn("Error fetching store config for admin panel", e);
    } finally {
      setConfigLoading(false);
    }
  };

  const saveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/store-config", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          footerDescription,
          aboutUs,
          supportEmail,
          supportPhone,
          copyrightText,
          complainTelegramUrl,
          carouselSlides: slides
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui pengaturan toko.");
      }

      setSuccessMsg("Pengaturan tampilan toko (footer, info kontak & 3 banner slide) berhasil disimpan!");
      window.dispatchEvent(new Event("sync_store_config"));
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan konfigurasi tampilan toko.");
    } finally {
      setActionLoading(false);
    }
  };

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${adminToken}`
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats", { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch("/api/admin/notifications", { headers });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const readAllNotifications = async () => {
    try {
      await fetch("/api/admin/notifications/read-all", { method: "POST", headers });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0 && !bulkAccountProductId) {
          setBulkAccountProductId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders", { headers });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payment-methods", { headers });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBlacklist = async () => {
    try {
      const res = await fetch("/api/admin/blacklist", { headers });
      if (res.ok) {
        const data = await res.json();
        setBlacklist(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs", { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mutator actions: PRODUCTS
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.name || currentProduct.price === undefined || !currentProduct.category) return;
    setActionLoading(true);
    setErrorMsg("");

    const targetUrl = productModalMode === "add" ? "/api/products" : `/api/products/${currentProduct.id}`;
    const method = productModalMode === "add" ? "POST" : "PUT";

    try {
      const res = await fetch(targetUrl, {
        method,
        headers,
        body: JSON.stringify(currentProduct)
      });
      if (res.ok) {
        setSuccessMsg(`Produk berhasil ${productModalMode === "add" ? "ditambahkan" : "diperbarui"}.`);
        setProductModalMode(null);
        fetchProducts();
        fetchStats();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal menyimpan produk.");
      }
    } catch (e) {
      setErrorMsg("Koneksi gagal.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    triggerConfirm(
      "Hapus Produk",
      "Apakah Anda yakin ingin menghapus produk ini? Semua persediaan stok akun belum terjual yang terkait juga akan terhapus.",
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`/api/products/${id}`, { method: "DELETE", headers });
          if (res.ok) {
            setSuccessMsg("Produk berhasil dihapus secara permanen.");
            fetchProducts();
            fetchStats();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Mutator actions: STOCKS BULK ACCOUNTS INGEST
  const handleBulkAccountsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkAccountProductId || !bulkAccountsText.trim()) {
      setErrorMsg("Harap pilih produk dan isi data akun digital terlebih dahulu.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/products/${bulkAccountProductId}/accounts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rawText: bulkAccountsText })
      });
      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(`Berhasil mengunggah ${data.count} stok akun untuk produk pilihan.`);
        setBulkAccountsText("");
        fetchStats();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal mengunggah akun.");
      }
    } catch (e) {
      setErrorMsg("Masalah unggah database.");
    } finally {
      setActionLoading(false);
    }
  };

  // View Stock details inside table
  const fetchProductStockAccounts = async (productId: string) => {
    setReadingStockProductId(productId);
    setLoadingStockAccts(true);
    try {
      const res = await fetch(`/api/products/${productId}/accounts`, { headers });
      if (res.ok) {
        const data = await res.json();
        setViewingStockAccounts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStockAccts(false);
    }
  };

  const handleDeleteStockItem = async (acctId: string) => {
    triggerConfirm(
      "Hapus Kredensial Stok",
      "Apakah Anda yakin ingin menghapus item kredensial stok ini?",
      async () => {
        try {
          const res = await fetch(`/api/accounts/${acctId}`, { method: "DELETE", headers });
          if (res.ok && readingStockProductId) {
            fetchProductStockAccounts(readingStockProductId);
            fetchStats();
          }
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  // Mutator actions: PAYMENT
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPayment?.type || !currentPayment.name || !currentPayment.accountName || !currentPayment.accountNo) return;
    setActionLoading(true);
    setErrorMsg("");

    const targetUrl = paymentModalMode === "add" ? "/api/admin/payment-methods" : `/api/admin/payment-methods/${currentPayment.id}`;
    const method = paymentModalMode === "add" ? "POST" : "PUT";

    try {
      const res = await fetch(targetUrl, {
        method,
        headers,
        body: JSON.stringify(currentPayment)
      });
      if (res.ok) {
        setSuccessMsg(`Metode bayar berhasil ${paymentModalMode === "add" ? "ditambahkan" : "diperbarui"}.`);
        setPaymentModalMode(null);
        fetchPayments();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal menyimpan metode.");
      }
    } catch (e) {
      setErrorMsg("Koneksi gagal.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    triggerConfirm(
      "Hapus Jalur Pembayaran",
      "Apakah Anda yakin ingin menghapus saluran pembayaran ini?",
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE", headers });
          if (res.ok) {
            setSuccessMsg("Saluran pembayaran dihapus.");
            fetchPayments();
          } else {
            const err = await res.json();
            setErrorMsg(err.error || "Gagal menghapus saluran pembayaran.");
          }
        } catch (e) {
          console.error(e);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Mutator actions: BLACKLIST
  const handleAddBlacklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistEmail.trim() || !blacklistReason.trim()) {
      setErrorMsg("Email pembeli dan alasan wajib ditentukan.");
      return;
    }
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/blacklist", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: blacklistEmail.trim(), reason: blacklistReason.trim() })
      });
      if (res.ok) {
        setSuccessMsg(`Berhasil mem-blacklist ${blacklistEmail}.`);
        setBlacklistEmail("");
        setBlacklistReason("");
        fetchBlacklist();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Gagal menambahkan ke daftar hitam.");
      }
    } catch (e) {
      setErrorMsg("Gagal mendaftarkan blacklist.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBlacklist = async (id: string) => {
    triggerConfirm(
      "Cabut Status Blacklist",
      "Cabut pembeli dari daftar blacklist?",
      async () => {
        try {
          const res = await fetch(`/api/admin/blacklist/${id}`, { method: "DELETE", headers });
          if (res.ok) {
            setSuccessMsg("Status blacklist berhasil dicabut.");
            fetchBlacklist();
          }
        } catch (e) {
          console.error(e);
        }
      }
    );
  };

  // Mutator actions: ORDERS OPERATION
  const handleApproveOrder = async (orderId: string) => {
    triggerConfirm(
      "Setujui Pesanan",
      `Apakah Anda yakin ingin menyetujui pembayaran & distribusikan digital credential otomatis untuk pesanan ${orderId}?`,
      async () => {
        setActionLoading(true);
        setErrorMsg("");
        setSuccessMsg("");
        try {
          const res = await fetch(`/api/admin/orders/${orderId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: "completed", remarks: "Pembayaran lunas terverifikasi oleh Admin." })
          });
          if (res.ok) {
            setSuccessMsg(`Pesanan ${orderId} sukses disetujui. Akun instan terkirim otomatis !`);
            fetchOrders();
            fetchStats();
          } else {
            const err = await res.json();
            setErrorMsg(err.error || "Gagal menyetujui pesanan. Periksa sisa persediaan akun!");
          }
        } catch (e) {
          setErrorMsg("Koneksi gagal.");
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // Reject with dynamic modal inputs
  const startDeclineProcess = (orderId: string) => {
    setDeclineRemarksOrderId(orderId);
    setDeclineReasonText("");
  };

  const handleDeclineSubmit = async () => {
    if (!declineRemarksOrderId) return;
    setActionLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/admin/orders/${declineRemarksOrderId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: "failed", remarks: declineReasonText.trim() || "Bukti transfer tidak sesuai nominal." })
      });
      if (res.ok) {
        setSuccessMsg(`Pesanan ${declineRemarksOrderId} berhasil ditolak dengan alasan.`);
        setDeclineRemarksOrderId(null);
        fetchOrders();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerRefund = async (orderId: string) => {
    triggerConfirm(
      "Batalkan & Refund Pesanan",
      `Apakah Anda yakin ingin menandai pesanan ${orderId} sebagai REFUND? Akun terkait di database stok akan dikembalikan jadi tersedia.`,
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`/api/admin/orders/${orderId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ status: "refund", remarks: "Prosedur refund selesai diproses admin." })
          });
          if (res.ok) {
            setSuccessMsg(`Pesanan ${orderId} status berhasil diset sebagai Refund.`);
            fetchOrders();
            fetchStats();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setActionLoading(false);
        }
      }
    );
  };

  // BACKUP EXPORT DYNAMIC DATABASE.SQL TRIGGER
  const handleExportSQLBackup = () => {
    window.location.href = `/api/admin/backup-sql?authorization=Bearer_${adminToken}`;
    // Since browser navigates to attachment payload, this triggers smooth sql download!
    setSuccessMsg("SQL Database dump berhasil dirumuskan & diunduh.");
  };

  const handleCustomSqlDownloadMock = () => {
    // Open backup endpoint with token query
    window.open(`/api/admin/backup-sql?authorization=Bearer ${adminToken}`, "_blank");
    setSuccessMsg("SQL Database Backup berhasil diproduksi & disimpan.");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 lg:p-6 space-y-6 flex-shrink-0">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-white text-slate-950 font-bold flex items-center justify-center font-display shadow">
            DS
          </div>
          <div>
            <h3 className="font-display font-bold text-white text-sm">Dashboard Admin</h3>
            <span className="text-emerald-400 font-mono text-[10px] uppercase font-bold tracking-wider">
              ● Online: {adminUsername}
            </span>
          </div>
        </div>

        <nav role="navigation" className="space-y-1">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "dashboard" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => { setActiveTab("products"); fetchProducts(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "products" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" />
            Kelola Produk ({products.length || ""})
          </button>

          <button
            onClick={() => { setActiveTab("bulk_accounts"); fetchProducts(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "bulk_accounts" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Key className="w-4 h-4" />
            Tambah Akun Massal
          </button>

          <button
            onClick={() => { setActiveTab("orders"); fetchOrders(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "orders" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            Daftar Pesanan ({orders.length || ""})
          </button>

          <button
            onClick={() => { setActiveTab("payments"); fetchPayments(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "payments" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Metode Pembayaran ({payments.length || ""})
          </button>

          <button
            onClick={() => { setActiveTab("blacklist"); fetchBlacklist(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "blacklist" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Blacklist Pembeli ({blacklist.length || ""})
          </button>

          <button
            onClick={() => { setActiveTab("logs"); fetchLogs(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "logs" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Log Aktivitas ({logs.length || ""})
          </button>

          <button
            onClick={() => { setActiveTab("banner"); fetchBannerConfig(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "banner" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            Self-Serve Edits (Toko/Banner)
          </button>

          <button
            onClick={() => { setActiveTab("topups"); fetchTopups(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "topups" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4 text-green-400" />
            Konfirmasi Top-up Saldo ({topups.filter(t => t.status === "pending").length || "0"})
          </button>

          <button
            onClick={() => { setActiveTab("users"); fetchUsers(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "users" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4 text-amber-500" />
            Kelola Saldo Pengguna ({users.length || "0"})
          </button>

          <button
            onClick={() => { setActiveTab("support"); fetchCsSessions(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "support" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-400 animate-pulse" />
            Pertanyaan CS & Support ({csSessions.filter(s => s.unreadCount > 0).length || "0"})
          </button>

          <button
            onClick={() => { setActiveTab("reviews"); fetchOrders(); }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "reviews" ? "bg-white text-slate-950 font-bold" : "text-slate-400 hover:text-white"
            }`}
          >
            <Star className="w-4 h-4 text-amber-400 fill-amber-450" />
            Ulasan & Feedback Produk ({orders.filter(o => o.rating && o.rating > 0).length || "0"})
          </button>
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onLogout}
            id="btn_admin_logout"
            className="w-full text-left px-4 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs md:text-sm font-semibold transition flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Keluar Admin
          </button>
        </div>
      </aside>

      {/* 2. DYNAMIC ADMIN CONTENT CONTAINER */}
      <main className="flex-1 space-y-6">
        
        {/* Banner Alert Toast Area */}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs md:text-sm flex justify-between items-center">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-slate-500 hover:text-white ml-2">✕</button>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs md:text-sm flex justify-between items-center">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-slate-500 hover:text-white ml-2">✕</button>
          </div>
        )}

        {/* ==========================================
            TAB 1: ANALYTICS DASHBOARD
            ========================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">Ringkasan Operasional</h2>
                <p className="text-slate-400 text-xs">Statistik total inventori, pesanan komersial, dan log transaksi aktif toko digital.</p>
              </div>

              {/* BACKUP DATABASE ACTIONS DIRECT SPLICE */}
              <button
                id="btn_backup_database"
                onClick={handleCustomSqlDownloadMock}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold rounded-xl text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow hover:opacity-90"
                title="Menghasilkan dan mengunduh MySQL .sql backup dump file"
              >
                <Download className="w-4 h-4" />
                Backup Base SQL
              </button>
            </div>

            {loadingStats ? (
              <p className="text-slate-500 text-xs font-mono">Me-render grafik statistik...</p>
            ) : stats ? (
              <div className="space-y-6">
                
                {/* Visual Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Produk</span>
                    <p className="text-2xl font-bold font-mono text-white mt-1">{stats.totalProducts}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Pesanan</span>
                    <p className="text-2xl font-bold font-mono text-white mt-1">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <span className="text-[10px] text-green-500/80 uppercase font-bold tracking-wider">Pemasukan Lunas</span>
                    <p className="text-xl md:text-2xl font-bold font-mono text-green-400 mt-1">
                      Rp {stats.totalRevenue.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Stok Akun Aktif</span>
                    <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{stats.totalAccountsAvailable}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Akun Terjual</span>
                    <p className="text-2xl font-bold font-mono text-slate-400 mt-1">{stats.totalAccountsSold}</p>
                  </div>
                </div>

                {/* Dashboard layout lower partition: recent logs & admin actions notifier */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent system notification lists */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="font-display font-bold text-xs md:text-sm text-white">Notifikasi Panel Admin ({notifications.filter(n => !n.isRead).length})</h3>
                      <button 
                        onClick={readAllNotifications}
                        className="text-[10px] text-slate-500 hover:text-white"
                      >
                        Tandai Dibaca Semua
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-slate-600 text-xs text-center py-6 italic">Tidak ada notifikasi aktif.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-3 rounded-lg text-xs border ${
                              notif.isRead 
                                ? "bg-slate-950/40 border-slate-900 text-slate-500" 
                                : "bg-slate-950 border-slate-800 text-slate-300 font-medium"
                            }`}
                          >
                            <div className="flex justify-between font-semibold">
                              <span>{notif.title}</span>
                              <span className="text-[9px] text-slate-500 font-mono font-normal">
                                {new Date(notif.createdAt).toLocaleTimeString("id-ID")}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] text-slate-400 font-sans leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent activities tracker */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="font-display font-bold text-xs md:text-sm text-white border-b border-slate-800 pb-2">
                      Aktivitas Sistem Terakhir
                    </h3>
                    <div className="space-y-3 font-mono text-[11px] text-slate-400">
                      {stats.recentLogs.map((lg) => (
                        <div key={lg.id} className="pb-2 border-b border-slate-950 flex flex-col space-y-0.5">
                          <div className="flex justify-between tracking-wide">
                            <span className="text-white font-semibold">[{lg.action}]</span>
                            <span className="text-[10px] text-slate-600">
                              {new Date(lg.timestamp).toLocaleTimeString("id-ID")}
                            </span>
                          </div>
                          <span className="text-slate-400 whitespace-pre-wrap">{lg.details}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        )}

        {/* ==========================================
            TAB 2: PRODUCTS MANAGER
            ========================================== */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">Kelola Katalog Produk</h2>
                <p className="text-slate-400 text-xs">Tambahkan tipe subscription atau edit harga produk serta detail gambar produk.</p>
              </div>
              <button
                id="btn_trigger_add_product"
                onClick={() => {
                  setCurrentProduct({ name: "", description: "", price: 10000, category: "Music", status: "active", imageUrl: "" });
                  setProductModalMode("add");
                }}
                className="px-4 py-2 bg-white text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Produk
              </button>
            </div>

            {/* List products table structure */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold font-mono">
                    <tr>
                      <th className="p-4">Foto</th>
                      <th className="p-4">Nama Produk / Detil</th>
                      <th className="p-4 font-mono">Harga</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Stok Akun</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-white font-medium">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-10 object-cover rounded-lg bg-slate-950 border border-slate-800"
                          />
                        </td>
                        <td className="p-4 space-y-0.5">
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <p className="text-slate-400 text-xs line-clamp-1 max-w-sm">{p.description}</p>
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          Rp {p.price.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 font-mono text-slate-400">{p.category}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-blue-400">{p.stock}</span>
                            <button
                              id={`view_stock_${p.id}`}
                              onClick={() => fetchProductStockAccounts(p.id)}
                              className="px-2 py-1 bg-slate-950 hover:bg-slate-900 text-[10px] text-slate-300 border border-slate-800 rounded transition cursor-pointer"
                            >
                              Lihat
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${p.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/25"}`}>
                            {p.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              id={`edit_product_${p.id}`}
                              onClick={() => {
                                setCurrentProduct(p);
                                setProductModalMode("edit");
                              }}
                              className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition"
                              title="Edit Detail"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`delete_product_${p.id}`}
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRODUCT STOCK EXPANDER PANEL */}
            {readingStockProductId && (
              <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider">Persediaan Kredensial Stok</span>
                    <h3 className="font-display font-bold text-white text-sm">
                      Daftar Akun dari Produk ID: {readingStockProductId}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setReadingStockProductId(null)}
                    className="text-xs text-slate-500 hover:text-white"
                  >
                    Tutup Stock List
                  </button>
                </div>

                {loadingStockAccts ? (
                  <p className="text-slate-500 text-xs loading">Mengambil log stock...</p>
                ) : viewingStockAccounts.length === 0 ? (
                  <p className="text-slate-600 text-xs italic text-center py-6">Stok akun kosong! Silakan isi menggunakan fitur &apos;Tambah Akun Massal&apos;.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {viewingStockAccounts.map((acct) => (
                      <div key={acct.id} className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <code className="text-white text-[11px] font-mono whitespace-pre font-bold select-all break-all block">{acct.accountData}</code>
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-sm ${acct.status === "available" ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-500"}`}>
                            {acct.status === "available" ? "TERSEDIA" : `TERJUAL (Order: ${acct.soldToOrderId})`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteStockItem(acct.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Hapus Kredensial"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 3: BULK DIGITAL ACCOUNTS LOADER
            ========================================== */}
        {activeTab === "bulk_accounts" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-white">Masukkan Akun Digital Massal</h2>
              <p className="text-slate-400 text-xs mt-1">
                Unggah puluhan kredensial premium sekaligus. Sistem akan mendistribusikannya satu-satu secara berurutan saat pesanan disetujui.
              </p>
            </div>

            <form onSubmit={handleBulkAccountsSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs uppercase text-slate-400 font-bold font-display block">Pilih Produk Sasaran</label>
                <select
                  id="bulk_select_product"
                  value={bulkAccountProductId}
                  onChange={(e) => setBulkAccountProductId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-sm font-semibold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="text-slate-900">{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase text-slate-400 font-bold font-display block">
                  Daftar Kredensial Akun (Tulis Satu Per Baris)
                </label>
                <textarea
                  id="bulk_text_area_loader"
                  rows={8}
                  value={bulkAccountsText}
                  onChange={(e) => setBulkAccountsText(e.target.value)}
                  placeholder="akunspotify1@gmail.com | sandi: passes123&#10;akunspotify2@gmail.com | sandi: passes456&#10;akunspotify3@gmail.com | sandi: passes789"
                  className="w-full p-4 bg-slate-950 border border-slate-800 text-white font-mono text-xs md:text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-white transition"
                />
              </div>

              <button
                id="btn_submit_bulk_stock"
                type="submit"
                disabled={actionLoading || !bulkAccountsText.trim()}
                className="w-full py-3 bg-white text-slate-950 hover:bg-slate-200 transition font-bold rounded-xl text-center text-sm cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Menyimpan Data..." : "Infiltrasi Massal Akun Digital"}
              </button>
            </form>
          </div>
        )}

        {/* ==========================================
            TAB 4: COMMERCIAL ORDERS LIST
            ========================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-white">Daftar Pesanan Toko</h2>
              <p className="text-slate-400 text-xs">Pilih pesanan pembeli untuk memverifikasi bukti struk, menyetujui, menolak, atau memproses refund.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-mono font-bold">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Pembeli / HP</th>
                      <th className="p-4">Produk Detail</th>
                      <th className="p-4 font-mono">Diyakini Bayar</th>
                      <th className="p-4 text-center">Bukti Transfer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Tindakan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-white font-medium">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-600 italic">Belum ada pesanan masuk.</td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-mono text-white text-[11px] font-bold">{o.id}</td>
                          <td className="p-4 space-y-0.5 max-w-[150px]">
                            <div className="truncate font-semibold text-slate-200" title={o.userEmail}>{o.userEmail}</div>
                            <div className="text-slate-500 font-mono text-[10px]">{o.userPhone}</div>
                          </td>
                          <td className="p-4 text-slate-300 text-xs font-semibold">
                            <div>{o.productName}</div>
                            {o.rating && (
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-400 font-mono">
                                <span className="font-bold">⭐ {o.rating}/5</span>
                                {o.reviewText && (
                                  <span className="text-slate-400 italic max-w-[125px] truncate block" title={o.reviewText}>
                                    ({o.reviewText})
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-mono text-green-400">
                            Rp {o.paymentAmount.toLocaleString("id-ID")}
                            <div className="text-[9px] text-slate-500 font-normal">{o.paymentMethodName}</div>
                          </td>
                          <td className="p-4 text-center">
                            {o.paymentProofUrl ? (
                              <button
                                onClick={() => setViewProofUrl(o.paymentProofUrl || null)}
                                className="px-2 py-1 bg-slate-950 border border-slate-800 text-blue-400 hover:text-blue-300 font-mono font-bold text-[10px] rounded transition cursor-pointer"
                              >
                                LIHAT STRUK
                              </button>
                            ) : (
                              <span className="text-slate-600 font-mono text-[10px]">BELUM UP</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold uppercase ${
                              o.status === "completed" ? "bg-green-500/10 text-green-400" :
                              o.status === "failed" ? "bg-rose-500/10 text-rose-400" :
                              o.status === "refund" ? "bg-indigo-500/10 text-indigo-400" :
                              o.status === "waiting_confirmation" ? "bg-amber-500/10 text-amber-400 animate-pulse" :
                              "bg-slate-700/20 text-slate-400"
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              {o.status === "waiting_confirmation" && (
                                <>
                                  <button
                                    onClick={() => handleApproveOrder(o.id)}
                                    id={`btn_approve_${o.id}`}
                                    className="p-1 px-2.5 bg-green-500 hover:bg-green-650 text-slate-950 font-bold rounded-lg transition"
                                    title="Setujui Pembayaran"
                                  >
                                    Setuju
                                  </button>
                                  <button
                                    onClick={() => startDeclineProcess(o.id)}
                                    id={`btn_decline_${o.id}`}
                                    className="p-1 px-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold rounded-lg transition"
                                    title="Tolak Pembayaran"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {o.status === "completed" && (
                                <button
                                  onClick={() => handleTriggerRefund(o.id)}
                                  className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[10px] rounded transition"
                                >
                                  Refund
                                </button>
                              )}

                              {o.status !== "waiting_confirmation" && o.status !== "completed" && (
                                <span className="text-[10px] text-slate-500 italic">Terkunci</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: PAYMENT METHODS CHANNELS
            ========================================== */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h2 className="font-display font-bold text-2xl text-white">Metode Pembayaran Toko</h2>
                <p className="text-slate-400 text-xs">Atur kemana pembeli mengirim uang, mendukung QRIS, Bank, atau E-Wallet apa saja.</p>
              </div>
              <button
                id="btn_trigger_add_payment"
                onClick={() => {
                  setCurrentPayment({ type: "bank", name: "", accountName: "", accountNo: "", qrCodeUrl: "", status: "active" });
                  setPaymentModalMode("add");
                }}
                className="px-4 py-2 bg-white text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Pembayaran
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {payments.map((m) => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-mono tracking-wider font-bold rounded">
                        {m.type.toUpperCase()}
                      </span>
                      <h4 className="font-display font-bold text-white text-base mt-2">{m.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded ${m.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500"}`}>
                      {m.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-lg text-xs space-y-1 font-mono">
                    <div className="text-slate-500 uppercase text-[9px] tracking-wide mb-1">Rincian Saluran Rekening</div>
                    <div className="text-white font-bold">{m.accountNo}</div>
                    <div className="text-slate-400 text-[11px]">A/N: {m.accountName}</div>
                    {m.qrCodeUrl && (
                      <div className="pt-2 text-slate-500 truncate text-[10px]">
                        URL QRIS: <span className="text-blue-400 select-all">{m.qrCodeUrl}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-800/60 pt-3">
                    <button
                      onClick={() => {
                        setCurrentPayment(m);
                        setPaymentModalMode("edit");
                      }}
                      className="px-3 py-1.5 bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-semibold rounded-lg border border-slate-800 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePaymentMethod(m.id)}
                      className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold rounded-lg border border-rose-500/20 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 6: BLACKLIST USERS
            ========================================== */}
        {activeTab === "blacklist" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Add Blacklist panel */}
              <div className="w-full md:w-1/3 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 flex-shrink-0 h-fit">
                <h3 className="font-display font-semibold text-white text-sm">Blokir Email Pembeli</h3>
                <form onSubmit={handleAddBlacklistSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase font-display block">Alamat Email Pembeli</label>
                    <input
                      type="email"
                      id="blacklist_email_input"
                      value={blacklistEmail}
                      onChange={(e) => setBlacklistEmail(e.target.value)}
                      placeholder="penipu@gmail.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase font-display block">Alasan Pemblokiran</label>
                    <textarea
                      id="blacklist_reason_input"
                      rows={3}
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      placeholder="Manipulasi struk / upload bukti transfer palsu berulang."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg focus:outline-none"
                    />
                  </div>

                  <button
                    id="btn_submit_blacklist"
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-center text-xs cursor-pointer transition shadow"
                  >
                    Tambah Blacklist
                  </button>
                </form>
              </div>

              {/* Blacklisted emails catalog table */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-mono font-bold">
                      <tr>
                        <th className="p-4">Tanggal Blokir</th>
                        <th className="p-4">Email Pembeli</th>
                        <th className="p-4">Alasan Detail</th>
                        <th className="p-4 text-right">Opsi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-white font-medium">
                      {blacklist.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-600 italic">Daftar hitam aman & kosong.</td>
                        </tr>
                      ) : (
                        blacklist.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-4 font-mono text-[10px] text-slate-500">
                              {new Date(item.createdAt).toLocaleDateString("id-ID")}
                            </td>
                            <td className="p-4 font-medium text-slate-200 select-all">{item.email}</td>
                            <td className="p-4 text-rose-300 italic">{item.reason}</td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleRemoveBlacklist(item.id)}
                                className="px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-emerald-400 hover:text-emerald-500 font-bold border border-green-500/20 rounded transition text-[10px]"
                              >
                                Cabut Blokir
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            TAB 7: CHRONOLOGICAL ACTIVITY LOGS
            ========================================== */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-white">Log Aktivitas Keamanan Sistem</h2>
              <p className="text-slate-400 text-xs">Merekam segala perubahan sensitif, mutasi produk, pembayaran, dan aksi log in admin.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[9px] font-bold sticky top-0">
                  <tr>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Action Token</th>
                    <th className="p-4">Rincian Aktivitas Mutasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-600">Belum ada aktivitas terekam.</td>
                    </tr>
                  ) : (
                    logs.map((lg) => (
                      <tr key={lg.id} className="hover:bg-slate-950/40">
                        <td className="p-4 text-slate-500 text-[10px]">
                          {new Date(lg.timestamp).toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-white font-bold">[{lg.action}]</td>
                        <td className="p-4 text-slate-400 font-sans leading-relaxed">{lg.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 8: ANNOUNCEMENT & PROMO BANNER SETTINGS
            ========================================== */}
        {activeTab === "banner" && (
          <div className="space-y-8 animate-fade-in text-xs md:text-sm">
            
            {/* Header */}
            <div>
              <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
                Pengaturan Tampilan Toko & Banner
              </h2>
              <p className="text-slate-400 text-xs">Atur teks promo, 3 slide banner gambar beranda utama, informasi footer, kontak bantuan darurat, dan hak cipta digital Anda.</p>
            </div>

            {/* ERROR & SUCCESS DISPLAYS */}
            {(errorMsg || successMsg) && (
              <div id="status_alert_box" className="p-4 rounded-xl border border-slate-850 bg-slate-950 font-mono text-[11px] flex flex-col gap-1">
                {errorMsg && <p className="text-rose-450 font-bold text-red-400">❌ Gagal: {errorMsg}</p>}
                {successMsg && <p className="text-green-450 font-bold text-green-400">✔ Sukses: {successMsg}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Form Settings (8/12 space) */}
              <div className="lg:col-span-8 space-y-8 animate-fade-in">
                
                {/* SETTING 1: TOP RUNNING BAR ANNOUNCEMENT BANNER */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                  <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></div>
                      <h3 className="font-display font-semibold text-white text-sm">1. Banner Siaran Pengumuman Atas</h3>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${bannerIsActive ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700/50'}`}>
                      {bannerIsActive ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>

                  {bannerLoading ? (
                    <p className="text-slate-500 text-xs font-mono py-4">Memuat data siaran...</p>
                  ) : (
                    <form onSubmit={saveBannerConfig} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Isi Teks Pengumuman</label>
                        <textarea
                          required
                          rows={2}
                          value={bannerText}
                          onChange={(e) => setBannerText(e.target.value)}
                          placeholder="Selamat datang di Dream Store! Nikmati kemudahan berbelanja..."
                          className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Status Penyiaran</label>
                          <select
                            value={bannerIsActive ? "true" : "false"}
                            onChange={(e) => setBannerIsActive(e.target.value === "true")}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs"
                          >
                            <option value="true">Aktifkan (Tampilkan Atas)</option>
                            <option value="false">Nonaktifkan (Sembunyikan)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Link Pengalihan Klik (Opsional)</label>
                          <input
                            type="text"
                            value={bannerLinkUrl}
                            onChange={(e) => setBannerLinkUrl(e.target.value)}
                            placeholder="https://t.me/yourgroup"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Warna Latar (Banner Style)</label>
                          <select
                            value={bannerBgColor}
                            onChange={(e) => setBannerBgColor(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono text-xs"
                          >
                            <option value="bg-slate-900 border-b border-indigo-500/30">Elegant Slate Blue</option>
                            <option value="bg-indigo-600">Pure Indigo Solid</option>
                            <option value="bg-gradient-to-r from-red-600 to-amber-500">Flame Amber Fire</option>
                            <option value="bg-gradient-to-r from-emerald-600 to-teal-500">Emerald Glow</option>
                            <option value="bg-slate-950 border-b border-rose-500/20">Danger Blood Red</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Warna Teks Font</label>
                          <select
                            value={bannerTextColor}
                            onChange={(e) => setBannerTextColor(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono text-xs"
                          >
                            <option value="text-white">Putih Bersih</option>
                            <option value="text-indigo-200">Indigo Muted</option>
                            <option value="text-yellow-200">Golden Glow</option>
                            <option value="text-slate-200">Muted Slate</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          id="btn_save_banner_settings"
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 font-bold uppercase text-xs tracking-wider rounded-xl transition cursor-pointer text-white shadow-lg shadow-indigo-500/10"
                        >
                          {actionLoading ? "Menyimpan..." : "Simpan & Terapkan Banner Melayang"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* SETTING 2: HOME SLIDER INTERACTIVE 3 CAROUSEL SLIDES */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-display font-semibold text-white text-sm">2. Kustomisasi Gambar & Teks 3 Slider Beranda Utama</h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">Edit konten, gambar, lencana lencana penjelas, serta tombol tindakan pada 3 slide beranda slider utama di Catalog.</p>
                  </div>

                  {configLoading ? (
                    <p className="text-slate-500 text-xs font-mono py-4">Memuat data konfigurasi slide...</p>
                  ) : (
                    <form onSubmit={saveStoreConfig} className="space-y-8">
                      
                      {/* Loop for 3 slides */}
                      {slides.map((slide, idx) => (
                        <div key={idx} className="bg-slate-950/70 p-5 rounded-2xl border border-slate-850 space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold font-mono">
                              0{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-display">Slide {idx + 1}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <div className="space-y-1.5 align-middle">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">URL Gambar Slide (Opsional untuk default)</label>
                              <input
                                type="text"
                                value={slide.image || ""}
                                onChange={(e) => {
                                  const updated = [...slides];
                                  updated[idx].image = e.target.value;
                                  setSlides(updated);
                                }}
                                placeholder="Gunakan URL link gambar baru atau kosongkan ke default"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Badge Badge Overlay (e.g. "STREAMING VIP")</label>
                              <input
                                type="text"
                                required
                                value={slide.badge || ""}
                                onChange={(e) => {
                                  const updated = [...slides];
                                  updated[idx].badge = e.target.value;
                                  setSlides(updated);
                                }}
                                placeholder="STREAMING VIP"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-bold uppercase text-xs"
                              />
                            </div>

                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Judul Utama Slide</label>
                              <input
                                type="text"
                                required
                                value={slide.title || ""}
                                onChange={(e) => {
                                  const updated = [...slides];
                                  updated[idx].title = e.target.value;
                                  setSlides(updated);
                                }}
                                placeholder="Judul besar promo..."
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Teks Tombol CTA</label>
                              <input
                                type="text"
                                required
                                value={slide.buttonText || ""}
                                onChange={(e) => {
                                  const updated = [...slides];
                                  updated[idx].buttonText = e.target.value;
                                  setSlides(updated);
                                }}
                                placeholder="Beli Sekarang / Eksplor"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs"
                              />
                            </div>

                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Deskripsi Singkat Promo</label>
                            <textarea
                              required
                              rows={2}
                              value={slide.desc || ""}
                              onChange={(e) => {
                                const updated = [...slides];
                                updated[idx].desc = e.target.value;
                                setSlides(updated);
                              }}
                              placeholder="Keterangan singkat tentang apa yang ditawarkan oleh slide promo ini..."
                              className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kategori Pintasan Katalog (Fungsi Klik)</label>
                              <input
                                type="text"
                                required
                                value={slide.category || ""}
                                onChange={(e) => {
                                  const updated = [...slides];
                                  updated[idx].category = e.target.value;
                                  setSlides(updated);
                                }}
                                placeholder="Streaming / Premium / Design"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Preset Warna Badge (Tailwind Class)</label>
                              <select
                                value={slide.badgeColor || ""}
                                onChange={(e) => {
                                  const updated = [...slides];
                                  updated[idx].badgeColor = e.target.value;
                                  setSlides(updated);
                                }}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono text-xs"
                              >
                                <option value="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">Violet Light Border</option>
                                <option value="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">Green Emerald Border</option>
                                <option value="bg-amber-500/20 text-amber-300 border-amber-500/30">Orange Amber Border</option>
                                <option value="bg-rose-500/20 text-rose-300 border-rose-500/30">Rose Pink Border</option>
                                <option value="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Cyan Glow Border</option>
                              </select>
                            </div>

                          </div>
                        </div>
                      ))}

                      {/* SETTING 3: FOOTER STATIC TEXTS & CONTACT SERVICES */}
                      <div className="border-t border-slate-800/80 pt-6 space-y-6">
                        <div>
                          <h4 className="font-display font-semibold text-white text-sm">3. Kustomisasi Teks Footer, Deskripsi Tentang Kami & Kontak</h4>
                          <p className="text-slate-500 text-[10.5px]">Ubah tulisan deskripsi e-commerce, visi misi Tentang Kami, serta info email / no WhatsApp WhatsApp di area footer paling bawah website.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div className="space-y-1.5 font-mono">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Deskripsi Footer E-Commerce</label>
                            <textarea
                              required
                              rows={3}
                              value={footerDescription}
                              onChange={(e) => setFooterDescription(e.target.value)}
                              placeholder="E-Commerce penyalur akun premium subscription digital instan..."
                              className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs font-sans leading-relaxed text-slate-350"
                            />
                          </div>

                          <div className="space-y-1.5 font-mono">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Tentang Kami (Visual Teks)</label>
                            <textarea
                              required
                              rows={3}
                              value={aboutUs}
                              onChange={(e) => setAboutUs(e.target.value)}
                              placeholder="Platform operasional berkecepatan tinggi..."
                              className="w-full p-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs font-sans leading-relaxed text-slate-350"
                            />
                          </div>

                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Layanan Darurat</label>
                            <input
                              type="email"
                              required
                              value={supportEmail}
                              onChange={(e) => setSupportEmail(e.target.value)}
                              placeholder="support@dreamstore.net"
                              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nomor WhatsApp Bantuan</label>
                            <input
                              type="text"
                              required
                              value={supportPhone}
                              onChange={(e) => setSupportPhone(e.target.value)}
                              placeholder="+62 857 1212 9999 (WhatsApp)"
                              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none font-mono text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Link Telegram Komplain / Layanan</label>
                            <input
                              type="text"
                              required
                              value={complainTelegramUrl}
                              onChange={(e) => setComplainTelegramUrl(e.target.value)}
                              placeholder="https://t.me/yourusername"
                              className="w-full px-3 py-2.5 bg-slate-950 border border-indigo-500/30 text-white rounded-xl focus:outline-none font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-sans">Teks Hak Cipta & Disclaimer (Copyright Text)</label>
                          <input
                            type="text"
                            required
                            value={copyrightText}
                            onChange={(e) => setCopyrightText(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none text-xs leading-relaxed"
                          />
                        </div>

                      </div>

                      <div className="pt-4 border-t border-slate-800">
                        <button
                          id="btn_save_configex"
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-3 bg-white text-slate-950 hover:bg-slate-100 font-extrabold uppercase text-xs tracking-widest rounded-xl transition cursor-pointer shadow hover:shadow-indigo-500/10 flex items-center justify-center gap-2"
                        >
                          {actionLoading ? "Menyimpan Perubahan..." : "Simpan Beranda Slider & Teks Footer"}
                        </button>
                      </div>

                    </form>
                  )}
                </div>

              </div>

              {/* Right Column: Dynamic Preview Info (4/12 space) */}
              <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4 h-fit">
                  <div className="border-b border-slate-800 pb-2">
                    <h3 className="font-display font-semibold text-white text-sm">💡 Info Penyesuaian Toko</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">Panduan kustomisasi cepat untuk admin.</p>
                  </div>

                  <div className="space-y-3 font-mono text-[10.5px] text-slate-400">
                    <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                      <span className="text-indigo-400 font-bold block uppercase border-b border-slate-900 pb-0.5">Slider Gambar Default</span>
                      <p className="text-slate-500 leading-relaxed text-[10px]">Apabila link gambar dikosongkan, lencana slider kustom akan otomatis menggunakan gambar promo default bertema neon futuristik agar estetika visual tetap luar biasa.</p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl space-y-1">
                      <span className="text-emerald-400 font-bold block uppercase border-b border-slate-900 pb-0.5">Real-time Synchronization</span>
                      <p className="text-slate-500 leading-relaxed text-[10px]">Seluruh perubahan yang disubmit di halaman ini akan diproporasikan langsung ke seluruh UI klien beranda & footer secara realtime instan tanpa perlu reload halaman.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
                  <span className="text-xs font-semibold text-indigo-400 block font-display">💡 Tips Desain Slider</span>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Gunakan Unsplash dengan format visual lanskap gelap berkualitas tinggi (`https://images.unsplash.com/...`) untuk warna background promo visual agar kontras teks putih di atasnya terbaca dengan nyaman & premium.
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
            TAB 9: MANUAL BANK / E-WALLET TOPUP APPROVALS
            ========================================== */}
        {activeTab === "topups" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800/60 pb-5">
              <div>
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-indigo-400" />
                  Konfirmasi Top-up Saldo
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  Daftar pengajuan saldo user yang didepositkan melalui transfer bank atau e-wallet manual maupun simulasi instan.
                </p>
              </div>
              <button
                onClick={fetchTopups}
                disabled={loadingTopups}
                className="p-2 bg-slate-950 hover:bg-slate-850 text-indigo-400 hover:text-white rounded-xl border border-slate-850 font-mono text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTopups ? "animate-spin" : ""}`} />
                Segarkan
              </button>
            </div>

            {loadingTopups && topups.length === 0 ? (
              <p className="text-slate-500 font-mono text-xs py-16 text-center animate-pulse">Permintaan top up sedang dimuat...</p>
            ) : topups.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl space-y-3">
                <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-slate-400 text-sm">Belum ada permohonan top up saldo saat ini.</p>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">Semua permintaan top up saldo aktif pelanggan akan tampil di panel ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase tracking-wider">
                      <th className="p-4">ID / Tanggal</th>
                      <th className="p-4">Pembeli (User)</th>
                      <th className="p-4">Nominal</th>
                      <th className="p-4">Metode Bayar</th>
                      <th className="p-4 text-center">Bukti Transfer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Aksi Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {topups.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-950/40 transition">
                        <td className="p-4">
                          <span className="font-mono text-white font-semibold block">{t.id}</span>
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            {new Date(t.createdAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-slate-200 block text-xs">{t.userName}</span>
                          <span className="text-slate-500 block font-mono text-[10px] mt-0.5">{t.userEmail}</span>
                        </td>
                        <td className="p-4 font-bold text-green-400 font-mono">
                          Rp {t.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-slate-300 font-mono text-xs">
                          {t.paymentMethodName}
                        </td>
                        <td className="p-4 text-center">
                          {t.paymentProofUrl ? (
                            <button
                              onClick={() => setViewProofUrl(t.paymentProofUrl || null)}
                              className="px-2 py-1 bg-slate-950 border border-slate-800 text-blue-400 hover:text-blue-300 font-mono font-bold text-[10px] rounded transition cursor-pointer"
                            >
                              LIHAT BUKTI
                            </button>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">TANPA STRUK</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono ${
                            t.status === "completed" ? "bg-green-500/10 text-green-400" :
                            t.status === "failed" ? "bg-rose-500/10 text-rose-400" :
                            "bg-amber-500/10 text-amber-400 animate-pulse"
                          }`}>
                            {t.status === "completed" ? "Sukses" : t.status === "failed" ? "Ditolak" : "Tertunda (Pending)"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {t.status === "pending" ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  triggerConfirm("Setujui Top-Up", `Lacak dan verifikasi pengajuan top-up saldo sebesar Rp ${t.amount.toLocaleString("id-ID")} dari ${t.userName} (${t.userEmail}). Setujui?`, () => {
                                    handleProcessTopup(t.id, "completed");
                                  });
                                }}
                                className="p-1 px-2.5 bg-green-500 hover:bg-green-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer transition shadow hover:bg-green-400"
                              >
                                Setuju
                              </button>
                              <button
                                onClick={() => {
                                  triggerConfirm("Tolak Top-Up", `Tolak pengajuan top-up saldo sebesar Rp ${t.amount.toLocaleString("id-ID")} dari ${t.userName}?`, () => {
                                    handleProcessTopup(t.id, "failed");
                                  });
                                }}
                                className="p-1 px-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold rounded-lg text-xs cursor-pointer transition"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic font-mono uppercase tracking-widest font-bold">Terproses</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 10: KELOLA SALDO PENGGUNA (WALLET ADJUSTMENTS)
            ========================================== */}
        {activeTab === "users" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800/60 pb-5">
              <div>
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2 text-left">
                  <Users className="w-6 h-6 text-amber-500" />
                  Kelola Saldo Pengguna
                </h2>
                <p className="text-xs text-slate-400 mt-1 text-left font-sans">
                  Atur atau sesuaikan saldo dompet digital pembeli (tambah/kurang) secara manual.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Penyesuaian Saldo */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4 lg:col-span-1 h-fit">
                <h3 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-1.5 border-b border-slate-800 pb-2 text-left font-sans">
                  <span className="w-1.5 h-3 bg-amber-500 rounded-full"></span>
                  Form Penyesuaian Saldo
                </h3>
                <form onSubmit={handleAdjustBalance} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block text-left">Email Pengguna*</label>
                    <input
                      type="email"
                      required
                      placeholder="Pilih pengguna di bawah atau ketik..."
                      value={selectedUserEmail}
                      onChange={(e) => setSelectedUserEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block text-left">Tipe Aksi*</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setBalanceAdjustAction("add")}
                        className={`py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer font-sans ${
                          balanceAdjustAction === "add"
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Tambah Saldo (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBalanceAdjustAction("reduce")}
                        className={`py-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer font-sans ${
                          balanceAdjustAction === "reduce"
                            ? "bg-rose-500/15 border-rose-500 text-rose-400 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Kurangi Saldo (-)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block text-left font-sans">Nominal Saldo (Rupiah)*</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={balanceAdjustAmount}
                      onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block text-left font-sans">Alasan Penyesuaian*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bonus Event / Refund Manual"
                      value={balanceAdjustReason}
                      onChange={(e) => setBalanceAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 duration-200 cursor-pointer text-slate-950 font-bold rounded-lg text-xs shadow-md transition disabled:opacity-50 font-sans"
                  >
                    {actionLoading ? "Memproses..." : `Proses ${balanceAdjustAction === "add" ? "Penambahan" : "Pengurangan"}`}
                  </button>
                </form>
              </div>

              {/* Tabel Pengguna Terdaftar */}
              <div className="bg-slate-950/20 border border-slate-800/60 rounded-xl p-5 lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <h3 className="text-sm font-bold text-slate-200 font-sans">Daftar Pengguna Aktif</h3>
                  <div className="relative w-full max-w-sm">
                    <input
                      type="text"
                      placeholder="Cari user (nama/email)..."
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-xs sm:w-64 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition text-left"
                    />
                  </div>
                </div>

                {loadingUsers ? (
                  <div className="text-center py-10 font-mono text-xs text-slate-500">
                    Memuat daftar pengguna...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Nama</th>
                          <th className="p-3">Email</th>
                          <th className="p-3 text-right">Saldo Dompet</th>
                          <th className="p-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(u => 
                            u.name.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchUserQuery.toLowerCase())
                          )
                          .map((u) => (
                            <tr key={u.id} className="border-b border-slate-850 hover:bg-slate-900/40 text-slate-300">
                              <td className="p-3 font-semibold text-slate-200 text-left">{u.name}</td>
                              <td className="p-3 font-mono text-slate-400 text-left">{u.email}</td>
                              <td className="p-3 text-right font-mono font-bold text-amber-400">
                                Rp {(u.balance || 0).toLocaleString("id-ID")}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedUserEmail(u.email);
                                    setBalanceAdjustAmount("");
                                    setBalanceAdjustReason("");
                                  }}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 rounded text-[10px] font-bold cursor-pointer transition"
                                >
                                  Pilih & Atur
                                </button>
                              </td>
                            </tr>
                          ))}
                        {users.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-8 text-slate-500 italic font-mono uppercase tracking-wider">
                              Tidak ada pengguna terdaftar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* ==========================================
            TAB 11: LAYANAN CS & CHAT SUPPORT REPLIES
            ========================================== */}
        {activeTab === "support" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800/60 pb-5">
              <div>
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2 text-left">
                  <MessageSquare className="w-6 h-6 text-sky-400 animate-pulse" />
                  Pesan CS & Support Chat
                </h2>
                <p className="text-xs text-slate-400 mt-1 text-left font-sans">
                  Balas pesan pelanggan virtual Anda secara langsung untuk memberikan pelayanan premium.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 bg-sky-500/15 text-sky-400 border border-sky-400/20 rounded-full font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5 h-fit">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Live Stream Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[510px] overflow-hidden">
              {/* Left Column: Chat Inbox Threads list */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-y-auto flex flex-col md:col-span-1 h-full">
                <div className="p-3 border-b border-slate-800 bg-slate-950 font-semibold text-xs text-slate-300 uppercase tracking-wider font-mono text-left">
                  Daftar Obrolan
                </div>
                {loadingSessions ? (
                  <div className="text-center p-8 text-xs font-mono text-slate-500">Memuat sesi chat...</div>
                ) : (
                  <div className="flex-1 divide-y divide-slate-850">
                    {csSessions.map((session) => (
                      <button
                        key={session.sessionId}
                        onClick={() => {
                          setSelectedSessionId(session.sessionId);
                          fetchSessionMessages(session.sessionId);
                        }}
                        className={`w-full text-left p-3 flex flex-col gap-1 hover:bg-slate-900/65 transition cursor-pointer ${
                          selectedSessionId === session.sessionId ? "bg-slate-900 border-l-2 border-sky-400" : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-200 truncate pr-2">
                            {session.userEmail || `Guest (${session.sessionId.substring(session.sessionId.length - 8)})`}
                          </span>
                          {session.unreadCount > 0 && (
                            <span className="shrink-0 bg-sky-500 text-slate-950 text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate text-left italic">
                          "{session.lastMessage}"
                        </p>
                        <span className="text-[9px] text-slate-600 font-mono text-left">
                          {new Date(session.lastTime).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                        </span>
                      </button>
                    ))}
                    {csSessions.length === 0 && (
                      <div className="text-center p-12 text-slate-500 italic text-xs font-mono uppercase tracking-wider">
                        Belum ada tiket support yang masuk.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Chat Screen details */}
              <div className="bg-slate-950/20 border border-slate-800 rounded-xl flex flex-col md:col-span-2 h-full overflow-hidden">
                {selectedSessionId ? (
                  <>
                    {/* Active Thread Header */}
                    <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                      <div className="text-left">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-sky-400 font-bold block">
                          Sesi CS Aktif
                        </span>
                        <h4 className="text-xs font-bold text-white mt-0.5">
                          {csSessions.find(s => s.sessionId === selectedSessionId)?.userEmail || `Guest session ${selectedSessionId.substring(selectedSessionId.length - 8)}`}
                        </h4>
                      </div>
                      <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse inline-block shadow shadow-green-500/50" title="Real-time polling active"></span>
                    </div>

                    {/* Chat Messages List */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40 text-xs flex flex-col">
                      {loadingMessages && selectedSessionMessages.length === 0 ? (
                        <div className="text-center py-20 font-mono text-slate-500">Memuat percakapan...</div>
                      ) : (
                        selectedSessionMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[80%] ${
                              msg.sender === "cs" ? "self-end items-end animate-fade-in" : "self-start items-start animate-fade-in"
                            }`}
                          >
                            <div className={`p-2.5 rounded-2xl leading-relaxed text-left whitespace-pre-line ${
                              msg.sender === "cs"
                                ? "bg-sky-600 text-white rounded-tr-none font-medium"
                                : "bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none"
                            }`}>
                              {msg.text}
                            </div>
                            <span className="text-[9px] text-slate-600 font-mono mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Text Input Form */}
                    <form onSubmit={handleSendCsReply} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2 shrink-0">
                      <input
                        type="text"
                        required
                        placeholder="Tulis balasan untuk pelanggan..."
                        value={csReplyText}
                        onChange={(e) => setCsReplyText(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 transition text-left"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading || !csReplyText.trim()}
                        className="p-2.5 bg-sky-600 hover:bg-sky-500 text-slate-950 rounded-xl cursor-pointer transition font-bold disabled:opacity-40 shrink-0 flex items-center justify-center font-sans"
                        title="Kirim Balasan"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                    <MessageSquare className="w-10 h-10 text-slate-700 animate-bounce mb-3" />
                    <h4 className="font-display font-semibold text-slate-350 text-xs uppercase tracking-wider mb-1">
                      Saluran Dukungan Pelanggan
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                      Silakan pilih salah satu sesi obrolan aktif dari panel sebelah kiri untuk mulai mengobrol langsung dan membalas kendala pelanggan.
                    </p>
                  </div>
                )}
               </div>
             </div>
           </div>
         )}

        {/* =======================================================
            TAB 12: ULASAN & FEEDBACK PELANGGAN
            ======================================================= */}
        {activeTab === "reviews" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800/60 pb-5">
              <div>
                <h2 className="font-display font-bold text-2xl text-white flex items-center gap-2 text-left">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500/25 animate-pulse" />
                  Dashboard Rating & Ulasan Pelanggan
                </h2>
                <p className="text-xs text-slate-400 mt-1 text-left font-sans">
                  Pantau semua ulasan kepuasan, tanggapan bintang, dan ulasan tertulis dari pembeli toko Anda.
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            {(() => {
              const ratedOrders = orders.filter((o) => o.rating && o.rating > 0);
              const totalRating = ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0);
              const avgRating = ratedOrders.length > 0 ? (totalRating / ratedOrders.length).toFixed(1) : "0.0";
              
              const star5 = ratedOrders.filter(o => o.rating === 5).length;
              const star4 = ratedOrders.filter(o => o.rating === 4).length;
              const star3 = ratedOrders.filter(o => o.rating === 3).length;
              const star2 = ratedOrders.filter(o => o.rating === 2).length;
              const star1 = ratedOrders.filter(o => o.rating === 1).length;

              const getPercentage = (count: number) => {
                if (ratedOrders.length === 0) return 0;
                return Math.round((count / ratedOrders.length) * 100);
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/45 p-5 rounded-2xl border border-slate-850">
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-950/70 rounded-xl border border-slate-900 text-center">
                    <span className="text-4xl font-mono font-extrabold text-white">{avgRating}</span>
                    <div className="flex text-amber-400 mt-2 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-450" : "text-slate-800"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold font-mono tracking-wider font-sans">Bintang Rata-rata</span>
                    <span className="text-[10px] text-slate-500 mt-1 font-mono">Berdasarkan {ratedOrders.length} Ulasan</span>
                  </div>

                  <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider text-left">
                      Distribusi Bintang
                    </h4>
                    
                    {[5, 4, 3, 2, 1].map((num) => {
                      const count = num === 5 ? star5 : num === 4 ? star4 : num === 3 ? star3 : num === 2 ? star2 : star1;
                      const pct = getPercentage(count);
                      return (
                        <div key={num} className="flex items-center gap-3 text-xs opacity-90">
                          <span className="w-10 font-mono text-slate-400 hover:text-white font-bold flex items-center justify-end gap-1 shrink-0">
                            {num} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </span>
                          <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-950">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 font-mono text-slate-400 text-right shrink-0">
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* List with clean search/filter header */}
            {(() => {
              const ratedOrders = orders.filter((o) => o.rating && o.rating > 0);
              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-display font-semibold text-white text-base text-left">
                      Semua Tanggapan Transaksi ({ratedOrders.length})
                    </h3>
                  </div>

                  {ratedOrders.length === 0 ? (
                    <div className="text-center py-16 bg-slate-950 border border-slate-850 rounded-2xl p-6">
                      <Star className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                      <h4 className="font-display font-semibold text-white text-sm">Belum Ada Ulasan Pembeli</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                        Sistem belanja Anda siap menerima ulasan. Pembeli otomatis disuguhkan modal ulasan setelah pesanan mereka diselesaikan oleh admin.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950/60 shadow">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse font-sans font-sans">
                          <thead>
                            <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-850 font-extrabold tracking-wider">
                              <th className="p-4">Pesanan / Tanggal</th>
                              <th className="p-4">Pelanggan</th>
                              <th className="p-4">Produk Digital</th>
                              <th className="p-3 text-center">Bintang</th>
                              <th className="p-4">Isi Ulasan & Komentar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {ratedOrders.map((o) => (
                              <tr key={o.id} className="hover:bg-slate-900/40 transition">
                                <td className="p-4 space-y-1">
                                  <div className="text-xs font-mono font-bold text-white select-all">#{o.id}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {new Date(o.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </td>
                                <td className="p-4 space-y-1 text-left">
                                  <div className="text-xs font-semibold text-slate-205" title={o.userEmail}>{o.userEmail}</div>
                                  <div className="text-[10px] text-slate-500 font-mono">{o.userPhone}</div>
                                </td>
                                <td className="p-4 text-xs font-bold text-indigo-400">
                                  {o.productName}
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <span className="font-mono text-sm font-extrabold text-amber-400">
                                      {o.rating} ⭐
                                    </span>
                                    <div className="flex text-amber-500 shrink-0 font-bold">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-2.5 h-2.5 ${
                                            star <= (o.rating || 0) ? "fill-amber-400 text-amber-450" : "text-slate-805"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-xs text-slate-300 italic max-w-xs break-words">
                                  "{o.reviewText || "Sempurna!"}"
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </main>

      {/* =======================================================
          MODALS & FORM POPUPS
          ======================================================= */}

      {/* 1. PRODUCT DETAILS ADD / EDIT MODAL */}
      {productModalMode && currentProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wide">
                {productModalMode === "add" ? "Tambah Produk Digital" : "Edit Parameter Produk"}
              </h3>
              <button onClick={() => setProductModalMode(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Nama Produk</label>
                <input
                  type="text"
                  id="prod_name_field"
                  required
                  value={currentProduct.name || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  placeholder="e.g. Spotify Premium 1 Bulan"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Kategori</label>
                  <select
                    id="prod_category_field"
                    value={currentProduct.category || "Music"}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                  >
                    <option value="Music">Music</option>
                    <option value="Streaming">Streaming</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Harga Pas (Rupiah)</label>
                  <input
                    type="number"
                    id="prod_price_field"
                    required
                    value={currentProduct.price !== undefined ? currentProduct.price : ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">URL Foto (Unsplash / Bebas)</label>
                <input
                  type="text"
                  id="prod_image_field"
                  value={currentProduct.imageUrl || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Status Keaktifan</label>
                <select
                  id="prod_status_field"
                  value={currentProduct.status || "active"}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  <option value="active">Active (Tampil di Store)</option>
                  <option value="inactive">Inactive (Sembunyikan)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Deskripsi Produk Lengkap</label>
                <textarea
                  id="prod_desc_field"
                  rows={3}
                  value={currentProduct.description || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  placeholder="Fitur premium, garansi penuh 30 hari..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg"
                />
              </div>

              <button
                id="btn_save_product_record"
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-200 transition font-bold rounded-lg text-xs cursor-pointer shadow"
              >
                {actionLoading ? "Menyimpan..." : "Luncurkan Produk"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. PAYMENT CHANNEL DETAILS ADD / EDIT MODAL */}
      {paymentModalMode && currentPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoom">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-display font-medium text-white text-sm uppercase tracking-wide">
                {paymentModalMode === "add" ? "Saluran Pembayaran Baru" : "Edit Parameter Saluran"}
              </h3>
              <button onClick={() => setPaymentModalMode(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Nama Channel</label>
                  <input
                    type="text"
                    id="pay_name_field"
                    required
                    value={currentPayment.name || ""}
                    onChange={(e) => setCurrentPayment({ ...currentPayment, name: e.target.value })}
                    placeholder="e.g. Bank Mandiri"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">Tipe Kanal</label>
                  <select
                    id="pay_type_field"
                    value={currentPayment.type || "bank"}
                    onChange={(e) => setCurrentPayment({ ...currentPayment, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs"
                  >
                    <option value="qris">QRIS</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Nomor Rekening / Nomor HP DANA</label>
                <input
                  type="text"
                  id="pay_no_field"
                  required
                  value={currentPayment.accountNo || ""}
                  onChange={(e) => setCurrentPayment({ ...currentPayment, accountNo: e.target.value })}
                  placeholder="e.g. 5529103912 atau 0812..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Nama Pemilik Rekening (A/N)</label>
                <input
                  type="text"
                  id="pay_owner_field"
                  required
                  value={currentPayment.accountName || ""}
                  onChange={(e) => setCurrentPayment({ ...currentPayment, accountName: e.target.value })}
                  placeholder="e.g. PT DREAM STORE DIGITAL"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg"
                />
              </div>

              {currentPayment.type === "qris" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold">URL Gambar QRIS Code (Custom)</label>
                  <input
                    type="text"
                    id="pay_qr_field"
                    value={currentPayment.qrCodeUrl || ""}
                    onChange={(e) => setCurrentPayment({ ...currentPayment, qrCodeUrl: e.target.value })}
                    placeholder="https://api.qrserver.com/v1/..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg"
                  />
                  <span className="text-[9px] text-slate-500 italic block mt-0.5">
                    *Harap masukan QR yang sah agar pembeli memindai struk dengan aslinya
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Status</label>
                <select
                  id="pay_status_field"
                  value={currentPayment.status || "active"}
                  onChange={(e) => setCurrentPayment({ ...currentPayment, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  <option value="active">Active (Tampil saat Checkout)</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                id="btn_save_payment_record"
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-200 transition font-bold rounded-lg text-xs cursor-pointer shadow"
              >
                {actionLoading ? "Menyimpan..." : "Luncurkan Saluran"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. USER PAYMENT PROOF RECEIPT DETAILED MODAL VIEWER */}
      {viewProofUrl && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4">
            <button
              onClick={() => setViewProofUrl(null)}
              className="absolute top-3 right-3 text-white bg-slate-950 p-2.5 font-bold rounded-full border border-slate-800 transition shadow hover:bg-slate-900 leading-none"
            >
              ✕
            </button>
            <h4 className="font-display font-medium text-white text-xs mb-3 uppercase tracking-wide">
              Pratinjau Bukti Transfer Pembeli
            </h4>
            <div className="max-h-[75vh] overflow-y-auto rounded-lg border border-slate-950">
              <img 
                src={viewProofUrl} 
                alt="Payment proof of user" 
                referrerPolicy="no-referrer"
                className="w-full object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. DECLINE REMARKS MODAL FORM */}
      {declineRemarksOrderId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <span className="text-white font-semibold text-xs uppercase font-mono tracking-wider">Tolak Pesanan {declineRemarksOrderId}</span>
              <button onClick={() => setDeclineRemarksOrderId(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block font-display">Tulis Alasan Penolakan</label>
                <textarea
                  id="decline_remarks_field"
                  rows={3}
                  value={declineReasonText}
                  onChange={(e) => setDeclineReasonText(e.target.value)}
                  placeholder="Bukti transfer terpotong / nominal tidak sesuai. Harap hubungi WhatsApp Admin."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white text-xs rounded-lg focus:outline-none"
                />
              </div>

              <button
                id="btn_submit_decline_order"
                onClick={handleDeclineSubmit}
                disabled={actionLoading}
                className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs cursor-pointer transition shadow"
              >
                {actionLoading ? "Memproses..." : "Tolak & Batalkan Pesanan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CUSTOM STATE CONFIRMATION DIALOG MODAL (SANDBOX-COMPLIANT) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <span className="text-white font-semibold text-xs uppercase font-mono tracking-wider">{confirmDialog.title}</span>
              <button onClick={() => setConfirmDialog(null)} className="text-slate-400 hover:text-white cursor-pointer select-none">✕</button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{confirmDialog.message}</p>

              <div className="flex gap-2.5 pt-2">
                <button
                  id="btn_confirm_cancel"
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  id="btn_confirm_submit"
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 py-2 bg-white text-slate-950 hover:bg-slate-200 text-xs font-bold rounded-lg cursor-pointer transition shadow"
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

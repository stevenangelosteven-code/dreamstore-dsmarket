import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Radio, Shield, HelpCircle, Eye, ChevronRight, ChevronLeft, Sparkles, Check, Key, QrCode, Upload, ArrowRight, AlertTriangle, FileText, Gift, Lock, Star, RefreshCw } from "lucide-react";
import { Product, PaymentMethod, Order, Review } from "../types";
import promoStreaming from "../assets/images/promo_streaming_1781088411522.png";
import promoMusic from "../assets/images/promo_music_1781088427331.png";
import promoDesign from "../assets/images/promo_design_1781088441281.png";

interface CatalogProps {
  onOrderCreated: (orderId: string) => void;
  userEmail?: string;
  userPhone?: string;
}

export function Catalog({ onOrderCreated, userEmail = "", userPhone = "" }: CatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  
  // Slide States & Configuration with generated visual elements
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const defaultSlides = [
    {
      image: promoStreaming,
      badge: "STREAMING VIP",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      title: "Pusat Akun Premium & Subscription Tercepat",
      desc: "Nikmati akses streaming Netflix, YouTube Premium & Spotify Orisinal tanpa hambatan. Aktivasi instan otomatis 24 jam penuh!",
      category: "Streaming",
      buttonText: "Beli Sekarang",
    },
    {
      image: promoMusic,
      badge: "HI-FI AUDIO",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      title: "Sub Audio & Game Gift Card Murah",
      desc: "Rasakan jaminan kepuasan mendengarkan musik lossless & unlock voucher game favorit Anda dengan jaminan layanan terbaik.",
      category: "Music",
      buttonText: "Eksplor Audio",
    },
    {
      image: promoDesign,
      badge: "KREATIF PRO",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      title: "Canva & Adobe Subscription Termurah",
      desc: "Tingkatkan produktivitas desain grafis, edit video & kreativitas profesional Anda dengan jaminan lisensi full durasi resmi.",
      category: "Design",
      buttonText: "Lihat Akun Desain",
    }
  ];

  const [carouselSlides, setCarouselSlides] = useState<any[]>(defaultSlides);

  const fetchCarouselConfig = async () => {
    try {
      const res = await fetch("/api/store-config");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.carouselSlides) && data.carouselSlides.length > 0) {
          const loaded = data.carouselSlides.map((slide: any, index: number) => ({
            image: slide.image || (index === 0 ? promoStreaming : index === 1 ? promoMusic : promoDesign),
            badge: slide.badge || defaultSlides[index].badge,
            badgeColor: slide.badgeColor || defaultSlides[index].badgeColor,
            title: slide.title || defaultSlides[index].title,
            desc: slide.desc || defaultSlides[index].desc,
            category: slide.category || defaultSlides[index].category,
            buttonText: slide.buttonText || defaultSlides[index].buttonText,
          }));
          setCarouselSlides(loaded);
        }
      }
    } catch (e) {
      console.warn("Offline fallback for carousel configs load");
    }
  };

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [carouselSlides.length]);
  
  // Checkout Modal State
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "checkout_form" | "upload_proof">("details");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  // Form states
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  
  // Security PIN validation states
  const [userHasPin, setUserHasPin] = useState(false);
  const [checkoutPin, setCheckoutPin] = useState("");
  
  // File Transfer upload states
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string>("");
  const [nominalInput, setNominalInput] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
  const [formError, setFormError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const categories = ["Semua", "Music", "Streaming", "Design"];

  // Debounced check if user's email has a configured security PIN
  useEffect(() => {
    if (!email || !email.includes("@")) {
      setUserHasPin(false);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/pin-check?email=${encodeURIComponent(email.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setUserHasPin(!!data.hasPin);
        }
      } catch (e) {
        console.warn("Failed checking details for email pin", e);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [email]);

  useEffect(() => {
    fetchProducts();
    fetchPaymentMethods();
    fetchCarouselConfig();
    fetchReviews();

    const handleSync = () => {
      fetchCarouselConfig();
    };
    window.addEventListener("sync_store_config", handleSync);
    return () => {
      window.removeEventListener("sync_store_config", handleSync);
    };
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/payment-methods");
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch("/api/public/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (userEmail) setEmail(userEmail);
    if (userPhone) setPhone(userPhone);
  }, [userEmail, userPhone]);

  const handleOpenProduct = (prod: Product) => {
    setActiveProduct(prod);
    setCheckoutStep("details");
    setFormError("");
    setOrderError("");
    setEmail(userEmail || "");
    setPhone(userPhone || "");
    setProofFile(null);
    setProofBase64("");
    setNominalInput("");
    setCreatedOrder(null);
    setCheckoutPin(""); // reset PIN value
    const methods = [...paymentMethods];
    const token = localStorage.getItem("dream_user_token");
    if (token) {
      const stored = localStorage.getItem("dream_user_data");
      let bal = 0;
      if (stored) {
        try { bal = JSON.parse(stored).balance || 0; } catch {}
      }
      methods.unshift({
        id: "pay_saldo",
        type: "Dream Wallet",
        name: `Saldo Wallet (Rp ${bal.toLocaleString("id-ID")})`,
        accountName: "Instant",
        accountNo: "Virtual",
        status: "active"
      });
    }
    if (methods.length > 0) {
      setSelectedMethod(methods[0]);
    }
  };

  // Phase 1: Create local pending order or purchase with Saldo
  const handleInitiateOrder = async () => {
    if (!email.trim() || !phone.trim() || !selectedMethod || !activeProduct) {
      setFormError("Semua kolom (Email, Nomor HP, Metode Pembayaran) wajib diisi.");
      return;
    }
    
    // Custom soft validation for email
    if (!email.includes("@") || !email.includes(".")) {
      setFormError("Silakan masukkan format alamat email yang valid.");
      return;
    }

    if (userHasPin) {
      if (!checkoutPin) {
        setFormError("PIN Keamanan wajib diisi untuk mengonfirmasi transaksi akun terproteksi ini.");
        return;
      }
      if (!/^\d{6}$/.test(checkoutPin)) {
        setFormError("PIN Keamanan harus berupa 6 digit angka.");
        return;
      }
    }

    setSubmittingProof(true);
    setFormError("");

    try {
      const token = localStorage.getItem("dream_user_token");
      const headersVal: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headersVal["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: headersVal,
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          productId: activeProduct.id,
          paymentMethodId: selectedMethod.id,
          pin: userHasPin ? checkoutPin : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || errData.message || "Gagal membuat pesanan.");
      }

      const data = await res.json();
      setCreatedOrder(data.order);
      setNominalInput(String(activeProduct.price)); // default exact amount
      setCheckoutStep("upload_proof");
    } catch (err: any) {
      setFormError(err.message || "Gagal menyelesaikan pemesanan.");
    } finally {
      setSubmittingProof(false);
    }
  };

  // Convert uploaded image to base64 for processing safely
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setFormError("Format file salah. Hanya mendukung file gambar JPG, PNG, atau WEBP.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        setFormError("Ukuran file terlalu besar. Ukuran maksimal adalah 8 MB.");
        return;
      }
      setProofFile(file);
      setFormError("");

      const reader = new FileReader();
      reader.onloadend = () => {
        setProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Phase 2: Finalize payment proof upload
  const handleSubmitProof = async () => {
    if (!createdOrder) return;
    if (!proofBase64) {
      setFormError("Harap unggah bukti transfer pembayaran Anda.");
      return;
    }
    if (!nominalInput || parseFloat(nominalInput) <= 0) {
      setFormError("Nominal pembayaran harus diisi dengan benar.");
      return;
    }

    setSubmittingProof(true);
    setFormError("");

    try {
      const res = await fetch(`/api/orders/${createdOrder.id}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: proofFile?.name || "upload_proof.png",
          base64: proofBase64,
          paymentAmount: Number(nominalInput)
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal memproses unggah bukti.");
      }

      // Success checkout! Auto-redirect to trackers
      onOrderCreated(createdOrder.id);
      setActiveProduct(null);
    } catch (err: any) {
      setFormError(err.message || "Gagal mengunggah bukti pembayaran.");
    } finally {
      setSubmittingProof(false);
    }
  };

  // Dynamic wallet payment support
  const storedUserRaw = localStorage.getItem("dream_user_data");
  let userWalletBalance = 0;
  if (storedUserRaw) {
    try {
      const parsed = JSON.parse(storedUserRaw);
      userWalletBalance = parsed.balance || 0;
    } catch {}
  }

  const availableMethods = [...paymentMethods];
  const tokenForWallet = localStorage.getItem("dream_user_token");
  if (tokenForWallet && !availableMethods.some(m => m.id === "pay_saldo")) {
    availableMethods.unshift({
      id: "pay_saldo",
      type: "Dream Wallet",
      name: `Saldo Wallet (Rp ${userWalletBalance.toLocaleString("id-ID")})`,
      accountName: "Instant Delivery",
      accountNo: "Virtual Wallet Balance",
      status: "active"
    });
  }

  // Filters logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* 1. Interactive 3-Image Sliding Promo Carousel Banner */}
      <div id="catalog_carousel_section" className="relative group overflow-hidden bg-slate-950 border border-slate-900 rounded-3xl h-[300px] sm:h-[380px] md:h-[450px] shadow-2xl z-10 flex flex-col justify-end">
        {carouselSlides.map((slide, sIdx) => (
          <div
            key={sIdx}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              sIdx === currentSlide 
                ? "opacity-100 z-10 scale-100" 
                : "opacity-0 z-0 scale-105 pointer-events-none"
            }`}
          >
            {/* Background Promo Image */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
            
            {/* Master reading gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent hidden md:block" />

            {/* Banner Promotional Text & CTAs */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 md:p-14 text-left flex flex-col justify-end max-w-2xl space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${slide.badgeColor}`}>
                  {slide.badge}
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-3.5xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {slide.title}
              </h2>

              <p className="text-slate-350 text-xs sm:text-sm max-w-xl leading-relaxed font-sans">
                {slide.desc}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(slide.category);
                    const catalogDest = document.getElementById("catalog_products_header");
                    if (catalogDest) {
                      catalogDest.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-95 duration-200 transition-all text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 shrink-0 select-none"
                >
                  {slide.buttonText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Prev controller */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white/70 hover:text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 focus:outline-none"
          title="Sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Carousel Next controller */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/40 hover:bg-slate-900/80 text-white/70 hover:text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-305 cursor-pointer z-20 focus:outline-none"
          title="Selanjutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dots Navigation Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {carouselSlides.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(dotIdx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === currentSlide 
                  ? "w-6 bg-white" 
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
              title={`Slide ${dotIdx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* 2. Standalone Digital Product Search Panel */}
      <div id="catalog_products_header" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-indigo-400" />
            Amankan Akses Akun Premium Anda
          </h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            Pilih dari bermacam produk premium tepercaya yang instan, orisinal, dan bergaransi penuh.
          </p>
        </div>
        
        <div className="relative w-full md:max-w-md shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            id="search_catalog_input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ketik Spotify, Netflix, YouTube..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs tracking-wide font-medium"
          />
        </div>
      </div>

      {/* 2. Category list */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`cat_tab_${cat}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer ${
              selectedCategory === cat
                ? "bg-white text-slate-950 font-bold"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3. Products grid display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">Menyinkronkan persediaan digital...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-slate-950 border border-slate-900 rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-white text-base">Produk tidak ditentukan</h3>
          <p className="text-slate-500 text-xs mt-1">Coba masukkan kata kunci pencarian atau kategori lain.</p>
        </div>
      ) : (
        <div id="catalog_product_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock !== undefined && p.stock <= 0;
            return (
              <div
                key={p.id}
                role="article"
                className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col h-full"
              >
                {/* Product thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono border border-slate-800 text-slate-300 tracking-wider">
                    {p.category}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider rounded font-medium ${
                        p.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-500"
                      }`}>
                        {p.status === "active" ? "AKTIF" : "NONAKTIF"}
                      </span>
                      <span className={`font-mono text-[11px] font-semibold ${isOutOfStock ? "text-rose-400" : "text-green-400"}`}>
                        {isOutOfStock ? "STOK HABIS" : `STOK: ${p.stock}`}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-white text-base group-hover:text-slate-200 transition line-clamp-2">
                      {p.name}
                    </h3>
                    
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {p.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">HARGA PAS</span>
                      <p className="text-white font-mono font-bold text-base">
                        Rp {p.price.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <button
                      id={`btn_order_${p.id}`}
                      onClick={() => handleOpenProduct(p)}
                      disabled={p.status !== "active" || isOutOfStock}
                      className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1 transition shadow cursor-pointer ${
                        p.status !== "active" || isOutOfStock
                          ? "bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed"
                          : "bg-white text-slate-950 hover:bg-slate-200"
                      }`}
                    >
                      {isOutOfStock ? "Habis" : "Beli"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3.5. Public Reviews & Ratings Section */}
      <div className="bg-slate-900/40 border border-slate-850/60 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-amber-400 font-mono tracking-widest uppercase font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-450 animate-pulse" />
              TESTIMONI PELANGGAN REAL-TIME
            </span>
            <h3 className="font-display text-lg md:text-xl font-extrabold text-white tracking-tight">
              Ulasan & Feedback Kepuasan
            </h3>
            <p className="text-slate-400 text-xs">
              Ulasan tulus dari pembeli kami yang telah sukses menerima akun premium instan mereka.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-center">
              <span className="text-2xl font-mono font-bold text-white block">
                {reviews.length > 0 
                  ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
                  : "0.0"}
              </span>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Bintang Rata-rata</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-center">
              <span className="text-2xl font-mono font-bold text-amber-400 block">{reviews.length}</span>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Total Ulasan</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-center">
              <span className="text-2xl font-mono font-bold text-green-400 block">
                {reviews.length > 0 
                  ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) 
                  : 100}%
              </span>
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider block">Tingkat Kepuasan</span>
            </div>
          </div>
        </div>

        {loadingReviews ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-slate-500 text-xs font-mono">Memuat testimoni pembeli...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 bg-slate-955 border border-slate-900 rounded-2xl p-6">
            <Star className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Belum Ada Testimoni Pembeli</p>
            <p className="text-[10px] text-slate-500 mt-1">Beli produk kami sekarang dan jadilah yang pertama memberikan ulasan premium!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1 select-none custom-scrollbar">
            {reviews.map((rev) => (
              <div 
                key={rev.id} 
                className="bg-slate-950/80 border border-slate-850 hover:border-slate-800 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition duration-200 hover:bg-slate-950"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-300 block truncate" title={rev.userEmail}>
                      {rev.userEmail}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-750"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-sans font-bold uppercase tracking-wider truncate max-w-[130px]">
                      {rev.productName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                    "{rev.reviewText}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MODAL / DIALOG CHECKOUT & ORDER */}
      {activeProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Prosedur Checkout</span>
                <h3 className="font-display font-semibold text-lg text-white">
                  {checkoutStep === "details" ? "Detail Produk Digital" : checkoutStep === "checkout_form" ? "Detail Checkout" : "Penyelesaian Pembayaran"}
                </h3>
              </div>
              <button
                id="btn_close_checkout_modal"
                onClick={() => setActiveProduct(null)}
                className="p-1 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              
              {/* Step Title Indicator */}
              <div className="flex border-b border-slate-800 pb-4 text-xs font-semibold uppercase text-slate-500 font-mono tracking-wider justify-around">
                <span className={checkoutStep === "details" ? "text-white pb-4 border-b-2 border-white -mb-4.5" : "text-emerald-500"}>1. Detail</span>
                <span className={checkoutStep === "checkout_form" ? "text-white pb-4 border-b-2 border-white -mb-4.5" : checkoutStep === "upload_proof" ? "text-emerald-500" : ""}>2. Formulir</span>
                <span className={checkoutStep === "upload_proof" ? "text-white pb-4 border-b-2 border-white -mb-4.5" : ""}>3. Pembayaran</span>
              </div>

              {/* STAGE 1: DETAILS */}
              {checkoutStep === "details" && (
                <div className="space-y-4">
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950">
                    <img
                      src={activeProduct.imageUrl}
                      alt={activeProduct.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <h3 className="font-display font-bold text-white text-lg">
                    {activeProduct.name}
                  </h3>

                  <p className="text-slate-400 text-sm whitespace-pre-wrap leading-relaxed">
                    {activeProduct.description}
                  </p>

                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between font-mono">
                    <span className="text-slate-500 text-xs uppercase font-sans">Harga</span>
                    <span className="text-white font-bold text-base">
                      Rp {activeProduct.price.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <button
                    id="btn_go_to_checkout_form"
                    onClick={() => setCheckoutStep("checkout_form")}
                    className="w-full py-3 bg-white text-slate-950 hover:bg-slate-200 transition font-bold rounded-xl text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Lanjutkan ke Formulir
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STAGE 2: CHECKOUT FORM (Email, Phone, Payment Method) */}
              {checkoutStep === "checkout_form" && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-400 leading-relaxed flex items-start gap-2.5">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-emerald-400 font-semibold block mb-0.5">Pendistribusian Otomatis Aman</span>
                      Akun digital akan langsung disuplai otomatis dari sistem kami ke email dan halaman pelacakan Anda secara real-time setelah disetujui.
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs uppercase text-slate-400 font-semibold font-display">Alamat Email Pembeli</label>
                    <input
                      type="email"
                      id="buyer_email_input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pembeli@gmail.com"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs uppercase text-slate-400 font-semibold font-display">Nomor WhatsApp / HP</label>
                    <input
                      type="tel"
                      id="buyer_phone_input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0857XXXXXXXX"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition"
                    />
                  </div>

                  {userHasPin && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 animate-pulse-subtle">
                      <label className="text-[10px] uppercase text-indigo-400 font-bold font-mono tracking-wider flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-400" />
                        PIN Keamanan Terdeteksi (6 Digit)
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        id="buyer_pin_input"
                        value={checkoutPin}
                        onChange={(e) => setCheckoutPin(e.target.value.replace(/\D/g, ""))}
                        placeholder="Masukkan 6 angka PIN keamanan akun"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-indigo-500/40 text-white rounded-xl text-center font-mono text-lg tracking-widest focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                      />
                      <p className="text-[10px] text-slate-400 text-center">
                        Email ini dilindungi PIN. Tolong masukkan PIN keamanan untuk memproses pembelian.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs uppercase text-slate-400 font-semibold font-display block">Pilih Metode Pembayaran</label>
                    {availableMethods.length === 0 ? (
                      <div className="p-3 bg-yellow-500/10 text-yellow-500 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Admin belum mengatur metode pembayaran aktif.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {availableMethods.map((m) => (
                          <div
                            key={m.id}
                            id={`method_option_${m.id}`}
                            onClick={() => setSelectedMethod(m)}
                            className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition ${
                              selectedMethod?.id === m.id
                                ? "bg-white text-slate-950 border-white font-semibold shadow-lg"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-mono tracking-wider block opacity-70 mb-1">{m.type}</span>
                            <span className="font-semibold">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      id="btn_back_to_details"
                      onClick={() => setCheckoutStep("details")}
                      className="flex-1 py-3 text-slate-400 border border-slate-800 hover:text-white font-bold rounded-xl text-center text-sm cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      id="btn_submit_initiate_order"
                      onClick={handleInitiateOrder}
                      disabled={submittingProof || availableMethods.length === 0}
                      className="flex-1 py-3 bg-white text-slate-950 hover:bg-slate-200 transition font-bold rounded-xl text-center text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submittingProof ? "Memproses..." : "Buat Pesanan"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STAGE 3: UPLOAD PROOF PAYMENT */}
              {checkoutStep === "upload_proof" && createdOrder && selectedMethod && (
                <div className="space-y-4">
                  {createdOrder.status === "completed" ? (
                    <div className="space-y-4 text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
                        <Check className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h4 className="font-display font-extrabold text-white text-base tracking-tight">Pembelian Instan Berhasil!</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Pembayaran Rp {createdOrder.price.toLocaleString("id-ID")} dipotong otomatis dari Saldo Akun Anda. Kredensial akun premium telah didistribusikan langsung:
                      </p>

                      <div className="p-3.5 bg-gradient-to-br from-green-950/40 to-emerald-950/10 border border-green-500/25 rounded-xl space-y-2 text-left">
                        <span className="text-[9px] font-bold text-green-400 flex items-center gap-1 font-mono uppercase tracking-widest">
                          🔐 KREDENSIAL AKUN PREMIUM ANDA
                        </span>
                        <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap select-all py-1.5 select-all break-all bg-slate-950 p-2.5 rounded border border-slate-900 leading-relaxed font-semibold">
                          {createdOrder.accountDelivered}
                        </pre>
                      </div>

                      <button
                        onClick={() => {
                          // Dispatch sync user profile to update balance header immediately
                          window.dispatchEvent(new Event("sync_user_profile"));
                          
                          // Call onOrderCreated to transition tab automatically
                          onOrderCreated(createdOrder.id);
                          
                          // Clean up States to close modal & reset forms
                          setActiveProduct(null);
                          setCheckoutStep("details");
                          setCreatedOrder(null);
                          setProofFile(null);
                          setProofBase64("");
                          setNominalInput("");
                          setSelectedMethod(null);
                          setFormError("");
                          setOrderError("");
                        }}
                        className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-200 transition font-bold rounded-xl text-center text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Selesai & Selesai Belanja
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 font-mono text-xs md:text-sm">
                    <div className="flex justify-between text-slate-500 font-sans uppercase text-[10px] border-b border-slate-900 pb-2">
                      <span>SALIN DETAIL TRANSFER</span>
                      <span className="text-white text-[11px] font-semibold">{createdOrder.id}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Kanal Pembayaran</span>
                      <span className="text-white text-right">{selectedMethod.name}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Nomor Rekening / HP</span>
                      <span className="text-green-400 font-bold tracking-wider select-all text-right">{selectedMethod.accountNo}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Penerima / Pemilik</span>
                      <span className="text-white text-right font-semibold">{selectedMethod.accountName}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500 font-semibold">JUMLAH TRANSFER PAS</span>
                      <span className="text-green-400 font-bold text-sm tracking-wider text-right">
                        Rp {createdOrder.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* QRIS Image display if selection is qris */}
                  {selectedMethod.type === "qris" && selectedMethod.qrCodeUrl && (
                    <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl text-center space-y-2 flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">SCAN QRIS UNTUK LUNAS</span>
                      <div className="bg-white p-2 rounded-lg inline-block">
                        <img 
                          src={selectedMethod.qrCodeUrl} 
                          alt="QRIS Dream Store" 
                          referrerPolicy="no-referrer"
                          className="w-40 h-40 object-contain"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        *Dukung QRIS m-banking & e-wallet apapun (GOPAY, OVO, ShopeePay, DANA, BCA dll)
                      </p>
                    </div>
                  )}

                  {formError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg">
                      {formError}
                    </div>
                  )}

                  {/* nominal confirmation */}
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-slate-400 font-semibold font-display">Tulis Nominal yang Ditransfer (Harus Sesuai)</label>
                    <input
                      type="number"
                      id="transfer_amount_input"
                      value={nominalInput}
                      onChange={(e) => setNominalInput(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 text-white font-mono rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-white transition"
                    />
                  </div>

                  {/* Image input selector */}
                  <div className="space-y-1">
                    <label className="text-xs uppercase text-slate-400 font-semibold font-display">Pilih / Unggah Bukti Transfer</label>
                    
                    <div className="border border-dashed border-slate-800 bg-slate-950 hover:bg-slate-900/60 transition p-6 rounded-xl text-center cursor-pointer relative">
                      <input
                        type="file"
                        id="proof_upload_input"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <span className="text-xs text-slate-400 font-medium block">
                        {proofFile ? proofFile.name : "Klik atau seret struk bukti transfer di sini"}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1">Maksimal 8 MB (Format: JPG, PNG, WEBP)</span>
                    </div>

                    {proofBase64 && (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-500 block uppercase mb-1 font-bold">Pratinjau Struk Anda:</span>
                        <div className="max-h-28 overflow-hidden rounded-lg border border-slate-800">
                          <img 
                            src={proofBase64} 
                            alt="Bukti Struk Pembeli"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    id="btn_submit_payment_proof"
                    onClick={handleSubmitProof}
                    disabled={submittingProof || !proofBase64}
                    className="w-full py-3.5 bg-white text-slate-950 hover:bg-slate-200 transition font-bold rounded-xl text-center text-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingProof ? "Mengunggah Bukti..." : "Kirim Bukti & Lacak Pengiriman"}
                    <Check className="w-5 h-5" />
                  </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

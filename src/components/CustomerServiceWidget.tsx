import React, { useState, useRef, useEffect } from "react";
import { X, Send, Headphones, Bot, Sparkles, Phone, Mail, ArrowRight, MessageSquare, Check, HelpCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "cs";
  text: string;
  createdAt?: string; // standard server ISO timestamp
  time?: string; // legacy manual formatted string
}

interface CustomerServiceWidgetProps {
  userEmail?: string;
}

export function CustomerServiceWidget({ userEmail }: CustomerServiceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    let id = localStorage.getItem("dream_store_cs_session_id");
    if (!id) {
      id = "cs_sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("dream_store_cs_session_id", id);
    }
    return id;
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested questions / FAQs
  const quickFaqs = [
    {
      q: "Bagaimana cara melakukan Top-Up Saldo?",
      a: "Untuk melakukan Top-Up Saldo:\n1. Klik tombol '+ Top-Up' di Wallet Header bagian atas.\n2. Masukkan nominal isi saldo (Min. Rp 5.000).\n3. Pilih rekening transfer tujuan dan transfer sesuai nominal.\n4. Unggah foto struk bukti bayar Anda.\n5. Permintaan akan langsung diverifikasi admin secara manual dalam 5-10 menit, saldo akan masuk ke akun Anda!"
    },
    {
      q: "Pesanan saya tertunda / Pending",
      a: "Pemrosesan pesanan manual biasanya memakan waktu 3-10 menit. Jika Anda membayar secara konvensional, harap unggah struk di tab 'History Pembelian'. \nTips: Jika Anda ingin akun instan terkirim 1 DETIK, silakan gunakan fitur saldo Dream Wallet saat checkout produk!"
    },
    {
      q: "Detail akun tidak bisa login / Salah",
      a: "Jika kredensial akun premium tidak bisa login:\n1. Pastikan menyalin data username & password secara persis tanpa spasi berlebih.\n2. Perhatikan huruf besar/kecil (case sensitive).\n3. Beberapa akun memerlukan VPN atau region tertentu sesuai deskripsi produk.\nJika masih berkendala, silakan klik tombol WhatsApp CS di bawah untuk dibantu garansi ganti baru oleh Admin."
    },
    {
      q: "Hubungi Whatsapp Admin Resmi",
      a: "Anda bisa menghubungi WhatsApp Admin Official kami langsung di nomor +62 812-3090-9209 atau langsung klik tautan berikut: https://wa.me/6281230909209?text=Halo%20Admin%20DreamStore,%20saya%20membutuhkan%252520bantuan."
    }
  ];

  // Helper to fetch chat history from server
  const fetchHistory = async (sessId: string) => {
    try {
      const res = await fetch(`/api/cs/history?sessionId=${sessId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error("Gagal menjangkau server CS:", e);
    }
  };

  // Poll for messages in real-time if drawer is open
  useEffect(() => {
    fetchHistory(sessionId);

    if (!isOpen) return;

    // Start 3s polling loop
    const interval = setInterval(() => {
      fetchHistory(sessionId);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, sessionId]);

  // Auto scroll to bottom of chat list
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setInputText("");

    try {
      const res = await fetch("/api/cs/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: textToSend.trim(),
          userEmail: userEmail || undefined
        })
      });
      if (res.ok) {
        // Fetch fresh state instantly
        fetchHistory(sessionId);
      }
    } catch (e) {
      console.error("Error sending CS message:", e);
    }
  };

  const handleQuickQuestion = async (faq: typeof quickFaqs[0]) => {
    try {
      setIsTyping(true);
      // 1. Post user's FAQ request
      await fetch("/api/cs/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: faq.q,
          userEmail: userEmail || undefined
        })
      });

      // 2. Post bot's response answer
      await fetch("/api/cs/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: faq.a,
          userEmail: "bot@system.com"
        })
      });

      setIsTyping(false);
      fetchHistory(sessionId);
    } catch (e) {
      console.error(e);
      setIsTyping(false);
    }
  };

  // Fallback to local welcome greetings if server has zero messages yet
  const displayMessages = messages.length > 0 ? messages : [
    {
      id: "welcome",
      sender: "cs" as const,
      text: "Halo! Selamat datang di Layanan Pelanggan (CS) Dream Store Digital. Saya adalah Virtual Support Assistant Anda. Ada kendala atau pertanyaan yang bisa kami bantu hari ini?",
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          id="btn_cs_floating_trigger"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group p-4 rounded-full text-white cursor-pointer transition shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-105 active:scale-95 duration-350 focus:outline-none flex items-center justify-center border border-indigo-400/20 ${
            isOpen ? "bg-slate-950" : "bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-650"
          }`}
          title="Customer Service Dream Store"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-indigo-400" />
          ) : (
            <>
              {/* Online pulse point */}
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900 animate-ping"></span>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border border-slate-900"></span>
              <Headphones className="w-5 h-5 text-white animate-pulse" />
            </>
          )}

          {/* Quick Info text badge on Hover */}
          {!isOpen && (
            <div className="absolute right-16 scale-0 group-hover:scale-100 transition whitespace-nowrap bg-slate-950 text-[10px] text-slate-300 font-mono border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-xl font-bold uppercase tracking-wider">
              Layanan CS & Support <span className="text-green-400">&bull; Live</span>
            </div>
          )}
        </button>
      </div>

      {/* CS Chat panel Drawer */}
      {isOpen && (
        <div 
          id="cs_support_widget_panel"
          className="fixed bottom-24 right-4 md:right-6 w-[360px] max-w-[calc(100vw-2rem)] h-[510px] max-h-[80vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 animate-fade-in"
        >
          {/* Header section with brand context */}
          <div className="p-4 bg-gradient-to-r from-slate-950 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xs uppercase font-mono font-bold tracking-widest text-slate-200">
                  Customer Care
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse inline-block"></span>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold">CS Dream Store Online 24/7</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages & Chat Box list */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40 text-xs text-left"
          >
            {displayMessages.map((m) => (
              <div 
                key={m.id} 
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-line ${
                  m.sender === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-none font-medium" 
                    : "bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none"
                }`}>
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-600 font-mono mt-1">
                  {new Date(m.createdAt || new Date()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="p-3 bg-slate-900 border border-slate-850 text-slate-500 rounded-2xl rounded-tl-none font-mono text-[10px] italic flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                  CS sedang membalas...
                </div>
              </div>
            )}
          </div>

          {/* Quick FAQ Suggestion Options container */}
          <div className="border-t border-slate-800 bg-slate-950 p-2.5 space-y-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block px-1.5 mb-1.5">
              Pilihan Pintasan FAQ Cepat:
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 px-0.5 scrollbar-thin select-none">
              {quickFaqs.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(faq)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[10px] whitespace-nowrap cursor-pointer transition flex items-center gap-1 shrink-0 font-medium"
                >
                  <HelpCircle className="w-3 h-3 text-indigo-400" />
                  {faq.q.length > 25 ? faq.q.substring(0, 25) + "..." : faq.q}
                </button>
              ))}
            </div>
          </div>

          {/* Message input trigger form */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tulis pesan atau kendala Anda di sini..."
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
              className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition shadow-md shrink-0 flex items-center justify-center"
              title="Kirim Pesan"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* WhatsApp Direct contact footer bridge */}
          <div className="bg-slate-950 text-[10px] text-slate-500 py-2 border-t border-slate-850/55 flex justify-center items-center gap-2">
            <span>Butuh tim CS Manusia?</span>
            <a 
              href="https://wa.me/6281230909209?text=Halo%20Admin%20Dream%20Store,%20saya%20butuh%20bantuan%20mengenai%20pesanan%20saya"
              target="_blank" 
              referrerPolicy="no-referrer"
              rel="noopener noreferrer"
              className="text-emerald-400 font-bold hover:underline font-mono"
            >
              Hubungi WhatsApp Resmi &rarr;
            </a>
          </div>

        </div>
      )}
    </>
  );
}

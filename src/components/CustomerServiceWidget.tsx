import React, { useState, useRef, useEffect } from "react";
import { X, Send, Headphones, Bot, Sparkles, Phone, Mail, ArrowRight, MessageSquare, Check, HelpCircle } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "cs";
  text: string;
  time: string;
}

export function CustomerServiceWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "cs",
      text: "Halo! Selamat datang di Layanan Pelanggan (CS) Dream Store Digital. Saya adalah Virtual Support Assistant Anda. Ada kendala atau pertanyaan yang bisa kami bantu hari ini?",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested questions / FAQs
  const quickFaqs = [
    {
      q: "Bagaimana cara melakukan Top-Up Saldo?",
      a: "Untuk melakukan Top-Up Saldo:\n1. Klik tombol '+ Top-Up' di Wallet Header bagian atas.\n2. Masukkan nominal isi saldo (Min. Rp 10.000).\n3. Pilih rekening transfer tujuan dan transfer sesuai nominal.\n4. Unggah foto struk bukti bayar Anda.\n5. Permintaan akan langsung diverifikasi admin secara manual dalam 5-10 menit, saldo akan masuk ke akun Anda!"
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend: string, senderOverride: "user" | "cs" = "user") => {
    if (!textToSend.trim()) return;

    const newMsg: Message = {
      id: Math.random().toString(),
      sender: senderOverride,
      text: textToSend,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);

    if (senderOverride === "user") {
      setInputText("");
      triggerBotResponse(textToSend);
    }
  };

  const triggerBotResponse = (userQuery: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const query = userQuery.toLowerCase();
      let responseText = "";

      if (query.includes("topup") || query.includes("top up") || query.includes("saldo") || query.includes("isi")) {
        responseText = "Untuk pertanyaan seputar isi Saldo Wallet: Silakan pastikan Anda transfer dengan nominal yang tepat ke rekening tujuan admin yang aktif, lalu upload bukti transfer di halaman Profil > Top-Up Saldo. Saldo diproses manual max 10 menit.";
      } else if (query.includes("gagal") || query.includes("salah") || query.includes("akun") || query.includes("kredensial") || query.includes("login")) {
        responseText = "Kendala akun gagal login mendapatkan jaminan garansi 100%! Harap hubungi WhatsApp Admin official di nomor +62 812-3090-9209 dengan mengirimkan ID Pesanan (ORD-XXXXXX) serta bukti screenshot kegagalan login untuk penukaran akun instan.";
      } else if (query.includes("admin") || query.includes("wa") || query.includes("whatsapp") || query.includes("nomor") || query.includes("hubung") || query.includes("cs")) {
        responseText = "Layanan CS Manusia kami aktif 24 jam di WhatsApp Resmi: +62 812-3090-9209. Klik saja opsi FAQ WhatsApp di atas untuk langsung menghubungkan browser Anda.";
      } else if (query.includes("halo") || query.includes("permisi") || query.includes("siang") || query.includes("pagi") || query.includes("sore") || query.includes("malam")) {
        responseText = "Halo! Senang bisa menyapa Anda kembali. Ada kendala spesifik yang bisa saya bantu atau barangkali ingin menanyakan perihal produk?";
      } else {
        responseText = "Terima kasih atas pesannya! Sebagai Asisten Virtual, saya menyarankan Anda untuk klik opsi pintas FAQ di atas, atau klik tombol WhatsApp CS Resmi kami untuk mengobrol langsung dengan Admin operasional kami yang sedang bersiap membantu Anda 24/7.";
      }

      const botMsg: Message = {
        id: Math.random().toString(),
        sender: "cs",
        text: responseText,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  const handleQuickQuestion = (faq: typeof quickFaqs[0]) => {
    // 1. Log the user choice inside the chat list
    handleSendMessage(faq.q, "user");

    // 2. Play typing effect then answer
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: "cs",
        text: faq.a,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  };

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
            {messages.map((m) => (
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
                <span className="text-[9px] text-slate-600 font-mono mt-1">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="p-3 bg-slate-900 border border-slate-850 text-slate-500 rounded-2xl rounded-tl-none font-mono text-[10px] italic flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 animate-spin" />
                  CS sedang mengetik...
                </div>
              </div>
            )}
          </div>

          {/* Quick FAQ Suggestion Options container */}
          <div className="border-t border-slate-855 bg-slate-950 p-2.5 space-y-1">
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

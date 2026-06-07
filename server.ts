import express from "express";
import path from "path";
import fs from "fs";
import { createHash } from "crypto";
import { createServer as createViteServer } from "vite";
import { DBState, Product, ProductAccount, Order, PaymentMethod, ActivityLog, BlacklistItem, Notification } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure upload directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOAD_DIR));

// Simple in-memory server session store
// Map token to username
const tokens = new Map<string, string>();
const userTokens = new Map<string, { id: string; email: string }>();

const DB_PATH = path.join(process.cwd(), "db_store.json");

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const DEFAULT_ADMIN_HASH = hashPassword("denzzoffc1288"); // e56a81ef230a1bf8c18bd24d26b9cc8c67c00dbfdd68c347b74f378a514d3b80

// Initialize Database with dummy data and schema
function readDB(): DBState {
  if (!fs.existsSync(DB_PATH)) {
    const initialState: DBState = {
      admin: [
        {
          id: "adm_1",
          username: "denzz1212",
          passwordHash: DEFAULT_ADMIN_HASH,
        }
      ],
      users: [],
      products: [],
      productAccounts: [],
      orders: [],
      paymentMethods: [
        { id: "pay_qris", type: "qris", name: "QRIS All Payment", accountName: "DREAM STORE DIGITAL", accountNo: "NOMOR_QRIS_ANDA", status: "inactive" },
        { id: "pay_dana", type: "ewallet", name: "DANA", accountName: "DREAM STORE ADMIN", accountNo: "08XXXXXXXXXX", status: "inactive" },
        { id: "pay_bca", type: "bank", name: "BCA (Bank Central Asia)", accountName: "DREAM STORE DIGITAL", accountNo: "XXXXXXXX", status: "inactive" },
        { id: "pay_gopay", type: "ewallet", name: "GOPAY", accountName: "DREAM STORE GOPAY", accountNo: "08XXXXXXXXXX", status: "inactive" }
      ],
      activityLogs: [
        { id: "log_1", action: "SYSTEM_INIT", details: "Sistem Dream Store berhasil diinisialisasi pertama kali secara bersih.", timestamp: new Date().toISOString() }
      ],
      blacklist: [],
      notifications: [
        { id: "ntf_1", targetRole: "admin", title: "Sistem Aktif", message: "Toko Digital Dream Store siap melayani pesanan otomatis.", isRead: false, createdAt: new Date().toISOString() }
      ],
      banner: {
        text: "Selamat Datang di Dream Store! Nikmati kemudahan bertransaksi produk premium instan & otomatis 24 Jam.",
        isActive: true,
        bgColor: "bg-slate-900 border-b border-indigo-500/30",
        textColor: "text-white"
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialState, null, 2));
    return initialState;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let modified = false;
  if (!db.banner) {
    db.banner = {
      text: "Selamat Datang di Dream Store! Nikmati kemudahan bertransaksi produk premium instan & otomatis 24 Jam.",
      isActive: true,
      bgColor: "bg-slate-900 border-b border-indigo-500/30",
      textColor: "text-white"
    };
    modified = true;
  }
  // Ensure lists are defined
  if (!db.products) { db.products = []; modified = true; }
  if (!db.productAccounts) { db.productAccounts = []; modified = true; }
  if (!db.orders) { db.orders = []; modified = true; }
  if (!db.users) { db.users = []; modified = true; }
  if (!db.blacklist) { db.blacklist = []; modified = true; }
  if (!db.activityLogs) { db.activityLogs = []; modified = true; }
  if (!db.notifications) { db.notifications = []; modified = true; }
  if (!db.topups) { db.topups = []; modified = true; }
  
  if (modified) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
  return db;
}

function writeDB(data: DBState) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Add Activity Log Helper
function logsActivity(action: string, details: string) {
  const db = readDB();
  const newLog: ActivityLog = {
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.activityLogs.unshift(newLog);
  // Keep logs at a reasonable limit (e.g. 500)
  if (db.activityLogs.length > 500) {
    db.activityLogs = db.activityLogs.slice(0, 500);
  }
  writeDB(db);
}

// Security & Authentication Helper Middleware
function getAuthUser(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  return tokens.get(token) || null;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Sesi admin tidak valid atau kedaluwarsa. Silakan masuk kembali." });
  }
  next();
}

// ==========================================
// API ROUTES
// ==========================================

// Authenticate Admin
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi." });
  }

  const db = readDB();
  const adminAccount = db.admin.find((u) => u.username === username);
  if (!adminAccount) {
    return res.status(401).json({ error: "Username atau password salah." });
  }

  const inputHash = hashPassword(password);
  if (adminAccount.passwordHash !== inputHash) {
    return res.status(401).json({ error: "Username atau password salah." });
  }

  // Success login
  const token = `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  tokens.set(token, username);

  logsActivity("ADMIN_LOGIN", `Admin '${username}' berhasil masuk dari sistem.`);
  res.json({ token, username });
});

// Admin Me Verification
app.get("/api/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }
  res.json({ username: user });
});

// Admin Logout
app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    if (token) {
      const username = tokens.get(token);
      tokens.delete(token);
      if (username) {
        logsActivity("ADMIN_LOGOUT", `Admin '${username}' keluar dari sistem.`);
      }
    }
  }
  res.json({ success: true });
});

// ==========================================
// REGULAR USER SESSION UTILITIES
// ==========================================

function getUserAuth(req: express.Request): { id: string; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  if (!token) return null;
  return userTokens.get(token) || null;
}

// Register regular user
app.post("/api/user/register", (req, res) => {
  const { email, phone, name, password } = req.body;
  if (!email || !phone || !name || !password) {
    return res.status(400).json({ error: "Semua kolom pendaftaran wajib diisi." });
  }

  const db = readDB();
  const trimmedEmail = email.trim().toLowerCase();
  
  const existingUser = db.users.find(u => u.email.toLowerCase() === trimmedEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    email: trimmedEmail,
    phone: phone.trim(),
    name: name.trim(),
    passwordHash: hashPassword(password),
    balance: 100000, // Rp 100k starting welcome balance for testing
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  logsActivity("USER_REGISTER", `User baru mendaftar: ${trimmedEmail} (${name}). Diberikan bonus saldo awal Rp 100.000.`);
  res.json({ success: true, message: "Pendaftaran berhasil! Akun Anda siap dan dikreditkan bonus tes saldo Rp 100.000. Silakan masuk!" });
});

// Login regular user
app.post("/api/user/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const db = readDB();
  const trimmedEmail = email.trim().toLowerCase();
  const user = db.users.find(u => u.email.toLowerCase() === trimmedEmail);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Email atau password salah." });
  }

  if (user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Email atau password salah." });
  }

  // Success login
  const token = `usr_session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
  userTokens.set(token, { id: user.id, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      balance: user.balance || 0
    }
  });
});

// Logout regular user
app.post("/api/user/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    if (token) {
      userTokens.delete(token);
    }
  }
  res.json({ success: true });
});

// Get regular user profile
app.get("/api/user/me", (req, res) => {
  const userAuth = getUserAuth(req);
  if (!userAuth) {
    return res.status(401).json({ error: "Sesi telah kedaluwarsa." });
  }
  
  const db = readDB();
  const user = db.users.find(u => u.id === userAuth.id);
  if (!user) {
    return res.status(404).json({ error: "Akun tidak ditemukan." });
  }

  res.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    balance: user.balance || 0
  });
});

// Get regular user historic orders
app.get("/api/user/orders", (req, res) => {
  const userAuth = getUserAuth(req);
  if (!userAuth) {
    return res.status(401).json({ error: "Sesi tidak valid." });
  }

  const db = readDB();
  const userOrders = db.orders.filter(
    o => o.userEmail.toLowerCase() === userAuth.email.toLowerCase()
  );

  const sortedOrders = userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sortedOrders);
});

// GET CATALOG PUBLIC & ADMIN
app.get("/api/products", (req, res) => {
  const db = readDB();
  const result = db.products.map(p => {
    const stockAvailable = db.productAccounts.filter(acc => acc.productId === p.id && acc.status === "available").length;
    return { ...p, stock: stockAvailable };
  });
  res.json(result);
});

// ADD PRODUCT
app.post("/api/products", requireAdmin, (req, res) => {
  const { name, description, category, price, status, imageUrl } = req.body;
  if (!name || price === undefined || !category) {
    return res.status(400).json({ error: "Kolom Nama, Kategori, dan Harga wajib diisi." });
  }

  const db = readDB();
  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    name,
    description: description || "",
    category,
    price: Number(price),
    status: status || "active",
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    createdAt: new Date().toISOString(),
  };

  db.products.push(newProduct);
  writeDB(db);

  logsActivity("PRODUCT_ADD", `Admin menambahkan produk baru: ${name}`);
  res.json({ success: true, product: newProduct });
});

// EDIT PRODUCT
app.put("/api/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, category, price, status, imageUrl } = req.body;

  const db = readDB();
  const prodIndex = db.products.findIndex(p => p.id === id);
  if (prodIndex === -1) {
    return res.status(404).json({ error: "Produk tidak ditemukan." });
  }

  const updatedProduct = {
    ...db.products[prodIndex],
    name: name !== undefined ? name : db.products[prodIndex].name,
    description: description !== undefined ? description : db.products[prodIndex].description,
    category: category !== undefined ? category : db.products[prodIndex].category,
    price: price !== undefined ? Number(price) : db.products[prodIndex].price,
    status: status !== undefined ? status : db.products[prodIndex].status,
    imageUrl: imageUrl !== undefined ? imageUrl : db.products[prodIndex].imageUrl,
  };

  db.products[prodIndex] = updatedProduct;
  writeDB(db);

  logsActivity("PRODUCT_EDIT", `Admin memperbarui detail produk: ${updatedProduct.name}`);
  res.json({ success: true, product: updatedProduct });
});

// DELETE PRODUCT
app.delete("/api/products/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();

  const prod = db.products.find(p => p.id === id);
  if (!prod) {
    return res.status(404).json({ error: "Produk tidak ditemukan." });
  }

  db.products = db.products.filter(p => p.id !== id);
  // Optional cascade: delete available accounts
  db.productAccounts = db.productAccounts.filter(acc => acc.productId !== id);
  writeDB(db);

  logsActivity("PRODUCT_DELETE", `Admin menghapus produk ID '${id}' (Nama: ${prod.name})`);
  res.json({ success: true });
});

// GET DIGITAL ACCOUNTS FOR A SPECIFIC PRODUCT (Admin Only)
app.get("/api/products/:productId/accounts", requireAdmin, (req, res) => {
  const { productId } = req.params;
  const db = readDB();
  const accounts = db.productAccounts.filter(acc => acc.productId === productId);
  res.json(accounts);
});

// BULK INGEST ACCOUNTS FOR A PRODUCT
app.post("/api/products/:productId/accounts", requireAdmin, (req, res) => {
  const { productId } = req.params;
  const { rawText } = req.body; // Expect multi-line plain text list of credentials

  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ error: "Data akun kosong atau tidak valid." });
  }

  const db = readDB();
  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Produk tidak ditemukan." });
  }

  // Split lines
  const lines = rawText.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line.length > 0);
  const inserted: ProductAccount[] = [];

  lines.forEach((line: string) => {
    const acc: ProductAccount = {
      id: `acc_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      productId,
      accountData: line,
      status: "available",
      createdAt: new Date().toISOString()
    };
    db.productAccounts.push(acc);
    inserted.push(acc);
  });

  writeDB(db);

  logsActivity("ACCOUNTS_BULK_ADD", `Admin mengunggah secara massal sejumlah ${inserted.length} akun untuk produk: ${product.name}`);
  res.json({ success: true, count: inserted.length });
});

// DELETE INDIVIDUAL ACCOUNT STOCK ITEM
app.delete("/api/accounts/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const acc = db.productAccounts.find(a => a.id === id);
  if (!acc) return res.status(404).json({ error: "Akun digital tidak ditemukan." });

  db.productAccounts = db.productAccounts.filter(a => a.id !== id);
  writeDB(db);

  logsActivity("ACCOUNT_DELETE", `Admin menghapus item persediaan akun ID: ${id}`);
  res.json({ success: true });
});

// PUBLIC: SUBMIT / CREATE NEW ORDER (PENDING AWAITING PAYMENT STATE)
app.post("/api/orders", (req, res) => {
  const { email, phone, productId, paymentMethodId } = req.body;

  if (!email || !phone || !productId || !paymentMethodId) {
    return res.status(400).json({ error: "Semua kolom wajib diisi (Email, No HP, Produk, Metode Pembayaran)." });
  }

  const db = readDB();

  // 1. Blacklist Check
  const blacklisted = db.blacklist.find(b => b.email.toLowerCase() === email.toLowerCase());
  if (blacklisted) {
    return res.status(403).json({ error: `Maaf, email Anda (${email}) telah diblokir dari transaksi Dream Store. Alasan: ${blacklisted.reason}` });
  }

  // 2. Verified Active Product
  const product = db.products.find(p => p.id === productId && p.status === "active");
  if (!product) {
    return res.status(400).json({ error: "Produk tidak aktif atau tidak ditemukan." });
  }

  // 3. Stock Check
  const stockAvailable = db.productAccounts.filter(acc => acc.productId === productId && acc.status === "available").length;
  if (stockAvailable <= 0) {
    return res.status(400).json({ error: "Stok produk ini sedang habis. Silakan hubungi admin atau kembali beberapa saat lagi." });
  }

  // 4. Method Verification
  let method;
  let isUsingSaldo = false;
  if (paymentMethodId === "pay_saldo") {
    isUsingSaldo = true;
    method = { id: "pay_saldo", name: "Saldo Akun (Dream Wallet)" };
  } else {
    method = db.paymentMethods.find(m => m.id === paymentMethodId && m.status === "active");
  }

  if (!method) {
    return res.status(400).json({ error: "Metode pembayaran tidak aktif atau tidak valid." });
  }

  // Save/Find user info
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      createdAt: new Date().toISOString(),
      balance: 0
    };
    db.users.push(user);
  }

  // Handle instant checkout using Saldo Akun
  if (isUsingSaldo) {
    const currentBalance = user.balance || 0;
    if (currentBalance < product.price) {
      return res.status(400).json({ error: `Saldo Anda tidak mencukupi untuk melakukan transaksi instan ini. Sisa Saldo: Rp ${currentBalance.toLocaleString("id-ID")}` });
    }

    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    let deliveredCredentials = "";
    const availableAccIndex = db.productAccounts.findIndex(acc => acc.productId === productId && acc.status === "available");
    if (availableAccIndex === -1) {
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      deliveredCredentials = `KUNCI AKSES UTAMA (AUTO-GENERATED INSTANT)\n=====================================\nProduk: ${product.name}\nStatus: Aktif, Lisensi Resmi\nEmail/User: ${email}\nSandi/Token: DS-WALLET-${randomId}\nMasa Aktif: 1 Bulan\nTanggal Rilis: ${new Date().toLocaleDateString("id-ID")}\n=====================================\nCatatan: Stok utama kosong di etalase, kode ini rilis otomatis dari dana tabungan saldo akun Anda.`;
      
      logsActivity("STOCK_FALLBACK", `Pembelian saldo merilis kode otomatis untuk pesanan ${orderId} karena stok habis.`);
    } else {
      const selectedAcc = db.productAccounts[availableAccIndex];
      selectedAcc.status = "sold";
      selectedAcc.soldToOrderId = orderId;
      selectedAcc.soldAt = new Date().toISOString();
      deliveredCredentials = selectedAcc.accountData;
    }

    // Deduct
    user.balance = currentBalance - product.price;

    const newOrder: Order = {
      id: orderId,
      userEmail: email,
      userPhone: phone,
      productId,
      productName: product.name,
      price: product.price,
      status: "completed",
      paymentMethodId: "pay_saldo",
      paymentMethodName: "Saldo Akun (Dream Wallet)",
      paymentAmount: product.price,
      accountDelivered: deliveredCredentials,
      remarks: "Pembelian instan sukses dipotong dari Saldo Akun.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.push(newOrder);

    // Notify Admin
    db.notifications.push({
      id: `ntf_${Date.now()}`,
      targetRole: "admin",
      title: "Pembelian via Saldo Sukses",
      message: `User (${email}) berhasil membeli ${product.name} seharga Rp ${product.price.toLocaleString("id-ID")} secara otomatis memakai Saldo Akun. ID: ${orderId}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    writeDB(db);
    res.json({ success: true, order: newOrder });
    return;
  }

  // Generate Unique Order ID e.g ORD-554129
  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  const newOrder: Order = {
    id: orderId,
    userEmail: email,
    userPhone: phone,
    productId,
    productName: product.name,
    price: product.price,
    status: "awaiting_payment", // Waiting for payment proof submission
    paymentMethodId,
    paymentMethodName: method.name,
    paymentAmount: product.price,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.orders.push(newOrder);

  // Trigger Notification to Admin
  db.notifications.push({
    id: `ntf_${Date.now()}`,
    targetRole: "admin",
    title: "Pesanan Baru Masuk",
    message: `Seseorang (${email}) memulai pesanan baru untuk ${product.name}. ID: ${orderId}. Menunggu pembayaran.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  writeDB(db);

  res.json({ success: true, order: newOrder });
});

// PUBLIC & ADMIN: GET ORDER BY ID (REAL-TIME STATUS & ACCOUNT RETRIEVAL)
app.get("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." });
  }
  res.json(order);
});

// PUBLIC & ADMIN: USER ORDERS HISTORY BY EMAIL Lookup
app.get("/api/user-orders", (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.json([]);
  }
  const db = readDB();
  const results = db.orders.filter(o => o.userEmail.toLowerCase() === (email as string).toLowerCase());
  // Sort descending by creation date
  results.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(results);
});

// PUBLIC: UPLOAD PAYMENT PROOF & FINALIZE FOR CONFIRMATION
app.post("/api/orders/:id/upload", (req, res) => {
  const { id } = req.params;
  const { fileName, base64, paymentAmount } = req.body;

  if (!base64 || !fileName || paymentAmount === undefined) {
    return res.status(400).json({ error: "Data gambar bukti transfer dan nominal pembayaran harus dikirimkan." });
  }

  const db = readDB();
  const ordIndex = db.orders.findIndex(o => o.id === id);
  if (ordIndex === -1) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." });
  }

  const order = db.orders[ordIndex];

  // Store uploaded image file path
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  const ext = path.extname(fileName).toLowerCase();

  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    return res.status(400).json({ error: "Format gambar tidak didukung. Gunakan PNG, JPG, atau WEBP." });
  }

  const safeName = `proof_${id}_${Date.now()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  
  fs.writeFileSync(filePath, buffer);
  const fileUrl = `/uploads/${safeName}`;

  // Update order status
  order.status = "waiting_confirmation";
  order.paymentProofUrl = fileUrl;
  order.paymentAmount = Number(paymentAmount);
  order.updatedAt = new Date().toISOString();

  // Create notifications for admin
  db.notifications.push({
    id: `ntf_${Date.now()}`,
    targetRole: "admin",
    title: "Bukti Pembayaran Diunggah",
    message: `Pembeli dengan email ${order.userEmail} mengunggah bukti transfer sebesar Rp ${Number(paymentAmount).toLocaleString("id-ID")} untuk pesanan ${order.id}.`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  writeDB(db);

  res.json({ success: true, order });
});

// ADMIN ONLY: LIST ALL ORDERS
app.get("/api/admin/orders", requireAdmin, (req, res) => {
  const db = readDB();
  // Sort by date desc
  const sorted = [...db.orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});

// ADMIN ONLY: CHANGE STATUS / DECLINE / APPROVE ORDER WITH AUTO DISTRIBUTION
app.put("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Parameter status dibutuhkan." });
  }

  const db = readDB();
  const ordIndex = db.orders.findIndex(o => o.id === id);
  if (ordIndex === -1) {
    return res.status(404).json({ error: "Pesanan tidak ditemukan." });
  }

  const order = db.orders[ordIndex];
  const oldStatus = order.status;

  // Process approval flow
  if (status === "completed" && oldStatus !== "completed") {
    // Find available account credentials
    let deliveredCredentials = "";
    const availableAccIndex = db.productAccounts.findIndex(acc => acc.productId === order.productId && acc.status === "available");
    if (availableAccIndex === -1) {
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      deliveredCredentials = `KUNCI AKSES UTAMA (AUTO-GENERATED FALLBACK)\n=====================================\nProduk: ${order.productName}\nStatus: Aktif, Lisensi Resmi\nEmail/User: ${order.userEmail}\nSandi/Token: DS-PREMIUM-${randomId}\nMasa Aktif: 1 Bulan\nTanggal Rilis: ${new Date().toLocaleDateString("id-ID")}\n=====================================\nCatatan: Stok utama kosong di database, kode ini dirilis secara otomatis oleh sistem atas persetujuan Admin toko.`;
      
      logsActivity("STOCK_FALLBACK", `Sistem merilis kode darurat otomatis untuk pesanan ${order.id} karena stok produk habis.`);
    } else {
      const selectedAcc = db.productAccounts[availableAccIndex];
      selectedAcc.status = "sold";
      selectedAcc.soldToOrderId = order.id;
      selectedAcc.soldAt = new Date().toISOString();
      deliveredCredentials = selectedAcc.accountData;
    }

    // Deliver account
    order.accountDelivered = deliveredCredentials;
    order.status = "completed";
    order.remarks = remarks || "Pembayaran lunas, terverifikasi otomatis oleh Admin.";
    order.updatedAt = new Date().toISOString();

    // Create notifications for USER
    db.notifications.push({
      id: `ntf_${Date.now()}`,
      targetRole: "user",
      userEmail: order.userEmail,
      title: "Pesanan Sukses & Akun Dikirim!",
      message: `Pesanan ${order.id} telah disetujui. Silakan cek detail transaksi untuk menyalin akun Anda!`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    logsActivity("ORDER_APPROVE", `Admin menyetujui pesanan ID: ${order.id}. Sistem mendistribusikan akun digital secara otomatis.`);

  } else if (status === "failed") {
    order.status = "failed";
    order.remarks = remarks || "Pembayaran ditolak/batal karena bukti transfer tidak sesuai.";
    order.updatedAt = new Date().toISOString();

    // If order was somehow completed before, and we mark as failed, we should return the account stock to available
    if (oldStatus === "completed" && order.accountDelivered) {
      const dbAcc = db.productAccounts.find(acc => acc.soldToOrderId === order.id);
      if (dbAcc) {
        dbAcc.status = "available";
        dbAcc.soldToOrderId = undefined;
        dbAcc.soldAt = undefined;
      }
      order.accountDelivered = undefined;
    }

    // Refund wallet balance if paid via Dream Wallet
    if (oldStatus !== "failed" && oldStatus !== "refund" && order.paymentMethodId === "pay_saldo") {
      const targetUser = db.users.find(u => u.email.toLowerCase() === order.userEmail.toLowerCase());
      if (targetUser) {
        targetUser.balance = (targetUser.balance || 0) + (order.paymentAmount || 0);
        logsActivity("SYSTEM_REFUND_CREDIT", `Sistem mengembalikan saldo Rp ${(order.paymentAmount || 0).toLocaleString("id-ID")} ke akun ${targetUser.email} karena pesanan wallet ${order.id} dibatalkan.`);
      }
    }

    // Create User notification
    db.notifications.push({
      id: `ntf_${Date.now()}`,
      targetRole: "user",
      userEmail: order.userEmail,
      title: "Pembayaran Ditolak",
      message: `Mohon maaf, bukti pembayaran untuk pesanan ${order.id} ditolak admin. Alasan: ${order.remarks}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    logsActivity("ORDER_REJECT", `Admin menolak pembayaran pesanan ID: ${order.id}. Alasan: ${order.remarks}`);

  } else if (status === "refund") {
    order.status = "refund";
    order.remarks = remarks || "Dana dikembalikan sepenuhnya.";
    order.updatedAt = new Date().toISOString();

    if (oldStatus === "completed") {
      const dbAcc = db.productAccounts.find(acc => acc.soldToOrderId === order.id);
      if (dbAcc) {
        dbAcc.status = "available";
        dbAcc.soldToOrderId = undefined;
        dbAcc.soldAt = undefined;
      }
      order.accountDelivered = undefined;
    }

    // Return the amount back to user's wallet balance
    if (oldStatus !== "refund") {
      const targetUser = db.users.find(u => u.email.toLowerCase() === order.userEmail.toLowerCase());
      if (targetUser) {
        targetUser.balance = (targetUser.balance || 0) + (order.paymentAmount || 0);
        logsActivity("SYSTEM_REFUND_CREDIT", `Sistem melakukan refund dana sebesar Rp ${(order.paymentAmount || 0).toLocaleString("id-ID")} ke saldo akun ${targetUser.email} untuk pesanan ${order.id}.`);
      }
    }

    db.notifications.push({
      id: `ntf_${Date.now()}`,
      targetRole: "user",
      userEmail: order.userEmail,
      title: "Pesanan Direfund",
      message: `Pesanan ${order.id} status berubah menjadi Refund (Pengembalian dana selesai).`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    logsActivity("ORDER_REFUND", `Admin memproses Refund dana untuk pesanan ID: ${order.id}.`);

  } else {
    // Other generic status change (processing, pending, awaiting_payment)
    order.status = status;
    if (remarks) order.remarks = remarks;
    order.updatedAt = new Date().toISOString();

    logsActivity("ORDER_STATUS_CHANGE", `Admin mengubah status pesanan ID ${order.id} ke ${status}.`);
  }

  writeDB(db);
  res.json({ success: true, order });
});

// ADMIN ONLY: DASHBOARD STATISTICS COUNTERS
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  const db = readDB();

  const totalProducts = db.products.length;
  const totalOrders = db.orders.length;
  const totalRevenue = db.orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.price, 0);

  const totalAccountsAvailable = db.productAccounts.filter(a => a.status === "available").length;
  const totalAccountsSold = db.productAccounts.filter(a => a.status === "sold").length;

  const stats = {
    totalProducts,
    totalOrders,
    totalRevenue,
    totalAccountsAvailable,
    totalAccountsSold,
    recentOrders: db.orders.slice(-5).reverse(),
    recentLogs: db.activityLogs.slice(0, 5)
  };

  res.json(stats);
});

// ADMIN ONLY: PAYMENT METHODS MANAGER API
app.get("/api/admin/payment-methods", requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.paymentMethods);
});

app.get("/api/payment-methods", (req, res) => {
  const db = readDB();
  // Return only active payment methods for buyers
  const active = db.paymentMethods.filter(m => m.status === "active");
  res.json(active);
});

app.post("/api/admin/payment-methods", requireAdmin, (req, res) => {
  const { type, name, accountName, accountNo, qrCodeUrl, status } = req.body;
  if (!type || !name || !accountName || !accountNo) {
    return res.status(400).json({ error: "Kolom e.g. Tipe, Nama Channel, Nama Rekening/Pemilik, dan Nomor Rekening/HP wajib diisi." });
  }

  const db = readDB();
  const newMethod: PaymentMethod = {
    id: `pay_${Date.now()}`,
    type,
    name,
    accountName,
    accountNo,
    qrCodeUrl: qrCodeUrl || undefined,
    status: status || "active"
  };

  db.paymentMethods.push(newMethod);
  writeDB(db);

  logsActivity("PAYMENT_METHOD_ADD", `Admin menambahkan metode pembayaran baru: ${name} (${type})`);
  res.json({ success: true, method: newMethod });
});

app.put("/api/admin/payment-methods/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { type, name, accountName, accountNo, qrCodeUrl, status } = req.body;

  const db = readDB();
  const index = db.paymentMethods.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: "Metode pembayaran tidak ditemukan." });

  const updated = {
    ...db.paymentMethods[index],
    type: type !== undefined ? type : db.paymentMethods[index].type,
    name: name !== undefined ? name : db.paymentMethods[index].name,
    accountName: accountName !== undefined ? accountName : db.paymentMethods[index].accountName,
    accountNo: accountNo !== undefined ? accountNo : db.paymentMethods[index].accountNo,
    qrCodeUrl: qrCodeUrl !== undefined ? qrCodeUrl : db.paymentMethods[index].qrCodeUrl,
    status: status !== undefined ? status : db.paymentMethods[index].status,
  };

  db.paymentMethods[index] = updated;
  writeDB(db);

  logsActivity("PAYMENT_METHOD_EDIT", `Admin mengedit metode pembayaran: ${updated.name}`);
  res.json({ success: true, method: updated });
});

app.delete("/api/admin/payment-methods/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const method = db.paymentMethods.find(m => m.id === id);
  if (!method) return res.status(404).json({ error: "Metode pembayaran tidak ditemukan." });

  // Safety: don't allow deletion if it is the only one
  if (db.paymentMethods.length <= 1) {
    return res.status(400).json({ error: "Gagal menghapus! Setidaknya harus ada satu metode pembayaran aktif pada sistem." });
  }

  db.paymentMethods = db.paymentMethods.filter(m => m.id !== id);
  writeDB(db);

  logsActivity("PAYMENT_METHOD_DELETE", `Admin menghapus metode pembayaran: ${method.name}`);
  res.json({ success: true });
});

// ADMIN ONLY: BLACKLIST SYSTEM API
app.get("/api/admin/blacklist", requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.blacklist);
});

app.post("/api/admin/blacklist", requireAdmin, (req, res) => {
  const { email, reason } = req.body;
  if (!email || !reason) {
    return res.status(400).json({ error: "Alamat email pembeli dan alasan wajib dicantumkan." });
  }

  const db = readDB();
  const cleanedEmail = email.trim().toLowerCase();

  const exists = db.blacklist.find(b => b.email.toLowerCase() === cleanedEmail);
  if (exists) {
    return res.status(400).json({ error: "Email pembeli tersebut sudah ada di daftar hitam." });
  }

  const item: BlacklistItem = {
    id: `bl_${Date.now()}`,
    email: cleanedEmail,
    reason,
    createdAt: new Date().toISOString()
  };

  db.blacklist.push(item);
  writeDB(db);

  logsActivity("BLACKLIST_ADD", `Admin memblokir email pembeli: ${cleanedEmail}. Alasan: ${reason}`);
  res.json({ success: true, blacklist: item });
});

app.delete("/api/admin/blacklist/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const item = db.blacklist.find(b => b.id === id);
  if (!item) return res.status(404).json({ error: "Daftar hitam tidak ditemukan." });

  db.blacklist = db.blacklist.filter(b => b.id !== id);
  writeDB(db);

  logsActivity("BLACKLIST_REMOVE", `Admin mencabut blokir email pembeli: ${item.email}`);
  res.json({ success: true });
});

// ADMIN ONLY: SYSTEM LOG HISTORY
app.get("/api/admin/logs", requireAdmin, (req, res) => {
  const db = readDB();
  res.json(db.activityLogs);
});

// SYSTEM NOTIFICATIONS MANAGEMENT
app.get("/api/admin/notifications", requireAdmin, (req, res) => {
  const db = readDB();
  const adminNotifs = db.notifications.filter(n => n.targetRole === "admin");
  // Sort desc by date
  adminNotifs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(adminNotifs);
});

app.post("/api/admin/notifications/read-all", requireAdmin, (req, res) => {
  const db = readDB();
  db.notifications.forEach(n => {
    if (n.targetRole === "admin") n.isRead = true;
  });
  writeDB(db);
  res.json({ success: true });
});

// CLIENT LOOKUP NOTIFICATIONS
app.get("/api/user-notifications", (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);
  const db = readDB();
  const userNotifs = db.notifications.filter(n => n.targetRole === "user" && n.userEmail?.toLowerCase() === (email as string).toLowerCase());
  userNotifs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userNotifs);
});

// GET Banner Settings
app.get("/api/banner", (req, res) => {
  const db = readDB();
  res.json(db.banner || { text: "", isActive: false });
});

// UPDATE Banner (Admin Only)
app.put("/api/banner", requireAdmin, (req, res) => {
  const { text, isActive, bgColor, textColor, linkUrl } = req.body;
  if (text === undefined) {
    return res.status(400).json({ error: "Isi teks banner tidak boleh kosong." });
  }

  const db = readDB();
  db.banner = {
    text,
    isActive: !!isActive,
    bgColor: bgColor || "bg-slate-900 border-b border-indigo-500/30",
    textColor: textColor || "text-white",
    linkUrl: linkUrl || ""
  };
  writeDB(db);

  logsActivity("BANNER_UPDATE", `Admin memperbarui banner pengumuman: "${text}" [Status: ${isActive ? 'Aktif' : 'Nonaktif'}]`);
  res.json({ success: true, banner: db.banner });
});

// ADMIN TOOLS: BACKUP DATABASE GENERATING SQL SCRIPT DYNAMICALLY
app.get("/api/admin/backup-sql", requireAdmin, (req, res) => {
  const db = readDB();

  let sqlDump = `-- =======================================================\n`;
  sqlDump += `-- DREAM STORE DATABASE AUTO BACKUP GENERATOR\n`;
  sqlDump += `-- DICIPTAKAN PADA: ${new Date().toISOString()}\n`;
  sqlDump += `-- =======================================================\n\n`;

  sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`blacklist\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`notifications\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`activity_logs\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`product_accounts\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`orders\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`payment_methods\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`products\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`users\`;\n`;
  sqlDump += `DROP TABLE IF EXISTS \`admin\`;\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;

  // Write Table structures & seeds

  // 1. ADMIN
  sqlDump += `-- 1. TABLE admin\n`;
  sqlDump += `CREATE TABLE \`admin\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`username\` VARCHAR(50) NOT NULL UNIQUE,\n  \`password_hash\` VARCHAR(255) NOT NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.admin.forEach(a => {
    sqlDump += `INSERT INTO \`admin\` (\`username\`, \`password_hash\`) VALUES ('${a.username}', '${a.passwordHash}');\n`;
  });
  sqlDump += `\n`;

  // 2. USERS
  sqlDump += `-- 2. TABLE users\n`;
  sqlDump += `CREATE TABLE \`users\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n  \`email\` VARCHAR(100) NOT NULL UNIQUE,\n  \`phone\` VARCHAR(20) NOT NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.users.forEach(u => {
    sqlDump += `INSERT INTO \`users\` (\`email\`, \`phone\`, \`created_at\`) VALUES ('${u.email}', '${u.phone}', '${u.createdAt}');\n`;
  });
  sqlDump += `\n`;

  // 3. PRODUCTS
  sqlDump += `-- 3. TABLE products\n`;
  sqlDump += `CREATE TABLE \`products\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`name\` VARCHAR(100) NOT NULL,\n  \`description\` TEXT NOT NULL,\n  \`category\` VARCHAR(50) NOT NULL,\n  \`price\` DECIMAL(10,2) NOT NULL,\n  \`status\` ENUM('active', 'inactive') DEFAULT 'active',\n  \`image_url\` TEXT NOT NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.products.forEach(p => {
    const cleanDesc = p.description.replace(/'/g, "''");
    sqlDump += `INSERT INTO \`products\` (\`id\`, \`name\`, \`description\`, \`category\`, \`price\`, \`status\`, \`image_url\`, \`created_at\`) VALUES ('${p.id}', '${p.name}', '${cleanDesc}', '${p.category}', ${p.price}, '${p.status}', '${p.imageUrl}', '${p.createdAt}');\n`;
  });
  sqlDump += `\n`;

  // 4. PAYMENT METHODS
  sqlDump += `-- 4. TABLE payment_methods\n`;
  sqlDump += `CREATE TABLE \`payment_methods\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`type\` ENUM('qris', 'bank', 'ewallet') NOT NULL,\n  \`name\` VARCHAR(50) NOT NULL,\n  \`account_name\` VARCHAR(100) NOT NULL,\n  \`account_no\` VARCHAR(100) NOT NULL,\n  \`qr_code_url\` TEXT NULL,\n  \`status\` ENUM('active', 'inactive') DEFAULT 'active'\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.paymentMethods.forEach(m => {
    const qrText = m.qrCodeUrl ? `'${m.qrCodeUrl}'` : `NULL`;
    sqlDump += `INSERT INTO \`payment_methods\` (\`id\`, \`type\`, \`name\`, \`account_name\`, \`account_no\`, \`qr_code_url\`, \`status\`) VALUES ('${m.id}', '${m.type}', '${m.name}', '${m.accountName}', '${m.accountNo}', ${qrText}, '${m.status}');\n`;
  });
  sqlDump += `\n`;

  // 5. ORDERS
  sqlDump += `-- 5. TABLE orders\n`;
  sqlDump += `CREATE TABLE \`orders\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`user_email\` VARCHAR(100) NOT NULL,\n  \`user_phone\` VARCHAR(20) NOT NULL,\n  \`product_id\` VARCHAR(50) NOT NULL,\n  \`product_name\` VARCHAR(100) NOT NULL,\n  \`price\` DECIMAL(10,2) NOT NULL,\n  \`payment_method_id\` VARCHAR(50) NOT NULL,\n  \`payment_method_name\` VARCHAR(50) NOT NULL,\n  \`payment_amount\` DECIMAL(10,2) NOT NULL,\n  \`status\` ENUM('pending', 'awaiting_payment', 'waiting_confirmation', 'processing', 'completed', 'failed', 'refund') DEFAULT 'pending',\n  \`payment_proof_url\` TEXT NULL,\n  \`account_delivered\` TEXT NULL,\n  \`remarks\` TEXT NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.orders.forEach(o => {
    const pProof = o.paymentProofUrl ? `'${o.paymentProofUrl}'` : `NULL`;
    const accDeliv = o.accountDelivered ? `'${o.accountDelivered.replace(/'/g, "''")}'` : `NULL`;
    const remarksText = o.remarks ? `'${o.remarks.replace(/'/g, "''")}'` : `NULL`;
    sqlDump += `INSERT INTO \`orders\` (\`id\`, \`user_email\`, \`user_phone\`, \`product_id\`, \`product_name\`, \`price\`, \`payment_method_id\`, \`payment_method_name\`, \`payment_amount\`, \`status\`, \`payment_proof_url\`, \`account_delivered\`, \`remarks\`, \`created_at\`, \`updated_at\`) VALUES ('${o.id}', '${o.userEmail}', '${o.userPhone}', '${o.productId}', '${o.productName}', ${o.price}, '${o.paymentMethodId}', '${o.paymentMethodName}', ${o.paymentAmount}, '${o.status}', ${pProof}, ${accDeliv}, ${remarksText}, '${o.createdAt}', '${o.updatedAt}');\n`;
  });
  sqlDump += `\n`;

  // 6. PRODUCT ACCOUNTS
  sqlDump += `-- 6. TABLE product_accounts\n`;
  sqlDump += `CREATE TABLE \`product_accounts\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`product_id\` VARCHAR(50) NOT NULL,\n  \`account_data\` TEXT NOT NULL,\n  \`status\` ENUM('available', 'sold') DEFAULT 'available',\n  \`sold_to_order_id\` VARCHAR(50) NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n  \`sold_at\` TIMESTAMP NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.productAccounts.forEach(pa => {
    const soldTo = pa.soldToOrderId ? `'${pa.soldToOrderId}'` : `NULL`;
    const soldAtTime = pa.soldAt ? `'${pa.soldAt}'` : `NULL`;
    const cleanData = pa.accountData.replace(/'/g, "''");
    sqlDump += `INSERT INTO \`product_accounts\` (\`id\`, \`product_id\`, \`account_data\`, \`status\`, \`sold_to_order_id\`, \`created_at\`, \`sold_at\`) VALUES ('${pa.id}', '${pa.productId}', '${cleanData}', '${pa.status}', ${soldTo}, '${pa.createdAt}', ${soldAtTime});\n`;
  });
  sqlDump += `\n`;

  // 7. ACTIVITY LOGS
  sqlDump += `-- 7. TABLE activity_logs\n`;
  sqlDump += `CREATE TABLE \`activity_logs\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`action\` VARCHAR(100) NOT NULL,\n  \`details\` TEXT NOT NULL,\n  \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.activityLogs.forEach(l => {
    sqlDump += `INSERT INTO \`activity_logs\` (\`id\`, \`action\`, \`details\`, \`timestamp\`) VALUES ('${l.id}', '${l.action}', '${l.details.replace(/'/g, "''")}', '${l.timestamp}');\n`;
  });
  sqlDump += `\n`;

  // 8. BLACKLIST
  sqlDump += `-- 8. TABLE blacklist\n`;
  sqlDump += `CREATE TABLE \`blacklist\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`email\` VARCHAR(100) NOT NULL UNIQUE,\n  \`reason\` TEXT NOT NULL,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.blacklist.forEach(b => {
    sqlDump += `INSERT INTO \`blacklist\` (\`id\`, \`email\`, \`reason\`, \`created_at\`) VALUES ('${b.id}', '${b.email}', '${b.reason.replace(/'/g, "''")}', '${b.createdAt}');\n`;
  });
  sqlDump += `\n`;

  // 9. NOTIFICATIONS
  sqlDump += `-- 9. TABLE notifications\n`;
  sqlDump += `CREATE TABLE \`notifications\` (\n  \`id\` VARCHAR(50) PRIMARY KEY,\n  \`target_role\` ENUM('admin', 'user') NOT NULL,\n  \`user_email\` VARCHAR(100) NULL,\n  \`title\` VARCHAR(150) NOT NULL,\n  \`message\` TEXT NOT NULL,\n  \`is_read\` TINYINT(1) DEFAULT 0,\n  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  db.notifications.forEach(n => {
    const userEm = n.userEmail ? `'${n.userEmail}'` : `NULL`;
    sqlDump += `INSERT INTO \`notifications\` (\`id\`, \`target_role\`, \`user_email\`, \`title\`, \`message\`, \`is_read\`, \`created_at\`) VALUES ('${n.id}', '${n.targetRole}', ${userEm}, '${n.title.replace(/'/g, "''")}', '${n.message.replace(/'/g, "''")}', ${n.isRead ? 1 : 0}, '${n.createdAt}');\n`;
  });
  sqlDump += `\n`;

  logsActivity("DATABASE_BACKUP", `Admin mencadangkan database sistem ke file database dump SQL.`);

  res.setHeader("Content-Type", "application/sql");
  res.setHeader("Content-Disposition", "attachment; filename=dream_store_backup.sql");
  res.send(sqlDump);
});

// ==========================================
// USER & ADMIN TOPUP ENDPOINTS
// ==========================================

// 1. GET USER OWN TOPUPS
app.get("/api/user/topups", (req, res) => {
  const userAuth = getUserAuth(req);
  if (!userAuth) {
    return res.status(401).json({ error: "Sesi tidak valid." });
  }

  const db = readDB();
  if (!db.topups) db.topups = [];
  
  const userTopups = db.topups.filter(t => t.userId === userAuth.id);
  userTopups.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(userTopups);
});

// 2. CREATE USER TOPUP REQUEST
app.post("/api/user/topup", (req, res) => {
  const userAuth = getUserAuth(req);
  if (!userAuth) {
    return res.status(401).json({ error: "Sesi tidak valid." });
  }

  const { amount, paymentMethodId, fileName, base64 } = req.body;
  if (!amount || !paymentMethodId || !base64 || !fileName) {
    return res.status(400).json({ error: "Kolom jumlah nominal, metode transfer, dan bukti transfer wajib dikirimkan." });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === userAuth.id);
  if (!user) {
    return res.status(404).json({ error: "Akun pengguna tidak ditemukan." });
  }

  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  const ext = path.extname(fileName).toLowerCase();

  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    return res.status(400).json({ error: "Format gambar bukti tidak didukung. Harap gunakan file PNG, JPG, atau WEBP." });
  }

  const requestId = `topup_${Date.now()}`;
  const safeName = `topup_${requestId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);
  
  fs.writeFileSync(filePath, buffer);
  const fileUrl = `/uploads/${safeName}`;

  const method = db.paymentMethods.find(m => m.id === paymentMethodId) || { name: "Manual Transfer" };

  const newTopup: any = {
    id: requestId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name || user.email,
    amount: Number(amount),
    paymentMethodId,
    paymentMethodName: method.name,
    status: "pending", // pending | completed | failed
    paymentProofUrl: fileUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.topups) {
    db.topups = [];
  }
  db.topups.push(newTopup);

  // Send admin notification
  db.notifications.push({
    id: `ntf_${Date.now()}`,
    targetRole: "admin",
    title: "Permintaan Top Up Saldo",
    message: `Seseorang (${user.email}) mengajukan pengisian saldo Rp ${Number(amount).toLocaleString("id-ID")}. Silakan cek struk pembayaran!`,
    isRead: false,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, message: "Permintaan pengisian saldo berhasil terkirim. Saldo Anda akan bertambah segera setelah disatukan oleh admin." });
});

// 3. ADMIN ONLY: LIST ALL TOPUP REQUESTS
app.get("/api/admin/topups", requireAdmin, (req, res) => {
  const db = readDB();
  if (!db.topups) db.topups = [];
  const sorted = [...db.topups].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(sorted);
});

// 4. ADMIN ONLY: PROCESS / APPROVE / DECLINE TOPUP REQUEST
app.put("/api/admin/topups/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body; // completed | failed

  if (!status) {
    return res.status(400).json({ error: "Parameter status top up dibutuhkan." });
  }

  const db = readDB();
  if (!db.topups) db.topups = [];

  const index = db.topups.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Permintaan top up tidak ditemukan." });
  }

  const reqTopup = db.topups[index];
  if (reqTopup.status !== "pending") {
    return res.status(400).json({ error: "Permintaan top up ini sudah pernah diproses." });
  }

  if (status === "completed") {
    reqTopup.status = "completed";
    reqTopup.updatedAt = new Date().toISOString();

    // Credit user account
    const targetUser = db.users.find(u => u.id === reqTopup.userId);
    if (targetUser) {
      targetUser.balance = (targetUser.balance || 0) + reqTopup.amount;
    }

    // User notification
    db.notifications.push({
      id: `ntf_${Date.now()}`,
      targetRole: "user",
      userEmail: reqTopup.userEmail,
      title: "Top Up Saldo Berhasil!",
      message: `Top up saldo Anda senilai Rp ${reqTopup.amount.toLocaleString("id-ID")} telah disetujui. Saldo Anda sekarang Rp ${(targetUser?.balance || 0).toLocaleString("id-ID")}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    logsActivity("TOPUP_APPROVE", `Admin menyetujui top up saldo Rp ${reqTopup.amount.toLocaleString("id-ID")} untuk user: ${reqTopup.userEmail}.`);

  } else if (status === "failed") {
    reqTopup.status = "failed";
    reqTopup.updatedAt = new Date().toISOString();
    reqTopup.remarks = remarks || "Bukti transfer tidak sesuai.";

    // User notification
    db.notifications.push({
      id: `ntf_${Date.now()}`,
      targetRole: "user",
      userEmail: reqTopup.userEmail,
      title: "Top Up Saldo Ditolak",
      message: `Maaf, permintaan top up saldo Rp ${reqTopup.amount.toLocaleString("id-ID")} ditolak oleh Admin. Alasan: ${remarks || "Bukti transfer tidak valid."}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    logsActivity("TOPUP_REJECT", `Admin menolak top up saldo Rp ${reqTopup.amount.toLocaleString("id-ID")} untuk user: ${reqTopup.userEmail}. Alasan: ${remarks || "Bukti transfer tidak valid."}`);
  }

  writeDB(db);
  res.json({ success: true });
});

// Seed Database automatically on boot
readDB();

// INJECT VITE DEVELOPMENT OR PRODUCTION MIDDLEWARE
// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DREAM STORE] Server is running beautifully on http://localhost:${PORT}`);
  });
}

startServer();

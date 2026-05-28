const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const prisma = new PrismaClient();

app.use(cors());
// Base64 foto menu/outlet butuh limit lebih besar (default Express hanya ~100kb)
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Share socket.io instance ke express req context
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('disconnect', () => console.log('User disconnected'));
});

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Akses ditolak, token tidak ditemukan" });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_beefood_123', (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token tidak valid atau kadaluwarsa" });
    }
    req.user = user;
    next();
  });
};

// Menu kantin Binus (sesuai outlet di kampus)
const CANTEEN_MENU_CATALOG = {
  "Kantin Ayam Geprek SASC": [
    { name: "Ayam Geprek Level 1", price: 15000, estimatedTime: 8, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60" },
    { name: "Ayam Geprek Level 3", price: 17000, estimatedTime: 10, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60" },
    { name: "Ayam Geprek Level 5 + Sambal", price: 19000, estimatedTime: 10, image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60" },
    { name: "Nasi Ayam Geprek Spesial", price: 20000, estimatedTime: 12, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=500&auto=format&fit=crop&q=60" },
    { name: "Es Teh Manis", price: 5000, estimatedTime: 2, image: "https://images.unsplash.com/photo-1556675593-ef0e711486e7?w=500&auto=format&fit=crop&q=60" }
  ],
  "Kedai Kopi Kampus & Boba": [
    { name: "Kopi Susu Gula Aren", price: 18000, estimatedTime: 4, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60" },
    { name: "Ice Caramel Latte", price: 22000, estimatedTime: 5, image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60" },
    { name: "Brown Sugar Fresh Milk Boba", price: 21000, estimatedTime: 6, image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60" },
    { name: "Matcha Latte", price: 20000, estimatedTime: 5, image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60" },
    { name: "Thai Tea", price: 16000, estimatedTime: 4, image: "https://images.unsplash.com/photo-1556675593-ef0e711486e7?w=500&auto=format&fit=crop&q=60" }
  ],
  "Gorengan Renyah Kampus": [
    { name: "Tempe Mendoan (Isi 3)", price: 7000, estimatedTime: 5, image: "https://images.unsplash.com/photo-1624371414361-e6e2ed58c242?w=500&auto=format&fit=crop&q=60" },
    { name: "Tahu Isi (Isi 3)", price: 8000, estimatedTime: 5, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60" },
    { name: "Pisang Goreng Keju", price: 10000, estimatedTime: 6, image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60" },
    { name: "Cireng Bumbu Rujak", price: 6000, estimatedTime: 4, image: "https://images.unsplash.com/photo-1624371414361-e6e2ed58c242?w=500&auto=format&fit=crop&q=60" }
  ]
};

const syncCanteenMenus = async () => {
  try {
    const tenants = await prisma.tenant.findMany({ include: { menus: true } });
    for (const tenant of tenants) {
      const catalog = CANTEEN_MENU_CATALOG[tenant.name];
      if (!catalog) continue;

      const existingNames = new Set(tenant.menus.map((m) => m.name));
      const toAdd = catalog.filter((item) => !existingNames.has(item.name));

      if (toAdd.length > 0) {
        await prisma.menu.createMany({
          data: toAdd.map((item) => ({
            ...item,
            isAvailable: true,
            tenantId: tenant.id
          }))
        });
        console.log(`Menu kantin disinkronkan untuk: ${tenant.name} (+${toAdd.length})`);
      }
    }
  } catch (err) {
    console.error("Gagal sinkron menu kantin:", err);
  }
};

// --- DATABASE AUTO-SEEDING ---
const seedDatabase = async () => {
  try {
    const tenantCount = await prisma.tenant.count();
    if (tenantCount === 0) {
      console.log("Seeding database dengan data default...");
      
      const t1 = await prisma.tenant.create({
        data: {
          name: "Kantin Ayam Geprek SASC",
          location: "Kantin SASC Lt. 1",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
          menus: {
            create: CANTEEN_MENU_CATALOG["Kantin Ayam Geprek SASC"].map((m) => ({ ...m, isAvailable: true }))
          }
        }
      });

      const t2 = await prisma.tenant.create({
        data: {
          name: "Kedai Kopi Kampus & Boba",
          location: "Kantin SASC Lt. 2",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=60",
          menus: {
            create: CANTEEN_MENU_CATALOG["Kedai Kopi Kampus & Boba"].map((m) => ({ ...m, isAvailable: true }))
          }
        }
      });

      const t3 = await prisma.tenant.create({
        data: {
          name: "Gorengan Renyah Kampus",
          location: "Kantin Syahdan",
          isOpen: true,
          image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60",
          menus: {
            create: CANTEEN_MENU_CATALOG["Gorengan Renyah Kampus"].map((m) => ({ ...m, isAvailable: true }))
          }
        }
      });

      const salt = await bcrypt.genSalt(10);
      const studentPassword = await bcrypt.hash("password123", salt);
      const tenantPassword = await bcrypt.hash("password123", salt);

      // Student Default Account
      await prisma.user.create({
        data: {
          name: "Evan Wijaya",
          email: "student@binus.ac.id",
          password: studentPassword,
          role: "STUDENT",
          balance: 100000,
          phoneNumber: "081234567890",
          nim: "2501234567",
          avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Evan"
        }
      });

      // Tenant Default Account
      await prisma.user.create({
        data: {
          name: "SASC Geprek Owner",
          email: "tenant@binus.ac.id",
          password: tenantPassword,
          role: "TENANT",
          phoneNumber: "081298765432",
          tenantId: t1.id
        }
      });

      console.log("Database seeded sukses!");
    } else {
      await syncCanteenMenus();
    }
  } catch (err) {
    console.error("Gagal seeding database:", err);
  }
};

const initDatabase = async () => {
  try {
    await prisma.$connect();
    console.log("Database terhubung (SQLite via Prisma)");
    await seedDatabase();
  } catch (err) {
    console.error("Gagal menghubungkan database:", err);
    process.exit(1);
  }
};
initDatabase();

// --- API ROUTES ---

// 1. Auth: Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, phoneNumber, nim, tenantName, tenantLocation } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Kolom nama, email, password, dan role harus diisi" });
  }

  // Validasi email menggunakan regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Format email tidak valid" });
  }

  // Validasi minimal panjang password
  if (password.length < 6) {
    return res.status(400).json({ error: "Password minimal harus 6 karakter" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let createdUser;

    if (role === "STUDENT") {
      createdUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STUDENT",
          phoneNumber: phoneNumber || "",
          nim: nim || "",
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
        }
      });
    } else if (role === "TENANT") {
      if (!tenantName || !tenantLocation) {
        return res.status(400).json({ error: "Nama tenant dan lokasi harus diisi untuk Tenant" });
      }

      // Buat data tenant
      const newTenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          location: tenantLocation,
          isOpen: true,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"
        }
      });

      // Buat user linked ke tenant
      createdUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "TENANT",
          phoneNumber: phoneNumber || "",
          tenantId: newTenant.id
        }
      });
    } else {
      return res.status(400).json({ error: "Role tidak valid" });
    }

    const token = jwt.sign(
      { id: createdUser.id, role: createdUser.role },
      process.env.JWT_SECRET || 'secret_beefood_123',
      { expiresIn: '1d' }
    );

    res.status(201).json({ 
      message: "User berhasil dibuat", 
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        balance: createdUser.balance,
        phoneNumber: createdUser.phoneNumber,
        nim: createdUser.nim,
        avatar: createdUser.avatar,
        tenantId: createdUser.tenantId
      },
      token
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Gagal membuat akun" });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi" });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { tenant: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_beefood_123',
      { expiresIn: '1d' }
    );

    res.json({ 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        phoneNumber: user.phoneNumber,
        nim: user.nim,
        avatar: user.avatar,
        tenantId: user.tenantId,
        tenant: user.tenant
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: "Terjadi kesalahan pada login" });
  }
});

// 3. User Profile: Get Profile info
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { tenant: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      balance: user.balance,
      phoneNumber: user.phoneNumber,
      nim: user.nim,
      avatar: user.avatar,
      tenantId: user.tenantId,
      tenant: user.tenant
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil profil" });
  }
});

// 4. User Profile: Update profile info
app.put('/api/profile', authenticateToken, async (req, res) => {
  const { name, phoneNumber, nim, avatar, tenantName, tenantLocation, tenantIsOpen, tenantImage } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        phoneNumber: phoneNumber || null,
        nim: nim || null,
        avatar: avatar || null
      },
      include: { tenant: true }
    });

    // Jika user terhubung ke tenant dan field tenant di-update
    if (updatedUser.tenantId && (tenantName || tenantLocation || tenantIsOpen !== undefined || tenantImage !== undefined)) {
      const tenantData = {};
      if (tenantName) tenantData.name = tenantName;
      if (tenantLocation) tenantData.location = tenantLocation;
      if (tenantIsOpen !== undefined) tenantData.isOpen = !!tenantIsOpen;
      if (tenantImage !== undefined && tenantImage !== null && tenantImage !== "") {
        tenantData.image = tenantImage;
      }

      await prisma.tenant.update({
        where: { id: updatedUser.tenantId },
        data: tenantData
      });

      // Ambil kembali user dengan data tenant terupdate
      const refreshedUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { tenant: true }
      });

      return res.json({
        message: "Profil dan data tenant berhasil diperbarui",
        user: {
          id: refreshedUser.id,
          name: refreshedUser.name,
          email: refreshedUser.email,
          role: refreshedUser.role,
          balance: refreshedUser.balance,
          phoneNumber: refreshedUser.phoneNumber,
          nim: refreshedUser.nim,
          avatar: refreshedUser.avatar,
          tenantId: refreshedUser.tenantId,
          tenant: refreshedUser.tenant
        }
      });
    }

    res.json({
      message: "Profil berhasil diperbarui",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        balance: updatedUser.balance,
        phoneNumber: updatedUser.phoneNumber,
        nim: updatedUser.nim,
        avatar: updatedUser.avatar,
        tenantId: updatedUser.tenantId,
        tenant: updatedUser.tenant
      }
    });
  } catch (err) {
    console.error("Gagal memperbarui profil:", err);
    res.status(500).json({ error: "Gagal memperbarui profil" });
  }
});

// 5. Get Tenants (includes Menus & Reviews Rating calculations)
app.get('/api/tenants', async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        menus: true,
        orders: {
          include: {
            feedback: true
          }
        }
      }
    });

    const formattedTenants = tenants.map(t => {
      // Hitung rata-rata rating
      let rating = "0"; // Rating default jika belum ada ulasan
      let totalRating = 0;
      let reviewCount = 0;

      t.orders.forEach(order => {
        if (order.feedback) {
          totalRating += order.feedback.rating;
          reviewCount++;
        }
      });

      if (reviewCount > 0) {
        rating = (totalRating / reviewCount).toFixed(1);
      }

      return {
        id: t.id,
        name: t.name,
        location: t.location,
        isOpen: t.isOpen,
        image: t.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
        rating: rating,
        menus: t.menus,
        reviewCount: reviewCount
      };
    });

    res.json(formattedTenants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data tenant" });
  }
});

// 6. Get Menus Only
app.get('/api/menus', async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({ include: { tenant: true } });
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil menu" });
  }
});

// 7. Toggle Menu Availability (Stok)
app.patch('/api/menus/:id/toggle', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const menu = await prisma.menu.findUnique({ where: { id: parseInt(id) } });
    if (!menu) {
      return res.status(404).json({ error: "Menu tidak ditemukan" });
    }

    const updatedMenu = await prisma.menu.update({
      where: { id: parseInt(id) },
      data: { isAvailable: !menu.isAvailable }
    });

    res.json(updatedMenu);
  } catch (err) {
    res.status(500).json({ error: "Gagal memperbarui stok menu" });
  }
});

// 8. Add New Menu Item
app.post('/api/tenants/:tenantId/menus', authenticateToken, async (req, res) => {
  const tenantId = parseInt(req.params.tenantId);
  const { name, price, estimatedTime, image } = req.body;

  if (!name || price === undefined || price === null || !estimatedTime) {
    return res.status(400).json({ error: "Parameter menu tidak lengkap" });
  }

  const priceNum = parseFloat(price);
  const timeNum = parseInt(estimatedTime, 10);
  if (Number.isNaN(priceNum) || priceNum <= 0) {
    return res.status(400).json({ error: "Harga menu tidak valid" });
  }
  if (Number.isNaN(timeNum) || timeNum <= 0) {
    return res.status(400).json({ error: "Estimasi waktu masak tidak valid" });
  }

  try {
    const owner = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!owner?.tenantId) {
      return res.status(403).json({ error: "Akun tenant tidak terhubung ke outlet" });
    }
    if (owner.tenantId !== tenantId) {
      return res.status(403).json({ error: "Anda tidak boleh menambah menu untuk outlet lain" });
    }

    const newMenu = await prisma.menu.create({
      data: {
        name,
        price: priceNum,
        estimatedTime: timeNum,
        isAvailable: true,
        image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
        tenantId
      }
    });

    res.status(201).json(newMenu);
  } catch (err) {
    console.error("Gagal menambahkan menu:", err);
    res.status(500).json({ error: "Gagal menambahkan menu baru" });
  }
});

// 9. Create Pre-Order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const { tenantId, items, totalPrice, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!tenantId || !items || !totalPrice) {
    return res.status(400).json({ error: "Data pesanan tidak lengkap" });
  }

  const normalizedPaymentMethod = String(paymentMethod || "BEEPAY").toUpperCase().replace("QRISS", "QRIS");
  if (!["BEEPAY", "QRIS"].includes(normalizedPaymentMethod)) {
    return res.status(400).json({ error: "Metode pembayaran tidak valid" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });

      // Debit hanya untuk BeePay (saldo internal)
      if (normalizedPaymentMethod === "BEEPAY") {
        if (user.balance < totalPrice) {
          throw new Error("Saldo Digital Tidak Mencukupi");
        }

        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: totalPrice } }
        });

        await tx.walletTransaction.create({
          data: {
            userId,
            type: "BEEPAY_SPEND",
            method: "BEEPAY",
            amount: totalPrice,
            description: "Pengeluaran BeePay untuk pre-order"
          }
        });
      }

      // Buat Order
      return await tx.order.create({
        data: { 
          userId, 
          tenantId: parseInt(tenantId), 
          totalPrice, 
          items, 
          status: 'PENDING' 
        },
        include: {
          tenant: true,
          user: { select: { name: true, nim: true, phoneNumber: true } }
        }
      });
    });

    // Beritahu tenant ada order baru (status awal tetap PENDING)
    req.io.emit('newOrder', result);

    res.status(201).json({ message: "Pre-order berhasil ditempatkan", order: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 9b. Wallet: Top Up (QRIS) - menambah balance BeePay
app.post('/api/wallet/topup', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { amount, method } = req.body;

  const normalizedMethod = String(method || "QRIS").toUpperCase().replace("QRISS", "QRIS");
  const amountNum = Number(amount);

  if (!amountNum || amountNum <= 0) {
    return res.status(400).json({ error: "Jumlah top up tidak valid" });
  }
  if (!["QRIS"].includes(normalizedMethod)) {
    return res.status(400).json({ error: "Metode top up tidak valid" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amountNum } }
      });

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          type: "TOP_UP",
          method: "QRIS",
          amount: amountNum,
          description: "Top up BeePay via QRIS"
        }
      });

      return { updatedUser, transaction };
    });

    res.status(201).json({
      message: "Top up berhasil",
      balance: result.updatedUser.balance,
      transaction: result.transaction
    });
  } catch (err) {
    res.status(500).json({ error: "Gagal melakukan top up" });
  }
});

// 9c. Wallet: History transaksi balance (top up & pengeluaran BeePay)
app.get('/api/wallet/history', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const history = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil history wallet" });
  }
});

// 10. Update Status Order
app.patch('/api/orders/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // PENDING -> COOKING -> READY -> DONE
  
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        tenant: true,
        user: { select: { name: true, nim: true, phoneNumber: true } }
      }
    });

    req.io.emit('orderStatusUpdated', updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Gagal memperbarui status order" });
  }
});

// 11. Get Student/Mahasiswa Orders List
app.get('/api/orders/user', authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { 
        tenant: true,
        feedback: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil pesanan mahasiswa" });
  }
});

// 12. Get Tenant Orders List
app.get('/api/orders/tenant/:tenantId', authenticateToken, async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const orders = await prisma.order.findMany({
      where: { tenantId },
      include: { 
        user: { select: { id: true, name: true, nim: true, phoneNumber: true, avatar: true } },
        feedback: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil pesanan tenant" });
  }
});

// 13. Create Feedback for Completed Order
app.post('/api/orders/:id/feedback', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating harus berupa angka 1-5" });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: "Pesanan tidak ditemukan" });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: "Akses ditolak" });
    }

    if (order.status !== 'DONE') {
      return res.status(400).json({ error: "Pesanan belum selesai diambil" });
    }

    const existingFeedback = await prisma.feedback.findUnique({
      where: { orderId: parseInt(id) }
    });

    if (existingFeedback) {
      return res.status(400).json({ error: "Pesanan ini sudah diulas sebelumnya" });
    }

    const feedback = await prisma.feedback.create({
      data: {
        orderId: parseInt(id),
        rating: parseInt(rating),
        comment: comment || ""
      }
    });

    res.status(201).json({ message: "Ulasan berhasil dikirim", feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengirimkan ulasan" });
  }
});

// 14. Get Feedback for a specific Tenant
app.get('/api/tenants/:tenantId/feedback', async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId);
    const feedback = await prisma.feedback.findMany({
      where: {
        order: { tenantId }
      },
      include: {
        order: {
          include: {
            user: { select: { name: true, avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedFeedback = feedback.map(f => {
      const items = typeof f.order.items === "string" ? JSON.parse(f.order.items) : f.order.items;
      const orderSummary = Array.isArray(items)
        ? items.map((it) => `${it.name} x${it.qty}`).join(", ")
        : "";
      return {
        id: f.id,
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt,
        studentName: f.order.user.name,
        studentAvatar: f.order.user.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=default",
        orderSummary
      };
    });

    res.json(formattedFeedback);
  } catch (err) {
    res.status(500).json({ error: "Gagal mengambil ulasan" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend BeeFood running on port ${PORT}`));

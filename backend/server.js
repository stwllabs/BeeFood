const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Di production, batasi dengan URL frontend kamu
});

const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

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

// --- API ROUTES ---

// 1. Auth: Register User
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const user = await prisma.user.create({
      data: { name, email, password, role } // Catatan: Sebaiknya gunakan bcrypt untuk hash password
    });
    res.status(201).json({ message: "User berhasil dibuat", user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(400).json({ error: "Email sudah terdaftar" });
  }
});

// 2. Auth: Login Sederhana
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Kredensial salah" });
  }
  res.json({ id: user.id, name: user.name, role: user.role, balance: user.balance });
});

// 3. Get Menus & Tenants
app.get('/api/menus', async (req, res) => {
  const menus = await prisma.menu.findMany({ include: { tenant: true } });
  res.json(menus);
});

// 4. Create Pre-Order (FR: Transaksi Digital & Potong Saldo)
app.post('/api/orders', async (req, res) => {
  const { userId, tenantId, items, totalPrice } = req.body;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user.balance < totalPrice) throw new Error("Saldo Digital Tidak Mencukupi");

      // Potong Saldo
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: totalPrice } }
      });

      // Buat Order
      return await tx.order.create({
        data: { userId, tenantId, totalPrice, items, status: 'PENDING' }
      });
    });

    // Beritahu tenant ada orderan baru masuk secara real-time
    req.io.emit('newOrder', result);
    res.status(201).json({ message: "Pre-order berhasil ditempatkan", data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Update Status Order (FR: Manajemen Pengambilan & Tracking)
app.patch('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // PENDING -> COOKING -> READY -> DONE
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Emit event ke semua client (mahasiswa akan tahu status makanannya berubah)
    req.io.emit('orderStatusUpdated', updatedOrder);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: "Gagal memperbarui status" });
  }
});

// 6. Get User/Tenant Orders
app.get('/api/orders/user/:userId', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: parseInt(req.params.userId) },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend BeeFood running on port ${PORT}`));
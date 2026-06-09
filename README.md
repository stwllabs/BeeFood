# BeeFood

Aplikasi pre-order kantin kampus (Student + Tenant).

## Menjalankan (lokal)

### 1. Backend (Node.js + Prisma)

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

API: http://localhost:5000/api

### 2. Frontend (React)

```powershell
cd frontend
npm install
npm run dev
```

Buka URL yang ditampilkan Vite (biasanya http://localhost:5173).

## Deploy online (Railway + Vercel)

### Backend + database → Railway

1. Buka [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → pilih repo ini
2. Tambah **PostgreSQL** di project
3. Tambah service **backend** → Settings → **Root Directory**: `/backend`
4. Di service backend, set variabel:
   - `DATABASE_URL` → reference dari PostgreSQL
   - `JWT_SECRET` → string acak
   - `NODE_ENV` → `production`
5. **Settings → Networking → Generate Domain** pada service **backend** (bukan PostgreSQL)
6. Salin URL publik backend (mis. `https://beefood-backend.up.railway.app`)

> **Penting:** Jangan pakai URL PostgreSQL (`postgres-production-xxx.up.railway.app`) di frontend.
> Itu alamat database, bukan API. Frontend butuh URL service **backend Node.js** yang terpisah.

Cek backend aktif: buka `https://YOUR-BACKEND-URL/health` → harus tampil `{"ok":true,...}`

### Frontend → Vercel

1. Buka [vercel.com](https://vercel.com) → **Add New Project** → import repo ini
2. **Root Directory**: `frontend`
3. Tambah env var:
   - `VITE_SOCKET_URL` = URL Railway **backend** (tanpa `/api`)
4. **Redeploy** setelah mengubah env var

Aplikasi live di URL Vercel. API di URL Railway + `/api`.

## Akun demo

| Role | Email | Password |
|------|-------|----------|
| Mahasiswa | student@binus.ac.id | password123 |
| Tenant | tenant@binus.ac.id | password123 |

## Flow pesanan

1. Mahasiswa checkout → **Menunggu ACC Tenant** (`PENDING`)
2. Tenant klik **ACC Pesanan** → `COOKING`
3. Tenant **Set Siap Ambil** → `READY`
4. Mahasiswa **Selesai Pick Up** → `DONE`

## Stack

- Backend: Node.js + Express + Prisma + PostgreSQL
- Frontend: React + Vite + Tailwind CSS

# BeeFood

Aplikasi pre-order kantin kampus (Student + Tenant).

## Menjalankan

### 1. Backend (PHP Laravel-style API)

```powershell
cd backend-laravel
.\start.ps1
```

API: http://localhost:5000/api

Database diinisialisasi otomatis dari:
- `backend-laravel/database/schema.sql`
- `backend-laravel/database/seed.sql`

Reset database:

```powershell
cd backend-laravel
php artisan db:init
```

### 2. Frontend (React)

```powershell
cd frontend
npm install
npm run dev
```

Buka URL yang ditampilkan Vite (biasanya http://localhost:5173).

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

## Catatan migrasi

- Backend baru: `backend-laravel/` (PHP, struktur Laravel)
- Backend lama (Node.js + Prisma): `backend/` — tidak dipakai lagi secara default
